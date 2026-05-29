/** Pure orchestration: for each track, resolve a measurement (cache → measure),
 *  derive the clip-safe gain, and emit it — bounded by a small concurrency
 *  limit and abortable via isStale(). All I/O is injected through `hooks`, so
 *  this is fully unit-testable; the browser wiring lives in runMeasurement.ts. */

import { computeGainDb, DEFAULT_TARGET_LUFS } from './gain';
import type { CachedMeasurement } from './cache';

export interface TrackRef {
  /** LoadedTrack.id — the grid position, used as the apply-gains key. */
  gridId: number;
  /** Stable iTunes id — the measurement cache key. */
  itunesId: number;
  /** Prefetched blob URL; tracks without one are skipped (left at unity gain). */
  blobUrl: string | undefined;
}

export interface GainUpdate {
  gainDb: number;
}

export interface MeasureHooks {
  loadCached(itunesId: number): Promise<CachedMeasurement | null>;
  measureBlob(blobUrl: string): Promise<CachedMeasurement | null>;
  saveCached(itunesId: number, m: CachedMeasurement): void;
  onGains(gains: Map<number, GainUpdate>): void;
  /** True once this work is superseded (day switched) — checked between awaits
   *  so a stale day's measurements never paint onto the new grid. */
  isStale(): boolean;
  targetLufs?: number;
  concurrency?: number;
}

async function runPool<T>(items: T[], n: number, work: (item: T) => Promise<void>): Promise<void> {
  let idx = 0;
  const runner = async (): Promise<void> => {
    while (idx < items.length) {
      const i = idx++;
      await work(items[i]!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, runner));
}

export async function measureAndApply(tracks: TrackRef[], hooks: MeasureHooks): Promise<void> {
  const target = hooks.targetLufs ?? DEFAULT_TARGET_LUFS;
  const concurrency = Math.max(1, hooks.concurrency ?? 2);
  const todo = tracks.filter((t): t is TrackRef & { blobUrl: string } => !!t.blobUrl);

  await runPool(todo, concurrency, async (t) => {
    if (hooks.isStale()) return;
    let m = await hooks.loadCached(t.itunesId);
    if (!m) {
      if (hooks.isStale()) return;
      m = await hooks.measureBlob(t.blobUrl);
      if (m) hooks.saveCached(t.itunesId, m);
    }
    if (!m || hooks.isStale()) return;
    const gainDb = computeGainDb(m.integratedLufs, m.truePeakDbtp, target);
    hooks.onGains(new Map([[t.gridId, { gainDb }]]));
  });
}
