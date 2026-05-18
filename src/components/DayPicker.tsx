import { useEffect, useMemo, useRef, useState } from 'react';
import type { DayState, DayStatus } from '../types';
import { formatReleaseAt } from '../format';
import { DayChip } from './DayChip';

interface DayPickerProps {
  days: DayState[];
  open: boolean;
  onClose: () => void;
  onSelect: (day: number) => void;
}

type SortMode = 'newest' | 'oldest' | 'unplayed';
const SORT_KEY = 'audio-connections:dayPickerSort';

/** Human-readable status text for screen readers and the legend. Keep keys
 *  in sync with the DayStatus union in types.ts. */
const STATUS_LABEL: Record<DayStatus, string> = {
  today: 'unplayed',
  done: 'solved',
  doneMistakes: 'solved with mistakes',
  inProgress: 'in progress',
  failed: 'failed',
  unplayed: 'unplayed',
  locked: 'locked',
};

function loadSort(): SortMode {
  if (typeof localStorage === 'undefined') return 'newest';
  const v = localStorage.getItem(SORT_KEY);
  return v === 'oldest' || v === 'unplayed' ? v : 'newest';
}

function sortDays(days: DayState[], mode: SortMode): DayState[] {
  if (mode === 'oldest') return [...days].sort((a, b) => a.day - b.day);
  if (mode === 'unplayed') {
    return days.filter((d) => d.status === 'unplayed' || d.status === 'today').sort((a, b) => b.day - a.day);
  }
  return [...days].sort((a, b) => b.day - a.day);
}

/** Hide locked days beyond the first one. Players see "the next puzzle is
 *  coming" without the full release roadmap leaking out. Relies on `days`
 *  being in ascending day order so the kept locked entry is the soonest. */
function hideFutureLocked(days: DayState[]): DayState[] {
  let kept = false;
  return days.filter((d) => {
    if (d.status !== 'locked') return true;
    if (kept) return false;
    kept = true;
    return true;
  });
}

const GRID_COLS = 7;

export function DayPicker({ days, open, onClose, onSelect }: DayPickerProps) {
  const [sort, setSort] = useState<SortMode>(loadSort);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // persist sort preference
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.setItem(SORT_KEY, sort); } catch { /* ignore */ }
  }, [sort]);

  // close on Esc / outside-click. The pill toggles open separately — its own
  // handler runs before this one, so a click on the pill flips state without
  // racing the outside-click check here.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    function onDoc(e: MouseEvent) {
      if (!panelRef.current) return;
      const target = e.target as Node;
      if (panelRef.current.contains(target)) return;
      // pill is outside the panel; let the pill handler decide whether to toggle
      const pill = (e.target as HTMLElement | null)?.closest?.('[data-testid="day-selector-pill"]');
      if (pill) return;
      onClose();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [open, onClose]);

  // focus the close button when the panel opens
  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  const counts = useMemo(() => {
    let solved = 0, failed = 0, inProg = 0, total = 0;
    for (const d of days) {
      if (d.status === 'locked') continue;
      total++;
      if (d.status === 'done' || d.status === 'doneMistakes') solved++;
      else if (d.status === 'failed') failed++;
      else if (d.status === 'inProgress') inProg++;
    }
    return { total, solved, failed, inProg };
  }, [days]);

  const sortedDays = useMemo(() => sortDays(hideFutureLocked(days), sort), [days, sort]);

  function handlePick(day: number, status: DayStatus) {
    if (status === 'locked') return;
    onSelect(day);
    onClose();
  }

  // Arrow keys move focus across the grid; locked chips are skipped in the
  // current direction so focus never lands on a non-actionable target.
  function handleChipKey(e: React.KeyboardEvent<HTMLButtonElement>, idx: number) {
    const total = sortedDays.length;
    let target = -1;
    let step = 0;
    switch (e.key) {
      case 'ArrowRight': target = idx + 1; step = 1; break;
      case 'ArrowLeft':  target = idx - 1; step = -1; break;
      case 'ArrowDown':  target = idx + GRID_COLS; step = GRID_COLS; break;
      case 'ArrowUp':    target = idx - GRID_COLS; step = -GRID_COLS; break;
      case 'Home':       target = 0; step = 1; break;
      case 'End':        target = total - 1; step = -1; break;
      default: return;
    }
    e.preventDefault();
    while (target >= 0 && target < total && sortedDays[target]?.status === 'locked') {
      target += step;
    }
    if (target < 0 || target >= total) return;
    chipRefs.current[target]?.focus();
  }

  return (
    <div
      ref={panelRef}
      className={`day-picker${open ? ' open' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label="Day picker"
      aria-hidden={!open}
      data-testid="day-picker"
    >
      {/* Header */}
      <div className="day-picker-header">
        <div className="day-picker-header-summary">
          <span className="day-picker-header-total">{counts.total} puzzle{counts.total === 1 ? '' : 's'}</span>
          <span className="day-picker-header-counts">
            <span><span className="dot dot-done" />{counts.solved} solved</span>
            {counts.failed > 0 && (
              <span><span className="dot dot-failed" />{counts.failed} failed</span>
            )}
            {counts.inProg > 0 && (
              <span><span className="dot dot-in-progress" />{counts.inProg} in&nbsp;progress</span>
            )}
          </span>
        </div>
        <button
          ref={closeBtnRef}
          type="button"
          className="day-picker-close"
          onClick={onClose}
          aria-label="Close day picker"
          data-testid="day-picker-close"
        >×</button>
      </div>

      {/* Archive grid */}
      <div className="day-picker-section">
        <div className="day-picker-archive-controls">
          <div className="day-picker-sort" role="tablist" aria-label="Sort archive">
            {(['newest', 'oldest', 'unplayed'] as SortMode[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`day-picker-sort-btn${sort === m ? ' active' : ''}`}
                onClick={() => setSort(m)}
                role="tab"
                aria-selected={sort === m}
                data-testid={`day-picker-sort-${m}`}
              >{m}</button>
            ))}
          </div>
        </div>

        <div className="day-picker-grid" data-testid="day-picker-grid">
          {sortedDays.map((d, i) => (
            <DayChip
              key={d.day}
              ref={(el) => { chipRefs.current[i] = el; }}
              day={d.day}
              status={d.status}
              mistakes={d.mistakes}
              isToday={d.isToday}
              size="lg"
              onClick={() => handlePick(d.day, d.status)}
              onKeyDown={(e) => handleChipKey(e, i)}
              ariaLabel={`Day ${d.day} — ${STATUS_LABEL[d.status]}${d.isToday ? ' (latest)' : ''}`}
              title={d.status === 'locked' && d.releaseAt ? `Unlocks ${formatReleaseAt(d.releaseAt)}` : undefined}
            />
          ))}
          {sortedDays.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' }}>
              No unplayed days — you're caught up.
            </div>
          )}
        </div>

        <div className="day-picker-legend">
          {[
            ['today', 'Latest'],
            ['done', 'Solved'],
            ['doneMistakes', 'Solved with mistakes'],
            ['inProgress', 'In progress'],
            ['failed', 'Failed'],
            ['unplayed', 'Unplayed'],
            ['locked', 'Locked'],
          ].map(([status, label]) => (
            <span key={status} className="day-picker-legend-item">
              <DayChip day={0} status={status as DayStatus} mistakes={1} size="sm" showNumber={false} static />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
