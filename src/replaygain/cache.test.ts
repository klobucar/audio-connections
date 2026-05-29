import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { getCached, putCached, __test } from './cache';
import { ALGO_VERSION } from './measure';

let factory: IDBFactory;
beforeEach(() => {
  factory = new IDBFactory();
  __test.resetWritesDisabled();
});

describe('replaygain cache', () => {
  it('returns null for a miss', async () => {
    expect(await getCached(12345, factory)).toBeNull();
  });

  it('round-trips a measurement', async () => {
    await putCached(12345, { integratedLufs: -9.3, truePeakDbtp: -0.8 }, factory);
    expect(await getCached(12345, factory)).toEqual({ integratedLufs: -9.3, truePeakDbtp: -0.8 });
  });

  it('stores -Infinity (silence) faithfully', async () => {
    await putCached(7, { integratedLufs: -Infinity, truePeakDbtp: -Infinity }, factory);
    expect(await getCached(7, factory)).toEqual({ integratedLufs: -Infinity, truePeakDbtp: -Infinity });
  });

  it('keys by iTunes id + ALGO_VERSION', () => {
    expect(__test.cacheKey(42)).toBe(`42:${ALGO_VERSION}`);
  });

  it('reuses one connection across many calls', async () => {
    // Many ops on the same factory must not error (would throw if a stale/closed
    // handle were reused). Functional proxy for the connection-reuse change.
    for (let i = 0; i < 5; i++) {
      await putCached(i, { integratedLufs: -10 - i, truePeakDbtp: -1 }, factory);
    }
    for (let i = 0; i < 5; i++) {
      expect(await getCached(i, factory)).toEqual({ integratedLufs: -10 - i, truePeakDbtp: -1 });
    }
  });

  it('prunes records from older ALGO_VERSIONs on open', async () => {
    // Seed a stale-version record directly under a different key.
    const staleKey = `555:${ALGO_VERSION - 1}`;
    await new Promise<void>((resolve, reject) => {
      const req = factory.open('audio-connections-replaygain', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('loudness', { keyPath: 'key' });
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('loudness', 'readwrite');
        tx.objectStore('loudness').put({
          key: staleKey,
          itunesId: 555,
          integratedLufs: -5,
          truePeakDbtp: -1,
          algoVersion: ALGO_VERSION - 1,
          measuredAt: 0,
        });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });

    // Any cache op opens the DB and triggers the prune.
    await getCached(1, factory);

    // The stale record is gone.
    const survived = await new Promise<boolean>((resolve) => {
      const req = factory.open('audio-connections-replaygain', 1);
      req.onsuccess = () => {
        const db = req.result;
        const get = db.transaction('loudness', 'readonly').objectStore('loudness').get(staleKey);
        get.onsuccess = () => {
          db.close();
          resolve(get.result !== undefined);
        };
        get.onerror = () => {
          db.close();
          resolve(false);
        };
      };
      req.onerror = () => resolve(false);
    });
    expect(survived).toBe(false);
  });

  it('disables writes for the session after a quota-exceeded abort', async () => {
    // Minimal IDB stub. Mirrors the real lifecycle: req.result is populated
    // BEFORE onsuccess fires. The outcome is driven by which store method the
    // code calls on a transaction: pruneStaleVersions calls openCursor() (which
    // completes the tx), putCached calls put() (which aborts with a quota error).
    const stub = {
      open() {
        const db = {
          objectStoreNames: { contains: () => true },
          createObjectStore: () => ({}),
          onclose: null,
          transaction: () => {
            const tx: Record<string, unknown> = { error: null };
            tx.objectStore = () => ({
              openCursor: () => {
                const creq: Record<string, unknown> = { result: null };
                queueMicrotask(() => {
                  (creq.onsuccess as () => void)?.();
                  (tx.oncomplete as () => void)?.();
                });
                return creq;
              },
              put: () => {
                tx.error = new DOMException('quota', 'QuotaExceededError');
                queueMicrotask(() => (tx.onabort as () => void)?.());
              },
            });
            return tx;
          },
          close() {},
        };
        const req: Record<string, unknown> = { result: db };
        queueMicrotask(() => (req.onsuccess as () => void)?.());
        return req;
      },
    } as unknown as IDBFactory;

    await putCached(1, { integratedLufs: -10, truePeakDbtp: -1 }, stub);
    // Latch is module-global: a later write to a working factory is skipped.
    await putCached(2, { integratedLufs: -8, truePeakDbtp: -1 }, factory);
    expect(await getCached(2, factory)).toBeNull();
  });

  it('no-ops gracefully when IndexedDB is unavailable (no factory in Node)', async () => {
    expect(__test.cacheKey(1)).toBe(`1:${ALGO_VERSION}`);
    await expect(putCached(1, { integratedLufs: -10, truePeakDbtp: -1 })).resolves.toBeUndefined();
    expect(await getCached(1)).toBeNull();
  });
});
