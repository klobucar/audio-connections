import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { backlogPuzzles, puzzles } from './puzzles';
import { findBacklogSlugs, schedule } from './schedule';

// Integrity checks over the puzzle data files. These used to live in
// tests/puzzles.spec.ts under Playwright; they touch no DOM, so they belong in
// the unit suite. Importing `puzzles` here also runs validatePuzzle() against
// every day file as a side effect — these tests pin the same guarantees with
// named, per-day assertions and clearer failure messages.

const puzzleDir = fileURLToPath(new URL('./puzzles', import.meta.url));
const puzzleFiles = [
  ...puzzles.map((p) => ({ label: `day ${p.day}`, content: p })),
  ...backlogPuzzles.map((p) => ({ label: `backlog ${p.slug}`, content: p })),
];

describe('every puzzle has the required shape', () => {
  // One case per file so a malformed file fails by name. Stronger than
  // validatePuzzle in puzzles.ts, which only checks artist/title are strings —
  // here they must also be non-empty.
  it.each(puzzleFiles)('$label — 4 themes, 4 tracks each, required fields', ({ content: p }) => {
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

  it.each(puzzleFiles)('$label — no duplicate track ids, songs, or category labels', ({ content: p }) => {
    const seenIds = new Map<number, string>();
    const seenSongs = new Map<string, string>();
    const seenThemes = new Set<string>();

    for (const [i, theme] of p.themes.entries()) {
      const themeKey = theme.theme.trim().toLocaleLowerCase();
      expect(seenThemes.has(themeKey), `theme ${i}: duplicate category "${theme.theme}"`).toBe(false);
      seenThemes.add(themeKey);

      for (const [j, track] of theme.tracks.entries()) {
        const loc = `theme ${i} track ${j}`;
        const previousId = seenIds.get(track.id);
        expect(previousId, `${loc}: duplicate iTunes id ${track.id} also used at ${previousId}`).toBeUndefined();
        seenIds.set(track.id, loc);

        const songKey = `${track.artist.trim().toLocaleLowerCase()}\n${track.title.trim().toLocaleLowerCase()}`;
        const previousSong = seenSongs.get(songKey);
        expect(
          previousSong,
          `${loc}: duplicate artist/title "${track.artist} — ${track.title}" also used at ${previousSong}`,
        ).toBeUndefined();
        seenSongs.set(songKey, loc);
      }
    }
  });
});

describe('puzzle calendar', () => {
  // File stems are slugs: the released back-catalogue is `day-N`, newer puzzles
  // use author slugs (`<github-handle>-N`). Alphanumerics joined by single
  // hyphens, no leading/trailing/doubled hyphen — same shape as a GitHub handle,
  // case allowed since handles can be mixed-case. This catches stray files
  // (`.DS_Store`, backups) and malformed names like `my puzzle.ts` or `foo_1.ts`.
  const SLUG_FILE_RE = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*\.ts$/;

  it('every file in src/puzzles/ is a valid slug filename', () => {
    const files = readdirSync(puzzleDir).filter((f) => f !== 'template.ts');
    for (const f of files) {
      expect(
        f,
        `"${f}" isn't a valid puzzle filename. Use letters, digits and single ` +
          `hyphens, ending in .ts (e.g. your-handle-1.ts) — see PUZZLE_AUTHORS.md.`,
      ).toMatch(SLUG_FILE_RE);
    }
  });

  it('every valid puzzle file is either scheduled or in the backlog', () => {
    const files = readdirSync(puzzleDir).filter((f) => f !== 'template.ts' && SLUG_FILE_RE.test(f));
    const slugs = files.map((f) => f.replace(/\.ts$/, ''));
    expect(backlogPuzzles.map((p) => p.slug)).toEqual(findBacklogSlugs(slugs, schedule));
    expect(puzzles.length + backlogPuzzles.length).toBe(files.length);
  });

  it('each puzzle has a unique day number', () => {
    const days = puzzles.map((p) => p.day);
    expect(new Set(days).size).toBe(days.length);
  });

  // Day numbers are now DERIVED (chronological rank from src/schedule.ts), not
  // read from the filename — the filename is identity, not number. So we no
  // longer assert filename === day; instead we pin the two invariants that
  // derivation guarantees.
  it('day numbers are dense 1..N in load order', () => {
    puzzles.forEach((p, i) => {
      expect(p.day, `puzzle at index ${i}`).toBe(i + 1);
    });
  });

  it('picker order == unlock order: releaseAt never decreases as day increases', () => {
    // The point of deriving the number from the schedule: a later day can never
    // unlock before an earlier one. The old hand-authored scheme let day 34
    // (Jun 30) sit before days 35/36 (Jun 14/15); that inversion is now
    // unrepresentable.
    for (let i = 1; i < puzzles.length; i++) {
      const prev = new Date(puzzles[i - 1]!.releaseAt).getTime();
      const cur = new Date(puzzles[i]!.releaseAt).getTime();
      expect(
        cur,
        `day ${puzzles[i]!.day} releases before day ${puzzles[i - 1]!.day}`,
      ).toBeGreaterThanOrEqual(prev);
    }
  });

  // releaseAt is required by the type and validator, but we still check the
  // value is a parseable date and consistent with `date` — neither of those
  // are enforced by the schema check, and a typo there breaks unlock timing.
  it('every puzzle has a valid releaseAt timestamp matching its date', () => {
    for (const p of puzzles) {
      const ms = new Date(p.releaseAt).getTime();
      expect(
        Number.isNaN(ms),
        `day ${p.day}: releaseAt "${p.releaseAt}" is not a parseable date`,
      ).toBe(false);
      expect(
        p.releaseAt.startsWith(p.date),
        `day ${p.day}: releaseAt "${p.releaseAt}" does not match date "${p.date}"`,
      ).toBe(true);
    }
  });
});

// The iTunes-network check lives in src/puzzles.itunes.test.ts. By default
// `npm run test:itunes` checks changed puzzle files; `npm run test:itunes:all`
// deliberately sweeps the full archive for catalog drift.
