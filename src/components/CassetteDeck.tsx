import type { CSSProperties } from 'react';

interface CassetteDeckProps {
  playing: boolean;
  /** 0..1 playback progress of the current preview. */
  progress: number;
}

/**
 * The cassette window: twin toothed reels over a mylar tape strip. Each reel
 * reads a `--wind` custom property (px) that sizes the brown tape wound on its
 * hub. Idle, the tape sits mostly on the left reel; while playing it spools
 * left → right in step with the preview's progress.
 */
export function CassetteDeck({ playing, progress }: CassetteDeckProps) {
  const leftWind = playing ? 14 - 7 * progress : 14; // unwinds
  const rightWind = playing ? 7 + 7 * progress : 7; // winds up

  return (
    <div className="cassette-deck">
      <span className="reel left" style={{ '--wind': `${leftWind}px` } as CSSProperties} />
      <span className="reel right" style={{ '--wind': `${rightWind}px` } as CSSProperties} />
      <span className="rec-dot tile-rec" aria-hidden="true" />
    </div>
  );
}
