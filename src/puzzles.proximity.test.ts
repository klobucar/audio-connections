import { describe, expect, it } from 'vitest';
import { findProximityWarnings, scheduledDates } from './puzzles.proximity';

describe('scheduledDates', () => {
  // Guards the failure mode that made the old check-puzzles plugin silently
  // dead: if the derivation returns nothing, no proximity warning can ever
  // fire and a maintainer gets a false all-clear.
  it('derives a day + date for every scheduled slug', () => {
    const dates = scheduledDates();
    expect(dates.size).toBeGreaterThan(0);
    for (const [slug, { day, date }] of dates) {
      expect(day, `${slug}.day`).toBeGreaterThan(0);
      expect(date, `${slug}.date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('findProximityWarnings', () => {
  const dates = new Map([
    ['a-1', { day: 1, date: '2026-05-10' }],
    ['a-2', { day: 2, date: '2026-05-11' }],
    ['a-3', { day: 3, date: '2026-06-01' }], // 22 days after a-1
  ]);

  it('warns when an id repeats within warnDays', () => {
    const w = findProximityWarnings(
      new Map([
        ['a-1', [100]],
        ['a-2', [100]],
      ]),
      dates,
      14,
    );
    expect(w).toHaveLength(1);
    expect(w[0]!.id).toBe(100);
    expect(w[0]!.gap).toBe(1);
  });

  it('stays quiet when the gap is >= warnDays', () => {
    const w = findProximityWarnings(
      new Map([
        ['a-1', [100]],
        ['a-3', [100]],
      ]),
      dates,
      14,
    );
    expect(w).toHaveLength(0);
  });

  it('stays quiet when the later duplicate is already released', () => {
    const w = findProximityWarnings(
      new Map([
        ['a-1', [100]],
        ['a-2', [100]],
      ]),
      dates,
      14,
      '2026-05-11',
    );
    expect(w).toHaveLength(0);
  });

  it('still warns when the later duplicate is future-dated', () => {
    const w = findProximityWarnings(
      new Map([
        ['a-1', [100]],
        ['a-2', [100]],
      ]),
      dates,
      14,
      '2026-05-10',
    );
    expect(w).toHaveLength(1);
  });

  it('ignores files with no scheduled date (not live)', () => {
    const w = findProximityWarnings(
      new Map([
        ['ghost', [100]],
        ['a-1', [100]],
      ]),
      dates,
      14,
    );
    expect(w).toHaveLength(0); // only one *scheduled* occurrence of 100
  });

  it('covers author-slug files, not just legacy day-N (the regression)', () => {
    // The old plugin globbed only /^day-\d+\.ts$/, so a reuse between two
    // author-slug puzzles was invisible. This is exactly that case.
    const w = findProximityWarnings(
      new Map([
        ['bojanrajkovic-1', [42]],
        ['klobucar-1', [42]],
      ]),
      new Map([
        ['bojanrajkovic-1', { day: 23, date: '2026-06-01' }],
        ['klobucar-1', { day: 24, date: '2026-06-02' }],
      ]),
      14,
    );
    expect(w).toHaveLength(1);
    expect(w[0]!.id).toBe(42);
  });
});
