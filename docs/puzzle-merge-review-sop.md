# Puzzle Merge Review SOP

This SOP explains how to decide whether a submitted puzzle is good enough to merge into the backlog. It is written for human maintainers and LLM-assisted review. When passed to an LLM, this document is the review ruleset to follow.

The goal is not to schedule the puzzle. Scheduling and cross-calendar freshness are handled later by backlog reshuffling. The goal here is to decide whether the submitted puzzle is structurally sound, playable, fair, and worth accepting into backlog.

## Source Of Truth

Review the submitted puzzle file in `src/puzzles/`.

Before spending LLM tokens or doing semantic review, run the regular checks for mechanical validity:

- `npm run test:unit`
- `npm run test:itunes`
- `npm run test:past-days` when a PR touches puzzle files or schedule files

Automated checks catch file shape, required fields, duplicate track IDs, duplicate category labels, exact duplicate artist/title pairs, iTunes song validity, and released-day movement. They do not decide whether the puzzle is fun, fair, clear, or appropriately difficult.

If these checks fail, stop the SOP review and point the submitter at the failing test output. Do not spend LLM review effort on a mechanically invalid puzzle.

## Review Outcomes

Use one of these outcomes:

- `accept`: mergeable into backlog.
- `accept-with-notes`: mergeable, but include minor feedback the author may use later.
- `request-rework`: do not merge yet; the puzzle likely needs changes.
- `reject`: do not merge; the concept is not suitable or would require a near-total rewrite.

When asking for rework, name who the maintainer should contact inline. Use the puzzle `author` field when available.

## Hard Failures

Request rework for these semantic issues:

- The puzzle has multiple plausible complete solutions.
- A category depends on information so obscure that most players cannot reasonably infer it after hearing the songs and seeing solved tracks.
- A category answer is so vague that many unrelated songs would also fit.
- The puzzle relies on a private joke, undocumented personal context, or inaccessible trivia.

Obscurity is not the same as difficulty. A hard category can still be fair when the answer becomes satisfying after the reveal, when at least some tracks give players a foothold, when the shared creator has a distinctive style or cultural footprint, or when notes make the connection legible after solving. An obscurity failure is a category where even an attentive player is unlikely to understand why those four tracks belong together without outside research.

Examples of likely obscurity failures:

- Four songs connected only by invisible metadata: an uncredited producer, session musician, engineer, catalogue fact, release date, or other detail that is not audible, visible, named in the track, or part of common public framing.
- Four tracks tied to a narrow personal event, local scene, podcast bit, Discord meme, or friend-group reference.
- Four songs whose connection depends on deep chart trivia, catalogue numbers, recording dates, or unrevealed album metadata.
- Four artists connected by a biographical fact that is not reasonably famous and has no clue surface in the songs.
- A category label that is technically true but so broad or arbitrary that many other songs in the puzzle could also fit.

Examples of hard but potentially fair categories:

- A title-word pattern that becomes clear once players see solved titles.
- A genre, era, or soundtrack category with at least a couple of recognizable anchors.
- A shared composer, director, producer, or creator whose style or body of work is distinctive enough that the reveal feels earned, even if the category is difficult.
- A trivia category where track notes explain the connection after solving.
- A puzzle-wide constraint that tells players what kind of extra knowledge is in play.

## Review Signals

Inspect the puzzle as a whole, not only individual tracks.

Clarity:

- Can each category be stated cleanly after solving?
- Are the four categories meaningfully different from one another?
- Do track notes clarify non-obvious links without doing the whole puzzle for the player?
- Is any optional constraint short, useful, and truly puzzle-wide?

Fairness:

- Are there too many tracks that plausibly belong in more than one category?
- Are there trap overlaps that create multiple valid answers instead of satisfying misdirection?
- Does the puzzle require recognizing all 16 songs exactly, or can a player make progress from a reasonable subset?
- Are titles, artists, and trivia doing complementary work rather than all pointing in conflicting directions?

Accessibility:

- Are enough songs or artists recognizable for a broad audience?
- Is the puzzle not locked behind one narrow genre, decade, fandom, language, or cultural context unless the constraint makes that explicit and fair?
- Are obscure categories balanced by easier categories?

Difficulty:

- Is there a reasonable path to at least one early category?
- Is the hardest category hard in a satisfying way, not because the clue is unknowable?
- Is the puzzle closer to "interesting challenge" than "research assignment"?

Enjoyment:

- Does the puzzle have a clear point of view or hook?
- Are the songs broadly listenable in preview form?
- Is the cleverness in service of play rather than just showing the constructor's knowledge?

## Rating System

Give a spoiler-aware maintainer rating and a submitter-facing feedback rating.

Maintainer rating:

- `A`: strong backlog candidate. Clear, fair, and fun; no meaningful rework needed.
- `B`: mergeable. Some rough edges, but the puzzle should play well.
- `C`: borderline. Probably needs author feedback or targeted rework before merge.
- `D`: not mergeable as submitted. Core ambiguity, excessive difficulty, or weak categories.

Submitter-facing difficulty note:

- `approachable`: likely playable by a broad audience.
- `balanced`: some harder material, but enough entry points.
- `challenging`: fair, but may be tough; notes or one easier category may help.
- `too hard`: likely to frustrate players without rework.

Submitter feedback should be actionable and kind. Avoid revealing future schedule or backlog details. The author already knows their own puzzle, so it is fine to name their submitted categories and tracks when explaining rework.

## LLM Review Instructions

When using an LLM, ask it to review the submitted puzzle against this SOP.

The LLM should:

- Read the puzzle file directly.
- Check for obvious ambiguity and multiple-solution risk.
- Judge whether each category has a clear, fair answer.
- Identify overly obscure or inaccessible categories.
- Rate likely difficulty using the authoring guidelines.
- Suggest concrete rework when needed.
- Separate maintainer-only assessment from submitter-facing feedback.

The LLM should not:

- Schedule the puzzle.
- Judge freshness against the future calendar.
- Require the submitter to know unreleased puzzles.
- Assume automated checks already handled semantic issues.
- Reject a puzzle merely because it is unusual or clever.

## Suggested Review Output

Use this shape:

```text
outcome: accept-with-notes
maintainer rating: B
difficulty note: challenging
contact: Ada Example

summary:
Strong concept and mostly fair categories. One category may be too obscure without notes.

mechanical concerns:
- none

semantic concerns:
- Category 3 depends on trivia that may not be inferable from the song previews.

submitter feedback:
Ada, this is close. Consider adding notes to the Category 3 tracks or swapping one track for a more recognizable example so players have a fair entry point.
```

For `request-rework`, make the feedback specific enough that the author knows what to change. For `accept`, keep it short.

## Non-Goals For Merge Review

- Scheduling the puzzle.
- Optimizing calendar novelty or freshness.
- Comparing against unreleased backlog puzzles unless the maintainer explicitly asks.
- Rewriting the puzzle for the author.
- Blocking puzzles solely because they are difficult.
