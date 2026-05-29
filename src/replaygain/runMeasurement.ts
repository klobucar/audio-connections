/** Browser wiring for ReplayGain measurement: turns the controller's injected
 *  hooks into real decode + worker + cache calls, and owns the shared worker
 *  pool. Not imported by tests — it references the worker asset and the wasm URL
 *  (new Worker / new URL), which only resolve under Vite. The orchestration it
 *  drives is unit-tested via controller.ts.
 *
 *  Two perf levers live here (both validated against real Apple previews):
 *   - A small WORKER POOL: a single worker serialized all measurement (~2.2s for
 *     16 tracks); a pool of N runs them ~Nx faster (~0.6s at N=4).
 *   - A global decode SEMAPHORE (size = pool): bounds peak in-flight PCM to
 *     POOL_SIZE x ~11MB regardless of how many callers fire, so the Phase-2
 *     prefetch and the post-commit apply can overlap without compounding memory.
 *  Measurements are memoized by blobUrl so those two passes share one decode. */

import { measureAndApply, type GainUpdate, type TrackRef } from './controller';
import { getCached, putCached, type CachedMeasurement } from './cache';
import { canDecode, decodeToChannels } from './decode';
import type { LoudnessResult, MeasureRequest, MeasureResponse } from './measure';
import { WasmLoudness } from './measureWasm';

// ── Profiling (opt-in via ?rgprofile) ───────────────────────────────────────
// Emits performance.measure() entries (prefixed "rg:") that show up in the
// DevTools Performance "Timings" lane and are queryable from the console:
//   performance.getEntriesByType('measure').filter(e => e.name.startsWith('rg:'))
// Off by default — zero cost in production. `?rgprofile&rgnowarmup` disables the
// warm-up so you can A/B the cold-start cost in a single session.
function hasFlag(name: string): boolean {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).has(name);
}
const PROFILE = hasFlag('rgprofile');
const WARMUP_DISABLED = hasFlag('rgnowarmup');
function profile(label: string, start: number): void {
  if (!PROFILE) return;
  try {
    performance.measure(`rg:${label}`, { start, end: performance.now() });
  } catch {
    /* User Timing L3 unavailable — ignore */
  }
}

/** Adaptive parallelism. Memory scales linearly at ~11MB of decoded PCM per
 *  concurrent track, so cap hard on low-RAM devices. */
function poolSize(): number {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const cores = nav?.hardwareConcurrency ?? 4;
  const mem = (nav as unknown as { deviceMemory?: number } | undefined)?.deviceMemory;
  let n = Math.min(Math.max(cores - 1, 1), 4);
  // Throttle on low-end devices. deviceMemory is the best signal but is
  // Chromium-only — undefined on Firefox/Safari (including mobile), the exact
  // browsers we most want to protect — so also treat a low core count as a
  // low-end signal. Otherwise those devices would get the full pool, each
  // worker holding ~11MB of decoded PCM.
  const lowMemory = typeof mem === 'number' && mem <= 4;
  const lowCores = cores <= 4;
  if (lowMemory || lowCores) n = Math.min(n, 2);
  return n;
}
const POOL_SIZE = poolSize();

interface PoolWorker {
  worker: Worker;
  /** Set once the worker errors at runtime; dead workers are skipped by
   *  round-robin and never handed out again. */
  dead: boolean;
}

let pool: PoolWorker[] | null = null;
let poolBroken = false;
let rr = 0;
let nextReqId = 1;
// id → resolver. Carries the owning PoolWorker so an 'error' event can fail
// that worker's in-flight request immediately instead of waiting for the
// 20s timeout.
const pending = new Map<number, { resolve: (r: LoudnessResult | null) => void; pw: PoolWorker }>();

function buildPool(): PoolWorker[] {
  return Array.from({ length: POOL_SIZE }, () => {
    const w = new Worker(new URL('./measure.worker.ts', import.meta.url), { type: 'module' });
    const pw: PoolWorker = { worker: w, dead: false };
    w.addEventListener('message', (e: MessageEvent<MeasureResponse>) => {
      pending.get(e.data.id)?.resolve(e.data.result);
    });
    // A worker that errors at runtime (trap, uncaught throw, message clone
    // failure) is marked dead so round-robin routes around it, and any request
    // it was mid-flight is failed now rather than hanging until the timeout.
    const killWorker = () => {
      pw.dead = true;
      for (const [, p] of pending) {
        if (p.pw === pw) p.resolve(null);
      }
    };
    w.addEventListener('error', killWorker);
    w.addEventListener('messageerror', killWorker);
    return pw;
  });
}

/** Build the pool once (lazily). Returns null if workers can't be constructed. */
function ensurePool(): PoolWorker[] | null {
  if (poolBroken) return null;
  if (!pool) {
    try {
      pool = buildPool();
    } catch {
      poolBroken = true;
      pool = null;
      return null;
    }
  }
  return pool;
}

/** Round-robin a live worker, skipping dead ones. Returns null if the pool
 *  can't be built or every worker is dead — caller falls back to main thread. */
function getPoolWorker(): PoolWorker | null {
  const p = ensurePool();
  if (!p) return null;
  for (let i = 0; i < p.length; i++) {
    const pw = p[rr++ % p.length]!;
    if (!pw.dead) return pw;
  }
  return null; // every worker dead → main-thread fallback
}

/** Pre-spawn the worker pool and pre-compile the wasm inside each worker, so the
 *  first real measurement doesn't pay worker-spawn + wasm-instantiate latency on
 *  its critical path. Call during the day load's network wait (Phase 1), before
 *  any blob lands. Idempotent, best-effort, and a no-op when the environment
 *  can't decode or when ?rgnowarmup is set (for A/B profiling).
 *
 *  Each worker is pinged with a 1-sample throwaway payload: the worker runs
 *  getWasm() (fetch + instantiateStreaming) on ANY message before inspecting the
 *  payload, so this forces compilation now. id 0 is never issued by
 *  measureViaWorker (nextReqId starts at 1), so the reply is ignored. */
let warmed = false;
export function warmUp(): void {
  if (warmed || WARMUP_DISABLED || !canDecode()) return;
  warmed = true;
  const t0 = performance.now();
  const p = ensurePool();
  if (!p) return;
  for (const pw of p) {
    if (pw.dead) continue;
    try {
      const ping: MeasureRequest = { id: 0, sampleRate: 48000, channels: [new Float32Array(1)] };
      pw.worker.postMessage(ping, [ping.channels[0]!.buffer]);
    } catch {
      /* best-effort */
    }
  }
  profile('warmup-dispatch', t0);
}

// Main-thread wasm, used only when module workers can't be constructed. Decode
// already runs on the main thread, so this just measures there too.
let mainWasm: Promise<WasmLoudness | null> | null = null;
function getMainWasm(): Promise<WasmLoudness | null> {
  if (!mainWasm) {
    mainWasm = WasmLoudness.fromResponse(
      fetch(new URL('./ebur128.wasm', import.meta.url)),
    ).catch(() => null);
  }
  return mainWasm;
}

const WORKER_TIMEOUT_MS = 20_000;

function measureViaWorker(
  pw: PoolWorker,
  channels: Float32Array[],
  sampleRate: number,
): Promise<LoudnessResult | null> {
  return new Promise((resolve) => {
    const id = nextReqId++;
    let settled = false;
    const finish = (r: LoudnessResult | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      pending.delete(id);
      resolve(r);
    };
    const timer = setTimeout(() => finish(null), WORKER_TIMEOUT_MS);
    pending.set(id, { resolve: finish, pw });
    try {
      const req: MeasureRequest = { id, sampleRate, channels };
      pw.worker.postMessage(req, channels.map((c) => c.buffer as ArrayBuffer));
    } catch {
      finish(null);
    }
  });
}

// Decode semaphore — bounds concurrent decoded-PCM in memory to POOL_SIZE ×
// ~11MB. The permit covers only the decode + transfer-to-worker, NOT the worker
// measurement: once the PCM is transferred (detached on the main thread) it no
// longer counts against our memory budget, so releasing here lets the next
// decode overlap the current measurement (decode is main-thread, measure is the
// worker). release() is idempotent per acquire via the caller's `released` flag.
let activeDecodes = 0;
const decodeQueue: (() => void)[] = [];
function acquire(): Promise<void> {
  return new Promise((resolve) => {
    if (activeDecodes < POOL_SIZE) {
      activeDecodes++;
      resolve();
    } else {
      decodeQueue.push(() => {
        activeDecodes++;
        resolve();
      });
    }
  });
}
function release(): void {
  activeDecodes--;
  decodeQueue.shift()?.();
}

// Memoize by blobUrl so the Phase-2 prefetch and the post-commit apply share a
// single decode+measure per track. Successful results stay cached for the
// session; failures are evicted so a later attempt can retry.
const inflight = new Map<string, Promise<CachedMeasurement | null>>();

async function measureBlob(blobUrl: string): Promise<CachedMeasurement | null> {
  const memo = inflight.get(blobUrl);
  if (memo) return memo;
  const p = (async (): Promise<CachedMeasurement | null> => {
    let released = false;
    const releaseOnce = () => {
      if (!released) {
        released = true;
        release();
      }
    };
    await acquire();
    try {
      const tDecode = performance.now();
      const decoded = await decodeToChannels(blobUrl);
      profile('decode', tDecode);
      if (!decoded) return null;
      const { channels, sampleRate } = decoded;
      const pw = getPoolWorker();
      let res: LoudnessResult | null;
      if (pw) {
        // Transfer the PCM to the worker (detached on this thread). The memory
        // is now the worker's, so free the decode permit before awaiting the
        // measurement — the next decode can run while this one measures.
        const tMeasure = performance.now();
        const measuring = measureViaWorker(pw, channels, sampleRate);
        releaseOnce();
        res = await measuring;
        profile('measure', tMeasure);
        if (!res) {
          // Worker failed/timed out and the transferred buffers are gone;
          // re-decode and measure on the main thread so the track still gets a
          // gain instead of silently falling back to unity.
          const reDecoded = await decodeToChannels(blobUrl);
          const wl = reDecoded ? await getMainWasm() : null;
          res = wl && reDecoded ? wl.measure(reDecoded.channels, reDecoded.sampleRate) : null;
        }
      } else {
        const wl = await getMainWasm();
        res = wl ? wl.measure(channels, sampleRate) : null;
      }
      return res ? { integratedLufs: res.integratedLufs, truePeakDbtp: res.truePeakDbtp } : null;
    } finally {
      releaseOnce();
    }
  })();
  inflight.set(blobUrl, p);
  void p.then(
    (r) => {
      if (!r) inflight.delete(blobUrl);
    },
    () => inflight.delete(blobUrl),
  );
  return p;
}

/** Kick a track's measurement as soon as its blob is prefetched, so the work
 *  overlaps the remaining day load instead of running as a post-commit tail.
 *  Writes the result to the IndexedDB cache (keyed by iTunes id) so the
 *  post-commit apply pass hits cache instead of decoding again. Fire-and-forget;
 *  bounded by the shared semaphore. */
export function prefetchMeasurement(itunesId: number, blobUrl: string): void {
  if (!canDecode()) return;
  void measureBlob(blobUrl)
    .then((m) => {
      if (m) putCached(itunesId, m);
    })
    .catch(() => {
      /* best-effort */
    });
}

export interface RunReplayGainOptions {
  /** True once a newer day load has superseded this one. */
  isStale: () => boolean;
  onGains: (gains: Map<number, GainUpdate>) => void;
  targetLufs?: number;
  concurrency?: number;
}

/** Fire-and-forget per-day measurement. Best-effort: any failure leaves tracks
 *  at unity gain; no-op when this environment can't decode audio. With the
 *  Phase-2 prefetch warming the cache, this mostly resolves from cache. */
export function runReplayGain(tracks: TrackRef[], opts: RunReplayGainOptions): void {
  if (!canDecode()) return;
  void measureAndApply(tracks, {
    loadCached: (itunesId) => getCached(itunesId),
    measureBlob,
    saveCached: (itunesId, m) => {
      void putCached(itunesId, m);
    },
    onGains: opts.onGains,
    isStale: opts.isStale,
    targetLufs: opts.targetLufs,
    concurrency: opts.concurrency ?? POOL_SIZE,
  }).catch(() => {
    /* best-effort */
  });
}
