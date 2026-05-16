import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { puzzles } from './helpers/puzzles';

const here = dirname(fileURLToPath(import.meta.url));
const puzzleDir = join(here, '..', 'src', 'puzzles');

test.describe('puzzle calendar', () => {
  test('every file in src/puzzles/ matches the day-N.ts naming convention', () => {
    const files = readdirSync(puzzleDir);
    for (const f of files) {
      expect(f, `unexpected file in src/puzzles/: ${f}`).toMatch(/^day-\d+\.ts$/);
    }
  });

  test('every day-N.ts file is loaded into the puzzles array', () => {
    const files = readdirSync(puzzleDir).filter((f) => /^day-\d+\.ts$/.test(f));
    expect(puzzles.length).toBe(files.length);
  });

  test('each puzzle has a unique day number', () => {
    const days = puzzles.map((p) => p.day);
    expect(new Set(days).size).toBe(days.length);
  });

  test('filename day number matches exported day number', () => {
    const files = readdirSync(puzzleDir).filter((f) => /^day-\d+\.ts$/.test(f));
    for (const f of files) {
      const expected = parseInt(/^day-(\d+)\.ts$/.exec(f)![1]!, 10);
      const found = puzzles.find((p) => p.day === expected);
      expect(found, `${f}: no puzzle with day=${expected} was loaded`).toBeDefined();
    }
  });
});
