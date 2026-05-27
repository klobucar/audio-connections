import { describe, expect, it } from 'vitest';
import type { Puzzle } from './types';
import {
  MAX_CONSTRAINT_LENGTH,
  isReleased,
  latestReleasedIndex,
  puzzles,
  validatePuzzle,
} from './puzzles';

/** Minimal puzzle — isReleased only reads `day` and `releaseAt`. */
function puzzle(day: number, releaseAt: string): Puzzle {
  return { day, date: '2026-01-01', author: 'test', themes: [], releaseAt };
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

describe('validatePuzzle — constraint field', () => {
  // Minimal valid puzzle shape; tests vary only the `constraint` field.
  const base = {
    day: 1,
    date: '2026-01-01',
    author: 'test',
    releaseAt: '2026-01-01T00:00:00Z',
    themes: [
      { theme: 't1', tracks: [{ id: 1, artist: 'a', title: 't' }, { id: 2, artist: 'a', title: 't' }, { id: 3, artist: 'a', title: 't' }, { id: 4, artist: 'a', title: 't' }] },
      { theme: 't2', tracks: [{ id: 5, artist: 'a', title: 't' }, { id: 6, artist: 'a', title: 't' }, { id: 7, artist: 'a', title: 't' }, { id: 8, artist: 'a', title: 't' }] },
      { theme: 't3', tracks: [{ id: 9, artist: 'a', title: 't' }, { id: 10, artist: 'a', title: 't' }, { id: 11, artist: 'a', title: 't' }, { id: 12, artist: 'a', title: 't' }] },
      { theme: 't4', tracks: [{ id: 13, artist: 'a', title: 't' }, { id: 14, artist: 'a', title: 't' }, { id: 15, artist: 'a', title: 't' }, { id: 16, artist: 'a', title: 't' }] },
    ],
  };

  it('omitting constraint is fine — it is optional', () => {
    expect(() => validatePuzzle(base, 'test')).not.toThrow();
  });

  it('accepts a constraint at exactly the max length', () => {
    const constraint = 'x'.repeat(MAX_CONSTRAINT_LENGTH);
    expect(() => validatePuzzle({ ...base, constraint }, 'test')).not.toThrow();
  });

  it('rejects a constraint one char over the limit, naming the limit in the error', () => {
    const constraint = 'x'.repeat(MAX_CONSTRAINT_LENGTH + 1);
    expect(() => validatePuzzle({ ...base, constraint }, 'day-N.ts')).toThrow(
      new RegExp(`constraint is \\d+ chars; soft cap is ${MAX_CONSTRAINT_LENGTH}`),
    );
  });

  it('rejects an empty-string constraint (use omission instead)', () => {
    expect(() => validatePuzzle({ ...base, constraint: '' }, 'test')).toThrow(
      /constraint must be a non-empty string/,
    );
  });

  it('rejects a non-string constraint', () => {
    expect(() => validatePuzzle({ ...base, constraint: 42 }, 'test')).toThrow(
      /constraint must be a non-empty string/,
    );
  });
});

describe('shipped puzzles respect the constraint limit', () => {
  // Belt-and-suspenders: importing puzzles already runs validatePuzzle on each
  // file (so any over-limit constraint would have already thrown). Loop in a
  // single `it` rather than `it.each` so vitest doesn't error when no shipped
  // puzzle has set a constraint yet (empty arrays in it.each fail the suite).
  // The assertion message names the failing day so a violation is still clear.
  it('every constrained puzzle is within the soft cap', () => {
    for (const p of puzzles) {
      if (!p.constraint) continue;
      expect(p.constraint.length, `day ${p.day}: "${p.constraint}"`).toBeLessThanOrEqual(
        MAX_CONSTRAINT_LENGTH,
      );
    }
  });
});
