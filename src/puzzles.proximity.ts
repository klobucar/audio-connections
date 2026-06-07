// Pure logic for the dev-time "same iTunes id reused too close together" check.
// Split out of vite-plugins/check-puzzles.ts so it can be unit-tested without
// standing up Vite — the plugin is just the filesystem + dev-server glue.
//
// Day numbers and dates are DERIVED from src/schedule.ts (puzzle files are
// content-only), so proximity is measured against the *scheduled* dates, not
// anything stored in the files.
import { resolve, schedule, type ScheduleEntry } from './schedule';

export interface IdOccurrence {
  day: number;
  date: string;
  /** Source filename, for the warning message. */
  file: string;
}

export interface ProximityWarning {
  id: number;
  prev: IdOccurrence;
  cur: IdOccurrence;
  /** Whole days between the two uses. */
  gap: number;
}

function slugOf(entry: ScheduleEntry): string {
  return typeof entry === 'string' ? entry : entry.slug;
}

/** Map each scheduled slug to its derived day/date. resolve() needs a content
 *  map covering every scheduled slug, but the proximity check only wants the
 *  numbers — so feed it empty stub content rather than loading the puzzle
 *  files. Defaults to the live schedule; takes an arg for testing. */
export function scheduledDates(
  entries: readonly ScheduleEntry[] = schedule,
): Map<string, { day: number; date: string }> {
  const stub = new Map(entries.map((e) => [slugOf(e), { author: '', themes: [] }]));
  const out = new Map<string, { day: number; date: string }>();
  for (const p of resolve(entries, stub)) out.set(p.slug, { day: p.day, date: p.date });
  return out;
}

/** Find every iTunes id reused across two puzzles fewer than `warnDays` apart.
 *  `idsBySlug` maps a puzzle slug to the iTunes ids it uses; `dates` is the
 *  slug→day/date map from scheduledDates(). A slug with no scheduled date
 *  (a file not in the schedule) is skipped — it isn't live. Pure. */
export function findProximityWarnings(
  idsBySlug: ReadonlyMap<string, readonly number[]>,
  dates: ReadonlyMap<string, { day: number; date: string }>,
  warnDays: number,
  today?: string,
): ProximityWarning[] {
  const byId = new Map<number, IdOccurrence[]>();
  for (const [slug, ids] of idsBySlug) {
    const when = dates.get(slug);
    if (!when) continue;
    for (const id of ids) {
      const list = byId.get(id) ?? [];
      list.push({ day: when.day, date: when.date, file: `${slug}.ts` });
      byId.set(id, list);
    }
  }

  const warnings: ProximityWarning[] = [];
  for (const [id, list] of byId) {
    if (list.length < 2) continue;
    list.sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1]!;
      const cur = list[i]!;
      const gap = Math.round(
        (new Date(cur.date).getTime() - new Date(prev.date).getTime()) / 86_400_000,
      );
      // If the later occurrence has already released (including today's
      // puzzle), both sides of this pair are historical. Past schedule
      // positions are frozen, so warning here is noise; keep warning only when
      // the later occurrence is still future-dated and actionable.
      if (gap < warnDays && (!today || cur.date > today)) warnings.push({ id, prev, cur, gap });
    }
  }
  return warnings;
}
