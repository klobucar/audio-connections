# Contributing to the site

For puzzle submissions, see [PUZZLE_AUTHORS.md](./PUZZLE_AUTHORS.md). This doc is for changes to the application code, tests, build, or CI.

## Project structure

- `src/` — application code (React + TypeScript, built with Vite).
- `src/puzzles/` — one TypeScript file per puzzle, content only, named for its author (see PUZZLE_AUTHORS.md). Day numbers and dates are derived from `src/schedule.ts`, not stored in the files.
- `src/builder/` — the dev-only puzzle builder page (`/?mode=builder` under `npm run dev`; not in the production bundle). Its server side is `vite-plugins/builder-dev.ts` + `builder-ops.ts`, its CLI `scripts/puzzle.ts`. See docs/puzzle-builder.md.
- `tests/` — Playwright end-to-end tests.
- `vite-plugins/`, `public/`, `icons/` — build assets.
- `.github/workflows/` — CI definitions.

## Local commands

```
npm run setup          One-time install. Runs `npm ci`, `npx playwright install`, and points git at `.githooks/`.
npm run dev            Run the dev server (Vite, http://localhost:5173).
npm run build          Typecheck + production build.
npm run typecheck      TypeScript check only, no build.
npm run test:unit      Vitest, offline. ~10s. Pure logic + puzzle data shape.
npm run test:itunes    Vitest with the iTunes config. Hits the iTunes API for changed puzzle files.
npm run test:itunes:all Full-fleet iTunes sweep for maintainer/catalog drift checks.
npm test               Playwright end-to-end. ~15s. Builds once and serves it with `vite preview` (or reuses a running `npm run dev`), drives Chromium.
npm run validate       Composite for puzzle authors: npm run typecheck + test:unit + test:itunes + test:past-days.
npm run test:past-days Fails if you moved an already-released puzzle (reorder/rename/re-date). Diffs against origin/main.
npm run check:reuse   Maintainer-only. Lists cross-puzzle reuse still worth acting on: a category label repeated within 45 days, an iTunes id or song within 14 days, an artist within 7. Names future days, so not part of validate.
npm run puzzle        Terminal side of the puzzle builder (draft in .puzzle-draft.json, shared with /?mode=builder on the dev server). See docs/puzzle-builder.md.
npm run schedule:preview  Print the resolved schedule, backlog count, and warnings (thin runway, calendar gaps). Read-only.
npm run backlog:preview   Print the unscheduled puzzle backlog list and scheduling next step.
```

`npm run setup` also points git at the committed `.githooks/` directory, installing a pre-commit hook that runs `test:past-days` when you stage `src/schedule.ts` or a puzzle file. It's a best-effort local mirror of CI — bypass a false alarm with `git commit --no-verify`.

`npm run setup` exists because `.npmrc` sets `ignore-scripts=true` — every package's lifecycle scripts (preinstall / install / postinstall) are blocked on `npm ci` and `npm install`. That closes the primary npm supply-chain attack vector. The one package in our tree that legitimately needs a postinstall is Playwright (downloads browser binaries); `npm run setup` does that explicit step after the install. If you ever add a dep that genuinely needs an install hook, wire it into the `setup` script too rather than relaxing the .npmrc.

## Test taxonomy

Three runners cover different surface areas:

| Runner | Discovers | What it catches |
|---|---|---|
| Vitest unit (`*.test.ts` in `src/`, excluding `*.itunes.test.ts`) | `npm run test:unit` | Pure logic; puzzle shape, day numbering, releaseAt validity |
| Vitest iTunes (`*.itunes.test.ts` in `src/`) | `npm run test:itunes` | Changed puzzle track IDs resolve to playable songs (not albums, not dead) |
| Playwright (`*.spec.ts` in `tests/`) | `npm test` | End-to-end game behavior in a real browser |

Files are routed to a runner by filename suffix and directory; see `vitest.config.ts`, `vitest.itunes.config.ts`, and `playwright.config.ts` for the exact globs.

## When CI runs each test

| Trigger | Runs |
|---|---|
| PR opened that touches a puzzle file (`src/puzzles/*.ts` except `template.ts`) | `test:unit` + `test:itunes` for changed puzzle files (after maintainer approves the environment gate) |
| PR opened that touches `src/schedule.ts` or any puzzle file | Past-day guard (`test:past-days`) — fails if an already-released day was reordered, renamed, or re-dated |
| PR opened that touches anything else | Nothing automated |
| Push to `main` | `test:unit` + Playwright + build + deploy |
| Push to `main` touching a puzzle file (`src/puzzles/*.ts` except `template.ts`) | Above + `test:itunes` for pushed puzzle files |
| Scheduled or maintainer-invoked catalog drift check | `test:itunes:all` full-fleet sweep |

The "PR opened touching anything else → nothing" row is the gap. **If you're touching site code, run tests locally before merging.**

## Puzzle backlog workflow

A puzzle file under `src/puzzles/` does not need a matching `src/schedule.ts` entry to merge. If the file is valid but unscheduled, it is backlog: accepted content that is hidden from the playable calendar until a maintainer slots it.

Use:
```
npm run backlog:preview
```

That prints the unscheduled puzzle list. To move a backlog puzzle onto the calendar, add a dated row like `{ slug: 'name-1', date: 'YYYY-MM-DD' }` to `schedule` in `src/schedule.ts`. Re-run `npm run schedule:preview` to confirm the derived day number, date, and warnings, then run the normal validation commands.

## Pre-merge checklist

Run tests! 
```
npm run typecheck && npm run test:unit && npm run test:itunes && npm test
```

If you need to run a subset of tests:
```
npm run typecheck      # Always
npm run test:unit      # Always
npm run test:itunes    # If you touched any puzzle file
npm run test:itunes:all # Maintainer-only full-fleet catalog sweep
npm test               # If you touched UI, game logic, or anything in tests/
```


## Adding a new test

Pick the right runner by what you need:

- **Pure logic, no DOM, no network** → new `src/foo.test.ts`. Auto-picked up by `test:unit`.
- **Needs the iTunes API** → new `src/foo.itunes.test.ts`. Auto-picked up by `test:itunes`.
- **End-to-end game behavior** → new `tests/foo.spec.ts`. Auto-picked up by `npm test`.

The pattern in `src/puzzles.data.test.ts` (using `it.each(puzzles)` for per-day named assertions) is the template for any data-driven check.
