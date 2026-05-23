import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
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

// ─── iTunes ID resolution ───────────────────────────────────────────────────
// Network-dependent: confirms iTunes IDs that are new on this branch resolve to
// playable song tracks, catching a collectionId pasted in place of a trackId.
// Self-skips when the branch changes no IDs vs main, which is the common case.

interface ITunesResult {
  wrapperType?: string;
  collectionType?: string;
  kind?: string;
  trackId?: number;
  collectionId?: number;
  artistId?: number;
  previewUrl?: string;
}

/** git invocation without a shell — args are passed as an array, so a path
 *  from git's own output can never be interpreted as a shell command. */
function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

/** Extracts iTunes IDs (the `id: 1234567890` field on each track) from raw
 *  puzzle-file source text. */
function extractIds(source: string): Set<number> {
  const ids = new Set<number>();
  for (const m of source.matchAll(/\bid:\s*(\d+)/g)) {
    ids.add(parseInt(m[1]!, 10));
  }
  return ids;
}

/** iTunes IDs present in a changed puzzle file's current source but not in the
 *  same file's `main` version. A schema-only change touching every day file
 *  but changing no IDs returns []; a brand-new puzzle returns all 16 IDs. */
function newIdsOnBranch(): number[] {
  let changedFiles: string[] = [];
  try {
    const out = git(['diff', '--name-only', 'main...HEAD', '--', 'src/puzzles/day-*.ts']);
    changedFiles = out.split('\n').map((l) => l.trim()).filter(Boolean);
  } catch {
    return [];
  }

  const repoRoot = fileURLToPath(new URL('..', import.meta.url));
  const newIds = new Set<number>();
  for (const relPath of changedFiles) {
    let mainSource = '';
    try {
      mainSource = git(['show', `main:${relPath}`]);
    } catch {
      // File didn't exist on main — every ID in the current version is new.
    }

    let headSource: string;
    try {
      headSource = readFileSync(`${repoRoot}${relPath}`, 'utf8');
    } catch {
      continue; // file deleted on this branch — nothing to verify
    }

    const mainIds = extractIds(mainSource);
    for (const id of extractIds(headSource)) {
      if (!mainIds.has(id)) newIds.add(id);
    }
  }
  return [...newIds].sort((a, b) => a - b);
}

const newIds = newIdsOnBranch();

describe('new iTunes IDs on this branch resolve to playable tracks', () => {
  it.skipIf(newIds.length === 0)(
    `resolves ${newIds.length} new ID(s) to song tracks with previews`,
    async () => {
      const res = await fetch(`https://itunes.apple.com/lookup?id=${newIds.join(',')}`, {
        signal: AbortSignal.timeout(10000),
      });
      expect(res.ok, `iTunes lookup HTTP ${res.status}`).toBe(true);

      const { results } = (await res.json()) as { results: ITunesResult[] };

      // Map every ID back to the track that introduced it so failures name the
      // artist/title/day, not just an opaque ID.
      const trackByNewId = new Map<number, { day: number; artist: string; title: string }>();
      for (const p of puzzles) {
        for (const theme of p.themes) {
          for (const t of theme.tracks) {
            if (!trackByNewId.has(t.id)) {
              trackByNewId.set(t.id, { day: p.day, artist: t.artist, title: t.title });
            }
          }
        }
      }

      for (const id of newIds) {
        const ctx = trackByNewId.get(id);
        const label = ctx
          ? `day ${ctx.day} id ${id} (${ctx.artist} — ${ctx.title})`
          : `id ${id}`;

        const asTrack = results.find((r) => r.wrapperType === 'track' && r.trackId === id);

        if (!asTrack) {
          const other = results.find(
            (r) => r.trackId === id || r.collectionId === id || r.artistId === id,
          );
          const diag = other
            ? `${label} resolved to ${other.wrapperType}/${other.collectionType ?? other.kind ?? '?'}, expected a song track`
            : `${label} returned no result from iTunes`;
          expect(asTrack, diag).toBeDefined();
          continue;
        }

        expect(asTrack.kind, `${label} kind is "${asTrack.kind}", expected "song"`).toBe('song');
        expect(
          typeof asTrack.previewUrl === 'string' && asTrack.previewUrl.length > 0,
          `${label} has no previewUrl`,
        ).toBe(true);
      }
    },
  );
});
