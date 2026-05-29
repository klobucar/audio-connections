import { describe, it, expect } from 'vitest';
import { computeKeyboardInset, KEYBOARD_THRESHOLD_PX } from './useKeyboardInset';

describe('computeKeyboardInset', () => {
  it('is 0 when the visual viewport fills the layout viewport (no keyboard)', () => {
    expect(computeKeyboardInset(800, { height: 800, offsetTop: 0 })).toBe(0);
  });

  it('returns the occluded height when the keyboard shrinks the visual viewport', () => {
    // iOS: layout stays 800, visual shrinks to 500 → 300px keyboard.
    expect(computeKeyboardInset(800, { height: 500, offsetTop: 0 })).toBe(300);
  });

  it('accounts for a non-zero visual viewport offsetTop', () => {
    expect(computeKeyboardInset(800, { height: 500, offsetTop: 50 })).toBe(250);
  });

  it('ignores sub-threshold gaps (URL-bar jitter, not a keyboard)', () => {
    expect(computeKeyboardInset(800, { height: 760, offsetTop: 0 })).toBe(0);
  });

  it('treats a gap just past the threshold as a keyboard', () => {
    const visual = { height: 800 - (KEYBOARD_THRESHOLD_PX + 1), offsetTop: 0 };
    expect(computeKeyboardInset(800, visual)).toBe(KEYBOARD_THRESHOLD_PX + 1);
  });

  it('never returns a negative inset', () => {
    // Visual viewport reported larger than layout (rounding/overscroll).
    expect(computeKeyboardInset(800, { height: 820, offsetTop: 0 })).toBe(0);
  });

  it('rounds sub-pixel visual viewport heights', () => {
    expect(computeKeyboardInset(800, { height: 499.6, offsetTop: 0 })).toBe(300);
  });
});
