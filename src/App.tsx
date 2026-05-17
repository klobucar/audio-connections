import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { puzzles, MAX_MISTAKES, isReleased, latestReleasedIndex } from './puzzles';
import { loadCurrentDay, saveCurrentDay } from './storage';
import { deriveDayState, deriveDayStates } from './dayState';
import { formatPuzzleDate } from './format';
import { useAudio } from './hooks/useAudio';
import { useKonami } from './hooks/useKonami';
import { usePuzzleSession } from './hooks/usePuzzleSession';
import { DaySelector } from './components/DaySelector';
import { Countdown } from './components/Countdown';
import { Grid } from './components/Grid';
import { SolvedList } from './components/SolvedList';
import { MistakesDisplay } from './components/MistakesDisplay';
import { Controls } from './components/Controls';
import { EndPanel } from './components/EndPanel';
import { ResetButton } from './components/ResetButton';

const STATUS_TIMEOUT_MS = 2500;

export function App() {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const latestIdx = latestReleasedIndex();
    const latest = puzzles[latestIdx]!;
    const saved = loadCurrentDay();
    if (saved === null) return latestIdx;
    const savedIdx = puzzles.findIndex((p) => p.day === saved);
    if (savedIdx < 0 || !isReleased(puzzles[savedIdx]!)) return latestIdx;

    // Override the saved day only when the player has nothing to come back
    // to: their last day is finished AND a fresh puzzle is waiting. If
    // they're mid-play on the saved day, leave them on it; if the latest
    // is already touched, no surprise switch.
    const savedState = deriveDayState(puzzles[savedIdx]!, latest.day, new Set());
    const savedTerminal =
      savedState.status === 'done' ||
      savedState.status === 'doneMistakes' ||
      savedState.status === 'failed';
    if (!savedTerminal) return savedIdx;
    const latestState = deriveDayState(latest, latest.day, new Set());
    const latestFresh = latestState.status === 'today' || latestState.status === 'unplayed';
    return latestFresh ? latestIdx : savedIdx;
  });

  const [statusMsg, setStatusMsg] = useState('');
  /** Days unlocked at runtime — by Konami (all of them) or by the countdown
   *  ticking past a `releaseAt` (one at a time). Either case adds the day
   *  to this set; nobody reaches into module-level puzzle data anymore. */
  const [unlockedDays, setUnlockedDays] = useState<Set<number>>(() => new Set());
  // Latest released puzzle. Marks the today-ring on a chip in the picker,
  // and the pill uses it to flavor sublines ("Latest puzzle is Day N" when
  // viewing an archive day). Switching days never changes it.
  const todayDay = puzzles[latestReleasedIndex({ unlocked: unlockedDays })]!.day;
  // Per-day status array derived from puzzle list + localStorage. Reseeded on
  // session change so the picker reflects the latest play state without each
  // chip having to subscribe to storage independently.
  const [dayStates, setDayStates] = useState(() => deriveDayStates(puzzles, todayDay, unlockedDays));

  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const puzzle = puzzles[currentIndex]!;

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

  /* ── Wire usePuzzleSession ⇄ useAudio without a hook cycle ──
        Session needs `stopAudio` on correct guess + reset; audio needs
        `tracks` from the session. The forward dep goes session → audio
        directly (audio is declared after session); the back-edge from
        session to audio.stopAudio routes through a stable ref, populated
        by an effect once audio exists. */
  const stopAudioRef = useRef<() => void>(() => {});
  const onStopAudio = useCallback(() => stopAudioRef.current(), []);
  const session = usePuzzleSession(puzzle, { onStatus: setStatus, onStopAudio });
  const audio = useAudio(session.state.tracks);
  useEffect(() => {
    stopAudioRef.current = audio.stopAudio;
  }, [audio.stopAudio]);

  /* ── Switch day ── (session's load effect resets when puzzle.day changes) */
  const switchDay = useCallback(
    (idx: number) => {
      if (idx === currentIndex) return;
      const p = puzzles[idx];
      if (!p || !isReleased(p, { unlocked: unlockedDays })) return;
      audio.stopAudio();
      setCurrentIndex(idx);
    },
    [currentIndex, audio, unlockedDays],
  );

  /* ── Konami code (↑↑↓↓←→←→BA) unlocks every puzzle ── */
  const onKonamiUnlock = useCallback(() => {
    setUnlockedDays(new Set(puzzles.map((p) => p.day)));
    setStatus('🎮 Konami! All puzzles unlocked.');
  }, [setStatus]);
  useKonami(onKonamiUnlock);

  /* ── Countdown announces a day became available naturally ── */
  const onNaturalUnlock = useCallback((day: number) => {
    setUnlockedDays((prev) => {
      if (prev.has(day)) return prev;
      const next = new Set(prev);
      next.add(day);
      return next;
    });
  }, []);

  /* ── Persist current day when puzzle changes ── */
  useEffect(() => {
    saveCurrentDay(puzzle.day);
  }, [puzzle.day]);

  /* ── Recompute per-day statuses from localStorage on every session change.
        usePuzzleSession's persist effect runs first (declared above), so
        localStorage is fresh for the current day. */
  useEffect(() => {
    setDayStates(deriveDayStates(puzzles, todayDay, unlockedDays));
  }, [session.state, todayDay, unlockedDays]);

  const heading = `Audio Connections ${puzzle.day}`;
  const dateText = useMemo(() => formatPuzzleDate(puzzle.date), [puzzle.date]);
  const selectedCount = session.state.selected.size;
  const isLoading = session.state.tracks.length === 0;
  const tilesDisabled = session.state.gameOver || isLoading || session.matchedThemes.size > 0;

  return (
    <div className="app-container">
      <h1 data-testid="puzzle-heading">{heading}</h1>
      <div className="byline">
        by <span data-testid="puzzle-author">{puzzle.author}</span> · <span data-testid="puzzle-date">{dateText}</span>
      </div>
      <DaySelector
        days={dayStates}
        todayDay={todayDay}
        currentDay={puzzle.day}
        onSwitch={(day) => {
          const idx = puzzles.findIndex((p) => p.day === day);
          if (idx >= 0) switchDay(idx);
        }}
      />
      <Countdown puzzles={puzzles} unlockedDays={unlockedDays} onUnlock={onNaturalUnlock} />
      <div className="subtitle">Find four groups of four. Tap to play, "Select" to group.</div>
      <SolvedList themes={puzzle.themes} solvedThemes={session.solvedThemes} tracks={session.state.tracks} />
      {session.state.gameOver && (
        <EndPanel won={session.won} day={puzzle.day} guessHistory={session.state.guessHistory} />
      )}
      <Grid
        tracks={session.state.tracks}
        selected={session.state.selected}
        solvedThemes={session.solvedThemes}
        exitingThemes={session.exitingThemes}
        matchedThemes={session.matchedThemes}
        playingId={audio.playingId}
        playProgress={audio.playProgress}
        notes={session.state.notes}
        disabled={tilesDisabled}
        onPlay={audio.togglePlay}
        onSelect={session.toggleSelect}
        onNoteChange={session.setNote}
      />
      <div className="status" data-testid="status">{statusMsg || session.state.loadStatus}</div>
      <MistakesDisplay mistakes={session.state.mistakes} max={MAX_MISTAKES} />
      <Controls
        selectedCount={selectedCount}
        gameOver={session.state.gameOver}
        won={session.won}
        onDeselect={session.deselectAll}
        onSubmit={session.submit}
      />
      <ResetButton onReset={session.resetPuzzle} />
    </div>
  );
}
