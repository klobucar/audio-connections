// New here? See PUZZLE_AUTHORS.md at the repo root for the full guide.
// Copy this file to src/puzzles/<your-github-handle>-N.ts,
// fill in the fields, then run `npm run validate` to check your work before
// opening a PR. The day number and release date aren't set here — accepted
// puzzles can sit in the backlog until a maintainer schedules them.

import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Samuel Judson',
  // constraint: 'All singing, all dancing',  // optional pill + DJ-note modal; keep it phrase-length (80 char soft cap)
  themes: [
    {
      theme: 'Can I Get A Number?',
      tracks: [
        { id: 1416159855, artist: 'Jill Scott', title: 'A Long Walk', note: '' },
        { id: 265973303, artist: 'Luther Vandross', title: 'Take You Out', note: '' },
        { id: 194025537, artist: 'B2K', title: 'Girlfriend', note: '' },
        { id: 1442463848, artist: 'Nelly Furtado (feat. Timbaland)', title: 'Promiscuous', note: '' },
      ],
    },
    {
      theme: 'To The Left, To The Left',
      tracks: [
        { id: 263059061, artist: 'Cupid', title: 'Cupid Shuffle', note: '' },
        { id: 1444059350, artist: 'Mr. C The Slide Man', title: 'Cha Cha Slide', note: '' },
        { id: 1389319986, artist: 'Chuck Brown', title: 'Block Party', note: '' },
        { id: 309118413, artist: 'Marcia Griffiths', title: 'Electric Boogie', note: '' },
      ],
    },
    {
      theme: 'Party Down',
      tracks: [
        { id: 721299398, artist: 'Bobby Womack', title: 'Daylight', note: '' },
        { id: 306681909, artist: 'J-Kwon', title: 'Tipsy', note: '' },
        { id: 1442959466, artist: 'Montell Jordan', title: 'This Is How We Do It', note: '' },
        { id: 1737085899, artist: 'Shaboozey', title: 'A Bar Song (Tipsy)', note: '' },
      ],
    },
    {
      theme: 'Wait… They’re White???',
      tracks: [
        { id: 1606064876, artist: 'Bobby Caldwell', title: 'What You Won\'t Do for Love', note: '' },
        { id: 1443225590, artist: 'Teena Marie', title: 'It Must Be Magic', note: '' },
        { id: 1191267548, artist: 'Lisa Stansfield', title: 'All Around The World', note: '' },
        { id: 358568310, artist: 'Michael McDonald', title: 'I Keep Forgetting (Every Time You’re Near)', note: '' },
      ],
    },
  ],
};

export default puzzle;
