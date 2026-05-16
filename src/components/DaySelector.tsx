import type { Puzzle } from '../types';
import { isReleased } from '../puzzles';

interface DaySelectorProps {
  puzzles: Puzzle[];
  currentIndex: number;
  completedDays: Set<number>;
  unlockedDays: ReadonlySet<number>;
  onSwitch: (idx: number) => void;
}

export function DaySelector({ puzzles, currentIndex, completedDays, unlockedDays, onSwitch }: DaySelectorProps) {
  return (
    <div className="day-selector" data-testid="day-selector">
      {puzzles.map((p, idx) => {
        const released = isReleased(p, { unlocked: unlockedDays });
        const done = completedDays.has(p.day);
        const classes = [
          'day-btn',
          idx === currentIndex && 'active',
          !released && 'locked',
          done && 'done',
        ]
          .filter(Boolean)
          .join(' ');
        const suffix = done ? ' ✓' : !released ? ' 🔒' : '';
        return (
          <button
            key={p.day}
            type="button"
            className={classes}
            disabled={!released}
            title={!released && p.releaseAt ? `Unlocks ${new Date(p.releaseAt).toUTCString()}` : undefined}
            onClick={() => released && onSwitch(idx)}
            data-testid={`day-btn-${p.day}`}
          >
            Day {p.day}{suffix}
          </button>
        );
      })}
    </div>
  );
}
