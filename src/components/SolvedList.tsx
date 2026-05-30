import type { LoadedTrack, Theme } from '../types';
import type { Guess } from '../types';
import { solvedThemeOrder } from './solvedOrder';
import { SolvedTrackRow } from './SolvedTrackRow';

interface SolvedListProps {
  themes: Theme[];
  solvedThemes: Set<number>;
  tracks: LoadedTrack[];
  guessHistory: Guess[];
  playingId: number | null;
  onPlay: (id: number) => void;
}

const SIDES = ['A', 'B', 'C', 'D'];

export function SolvedList({
  themes,
  solvedThemes,
  tracks,
  guessHistory,
  playingId,
  onPlay,
}: SolvedListProps) {
  const order = solvedThemeOrder(guessHistory, solvedThemes);

  return (
    <div className="solved" data-testid="solved">
      {order.map((themeIdx) => {
        const themeTracks = tracks.filter((t) => t.themeIdx === themeIdx);
        return (
          <div
            key={themeIdx}
            className={`solved-row theme-${themeIdx}`}
            data-side={SIDES[themeIdx]}
            data-testid={`solved-row-${themeIdx}`}
          >
            <div className="solved-side-badge" aria-hidden="true">
              SIDE {SIDES[themeIdx]}
            </div>
            <div className="solved-theme">
              <span>{themes[themeIdx].theme}</span>
            </div>
            <div className="solved-tracks">
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
          </div>
        );
      })}
    </div>
  );
}
