import { describe, expect, it } from 'vitest';
import { classifyGuess, initialSession, loadTrackInfosWithRetry, reducer, shuffle } from './usePuzzleSession';
import type { Action, SessionState, ThemeState } from './usePuzzleSession';
import type { LoadedTrack } from '../types';
import type { PersistedGameState } from '../storage';
import type { TrackInfo } from '../itunes';

// The reducer is a pure (state, action) => state state machine — the rules
// that game.spec.ts only reaches by clicking through a real browser. Driving
// it directly here makes each rule a millisecond-scale assertion instead of a
// browser round-trip.

/** 16 loaded tracks, 4 per theme — the standard puzzle shape. Track `id`
 *  doubles as its grid position; `themeIdx = floor(id / 4)`. */
function tracks(): LoadedTrack[] {
  return Array.from({ length: 16 }, (_, id) => ({
    id,
    itunesId: 1000 + id,
    themeIdx: Math.floor(id / 4),
    previewUrl: `mock://${id}`,
    artist: `artist ${id}`,
    title: `title ${id}`,
  }));
}

/** A loaded, untouched session for Day 1 — the state right after the iTunes
 *  load resolves with no persisted save to restore. */
function freshSession(): SessionState {
  return reducer(initialSession(4, ''), {
    type: 'load-fresh',
    day: 1,
    id: '1',
    themeCount: 4,
    tracks: tracks(),
    loadStatus: '',
  });
}

/** Fold a sequence of actions onto a starting state. */
function run(state: SessionState, actions: Action[]): SessionState {
  return actions.reduce(reducer, state);
}

describe('initialSession', () => {
  it('starts blank, detached from any day, with every theme unsolved', () => {
    const s = initialSession(4, 'Loading…');
    expect(s.day).toBeNull();
    expect(s.themeStates).toEqual<ThemeState[]>(['unsolved', 'unsolved', 'unsolved', 'unsolved']);
    expect(s.selected.size).toBe(0);
    expect(s.mistakes).toBe(0);
    expect(s.gameOver).toBe(false);
    expect(s.loadStatus).toBe('Loading…');
  });
});

describe('loading actions', () => {
  it('load-fresh attaches the day and tracks but keeps progress empty', () => {
    const s = freshSession();
    expect(s.day).toBe(1);
    expect(s.tracks).toHaveLength(16);
    expect(s.themeStates.every((t) => t === 'unsolved')).toBe(true);
  });

  it('load-reset returns a blank session with no day attached', () => {
    const s = reducer(freshSession(), { type: 'load-reset', themeCount: 4, loadStatus: 'Loading…' });
    expect(s.day).toBeNull();
    expect(s.tracks).toEqual([]);
    expect(s.loadStatus).toBe('Loading…');
  });

  it('load-restore rehydrates solved themes, selection, notes, and mistakes', () => {
    const persisted: PersistedGameState = {
      __v: 1,
      day: 1,
      selected: [5],
      solvedThemes: [0, 2],
      notes: [[3, 'a slow fade-in']],
      mistakes: 2,
      guessHistory: [{ themes: [0, 0, 0, 0], correct: true, ids: [0, 1, 2, 3] }],
      gameOver: false,
      trackOrder: [],
      guessSignatures: ['0,1,2,3'],
    };
    const s = reducer(initialSession(4, ''), {
      type: 'load-restore',
      day: 1,
      id: '1',
      themeCount: 4,
      tracks: tracks(),
      persisted,
      loadStatus: '',
    });
    expect(s.themeStates).toEqual<ThemeState[]>(['solved', 'unsolved', 'solved', 'unsolved']);
    expect([...s.selected]).toEqual([5]);
    expect(s.notes.get(3)).toBe('a slow fade-in');
    expect(s.mistakes).toBe(2);
    expect(s.guessSignatures.has('0,1,2,3')).toBe(true);
  });
});

describe('loadTrackInfosWithRetry', () => {
  it('loads metadata in one batch and retries only missing previews individually after a delay', async () => {
    const batchCalls: number[][] = [];
    const individualCalls: number[] = [];
    const waits: number[] = [];
    const statuses: string[] = [];

    const lookup = async (id: number): Promise<TrackInfo | null> => {
      individualCalls.push(id);
      return { previewUrl: `preview:${id}` };
    };

    const infos = await loadTrackInfosWithRetry(
      [{ id: 1 }, { id: 2 }, { id: 3 }],
      {
        batchLookup: async (ids) => {
          batchCalls.push([...ids]);
          return new Map([
            [1, { previewUrl: 'preview:1' }],
            [3, { previewUrl: 'preview:3' }],
          ]);
        },
        lookup,
        wait: async (ms) => {
          waits.push(ms);
        },
        retryDelayMs: 2_000,
        onStatus: (status) => statuses.push(status),
      },
    );

    expect(batchCalls).toEqual([[1, 2, 3]]);
    expect(individualCalls).toEqual([2]);
    expect(waits).toEqual([2_000]);
    expect(infos).toEqual([
      { previewUrl: 'preview:1' },
      { previewUrl: 'preview:2' },
      { previewUrl: 'preview:3' },
    ]);
    expect(statuses).toContain('Retrying missing previews… (1/3)');
  });

  it('does not wait or retry when every lookup returns a preview', async () => {
    const batchCalls: number[][] = [];
    const individualCalls: number[] = [];
    const waits: number[] = [];

    const infos = await loadTrackInfosWithRetry(
      [{ id: 5 }, { id: 6 }],
      {
        batchLookup: async (ids) => {
          batchCalls.push([...ids]);
          return new Map([
            [5, { previewUrl: 'preview:5' }],
            [6, { previewUrl: 'preview:6' }],
          ]);
        },
        lookup: async (id) => {
          individualCalls.push(id);
          return { previewUrl: `preview:${id}` };
        },
        wait: async (ms) => {
          waits.push(ms);
        },
      },
    );

    expect(batchCalls).toEqual([[5, 6]]);
    expect(individualCalls).toEqual([]);
    expect(waits).toEqual([]);
    expect(infos?.map((info) => info?.previewUrl)).toEqual(['preview:5', 'preview:6']);
  });

  it('retries every ID individually when the batch lookup fails', async () => {
    const individualCalls: number[] = [];

    const infos = await loadTrackInfosWithRetry(
      [{ id: 7 }, { id: 8 }],
      {
        batchLookup: async () => {
          throw new Error('batch failed');
        },
        lookup: async (id) => {
          individualCalls.push(id);
          return { previewUrl: `preview:${id}` };
        },
        wait: async () => {},
      },
    );

    expect(individualCalls).toEqual([7, 8]);
    expect(infos?.map((info) => info?.previewUrl)).toEqual(['preview:7', 'preview:8']);
  });

  it('returns null when the owning load generation goes stale', async () => {
    let stale = false;

    const infos = await loadTrackInfosWithRetry(
      [{ id: 1 }],
      {
        batchLookup: async () => {
          stale = true;
          return new Map([[1, { previewUrl: 'preview:1' }]]);
        },
        isStale: () => stale,
      },
    );

    expect(infos).toBeNull();
  });
});

describe('tile selection', () => {
  it('toggles a tile into and back out of the selection', () => {
    const picked = reducer(freshSession(), { type: 'toggle-select', id: 3 });
    expect([...picked.selected]).toEqual([3]);
    const cleared = reducer(picked, { type: 'toggle-select', id: 3 });
    expect(cleared.selected.size).toBe(0);
  });

  it('caps the selection at four tiles', () => {
    const actions: Action[] = [0, 1, 2, 3, 4].map((id) => ({ type: 'toggle-select', id }));
    const s = run(freshSession(), actions);
    expect(s.selected.size).toBe(4);
    expect(s.selected.has(4)).toBe(false);
  });

  it('deselect-all empties the selection', () => {
    const s = run(freshSession(), [
      { type: 'toggle-select', id: 0 },
      { type: 'toggle-select', id: 1 },
      { type: 'deselect-all' },
    ]);
    expect(s.selected.size).toBe(0);
  });

  it('ignores selection changes once the game is over', () => {
    const over: SessionState = { ...freshSession(), gameOver: true };
    expect(reducer(over, { type: 'toggle-select', id: 1 }).selected.size).toBe(0);
  });

  it('set-note stores per-tile text', () => {
    const s = reducer(freshSession(), { type: 'set-note', id: 7, note: 'echoey intro' });
    expect(s.notes.get(7)).toBe('echoey intro');
  });
});

describe('a correct guess plays out as a staged animation', () => {
  it('guess-correct-start moves the theme to "matching" and clears the selection', () => {
    const picked: SessionState = { ...freshSession(), selected: new Set([0, 1, 2, 3]) };
    const s = reducer(picked, {
      type: 'guess-correct-start',
      themeIdx: 0,
      themesPicked: [0, 0, 0, 0],
      ids: [0, 1, 2, 3],
    });
    expect(s.themeStates[0]).toBe('matching');
    expect(s.selected.size).toBe(0);
    expect(s.guessHistory).toHaveLength(1);
    expect(s.guessHistory[0]).toMatchObject({ correct: true, ids: [0, 1, 2, 3] });
    expect(s.guessSignatures.has('0,1,2,3')).toBe(true);
  });

  it('pulse-end advances matching → exiting, then exit-end advances exiting → solved', () => {
    let s = reducer(freshSession(), {
      type: 'guess-correct-start',
      themeIdx: 1,
      themesPicked: [1, 1, 1, 1],
      ids: [4, 5, 6, 7],
    });
    s = reducer(s, { type: 'guess-correct-pulse-end', themeIdx: 1 });
    expect(s.themeStates[1]).toBe('exiting');
    s = reducer(s, { type: 'guess-correct-exit-end', themeIdx: 1 });
    expect(s.themeStates[1]).toBe('solved');
  });

  it('sets gameOver when the final theme finishes pulsing', () => {
    const lastInFlight: SessionState = {
      ...freshSession(),
      themeStates: ['solved', 'solved', 'solved', 'matching'],
    };
    const s = reducer(lastInFlight, { type: 'guess-correct-pulse-end', themeIdx: 3 });
    expect(s.gameOver).toBe(true);
  });

  it('does not set gameOver while themes are still unsolved', () => {
    let s = reducer(freshSession(), {
      type: 'guess-correct-start',
      themeIdx: 0,
      themesPicked: [0, 0, 0, 0],
      ids: [0, 1, 2, 3],
    });
    s = reducer(s, { type: 'guess-correct-pulse-end', themeIdx: 0 });
    expect(s.gameOver).toBe(false);
  });
});

describe('wrong guesses', () => {
  const wrong: Action = { type: 'guess-wrong', themesPicked: [0, 0, 0, 1], ids: [0, 1, 2, 4] };

  it('each wrong guess costs one mistake and records history', () => {
    const s = reducer(freshSession(), wrong);
    expect(s.mistakes).toBe(1);
    expect(s.guessHistory[0]).toMatchObject({ correct: false });
    expect(s.gameOver).toBe(false);
  });

  it('the fourth mistake ends the game and fans every theme still in flight to exiting', () => {
    // MAX_MISTAKES is 4; the first three are survivable.
    let s = run(freshSession(), [
      { type: 'guess-wrong', themesPicked: [0, 0, 0, 1], ids: [0, 1, 2, 4] },
      { type: 'guess-wrong', themesPicked: [0, 0, 0, 1], ids: [0, 1, 2, 5] },
      { type: 'guess-wrong', themesPicked: [0, 0, 0, 1], ids: [0, 1, 2, 6] },
    ]);
    expect(s.mistakes).toBe(3);
    expect(s.gameOver).toBe(false);

    s = reducer(s, { type: 'guess-wrong', themesPicked: [0, 0, 0, 1], ids: [0, 1, 2, 7] });
    expect(s.mistakes).toBe(4);
    expect(s.gameOver).toBe(true);
    expect(s.themeStates.every((t) => t === 'exiting')).toBe(true);
    expect(s.selected.size).toBe(0);
  });

  it('the game-over fan-out leaves already-solved themes solved', () => {
    const partly: SessionState = {
      ...freshSession(),
      themeStates: ['solved', 'exiting', 'unsolved', 'matching'],
      mistakes: 3,
    };
    const s = reducer(partly, { type: 'guess-wrong', themesPicked: [2, 2, 2, 3], ids: [8, 9, 10, 12] });
    expect(s.themeStates).toEqual<ThemeState[]>(['solved', 'exiting', 'exiting', 'exiting']);
  });

  it('wrong-game-over-exit-end settles every exiting theme to solved', () => {
    const s = reducer(
      { ...freshSession(), themeStates: ['exiting', 'exiting', 'exiting', 'exiting'] },
      { type: 'wrong-game-over-exit-end' },
    );
    expect(s.themeStates.every((t) => t === 'solved')).toBe(true);
  });
});

describe('reset-puzzle', () => {
  it('clears all progress but keeps the day attached', () => {
    const dirty: SessionState = {
      ...freshSession(),
      mistakes: 2,
      selected: new Set([1, 2]),
      themeStates: ['solved', 'unsolved', 'unsolved', 'unsolved'],
      gameOver: false,
    };
    const s = reducer(dirty, { type: 'reset-puzzle', tracks: tracks() });
    expect(s.day).toBe(1);
    expect(s.mistakes).toBe(0);
    expect(s.selected.size).toBe(0);
    expect(s.themeStates.every((t) => t === 'unsolved')).toBe(true);
    expect(s.gameOver).toBe(false);
  });
});

describe("reducer 'apply-gains'", () => {
  it('paints gain onto matching tracks, preserving order and other tracks', () => {
    const s = reducer(freshSession(), {
      type: 'apply-gains',
      gains: new Map([
        [1, { gainDb: -3.2 }],
        [5, { gainDb: 2.1 }],
      ]),
    });
    expect(s.tracks.map((t) => t.id)).toEqual([...Array(16).keys()]);
    expect(s.tracks[1]).toMatchObject({ id: 1, gainDb: -3.2 });
    expect(s.tracks[5]).toMatchObject({ id: 5, gainDb: 2.1 });
    expect(s.tracks[0].gainDb).toBeUndefined();
    expect(s.tracks[2].gainDb).toBeUndefined();
  });

  it('ignores ids with no matching track', () => {
    const s = reducer(freshSession(), {
      type: 'apply-gains',
      gains: new Map([[999, { gainDb: 5 }]]),
    });
    expect(s.tracks.every((t) => t.gainDb === undefined)).toBe(true);
  });

  it('returns the same state for an empty or no-op map (no needless re-render)', () => {
    const base = freshSession();
    expect(reducer(base, { type: 'apply-gains', gains: new Map() })).toBe(base);
    const once = reducer(base, {
      type: 'apply-gains',
      gains: new Map([[0, { gainDb: -1 }]]),
    });
    const twice = reducer(once, {
      type: 'apply-gains',
      gains: new Map([[0, { gainDb: -1 }]]),
    });
    expect(twice).toBe(once);
  });

  it('leaves day, themeStates, and selection untouched', () => {
    const base = freshSession();
    const s = reducer(base, {
      type: 'apply-gains',
      gains: new Map([[0, { gainDb: -2 }]]),
    });
    expect(s.day).toBe(base.day);
    expect(s.themeStates).toBe(base.themeStates);
    expect(s.selected).toBe(base.selected);
  });
});

// classifyGuess is the pure verdict that submit() builds its dispatches and
// status toasts on. submit() itself isn't unit-testable (animation timers,
// React callbacks) — this covers the decision underneath it.
describe('classifyGuess', () => {
  const deck = tracks(); // 16 tracks, theme = floor(id / 4)

  it('flags a four-of-a-theme pick as correct and names the theme', () => {
    const v = classifyGuess([0, 1, 2, 3], deck, new Set());
    expect(v.correct).toBe(true);
    expect(v.themeIdx).toBe(0);
    expect(v.maxCount).toBe(4);
    expect(v.oneAway).toBe(false);
    expect(v.duplicate).toBe(false);
  });

  it('flags a 3+1 pick as one-away, not correct', () => {
    const v = classifyGuess([0, 1, 2, 4], deck, new Set());
    expect(v.correct).toBe(false);
    expect(v.oneAway).toBe(true);
    expect(v.maxCount).toBe(3);
    expect(v.themeIdx).toBe(-1);
  });

  it('treats a 2+2 split as wrong but not one-away', () => {
    const v = classifyGuess([0, 1, 4, 5], deck, new Set());
    expect(v.correct).toBe(false);
    expect(v.oneAway).toBe(false);
    expect(v.maxCount).toBe(2);
  });

  it('reports themesPicked in the order the ids were passed', () => {
    expect(classifyGuess([4, 0, 8, 1], deck, new Set()).themesPicked).toEqual([1, 0, 2, 0]);
  });

  it('marks an exact-repeat guess as a duplicate, regardless of pick order', () => {
    const first = classifyGuess([3, 1, 2, 0], deck, new Set());
    expect(first.signature).toBe('0,1,2,3');
    const repeat = classifyGuess([0, 1, 2, 3], deck, new Set([first.signature]));
    expect(repeat.duplicate).toBe(true);
  });

  it('uses themeIdx -1 for an id with no loaded track', () => {
    const v = classifyGuess([0, 1, 2, 999], deck, new Set());
    expect(v.themesPicked).toEqual([0, 0, 0, -1]);
    expect(v.correct).toBe(false);
  });
});

describe('shuffle', () => {
  it('returns a permutation — same elements, same length', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input);
    expect(out).toHaveLength(input.length);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it('does not mutate the input array', () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });
});
