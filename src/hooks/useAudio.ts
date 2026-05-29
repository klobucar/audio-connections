import { useCallback, useEffect, useRef, useState } from 'react';
import type { LoadedTrack } from '../types';
import { dbToLinear } from '../replaygain/gain';

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

  // Web Audio gain graph, built lazily on first real play so it can be skipped
  // entirely (mock mode / Playwright StubAudio, or browsers without
  // AudioContext). Once built, the reused element is routed through a GainNode
  // for boost-capable, clip-safe ReplayGain. webAudioFailedRef latches a
  // failure so we never retry and just fall back to raw element playback.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const webAudioFailedRef = useRef(false);

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

  // Build (once) the MediaElementSource → GainNode → destination graph around
  // the reused element, returning the GainNode or null when Web Audio can't be
  // used. createMediaElementSource throws on a non-HTMLMediaElement (the
  // Playwright stub) and can only be called once per element, so this is both
  // guarded and latched. Playback otherwise stays on the raw element — the
  // media-key/suppressPause/sink-race logic is untouched.
  const ensureWebAudio = useCallback((audio: HTMLAudioElement): GainNode | null => {
    if (gainNodeRef.current) return gainNodeRef.current;
    if (webAudioFailedRef.current) return null;
    if (typeof HTMLMediaElement === 'undefined' || !(audio instanceof HTMLMediaElement)) {
      return null;
    }
    const Ctor =
      typeof AudioContext !== 'undefined'
        ? AudioContext
        : (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      const ctx = new Ctor();
      const source = ctx.createMediaElementSource(audio);
      const gain = ctx.createGain();
      source.connect(gain).connect(ctx.destination);
      audioCtxRef.current = ctx;
      gainNodeRef.current = gain;
      return gain;
    } catch (e) {
      // Already-sourced element, iOS quirk, etc. Latch off and play raw.
      webAudioFailedRef.current = true;
      console.warn('Web Audio gain unavailable, playing without ReplayGain:', e);
      return null;
    }
  }, []);

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

      // Apply ReplayGain (boost-capable, clip-safe). Best-effort: every failure
      // path falls back to unmodified playback. Set while the element is silent
      // between plays, so there is no click; unity gain until measured.
      const gainNode = ensureWebAudio(audio);
      if (gainNode) {
        const ctx = audioCtxRef.current;
        if (ctx && ctx.state === 'suspended') void ctx.resume(); // on this gesture
        gainNode.gain.value = track.gainDb !== undefined ? dbToLinear(track.gainDb) : 1;
      }

      audio.play().catch((err: unknown) => {
        // AbortError fires when a rapid retoggle supersedes this play —
        // benign, the next play's state is already correct.
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.warn('Audio play failed:', err);
        setPlayingId((cur) => (cur === id ? null : cur));
        setPlayProgress((cur) => (cur === 0 ? cur : 0));
      });
    },
    [tracks, playingId, ensureAudio, ensureWebAudio, stopAudio, expectSelfPause],
  );

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = null;
      loadedSrcRef.current = null;
      // Close the AudioContext once, on unmount only — not per day. Reopening
      // would risk the very sink races the reused element avoids, and
      // createMediaElementSource can't be re-run on the element anyway.
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      gainNodeRef.current = null;
    };
  }, []);

  return { playingId, playProgress, togglePlay, stopAudio };
}
