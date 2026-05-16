// Dev-time puzzle checks that run in Vite's Node process.
//
// Runs at build start and on day-file changes during dev. Emits warnings
// (via the dev server logger) when the same iTunes id appears in two puzzles
// within `warnDays` days of each other — surfaced in the terminal where
// Vite is running, not in the browser console.
//
// Reads files with a focused regex rather than importing them; the day-N.ts
// format is regular enough that this avoids a TS-in-Node loader.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

interface Options {
  /** Warn if the same iTunes id appears in two puzzles within this many days. */
  warnDays?: number;
  /** Directory holding day-N.ts files, relative to the repo root. */
  dir?: string;
}

interface Occurrence {
  day: number;
  date: string;
  file: string;
}

function collect(dir: string): Map<number, Occurrence[]> {
  const byId = new Map<number, Occurrence[]>();
  const files = readdirSync(dir).filter((f) => /^day-\d+\.ts$/.test(f));
  for (const f of files) {
    const content = readFileSync(join(dir, f), 'utf8');
    const dayMatch = /\bday:\s*(\d+)/.exec(content);
    const dateMatch = /\bdate:\s*['"](\d{4}-\d{2}-\d{2})['"]/.exec(content);
    if (!dayMatch || !dateMatch) continue;
    const day = parseInt(dayMatch[1]!, 10);
    const date = dateMatch[1]!;
    const idRegex = /\bid:\s*(\d+)/g;
    let m: RegExpExecArray | null;
    while ((m = idRegex.exec(content)) !== null) {
      const id = parseInt(m[1]!, 10);
      const list = byId.get(id) ?? [];
      list.push({ day, date, file: f });
      byId.set(id, list);
    }
  }
  return byId;
}

function reportProximity(byId: Map<number, Occurrence[]>, warnDays: number, warn: (msg: string) => void): void {
  for (const [id, list] of byId) {
    if (list.length < 2) continue;
    list.sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1]!;
      const cur = list[i]!;
      const gap = Math.round(
        (new Date(cur.date).getTime() - new Date(prev.date).getTime()) / 86_400_000,
      );
      if (gap < warnDays) {
        warn(
          `iTunes id ${id} reused: Day ${prev.day} (${prev.date}) → Day ${cur.day} (${cur.date}), ${gap} day(s) apart`,
        );
      }
    }
  }
}

export function checkPuzzles(opts: Options = {}): Plugin {
  const warnDays = opts.warnDays ?? 14;
  const dir = opts.dir ?? 'src/puzzles';

  return {
    name: 'check-puzzles',
    buildStart() {
      const byId = collect(dir);
      reportProximity(byId, warnDays, (msg) => this.warn(msg));
    },
    configureServer(server) {
      const onChange = (path: string): void => {
        if (!/\/puzzles\/day-\d+\.ts$/.test(path)) return;
        const byId = collect(dir);
        reportProximity(byId, warnDays, (msg) =>
          server.config.logger.warn(`[check-puzzles] ${msg}`),
        );
      };
      server.watcher.on('add', onChange);
      server.watcher.on('change', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}
