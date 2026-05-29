/** Persistent cache of per-track loudness measurements, keyed by iTunes ID.
 *
 *  Stores the raw measurements (LUFS + true peak), NOT the final gain, so the
 *  target loudness can change without invalidating the cache — gain is derived
 *  at apply time. The key embeds ALGO_VERSION so bumping the measurement
 *  algorithm is a clean cache miss; stale-version records are pruned on open.
 *
 *  Every operation is best-effort: if IndexedDB is missing (e.g. Safari private
 *  mode), the quota is exhausted, or any request errors, reads return null and
 *  writes no-op, so the app simply re-measures in-memory rather than breaking.
 *  The iTunes ID lives only in the IndexedDB key — never rendered or logged — so
 *  it leaks no puzzle data.
 *
 *  `factory` is injectable purely so tests can supply fake-indexeddb. */

import { ALGO_VERSION } from './measure';

const DB_NAME = 'audio-connections-replaygain';
const STORE = 'loudness';
const DB_VERSION = 1;

export interface CachedMeasurement {
  integratedLufs: number;
  truePeakDbtp: number;
}

interface StoredRecord extends CachedMeasurement {
  key: string;
  itunesId: number;
  algoVersion: number;
  measuredAt: number;
}

function cacheKey(itunesId: number): string {
  return `${itunesId}:${ALGO_VERSION}`;
}

function resolveFactory(factory?: IDBFactory): IDBFactory | null {
  if (factory) return factory;
  const g = globalThis as unknown as { indexedDB?: IDBFactory };
  return g.indexedDB ?? null;
}

// Once a write fails with a quota error, stop hammering IndexedDB for the rest
// of the session — measurement still works via the in-memory memo, it just
// isn't persisted. Avoids re-aborting a doomed transaction on every track.
let writesDisabled = false;

// One memoized connection per factory, opened lazily and reused for all
// get/put calls instead of opening+closing per request (~32 opens per day
// load otherwise). Keyed by factory so injected test factories stay isolated.
const connections = new WeakMap<IDBFactory, Promise<IDBDatabase | null>>();

function openDb(factory: IDBFactory): Promise<IDBDatabase | null> {
  const existing = connections.get(factory);
  if (existing) return existing;
  const opening = new Promise<IDBDatabase | null>((resolve) => {
    let req: IDBOpenDBRequest;
    try {
      req = factory.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      // If the connection drops (tab evicted, etc.), forget it so the next call
      // reopens rather than reusing a dead handle.
      db.onclose = () => connections.delete(factory);
      // Prune stale-version records before first use so the first get/put sees a
      // clean store (and a deterministic state for tests). One scan per session.
      void pruneStaleVersions(db).then(() => resolve(db));
    };
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
  connections.set(factory, opening);
  return opening;
}

/** Delete records from prior ALGO_VERSIONs. The version is part of the key, so
 *  a bump is already a clean miss — but without pruning, old records accumulate
 *  forever and creep toward the quota. Best-effort; runs once per connection. */
function pruneStaleVersions(db: IDBDatabase): Promise<void> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) return;
        const rec = cursor.value as StoredRecord;
        if (rec.algoVersion !== ALGO_VERSION) cursor.delete();
        cursor.continue();
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function getCached(
  itunesId: number,
  factory?: IDBFactory,
): Promise<CachedMeasurement | null> {
  const f = resolveFactory(factory);
  if (!f) return null;
  try {
    const db = await openDb(f);
    if (!db) return null;
    return await new Promise<CachedMeasurement | null>((resolve) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(cacheKey(itunesId));
      req.onsuccess = () => {
        const rec = req.result as StoredRecord | undefined;
        resolve(rec ? { integratedLufs: rec.integratedLufs, truePeakDbtp: rec.truePeakDbtp } : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function putCached(
  itunesId: number,
  m: CachedMeasurement,
  factory?: IDBFactory,
): Promise<void> {
  if (writesDisabled) return;
  const f = resolveFactory(factory);
  if (!f) return;
  try {
    const db = await openDb(f);
    if (!db) return;
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      const record: StoredRecord = {
        key: cacheKey(itunesId),
        itunesId,
        integratedLufs: m.integratedLufs,
        truePeakDbtp: m.truePeakDbtp,
        algoVersion: ALGO_VERSION,
        measuredAt: Date.now(),
      };
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve();
      const fail = () => {
        // A QuotaExceededError aborts the tx; latch writes off so we don't
        // re-attempt (and re-abort) on every subsequent track this session.
        if (tx.error?.name === 'QuotaExceededError') writesDisabled = true;
        resolve();
      };
      tx.onerror = fail;
      tx.onabort = fail;
    });
  } catch {
    // best-effort: a failed write just means we re-measure next time
  }
}

/** Exposed for tests only. */
export const __test = {
  cacheKey,
  resetWritesDisabled: () => {
    writesDisabled = false;
  },
};
