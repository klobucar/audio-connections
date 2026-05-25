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
 *  Tile/Grid. One element is reused across plays — recreating per-press was
 *  causing the cubeb-aaudio sink-recreate race on Firefox Android
 *  (NS_ERROR_DOM_MEDIA_MEDIASINK_ERR), and fresh elements bypass any
 *  cached `blobUrl` on the track. */
export function useAudio(tracks: LoadedTrack[]): UseAudio {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedSrcRef = useRef<string | null>(null);
  // Counts pauses we initiated ourselves (stopAudio, src change while playing).
  // The 'pause' listener decrements this and skips state updates for each one,
  // so only external pauses (OS media keys, etc.) reach the UI sync path.
  // Each increment carries a short TTL via setTimeout — if the paired 'pause'
  // event never arrives (browser quirk, aborted play, pause() on an
  // already-paused element), the suppression decays instead of sitting at
  // >0 forever and silently eating the next external pause. The window
  // covers the asynchronous gap between our self-pause action and the
  // browser's 'pause' dispatch; in practice the event fires in single-digit
  // ms but we allow generously.
  const suppressPauseRef = useRef(0);
  const SUPPRESS_TTL_MS = 250;
  const expectSelfPause = useCallback(() => {
    suppressPauseRef.current++;
    setTimeout(() => {
      if (suppressPauseRef.current > 0) suppressPauseRef.current--;
    }, SUPPRESS_TTL_MS);
  }, []);
  // Tracks which track ID is loaded in the element. Survives an OS pause so
  // the 'play' listener can restore the playing state on OS resume. Cleared
  // by stopAudio and 'ended' — intentional stops that should not be resumed.
  const currentTrackIdRef = useRef<number | null>(null);

  const ensureAudio = useCallback((): HTMLAudioElement => {
    let audio = audioRef.current;
    if (audio) return audio;
    audio = new Audio();
    audio.addEventListener('ended', () => {
      currentTrackIdRef.current = null;
      setPlayingId(null);
      setPlayProgress(0);
    });
    // Sync UI when the OS pauses the element externally (e.g. hardware media
    // keys). The browser calls audio.pause() directly, bypassing React.
    // suppressPauseRef absorbs each intentional pause we fire ourselves so
    // only unexpected pauses reach this branch. currentTrackIdRef is NOT
    // cleared here so the 'play' listener can restore state on OS resume.
    audio.addEventListener('pause', () => {
      if (suppressPauseRef.current > 0) {
        suppressPauseRef.current--;
        return;
      }
      setPlayingId(null);
      setPlayProgress(0);
    });
    // Sync UI when the OS resumes via media key. The browser calls
    // audio.play() directly; currentTrackIdRef holds the ID of the track
    // that was playing before the OS pause. Our own audio.play() calls also
    // fire this event but setPlayingId is idempotent so they are no-ops.
    audio.addEventListener('play', () => {
      if (currentTrackIdRef.current !== null) {
        setPlayingId(currentTrackIdRef.current);
      }
    });
    audio.addEventListener('timeupdate', () => {
      const a = audioRef.current;
      if (!a) return;
      const dur = a.duration || 30;
      setPlayProgress(a.currentTime / dur);
    });
    audioRef.current = audio;
    return audio;
  }, []);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      // Account for the 'pause' event this will fire so the handler skips it.
      expectSelfPause();
      audio.pause();
    }
    // Clear so an OS play event after an intentional stop doesn't restore state.
    currentTrackIdRef.current = null;
    setPlayingId(null);
    setPlayProgress(0);
  }, [expectSelfPause]);

  const togglePlay = useCallback(
    (id: number) => {
      const track = tracks.find((t) => t.id === id);
      if (!track) return;

      const audio = ensureAudio();
      const isThisPlaying = playingId === id && !audio.paused && !audio.ended;
      if (isThisPlaying) {
        stopAudio();
        return;
      }

      const src = track.blobUrl ?? track.previewUrl;
      if (loadedSrcRef.current !== src) {
        // Changing src on a playing element implicitly pauses it and fires
        // 'pause'. Account for that event so the handler skips it.
        if (!audio.paused) expectSelfPause();
        audio.src = src;
        loadedSrcRef.current = src;
      } else {
        // Replaying the same track: rewind. Safe before metadata loads —
        // the seek queues until the source is ready.
        audio.currentTime = 0;
      }
      currentTrackIdRef.current = id;
      setPlayingId(id);
      setPlayProgress(0);

      audio.play().catch((err: unknown) => {
        // AbortError fires when a rapid retoggle supersedes this play —
        // benign, the next play's state is already correct.
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.warn('Audio play failed:', err);
        setPlayingId((cur) => (cur === id ? null : cur));
        setPlayProgress((cur) => (cur === 0 ? cur : 0));
      });
    },
    [tracks, playingId, ensureAudio, stopAudio, expectSelfPause],
  );

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = null;
      loadedSrcRef.current = null;
    };
  }, []);

  return { playingId, playProgress, togglePlay, stopAudio };
}
