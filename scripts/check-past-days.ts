// Past-day guard — fails if a PR moves an ALREADY-RELEASED puzzle.
//
// Released days are frozen: a `day-N` file's save key is its bare number, and
// every released puzzle's (number, date) are a matter of public record, so
// renaming, reordering, or re-dating one orphans saves and rewrites history.
// CONTENT edits (swap a broken track, fix a theme) don't change (slug, day,
// date) and are always allowed — that's the current-day fix-up workflow.
//
// This is the time-aware half of the guard, which is why it lives in a script
// (run by CI + an optional pre-commit hook), NOT in the deterministic unit
// suite: it reads the wall clock ("what's released today?") and git ("what did
// the schedule look like on the base branch?"). The pure comparison it wraps,
// diffPastDays(), is unit-tested in src/schedule.test.ts.
//
// Run by Node's native TypeScript type-stripping — no tsx/ts-node needed.
//   node scripts/check-past-days.ts [baseRef]   (baseRef defaults to origin/main)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  diffPastDays,
  resolve as resolveSchedule,
  schedule as currentSchedule,
  type PuzzleContent,
  type ResolvedPuzzle,
  type ScheduleEntry,
} from '../src/schedule.ts';

const BASE_REF = process.argv[2] ?? 'origin/main';
const TODAY = new Date().toISOString().slice(0, 10); // UTC, matches schedule dates

/** resolve() needs a content entry per slug but only uses it to confirm one
 *  exists; diffPastDays reads only slug/day/date. So stubs are enough here. */
function stubContent(schedule: readonly ScheduleEntry[]): Map<string, PuzzleContent> {
  const m = new Map<string, PuzzleContent>();
  for (const e of schedule) m.set(typeof e === 'string' ? e : e.slug, { author: 'stub', themes: [] });
  return m;
}

function resolveCurrent(): ResolvedPuzzle[] {
  return resolveSchedule(currentSchedule, stubContent(currentSchedule));
}

/** Resolve the schedule as it stands on the base branch. Imports the BASE
 *  version of schedule.ts (its own resolve() + data), so a change to the
 *  resolver logic itself is caught too, not just the schedule array. Returns
 *  null when the base ref isn't available (e.g. a shallow clone with no fetch)
 *  so the caller can skip rather than fail spuriously. */
async function resolveBaseline(): Promise<ResolvedPuzzle[] | null> {
  let src: string;
  try {
    src = execFileSync('git', ['show', `${BASE_REF}:src/schedule.ts`], { encoding: 'utf8' });
  } catch {
    return null;
  }
  // schedule.ts has no runtime imports (only `import type`, which stripping
  // erases), so the baseline copy resolves standalone from a temp dir.
  const dir = mkdtempSync(join(tmpdir(), 'past-day-'));
  const file = join(dir, 'schedule.baseline.ts');
  writeFileSync(file, src);
  try {
    const mod = await import(pathToFileURL(file).href);
    return mod.resolve(mod.schedule, stubContent(mod.schedule)) as ResolvedPuzzle[];
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const baseline = await resolveBaseline();
if (!baseline) {
  console.warn(`past-day guard: ${BASE_REF}:src/schedule.ts unavailable — skipping (no baseline to diff).`);
  process.exit(0);
}

const violations = diffPastDays(baseline, resolveCurrent(), TODAY);

if (violations.length === 0) {
  console.log(`past-day guard: OK — no released puzzle (date ≤ ${TODAY}) changed vs ${BASE_REF}.`);
  process.exit(0);
}

console.error(
  `\npast-day guard FAILED — ${violations.length} already-released puzzle(s) moved vs ${BASE_REF} (today=${TODAY}):\n`,
);
for (const v of violations) {
  const was = `day ${v.before.day} on ${v.before.date}`;
  if (v.reason === 'removed') {
    console.error(`  ✗ ${v.slug}: ${was} — its file was renamed or removed (save key would orphan)`);
  } else {
    console.error(`  ✗ ${v.slug}: ${was} → day ${v.after!.day} on ${v.after!.date} (${v.reason})`);
  }
}
console.error(
  `\nReleased days are immutable: their number, date, and slug (= save key) are a matter of record.\n` +
    `Only UNreleased entries may be reordered, renamed, or re-dated. To change content (swap a track,\n` +
    `fix a theme) edit the puzzle file — that doesn't move the day and won't trip this check.\n`,
);
process.exit(1);
