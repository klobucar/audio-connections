import { useEffect, useState } from 'react';
import type { Puzzle } from '../types';
import { isReleased } from '../puzzles';

interface CountdownProps {
  puzzles: Puzzle[];
  unlockedDays: ReadonlySet<number>;
  onUnlock: (day: number) => void;
}

function format(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return days > 0
    ? `${days}d ${hours}h ${minutes}m`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function Countdown({ puzzles, unlockedDays, onUnlock }: CountdownProps) {
  const [text, setText] = useState('');

  useEffect(() => {
    let active = true;
    let firedFor: number | null = null;
    function tick() {
      if (!active) return;
      const next = puzzles.find((p) => !isReleased(p, { unlocked: unlockedDays }));
      if (!next || !next.releaseAt) {
        setText('');
        return;
      }
      const ms = new Date(next.releaseAt).getTime() - Date.now();
      if (ms <= 0) {
        setText('');
        if (firedFor !== next.day) {
          firedFor = next.day;
          onUnlock(next.day);
        }
        return;
      }
      setText(`Day ${next.day} unlocks in ${format(ms)}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [puzzles, unlockedDays, onUnlock]);

  return (
    <div className="unlock-countdown" data-testid="countdown">
      {text}
    </div>
  );
}
