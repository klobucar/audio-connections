import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { LoadedTrack, Guess, Puzzle } from '../types';
import { MAX_MISTAKES } from '../puzzles';
import { fetchPreviewUrl, sleep } from '../itunes';
import { loadState, saveState, clearState } from '../storage';
import type { PersistedGameState } from '../storage';
import { EXIT_ANIM_MS, MATCH_PULSE_MS } from '../timings';

/** Silent 1-frame WAV used as a placeholder when running with ?mock=1. */
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function isMockMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('mock');
}

function setEqual(a: ReadonlyArray<number>, b: ReadonlyArray<number>): boolean {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

function signature(ids: number[]): string {
  return [...ids].sort((a, b) => a - b).join(',');
}

/* ─── Per-puzzle session state ──────────────────────────────────────────────
   Everything in `SessionState` belongs to *one* puzzle and resets on day
   switch / reset.

   Theme lifecycle: each theme is in exactly one of four states at any time:

       unsolved ──guess-correct-start──▶ matching
                                            │
                              guess-correct-pulse-end (after pulse)
                                            │
                                            ▼
                                         exiting
                                            │
                              guess-correct-exit-end (after fade)
                                            │
                                            ▼
                                          solved

   Modeling this as one state-per-theme (instead of three parallel Sets)
   means the staged animation is one state machine, not a relay race. The
   Sets the Grid/SolvedList still want are derived from `themeStates` at
   the hook boundary. */

export type ThemeState = 'unsolved' | 'matching' | 'exiting' | 'solved';

export interface SessionState {
  /** Day this state belongs to. Null between a day-switch's load-reset and
   *  the subsequent load-fresh/load-restore. The persist effect uses this
   *  as the storage key, so it's structurally impossible for an outgoing
   *  day's state to be saved under the incoming day's slot. */
  day: number | null;
  loadStatus: string;
  tracks: LoadedTrack[];
  /** Indexed by themeIdx; length equals puzzle.themes.length once loaded. */
  themeStates: ThemeState[];
  selected: Set<number>;
  notes: Map<number, string>;
  mistakes: number;
  guessHistory: Guess[];
  /** Sorted-comma-joined-ids of every guess made this session, used to
   *  short-circuit duplicate submissions. */
  guessSignatures: Set<string>;
  /** True on win OR loss. `mistakes < MAX_MISTAKES` distinguishes the two. */
  gameOver: boolean;
}

function initialSession(themeCount: number, loadStatus: string): SessionState {
  return {
    day: null,
    loadStatus,
    tracks: [],
    themeStates: Array<ThemeState>(themeCount).fill('unsolved'),
    selected: new Set(),
    notes: new Map(),
    mistakes: 0,
    guessHistory: [],
    guessSignatures: new Set(),
    gameOver: false,
  };
}

type Action =
  | { type: 'load-reset'; themeCount: number; loadStatus: string }
  | { type: 'load-status'; status: string }
  | { type: 'load-fresh'; day: number; themeCount: number; tracks: LoadedTrack[]; loadStatus: string }
  | { type: 'load-restore'; day: number; themeCount: number; tracks: LoadedTrack[]; persisted: PersistedGameState; loadStatus: string }
  | { type: 'toggle-select'; id: number }
  | { type: 'deselect-all' }
  | { type: 'set-note'; id: number; note: string }
  | { type: 'guess-correct-start'; themeIdx: number; themesPicked: number[]; ids: number[] }
  | { type: 'guess-correct-pulse-end'; themeIdx: number }
  | { type: 'guess-correct-exit-end'; themeIdx: number }
  | { type: 'guess-wrong'; themesPicked: number[]; ids: number[] }
  | { type: 'wrong-game-over-exit-end' }
  | { type: 'reset-puzzle'; tracks: LoadedTrack[] };

function addSig(prev: ReadonlySet<string>, ids: number[]): Set<string> {
  const next = new Set(prev);
  next.add(signature(ids));
  return next;
}

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'load-reset':
      return initialSession(action.themeCount, action.loadStatus);

    case 'load-status':
      return { ...state, loadStatus: action.status };

    case 'load-fresh':
      return {
        ...initialSession(action.themeCount, action.loadStatus),
        day: action.day,
        tracks: action.tracks,
      };

    case 'load-restore': {
      const themeStates = Array<ThemeState>(action.themeCount).fill('unsolved');
      for (const i of action.persisted.solvedThemes) {
        if (i >= 0 && i < themeStates.length) themeStates[i] = 'solved';
      }
      return {
        day: action.day,
        loadStatus: action.loadStatus,
        tracks: action.tracks,
        themeStates,
        selected: new Set(action.persisted.selected),
        notes: new Map(action.persisted.notes),
        mistakes: action.persisted.mistakes,
        guessHistory: action.persisted.guessHistory,
        guessSignatures: new Set(action.persisted.guessSignatures),
        gameOver: action.persisted.gameOver,
      };
    }

    case 'toggle-select': {
      if (state.gameOver) return state;
      const selected = new Set(state.selected);
      if (selected.has(action.id)) selected.delete(action.id);
      else if (selected.size < 4) selected.add(action.id);
      return { ...state, selected };
    }

    case 'deselect-all':
      return { ...state, selected: new Set() };

    case 'set-note': {
      const notes = new Map(state.notes);
      notes.set(action.id, action.note);
      return { ...state, notes };
    }

    case 'guess-correct-start': {
      const themeStates = state.themeStates.slice();
      themeStates[action.themeIdx] = 'matching';
      return {
        ...state,
        themeStates,
        selected: new Set(),
        guessHistory: [
          ...state.guessHistory,
          { themes: action.themesPicked, correct: true, ids: action.ids },
        ],
        guessSignatures: addSig(state.guessSignatures, action.ids),
      };
    }

    case 'guess-correct-pulse-end': {
      const themeStates = state.themeStates.slice();
      themeStates[action.themeIdx] = 'exiting';
      const allDone = themeStates.every((s) => s === 'exiting' || s === 'solved');
      return { ...state, themeStates, gameOver: state.gameOver || allDone };
    }

    case 'guess-correct-exit-end': {
      const themeStates = state.themeStates.slice();
      if (themeStates[action.themeIdx] === 'exiting') themeStates[action.themeIdx] = 'solved';
      return { ...state, themeStates };
    }

    case 'guess-wrong': {
      const mistakes = state.mistakes + 1;
      const guessHistory: Guess[] = [
        ...state.guessHistory,
        { themes: action.themesPicked, correct: false, ids: action.ids },
      ];
      const guessSignatures = addSig(state.guessSignatures, action.ids);
      if (mistakes < MAX_MISTAKES) {
        return { ...state, mistakes, guessHistory, guessSignatures };
      }
      // Out of mistakes: any theme still in flight (unsolved or mid-pulse)
      // jumps straight to exiting; the wrong-game-over-exit-end action
      // finishes them off after the fade.
      const themeStates = state.themeStates.map((s) =>
        s === 'unsolved' || s === 'matching' ? 'exiting' : s,
      ) as ThemeState[];
      return {
        ...state,
        mistakes,
        guessHistory,
        guessSignatures,
        themeStates,
        selected: new Set(),
        gameOver: true,
      };
    }

    case 'wrong-game-over-exit-end': {
      const themeStates = state.themeStates.map((s) =>
        s === 'exiting' ? 'solved' : s,
      ) as ThemeState[];
      return { ...state, themeStates };
    }

    case 'reset-puzzle':
      return {
        ...initialSession(state.themeStates.length, ''),
        day: state.day,
        tracks: action.tracks,
      };
  }
}

function themeIdxsWhere(themeStates: ThemeState[], predicate: (s: ThemeState) => boolean): Set<number> {
  const out = new Set<number>();
  themeStates.forEach((s, i) => {
    if (predicate(s)) out.add(i);
  });
  return out;
}

export interface UsePuzzleSessionOptions {
  /** Called with a transient toast string ("One away…", "Solved: <theme>",
   *  "Already guessed!", etc.). The hook owns *when* to fire it; the caller
   *  decides how to display + when to clear. */
  onStatus: (text: string) => void;
  /** Called when the session needs to silence any currently-playing preview
   *  (correct guess, reset). The hook stays ignorant of the audio system. */
  onStopAudio: () => void;
}

export interface PuzzleSession {
  state: SessionState;
  /** Themes the player has solved (banner visible). Includes themes that
   *  are mid-fade, since the banner is already shown by then. */
  solvedThemes: Set<number>;
  /** Themes currently mid-fade-out. Subset of solvedThemes. */
  exitingThemes: Set<number>;
  /** Themes currently pulsing right after a correct guess, before the
   *  banner appears. Mutually exclusive with the above two. */
  matchedThemes: Set<number>;
  /** True if the player has won (all themes solved, mistakes < MAX). */
  won: boolean;
  toggleSelect: (id: number) => void;
  deselectAll: () => void;
  setNote: (id: number, val: string) => void;
  submit: () => void;
  resetPuzzle: () => void;
}

/** Owns the per-puzzle state machine, the iTunes preview load, and
 *  localStorage persistence. The caller (App) handles cross-puzzle concerns:
 *  current day, Konami unlocks, completed-day tracking, status toast UI,
 *  audio playback. */
export function usePuzzleSession(puzzle: Puzzle, options: UsePuzzleSessionOptions): PuzzleSession {
  const { onStatus, onStopAudio } = options;
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => initialSession(puzzle.themes.length, 'Loading previews from iTunes…'),
  );

  const loadGenRef = useRef(0);

  /* ── Load tracks (iTunes lookups) + restore persisted state for this day ── */
  useEffect(() => {
    const themes = puzzle.themes;
    const day = puzzle.day;
    const myGen = ++loadGenRef.current;
    const mock = isMockMode();
    const all = themes.flatMap((t, themeIdx) => t.tracks.map((trk) => ({ themeIdx, ...trk })));

    dispatch({
      type: 'load-reset',
      themeCount: themes.length,
      loadStatus: mock ? '' : 'Loading previews from iTunes…',
    });

    (async () => {
      const previewUrls: (string | null)[] = [];
      for (let i = 0; i < all.length; i++) {
        if (myGen !== loadGenRef.current) return;
        if (!mock) {
          dispatch({ type: 'load-status', status: `Loading previews… (${i + 1}/${all.length})` });
        }
        if (mock) {
          previewUrls.push(SILENT_WAV);
        } else {
          previewUrls.push(await fetchPreviewUrl(all[i]!.id));
          if (i < all.length - 1) await sleep(150);
        }
      }
      if (myGen !== loadGenRef.current) return;

      const loaded: LoadedTrack[] = all
        .map((x, i): LoadedTrack | null => {
          const url = previewUrls[i];
          if (!url) return null;
          const t: LoadedTrack = {
            id: i,
            themeIdx: x.themeIdx,
            previewUrl: url,
            artist: x.artist,
            title: x.title,
          };
          if (x.note !== undefined) t.note = x.note;
          return t;
        })
        .filter((t): t is LoadedTrack => t !== null);

      const loadStatus =
        loaded.length < all.length
          ? `Only got ${loaded.length}/${all.length} previews — some queries failed.`
          : '';

      const persisted = loadState(day);
      const loadedIds = loaded.map((t) => t.id);
      if (persisted && setEqual(persisted.trackOrder, loadedIds)) {
        const byId = new Map(loaded.map((t) => [t.id, t]));
        const ordered = persisted.trackOrder
          .map((id) => byId.get(id))
          .filter((t): t is LoadedTrack => !!t);
        dispatch({
          type: 'load-restore',
          day,
          themeCount: themes.length,
          tracks: ordered,
          persisted,
          loadStatus,
        });
      } else {
        dispatch({
          type: 'load-fresh',
          day,
          themeCount: themes.length,
          tracks: shuffle(loaded),
          loadStatus,
        });
      }
    })();

    return () => {
      loadGenRef.current++;
    };
  }, [puzzle.themes, puzzle.day]);

  /* ── Persist game state on every change ──
        Save under state.day, not puzzle.day. The two diverge briefly during
        a day switch (puzzle prop has updated, state hasn't reset yet); using
        state.day means we save the old day's state under the old day's key,
        which is correct rather than a bleed. When state.day is null
        (post-load-reset, pre-load-fresh), we skip entirely. */
  useEffect(() => {
    if (state.day === null) return;
    const solvedThemes = state.themeStates
      .map((s, i) => (s === 'exiting' || s === 'solved' ? i : -1))
      .filter((i) => i !== -1);
    saveState(state.day, {
      selected: [...state.selected],
      solvedThemes,
      notes: [...state.notes],
      mistakes: state.mistakes,
      guessHistory: state.guessHistory,
      gameOver: state.gameOver,
      trackOrder: state.tracks.map((t) => t.id),
      guessSignatures: [...state.guessSignatures],
    });
  }, [state]);

  /* ── Derived view-model sets ── */
  const solvedThemes = useMemo(
    () => themeIdxsWhere(state.themeStates, (s) => s === 'exiting' || s === 'solved'),
    [state.themeStates],
  );
  const exitingThemes = useMemo(
    () => themeIdxsWhere(state.themeStates, (s) => s === 'exiting'),
    [state.themeStates],
  );
  const matchedThemes = useMemo(
    () => themeIdxsWhere(state.themeStates, (s) => s === 'matching'),
    [state.themeStates],
  );

  const won = state.gameOver && state.mistakes < MAX_MISTAKES;

  /* ── Action callbacks ── */
  const toggleSelect = useCallback((id: number) => {
    dispatch({ type: 'toggle-select', id });
  }, []);

  const deselectAll = useCallback(() => {
    dispatch({ type: 'deselect-all' });
  }, []);

  const setNote = useCallback((id: number, val: string) => {
    dispatch({ type: 'set-note', id, note: val });
  }, []);

  const submit = useCallback(() => {
    if (state.gameOver) return;
    if (state.selected.size !== 4) return;
    const ids = [...state.selected];
    const sig = signature(ids);
    if (state.guessSignatures.has(sig)) {
      onStatus('Already guessed!');
      return;
    }

    const themesPicked = ids.map((id) => {
      const trk = state.tracks.find((t) => t.id === id);
      return trk?.themeIdx ?? -1;
    });
    const counts = new Map<number, number>();
    for (const t of themesPicked) counts.set(t, (counts.get(t) ?? 0) + 1);
    const maxCount = Math.max(...counts.values());
    const correct = maxCount === 4;

    if (correct) {
      const themeIdx = themesPicked[0]!;
      const remainingUnsolved = state.themeStates.filter((s) => s !== 'exiting' && s !== 'solved').length;
      const willWin = remainingUnsolved === 1;
      onStopAudio();
      dispatch({ type: 'guess-correct-start', themeIdx, themesPicked, ids });
      onStatus(willWin ? 'All four solved.' : `Solved: ${puzzle.themes[themeIdx]!.theme}`);
      setTimeout(() => {
        dispatch({ type: 'guess-correct-pulse-end', themeIdx });
        setTimeout(() => dispatch({ type: 'guess-correct-exit-end', themeIdx }), EXIT_ANIM_MS);
      }, MATCH_PULSE_MS);
    } else {
      const nextMistakes = state.mistakes + 1;
      dispatch({ type: 'guess-wrong', themesPicked, ids });
      if (nextMistakes >= MAX_MISTAKES) {
        onStatus('Out of mistakes.');
        setTimeout(() => dispatch({ type: 'wrong-game-over-exit-end' }), EXIT_ANIM_MS);
      } else if (maxCount === 3) {
        onStatus('One away…');
      } else {
        onStatus('Not a group. Try again.');
      }
    }
  }, [state, puzzle.themes, onStatus, onStopAudio]);

  const resetPuzzle = useCallback(() => {
    if (state.day !== null) clearState(state.day);
    onStopAudio();
    dispatch({ type: 'reset-puzzle', tracks: shuffle(state.tracks) });
    onStatus('Puzzle reset.');
  }, [state.day, state.tracks, onStatus, onStopAudio]);

  return {
    state,
    solvedThemes,
    exitingThemes,
    matchedThemes,
    won,
    toggleSelect,
    deselectAll,
    setNote,
    submit,
    resetPuzzle,
  };
}
