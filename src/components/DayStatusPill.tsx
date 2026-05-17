import { forwardRef } from 'react';
import type { DayState } from '../types';
import { MAX_MISTAKES } from '../puzzles';
import { formatPuzzleDate } from '../format';

interface DayStatusPillProps {
  selected: DayState;
  todayDay: number;
  open: boolean;
  onClick: () => void;
}

function buildText(s: DayState, todayDay: number): { primary: string; subline: string } {
  const lives = MAX_MISTAKES - s.mistakes;
  const mistakesText = s.mistakes === 0 ? 'no mistakes' : `${s.mistakes} mistake${s.mistakes === 1 ? '' : 's'}`;

  if (s.isToday) {
    switch (s.status) {
      case 'today':
        return { primary: 'Latest puzzle', subline: `${formatPuzzleDate(s.date)} · 0/4` };
      case 'inProgress':
        return { primary: 'Latest puzzle', subline: `In progress · ${s.groupsSolved}/4 · ${mistakesText}` };
      case 'done':
        return { primary: 'Latest · solved', subline: '4/4 · no mistakes · come back tomorrow' };
      case 'doneMistakes':
        return { primary: 'Latest · solved', subline: `4/4 · ${mistakesText} · come back tomorrow` };
      case 'failed':
        return { primary: 'Latest · failed', subline: 'All 4 lives used' };
      default:
        return { primary: 'Latest puzzle', subline: formatPuzzleDate(s.date) };
    }
  }
  // archive — the counter chip on the right carries "Day N", so primaries
  // here describe status only and let the counter handle the day number.
  switch (s.status) {
    case 'inProgress':
      return { primary: 'In progress', subline: `${s.groupsSolved}/4 · ${mistakesText} · ${lives} lives left` };
    case 'done':
      return { primary: 'Solved', subline: '4/4 · no mistakes' };
    case 'doneMistakes':
      return { primary: 'Solved', subline: `4/4 · ${mistakesText}` };
    case 'failed':
      return { primary: 'Failed', subline: 'All 4 lives used' };
    case 'locked':
      return { primary: 'Locked', subline: 'Not yet released' };
    case 'unplayed':
    default:
      return { primary: 'Unplayed', subline: `Latest puzzle is Day ${todayDay}` };
  }
}

function dotClass(s: DayState): string {
  switch (s.status) {
    case 'today':
      return 'day-pill-dot-today';
    case 'done':
    case 'doneMistakes':
      return 'day-pill-dot-done';
    case 'inProgress':
      return 'day-pill-dot-inProgress';
    case 'failed':
      return 'day-pill-dot-failed';
    case 'locked':
    case 'unplayed':
    default:
      return 'day-pill-dot-unplayed';
  }
}

export const DayStatusPill = forwardRef<HTMLButtonElement, DayStatusPillProps>(function DayStatusPill(
  { selected, todayDay, open, onClick },
  ref,
) {
  const { primary, subline } = buildText(selected, todayDay);
  return (
    <button
      ref={ref}
      type="button"
      className="day-pill"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={open}
      data-testid="day-selector-pill"
    >
      <span
        className={`day-pill-dot ${dotClass(selected)}`}
        aria-hidden="true"
        data-testid="day-selector-pill-status"
      />
      <span className="day-pill-text">
        <span className="day-pill-primary">{primary}</span>
        <span className="day-pill-subline">{subline}</span>
      </span>
      <span className="day-pill-counter">
        <span data-testid="day-selector-pill-day">Day {selected.day}</span>
        <span aria-hidden="true">▾</span>
      </span>
    </button>
  );
});
