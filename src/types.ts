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
  releaseAt?: string;
  themes: Theme[];
}

export interface LoadedTrack {
  /** Stable index for use as a game ID within a puzzle. */
  id: number;
  themeIdx: number;
  previewUrl: string;
  artist: string;
  title: string;
  note?: string;
}

export interface Guess {
  themes: number[];
  correct: boolean;
  /** Selected track ids for this guess; used to dedup duplicate submissions after a reload. */
  ids: number[];
}
