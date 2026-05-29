import { useEffect, useRef } from 'react';
import type { LoadedTrack } from '../types';
import { Tile } from './Tile';

interface GridProps {
  tracks: LoadedTrack[];
  selected: Set<number>;
  solvedThemes: Set<number>;
  exitingThemes: Set<number>;
  matchedThemes: Set<number>;
  playingId: number | null;
  playProgress: number;
  notes: Map<number, string>;
  disabled: boolean;
  cueLimitReached: boolean;
  onPlay: (id: number) => void;
  onSelect: (id: number) => void;
  onNoteChange: (id: number, value: string) => void;
}

export function Grid({
  tracks,
  selected,
  solvedThemes,
  exitingThemes,
  matchedThemes,
  playingId,
  playProgress,
  notes,
  disabled,
  cueLimitReached,
  onPlay,
  onSelect,
  onNoteChange,
}: GridProps) {
  // Keep tiles in the DOM during pulse + fade animations so they can play
  // out before being removed by the solvedThemes filter.
  const visible = tracks.filter(
    (t) =>
      !solvedThemes.has(t.themeIdx) ||
      exitingThemes.has(t.themeIdx) ||
      matchedThemes.has(t.themeIdx),
  );

  const gridRef = useRef<HTMLDivElement>(null);
  const centeredRef = useRef(false);

  // On initial load (and on day switch, which empties then refills the grid),
  // center the horizontal scroll position so the middle columns are visible
  // when the grid is wider than its container.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (visible.length === 0) {
      centeredRef.current = false;
      return;
    }
    if (centeredRef.current) return;
    if (grid.scrollWidth > grid.clientWidth) {
      grid.scrollLeft = (grid.scrollWidth - grid.clientWidth) / 2;
    }
    centeredRef.current = true;
  }, [visible.length]);

  return (
    <div className="bay">
      <div className="grid grid--portrait-tile" data-testid="grid" ref={gridRef}>
        {visible.map((track, idx) => (
          <Tile
            key={track.id}
            track={track}
            index={idx}
            selected={selected.has(track.id)}
            playing={playingId === track.id}
            exiting={exitingThemes.has(track.themeIdx)}
            matched={matchedThemes.has(track.themeIdx)}
            note={notes.get(track.id) ?? ''}
            progress={playingId === track.id ? playProgress : 0}
            disabled={disabled}
            cueLimitReached={cueLimitReached}
            onPlay={() => onPlay(track.id)}
            onSelect={() => onSelect(track.id)}
            onNoteChange={(val) => onNoteChange(track.id, val)}
          />
        ))}
      </div>
    </div>
  );
}
