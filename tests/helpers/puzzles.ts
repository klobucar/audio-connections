// Node-side puzzle loader for Playwright tests.
//
// The runtime entry `src/puzzles.ts` uses `import.meta.glob`, which is a
// Vite-specific feature that the Playwright Node loader doesn't understand.
// This helper does the equivalent assembly with `fs.readdirSync` + dynamic
// `import()`, so tests can iterate over puzzle data without touching the app.
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Puzzle } from '../../src/types';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', '..', 'src', 'puzzles');

const files = readdirSync(dir)
  .filter((f) => /^day-\d+\.ts$/.test(f))
  .sort();

const loaded: Puzzle[] = [];
for (const f of files) {
  const mod = (await import(`../../src/puzzles/${f}`)) as { default: Puzzle };
  loaded.push(mod.default);
}
loaded.sort((a, b) => a.day - b.day);

export const puzzles: Puzzle[] = loaded;
