import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, collectBackup } from './backup';
import { puzzles, MAX_MISTAKES } from './puzzles';
import { loadCurrentDay, loadIntroSeenVersion, loadState, saveCurrentDay, saveIntroSeenVersion, saveState } from './storage';
import type { PerDayRecord } from './transfer';

const dayA = puzzles[0]!.day;
const dayB = puzzles[1]!.day;
const dayC = puzzles[2]!.day;

describe('collectBackup', () => {
  beforeEach(() => localStorage.clear());

  it('returns terminal records in puzzle order, skipping in-progress and unplayed days', () => {
    // dayA: won (3 themes via guess, all four solvedThemes from auto-reveal).
    saveState(dayA, {
      selected: [],
      solvedThemes: [0, 1, 2, 3],
      notes: [],
      mistakes: 1,
      guessHistory: [
        { themes: [0, 1, 2, 3], correct: false, ids: [10, 11, 12, 13] },
        { themes: [0, 0, 0, 0], correct: true, ids: [0, 1, 2, 3] },
        { themes: [1, 1, 1, 1], correct: true, ids: [4, 5, 6, 7] },
        { themes: [2, 2, 2, 2], correct: true, ids: [8, 9, 14, 15] },
        { themes: [3, 3, 3, 3], correct: true, ids: [16, 17, 18, 19] },
      ],
      gameOver: true,
      trackOrder: [],
      guessSignatures: [],
    });
    // dayB: in-progress, skipped.
    saveState(dayB, {
      selected: [1],
      solvedThemes: [],
      notes: [],
      mistakes: 0,
      guessHistory: [],
      gameOver: false,
      trackOrder: [],
      guessSignatures: [],
    });
    // dayC: lost.
    saveState(dayC, {
      selected: [],
      solvedThemes: [0, 1, 2, 3],
      notes: [],
      mistakes: MAX_MISTAKES,
      guessHistory: [
        { themes: [0, 1, 2, 3], correct: false, ids: [0, 1, 2, 3] },
        { themes: [0, 1, 2, 3], correct: false, ids: [4, 5, 6, 7] },
        { themes: [0, 1, 2, 3], correct: false, ids: [8, 9, 10, 11] },
        { themes: [0, 1, 2, 3], correct: false, ids: [12, 13, 14, 15] },
      ],
      gameOver: true,
      trackOrder: [],
      guessSignatures: [],
    });

    const records = collectBackup();
    expect(records).toEqual([
      {
        day: dayA,
        outcome: 'won',
        guessHistory: [
          { themes: [0, 1, 2, 3], correct: false },
          { themes: [0, 0, 0, 0], correct: true },
          { themes: [1, 1, 1, 1], correct: true },
          { themes: [2, 2, 2, 2], correct: true },
          { themes: [3, 3, 3, 3], correct: true },
        ],
      },
      {
        day: dayC,
        outcome: 'lost',
        guessHistory: [
          { themes: [0, 1, 2, 3], correct: false },
          { themes: [0, 1, 2, 3], correct: false },
          { themes: [0, 1, 2, 3], correct: false },
          { themes: [0, 1, 2, 3], correct: false },
        ],
      },
    ]);
  });

  it('returns an empty list when nothing is saved', () => {
    expect(collectBackup()).toEqual([]);
  });
});

describe('applyBackup', () => {
  beforeEach(() => localStorage.clear());

  it('replaces all per-day records and leaves singletons untouched', () => {
    // Pre-existing state on dayA that should be wiped.
    saveState(dayA, {
      selected: [1, 2],
      solvedThemes: [0],
      notes: [[3, 'note']],
      mistakes: 1,
      guessHistory: [{ themes: [0, 0, 0, 1], correct: false, ids: [0, 1, 2, 3] }],
      gameOver: false,
      trackOrder: [3, 1, 0, 2],
      guessSignatures: ['0,1,2,3'],
    });
    saveCurrentDay(dayA);
    saveIntroSeenVersion(7);

    const incoming: PerDayRecord[] = [
      {
        day: dayB,
        outcome: 'won',
        guessHistory: [
          { themes: [0, 0, 0, 0], correct: true },
          { themes: [1, 1, 1, 1], correct: true },
          { themes: [2, 2, 2, 2], correct: true },
          { themes: [3, 3, 3, 3], correct: true },
        ],
      },
    ];
    applyBackup(incoming);

    // dayA wiped.
    expect(loadState(dayA)).toBeNull();
    // dayB materialized as a terminal won record.
    const restored = loadState(dayB);
    expect(restored).not.toBeNull();
    expect(restored!.gameOver).toBe(true);
    expect(restored!.solvedThemes).toEqual([0, 1, 2, 3]);
    expect(restored!.mistakes).toBe(0);
    expect(restored!.guessHistory).toHaveLength(4);
    expect(restored!.guessHistory[0]).toEqual({ themes: [0, 0, 0, 0], correct: true, ids: [] });
    // trackOrder populated as positional indices [0..15] — matches the
    // LoadedTrack.id assignment in usePuzzleSession so set-equal passes
    // on next load-restore.
    const trackCount = puzzles[1]!.themes.reduce((sum, t) => sum + t.tracks.length, 0);
    expect(restored!.trackOrder).toEqual(Array.from({ length: trackCount }, (_, i) => i));
    // Singletons preserved.
    expect(loadCurrentDay()).toBe(dayA);
    expect(loadIntroSeenVersion()).toBe(7);
  });

  it('materializes editor-synthesized records (no history)', () => {
    applyBackup([
      { day: dayA, outcome: 'won' },
      { day: dayB, outcome: 'lost' },
    ]);
    const won = loadState(dayA)!;
    expect(won.gameOver).toBe(true);
    expect(won.guessHistory).toEqual([]);
    expect(won.mistakes).toBe(0);
    expect(won.solvedThemes).toEqual([0, 1, 2, 3]);

    const lost = loadState(dayB)!;
    expect(lost.gameOver).toBe(true);
    expect(lost.guessHistory).toEqual([]);
    expect(lost.mistakes).toBe(MAX_MISTAKES);
    expect(lost.solvedThemes).toEqual([0, 1, 2, 3]);
  });

  it('derives mistakes from guessHistory when present (not from outcome)', () => {
    applyBackup([
      {
        day: dayA,
        outcome: 'won',
        guessHistory: [
          { themes: [0, 1, 2, 3], correct: false },
          { themes: [0, 1, 2, 3], correct: false },
          { themes: [0, 0, 0, 0], correct: true },
          { themes: [1, 1, 1, 1], correct: true },
          { themes: [2, 2, 2, 2], correct: true },
          { themes: [3, 3, 3, 3], correct: true },
        ],
      },
    ]);
    expect(loadState(dayA)!.mistakes).toBe(2);
  });
});
