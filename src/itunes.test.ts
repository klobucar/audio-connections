import { describe, expect, it } from 'vitest';
import { backoffDelayMs } from './itunes';

describe('backoffDelayMs', () => {
  it('doubles the delay on each successive attempt', () => {
    expect(backoffDelayMs(1)).toBe(500);
    expect(backoffDelayMs(2)).toBe(1000);
    expect(backoffDelayMs(3)).toBe(2000);
    expect(backoffDelayMs(4)).toBe(4000);
    expect(backoffDelayMs(5)).toBe(8000);
  });

  it('caps the delay at 10 seconds', () => {
    expect(backoffDelayMs(6)).toBe(10_000);
    expect(backoffDelayMs(20)).toBe(10_000);
  });
});
