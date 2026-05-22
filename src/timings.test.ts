import { describe, expect, it } from 'vitest';
import { parseCssDuration } from './timings';

// parseCssDuration is the parsing half of readCssDurationMs, split out so it
// can be tested without a DOM (readCssDurationMs short-circuits to the
// fallback when there's no window, as in this Node test environment).
describe('parseCssDuration', () => {
  it('reads a millisecond value directly', () => {
    expect(parseCssDuration('350ms', 999)).toBe(350);
  });

  it('converts a seconds value to milliseconds', () => {
    expect(parseCssDuration('0.35s', 999)).toBe(350);
    expect(parseCssDuration('2s', 999)).toBe(2000);
  });

  it('trims surrounding whitespace', () => {
    expect(parseCssDuration('  500ms  ', 999)).toBe(500);
  });

  it('falls back for an empty or whitespace-only value', () => {
    expect(parseCssDuration('', 999)).toBe(999);
    expect(parseCssDuration('   ', 999)).toBe(999);
  });

  it('falls back for an unparseable value', () => {
    expect(parseCssDuration('not-a-number', 999)).toBe(999);
  });
});
