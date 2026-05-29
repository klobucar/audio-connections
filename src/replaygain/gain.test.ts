import { describe, it, expect } from 'vitest';
import {
  computeGainDb,
  dbToLinear,
  DEFAULT_TARGET_LUFS,
  TRUE_PEAK_CEILING_DBTP,
} from './gain';

describe('dbToLinear', () => {
  it('maps 0 dB to unity', () => {
    expect(dbToLinear(0)).toBeCloseTo(1, 12);
  });
  it('maps -6 dB to ~0.5 and +6 dB to ~2', () => {
    expect(dbToLinear(-6)).toBeCloseTo(0.5012, 3);
    expect(dbToLinear(6)).toBeCloseTo(1.9953, 3);
  });
});

describe('computeGainDb', () => {
  it('attenuates a loud track to target (peak cap does not bind)', () => {
    // integrated -8, target -14 → desired -6; headroom -1-(-0.5) = -0.5.
    // min(-6, -0.5) = -6 → attenuate; post-peak -0.5 + -6 = -6.5 dBTP, safe.
    expect(computeGainDb(-8, -0.5)).toBeCloseTo(-6, 10);
  });

  it('boosts a quiet track with ample headroom', () => {
    // integrated -20 → desired +6; headroom -1-(-10) = +9. min(6,9) = +6.
    expect(computeGainDb(-20, -10)).toBeCloseTo(6, 10);
  });

  it('caps boost at the true-peak headroom for a quiet-but-peaky track', () => {
    // integrated -20 → desired +6; headroom -1-(-3) = +2. min(6,2) = +2.
    // post-peak -3 + 2 = -1 dBTP = ceiling exactly.
    expect(computeGainDb(-20, -3)).toBeCloseTo(2, 10);
  });

  it('never lets the post-gain true peak exceed the ceiling', () => {
    const cases: Array<[number, number]> = [
      [-25, -2],
      [-18, -0.2],
      [-9, -6],
      [-30, 0],
    ];
    for (const [lufs, tp] of cases) {
      const g = computeGainDb(lufs, tp);
      expect(tp + g).toBeLessThanOrEqual(TRUE_PEAK_CEILING_DBTP + 1e-9);
    }
  });

  it('honours a configurable target', () => {
    expect(computeGainDb(-8, -20, -16)).toBeCloseTo(-8, 10); // desired -8, headroom +15
    expect(computeGainDb(-8, -20, -8)).toBeCloseTo(0, 10);
  });

  it('returns 0 dB for silence (non-finite integrated loudness)', () => {
    expect(computeGainDb(-Infinity, -Infinity)).toBe(0);
    expect(computeGainDb(Number.NEGATIVE_INFINITY, -1)).toBe(0);
  });

  it('refuses to boost when true peak is unknown but still allows cuts', () => {
    expect(computeGainDb(-20, NaN)).toBe(0); // would-be boost suppressed
    expect(computeGainDb(-6, NaN)).toBeCloseTo(-8, 10); // cut still applies
  });

  it('uses the documented defaults', () => {
    expect(DEFAULT_TARGET_LUFS).toBe(-14);
    expect(TRUE_PEAK_CEILING_DBTP).toBe(-1);
    // default target path matches an explicit -14
    expect(computeGainDb(-10, -5)).toBeCloseTo(computeGainDb(-10, -5, -14, -1), 12);
  });
});
