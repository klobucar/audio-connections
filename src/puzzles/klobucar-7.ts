// New here? See PUZZLE_AUTHORS.md at the repo root for the full guide.
// Copy this file to src/puzzles/<your-github-handle>-N.ts,
// fill in the fields, then run `npm run validate` to check your work before
// opening a PR. The day number and release date aren't set here — accepted
// puzzles can sit in the backlog until a maintainer schedules them.

import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Jonathon Klobucar',
  themes: [
    {
      theme: 'Fabrics in the title',
      tracks: [
        { id: 1837530994, artist: 'Alannah Myles', title: 'Black Velvet', note: '' },
        { id: 426356562, artist: 'Pearl Jam', title: 'Corduroy', note: '' },
        { id: 255961201, artist: 'Rednex', title: 'Cotton Eye Joe', note: '' },
        { id: 1444127751, artist: 'The Moody Blues', title: 'Nights in White Satin', note: '' },
      ],
    },
    {
      theme: 'Songs about computers',
      tracks: [
        { id: 1445873820, artist: 'St. Vincent', title: 'Digital Witness', note: '' },
        { id: 1349993539, artist: 'Janelle Monáe', title: 'Take a Byte', note: 'From Dirty Computer' },
        { id: 1571419368, artist: 'Bo Burnham', title: 'Welcome to the Internet', note: '' },
        { id: 693751201, artist: 'Daft Punk', title: 'Technologic', note: '' },
      ],
    },
    {
      theme: 'Produced by Giorgio Moroder',
      tracks: [
        { id: 284659248, artist: 'Irene Cara', title: 'Flashdance… What a Feeling', note: 'Flashdance (1983)' },
        { id: 1442959426, artist: 'Donna Summer', title: 'I Feel Love', note: '1977 — Moroder\'s synth-disco landmark' },
        { id: 1637981289, artist: 'Paul Engemann', title: 'Scarface (Push It to the Limit)', note: 'Scarface (1983)' },
        { id: 387193955, artist: 'Kenny Loggins', title: 'Danger Zone', note: 'Top Gun (1986)' },
      ],
    },
    {
      theme: 'The album was basically an obituary',
      tracks: [
        { id: 1676286742, artist: 'David Bowie', title: 'Lazarus', note: 'Blackstar — released two days before his death' },
        { id: 1154297433, artist: 'Leonard Cohen', title: 'You Want It Darker', note: 'Released weeks before his death' },
        { id: 2521492, artist: 'Warren Zevon', title: 'Keep Me in Your Heart', note: 'The Wind — recorded while terminally ill' },
        { id: 108232953, artist: 'J Dilla', title: 'Last Donut of the Night', note: 'Donuts — released three days before his death' },
      ],
    },
  ],
};

export default puzzle;
