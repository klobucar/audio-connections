import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { puzzles, MAX_MISTAKES, isReleased, latestReleasedIndex } from './puzzles';
import { loadCurrentDay, saveCurrentDay, loadIntroSeenVersion, saveIntroSeenVersion } from './storage';
import { deriveDayState, deriveDayStates, pickInitialDayIndex } from './dayState';
import { formatPuzzleDate } from './format';
import { useAudio } from './hooks/useAudio';
import { useKonami } from './hooks/useKonami';
import { usePuzzleSession } from './hooks/usePuzzleSession';
import { useIsMobile, useOrientation } from './hooks/useOrientation';
import { DaySelector } from './components/DaySelector';
import { Countdown } from './components/Countdown';
import { Grid, type TileShape } from './components/Grid';
import { SolvedList } from './components/SolvedList';
import { SolvedBar } from './components/SolvedBar';
import { MistakesDisplay } from './components/MistakesDisplay';
import { Controls } from './components/Controls';
import { CueTray } from './components/CueTray';
import { MobileActionRow } from './components/MobileActionRow';
import { EndPanel } from './components/EndPanel';
import { ResetButton } from './components/ResetButton';
import { IntroOverlay, INTRO_VERSION } from './components/intro/IntroOverlay';
import { BrokenDayCard } from './components/BrokenDayCard';

const STATUS_TIMEOUT_MS = 10000;

/** Active tile shape on mobile/tablet (< 1024px). Desktop ignores this and
 *  always renders the existing 4×4 portrait-cassette grid. The PoC ships
 *  both shapes — flip this constant to compare. */
const TILE_SHAPE: TileShape = 'portrait';

export function App() {
  const orientation = useOrientation();
  const isMobile = useIsMobile();

  const [currentIndex, setCurrentIndex] = useState(() => {
    const latestIdx = latestReleasedIndex();
    const latestDay = puzzles[latestIdx]!.day;
    return pickInitialDayIndex(
      puzzles,
      latestIdx,
      loadCurrentDay(),
      (p) => isReleased(p),
      (p) => deriveDayState(p, latestDay, new Set()).status,
    );
  });

  const [statusMsg, setStatusMsg] = useState('');
  // Intro carousel is versioned: a returning visitor sees it again whenever
  // INTRO_VERSION outpaces the version they last dismissed. Initialized from
  // storage so a returning visitor never sees a flash of the overlay.
  // `?showintro=1` forces it open regardless of the saved version — handy
  // for design review without having to clear localStorage.
  // `?mock=1` (Playwright) skips the overlay entirely so existing specs
  // don't need to dismiss it before reaching the grid.
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.has('mock')) return false;
    if (params.get('showintro') === '1') return true;
    return loadIntroSeenVersion() < INTRO_VERSION;
  });
  const dismissIntro = useCallback(() => {
    saveIntroSeenVersion(INTRO_VERSION);
    setShowIntro(false);
  }, []);
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
  const isBroken = session.state.broken;
  const isLoading = session.state.tracks.length === 0 && !isBroken;
  const tilesDisabled = session.state.gameOver || isLoading || session.matchedThemes.size > 0;

  // The mobile chrome lives in dedicated regions of the app shell. Chrome
  // row/column axis is parameterized per the PoC handoff — the JSX picks
  // 'horizontal' (portrait) or 'vertical' (landscape) at each call site.
  const hasSolved = session.solvedThemes.size > 0;

  const onDaySwitch = (day: number) => {
    const idx = puzzles.findIndex((p) => p.day === day);
    if (idx >= 0) switchDay(idx);
  };

  // Status toast renders inside whichever chrome region holds the submit
  // button — that's where the player's attention is when they trigger
  // the messages it shows. Always rendered (empty string OK) so the
  // data-testid stays present for tests.
  const statusToast = (
    <div className="status" data-testid="status">
      {statusMsg || session.state.loadStatus}
    </div>
  );

  return (
    <>
      {showIntro && <IntroOverlay onDismiss={dismissIntro} />}
    <div
      className="app-shell"
      data-orientation={orientation}
      data-has-solved={hasSolved ? 'true' : 'false'}
    >
      {/* TOP CHROME — at ≥ 1024px renders the full desktop header; at < 1024px
          renders the mobile variant. Only the active variant is in the DOM
          (avoids duplicate test IDs and stale chrome). */}
      <header className="chrome-top">
        {!isMobile && (
          <div className="chrome-top-desktop">
            <h1 data-testid="puzzle-heading">{heading}</h1>
            <div className="byline">
              by <span data-testid="puzzle-author">{puzzle.author}</span> ·{' '}
              <span data-testid="puzzle-date">{dateText}</span>
            </div>
            <DaySelector
              days={dayStates}
              todayDay={todayDay}
              currentDay={puzzle.day}
              onSwitch={onDaySwitch}
            />
            <Countdown puzzles={puzzles} unlockedDays={unlockedDays} onUnlock={onNaturalUnlock} />
            <div className="subtitle">
              Find four groups of four · PLAY to preview · CUE to mark · SUBMIT when all four are cued
            </div>
          </div>
        )}

        {isMobile && orientation === 'portrait' && (
          <div className="chrome-top-mobile chrome-top-mobile--portrait">
            <h1 className="chrome-title" data-testid="puzzle-heading">
              Audio Connections {puzzle.day}
            </h1>
            <div className="chrome-byline">
              by <span data-testid="puzzle-author">{puzzle.author}</span> ·{' '}
              <span data-testid="puzzle-date">{dateText}</span>
            </div>
            <DaySelector
              days={dayStates}
              todayDay={todayDay}
              currentDay={puzzle.day}
              onSwitch={onDaySwitch}
            />
            <Countdown puzzles={puzzles} unlockedDays={unlockedDays} onUnlock={onNaturalUnlock} />
            {!isBroken && (
              <SolvedBar
                themes={puzzle.themes}
                solvedThemes={session.solvedThemes}
                tracks={session.state.tracks}
                guessHistory={session.state.guessHistory}
                orientation="horizontal"
              />
            )}
          </div>
        )}

        {isMobile && orientation === 'landscape' && (
          <div className="chrome-top-mobile chrome-top-mobile--landscape">
            <div className="chrome-title-group">
              <h1 className="chrome-title-compact" data-testid="puzzle-heading">
                Audio Connections {puzzle.day}
              </h1>
              <span className="chrome-author-compact">
                by <span data-testid="puzzle-author">{puzzle.author}</span>
              </span>
            </div>
            <DaySelector
              days={dayStates}
              todayDay={todayDay}
              currentDay={puzzle.day}
              onSwitch={onDaySwitch}
              compact
            />
          </div>
        )}
      </header>

      {/* LEFT CHROME — landscape only. Vertical SolvedBar. Collapses to 0
          width when nothing's solved so the grid takes the space.
          Suppressed entirely on a broken day (no progress to display). */}
      {isMobile && orientation === 'landscape' && !isBroken && (
        <aside className="chrome-left">
          {hasSolved && (
            <SolvedBar
              themes={puzzle.themes}
              solvedThemes={session.solvedThemes}
              tracks={session.state.tracks}
              guessHistory={session.state.guessHistory}
              orientation="vertical"
            />
          )}
        </aside>
      )}

      {/* MAIN — grid + end panel + (desktop) solved banners. Replaced by
          BrokenDayCard when the day's previews failed to load (one or more
          iTunes IDs went stale). */}
      <main className="chrome-main">
        {isBroken ? (
          <BrokenDayCard day={puzzle.day} failedTrackIds={session.state.failedTrackIds} />
        ) : (
          <>
            <SolvedList
              themes={puzzle.themes}
              solvedThemes={session.solvedThemes}
              tracks={session.state.tracks}
              guessHistory={session.state.guessHistory}
            />
            {session.state.gameOver && (
              <EndPanel
                won={session.won}
                day={puzzle.day}
                guessHistory={session.state.guessHistory}
                author={puzzle.author}
                date={dateText}
              />
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
              tileShape={TILE_SHAPE}
              onPlay={audio.togglePlay}
              onSelect={session.toggleSelect}
              onNoteChange={session.setNote}
            />
          </>
        )}
      </main>

      {/* RIGHT CHROME — landscape only. Vertical cue tray + mistakes +
          deselect/submit stacked, with Erase Tape pinned at the bottom.
          Hidden on a broken day — none of these controls have meaning
          without loaded tracks. */}
      {isMobile && orientation === 'landscape' && !isBroken && (
        <aside className="chrome-right">
          <CueTray
            tracks={session.state.tracks}
            selected={session.state.selected}
            notes={session.state.notes}
            orientation="vertical"
            onDeselect={session.toggleSelect}
          />
          <div className="chrome-right-spacer" />
          {statusToast}
          <MobileActionRow
            mistakes={session.state.mistakes}
            maxMistakes={MAX_MISTAKES}
            selectedCount={selectedCount}
            gameOver={session.state.gameOver}
            won={session.won}
            orientation="vertical"
            onDeselect={session.deselectAll}
            onSubmit={session.submit}
          />
          <ResetButton onReset={session.resetPuzzle} />
        </aside>
      )}

      {/* BOTTOM CHROME — desktop controls at ≥ 1024px; portrait-phone cue
          tray + action row at < 1024px portrait. In landscape the side
          columns carry these, so chrome-bottom is empty. Hidden entirely
          on a broken day (no controls without loaded tracks). */}
      <footer className="chrome-bottom">
        {!isBroken && !isMobile && (
          <div className="chrome-bottom-desktop">
            <MistakesDisplay mistakes={session.state.mistakes} max={MAX_MISTAKES} />
            {statusToast}
            <Controls
              selectedCount={selectedCount}
              gameOver={session.state.gameOver}
              won={session.won}
              onDeselect={session.deselectAll}
              onSubmit={session.submit}
            />
            <ResetButton onReset={session.resetPuzzle} />
          </div>
        )}

        {!isBroken && isMobile && orientation === 'portrait' && (
          <div className="chrome-bottom-mobile">
            <div className="cue-row">
              <CueTray
                tracks={session.state.tracks}
                selected={session.state.selected}
                notes={session.state.notes}
                orientation="horizontal"
                onDeselect={session.toggleSelect}
              />
              <ResetButton onReset={session.resetPuzzle} />
            </div>
            {statusToast}
            <MobileActionRow
              mistakes={session.state.mistakes}
              maxMistakes={MAX_MISTAKES}
              selectedCount={selectedCount}
              gameOver={session.state.gameOver}
              won={session.won}
              orientation="horizontal"
              onDeselect={session.deselectAll}
              onSubmit={session.submit}
            />
          </div>
        )}
      </footer>
    </div>
    </>
  );
}
