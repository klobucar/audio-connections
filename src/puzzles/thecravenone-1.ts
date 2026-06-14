// New here? See PUZZLE_AUTHORS.md at the repo root for the full guide.
// Copy this file to src/puzzles/<your-github-handle>-N.ts,
// fill in the fields, then run `npm run validate` to check your work before
// opening a PR. The day number and release date aren't set here — accepted
// puzzles can sit in the backlog until a maintainer schedules them.

import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'thecravenone',
  // constraint: 'All singing, all dancing',  // optional pill + DJ-note modal; keep it phrase-length (80 char soft cap)
  themes: [
    {
      theme: 'OK',
      tracks: [
        { id: 1890338470, artist: 'Merle Haggard', title: 'Okie From Muskogee', note: '' },
        { id: 1440787711, artist: 'Rodgers & Hammerstein', title: 'Oh, What a Beautiful Mornin\'', note: '' },
        { id: 1466310748, artist: 'MUNA', title: 'It\'s Gonna Be Okay, Baby', note: '' },
        { id: 715924747, artist: 'OK Go', title: 'C-C-C-Cinnamon Lips', note: '' },
      ],
    },
    {
      theme: 'Members of The Highwaymen',
      tracks: [
        { id: 885161085, artist: 'Willie Nelson', title: 'Whiskey River', note: '' },
        { id: 1118231743, artist: 'Kris Kristofferson', title: 'Why Me', note: '' },
        { id: 303088045, artist: 'Waylon Jennings', title: 'Amanda', note: '' },
        { id: 251003087, artist: 'Johnny Cash', title: 'Man in Black', note: '' },
      ],
    },
    {
      theme: 'Colorful Albums',
      tracks: [
        { id: 1590368453, artist: 'Taylor Swift', title: 'Red (Taylor\'s Version)', note: '' },
        { id: 1441133197, artist: 'The Beatles', title: 'Back in the U.S.S.R.', note: '' },
        { id: 1890580960, artist: 'Weezer', title: 'Buddy Holly', note: '' },
        { id: 1572046440, artist: 'Metallica', title: 'The Unforgiven', note: '' },
      ],
    },
    {
      theme: 'Bo Didley Beat',
      tracks: [
        { id: 1532267283, artist: 'Bluey', title: 'Bluey Theme (Extended)', note: '' },
        { id: 282658468, artist: 'George Michael', title: 'Faith', note: '' },
        { id: 292225406, artist: 'Bow Wow Wow', title: 'I Want Candy', note: '' },
        { id: 1469585598, artist: 'Buddy Holly & The Crickets', title: 'Not Fade Away', note: '' },
      ],
    },
  ],
};

export default puzzle;
