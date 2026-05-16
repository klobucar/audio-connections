import { useCallback, useEffect, useRef, useState } from 'react';
import type { LoadedTrack } from '../types';

export interface UseAudio {
  /** Track id currently playing, or null when nothing is. */
  playingId: number | null;
  /** Playback progress in [0, 1]. Resets to 0 on stop/start. */
  playProgress: number;
  /** Play `id` if a different track is playing or none is; pause if it's the
   *  one currently playing. Looks up the previewUrl from `tracks`. */
  togglePlay: (id: number) => void;
  /** Pause + tear down the current audio element. Safe to call when nothing
   *  is playing. */
  stopAudio: () => void;
}

/** Manages a single HTMLAudioElement and the visible playback state for a
 *  Tile/Grid. Extracted from App so the gameplay logic and the audio
 *  lifecycle can be reviewed (and broken) independently. */
export function useAudio(tracks: LoadedTrack[]): UseAudio {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
    setPlayProgress(0);
  }, []);

  const togglePlay = useCallback(
    (id: number) => {
      const track = tracks.find((t) => t.id === id);
      if (!track) return;

      const audio = audioRef.current;
      const isThisPlaying =
        audio !== null && playingId === id && !audio.paused && !audio.ended;

      stopAudio();
      if (isThisPlaying) return;

      const next = new Audio(track.previewUrl);
      audioRef.current = next;
      setPlayingId(id);
      setPlayProgress(0);

      next.addEventListener('ended', () => {
        if (audioRef.current === next) {
          stopAudio();
        }
      });
      next.addEventListener('timeupdate', () => {
        if (audioRef.current !== next) return;
        const dur = next.duration || 30;
        setPlayProgress(next.currentTime / dur);
      });
      next.play().catch((err) => {
        console.warn('Audio play failed:', err);
        if (audioRef.current === next) {
          stopAudio();
        }
      });
    },
    [tracks, playingId, stopAudio],
  );

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = null;
    };
  }, []);

  return { playingId, playProgress, togglePlay, stopAudio };
}
