export interface RawTrack {
  id: number;
  artist: string;
  title: string;
  note?: string;
}

export interface Theme {
  theme: string;
  tracks: RawTrack[];
}

export interface Puzzle {
  day: number;
  date: string;
  author: string;
  releaseAt: string;
  /** Optional puzzle-wide constraint surfaced via the "DJ left a note"
   *  modal on day-load (plus a desktop heading pill). Use for meta-themes
   *  that apply to every track — e.g. "All singing, all dancing" or
   *  "Only #1 hits". Keep it phrase-length; see MAX_CONSTRAINT_LENGTH in
   *  puzzles.ts (currently 80 chars) — a taste cap, not a layout one. */
  constraint?: string;
  themes: Theme[];
}

export interface LoadedTrack {
  /** Stable index for use as a game ID within a puzzle. */
  id: number;
  /** Original iTunes trackId from the puzzle file — for music-service deep
   *  links (Apple Music /song/<id>). Not used by the game state machine. */
  itunesId: number;
  /** Canonical Apple Music URL from iTunes' /lookup response. Preferred over
   *  the /song/<id> shortcut because it includes the album id + `?i=<id>`
   *  query, which highlights the specific track on the album page. Absent
   *  when iTunes didn't return it or in mock mode. */
  trackViewUrl?: string;
  themeIdx: number;
  previewUrl: string;
  /** Blob: URL of the prefetched .m4a. Absent when the prefetch failed or
   *  in mock mode — playback falls back to `previewUrl` (streaming) then. */
  blobUrl?: string;
  artist: string;
  title: string;
  note?: string;
  /** Clip-prevention-capped ReplayGain in dB (positive = boost, negative =
   *  attenuate). Absent until the track's loudness has been measured, or when
   *  measurement is unavailable — playback uses unity gain (0 dB) then. */
  gainDb?: number;
}

export interface Guess {
  themes: number[];
  correct: boolean;
  /** Selected track ids for this guess; used to dedup duplicate submissions after a reload. */
  ids: number[];
}

export type DayStatus =
  | 'today'
  | 'done'
  | 'doneMistakes'
  | 'inProgress'
  | 'failed'
  | 'unplayed'
  | 'locked';

export interface DayState {
  day: number;
  date: string;
  /** ISO timestamp at which a locked day will release. Absent for already-
   *  released days. The picker shows this as a tooltip on locked chips. */
  releaseAt?: string;
  status: DayStatus;
  mistakes: number;
  groupsSolved: number;
  isToday: boolean;
}
