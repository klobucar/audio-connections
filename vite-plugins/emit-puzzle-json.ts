// Emit a static puzzle data endpoint at build time: dist/api/v0/puzzle.json.
//
// The app already bundles every puzzle client-side (import.meta.glob in
// src/puzzles.ts); this surfaces the same data as a clean JSON file so external
// tooling can fetch the full catalogue without scraping the minified bundle.
//
// SPOILER NOTE: this publishes ALL scheduled puzzles + answers (including
// future, not-yet-released days) and the unscheduled backlog. That's the
// intended scope here, but it means upcoming answers are openly readable —
// don't point maintainers/players at it. The release gating in isReleased()
// only governs the in-app UI, not this file.
//
// Loads puzzle content via Node's native TS type-stripping (same approach as
// scripts/schedule-preview.ts), then runs it through the shared, pure resolve()
// so day numbers and dates match exactly what the app derives.
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import type { PuzzleContent } from '../src/types';
import { LAUNCH_EPOCH, findBacklogSlugs, idFromSlug, resolve, schedule } from '../src/schedule';

// Matches the filename guard used by check-puzzles + the data tests: a slug is
// alphanumerics joined by single hyphens. Excludes template.ts and stray files.
const PUZZLE_FILE_RE = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*\.ts$/;

/** Where the emitted file lands inside the build output. The leading "api/v0"
 *  is preserved as a real directory so GitHub Pages serves it at
 *  <base>api/v0/puzzle.json (i.e. /api/v0/puzzle.json on the canonical site). */
const OUT_FILE = 'api/v0/puzzle.json';

async function loadContentBySlug(dir: string): Promise<Map<string, PuzzleContent>> {
  const out = new Map<string, PuzzleContent>();
  const files = readdirSync(dir)
    .filter((f) => f !== 'template.ts' && PUZZLE_FILE_RE.test(f))
    .sort();
  for (const f of files) {
    const slug = f.replace(/\.ts$/, '');
    const mod = (await import(pathToFileURL(join(dir, f)).href)) as { default: PuzzleContent };
    out.set(slug, mod.default);
  }
  return out;
}

async function buildPayload(dir: string): Promise<string> {
  const contentBySlug = await loadContentBySlug(dir);

  const resolved = resolve(schedule, contentBySlug, LAUNCH_EPOCH);
  const puzzles = resolved.map((r) => ({
    id: idFromSlug(r.slug),
    day: r.day,
    date: r.date,
    releaseAt: r.releaseAt,
    author: r.content.author,
    ...(r.content.constraint !== undefined ? { constraint: r.content.constraint } : {}),
    themes: r.content.themes,
  }));

  const backlog = findBacklogSlugs(contentBySlug.keys(), schedule).map((slug) => {
    const content = contentBySlug.get(slug)!;
    return {
      slug,
      id: idFromSlug(slug),
      author: content.author,
      ...(content.constraint !== undefined ? { constraint: content.constraint } : {}),
      themes: content.themes,
    };
  });

  const payload = {
    schemaVersion: 0,
    launchEpoch: LAUNCH_EPOCH,
    count: puzzles.length,
    backlogCount: backlog.length,
    puzzles,
    backlog,
  };
  return JSON.stringify(payload, null, 2) + '\n';
}

export function emitPuzzleJson(opts: { dir?: string } = {}): Plugin {
  const dir =
    opts.dir ?? fileURLToPath(new URL('../src/puzzles', import.meta.url));
  return {
    name: 'emit-puzzle-json',
    apply: 'build',
    async generateBundle() {
      const source = await buildPayload(dir);
      this.emitFile({ type: 'asset', fileName: OUT_FILE, source });
    },
  };
}
