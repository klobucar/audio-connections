/** Soft cap on `PuzzleContent.constraint` length. Lives in its own
 *  dependency-free module so both the app's validator (puzzles.ts, which
 *  needs Vite's import.meta.glob) and the Node-side puzzle builder
 *  (src/builder/draft.ts, plain Node) can share it. The mobile layouts use
 *  the modal (which wraps any length) and the desktop pill sits in a 940px
 *  chrome row, so this isn't strictly a layout guard — it's a taste guard.
 *  The "DJ scribbled note" framing wants a phrase, not a paragraph. 80 chars
 *  ≈ a single sentence and still fits the desktop pill on one line at 11px
 *  mono. */
export const MAX_CONSTRAINT_LENGTH = 80;
