# Puzzle builder

A dev-only tool for assembling a puzzle without hunting for iTunes IDs by hand. It has two faces that share one draft:

- **The page** — `npm run dev`, then open <http://localhost:5173/?mode=builder>. Search iTunes, play 30-second previews, place tracks on sides A–D, name the categories, watch the checks, export the file.
- **The CLI** — `npm run puzzle -- <command>`. Same operations from the terminal, no browser needed. Written for people and for AI agents: readable output by default, `--json` for machine output, no `jq` or `curl` required.

Both read and write `.puzzle-draft.json` at the repo root (gitignored). Edit from the terminal and the open page picks it up within a couple of seconds; edit in the page and the next CLI command sees it. A person and their agent can build one puzzle together this way.

The builder does not exist in the deployed site. `?mode=builder` on connections.audio just shows the game.

## Workflow

1. `npm run dev` (only needed for the page; the CLI works without it).
2. Find tracks: search, audition the preview, place each on a side. A track whose iTunes entry has no preview clip is marked and cannot be placed — pick another release of the same song.
3. Name the four categories, set your author name, optionally a constraint (≤ 80 characters).
4. Check. The builder validates completeness and duplicates, then runs the same cross-puzzle reuse check maintainers use, as if your puzzle took the next open calendar slot. It also lists any track that already appears anywhere in the catalogue, because song freshness is the second-ranked design rule in PUZZLE_AUTHORS.md.
5. Export to `src/puzzles/<your-handle>-N.ts`.
6. `npm run validate`, then open a PR. The draft stays in place until you `clear` it.

## CLI reference

```
npm run puzzle -- show                       print the draft
npm run puzzle -- search "thong song"        iTunes hits: id, artist — title [album, year]; ✗ = no preview
npm run puzzle -- add A 1440891230           fill the next empty slot on side A
npm run puzzle -- add C3 1440891230          fill (or replace) a specific slot
npm run puzzle -- remove B2
npm run puzzle -- set author "Your Name"
npm run puzzle -- set constraint "Only #1 hits"    blank value clears it
npm run puzzle -- set A "Songs about rain"         category name for side A
npm run puzzle -- note C1 "Why this fits"          blank value clears it
npm run puzzle -- check                      completeness, previews, reuse; exits 1 if not exportable
npm run puzzle -- export handle-3            writes src/puzzles/handle-3.ts; --overwrite to replace
npm run puzzle -- clear                      empty the draft
```

Add `--json` to any command for structured output. Slots are `A1`–`D4`; a bare side letter means "next empty slot on that side". `add` looks the id up on iTunes and refuses ids with no preview clip, so the artist and title in the draft are always what iTunes will play.

## For AI agents

If you are an agent helping someone build a puzzle in this repo, use the CLI above rather than calling the iTunes API yourself.

- `npm run puzzle -- search "<artist> <title>" --json` returns `[{ id, artist, title, album, year, previewUrl? }]`. Only entries with a `previewUrl` are usable.
- `npm run puzzle -- add <side> <id>` validates the id for you. Never write ids into the draft file or a puzzle file by hand.
- `npm run puzzle -- check --json` returns `{ filled, problems[], noPreview[], reuse[], priorUses[] }`. `problems` and `noPreview` block export. `reuse` and `priorUses` are judgment calls for the human — surface them, don't silently work around them.
- Names, notes and the constraint go through `set` and `note`; you can also edit `.puzzle-draft.json` directly, the page will notice.
- The person may be editing in the browser at the same time. Run `show` before making assumptions about the current state.
- Reuse output names other puzzles, including future days. That is fine on a maintainer's machine; do not paste it into a public PR.

## HTTP API (what the page uses)

Served by the Vite dev server only, from `vite-plugins/builder-dev.ts`:

```
GET  /__builder/draft
PUT  /__builder/draft                 body: Draft
GET  /__builder/search?term=&limit=
GET  /__builder/lookup?ids=1,2
GET  /__builder/check?previews=1
POST /__builder/export                body: { slug, overwrite? }
```

Errors come back as `{ error }` with a 400. The draft shape and the file renderer live in `src/builder/draft.ts` (unit-tested); the server-side operations in `vite-plugins/builder-ops.ts` are shared by the middleware and the CLI.
