import { describe, expect, it } from 'vitest';
import type { Puzzle } from './types';
import { isReleased, latestReleasedIndex, puzzles } from './puzzles';

/** Minimal puzzle — isReleased only reads `day` and `releaseAt`. */
function puzzle(day: number, releaseAt?: string): Puzzle {
  return { day, date: '2026-01-01', author: 'test', themes: [], ...(releaseAt ? { releaseAt } : {}) };
}

describe('isReleased', () => {
  it('is true once now has passed releaseAt', () => {
    const p = puzzle(1, '2026-05-01T00:00:00Z');
    expect(isReleased(p, { now: Date.parse('2026-05-02T00:00:00Z') })).toBe(true);
  });

  it('is false before releaseAt', () => {
    const p = puzzle(1, '2026-05-01T00:00:00Z');
    expect(isReleased(p, { now: Date.parse('2026-04-30T00:00:00Z') })).toBe(false);
  });

  it('treats a puzzle with no releaseAt as unreleased — fail-safe, never leaked', () => {
    expect(isReleased(puzzle(1), { now: Date.now() })).toBe(false);
  });

  it('lets an unlocked day through even with no releaseAt', () => {
    expect(isReleased(puzzle(7), { now: 0, unlocked: new Set([7]) })).toBe(true);
  });

  it('lets an unlocked day through even when releaseAt is still in the future', () => {
    const p = puzzle(7, '2099-01-01T00:00:00Z');
    expect(isReleased(p, { now: Date.now(), unlocked: new Set([7]) })).toBe(true);
  });
});

describe('latestReleasedIndex', () => {
  it('falls back to 0 when nothing has released yet', () => {
    expect(latestReleasedIndex({ now: 0 })).toBe(0);
  });

  it('returns the last index once every puzzle has released', () => {
    const farFuture = Date.parse('2099-01-01T00:00:00Z');
    expect(latestReleasedIndex({ now: farFuture })).toBe(puzzles.length - 1);
  });

  it('is monotonic in the clock — a later now reveals no fewer puzzles', () => {
    const early = latestReleasedIndex({ now: Date.parse('2026-05-10T00:00:00Z') });
    const later = latestReleasedIndex({ now: Date.parse('2026-06-10T00:00:00Z') });
    expect(later).toBeGreaterThanOrEqual(early);
  });
});
