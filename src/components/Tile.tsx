import { useEffect, useRef } from 'react';
import type { LoadedTrack } from '../types';
import { CassetteDeck } from './CassetteDeck';

interface TileProps {
  track: LoadedTrack;
  index: number;
  selected: boolean;
  playing: boolean;
  exiting: boolean;
  matched: boolean;
  note: string;
  progress: number;
  disabled: boolean;
  onPlay: () => void;
  onSelect: () => void;
  onNoteChange: (val: string) => void;
}

export function Tile({
  track,
  index,
  selected,
  playing,
  exiting,
  matched,
  note,
  progress,
  disabled,
  onPlay,
  onSelect,
  onNoteChange,
}: TileProps) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fillRef.current) {
      fillRef.current.style.width = `${Math.min(100, progress * 100)}%`;
    }
  }, [progress]);

  const tileClass = [
    'tile',
    selected && 'selected',
    playing && 'playing',
    exiting && 'exiting',
    matched && 'matched',
    matched && `matched-theme-${track.themeIdx}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={tileClass} data-track-id={track.id} data-testid={`tile-${track.id}`}>
      <input
        className="tile-label-input"
        type="text"
        placeholder={`Track ${index + 1}`}
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        aria-label={`Note for track ${index + 1}`}
      />
      <CassetteDeck />
      <div className="tile-actions">
        <button
          type="button"
          className={`play-btn${playing ? ' playing' : ''}`}
          onClick={onPlay}
          disabled={disabled}
          aria-label={playing ? 'Pause' : 'Play'}
          data-testid={`play-${track.id}`}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <button
          type="button"
          className="select-btn"
          onClick={onSelect}
          disabled={disabled}
          data-testid={`select-${track.id}`}
        >
          Select
        </button>
      </div>
      <div className="tile-progress">
        <div className="tile-progress-fill" ref={fillRef} />
      </div>
    </div>
  );
}
