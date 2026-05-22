import type { DayState, DayStatus, Puzzle } from './types';
import { loadState } from './storage';
import { MAX_MISTAKES, isReleased } from './puzzles';

export function deriveStatus(
  released: boolean,
  isTodayDay: boolean,
  groupsSolved: number,
  mistakes: number,
): DayStatus {
  if (!released) return 'locked';
  // `failed` must outrank `done`. On loss, the reducer auto-reveals every
  // unsolved theme as a final flourish, so a lost save can have both
  // groupsSolved === 4 AND mistakes === MAX_MISTAKES.
  if (mistakes >= MAX_MISTAKES) return 'failed';
  if (groupsSolved === 4) return mistakes === 0 ? 'done' : 'doneMistakes';
  const started = groupsSolved > 0 || mistakes > 0;
  if (started) return 'inProgress';
  if (isTodayDay) return 'today';
  return 'unplayed';
}

export function deriveDayState(
  p: Puzzle,
  todayDay: number,
  unlockedDays: ReadonlySet<number>,
): DayState {
  const released = isReleased(p, { unlocked: unlockedDays });
  const save = released ? loadState(p.day) : null;
  const groupsSolved = save?.solvedThemes.length ?? 0;
  const mistakes = save?.mistakes ?? 0;
  const isTodayDay = p.day === todayDay;
  return {
    day: p.day,
    date: p.date,
    releaseAt: p.releaseAt,
    status: deriveStatus(released, isTodayDay, groupsSolved, mistakes),
    mistakes,
    groupsSolved,
    isToday: isTodayDay,
  };
}

export function deriveDayStates(
  puzzles: Puzzle[],
  todayDay: number,
  unlockedDays: ReadonlySet<number>,
): DayState[] {
  return puzzles.map((p) => deriveDayState(p, todayDay, unlockedDays));
}

/** Cold-load decision: which puzzle index a visitor lands on. The impure
 *  inputs (saved day, release clock, per-day status) are passed in so the
 *  branching is unit-testable. App wires the real `isReleased`/`deriveDayState`.
 *
 *  Rule: prefer the saved day, but jump to the latest released puzzle only
 *  when the player has nothing to return to — their saved day is finished
 *  AND the latest is still fresh (untouched). Mid-play saves, or a latest
 *  that's already been opened, never trigger a surprise switch. */
export function pickInitialDayIndex(
  puzzles: Puzzle[],
  latestIdx: number,
  savedDay: number | null,
  released: (p: Puzzle) => boolean,
  statusOf: (p: Puzzle) => DayStatus,
): number {
  if (savedDay === null) return latestIdx;
  const savedIdx = puzzles.findIndex((p) => p.day === savedDay);
  if (savedIdx < 0 || !released(puzzles[savedIdx]!)) return latestIdx;

  const savedStatus = statusOf(puzzles[savedIdx]!);
  const savedTerminal =
    savedStatus === 'done' || savedStatus === 'doneMistakes' || savedStatus === 'failed';
  if (!savedTerminal) return savedIdx;

  const latestStatus = statusOf(puzzles[latestIdx]!);
  const latestFresh = latestStatus === 'today' || latestStatus === 'unplayed';
  return latestFresh ? latestIdx : savedIdx;
}
