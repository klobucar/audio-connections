import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { puzzles } from './puzzles';

// Integrity checks over the puzzle data files. These used to live in
// tests/puzzles.spec.ts under Playwright; they touch no DOM, so they belong in
// the unit suite. Importing `puzzles` here also runs validatePuzzle() against
// every day file as a side effect — these tests pin the same guarantees with
// named, per-day assertions and clearer failure messages.

const puzzleDir = fileURLToPath(new URL('./puzzles', import.meta.url));

describe('every puzzle has the required shape', () => {
  // One case per day so a malformed file fails by name. Stronger than
  // validatePuzzle in puzzles.ts, which only checks artist/title are strings —
  // here they must also be non-empty.
  it.each(puzzles)('day $day — 4 themes, 4 tracks each, required fields', (p) => {
    expect(typeof p.day, 'day').toBe('number');
    expect(p.date, 'date').toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(p.author.trim().length, 'author is non-empty').toBeGreaterThan(0);

    expect(p.themes, 'exactly 4 themes').toHaveLength(4);
    for (const [i, theme] of p.themes.entries()) {
      expect(theme.theme.trim().length, `theme ${i}: name is non-empty`).toBeGreaterThan(0);
      expect(theme.tracks, `theme ${i}: exactly 4 tracks`).toHaveLength(4);
      for (const [j, track] of theme.tracks.entries()) {
        expect(typeof track.id, `theme ${i} track ${j}: id is a number`).toBe('number');
        expect(track.artist.trim().length, `theme ${i} track ${j}: artist is non-empty`).toBeGreaterThan(0);
        expect(track.title.trim().length, `theme ${i} track ${j}: title is non-empty`).toBeGreaterThan(0);
      }
    }
  });
});

describe('puzzle calendar', () => {
  it('every file in src/puzzles/ matches the day-N.ts naming convention', () => {
    const files = readdirSync(puzzleDir).filter((f) => f !== 'template.ts');
    for (const f of files) {
      expect(f, `unexpected file in src/puzzles/: ${f}`).toMatch(/^day-\d+\.ts$/);
    }
  });

  it('every day-N.ts file is loaded into the puzzles array', () => {
    const files = readdirSync(puzzleDir).filter((f) => /^day-\d+\.ts$/.test(f));
    expect(puzzles.length).toBe(files.length);
  });

  it('each puzzle has a unique day number', () => {
    const days = puzzles.map((p) => p.day);
    expect(new Set(days).size).toBe(days.length);
  });

  it('filename day number matches exported day number', () => {
    const files = readdirSync(puzzleDir).filter((f) => /^day-\d+\.ts$/.test(f));
    for (const f of files) {
      const expected = parseInt(/^day-(\d+)\.ts$/.exec(f)![1]!, 10);
      const found = puzzles.find((p) => p.day === expected);
      expect(found, `${f}: no puzzle with day=${expected} was loaded`).toBeDefined();
    }
  });

  // releaseAt is optional in the type, but every shipped puzzle must carry one:
  // isReleased() hides any puzzle missing it, so a forgotten releaseAt would
  // silently make a day unreachable.
  it('every puzzle has a valid releaseAt timestamp', () => {
    for (const p of puzzles) {
      expect(typeof p.releaseAt, `day ${p.day}: releaseAt is missing`).toBe('string');
      const ms = new Date(p.releaseAt!).getTime();
      expect(
        Number.isNaN(ms),
        `day ${p.day}: releaseAt "${p.releaseAt}" is not a parseable date`,
      ).toBe(false);
      expect(
        p.releaseAt!.startsWith(p.date),
        `day ${p.day}: releaseAt "${p.releaseAt}" does not match date "${p.date}"`,
      ).toBe(true);
    }
  });
});

// The iTunes-network check lives in src/puzzles.itunes.test.ts, run via
// `npm run test:itunes` and the dedicated path-filtered GitHub workflow.
