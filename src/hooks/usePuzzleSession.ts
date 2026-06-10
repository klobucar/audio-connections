import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { LoadedTrack, Guess, Puzzle } from '../types';
import { MAX_MISTAKES, isReleased } from '../puzzles';
import { fetchTrackInfo, fetchTrackInfoBatch, fetchPreviewBlobUrl, sleep, type TrackInfo } from '../itunes';
import { SILENT_WAV } from '../mock-audio';
import { loadState, saveState, clearState } from '../storage';
import type { PersistedGameState } from '../storage';
import { EXIT_ANIM_MS, MATCH_PULSE_MS } from '../timings';

export function shuffle<T>(arr: T[]): T[] {
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

const MISSING_PREVIEW_RETRY_DELAY_MS = 2_000;

type TrackInfoLookup = (itunesId: number) => Promise<TrackInfo | null>;
type TrackInfoBatchLookup = (itunesIds: ReadonlyArray<number>) => Promise<Map<number, TrackInfo>>;

interface TrackInfoLoadOptions {
  batchLookup?: TrackInfoBatchLookup;
  lookup?: TrackInfoLookup;
  wait?: (ms: number) => Promise<void>;
  retryDelayMs?: number;
  isStale?: () => boolean;
  onStatus?: (status: string) => void;
}

/** Load every track's iTunes metadata in one batched lookup, then give
 *  transient missing-preview failures one grace retry via individual lookups
 *  before the caller marks the day broken. Returns null only when the owning
 *  load generation went stale. */
export async function loadTrackInfosWithRetry(
  tracks: ReadonlyArray<{ id: number }>,
  options: TrackInfoLoadOptions = {},
): Promise<(TrackInfo | null)[] | null> {
  const batchLookup = options.batchLookup ?? fetchTrackInfoBatch;
  const lookup = options.lookup ?? fetchTrackInfo;
  const wait = options.wait ?? sleep;
  const retryDelayMs = options.retryDelayMs ?? MISSING_PREVIEW_RETRY_DELAY_MS;
  const isStale = options.isStale ?? (() => false);
  const trackInfos: (TrackInfo | null)[] = new Array(tracks.length).fill(null);

  try {
    const infosById = await batchLookup(tracks.map((t) => t.id));
    if (isStale()) return null;
    for (let i = 0; i < tracks.length; i++) {
      trackInfos[i] = infosById.get(tracks[i]!.id) ?? null;
    }
    options.onStatus?.(`Loading previews… (${tracks.length}/${tracks.length})`);
  } catch {
    // Leave everything missing; the individual retry below owns ID-specific
    // logging for anything that still can't produce a preview URL.
  }
  if (isStale()) return null;

  const failed = trackInfos
    .map((info, i) => (info === null ? i : -1))
    .filter((i) => i !== -1);

  if (failed.length > 0) {
    options.onStatus?.(`Retrying missing previews… (${failed.length}/${tracks.length})`);
    await wait(retryDelayMs);
    if (isStale()) return null;

    await Promise.all(
      failed.map(async (i) => {
        const info = await lookup(tracks[i]!.id);
        if (isStale()) return;
        trackInfos[i] = info;
      }),
    );
    if (isStale()) return null;
  }

  return trackInfos;
}

export interface GuessClassification {
  /** Sorted-comma-joined ids — the dedup key for this guess. */
  signature: string;
  /** True when this exact id set was already submitted this session. */
  duplicate: boolean;
  /** themeIdx for each id, in `ids` order; -1 for an id with no loaded track. */
  themesPicked: number[];
  /** Largest number of picked ids sharing a single theme (0 for an empty pick). */
  maxCount: number;
  /** All four picks share one theme. */
  correct: boolean;
  /** Exactly three of four picks share one theme. */
  oneAway: boolean;
  /** The solved theme's index when `correct`; -1 otherwise. */
  themeIdx: number;
}

/** Pure verdict for a submitted guess: duplicate?, right/wrong, one-away, and
 *  the theme it solved. `submit()` turns this into dispatches + status toasts;
 *  keeping the decision separate makes it testable without the animation
 *  timers and React callbacks wrapped around it. */
export function classifyGuess(
  ids: number[],
  tracks: ReadonlyArray<LoadedTrack>,
  priorSignatures: ReadonlySet<string>,
): GuessClassification {
  const sig = signature(ids);
  const themesPicked = ids.map((id) => tracks.find((t) => t.id === id)?.themeIdx ?? -1);
  const counts = new Map<number, number>();
  for (const t of themesPicked) counts.set(t, (counts.get(t) ?? 0) + 1);
  const maxCount = counts.size ? Math.max(...counts.values()) : 0;
  const correct = maxCount === 4;
  return {
    signature: sig,
    duplicate: priorSignatures.has(sig),
    themesPicked,
    maxCount,
    correct,
    oneAway: maxCount === 3,
    themeIdx: correct ? themesPicked[0]! : -1,
  };
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
  /** Save-key identity (slug-id) matching `day`. Threaded alongside `day` so a
   *  save during a day-switch keys off the OUTGOING puzzle's id, not the
   *  incoming prop's — and so a future slug day saves under its slug, never the
   *  reorderable number. Null whenever `day` is. */
  id: string | null;
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
  /** True when load finished but one or more track previews failed to
   *  resolve from iTunes. The puzzle is unplayable in this state — the UI
   *  shows BrokenDayCard instead of the gameboard. Reset on every load. */
  broken: boolean;
  /** iTunes IDs that failed to resolve, in original puzzle order. Used to
   *  pre-fill the GitHub issue body so maintainers can fix without the
   *  player having to dig for IDs. */
  failedTrackIds: number[];
}

export function initialSession(themeCount: number, loadStatus: string): SessionState {
  return {
    day: null,
    id: null,
    loadStatus,
    tracks: [],
    themeStates: Array<ThemeState>(themeCount).fill('unsolved'),
    selected: new Set(),
    notes: new Map(),
    mistakes: 0,
    guessHistory: [],
    guessSignatures: new Set(),
    gameOver: false,
    broken: false,
    failedTrackIds: [],
  };
}

export type Action =
  | { type: 'load-reset'; themeCount: number; loadStatus: string }
  | { type: 'load-status'; status: string }
  | { type: 'load-fresh'; day: number; id: string; themeCount: number; tracks: LoadedTrack[]; loadStatus: string }
  | { type: 'load-restore'; day: number; id: string; themeCount: number; tracks: LoadedTrack[]; persisted: PersistedGameState; loadStatus: string }
  | { type: 'load-broken'; day: number; id: string; themeCount: number; failedTrackIds: number[] }
  | { type: 'toggle-select'; id: number }
  | { type: 'deselect-all' }
  | { type: 'set-note'; id: number; note: string }
  | { type: 'guess-correct-start'; themeIdx: number; themesPicked: number[]; ids: number[] }
  | { type: 'guess-correct-pulse-end'; themeIdx: number }
  | { type: 'guess-correct-exit-end'; themeIdx: number }
  | { type: 'guess-wrong'; themesPicked: number[]; ids: number[] }
  | { type: 'wrong-game-over-exit-end' }
  | { type: 'apply-gains'; gains: Map<number, { gainDb: number }> }
  | { type: 'reset-puzzle'; tracks: LoadedTrack[] };

function addSig(prev: ReadonlySet<string>, ids: number[]): Set<string> {
  const next = new Set(prev);
  next.add(signature(ids));
  return next;
}

export function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'load-reset':
      return initialSession(action.themeCount, action.loadStatus);

    case 'load-status':
      return { ...state, loadStatus: action.status };

    case 'load-fresh':
      return {
        ...initialSession(action.themeCount, action.loadStatus),
        day: action.day,
        id: action.id,
        tracks: action.tracks,
      };

    case 'load-restore': {
      const themeStates = Array<ThemeState>(action.themeCount).fill('unsolved');
      for (const i of action.persisted.solvedThemes) {
        if (i >= 0 && i < themeStates.length) themeStates[i] = 'solved';
      }
      return {
        day: action.day,
        id: action.id,
        loadStatus: action.loadStatus,
        tracks: action.tracks,
        themeStates,
        selected: new Set(action.persisted.selected),
        notes: new Map(action.persisted.notes),
        mistakes: action.persisted.mistakes,
        guessHistory: action.persisted.guessHistory,
        guessSignatures: new Set(action.persisted.guessSignatures),
        gameOver: action.persisted.gameOver,
        broken: false,
        failedTrackIds: [],
      };
    }

    case 'load-broken':
      return {
        ...initialSession(action.themeCount, ''),
        day: action.day,
        id: action.id,
        broken: true,
        failedTrackIds: action.failedTrackIds,
      };

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

    case 'apply-gains': {
      // Paint measured ReplayGain onto the matching tracks, preserving order
      // and every other field. Ids not present are left untouched, and an
      // all-no-op map returns the same state so React skips the re-render.
      if (action.gains.size === 0) return state;
      let changed = false;
      const tracks = state.tracks.map((t) => {
        const g = action.gains.get(t.id);
        if (!g || t.gainDb === g.gainDb) return t;
        changed = true;
        return { ...t, gainDb: g.gainDb };
      });
      return changed ? { ...state, tracks } : state;
    }

    case 'reset-puzzle':
      return {
        ...initialSession(state.themeStates.length, ''),
        day: state.day,
        id: state.id,
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
  /* Blob URLs currently held by `state.tracks`. Revoked when the next load
   *  commits or on unmount, so a day-switch's ~16MB of cached audio doesn't
   *  leak. Stale-gen blobs (created by a superseded load) are revoked
   *  inline in the load effect below. */
  const activeBlobUrlsRef = useRef<string[]>([]);

  /* ── Load tracks (iTunes lookups) + restore persisted state for this day ── */
  useEffect(() => {
    const themes = puzzle.themes;
    const day = puzzle.day;
    // Save-key identity for this puzzle. Legacy day-N → String(day); a slug day
    // → its slug. Threaded into session state so saves key off identity, never
    // the reorderable display number.
    const saveId = puzzle.id ?? String(day);
    const myGen = ++loadGenRef.current;
    const mock = isMockMode();
    const all = themes.flatMap((t, themeIdx) => t.tracks.map((trk) => ({ themeIdx, ...trk })));

    dispatch({
      type: 'load-reset',
      themeCount: themes.length,
      loadStatus: mock ? '' : 'Loading previews from iTunes…',
    });

    (async () => {
      // Kick the measurement-module load WITHOUT awaiting, so its chunk
      // downloads in parallel with the Phase-1 iTunes lookups instead of
      // serializing in front of them. We await it only where it's first used
      // (the Phase-2 prefetch / Phase 2.5 apply). null in mock mode or if the
      // chunk fails to load.
      const rgPromise = mock
        ? null
        : import('../replaygain/runMeasurement').catch(() => null);
      // Warm the worker pool + wasm compile as soon as the module loads — in
      // parallel with Phase 1 — so the first measurement doesn't pay
      // worker-spawn + wasm-instantiate latency once blobs start landing.
      void rgPromise?.then((m) => m?.warmUp());

      let trackInfos: (TrackInfo | null)[] | null;
      if (mock) {
        trackInfos = new Array(all.length).fill(null);
        for (let i = 0; i < all.length; i++) trackInfos[i] = { previewUrl: SILENT_WAV };
      } else {
        // Phase 1 metadata is a single batched iTunes JSONP lookup. If any
        // track is missing from that batch, wait briefly and retry only those
        // IDs individually before declaring the day broken — the hardfail path
        // needs a real missing preview URL, not a one-off lookup wobble.
        trackInfos = await loadTrackInfosWithRetry(all, {
          isStale: () => myGen !== loadGenRef.current,
          onStatus: (status) => dispatch({ type: 'load-status', status }),
        });
      }
      if (myGen !== loadGenRef.current || !trackInfos) return;

      /* If any preview failed to resolve, the puzzle is unplayable — bail
       *  before phase 2 (no point prefetching blobs we can't use) and put
       *  the session into the `broken` state so App renders BrokenDayCard
       *  instead of the gameboard. The failed iTunes IDs flow through to
       *  pre-fill the GitHub issue body for one-click reporting. */
      if (trackInfos.some((info) => info === null)) {
        const failedTrackIds = trackInfos
          .map((info, i) => (info === null ? all[i]!.id : null))
          .filter((id): id is number => id !== null);
        dispatch({
          type: 'load-broken',
          day,
          id: saveId,
          themeCount: themes.length,
          failedTrackIds,
        });
        return;
      }

      /* Phase 2: prefetch the .m4a bytes in parallel so playback is a local
       *  blob: read (no CDN hit, network-drop resilient, no MediaSink
       *  recreate-race on Android Firefox). Each blob is ~1MB → ~16MB total
       *  per day; revoked on day switch by activeBlobUrlsRef below. */
      let cachedCount = 0;
      const total = trackInfos.filter((info): info is TrackInfo => info !== null).length;
      // Resolve the measurement module now (kicked off before Phase 1, so its
      // chunk downloaded in parallel). Used by the per-blob prefetch below and
      // the Phase 2.5 apply.
      const rg = rgPromise ? await rgPromise : null;
      const blobUrls = await Promise.all(
        trackInfos.map(async (info, i) => {
          if (!info || mock) return null;
          const blobUrl = await fetchPreviewBlobUrl(info.previewUrl);
          if (blobUrl && myGen === loadGenRef.current) {
            cachedCount += 1;
            dispatch({
              type: 'load-status',
              status: `Caching audio… (${cachedCount}/${total})`,
            });
            // Kick this track's measurement as soon as its blob lands, so
            // decode+measure overlaps the remaining fetches and the commit work
            // instead of running as a post-commit tail. Warms the cache by
            // iTunes id; bounded by the measurement module's decode semaphore.
            rg?.prefetchMeasurement(all[i]!.id, blobUrl);
          }
          return blobUrl;
        }),
      );

      if (myGen !== loadGenRef.current) {
        for (const u of blobUrls) if (u) URL.revokeObjectURL(u);
        return;
      }

      const loaded: LoadedTrack[] = all
        .map((x, i): LoadedTrack | null => {
          const info = trackInfos[i];
          if (!info) return null;
          const t: LoadedTrack = {
            id: i,
            itunesId: x.id,
            themeIdx: x.themeIdx,
            previewUrl: info.previewUrl,
            artist: x.artist,
            title: x.title,
          };
          if (info.trackViewUrl) t.trackViewUrl = info.trackViewUrl;
          const blobUrl = blobUrls[i];
          if (blobUrl) t.blobUrl = blobUrl;
          if (x.note !== undefined) t.note = x.note;
          return t;
        })
        .filter((t): t is LoadedTrack => t !== null);

      // Commit: revoke the previous day's blobs, install ours.
      for (const u of activeBlobUrlsRef.current) URL.revokeObjectURL(u);
      activeBlobUrlsRef.current = loaded
        .map((t) => t.blobUrl)
        .filter((u): u is string => !!u);

      // Once past the broken-state check above, every preview resolved —
      // load-fresh / load-restore always carries a clean status.
      const loadStatus = '';

      // Future (Konami-unlocked) days are ephemeral: never restore a save for
      // one. None should exist (the persist effect won't write an unreleased
      // day), but gating here keeps an unreleased day always-fresh and ignores
      // any stale save left by an older build — symmetric with that gate.
      const persisted = isReleased(puzzle) ? loadState(saveId) : null;
      const loadedIds = loaded.map((t) => t.id);
      if (persisted && setEqual(persisted.trackOrder, loadedIds)) {
        const byId = new Map(loaded.map((t) => [t.id, t]));
        const ordered = persisted.trackOrder
          .map((id) => byId.get(id))
          .filter((t): t is LoadedTrack => !!t);
        dispatch({
          type: 'load-restore',
          day,
          id: saveId,
          themeCount: themes.length,
          tracks: ordered,
          persisted,
          loadStatus,
        });
      } else {
        dispatch({
          type: 'load-fresh',
          day,
          id: saveId,
          themeCount: themes.length,
          tracks: shuffle(loaded),
          loadStatus,
        });
      }
      // Phase 2.5: apply per-track ReplayGain. The Phase-2 prefetch has been
      // measuring as blobs landed, so this mostly resolves from cache and
      // applies immediately; anything still in flight is shared (no re-decode).
      // Non-blocking, and load-generation guarded so a superseded day's
      // measurements never paint onto the new grid. Mock mode (rg === null) is a
      // no-op.
      if (rg && myGen === loadGenRef.current) {
        rg.runReplayGain(
          loaded.map((t) => ({ gridId: t.id, itunesId: all[t.id]!.id, blobUrl: t.blobUrl })),
          {
            isStale: () => myGen !== loadGenRef.current,
            onGains: (gains) => {
              if (myGen === loadGenRef.current) dispatch({ type: 'apply-gains', gains });
            },
          },
        );
      }
    })();

    return () => {
      loadGenRef.current++;
    };
  }, [puzzle.themes, puzzle.day]);

  /* ── Revoke any still-active blob: URLs on unmount ── */
  useEffect(() => {
    return () => {
      for (const u of activeBlobUrlsRef.current) URL.revokeObjectURL(u);
      activeBlobUrlsRef.current = [];
    };
  }, []);

  /* ── Persist game state on every change ──
        Save under state.day, not puzzle.day. The two diverge briefly during
        a day switch (puzzle prop has updated, state hasn't reset yet); using
        state.day means we save the old day's state under the old day's key,
        which is correct rather than a bleed. When state.day is null
        (post-load-reset, pre-load-fresh), we skip entirely. */
  useEffect(() => {
    if (state.day === null) return;
    // Persist only days released by date. State for a Konami-unlocked future
    // day is deliberately ephemeral: we don't trust future ordering until a
    // puzzle ships, so anything played there is discarded rather than saved
    // under a key a later reshuffle could point at a different puzzle.
    if (!isReleased(puzzle)) return;
    const solvedThemes = state.themeStates
      .map((s, i) => (s === 'exiting' || s === 'solved' ? i : -1))
      .filter((i) => i !== -1);
    saveState(state.id ?? String(state.day), state.day, {
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
    const verdict = classifyGuess(ids, state.tracks, state.guessSignatures);
    if (verdict.duplicate) {
      onStatus('Already guessed!');
      return;
    }
    const { themesPicked } = verdict;

    if (verdict.correct) {
      const themeIdx = verdict.themeIdx;
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
      } else if (verdict.oneAway) {
        onStatus('One away…');
      } else {
        onStatus('Not a group. Try again.');
      }
    }
  }, [state, puzzle.themes, onStatus, onStopAudio]);

  const resetPuzzle = useCallback(() => {
    if (state.day !== null) clearState(state.id ?? String(state.day));
    onStopAudio();
    dispatch({ type: 'reset-puzzle', tracks: shuffle(state.tracks) });
    onStatus('Puzzle reset.');
  }, [state.id, state.day, state.tracks, onStatus, onStopAudio]);

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
