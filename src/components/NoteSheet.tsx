import { useEffect, useRef } from 'react';

interface NoteSheetProps {
  note: string;
  playing: boolean;
  progress: number;
  onNoteChange: (value: string) => void;
  onPlay: () => void;
  onClose: () => void;
}

/** Mobile-only per-tile note editor. A bottom sheet that pins itself just
 *  above the soft keyboard (via --keyboard-inset) so the text field, a replay
 *  control, and the keyboard share the screen without the grid getting
 *  crushed. Desktop keeps inline-on-tile editing and never opens this. */
export function NoteSheet({
  note,
  playing,
  progress,
  onNoteChange,
  onPlay,
  onClose,
}: NoteSheetProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Open straight into typing so the keyboard comes up immediately.
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const progressPct = Math.min(100, progress * 100);

  return (
    <div className="note-sheet-backdrop" onClick={onClose} data-testid="note-sheet-backdrop">
      <div
        className="note-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Edit title"
        onClick={(e) => e.stopPropagation()}
        data-testid="note-sheet"
      >
        <div className="note-sheet-transport">
          <button
            type="button"
            className={`play-btn${playing ? ' playing' : ''}`}
            // Keep focus on the textarea so tapping play doesn't retract the
            // keyboard; the click still fires to toggle playback.
            onMouseDown={(e) => e.preventDefault()}
            onClick={onPlay}
            aria-label={playing ? 'Pause' : 'Play'}
            data-testid="note-sheet-play"
          >
            <span className="play-btn__face">
              <span className="icon" />
              <span>{playing ? 'STOP' : 'PLAY'}</span>
            </span>
          </button>
          <div className="note-sheet-progress">
            <div className="note-sheet-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <button
            type="button"
            className="note-sheet-close"
            onClick={onClose}
            data-testid="note-sheet-close"
          >
            Done
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className="note-sheet-input"
          placeholder="write title…"
          rows={2}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          // Free-text scratchpad — suppress iOS/iPadOS WebKit's AutoFill
          // accessory bar (passwords/cards/contacts) and the squiggle.
          // autoCapitalize left at the browser default so titles still cap.
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          data-testid="note-sheet-input"
        />
      </div>
    </div>
  );
}
