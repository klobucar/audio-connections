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
