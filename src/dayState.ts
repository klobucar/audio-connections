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
