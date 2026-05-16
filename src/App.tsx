import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LoadedTrack, Guess } from './types';
import { puzzles, MAX_MISTAKES, isReleased, latestReleasedIndex } from './puzzles';
import { fetchPreviewUrl, sleep } from './itunes';
import { loadState, saveState, clearState, loadCurrentDay, saveCurrentDay } from './storage';
import { useAudio } from './hooks/useAudio';
import { DaySelector } from './components/DaySelector';
import { Countdown } from './components/Countdown';
import { Grid } from './components/Grid';
import { SolvedList } from './components/SolvedList';
import { MistakesDisplay } from './components/MistakesDisplay';
import { Controls } from './components/Controls';
import { EndPanel } from './components/EndPanel';
import { ResetButton } from './components/ResetButton';

const STATUS_TIMEOUT_MS = 2500;

/** Read a duration custom property from `:root` (e.g. `--exit-anim-ms`).
    Accepts CSS `ms` or `s` units; falls back to `fallbackMs` if the var
    isn't readable (SSR or stylesheet not yet attached). */
function readCssDurationMs(prop: string, fallbackMs: number): number {
  if (typeof window === 'undefined') return fallbackMs;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  if (!raw) return fallbackMs;
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallbackMs;
  return raw.endsWith('ms') ? n : n * 1000;
}

const EXIT_ANIM_MS = readCssDurationMs('--exit-anim-ms', 350);
const MATCH_PULSE_MS = readCssDurationMs('--match-pulse-ms', 500);

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

function formatPuzzleDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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

export function App() {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = loadCurrentDay();
    if (saved !== null) {
      const idx = puzzles.findIndex((p) => p.day === saved);
      if (idx >= 0 && isReleased(puzzles[idx]!)) return idx;
    }
    return latestReleasedIndex();
  });
  const [tracks, setTracks] = useState<LoadedTrack[]>([]);
  /** Day that `tracks` and the rest of the gameplay state belong to. Used to
      gate the save-to-localStorage effect so we never write the outgoing day's
      state into the incoming day's slot during a day switch. */
  const [tracksDay, setTracksDay] = useState<number | null>(null);
  const [loadStatus, setLoadStatus] = useState('Loading previews from iTunes…');
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [solvedThemes, setSolvedThemes] = useState<Set<number>>(() => new Set());
  const [exitingThemes, setExitingThemes] = useState<Set<number>>(() => new Set());
  const [matchedThemes, setMatchedThemes] = useState<Set<number>>(() => new Set());
  const [notes, setNotes] = useState<Map<number, string>>(() => new Map());
  const [mistakes, setMistakes] = useState(0);
  const [guessHistory, setGuessHistory] = useState<Guess[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  // Days the player has finished (all themes solved, no mistakes left). Seeded
  // from localStorage so the green ✓ survives reloads.
  const [completedDays, setCompletedDays] = useState<Set<number>>(() => {
    const out = new Set<number>();
    for (const p of puzzles) {
      const s = loadState(p.day);
      if (s && s.gameOver && s.solvedThemes.length === p.themes.length && s.mistakes < MAX_MISTAKES) {
        out.add(p.day);
      }
    }
    return out;
  });

  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guessSigRef = useRef<Set<string>>(new Set());
  const loadGenRef = useRef(0);

  const puzzle = puzzles[currentIndex]!;
  const themes = puzzle.themes;
  const won = solvedThemes.size === themes.length && mistakes < MAX_MISTAKES;

  const { playingId, playProgress, togglePlay, stopAudio } = useAudio(tracks);

  /* ── Status toast ── */
  const setStatus = useCallback((text: string) => {
    setStatusMsg(text);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => {
      setStatusMsg('');
      statusTimerRef.current = null;
    }, STATUS_TIMEOUT_MS);
  }, []);

  useEffect(() => () => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
  }, []);

  /* ── Load tracks (iTunes lookups) + restore persisted state for this day ── */
  useEffect(() => {
    const myGen = ++loadGenRef.current;
    const mock = isMockMode();
    const all = themes.flatMap((t, themeIdx) => t.tracks.map((trk) => ({ themeIdx, ...trk })));

    // Reset state for the incoming puzzle. Persisted state (if any) is reapplied below.
    setTracks([]);
    setTracksDay(null);
    setSelected(new Set());
    setSolvedThemes(new Set());
    setExitingThemes(new Set());
    setMatchedThemes(new Set());
    setNotes(new Map());
    setMistakes(0);
    setGuessHistory([]);
    setGameOver(false);
    guessSigRef.current = new Set();
    setLoadStatus(mock ? '' : 'Loading previews from iTunes…');

    (async () => {
      const previewUrls: (string | null)[] = [];
      for (let i = 0; i < all.length; i++) {
        if (myGen !== loadGenRef.current) return;
        if (!mock) setLoadStatus(`Loading previews… (${i + 1}/${all.length})`);
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

      setLoadStatus(
        loaded.length < all.length
          ? `Only got ${loaded.length}/${all.length} previews — some queries failed.`
          : '',
      );

      const persisted = loadState(puzzle.day);
      const loadedIds = loaded.map((t) => t.id);
      if (persisted && setEqual(persisted.trackOrder, loadedIds)) {
        const byId = new Map(loaded.map((t) => [t.id, t]));
        const ordered = persisted.trackOrder
          .map((id) => byId.get(id))
          .filter((t): t is LoadedTrack => !!t);
        setTracks(ordered);
        setSelected(new Set(persisted.selected));
        setSolvedThemes(new Set(persisted.solvedThemes));
        setNotes(new Map(persisted.notes));
        setMistakes(persisted.mistakes);
        setGuessHistory(persisted.guessHistory);
        setGameOver(persisted.gameOver);
        guessSigRef.current = new Set(persisted.guessSignatures);
      } else {
        setTracks(shuffle(loaded));
      }
      setTracksDay(puzzle.day);
    })();

    return () => {
      loadGenRef.current++;
    };
  }, [themes, puzzle.day]);

  /* ── Persist game state on every change (after tracks have loaded) ── */
  useEffect(() => {
    if (tracks.length === 0) return;
    // Skip while a day switch is in flight: tracksDay marks the day the
    // current tracks + gameplay state belong to. Without this guard the
    // outgoing day's state would briefly satisfy this effect under the
    // incoming day's key.
    if (tracksDay !== puzzle.day) return;
    saveState(puzzle.day, {
      selected: [...selected],
      solvedThemes: [...solvedThemes],
      notes: [...notes],
      mistakes,
      guessHistory,
      gameOver,
      trackOrder: tracks.map((t) => t.id),
      guessSignatures: [...guessSigRef.current],
    });
  }, [puzzle.day, tracksDay, tracks, selected, solvedThemes, notes, mistakes, guessHistory, gameOver]);

  /* ── Selection ── */
  const toggleSelect = useCallback(
    (id: number) => {
      if (gameOver) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else if (next.size < 4) {
          next.add(id);
        }
        return next;
      });
    },
    [gameOver],
  );

  const deselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const setNote = useCallback((id: number, val: string) => {
    setNotes((prev) => {
      const next = new Map(prev);
      next.set(id, val);
      return next;
    });
  }, []);

  /* ── Submit ── */
  const submit = useCallback(() => {
    if (gameOver) return;
    if (selected.size !== 4) return;
    const ids = [...selected];
    const sig = [...ids].sort((a, b) => a - b).join(',');
    if (guessSigRef.current.has(sig)) {
      setStatus('Already guessed!');
      return;
    }
    guessSigRef.current.add(sig);

    const themesPicked = ids.map((id) => {
      const trk = tracks.find((t) => t.id === id);
      return trk?.themeIdx ?? -1;
    });
    const counts = new Map<number, number>();
    for (const t of themesPicked) counts.set(t, (counts.get(t) ?? 0) + 1);
    const maxCount = Math.max(...counts.values());
    const correct = maxCount === 4;
    setGuessHistory((prev) => [...prev, { themes: themesPicked, correct, ids }]);

    if (correct) {
      const themeIdx = themesPicked[0]!;
      const newSolved = new Set(solvedThemes);
      newSolved.add(themeIdx);
      const willWin = newSolved.size === themes.length;
      // Stage 1: pulse the four tiles in the theme color.
      // Pause any currently-playing preview so the match feedback isn't
      // talked over and we don't keep a tile playing once it's removed.
      stopAudio();
      setMatchedThemes(new Set([themeIdx]));
      setSelected(new Set());
      setStatus(willWin ? 'All four solved.' : `Solved: ${themes[themeIdx]!.theme}`);
      // Stage 2: end pulse, slide in the banner, start tile fade-out.
      setTimeout(() => {
        setMatchedThemes(new Set());
        setSolvedThemes(newSolved);
        setExitingThemes(new Set([themeIdx]));
        if (willWin) setGameOver(true);
        // Stage 3: fade complete, remove tiles from grid.
        setTimeout(() => setExitingThemes(new Set()), EXIT_ANIM_MS);
      }, MATCH_PULSE_MS);
    } else {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      if (nextMistakes >= MAX_MISTAKES) {
        setGameOver(true);
        const exiting = new Set<number>();
        const newSolved = new Set(solvedThemes);
        for (let i = 0; i < themes.length; i++) {
          if (!newSolved.has(i)) exiting.add(i);
          newSolved.add(i);
        }
        setExitingThemes(exiting);
        setSolvedThemes(newSolved);
        setSelected(new Set());
        setStatus('Out of mistakes.');
        setTimeout(() => setExitingThemes(new Set()), EXIT_ANIM_MS);
      } else if (maxCount === 3) {
        setStatus('One away…');
      } else {
        setStatus('Not a group. Try again.');
      }
    }
  }, [gameOver, selected, tracks, themes, solvedThemes, mistakes, setStatus, stopAudio]);

  /* ── Switch day ── (load effect resets in-memory state when puzzle.day changes) */
  const switchDay = useCallback(
    (idx: number) => {
      if (idx === currentIndex) return;
      const p = puzzles[idx];
      if (!p || !isReleased(p)) return;
      stopAudio();
      setCurrentIndex(idx);
    },
    [currentIndex, stopAudio],
  );

  /* ── Reset current puzzle (clears persisted state + reshuffles) ── */
  const resetPuzzle = useCallback(() => {
    clearState(puzzle.day);
    stopAudio();
    setSelected(new Set());
    setSolvedThemes(new Set());
    setExitingThemes(new Set());
    setMatchedThemes(new Set());
    setNotes(new Map());
    setMistakes(0);
    setGuessHistory([]);
    setGameOver(false);
    guessSigRef.current = new Set();
    setTracks((prev) => shuffle(prev));
    setStatus('Puzzle reset.');
  }, [puzzle.day, stopAudio, setStatus]);

  /* ── Force re-render (for unlockAll + countdown-driven unlocks) ── */
  const [, forceRender] = useState(0);
  const bump = useCallback(() => forceRender((n) => n + 1), []);

  /* ── Konami code (↑↑↓↓←→←→BA) unlocks every puzzle ── */
  useEffect(() => {
    const SEQUENCE = [
      'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
      'b', 'a',
    ];
    let progress = 0;

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === SEQUENCE[progress]) {
        progress++;
        if (progress === SEQUENCE.length) {
          progress = 0;
          for (const p of puzzles) delete p.releaseAt;
          bump();
          setStatus('🎮 Konami! All puzzles unlocked.');
        }
      } else {
        progress = key === SEQUENCE[0] ? 1 : 0;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bump, setStatus]);

  /* ── Persist current day when puzzle changes ── */
  useEffect(() => {
    saveCurrentDay(puzzle.day);
  }, [puzzle.day]);

  /* ── Recompute completedDays from authoritative state on every change.
        For the current day, the live in-memory state is authoritative; for
        other days, localStorage is. This way a stale in-memory set can never
        drift from the persisted truth, and a Reset on one day correctly drops
        its check without us having to remember to setCompletedDays in
        resetPuzzle. */
  useEffect(() => {
    if (tracksDay !== puzzle.day) return;
    const next = new Set<number>();
    for (const p of puzzles) {
      let isDone: boolean;
      if (p.day === puzzle.day) {
        isDone = gameOver && won;
      } else {
        const s = loadState(p.day);
        isDone = !!(
          s && s.gameOver && s.solvedThemes.length === p.themes.length && s.mistakes < MAX_MISTAKES
        );
      }
      if (isDone) next.add(p.day);
    }
    setCompletedDays((prev) => {
      if (prev.size === next.size && [...prev].every((d) => next.has(d))) return prev;
      return next;
    });
  }, [tracksDay, puzzle.day, gameOver, won]);

  const heading = `Audio Connections ${puzzle.day}`;
  const dateText = useMemo(() => formatPuzzleDate(puzzle.date), [puzzle.date]);
  const selectedCount = selected.size;
  const isLoading = tracks.length === 0;
  const tilesDisabled = gameOver || isLoading || matchedThemes.size > 0;

  return (
    <div className="app-container">
      <h1 data-testid="puzzle-heading">{heading}</h1>
      <div className="byline">
        by <span data-testid="puzzle-author">{puzzle.author}</span> · <span data-testid="puzzle-date">{dateText}</span>
      </div>
      <DaySelector
        puzzles={puzzles}
        currentIndex={currentIndex}
        completedDays={completedDays}
        onSwitch={switchDay}
      />
      <Countdown puzzles={puzzles} onUnlock={bump} />
      <div className="subtitle">Find four groups of four. Tap to play, "Select" to group.</div>
      <SolvedList themes={themes} solvedThemes={solvedThemes} tracks={tracks} />
      {gameOver && (
        <EndPanel won={won} day={puzzle.day} guessHistory={guessHistory} />
      )}
      <Grid
        tracks={tracks}
        selected={selected}
        solvedThemes={solvedThemes}
        exitingThemes={exitingThemes}
        matchedThemes={matchedThemes}
        playingId={playingId}
        playProgress={playProgress}
        notes={notes}
        disabled={tilesDisabled}
        onPlay={togglePlay}
        onSelect={toggleSelect}
        onNoteChange={setNote}
      />
      <div className="status" data-testid="status">{statusMsg || loadStatus}</div>
      <MistakesDisplay mistakes={mistakes} max={MAX_MISTAKES} />
      <Controls
        selectedCount={selectedCount}
        gameOver={gameOver}
        won={won}
        onDeselect={deselectAll}
        onSubmit={submit}
      />
      <ResetButton onReset={resetPuzzle} />
    </div>
  );
}
