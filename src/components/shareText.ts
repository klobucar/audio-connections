import type { Guess } from '../types';
import { THEME_EMOJI } from '../puzzles';

export function buildShareText(day: number, guessHistory: Guess[]): string {
  const lines = [`Audio Connections ${day}`];
  for (const g of guessHistory) {
    lines.push(g.themes.map((t) => THEME_EMOJI[t]).join(''));
  }
  return lines.join('\n');
}
