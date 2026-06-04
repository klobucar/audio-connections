# Maintainer Guide

This guide is the entrypoint for maintainers reviewing puzzle PRs and managing the puzzle backlog.

## Puzzle PR Review

For a PR that adds or changes one or more files in `src/puzzles/`, review in this order.

### 1. Run Mechanical Checks

Before spending LLM tokens or doing semantic review, run the normal puzzle checks:

```sh
npm run test:unit
npm run test:itunes
npm run test:past-days
```

These checks catch file shape, required fields, duplicate track IDs, duplicate category labels, exact duplicate artist/title pairs, iTunes song validity, and released-day movement.

If a check fails, stop the review and ask the submitter to fix the failing test output. Do not do the LLM merge-quality review until the puzzle is mechanically valid.

### 2. Do Merge-Quality Review

Use [Puzzle Merge Review SOP](docs/puzzle-merge-review-sop.md) to decide whether the puzzle is good enough to merge into backlog.

This is the LLM/human review for:

- Multiple plausible complete solutions.
- Vague or overlapping category answers.
- Obscure or inaccessible category logic.
- Fairness, accessibility, difficulty, and fun.
- Submitter-facing rework feedback.

When using LLM tools, pass the SOP and the submitted puzzle file as context. The output should include an outcome, maintainer rating, difficulty note, contact, summary, concerns, and submitter-facing feedback.

Accepted puzzles may merge into backlog without a schedule entry.

## Backlog Scheduling

Backlog puzzles are valid, accepted puzzle files that are hidden from the playable calendar until scheduled.

Use:

```sh
npm run backlog:preview
```

To schedule backlog puzzles, use [Backlog Reshuffler SOP](docs/backlog-reshuffler-sop.md). That SOP explains spoiler-free reshuffling, held dates, novelty windows, confidence/severity labels, and opt-in edits to `src/schedule.ts`.

After applying schedule rows, run:

```sh
npm run schedule:preview
npm run validate
```

## CI Notes

Puzzle PR checks are also run in GitHub Actions, but maintainer review should not wait for CI to discover obvious local failures.

- `test:unit` is offline and fast.
- `test:itunes` uses the iTunes API and checks changed puzzle files by default.
- `test:past-days` protects released puzzle dates, numbers, and slugs.
- `npm run test:itunes:all` is for deliberate full-catalog drift sweeps, not ordinary puzzle PR review.
