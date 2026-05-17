import { forwardRef } from 'react';
import type { DayStatus } from '../types';

export type DayChipSize = 'sm' | 'md' | 'lg';

interface DayChipProps {
  day: number;
  status: DayStatus;
  isToday?: boolean;
  mistakes?: number;
  size?: DayChipSize;
  onClick?: () => void;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
  /** Hover tooltip (native title). Used for locked chips' release time. */
  title?: string;
  /** Render as a non-interactive swatch (for legend/preview use). */
  static?: boolean;
  /** Show the day number. Off for legend swatches that are pure color samples. */
  showNumber?: boolean;
}

export const DayChip = forwardRef<HTMLButtonElement, DayChipProps>(function DayChip(
  {
    day,
    status,
    isToday = false,
    mistakes = 0,
    size = 'md',
    onClick,
    tabIndex,
    onKeyDown,
    ariaLabel,
    title,
    static: isStatic = false,
    showNumber = true,
  },
  ref,
) {
  const classes = [
    'day-chip',
    `day-chip-${size}`,
    `day-chip-${status}`,
    isToday && status !== 'today' && 'day-chip-today-ring',
    isStatic && 'day-chip-static',
  ]
    .filter(Boolean)
    .join(' ');
  const inner = (
    <>
      {showNumber && <span className="day-chip-num">{day}</span>}
      {status === 'doneMistakes' && mistakes > 0 && (
        <span className="day-chip-mistakes" aria-hidden="true">−{mistakes}</span>
      )}
      {status === 'locked' && (
        <span className="day-chip-lock" aria-hidden="true">🔒</span>
      )}
    </>
  );
  if (isStatic) {
    return (
      <span className={classes} aria-hidden="true">{inner}</span>
    );
  }
  return (
    <button
      ref={ref}
      type="button"
      className={classes}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      disabled={status === 'locked'}
      aria-label={ariaLabel ?? `Day ${day}`}
      title={title}
      data-testid={`day-chip-${day}`}
    >
      {inner}
    </button>
  );
});
