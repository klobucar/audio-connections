import { useState } from 'react';
import type { Guess, LoadedTrack, Theme } from '../types';
import { solvedThemeOrder } from './solvedOrder';
import { SolvedTrackRow } from './SolvedTrackRow';

interface MobileEndCardsProps {
  themes: Theme[];
  solvedThemes: Set<number>;
  tracks: LoadedTrack[];
  guessHistory: Guess[];
  won: boolean;
  day: number;
  playingId: number | null;
  onPlay: (id: number) => void;
}

const SIDES = ['A', 'B', 'C', 'D'];

/** Mobile terminal-state surface. Once the game is over (win or loss) the
 *  cramped solved squircles are swapped for this accordion: a status header
 *  plus one card per group, ordered by solve order. One card is expanded at a
 *  time (defaulting to the last group found) revealing its tracks with play
 *  buttons; the rest collapse to a badge + chevron row. The full EndPanel
 *  j-card still renders below this. */
export function MobileEndCards({
  themes,
  solvedThemes,
  tracks,
  guessHistory,
  won,
  day,
  playingId,
  onPlay,
}: MobileEndCardsProps) {
  const order = solvedThemeOrder(guessHistory, solvedThemes);
  // Default the open card to the first in solve order — the player's opening
  // group on a win, or their first genuinely-found group on a loss (the
  // auto-revealed groups sort behind it, so they never steal the default).
  const [openIdx, setOpenIdx] = useState<number | null>(order[0] ?? null);

  if (order.length === 0) return null;

  const sidesDone = guessHistory.filter((g) => g.correct).length;
  const headline = won ? 'Mixtape Mastered' : 'Out of Tape';
  const summary = won
    ? '4/4 sides · play to hear them again'
    : `Recovered ${sidesDone}/4 sides · play to hear them`;

  return (
    <div className={`mobile-end ${won ? 'win' : 'loss'}`} data-testid="mobile-end">
      <div className="mobile-end-status">
        <span className="mobile-end-status-light" aria-hidden="true" />
        <div className="mobile-end-status-text">
          <span className="mobile-end-headline">{headline}</span>
          <span className="mobile-end-summary">{summary}</span>
        </div>
        <span className="mobile-end-day">Day {day}</span>
      </div>

      <div className="mobile-end-cards">
        {order.map((themeIdx) => {
          const themeTracks = tracks.filter((t) => t.themeIdx === themeIdx);
          const isOpen = openIdx === themeIdx;
          const panelId = `mobile-end-panel-${themeIdx}`;
          return (
            <div
              key={themeIdx}
              className={`mobile-end-card theme-${themeIdx}${isOpen ? ' open' : ''}`}
              data-testid={`mobile-end-card-${themeIdx}`}
            >
              <button
                type="button"
                className="mobile-end-card-head"
                onClick={() => setOpenIdx(isOpen ? null : themeIdx)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                data-testid={`mobile-end-card-head-${themeIdx}`}
              >
                <span className="mobile-end-badge" aria-hidden="true">
                  {SIDES[themeIdx]}
                </span>
                <span className="mobile-end-theme">{themes[themeIdx].theme}</span>
                <span className="mobile-end-chevron" aria-hidden="true" />
              </button>
              {isOpen && (
                <div className="mobile-end-card-body" id={panelId}>
                  {themeTracks.map((t, i) => (
                    <SolvedTrackRow
                      key={t.id}
                      track={t}
                      index={i}
                      playing={playingId === t.id}
                      onPlay={onPlay}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
