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
      theme: 'Songs that count',
      tracks: [
        { id: 1440837804, artist: 'Feist', title: '1234', note: '' },
        { id: 1550188241, artist: 'Charmian Carr & Dan Truhitte', title: 'Sixteen Going on Seventeen', note: 'The Sound of Music' },
        { id: 1197616359, artist: 'Manfred Mann', title: '5-4-3-2-1', note: '' },
        { id: 1442885978, artist: 'Jackson 5', title: 'ABC', note: 'Easy as 1-2-3' },
      ],
    },
    {
      theme: 'Pop songs built on a classical melody',
      tracks: [
        { id: 1682051688, artist: 'Procol Harum', title: 'A Whiter Shade of Pale', note: 'J.S. Bach' },
        { id: 1268087248, artist: 'Eric Carmen', title: 'All by Myself', note: 'Rachmaninoff — Piano Concerto No. 2' },
        { id: 194641408, artist: 'Barry Manilow', title: 'Could It Be Magic', note: 'Chopin — Prelude in C minor' },
        { id: 162508312, artist: 'Nas', title: 'I Can', note: 'Beethoven — "Für Elise"' },
      ],
    },
    {
      theme: 'Producer gets top billing',
      tracks: [
        { id: 259214627, artist: 'Mark Ronson', title: 'Valerie', note: 'Featuring Amy Winehouse' },
        { id: 1713469232, artist: 'Calvin Harris', title: 'Sweet Nothing', note: 'Featuring Florence Welch (Florence + the Machine)' },
        { id: 693224822, artist: 'David Guetta', title: 'Titanium', note: 'Featuring Sia' },
        { id: 1530325787, artist: 'Avicii', title: 'Wake Me Up', note: 'Featuring Aloe Blacc' },
      ],
    },
    {
      theme: 'Artists from Québec',
      tracks: [
        { id: 1355149519, artist: 'Simple Plan', title: 'I\'m Just a Kid', note: 'Montreal' },
        { id: 1249418627, artist: 'Arcade Fire', title: 'Rebellion (Lies)', note: 'Montreal' },
        { id: 1719975688, artist: 'Men I Trust', title: 'Show Me How', note: 'Montreal' },
        { id: 1876355939, artist: 'Angine de Poitrine', title: 'Fabienk', note: 'Saguenay' },
      ],
    },
  ],
};

export default puzzle;
