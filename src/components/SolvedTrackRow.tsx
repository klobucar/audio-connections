import type { LoadedTrack } from '../types';
import { appleMusicUrl, spotifyUrl } from '../musicLinks';
import { PlayPauseIcon } from './PlayPauseIcon';

interface SolvedTrackRowProps {
  track: LoadedTrack;
  index: number;
  playing: boolean;
  onPlay: (id: number) => void;
}

/** One solved track: a play button (glyph + number + title/artist/note) that
 *  previews the 30s clip, plus the trailing Apple/Spotify deep links. The
 *  links are siblings of the button — not nested inside it — so tapping a
 *  link opens the service instead of toggling playback. Sits on a
 *  theme-colored surface in every caller (desktop SolvedList rows and the
 *  mobile end-card accordion), so it inherits the dark-on-color palette. */
export function SolvedTrackRow({ track, index, playing, onPlay }: SolvedTrackRowProps) {
  return (
    <div className="solved-track-item">
      <button
        type="button"
        className={`solved-track-play${playing ? ' playing' : ''}`}
        onClick={() => onPlay(track.id)}
        aria-pressed={playing}
        aria-label={`${playing ? 'Pause' : 'Play'} "${track.title}" by ${track.artist}`}
        data-testid={`solved-play-${track.id}`}
      >
        <span className="solved-track-glyph">
          <PlayPauseIcon playing={playing} />
        </span>
        <span className="solved-track-no">{String(index + 1).padStart(2, '0')}.</span>
        <span className="solved-track-text">
          <span className="solved-title">{track.title}</span>
          <span className="solved-artist"> — {track.artist}</span>
          {track.note && <span className="solved-note"> ({track.note})</span>}
        </span>
      </button>
      <span className="solved-track-links">
        <a
          className="solved-track-link"
          href={appleMusicUrl(track.itunesId, track.trackViewUrl)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open "${track.title}" by ${track.artist} in Apple Music`}
        >
          Apple
        </a>
        <a
          className="solved-track-link"
          href={spotifyUrl(track.artist, track.title)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Search Spotify for "${track.title}" by ${track.artist}`}
        >
          Spotify
        </a>
      </span>
    </div>
  );
}
