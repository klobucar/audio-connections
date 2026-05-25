# Contributing to the site

For puzzle submissions, see [PUZZLE_AUTHORS.md](./PUZZLE_AUTHORS.md). This doc is for changes to the application code, tests, build, or CI.

## Project structure

- `src/` — application code (React + TypeScript, built with Vite).
- `src/puzzles/` — one TypeScript file per daily puzzle.
- `tests/` — Playwright end-to-end tests.
- `vite-plugins/`, `public/`, `icons/` — build assets.
- `.github/workflows/` — CI definitions.

## Local commands

```
npm install            Install dependencies.
npm run dev            Run the dev server (Vite, http://localhost:5173).
npm run build          Typecheck + production build.
npm run typecheck      TypeScript check only, no build.
npm run test:unit      Vitest, offline. ~10s. Pure logic + puzzle data shape.
npm run test:itunes    Vitest with the iTunes config. ~10-20s. Hits the iTunes API.
npm test               Playwright end-to-end. ~30-60s. Boots dev server, drives Chromium.
npm run validate       Composite for puzzle authors: npm run typecheck + test:unit + test:itunes.
```

## Test taxonomy

Three runners cover different surface areas:

| Runner | Discovers | What it catches |
|---|---|---|
| Vitest unit (`*.test.ts` in `src/`, excluding `*.itunes.test.ts`) | `npm run test:unit` | Pure logic; puzzle shape, day numbering, releaseAt validity |
| Vitest iTunes (`*.itunes.test.ts` in `src/`) | `npm run test:itunes` | Every track ID resolves to a playable song (not an album, not dead) |
| Playwright (`*.spec.ts` in `tests/`) | `npm test` | End-to-end game behavior in a real browser |

Files are routed to a runner by filename suffix and directory; see `vitest.config.ts`, `vitest.itunes.config.ts`, and `playwright.config.ts` for the exact globs.

## When CI runs each test

| Trigger | Runs |
|---|---|
| PR opened that touches `src/puzzles/day-*.ts` | `test:unit` + `test:itunes` (after maintainer approves the environment gate) |
| PR opened that touches anything else | Nothing automated |
| Push to `main` | `test:unit` + Playwright + build + deploy |
| Push to `main` touching `src/puzzles/day-*.ts` | Above + `test:itunes` post-merge sweep |

The "PR opened touching anything else → nothing" row is the gap. **If you're touching site code, run tests locally before merging.**

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
npm test               # If you touched UI, game logic, or anything in tests/
```


## Adding a new test

Pick the right runner by what you need:

- **Pure logic, no DOM, no network** → new `src/foo.test.ts`. Auto-picked up by `test:unit`.
- **Needs the iTunes API** → new `src/foo.itunes.test.ts`. Auto-picked up by `test:itunes`.
- **End-to-end game behavior** → new `tests/foo.spec.ts`. Auto-picked up by `npm test`.

The pattern in `src/puzzles.data.test.ts` (using `it.each(puzzles)` for per-day named assertions) is the template for any data-driven check.
