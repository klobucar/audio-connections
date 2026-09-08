import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  coerceDraft,
  draftToContent,
  emptyDraft,
  filledCount,
  parseSlot,
  q,
  renderPuzzleFile,
  slotName,
  validateDraft,
  type Draft,
} from './draft';
import { validatePuzzleContent } from '../puzzles';

function full(): Draft {
  const d = emptyDraft();
  d.author = 'Test Author';
  d.themes.forEach((t, i) => {
    t.theme = `Category ${i}`;
    t.tracks.forEach((tr, j) => {
      tr.id = 1000 + i * 4 + j;
      tr.artist = `Artist ${i}${j}`;
      tr.title = `Title ${i}${j}`;
    });
  });
  return d;
}

describe('coerceDraft', () => {
  it('yields an empty draft for garbage', () => {
    expect(coerceDraft(null).themes).toHaveLength(4);
    expect(coerceDraft('x').author).toBe('');
    expect(filledCount(coerceDraft({ themes: 'nope' }))).toBe(0);
  });

  it('keeps valid fields and pads missing ones', () => {
    const d = coerceDraft({ author: 'A', themes: [{ theme: 'T', tracks: [{ id: 5, artist: 'x', title: 'y' }] }] });
    expect(d.author).toBe('A');
    expect(d.themes[0]!.theme).toBe('T');
    expect(d.themes[0]!.tracks[0]).toMatchObject({ id: 5, artist: 'x', title: 'y', note: '' });
    expect(d.themes[0]!.tracks[1]!.id).toBeNull();
    expect(d.themes[3]!.tracks).toHaveLength(4);
  });

  it('drops a non-positive or non-numeric id', () => {
    const d = coerceDraft({ themes: [{ tracks: [{ id: 0 }, { id: '7' }] }] });
    expect(d.themes[0]!.tracks[0]!.id).toBeNull();
    expect(d.themes[0]!.tracks[1]!.id).toBeNull();
  });
});

describe('parseSlot', () => {
  it('parses explicit and next-empty slots', () => {
    expect(parseSlot('B3')).toEqual({ side: 1, index: 2 });
    expect(parseSlot('d1')).toEqual({ side: 3, index: 0 });
    expect(parseSlot('E1')).toBeNull();
    expect(parseSlot('A5')).toBeNull();
    const d = emptyDraft();
    d.themes[0]!.tracks[0]!.id = 1;
    expect(parseSlot('A', d)).toEqual({ side: 0, index: 1 });
    expect(parseSlot('A')).toBeNull();
  });

  it('returns null for a full side', () => {
    expect(parseSlot('A', full())).toBeNull();
  });

  it('round-trips through slotName', () => {
    expect(slotName(parseSlot('C4')!)).toBe('C4');
  });
});

describe('validateDraft', () => {
  it('passes a complete draft', () => {
    expect(validateDraft(full())).toEqual([]);
  });

  it('reports every empty slot and missing name', () => {
    const p = validateDraft(emptyDraft());
    expect(p.find((x) => x.where === 'author')).toBeTruthy();
    expect(p.filter((x) => /^[A-D][1-4] is empty$/.test(x.message))).toHaveLength(16);
    expect(p.filter((x) => /has no name/.test(x.message))).toHaveLength(4);
  });

  it('catches duplicate ids, songs and categories', () => {
    const d = full();
    d.themes[1]!.tracks[0]!.id = d.themes[0]!.tracks[0]!.id;
    d.themes[2]!.tracks[1]!.artist = d.themes[0]!.tracks[1]!.artist;
    d.themes[2]!.tracks[1]!.title = d.themes[0]!.tracks[1]!.title.toUpperCase();
    d.themes[3]!.theme = ' category 0 ';
    const msgs = validateDraft(d).map((x) => x.message);
    expect(msgs.some((m) => m.startsWith('B1 repeats iTunes id'))).toBe(true);
    expect(msgs.some((m) => m.startsWith('C2 repeats "'))).toBe(true);
    expect(msgs.some((m) => m.startsWith('category D duplicates A'))).toBe(true);
  });

  it('enforces the constraint soft cap', () => {
    const d = full();
    d.constraint = 'x'.repeat(81);
    expect(validateDraft(d).map((x) => x.where)).toContain('constraint');
  });
});

describe('q', () => {
  it('picks the quote style the files use', () => {
    expect(q('plain')).toBe("'plain'");
    expect(q("You're Dead")).toBe('"You\'re Dead"');
    expect(q(`Say "hi", it's me`)).toBe(`'Say "hi", it\\'s me'`);
  });
});

describe('renderPuzzleFile', () => {
  it('produces a file that passes the puzzle validator', async () => {
    const d = full();
    d.constraint = 'All bangers';
    d.themes[0]!.tracks[0]!.note = 'why';
    const src = renderPuzzleFile(d);
    expect(src).toContain("constraint: 'All bangers',");
    expect(src).toContain("{ id: 1000, artist: 'Artist 00', title: 'Title 00', note: 'why' },");
    expect(src).toContain("{ id: 1001, artist: 'Artist 01', title: 'Title 01' },");
    expect(src.endsWith('export default puzzle;\n')).toBe(true);
    // Import the rendered module for real (it references ../types, so write it
    // next to the real puzzles) to prove it is exactly the shape puzzles.ts
    // accepts.
    const dir = mkdtempSync(join(fileURLToPath(new URL('../puzzles/', import.meta.url)), '.render-test-'));
    const file = join(dir, 'rendered.ts');
    try {
      writeFileSync(file, src.replace("from '../types'", "from '../../types'"));
      const mod = (await import(/* @vite-ignore */ pathToFileURL(file).href)) as { default: unknown };
      expect(() => validatePuzzleContent(mod.default, 'rendered')).not.toThrow();
      expect(mod.default).toEqual(draftToContent(d));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('omits the constraint line when blank', () => {
    expect(renderPuzzleFile(full())).not.toContain('constraint:');
  });
});
