import type { Puzzle } from './types';

class PuzzleSchemaError extends Error {}
const fail = (source: string, msg: string): never => {
  throw new PuzzleSchemaError(`${source}: ${msg}`);
};

function validatePuzzle(p: unknown, source: string): asserts p is Puzzle {
  if (!p || typeof p !== 'object') fail(source, 'not an object');
  const x = p as Record<string, unknown>;

  if (typeof x.day !== 'number' || !Number.isInteger(x.day) || (x.day as number) < 1) {
    fail(source, 'day must be a positive integer');
  }
  if (typeof x.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x.date)) {
    fail(source, 'date must be YYYY-MM-DD');
  }
  if (typeof x.author !== 'string' || x.author.length === 0) {
    fail(source, 'author must be a non-empty string');
  }
  if (x.releaseAt !== undefined && typeof x.releaseAt !== 'string') {
    fail(source, 'releaseAt must be a string if present');
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

function dayNumberFromPath(path: string): number {
  const m = /\/day-(\d+)\.ts$/.exec(path);
  if (!m) throw new Error(`File outside the day-N.ts naming convention: ${path}`);
  return parseInt(m[1]!, 10);
}

const modules = import.meta.glob<{ default: unknown }>('./puzzles/day-*.ts', { eager: true });

const collected: Puzzle[] = [];
const seenDays = new Set<number>();
for (const [path, mod] of Object.entries(modules)) {
  const expectedDay = dayNumberFromPath(path);
  validatePuzzle(mod.default, path);
  if (mod.default.day !== expectedDay) {
    throw new Error(
      `${path}: filename says day ${expectedDay} but module exports day ${mod.default.day}`,
    );
  }
  if (seenDays.has(mod.default.day)) {
    throw new Error(`Duplicate day number ${mod.default.day} (last seen in ${path})`);
  }
  seenDays.add(mod.default.day);
  collected.push(mod.default);
}
collected.sort((a, b) => a.day - b.day);

export const puzzles: Puzzle[] = collected;
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
  // A puzzle with no releaseAt is treated as unreleased (hidden), not shown —
  // fail-safe so a misconfigured day can't leak before its date. Every
  // shipped puzzle should carry a releaseAt; the puzzles test enforces it.
  if (!p.releaseAt) return false;
  return (opts.now ?? Date.now()) >= new Date(p.releaseAt).getTime();
}

export function latestReleasedIndex(opts: IsReleasedOpts = {}): number {
  for (let i = puzzles.length - 1; i >= 0; i--) {
    if (isReleased(puzzles[i]!, opts)) return i;
  }
  return 0;
}
