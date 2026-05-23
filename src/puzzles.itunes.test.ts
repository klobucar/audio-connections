import { describe, expect, it } from 'vitest';
import { puzzles } from './puzzles';

// Network-dependent: confirms every iTunes ID across the puzzle fleet resolves
// to a playable song track — catches a collectionId pasted in place of a
// trackId. Lives in its own file (and runs via its own npm script and
// workflow) so a path-filtered GitHub Action can fire it whenever a push
// touches src/puzzles/day-*.ts; the default `npm run test:unit` skips it.

interface ITunesResult {
  wrapperType?: string;
  collectionType?: string;
  kind?: string;
  trackId?: number;
  collectionId?: number;
  artistId?: number;
  previewUrl?: string;
}

const allIds = [
  ...new Set(puzzles.flatMap((p) => p.themes.flatMap((t) => t.tracks.map((tr) => tr.id)))),
];

describe('iTunes IDs resolve to playable song tracks', () => {
  it(
    `resolves ${allIds.length} ID(s) to song tracks with previews`,
    async () => {
      // iTunes' /lookup endpoint accepts ~200 IDs per call; batch comfortably
      // under that. Each batch is one HTTP request; ~5 calls cover the fleet.
      const BATCH_SIZE = 100;
      const results: ITunesResult[] = [];
      for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
        const batch = allIds.slice(i, i + BATCH_SIZE);
        const res = await fetch(`https://itunes.apple.com/lookup?id=${batch.join(',')}`, {
          signal: AbortSignal.timeout(15000),
        });
        expect(res.ok, `iTunes lookup HTTP ${res.status}`).toBe(true);
        const data = (await res.json()) as { results: ITunesResult[] };
        results.push(...data.results);
      }

      // Map every ID back to the track that uses it so failures name the
      // artist/title/day, not just an opaque ID.
      const trackById = new Map<number, { day: number; artist: string; title: string }>();
      for (const p of puzzles) {
        for (const theme of p.themes) {
          for (const t of theme.tracks) {
            if (!trackById.has(t.id)) {
              trackById.set(t.id, { day: p.day, artist: t.artist, title: t.title });
            }
          }
        }
      }

      // Collect all bad IDs and assert at the end so one pass reports every
      // failure — useful when iTunes drops several catalog entries at once.
      const failures: string[] = [];
      for (const id of allIds) {
        const ctx = trackById.get(id);
        const label = ctx
          ? `day ${ctx.day} id ${id} (${ctx.artist} — ${ctx.title})`
          : `id ${id}`;

        const asTrack = results.find((r) => r.wrapperType === 'track' && r.trackId === id);
        if (!asTrack) {
          const other = results.find(
            (r) => r.trackId === id || r.collectionId === id || r.artistId === id,
          );
          failures.push(
            other
              ? `${label} resolved to ${other.wrapperType}/${other.collectionType ?? other.kind ?? '?'}, expected a song track`
              : `${label} returned no result from iTunes`,
          );
          continue;
        }
        if (asTrack.kind !== 'song') {
          failures.push(`${label} kind is "${asTrack.kind}", expected "song"`);
        }
        if (!(typeof asTrack.previewUrl === 'string' && asTrack.previewUrl.length > 0)) {
          failures.push(`${label} has no previewUrl`);
        }
      }

      expect(failures, `${failures.length} iTunes ID(s) failed:\n  ${failures.join('\n  ')}`).toEqual([]);
    },
    60_000,
  );
});
