import { describe, expect, it } from 'vitest';
import { solvedThemeOrder } from './solvedOrder';
import type { Guess } from '../types';

/** A correct/incorrect guess of one theme index — only `themes[0]` and
 *  `correct` drive the ordering. */
function guess(themeIdx: number, correct = true): Guess {
  return { themes: [themeIdx], correct, ids: [] };
}

describe('solvedThemeOrder', () => {
  it('orders by the correct guesses, in the order they were made', () => {
    const history = [guess(2), guess(0), guess(3), guess(1)];
    const solved = new Set([0, 1, 2, 3]);
    expect(solvedThemeOrder(history, solved)).toEqual([2, 0, 3, 1]);
  });

  it('skips incorrect guesses', () => {
    const history = [guess(2), guess(1, false), guess(0)];
    const solved = new Set([0, 2]);
    expect(solvedThemeOrder(history, solved)).toEqual([2, 0]);
  });

  it('appends solved-but-not-guessed themes (loss auto-reveal) in theme order', () => {
    // Player found side 2, then lost — sides 0, 1, 3 auto-revealed.
    const history = [guess(2)];
    const solved = new Set([0, 1, 2, 3]);
    expect(solvedThemeOrder(history, solved)).toEqual([2, 0, 1, 3]);
  });

  it('does not duplicate a theme guessed correctly more than once', () => {
    const history = [guess(1), guess(1)];
    const solved = new Set([1]);
    expect(solvedThemeOrder(history, solved)).toEqual([1]);
  });

  it('is empty when nothing is solved', () => {
    expect(solvedThemeOrder([], new Set())).toEqual([]);
  });
});
