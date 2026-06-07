// Dev-time puzzle checks that run in Vite's Node process.
//
// Runs at build start and on puzzle-file changes during dev. Emits warnings
// (via the dev server logger) when the same iTunes id appears in two puzzles
// within `warnDays` days of each other — surfaced in the terminal where Vite
// is running, not in the browser console.
//
// Puzzle files are content-only (no day/date — those are derived from
// src/schedule.ts), so this reads each file's track ids with a focused regex
// and gets the scheduled day/date from the proximity helper. Using a regex for
// the ids avoids standing up a TS-in-Node loader just to import the modules;
// the date math and reuse detection live in src/puzzles.proximity.ts so they
// can be unit-tested without Vite.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { findProximityWarnings, scheduledDates } from '../src/puzzles.proximity';

interface Options {
  /** Warn if the same iTunes id appears in two puzzles within this many days. */
  warnDays?: number;
  /** Directory holding the puzzle files, relative to the repo root. */
  dir?: string;
}

// Same shape as the filename guard in src/puzzles.data.test.ts: a slug is
// alphanumerics joined by single hyphens. Excludes template.ts and stray files.
const PUZZLE_FILE_RE = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*\.ts$/;

/** Map each puzzle slug to the iTunes ids it uses, read straight from the file. */
function idsBySlug(dir: string): Map<string, number[]> {
  const out = new Map<string, number[]>();
  const files = readdirSync(dir).filter((f) => f !== 'template.ts' && PUZZLE_FILE_RE.test(f));
  for (const f of files) {
    const content = readFileSync(join(dir, f), 'utf8');
    const ids: number[] = [];
    const idRegex = /\bid:\s*(\d+)/g;
    let m: RegExpExecArray | null;
    while ((m = idRegex.exec(content)) !== null) ids.push(parseInt(m[1]!, 10));
    out.set(f.replace(/\.ts$/, ''), ids);
  }
  return out;
}

function run(dir: string, warnDays: number, warn: (msg: string) => void): void {
  const ids = idsBySlug(dir);

  const today = new Date().toISOString().slice(0, 10); // UTC, matches schedule dates
  const warnings = findProximityWarnings(ids, scheduledDates(), warnDays, today);
  for (const w of warnings) {
    warn(
      `iTunes id ${w.id} reused: Day ${w.prev.day} (${w.prev.date}) → ` +
        `Day ${w.cur.day} (${w.cur.date}), ${w.gap} day(s) apart`,
    );
  }
}

export function checkPuzzles(opts: Options = {}): Plugin {
  const warnDays = opts.warnDays ?? 14;
  const dir = opts.dir ?? 'src/puzzles';

  return {
    name: 'check-puzzles',
    buildStart() {
      run(dir, warnDays, (msg) => this.warn(msg));
    },
    configureServer(server) {
      const onChange = (path: string): void => {
        if (!/\/puzzles\/[^/]+\.ts$/.test(path) || /\/template\.ts$/.test(path)) return;
        run(dir, warnDays, (msg) => server.config.logger.warn(`[check-puzzles] ${msg}`));
      };
      server.watcher.on('add', onChange);
      server.watcher.on('change', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}
