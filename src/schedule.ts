/** The maintainer-owned puzzle schedule and the pure resolver that turns it
 *  into dated, numbered puzzles.
 *
 *  Design: see docs/adr/0001-derived-day-scheduling.md. The short version —
 *  puzzle *files* carry content only; this list is the single place that
 *  decides ORDER. Day numbers and release dates are DERIVED here, never
 *  authored in puzzle files. `resolve()` is pure (no wall-clock, no I/O) so it
 *  reproduces identically on every build and is exhaustively unit-testable.
 *  The app loader (src/puzzles.ts) feeds this to `resolve()` at startup.
 */
import type { PuzzleContent } from './types';

export type { PuzzleContent };

/** Date of day 1 — the anchor every auto-assigned date counts from. */
export const LAUNCH_EPOCH = '2026-05-10';

/** A schedule slot pinned to a specific calendar day. */
export interface PinnedScheduleEntry {
  slug: string;
  date: string;
}

/** A schedule slot. The resolver still supports the legacy compact form where
 *  a bare string auto-dates from the previous entry, but the live schedule below
 *  deliberately uses only pinned entries so maintainers can read the calendar
 *  without doing epoch/list-length arithmetic in their heads. */
export type ScheduleEntry = string | PinnedScheduleEntry;

/** A puzzle once the schedule has given it a position in time. */
export interface ResolvedPuzzle {
  /** Stable identity / save key (the file's slug). */
  slug: string;
  /** Derived display number — chronological rank, 1-based. */
  day: number;
  /** Derived calendar date, YYYY-MM-DD. */
  date: string;
  /** Derived ISO release timestamp (midnight UTC of `date`). */
  releaseAt: string;
  content: PuzzleContent;
}

/** Normalize either ScheduleEntry form to `{ slug, pinnedDate? }`. */
function entrySlug(e: ScheduleEntry): string {
  return typeof e === 'string' ? e : e.slug;
}
function entryPinned(e: ScheduleEntry): string | undefined {
  return typeof e === 'string' ? undefined : e.date;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse a YYYY-MM-DD date as a UTC day-count (days since the unix epoch).
 *  Working in integer day-counts keeps all the arithmetic exact and free of
 *  timezone/DST drift — we never touch local time. */
function toDayNumber(date: string): number {
  if (!DATE_RE.test(date)) throw new Error(`Invalid schedule date "${date}" (want YYYY-MM-DD)`);
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const ms = Date.UTC(y, m - 1, d);
  const n = Math.floor(ms / 86_400_000);
  // Round-trip guard: rejects impossible calendar dates like 2026-02-30 that
  // Date.UTC silently rolls over rather than failing on.
  if (fromDayNumber(n) !== date) throw new Error(`Invalid calendar date "${date}"`);
  return n;
}

function fromDayNumber(n: number): string {
  const ms = n * 86_400_000;
  const dt = new Date(ms);
  const y = dt.getUTCFullYear().toString().padStart(4, '0');
  const m = (dt.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = dt.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Resolve a schedule + the available puzzle content into dated, numbered
 *  puzzles. Pure: identical inputs always give identical output.
 *
 *  Rules (see ADR):
 *   1. Pinned dates are reserved up front.
 *   2. Walking the list, a bare entry takes `previousDate + 1 day`, advancing
 *      past any reserved pin date so an auto entry never lands on a pin.
 *   3. The day number is the rank by (resolved date, then list index) — the
 *      list-index tiebreak both makes ordering total and lets two puzzles
 *      deliberately share a date (consecutive numbers, one releaseAt).
 *
 *  Throws on: a scheduled slug with no content; a malformed/impossible date;
 *  an auto entry colliding with another entry's date (only possible when a pin
 *  re-anchors the cursor backwards — the fix is to reorder, so we surface it
 *  rather than silently double-book a number).
 */
export function resolve(
  schedule: readonly ScheduleEntry[],
  contentBySlug: ReadonlyMap<string, PuzzleContent>,
  epoch: string = LAUNCH_EPOCH,
): ResolvedPuzzle[] {
  const epochN = toDayNumber(epoch);

  // Pass 1: reserve every pinned date.
  const reserved = new Set<number>();
  for (const e of schedule) {
    const pin = entryPinned(e);
    if (pin !== undefined) reserved.add(toDayNumber(pin));
  }

  // Pass 2: assign each entry a date in list order.
  interface Assigned {
    slug: string;
    dateN: number;
    index: number;
    pinned: boolean;
  }
  const assigned: Assigned[] = [];
  const seenSlugs = new Set<string>();
  let prev: number | null = null;

  schedule.forEach((e, index) => {
    const slug = entrySlug(e);
    if (seenSlugs.has(slug)) {
      throw new Error(`Schedule lists slug "${slug}" more than once`);
    }
    seenSlugs.add(slug);

    const pin = entryPinned(e);
    let dateN: number;
    if (pin !== undefined) {
      dateN = toDayNumber(pin);
    } else {
      let candidate = prev === null ? epochN : prev + 1;
      while (reserved.has(candidate)) candidate++;
      dateN = candidate;
    }
    assigned.push({ slug, dateN, index, pinned: pin !== undefined });
    prev = dateN;
  });

  // Collision guard: an *auto* entry must not share a date with any other
  // entry. (Pinned entries may deliberately share a date — that is two-per-day.)
  const byDate = new Map<number, Assigned[]>();
  for (const a of assigned) {
    const list = byDate.get(a.dateN) ?? [];
    list.push(a);
    byDate.set(a.dateN, list);
  }
  for (const [dateN, list] of byDate) {
    if (list.length > 1 && list.some((a) => !a.pinned)) {
      const slugs = list.map((a) => a.slug).join(', ');
      throw new Error(
        `Auto-dating collided on ${fromDayNumber(dateN)} (${slugs}). A pin re-anchored ` +
          `the sequence onto an already-used day — reorder the schedule or pin the conflicting entry.`,
      );
    }
  }

  // Number by (date, list index). Stable, total, and two-per-day-friendly.
  const ranked = [...assigned].sort((a, b) =>
    a.dateN !== b.dateN ? a.dateN - b.dateN : a.index - b.index,
  );

  return ranked.map((a, i) => {
    const content = contentBySlug.get(a.slug);
    if (!content) {
      throw new Error(`Scheduled slug "${a.slug}" has no puzzle file/content`);
    }
    const date = fromDayNumber(a.dateN);
    return {
      slug: a.slug,
      day: i + 1,
      date,
      releaseAt: `${date}T00:00:00Z`,
      content,
    };
  });
}

/** The live schedule — the maintainer-owned calendar. The loader (puzzles.ts)
 *  feeds this to resolve() to derive each puzzle's number and release timestamp;
 *  the puzzle FILES carry content only and decide neither.
 *
 *  Slugs are the file stems in src/puzzles/. Identity is the stem, not the
 *  number — a file's name is fixed for life while its display number is derived
 *  from list position. The released back-catalogue (days 1..22) keeps `day-N`
 *  stems so their numeric save keys stay live; unreleased puzzles use author
 *  slugs (`<github-handle>-N`), which become their save keys via idFromSlug.
 *  NEVER rename a released day's file — it orphans every player's save.
 *
 *  Every live row has an explicit date. That makes schedule edits local and
 *  auditable: slot a backlog puzzle by choosing its date here, then run
 *  `npm run schedule:preview` to verify the derived day number and warnings. */
export const schedule: PinnedScheduleEntry[] = [
  { slug: 'day-1', date: '2026-05-10' },
  { slug: 'day-2', date: '2026-05-11' },
  { slug: 'day-3', date: '2026-05-12' },
  { slug: 'day-4', date: '2026-05-13' },
  { slug: 'day-5', date: '2026-05-14' },
  { slug: 'day-6', date: '2026-05-15' },
  { slug: 'day-7', date: '2026-05-16' },
  { slug: 'day-8', date: '2026-05-17' },
  { slug: 'day-9', date: '2026-05-18' },
  { slug: 'day-10', date: '2026-05-19' },
  { slug: 'day-11', date: '2026-05-20' },
  { slug: 'day-12', date: '2026-05-21' },
  { slug: 'day-13', date: '2026-05-22' },
  { slug: 'day-14', date: '2026-05-23' },
  { slug: 'day-15', date: '2026-05-24' },
  { slug: 'day-16', date: '2026-05-25' },
  { slug: 'day-17', date: '2026-05-26' },
  { slug: 'day-18', date: '2026-05-27' },
  { slug: 'day-19', date: '2026-05-28' },
  { slug: 'day-20', date: '2026-05-29' },
  { slug: 'day-21', date: '2026-05-30' },
  { slug: 'day-22', date: '2026-05-31' },
  { slug: 'bojanrajkovic-1', date: '2026-06-01' },
  { slug: 'klobucar-1', date: '2026-06-02' },
  { slug: 'farana-1', date: '2026-06-03' },
  { slug: 'rob-tetrel-1', date: '2026-06-04' },
  { slug: 'robchahin-1', date: '2026-06-05' },
  { slug: 'klobucar-2', date: '2026-06-06' },
  { slug: 'gitblight1-1', date: '2026-06-07' },
  { slug: 'rob-tetrel-2', date: '2026-06-08' },
  { slug: 'bojanrajkovic-2', date: '2026-06-09' },
  { slug: 'klobucar-3', date: '2026-06-10' },
  { slug: 'farana-2', date: '2026-06-11' },
  { slug: 'farana-3', date: '2026-06-12' },
  { slug: 'tqbf-1', date: '2026-06-13' },
  { slug: 'bojanrajkovic-3', date: '2026-06-14' },
  { slug: 'tqbf-3', date: '2026-06-15' },
  { slug: 'klobucar-5', date: '2026-06-16' },
  { slug: 'bojanrajkovic-5', date: '2026-06-17' },
  { slug: 'klobucar-4', date: '2026-06-18' }, // held (author request): wants this as day 40 in the 6/18 slot
  { slug: 'sjudson-1', date: '2026-06-22' },
  { slug: 'bojanrajkovic-6', date: '2026-06-24' },
  { slug: 'robchahin-3', date: '2026-06-27' },
  { slug: 'tqbf-4', date: '2026-06-28' },
  { slug: 'robchahin-2', date: '2026-06-29' },
  { slug: 'tqbf-2', date: '2026-06-30' }, // held date (author request)
  { slug: 'bojanrajkovic-4', date: '2026-07-14' }, // held date (author request)
];

/** Slugs for puzzle files that exist but are not scheduled yet. These are
 *  valid merged backlog entries: they are reviewed and proximity-checked once
 *  slotted, but they do not get a day/date or appear in the playable calendar. */
export function findBacklogSlugs(
  allSlugs: Iterable<string>,
  entries: readonly ScheduleEntry[] = schedule,
): string[] {
  const scheduled = new Set(entries.map(entrySlug));
  const backlog = new Set<string>();
  for (const slug of allSlugs) {
    if (!scheduled.has(slug)) backlog.add(slug);
  }
  return [...backlog].sort((a, b) => a.localeCompare(b));
}

/** Save-key identity from a slug. A legacy `day-N` slug collapses to the bare
 *  number string so existing saves (keyed `audio-connections:day:21`) keep
 *  working untouched; any other slug is its own id. Exact `^day-N$` match only,
 *  so an author handle that merely starts with "day" is never mistaken for a
 *  legacy file. Lives here (not the loader) so it stays pure and the schedule
 *  tests can assert save-key stability across a reslug. */
export function idFromSlug(slug: string): string {
  const m = /^day-(\d+)$/.exec(slug);
  return m ? m[1]! : slug;
}

/** A released puzzle whose identity/position changed between two schedules. */
export interface PastDayViolation {
  slug: string;
  /** Number + date in the baseline (the already-released state). */
  before: { day: number; date: string };
  /** Number + date now, or null if the slug is gone from the new schedule. */
  after: { day: number; date: string } | null;
  reason: 'renumbered' | 'redated' | 'removed';
}

/** Compare two resolved schedules and report any ALREADY-RELEASED puzzle whose
 *  identity moved. A puzzle counts as released when its date is on or before
 *  `today` (UTC, YYYY-MM-DD) — note this includes today's just-launched puzzle,
 *  whose number/date players have already seen.
 *
 *  This is the orphaned-saves + public-record guard. A released `day-N` file's
 *  save key is its bare number and its (number, date) are a matter of record;
 *  an author-slug day freezes the same way once it ships. Renaming a released
 *  file (its slug vanishes → `removed`), reordering one (`renumbered`), or
 *  shifting a pin across it (`redated`) all surface here. CONTENT edits — swap
 *  a broken track, fix a theme — do NOT change (slug, day, date) and so never
 *  trip this, which is exactly the current-day fix-up workflow we must allow.
 *
 *  Pure (no clock, no I/O): the caller passes `today` and the two resolved
 *  lists, so this is deterministic and unit-testable. The wall-clock + git
 *  read live in the CI wrapper, never here. `before` is the baseline
 *  (origin/main); `after` is the proposed schedule (PR head / working tree). */
export function diffPastDays(
  before: readonly ResolvedPuzzle[],
  after: readonly ResolvedPuzzle[],
  today: string,
): PastDayViolation[] {
  if (!DATE_RE.test(today)) throw new Error(`Invalid "today" date "${today}" (want YYYY-MM-DD)`);
  const afterBySlug = new Map(after.map((p) => [p.slug, p]));
  const violations: PastDayViolation[] = [];
  for (const b of before) {
    if (b.date > today) continue; // not yet released — free to move
    const a = afterBySlug.get(b.slug);
    if (!a) {
      violations.push({ slug: b.slug, before: { day: b.day, date: b.date }, after: null, reason: 'removed' });
    } else if (a.date !== b.date) {
      violations.push({ slug: b.slug, before: { day: b.day, date: b.date }, after: { day: a.day, date: a.date }, reason: 'redated' });
    } else if (a.day !== b.day) {
      violations.push({ slug: b.slug, before: { day: b.day, date: b.date }, after: { day: a.day, date: a.date }, reason: 'renumbered' });
    }
  }
  return violations;
}

/** A maintainer-facing warning about the shape of the schedule. Advisory, not
 *  fatal — these flag things worth a look, not broken state. */
export interface ScheduleWarning {
  kind: 'gap' | 'thin-runway' | 'past-unreleased';
  message: string;
}

/** Default runway floor: warn when fewer than this many future puzzles remain.
 *  A healthy state is a shallow committed frontier refilled from a deeper
 *  backlog, so a low number here is the prompt to slot more, not an error. */
export const DEFAULT_RUNWAY = 5;
/** Default gap threshold: flag a stretch of this many empty calendar days or
 *  more between two consecutive scheduled dates. */
export const DEFAULT_GAP_DAYS = 2;

export interface PreviewOptions {
  /** Min future puzzles before a thin-runway warning. Default DEFAULT_RUNWAY. */
  runway?: number;
  /** Empty-day run that triggers a gap warning. Default DEFAULT_GAP_DAYS. */
  gapDays?: number;
}

/** Analyse a resolved schedule against `today` and surface maintainer warnings.
 *  Pure (caller supplies `today`, YYYY-MM-DD UTC) so it's deterministic and
 *  unit-testable; the CLI wrapper (schedule:preview) supplies the clock and
 *  renders the table. Three checks:
 *    - gap: ≥ gapDays empty calendar days between consecutive puzzles, looking
 *      only from today onward (historical gaps are immutable, not actionable).
 *    - thin-runway: fewer than `runway` future-dated (> today) puzzles left.
 *    - past-unreleased: an unreleased puzzle whose date is already < today,
 *      i.e. it would release instantly / in the past — almost always a stale
 *      pin that needs re-dating. (resolve() output is date-sorted, so "the
 *      earliest unreleased is in the past" is the meaningful case.) */
export function previewWarnings(
  resolved: readonly ResolvedPuzzle[],
  today: string,
  opts: PreviewOptions = {},
): ScheduleWarning[] {
  if (!DATE_RE.test(today)) throw new Error(`Invalid "today" date "${today}" (want YYYY-MM-DD)`);
  const runway = opts.runway ?? DEFAULT_RUNWAY;
  const gapDays = opts.gapDays ?? DEFAULT_GAP_DAYS;
  const todayN = toDayNumber(today);
  const warnings: ScheduleWarning[] = [];

  // thin-runway: how many puzzles are still ahead of today.
  const future = resolved.filter((p) => toDayNumber(p.date) > todayN);
  if (future.length < runway) {
    warnings.push({
      kind: 'thin-runway',
      message:
        `Only ${future.length} future puzzle(s) scheduled (want ≥ ${runway}). ` +
        `Slot more from the backlog to keep the frontier ahead of today (${today}).`,
    });
  }

  // gap: scan consecutive pairs whose later date is today or beyond. An empty
  // run of N days shows as a date delta of N+1.
  for (let i = 1; i < resolved.length; i++) {
    const prev = resolved[i - 1]!;
    const cur = resolved[i]!;
    const prevN = toDayNumber(prev.date);
    const curN = toDayNumber(cur.date);
    if (curN <= todayN) continue; // gap is in the past — immutable, skip
    const empty = curN - prevN - 1;
    if (empty >= gapDays) {
      warnings.push({
        kind: 'gap',
        message:
          `${empty} empty day(s) between ${prev.slug} (${prev.date}) and ${cur.slug} (${cur.date}). ` +
          `Slot puzzles BEFORE ${cur.slug} to fill them, or this window has no puzzle.`,
      });
    }
  }

  // past-unreleased: the frontier has fallen behind — the latest scheduled date
  // is before today, so there is no puzzle for today or beyond.
  const last = resolved[resolved.length - 1];
  if (last && toDayNumber(last.date) < todayN) {
    warnings.push({
      kind: 'past-unreleased',
      message:
        `The last scheduled puzzle ${last.slug} is dated ${last.date}, before today (${today}). ` +
        `The queue has run dry — there is no puzzle for today.`,
    });
  }

  return warnings;
}
