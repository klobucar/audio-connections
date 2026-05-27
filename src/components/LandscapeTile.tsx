import type { LoadedTrack } from '../types';
import { CassetteDeck } from './CassetteDeck';

interface LandscapeTileProps {
  track: LoadedTrack;
  index: number;
  selected: boolean;
  playing: boolean;
  exiting: boolean;
  matched: boolean;
  note: string;
  progress: number;
  disabled: boolean;
  cueLimitReached: boolean;
  onPlay: () => void;
  onSelect: () => void;
  onNoteChange: (val: string) => void;
}

/** Landscape-oriented cassette tile. Label spans the top, mechanism (twin
 *  reels + tape window) sits on the left, transport buttons stack on the
 *  right. Per HFCassetteB in the design canvas. */
export function LandscapeTile({
  track,
  index,
  selected,
  playing,
  exiting,
  matched,
  note,
  progress,
  disabled,
  cueLimitReached,
  onPlay,
  onSelect,
  onNoteChange,
}: LandscapeTileProps) {
  const tileClass = [
    'tile-l',
    selected && 'selected',
    playing && 'playing',
    exiting && 'exiting',
    matched && 'matched',
    matched && `matched-theme-${track.themeIdx}`,
  ]
    .filter(Boolean)
    .join(' ');

  const progressPct = Math.min(100, progress * 100);

  return (
    <div className={tileClass} data-track-id={track.id} data-testid={`tile-${track.id}`}>
      <div className="tile-l-label">
        <div className="tile-l-track-no">C-90 · TYPE II</div>
        <textarea
          className="tile-l-label-input"
          placeholder="write title…"
          rows={1}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              (e.target as HTMLTextAreaElement).blur();
            }
          }}
          onBlur={(e) => {
            e.target.scrollTop = 0;
          }}
          aria-label={`Note for track ${index + 1}`}
        />
      </div>

      <div className="tile-l-deck-wrap">
        <CassetteDeck playing={playing} progress={progress} />
      </div>

      <div className="tile-l-actions">
        <button
          type="button"
          className={`play-btn${playing ? ' playing' : ''}`}
          onClick={onPlay}
          disabled={disabled}
          aria-label={playing ? 'Pause' : 'Play'}
          data-testid={`play-${track.id}`}
        >
          <span className="icon" />
          <span>{playing ? 'STOP' : 'PLAY'}</span>
        </button>
        <button
          type="button"
          className="select-btn"
          onClick={onSelect}
          disabled={disabled || (cueLimitReached && !selected)}
          data-testid={`select-${track.id}`}
        >
          CUE
        </button>
      </div>

      <div className="tile-progress">
        <div className="tile-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  );
}
