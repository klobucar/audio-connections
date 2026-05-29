import { describe, it, expect, vi } from 'vitest';
import { measureAndApply, type MeasureHooks, type TrackRef, type GainUpdate } from './controller';
import { computeGainDb } from './gain';

function tracks(n: number): TrackRef[] {
  return Array.from({ length: n }, (_, i) => ({ gridId: i, itunesId: 1000 + i, blobUrl: `blob:${i}` }));
}

function baseHooks(over: Partial<MeasureHooks>): MeasureHooks {
  return {
    loadCached: async () => null,
    measureBlob: async () => ({ integratedLufs: -10, truePeakDbtp: -1 }),
    saveCached: () => {},
    onGains: () => {},
    isStale: () => false,
    ...over,
  };
}

describe('measureAndApply', () => {
  it('uses a cache hit without measuring', async () => {
    const measureBlob = vi.fn(async () => null);
    const onGains = vi.fn<(g: Map<number, GainUpdate>) => void>();
    await measureAndApply(
      tracks(1),
      baseHooks({ loadCached: async () => ({ integratedLufs: -20, truePeakDbtp: -5 }), measureBlob, onGains }),
    );
    expect(measureBlob).not.toHaveBeenCalled();
    expect(onGains).toHaveBeenCalledTimes(1);
    expect(onGains.mock.calls[0]![0].get(0)).toEqual({ gainDb: computeGainDb(-20, -5) });
  });

  it('measures, caches, and applies on a miss', async () => {
    const saveCached = vi.fn();
    const onGains = vi.fn<(g: Map<number, GainUpdate>) => void>();
    await measureAndApply(
      tracks(1),
      baseHooks({
        loadCached: async () => null,
        measureBlob: async () => ({ integratedLufs: -8, truePeakDbtp: -0.5 }),
        saveCached,
        onGains,
      }),
    );
    expect(saveCached).toHaveBeenCalledWith(1000, { integratedLufs: -8, truePeakDbtp: -0.5 });
    expect(onGains.mock.calls[0]![0].get(0)!.gainDb).toBeCloseTo(computeGainDb(-8, -0.5), 10);
  });

  it('emits nothing when stale', async () => {
    const onGains = vi.fn();
    await measureAndApply(tracks(3), baseHooks({ isStale: () => true, onGains }));
    expect(onGains).not.toHaveBeenCalled();
  });

  it('skips tracks without a blob URL', async () => {
    const measureBlob = vi.fn(async () => ({ integratedLufs: -10, truePeakDbtp: -1 }));
    const onGains = vi.fn<(g: Map<number, GainUpdate>) => void>();
    const mixed: TrackRef[] = [
      { gridId: 0, itunesId: 1, blobUrl: undefined },
      { gridId: 1, itunesId: 2, blobUrl: 'blob:1' },
    ];
    await measureAndApply(mixed, baseHooks({ measureBlob, onGains }));
    expect(measureBlob).toHaveBeenCalledTimes(1);
    expect(onGains).toHaveBeenCalledTimes(1);
    expect(onGains.mock.calls[0]![0].has(1)).toBe(true);
  });

  it('honours the concurrency bound', async () => {
    let active = 0;
    let peak = 0;
    const measureBlob = vi.fn(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return { integratedLufs: -10, truePeakDbtp: -1 };
    });
    await measureAndApply(tracks(6), baseHooks({ measureBlob, concurrency: 2 }));
    expect(peak).toBeLessThanOrEqual(2);
    expect(measureBlob).toHaveBeenCalledTimes(6);
  });

  it('leaves a track ungained when measurement fails', async () => {
    const onGains = vi.fn();
    await measureAndApply(tracks(1), baseHooks({ measureBlob: async () => null, onGains }));
    expect(onGains).not.toHaveBeenCalled();
  });
});
