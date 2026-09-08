// puzzle — terminal side of the puzzle builder. Same draft file as the
// browser page at /?mode=builder (dev server), so a person in the browser and
// an agent in the terminal work on one draft. No jq, no curl: every step is a
// subcommand with readable output (add --json for machine output).
//
//   npm run puzzle -- show                     current draft
//   npm run puzzle -- search "thong song"      iTunes hits with ids (10 per term; --limit=25 for more)
//   npm run puzzle -- search "Sisqo - Thong Song" "Ginuwine - Pony"   several searches at once, grouped
//   npm run puzzle -- add A 1440891230         fill next empty slot on side A (or A3 for a slot)
//   npm run puzzle -- remove B2
//   npm run puzzle -- set author "Your Name"
//   npm run puzzle -- set constraint "All #1 hits"   (blank to clear)
//   npm run puzzle -- set A "Songs about rain"       category name
//   npm run puzzle -- note C1 "Why this fits"        (blank to clear)
//   npm run puzzle -- check                    completeness + reuse against the catalogue
//   npm run puzzle -- export handle-3          write src/puzzles/handle-3.ts (--overwrite to replace)
//   npm run puzzle -- clear                    start over
//
// Runs on plain Node via native TS type-stripping; the dev server does not
// need to be running.
import { fileURLToPath } from 'node:url';
import {
  checkDraft,
  exportDraft,
  lookupItunes,
  readDraft,
  searchItunes,
  writeDraft,
  DRAFT_FILE,
} from '../vite-plugins/builder-ops.ts';
import { emptyDraft, emptyTrack, filledCount, parseSlot, slotName, SIDES, type Draft } from '../src/builder/draft.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const argv = process.argv.slice(2);
const JSON_OUT = argv.includes('--json');
const OVERWRITE = argv.includes('--overwrite');
const limitArg = argv.find((a) => a.startsWith('--limit='))?.slice('--limit='.length);
const LIMIT = limitArg && Number.isFinite(Number(limitArg)) ? Number(limitArg) : 10;
const args = argv.filter((a) => !a.startsWith('--'));
const [cmd, ...rest] = args;

function out(human: string, machine: unknown): void {
  if (JSON_OUT) console.log(JSON.stringify(machine, null, 2));
  else console.log(human);
}

function fail(msg: string): never {
  if (JSON_OUT) console.log(JSON.stringify({ error: msg }));
  else console.error(`✗ ${msg}`);
  process.exit(1);
}

function renderDraft(d: Draft): string {
  const lines: string[] = [];
  lines.push(`author:     ${d.author || '(unset)'}`);
  lines.push(`constraint: ${d.constraint || '(none)'}`);
  d.themes.forEach((t, i) => {
    lines.push('', `${SIDES[i]}  ${t.theme || '(unnamed category)'}`);
    t.tracks.forEach((tr, j) => {
      const at = slotName({ side: i, index: j });
      if (tr.id === null) lines.push(`  ${at}  —`);
      else lines.push(`  ${at}  ${tr.artist} — ${tr.title}  [${tr.id}]${tr.note ? `  note: ${tr.note}` : ''}`);
    });
  });
  lines.push('', `${filledCount(d)}/16 slots filled · draft file: ${DRAFT_FILE}`);
  return lines.join('\n');
}

async function main(): Promise<void> {
  switch (cmd) {
    case undefined:
    case 'help': {
      const src = await import('node:fs').then((fs) => fs.readFileSync(fileURLToPath(import.meta.url), 'utf8'));
      console.log(src.split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
      return;
    }
    case 'show': {
      const d = readDraft(ROOT);
      return out(renderDraft(d), d);
    }
    case 'clear': {
      const d = writeDraft(ROOT, emptyDraft());
      return out('Draft cleared.', d);
    }
    case 'search': {
      // Each argument is one search, so an agent can look up a whole
      // candidate list in one call: search "Artist - Title" "Other - Title".
      const terms = rest.map((t) => t.trim()).filter(Boolean);
      if (terms.length === 0) fail('usage: search "<term>" ["<term>" ...] [--limit N]   (quote multi-word terms)');
      const results = await Promise.all(
        terms.map(async (term) => {
          try {
            return { term, hits: await searchItunes(term, LIMIT) };
          } catch (e) {
            return { term, hits: [], error: e instanceof Error ? e.message : String(e) };
          }
        }),
      );
      const blocks = results.map((r) => {
        const head = terms.length > 1 ? `## ${r.term}\n` : '';
        if (r.error) return `${head}(search failed: ${r.error})`;
        if (r.hits.length === 0) return `${head}No song matches. Try fewer words, or the title alone.`;
        const lines = r.hits.map((h) => `${String(h.id).padStart(11)}  ${h.previewUrl ? ' ' : '✗'}  ${h.artist} — ${h.title}  [${h.album}${h.year ? `, ${h.year}` : ''}]`);
        return head + lines.join('\n');
      });
      return out(`${blocks.join('\n\n')}\n\n(✗ = no preview clip; unusable)  →  npm run puzzle -- add <side> <id>`, results);
    }
    case 'add': {
      const [slot, idRaw] = rest;
      const id = Number(idRaw);
      if (!slot || !Number.isFinite(id) || id <= 0) fail('usage: add <A|B|C|D|A1..D4> <itunes-id>');
      const d = readDraft(ROOT);
      const ref = parseSlot(slot, d);
      if (!ref) fail(`no empty slot for "${slot}" (use A1..D4 to replace a filled one)`);
      const dup = d.themes.flatMap((t, i) => t.tracks.map((tr, j) => ({ tr, at: slotName({ side: i, index: j }) }))).find((x) => x.tr.id === id);
      if (dup) fail(`iTunes id ${id} is already in slot ${dup.at}`);
      const [hit] = await lookupItunes([id]);
      if (!hit) fail(`iTunes id ${id} did not resolve to a song`);
      if (!hit.previewUrl) fail(`iTunes id ${id} (${hit.artist} — ${hit.title}) has no preview clip; pick another release of it`);
      const slotTrack = d.themes[ref.side]!.tracks[ref.index]!;
      Object.assign(slotTrack, emptyTrack(), {
        id: hit.id,
        artist: hit.artist,
        title: hit.title,
        previewUrl: hit.previewUrl,
        album: hit.album,
        year: hit.year,
      });
      writeDraft(ROOT, d);
      return out(`${slotName(ref)}  ${hit.artist} — ${hit.title}  [${hit.id}]`, { slot: slotName(ref), track: slotTrack });
    }
    case 'remove': {
      const ref = rest[0] ? parseSlot(rest[0]) : null;
      if (!ref) fail('usage: remove <A1..D4>');
      const d = readDraft(ROOT);
      d.themes[ref.side]!.tracks[ref.index] = emptyTrack();
      writeDraft(ROOT, d);
      return out(`${slotName(ref)} cleared.`, { slot: slotName(ref) });
    }
    case 'set': {
      const [what, ...valueParts] = rest;
      const value = valueParts.join(' ');
      const d = readDraft(ROOT);
      if (what === 'author') d.author = value;
      else if (what === 'constraint') d.constraint = value;
      else {
        const ref = what ? parseSlot(what[0]! + '1') : null;
        if (!what || !ref || what.length !== 1) fail('usage: set author|constraint|A|B|C|D <text>');
        d.themes[ref.side]!.theme = value;
      }
      writeDraft(ROOT, d);
      return out(`${what} = ${value || '(cleared)'}`, { [what!]: value });
    }
    case 'note': {
      const [slot, ...noteParts] = rest;
      const ref = slot ? parseSlot(slot) : null;
      if (!ref) fail('usage: note <A1..D4> <text>');
      const d = readDraft(ROOT);
      const tr = d.themes[ref.side]!.tracks[ref.index]!;
      if (tr.id === null) fail(`${slotName(ref)} is empty`);
      tr.note = noteParts.join(' ');
      writeDraft(ROOT, d);
      return out(`${slotName(ref)} note: ${tr.note || '(cleared)'}`, { slot: slotName(ref), note: tr.note });
    }
    case 'check': {
      const d = readDraft(ROOT);
      const r = await checkDraft(ROOT, d, { verifyPreviews: true });
      const lines: string[] = [`${r.filled}/16 slots filled`];
      if (r.problems.length) lines.push('', 'Not ready to export:', ...r.problems.map((p) => `  • ${p.message}`));
      else lines.push('', '✓ Complete — every slot filled, no in-file duplicates.');
      if (r.noPreview.length) lines.push('', `No preview clip (unplayable): ${r.noPreview.join(', ')}`);
      if (r.reuse.length) lines.push('', 'Reuse if scheduled at the next open slot (a maintainer may still space it out):', ...r.reuse.map((s) => `  • ${s}`));
      const prior = r.priorUses;
      if (prior.length) {
        lines.push('', `Tracks already in the catalogue (${prior.length}) — song freshness is the second-ranked rule:`);
        for (const p of prior) lines.push(`  • ${p.slot} (id ${p.id}) also in ${p.file}${p.day ? ` — Day ${p.day}, ${p.date}${p.released ? '' : ' (upcoming)'}` : ' (backlog)'}`);
      }
      if (!r.problems.length && !r.noPreview.length && !r.reuse.length) lines.push('', '✓ Nothing collides. Ready: npm run puzzle -- export <handle-N>');
      out(lines.join('\n'), r);
      if (r.problems.length || r.noPreview.length) process.exit(1);
      return;
    }
    case 'export': {
      const slug = rest[0];
      if (!slug) fail('usage: export <slug> [--overwrite]   e.g. export handle-3');
      const d = readDraft(ROOT);
      try {
        const r = exportDraft(ROOT, d, slug, OVERWRITE);
        return out(`Wrote ${r.path}\nNext: npm run validate, then open a PR (the draft is left in place; run "clear" to start another).`, r);
      } catch (e) {
        fail(e instanceof Error ? e.message : String(e));
      }
      return;
    }
    default:
      fail(`unknown command "${cmd}" — run without arguments for usage`);
  }
}

await main();
