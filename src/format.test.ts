import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { formatPuzzleDate, formatReleaseAt } from './format';

describe('formatPuzzleDate', () => {
  it('renders the calendar day with month, day, and year', () => {
    const out = formatPuzzleDate('2026-05-17');
    expect(out).toContain('2026');
    expect(out).toContain('17');
  });

  // formatPuzzleDate parses YYYY-MM-DD at *noon UTC* on purpose, so the
  // displayed day cannot roll backward in a negative-offset timezone. Pinning
  // TZ to US Pacific exercises exactly that: a naive `new Date('2026-01-01')`
  // parses as 00:00 UTC — the prior evening in LA — and would render 2025.
  describe('in a negative-offset timezone', () => {
    const originalTZ = process.env.TZ;
    beforeAll(() => {
      process.env.TZ = 'America/Los_Angeles';
    });
    afterAll(() => {
      process.env.TZ = originalTZ;
    });

    it('does not roll the date backward across the UTC boundary', () => {
      const out = formatPuzzleDate('2026-01-01');
      expect(out).toContain('2026');
      expect(out).toContain('January');
    });
  });
});

describe('formatReleaseAt', () => {
  it('renders a weekday and clock time for an ISO timestamp', () => {
    const out = formatReleaseAt('2026-05-24T12:00:00-07:00');
    expect(out.length).toBeGreaterThan(0);
    // weekday: 'short' always emits a three-letter day prefix.
    expect(out).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
  });
});
