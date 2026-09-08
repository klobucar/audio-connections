import type { Puzzle, PuzzleContent } from './types';
import { LAUNCH_EPOCH, findBacklogSlugs, idFromSlug, resolve, schedule } from './schedule';

// idFromSlug is the slug→save-key derivation; it lives in schedule.ts (pure,
// loader-free) so the schedule tests can assert save-key stability. Re-exported
// here because callers historically imported it from the puzzles module.
export { idFromSlug } from './schedule';

class PuzzleSchemaError extends Error {}
const fail = (source: string, msg: string): never => {
  throw new PuzzleSchemaError(`${source}: ${msg}`);
};

// Re-exported from its own module so the Node-side puzzle builder can share
// it without pulling in this file's import.meta.glob.
export { MAX_CONSTRAINT_LENGTH } from './constraint';
import { MAX_CONSTRAINT_LENGTH } from './constraint';

/** Validate a puzzle FILE's exported content. Files carry no day/date/releaseAt
 *  anymore — those are derived from src/schedule.ts — so this checks only the
 *  authored half: author, optional constraint, and the 4×4 themes/tracks. */
export function validatePuzzleContent(p: unknown, source: string): asserts p is PuzzleContent {
  if (!p || typeof p !== 'object') fail(source, 'not an object');
  const x = p as Record<string, unknown>;

  if (typeof x.author !== 'string' || x.author.length === 0) {
    fail(source, 'author must be a non-empty string');
  }
  if (x.constraint !== undefined) {
    if (typeof x.constraint !== 'string' || x.constraint.length === 0) {
      fail(source, 'constraint must be a non-empty string if present');
    }
    const c = x.constraint as string;
    if (c.length > MAX_CONSTRAINT_LENGTH) {
      fail(
        source,
        `constraint is ${c.length} chars; soft cap is ${MAX_CONSTRAINT_LENGTH} — keep it to a phrase, not a sentence`,
      );
    }
  }
  if (!Array.isArray(x.themes) || x.themes.length !== 4) {
    fail(source, 'themes must be an array of exactly 4');
  }

  const themes = x.themes as unknown[];
  for (let i = 0; i < themes.length; i++) {
    const tRaw = themes[i];
    if (!tRaw || typeof tRaw !== 'object') fail(source, `themes[${i}] not an object`);
    const t = tRaw as Record<string, unknown>;

    if (typeof t.theme !== 'string' || t.theme.length === 0) {
      fail(source, `themes[${i}].theme must be a non-empty string`);
    }
    if (!Array.isArray(t.tracks) || t.tracks.length !== 4) {
      fail(source, `themes[${i}].tracks must be an array of exactly 4`);
    }

    const tracks = t.tracks as unknown[];
    for (let j = 0; j < tracks.length; j++) {
      const trRaw = tracks[j];
      if (!trRaw || typeof trRaw !== 'object') fail(source, `themes[${i}].tracks[${j}] not an object`);
      const tr = trRaw as Record<string, unknown>;

      if (typeof tr.id !== 'number') fail(source, `themes[${i}].tracks[${j}].id must be a number`);
      if (typeof tr.artist !== 'string') fail(source, `themes[${i}].tracks[${j}].artist must be a string`);
      if (typeof tr.title !== 'string') fail(source, `themes[${i}].tracks[${j}].title must be a string`);
      if (tr.note !== undefined && typeof tr.note !== 'string') {
        fail(source, `themes[${i}].tracks[${j}].note must be a string if present`);
      }
    }
  }
}

/** Map a puzzle file path to its slug (the file stem). Identity, not number —
 *  `./puzzles/day-22.ts` → `day-22`, `./puzzles/tqbf-1.ts` → `tqbf-1`. */
function slugFromPath(path: string): string {
  const m = /\/([^/]+)\.ts$/.exec(path);
  if (!m) throw new Error(`Unexpected puzzle path: ${path}`);
  return m[1]!;
}

// Every puzzle file, by stem — released back-catalogue is `day-N`, newer
// puzzles use author slugs, so we glob all of src/puzzles/ and exclude only the
// non-puzzle template. The slug IS the file stem (see slugFromPath).
const modules = import.meta.glob<{ default: unknown }>(
  ['./puzzles/*.ts', '!./puzzles/template.ts'],
  { eager: true },
);

// Build the content map keyed by slug. Files now export PuzzleContent directly
// (no day/date/releaseAt); resolve() owns number + date.
const contentBySlug = new Map<string, PuzzleContent>();
for (const [path, mod] of Object.entries(modules)) {
  validatePuzzleContent(mod.default, path);
  const slug = slugFromPath(path);
  if (contentBySlug.has(slug)) throw new Error(`Duplicate puzzle slug "${slug}" (${path})`);
  contentBySlug.set(slug, mod.default);
}

export interface BacklogPuzzle {
  /** File stem for an unscheduled puzzle waiting to be slotted. */
  slug: string;
  /** Stable save identity it will use once scheduled. */
  id: string;
  author: string;
  constraint?: string;
  themes: PuzzleContent['themes'];
}

// Derive number + date for every scheduled puzzle, then project back onto the
// downstream Puzzle shape so nothing else in the app changes yet.
const resolved = resolve(schedule, contentBySlug, LAUNCH_EPOCH);
export const puzzles: Puzzle[] = resolved.map((r) => ({
  id: idFromSlug(r.slug),
  day: r.day,
  date: r.date,
  releaseAt: r.releaseAt,
  author: r.content.author,
  ...(r.content.constraint !== undefined ? { constraint: r.content.constraint } : {}),
  themes: r.content.themes,
}));

export const backlogPuzzles: BacklogPuzzle[] = findBacklogSlugs(contentBySlug.keys(), schedule).map((slug) => {
  const content = contentBySlug.get(slug)!;
  return {
    slug,
    id: idFromSlug(slug),
    author: content.author,
    ...(content.constraint !== undefined ? { constraint: content.constraint } : {}),
    themes: content.themes,
  };
});
export const MAX_MISTAKES = 4;
export const THEME_EMOJI = ['🟨', '🟩', '🟦', '🟪'] as const;

export interface IsReleasedOpts {
  now?: number;
  /** Days unlocked outside the normal release schedule — Konami code and
   *  countdown-driven unlocks both land in this set so callers only need
   *  one predicate. */
  unlocked?: ReadonlySet<number>;
}

export function isReleased(p: Puzzle, opts: IsReleasedOpts = {}): boolean {
  if (opts.unlocked?.has(p.day)) return true;
  return (opts.now ?? Date.now()) >= new Date(p.releaseAt).getTime();
}

export function latestReleasedIndex(opts: IsReleasedOpts = {}): number {
  for (let i = puzzles.length - 1; i >= 0; i--) {
    if (isReleased(puzzles[i]!, opts)) return i;
  }
  return 0;
}
