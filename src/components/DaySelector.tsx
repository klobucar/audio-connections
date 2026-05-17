import { useEffect, useRef, useState } from 'react';
import type { DayState } from '../types';
import { DayStatusPill } from './DayStatusPill';
import { DayPicker } from './DayPicker';

interface DaySelectorProps {
  days: DayState[];
  todayDay: number;
  currentDay: number;
  onSwitch: (day: number) => void;
}

export function DaySelector({ days, todayDay, currentDay, onSwitch }: DaySelectorProps) {
  const [open, setOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  const prevOpenRef = useRef(open);
  const selected = days.find((d) => d.day === currentDay) ?? days[days.length - 1]!;

  // Restore focus to the pill when the picker closes. Skipped on first render
  // (prevOpenRef seeded with the initial `open`, which is false).
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      pillRef.current?.focus();
    }
    prevOpenRef.current = open;
  }, [open]);

  return (
    <div className="day-pill-wrap">
      <DayStatusPill
        ref={pillRef}
        selected={selected}
        todayDay={todayDay}
        open={open}
        onClick={() => setOpen((v) => !v)}
      />
      <DayPicker
        days={days}
        open={open}
        onClose={() => setOpen(false)}
        onSelect={onSwitch}
      />
    </div>
  );
}
