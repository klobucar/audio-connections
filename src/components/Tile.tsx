import { useEffect, useState } from 'react';
import type { LoadedTrack } from '../types';
import { CassetteDeck } from './CassetteDeck';

export type PeelState = 'idle' | 'armed' | 'revealed';
const ARM_TIMEOUT_MS = 5000;

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
  /** Intro/demo mode: render every visual state but reject pointer + keyboard
   *  input. Differs from `disabled`, which dims the controls. */
  displayOnly?: boolean;
  /** Intro/demo only: drive the peel state from the parent (the click-to-
   *  arm/confirm flow is internal otherwise). Ignored unless set. */
  displayPeelState?: PeelState;
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
  displayOnly = false,
  displayPeelState,
  onPlay,
  onSelect,
  onNoteChange,
}: TileProps) {
  // Prototype: local peel state. First click arms (corner lifted ~20%),
  // second click within ARM_TIMEOUT_MS reveals; otherwise the corner
  // settles back to idle. `displayPeelState` (intro demo only) overrides.
  const [internalPeel, setInternalPeel] = useState<PeelState>('idle');
  const peelState = displayPeelState ?? internalPeel;

  useEffect(() => {
    if (displayPeelState !== undefined) return;
    if (internalPeel !== 'armed') return;
    const t = setTimeout(() => setInternalPeel('idle'), ARM_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [internalPeel, displayPeelState]);

  const onPeelClick = () => {
    setInternalPeel((s) => (s === 'idle' ? 'armed' : s === 'armed' ? 'revealed' : s));
  };

  const peeled = peelState === 'revealed';

  const tileClass = [
    'tile',
    selected && 'selected',
    playing && 'playing',
    exiting && 'exiting',
    matched && 'matched',
    matched && `matched-theme-${track.themeIdx}`,
    displayOnly && 'display-only',
    peelState === 'armed' && 'peel-armed',
    peeled && 'peeled',
  ]
    .filter(Boolean)
    .join(' ');

  const progressPct = Math.min(100, progress * 100);

  return (
    <div
      className={tileClass}
      data-track-id={track.id}
      data-testid={displayOnly ? undefined : `tile-${track.id}`}
      aria-hidden={displayOnly || undefined}
    >
      <span className="tile-screw tl" />
      <span className="tile-screw tr" />
      <span className="tile-screw bl" />
      <span className="tile-screw br" />

      <div className="tile-label-stack">
        <div className="tile-reveal" aria-hidden={!peeled}>
          <div className="tile-reveal-artist">{track.artist}</div>
          <div
            className="tile-reveal-title"
            data-length={track.title.length > 32 ? 'xl' : track.title.length > 22 ? 'lg' : 'md'}
          >
            {track.title}
          </div>
        </div>

        <div className="tile-label">
          <div className="tile-track-no">C-90 · TYPE II</div>
          <textarea
            className="tile-label-input"
            placeholder="write title…"
            rows={2}
            value={note}
            readOnly={displayOnly || peeled}
            tabIndex={displayOnly ? -1 : undefined}
            onChange={displayOnly ? undefined : (e) => onNoteChange(e.target.value)}
            onKeyDown={(e) => {
              // Enter inserts a newline (multi-line notes like "Song\nArtist");
              // focus changes only on click/touch. Escape commits/blurs.
              if (e.key === 'Escape') {
                e.preventDefault();
                (e.target as HTMLTextAreaElement).blur();
              }
            }}
            onBlur={(e) => {
              // Once not editing, show the note from the top so a long title
              // reads from its start rather than scrolled to the caret.
              e.target.scrollTop = 0;
            }}
            aria-label={`Note for track ${index + 1}`}
          />
          <div className="tile-label__flap" aria-hidden="true" />
        </div>

        {!displayOnly && !peeled && (
          <button
            type="button"
            className="tile-label__peel-trigger"
            onClick={onPeelClick}
            aria-label={
              peelState === 'armed'
                ? 'Click again to reveal the answer'
                : 'Peel the label to reveal the answer'
            }
          />
        )}
      </div>

      <CassetteDeck playing={playing} progress={progress} />

      <div className="tile-actions">
        <button
          type="button"
          className={`play-btn${playing ? ' playing' : ''}`}
          onClick={displayOnly ? undefined : onPlay}
          disabled={disabled}
          tabIndex={displayOnly ? -1 : undefined}
          aria-label={playing ? 'Pause' : 'Play'}
          data-testid={displayOnly ? undefined : `play-${track.id}`}
        >
          <span className="icon" />
          <span>{playing ? 'STOP' : 'PLAY'}</span>
        </button>
        <button
          type="button"
          className="select-btn"
          onClick={displayOnly ? undefined : onSelect}
          disabled={disabled}
          tabIndex={displayOnly ? -1 : undefined}
          data-testid={displayOnly ? undefined : `select-${track.id}`}
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
