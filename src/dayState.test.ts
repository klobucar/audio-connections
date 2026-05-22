import { beforeEach, describe, expect, it } from 'vitest';
import { deriveDayState, deriveStatus } from './dayState';
import { saveState } from './storage';
import type { Puzzle } from './types';

describe('deriveStatus', () => {
  it('is locked whenever the puzzle has not released, whatever the progress', () => {
    expect(deriveStatus(false, true, 4, 0)).toBe('locked');
    expect(deriveStatus(false, false, 0, 0)).toBe('locked');
  });

  it('is failed once mistakes reach the cap', () => {
    expect(deriveStatus(true, false, 1, 4)).toBe('failed');
  });

  it('reports failed — not done — for a maxed-out loss', () => {
    // On a loss the reducer auto-reveals every theme, so a lost save carries
    // groupsSolved === 4 AND mistakes === MAX at once. `failed` must win.
    expect(deriveStatus(true, false, 4, 4)).toBe('failed');
  });

  it('is done for a clean sweep', () => {
    expect(deriveStatus(true, false, 4, 0)).toBe('done');
  });

  it('is doneMistakes for a win that cost mistakes', () => {
    expect(deriveStatus(true, false, 4, 3)).toBe('doneMistakes');
  });

  it('is inProgress once a group is solved or a mistake is made', () => {
    expect(deriveStatus(true, false, 1, 0)).toBe('inProgress');
    expect(deriveStatus(true, false, 0, 1)).toBe('inProgress');
  });

  it('is today for an untouched puzzle dated today', () => {
    expect(deriveStatus(true, true, 0, 0)).toBe('today');
  });

  it('is unplayed for an untouched puzzle that is not today', () => {
    expect(deriveStatus(true, false, 0, 0)).toBe('unplayed');
  });
});

describe('deriveDayState', () => {
  beforeEach(() => localStorage.clear());

  // releaseAt in the past so isReleased() resolves true against the real clock.
  const released: Puzzle = {
    day: 3,
    date: '2020-01-01',
    author: 'test',
    releaseAt: '2020-01-01T00:00:00Z',
    themes: [],
  };

  it('pulls groupsSolved and mistakes from the persisted save', () => {
    saveState(3, {
      selected: [],
      solvedThemes: [0, 1],
      notes: [],
      mistakes: 2,
      guessHistory: [],
      gameOver: false,
      trackOrder: [],
      guessSignatures: [],
    });
    const ds = deriveDayState(released, 3, new Set());
    expect(ds.groupsSolved).toBe(2);
    expect(ds.mistakes).toBe(2);
    expect(ds.status).toBe('inProgress');
  });

  it('marks an unreleased puzzle locked and never reads its save', () => {
    const future: Puzzle = { ...released, day: 4, releaseAt: '2099-01-01T00:00:00Z' };
    expect(deriveDayState(future, 4, new Set()).status).toBe('locked');
  });
});
