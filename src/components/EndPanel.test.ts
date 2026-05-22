import { describe, expect, it } from 'vitest';
import { buildShareText } from './EndPanel';
import type { Guess } from '../types';

// buildShareText turns the guess history into the shareable emoji grid. The
// Playwright suite only checks the line count; this pins the actual mapping.

/** A guess of four theme indices — only `themes` drives the share grid. */
function guess(themes: number[]): Guess {
  return { themes, correct: true, ids: [] };
}

describe('buildShareText', () => {
  it('starts with the puzzle title line', () => {
    expect(buildShareText(7, []).split('\n')[0]).toBe('Audio Connections 7');
  });

  it('an empty history is just the title', () => {
    expect(buildShareText(9, [])).toBe('Audio Connections 9');
  });

  it('renders one emoji row per guess, in guess order', () => {
    const text = buildShareText(1, [guess([0, 0, 0, 0]), guess([1, 2, 3, 0])]);
    expect(text.split('\n')).toEqual([
      'Audio Connections 1',
      '🟨🟨🟨🟨',
      '🟩🟦🟪🟨',
    ]);
  });

  it('a clean four-guess win is five lines — title plus four rows', () => {
    const history = [
      guess([0, 0, 0, 0]),
      guess([1, 1, 1, 1]),
      guess([2, 2, 2, 2]),
      guess([3, 3, 3, 3]),
    ];
    expect(buildShareText(3, history).split('\n')).toHaveLength(5);
  });
});
