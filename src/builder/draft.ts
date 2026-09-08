// Pure logic for the dev-only puzzle builder: the draft shape shared by the
// browser page (src/builder/Builder.tsx), the dev-server endpoints
// (vite-plugins/builder-dev.ts) and the CLI (scripts/puzzle.ts), plus
// validation and the renderer that turns a finished draft into a
// src/puzzles/<slug>.ts file. No I/O here so it can be unit-tested.
import type { PuzzleContent } from '../types.ts';
import { MAX_CONSTRAINT_LENGTH } from '../constraint.ts';

export const SIDES = ['A', 'B', 'C', 'D'] as const;
export type Side = (typeof SIDES)[number];

export interface DraftTrack {
  /** iTunes track id; null while the slot is empty. */
  id: number | null;
  artist: string;
  title: string;
  note: string;
  /** Carried from the iTunes result so the page can play it; not exported. */
  previewUrl?: string;
  album?: string;
  year?: string;
}

export interface DraftTheme {
  theme: string;
  tracks: DraftTrack[];
}

export interface Draft {
  version: 1;
  author: string;
  constraint: string;
  themes: DraftTheme[];
  /** ISO timestamp of the last write, whichever side made it. */
  updatedAt: string;
}

export const DRAFT_VERSION = 1;

export function emptyTrack(): DraftTrack {
  return { id: null, artist: '', title: '', note: '' };
}

export function emptyDraft(now = new Date()): Draft {
  return {
    version: DRAFT_VERSION,
    author: '',
    constraint: '',
    themes: SIDES.map(() => ({ theme: '', tracks: [0, 1, 2, 3].map(emptyTrack) })),
    updatedAt: now.toISOString(),
  };
}

/** Accept whatever is on disk and coerce it to a well-formed draft: four
 *  themes, four slots each, strings where strings belong. A missing or
 *  unreadable file yields an empty draft rather than an error. */
export function coerceDraft(raw: unknown): Draft {
  const d = emptyDraft();
  if (!raw || typeof raw !== 'object') return d;
  const x = raw as Record<string, unknown>;
  if (typeof x.author === 'string') d.author = x.author;
  if (typeof x.constraint === 'string') d.constraint = x.constraint;
  if (typeof x.updatedAt === 'string') d.updatedAt = x.updatedAt;
  if (Array.isArray(x.themes)) {
    for (let i = 0; i < 4; i++) {
      const t = x.themes[i] as Record<string, unknown> | undefined;
      if (!t || typeof t !== 'object') continue;
      if (typeof t.theme === 'string') d.themes[i]!.theme = t.theme;
      if (!Array.isArray(t.tracks)) continue;
      for (let j = 0; j < 4; j++) {
        const tr = t.tracks[j] as Record<string, unknown> | undefined;
        if (!tr || typeof tr !== 'object') continue;
        const slot = d.themes[i]!.tracks[j]!;
        if (typeof tr.id === 'number' && Number.isFinite(tr.id) && tr.id > 0) slot.id = tr.id;
        for (const k of ['artist', 'title', 'note', 'previewUrl', 'album', 'year'] as const) {
          if (typeof tr[k] === 'string') slot[k] = tr[k] as string;
        }
      }
    }
  }
  return d;
}

/* ── Slots ("A1" … "D4", or "A" for the next empty slot on side A) ── */

export interface SlotRef {
  side: number;
  index: number;
}

export function parseSlot(s: string, draft?: Draft): SlotRef | null {
  const m = /^([abcd])([1-4])?$/i.exec(s.trim());
  if (!m) return null;
  const side = SIDES.indexOf(m[1]!.toUpperCase() as Side);
  if (m[2]) return { side, index: Number(m[2]) - 1 };
  if (!draft) return null;
  const index = draft.themes[side]!.tracks.findIndex((t) => t.id === null);
  return index === -1 ? null : { side, index };
}

export function slotName(ref: SlotRef): string {
  return `${SIDES[ref.side]}${ref.index + 1}`;
}

/* ── Validation ── */

export interface DraftProblem {
  /** "A2", "B", "author" … — where the problem is. */
  where: string;
  message: string;
}

function norm(s: string): string {
  return s.trim().toLocaleLowerCase();
}

/** Everything that must be true before the draft can become a puzzle file.
 *  Mirrors validatePuzzleContent() in puzzles.ts plus the within-file
 *  duplicate checks from puzzles.data.test.ts, so a clean export also passes
 *  `npm run validate`. */
export function validateDraft(draft: Draft): DraftProblem[] {
  const out: DraftProblem[] = [];
  if (!draft.author.trim()) out.push({ where: 'author', message: 'author is empty' });
  if (draft.constraint.length > MAX_CONSTRAINT_LENGTH) {
    out.push({
      where: 'constraint',
      message: `constraint is ${draft.constraint.length} chars; soft cap is ${MAX_CONSTRAINT_LENGTH}`,
    });
  }
  const themeKeys = new Map<string, string>();
  const ids = new Map<number, string>();
  const songs = new Map<string, string>();
  draft.themes.forEach((t, i) => {
    const side = SIDES[i]!;
    if (!t.theme.trim()) out.push({ where: side, message: `category ${side} has no name` });
    else {
      const k = norm(t.theme);
      const prev = themeKeys.get(k);
      if (prev) out.push({ where: side, message: `category ${side} duplicates ${prev}: "${t.theme}"` });
      else themeKeys.set(k, side);
    }
    t.tracks.forEach((tr, j) => {
      const at = slotName({ side: i, index: j });
      if (tr.id === null) {
        out.push({ where: at, message: `${at} is empty` });
        return;
      }
      if (!tr.artist.trim()) out.push({ where: at, message: `${at} has no artist` });
      if (!tr.title.trim()) out.push({ where: at, message: `${at} has no title` });
      const prevId = ids.get(tr.id);
      if (prevId) out.push({ where: at, message: `${at} repeats iTunes id ${tr.id} from ${prevId}` });
      else ids.set(tr.id, at);
      const sk = `${norm(tr.artist)}\n${norm(tr.title)}`;
      const prevSong = songs.get(sk);
      if (prevSong && tr.artist.trim() && tr.title.trim()) {
        out.push({ where: at, message: `${at} repeats "${tr.artist} — ${tr.title}" from ${prevSong}` });
      } else songs.set(sk, at);
    });
  });
  return out;
}

export function filledCount(draft: Draft): number {
  return draft.themes.reduce((n, t) => n + t.tracks.filter((tr) => tr.id !== null).length, 0);
}

/* ── Conversion + rendering ── */

/** The draft as puzzle content (empty slots dropped). For the reuse check —
 *  it tolerates a partial puzzle so warnings show up while you build. */
export function draftToContent(draft: Draft): PuzzleContent {
  return {
    author: draft.author.trim() || 'draft',
    ...(draft.constraint.trim() ? { constraint: draft.constraint.trim() } : {}),
    themes: draft.themes.map((t) => ({
      theme: t.theme.trim(),
      tracks: t.tracks
        .filter((tr) => tr.id !== null)
        .map((tr) => ({
          id: tr.id!,
          artist: tr.artist.trim(),
          title: tr.title.trim(),
          ...(tr.note.trim() ? { note: tr.note.trim() } : {}),
        })),
    })),
  };
}

/** Quote a string the way the puzzle files do: single quotes, falling back
 *  to double quotes when the text has an apostrophe and no double quote. */
export function q(s: string): string {
  if (!s.includes("'")) return `'${s.replace(/\\/g, '\\\\')}'`;
  if (!s.includes('"')) return `"${s.replace(/\\/g, '\\\\')}"`;
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Render the src/puzzles/<slug>.ts source for a valid draft. Callers should
 *  run validateDraft() first; this does not re-check. */
export function renderPuzzleFile(draft: Draft): string {
  const c = draftToContent(draft);
  const lines: string[] = [];
  lines.push("import type { PuzzleContent } from '../types';", '', 'const puzzle: PuzzleContent = {');
  lines.push(`  author: ${q(c.author)},`);
  if (c.constraint) lines.push(`  constraint: ${q(c.constraint)},`);
  lines.push('  themes: [');
  for (const t of c.themes) {
    lines.push('    {', `      theme: ${q(t.theme)},`, '      tracks: [');
    for (const tr of t.tracks) {
      const note = tr.note ? `, note: ${q(tr.note)}` : '';
      lines.push(`        { id: ${tr.id}, artist: ${q(tr.artist)}, title: ${q(tr.title)}${note} },`);
    }
    lines.push('      ],', '    },');
  }
  lines.push('  ],', '};', '', 'export default puzzle;', '');
  return lines.join('\n');
}
