# Submitting a puzzle

You don't need to be a developer to contribute a puzzle. This guide walks through the whole process.

## What you're making

A puzzle is **4 themed categories of 4 songs each** (16 songs total). Players hear 30-second previews and group the songs into the four hidden themes.

Each puzzle lives in its own file under `src/puzzles/`, named for you: `src/puzzles/<your-github-handle>-N.ts` (e.g. `name-1.ts`, then `name-2.ts` for your second). The handle isn't really important, filenames just need to be unique, and this naming convention means you only need to know about other files you've submitted, not everyone else's.

## Setup (one-time)

1. Install [Node.js](https://nodejs.org/) (any recent version).
2. Fork this repo on GitHub, then clone your fork:
   ```
   git clone https://github.com/YOUR-USERNAME/audio-connections.git
   cd audio-connections
   npm run setup
   ```
   (`npm run setup` runs `npm ci` plus `npx playwright install` — the latter is needed because our `.npmrc` blocks third-party install scripts as a supply-chain guard. Plain `npm install` works too if you'll only run `npm run validate` and never the Playwright suite.)

## Writing your puzzle

### The easy way: the puzzle builder

Run `npm run dev` and open <http://localhost:5173/?mode=builder>. Search iTunes, play the previews, drop tracks onto sides A–D, name the categories, and export the file — it finds the IDs, refuses tracks with no preview, and runs the same reuse checks maintainers run. There is a terminal version too (`npm run puzzle`), which works well with an AI agent. See [docs/puzzle-builder.md](./docs/puzzle-builder.md).

The rest of this section is the manual route; everything it says about the file still applies to an exported one.

1. Copy `src/puzzles/template.ts` to `src/puzzles/<your-github-handle>-N.ts`.
2. Fill in:
   - **`author`**: your name.
   - **`themes`**: four themes, each with four tracks.
   - **`constraint`** *(optional)*: a puzzle-wide rule that pops as a "DJ left a note" popup when your puzzle loads, and a pill in the desktop heading. Use for meta-themes that apply to every track, but use sparingly. Tells players upfront that an extra constraint is in play. **Keep it phrase-length** — there's an 80-character soft cap enforced by the validator. Long enough for a full sentence won't fit the vibe.

## Scheduling your puzzle

The puzzle file holds **only the puzzle content** - the day number and release date aren't in it. A maintainer slots your puzzle into the schedule (`src/schedule.ts`) when it's ready for the calendar; accepted puzzles can sit in the backlog first. Backlog puzzles are merged and reviewed, but they are hidden from the playable calendar until scheduled. This makes maintainers responsible for managing duplicates and collisions so you can focus on the puzzle. If you'd like your puzzle to land on a particular date (a birthday, a holiday tie-in), just say so in your PR and the maintainer can pin it.

### Finding iTunes IDs

Each track needs a numeric iTunes ID. To find one:

1. Open the [Apple Music web player](https://music.apple.com) and search for the song.
2. Click the song's `...` menu → Share → Copy Link.
3. The number at the end of the URL is the track ID (e.g. `https://music.apple.com/us/album/song-name/123456789?i=987654321` — you want `987654321`, the `?i=` value).

Make sure you copy the **song** ID, not the album ID. The validator catches this if you slip up.

## Design rules

These keep puzzles interesting over time. These rules mean you will need to have played a large number of recent puzzles before submitting.

- **Make puzzles accessible** Above all else, design your puzzle to be fun. Include songs that people know and like, make the game winnable, but add twists and points of interest. Use songs that span decades and genres. Not too easy, not too hard, and enjoyable for a wide variety of players.
- **Avoid artists and songs that belong to multiple categories** A few overlaps makes the puzzle challenging, but too many means you may have multiple valid answers. Classic Connections rules allow for a lot of overlap trickery, but Audio Connections requires recognizing songs, titles, artists, AND trivia. Try not to catch your players out on a technicality.
- **Avoid repetition** In order of importance (descending): don't re-use categories, songs, and artists. The category is "the answer" and should be as fresh as possible. Songs and artists will be re-used over time because some songs and artists are very popular or prolific, but nobody wants to hear the same song four times in a week.
- **Purple is free** While it is important to make the game winnable and accessible (because winning is fun), the purple or "Side D" category is a freebie. If your player guesses A, B, and C, they do not need to know what the category is for D in order to win. If you must show everyone how clever you are, D is the place to do it.
- **Notes are optional** If a track's connection to its theme isn't obvious, add a `note:` field with a one-line explanation that displays after the player solves the category.

At any given time, there are some number of "staged" songs between today and your submission, and you also need to follow these rules for those songs. To avoid requiring every submitter to read all future puzzles and ruin the game for themselves, maintainers will run additional duplication checks and may ask you to rework your puzzle. If you have access to LLM tools, you may be able to ask the LLM to perform these checks on your behalf and give you "spoiler-free" feedback.

## Validating before you submit

Run the validator from the project root:

```
npm run validate
```

This checks:
- Your puzzle file has the right shape (4 themes × 4 tracks, all fields filled in).
- Every iTunes ID points to a real, playable song (not an album, not a deleted track).

It takes about 20 seconds and needs an internet connection.

Fix anything it flags, then re-run until it's clean.

## Questions

Open a GitHub issue.
