// schedule:preview — print the resolved schedule as a dated, numbered table
// plus maintainer warnings (thin runway, calendar gaps, a run-dry queue).
//
// The schedule file lists only slugs in order; this is how a maintainer SEES
// what those resolve to — each puzzle's day number and release date — without
// reverse-engineering them from the epoch + list position. Read-only.
//
// Runs on plain Node via native TS type-stripping (no tsx). The analysis it
// renders, previewWarnings(), is pure and unit-tested in src/schedule.test.ts;
// this wrapper just supplies the clock and formats the output.
//   node scripts/schedule-preview.ts
import {
  previewWarnings,
  resolve as resolveSchedule,
  schedule,
  type PuzzleContent,
  type ScheduleEntry,
} from '../src/schedule.ts';

const TODAY = new Date().toISOString().slice(0, 10); // UTC, matches schedule dates

function stubContent(s: readonly ScheduleEntry[]): Map<string, PuzzleContent> {
  const m = new Map<string, PuzzleContent>();
  for (const e of s) m.set(typeof e === 'string' ? e : e.slug, { author: 'stub', themes: [] });
  return m;
}

const resolved = resolveSchedule(schedule, stubContent(schedule));

const slugWidth = Math.max(4, ...resolved.map((p) => p.slug.length));
const rel = (date: string) => (date < TODAY ? 'released' : date === TODAY ? 'TODAY' : 'future');

console.log(`\nSchedule preview — ${resolved.length} puzzles, today ${TODAY} (UTC)\n`);
console.log(`  ${'day'.padStart(3)}  ${'slug'.padEnd(slugWidth)}  ${'date'.padEnd(10)}  status`);
console.log(`  ${'─'.repeat(3)}  ${'─'.repeat(slugWidth)}  ${'─'.repeat(10)}  ──────`);
for (const p of resolved) {
  const mark = p.date === TODAY ? '▶' : ' ';
  console.log(
    `${mark} ${String(p.day).padStart(3)}  ${p.slug.padEnd(slugWidth)}  ${p.date}  ${rel(p.date)}`,
  );
}

const warnings = previewWarnings(resolved, TODAY);
if (warnings.length === 0) {
  console.log(`\n✓ No warnings — runway healthy, no upcoming gaps.\n`);
} else {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ⚠ [${w.kind}] ${w.message}`);
  console.log('');
}
// Advisory only — preview never fails a build.
