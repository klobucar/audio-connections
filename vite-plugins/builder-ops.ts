// Server-side operations behind the dev-only puzzle builder. Shared by the
// Vite dev middleware (builder-dev.ts, for the browser page) and the CLI
// (scripts/puzzle.ts, for a person or an agent in the terminal). Both act on
// the same draft file at the repo root, so whichever side edits, the other
// sees it.
//
// Runs on plain Node (native TS type stripping): fs for the draft and export,
// fetch for iTunes.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  coerceDraft,
  draftToContent,
  emptyDraft,
  renderPuzzleFile,
  validateDraft,
  SLUG_RE,
  type Draft,
  type DraftProblem,
} from '../src/builder/draft.ts';
import { findReuseWarnings, formatReuseWarning, type ReuseWarning } from '../src/puzzles.reuse.ts';
import { scheduledDates } from '../src/puzzles.proximity.ts';
import { loadPuzzleContents } from './load-puzzles.ts';

export const DRAFT_FILE = '.puzzle-draft.json';
export const DRAFT_SLUG = 'draft';

export function draftPath(root: string): string {
  return resolve(root, DRAFT_FILE);
}

export function readDraft(root: string): Draft {
  const p = draftPath(root);
  if (!existsSync(p)) return emptyDraft();
  try {
    return coerceDraft(JSON.parse(readFileSync(p, 'utf8')));
  } catch {
    return emptyDraft();
  }
}

export function writeDraft(root: string, draft: Draft): Draft {
  const next = { ...coerceDraft(draft), updatedAt: new Date().toISOString() };
  writeFileSync(draftPath(root), JSON.stringify(next, null, 2) + '\n');
  return next;
}

/* ── iTunes ── */

export interface SearchHit {
  id: number;
  artist: string;
  title: string;
  album: string;
  year: string;
  /** Absent when iTunes has no 30s clip — such a track can't be used. */
  previewUrl?: string;
  artworkUrl?: string;
}

interface ITunesRow {
  wrapperType?: string;
  kind?: string;
  trackId?: number;
  artistName?: string;
  trackName?: string;
  collectionName?: string;
  releaseDate?: string;
  previewUrl?: string;
  artworkUrl100?: string;
}

function toHit(r: ITunesRow): SearchHit | null {
  if (r.wrapperType !== 'track' || r.kind !== 'song' || typeof r.trackId !== 'number') return null;
  const hit: SearchHit = {
    id: r.trackId,
    artist: r.artistName ?? '',
    title: r.trackName ?? '',
    album: r.collectionName ?? '',
    year: (r.releaseDate ?? '').slice(0, 4),
  };
  if (r.previewUrl?.startsWith('https://')) hit.previewUrl = r.previewUrl;
  if (r.artworkUrl100?.startsWith('https://')) hit.artworkUrl = r.artworkUrl100;
  return hit;
}

async function itunes(path: string, params: Record<string, string>): Promise<SearchHit[]> {
  const url = new URL(`https://itunes.apple.com/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  // Same private-cache-key trick as src/itunes.ts: the CDN caches by URL with
  // no Vary: Origin, so keep the builder's entries separate from the app's.
  url.searchParams.set('_o', 'builder');
  const r = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new Error(`iTunes ${path} failed: HTTP ${r.status}`);
  const data = (await r.json()) as { results?: ITunesRow[] };
  return (data.results ?? []).map(toHit).filter((h): h is SearchHit => h !== null);
}

export function searchItunes(term: string, limit = 25): Promise<SearchHit[]> {
  return itunes('search', { term, media: 'music', entity: 'song', limit: String(Math.min(Math.max(limit, 1), 200)) });
}

export function lookupItunes(ids: readonly number[]): Promise<SearchHit[]> {
  if (ids.length === 0) return Promise.resolve([]);
  return itunes('lookup', { id: ids.join(','), entity: 'song' });
}

/* ── Check ── */

export interface PriorUse {
  id: number;
  slot: string;
  file: string;
  /** Absent when the other puzzle is in the backlog. */
  day?: number;
  date?: string;
  released: boolean;
}

export interface CheckResult {
  filled: number;
  problems: DraftProblem[];
  /** Proximity warnings as if the draft took the next open calendar slot. */
  reuse: string[];
  reuseRaw: ReuseWarning[];
  /** Every draft track that already appears anywhere in the catalogue,
   *  released days included — song freshness is the second-ranked rule. */
  priorUses: PriorUse[];
  /** Tracks (by slot) whose iTunes id has no preview clip — unplayable. */
  noPreview: string[];
}

export async function checkDraft(root: string, draft: Draft, opts: { today?: string; verifyPreviews?: boolean } = {}): Promise<CheckResult> {
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const files = await loadPuzzleContents(resolve(root, 'src/puzzles'));
  const dates = new Map(scheduledDates());
  let last = '';
  let lastDay = 0;
  for (const { day, date } of dates.values()) if (date > last) { last = date; lastDay = day; }
  const nextDate = last ? new Date(new Date(last).getTime() + 86_400_000).toISOString().slice(0, 10) : today;

  const all = new Map(files);
  all.set(DRAFT_SLUG, draftToContent(draft));
  dates.set(DRAFT_SLUG, { day: lastDay + 1, date: nextDate });
  const reuseRaw = findReuseWarnings(all, dates, { today }).filter(
    (w) => w.cur.slug === DRAFT_SLUG || w.prev.slug === DRAFT_SLUG,
  );

  const priorUses: PriorUse[] = [];
  draft.themes.forEach((t, i) =>
    t.tracks.forEach((tr, j) => {
      if (tr.id === null) return;
      for (const [slug, content] of files) {
        if (!content.themes.some((th) => th.tracks.some((x) => x.id === tr.id))) continue;
        const when = dates.get(slug);
        priorUses.push({
          id: tr.id,
          slot: `${'ABCD'[i]}${j + 1}`,
          file: `${slug}.ts`,
          ...(when ? { day: when.day, date: when.date } : {}),
          released: !!when && when.date <= today,
        });
      }
    }),
  );

  const noPreview: string[] = [];
  if (opts.verifyPreviews) {
    const ids = draft.themes.flatMap((t) => t.tracks.map((tr) => tr.id)).filter((x): x is number => x !== null);
    const hits = new Map((await lookupItunes(ids)).map((h) => [h.id, h]));
    draft.themes.forEach((t, i) =>
      t.tracks.forEach((tr, j) => {
        if (tr.id !== null && !hits.get(tr.id)?.previewUrl) noPreview.push(`${'ABCD'[i]}${j + 1}`);
      }),
    );
  }

  return {
    filled: draft.themes.reduce((n, t) => n + t.tracks.filter((tr) => tr.id !== null).length, 0),
    problems: validateDraft(draft),
    reuse: reuseRaw.map(formatReuseWarning).map((s) => s.replace(/Day \d+ \(\S+, draft\.ts\)/, 'this draft')),
    reuseRaw,
    priorUses,
    noPreview,
  };
}

/* ── Export ── */

export interface ExportResult {
  path: string;
  slug: string;
}

export function exportDraft(root: string, draft: Draft, slug: string, overwrite = false): ExportResult {
  if (!SLUG_RE.test(slug)) throw new Error(`slug "${slug}" must be lowercase letters/digits joined by single hyphens, e.g. handle-3`);
  if (slug === 'template') throw new Error('slug "template" is reserved');
  const problems = validateDraft(draft);
  if (problems.length) throw new Error(`draft is not complete:\n  ${problems.map((p) => p.message).join('\n  ')}`);
  const path = resolve(root, 'src/puzzles', `${slug}.ts`);
  if (existsSync(path) && !overwrite) throw new Error(`${path} already exists (pass overwrite to replace it)`);
  writeFileSync(path, renderPuzzleFile(draft));
  return { path, slug };
}
