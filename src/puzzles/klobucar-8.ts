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
      theme: 'Self-titled songs',
      tracks: [
        { id: 926186590, artist: 'Wilco', title: 'Wilco (The Song)', note: 'From Wilco (The Album)' },
        { id: 978942755, artist: 'Bad Company', title: 'Bad Company', note: '' },
        { id: 787645012, artist: 'Black Sabbath', title: 'Black Sabbath', note: '' },
        { id: 1863305830, artist: 'Run the Jewels', title: 'Run the Jewels', note: '' },
      ],
    },
    {
      theme: 'Driving / racing',
      tracks: [
        { id: 1434529339, artist: 'Teriyaki Boyz', title: 'Tokyo Drift (Fast & Furious)', note: '' },
        { id: 1861773610, artist: 'The Presidents of the United States of America', title: 'Highway Forever', note: '' },
        { id: 254347756, artist: 'Cake', title: 'The Distance', note: '' },
        { id: 1472504161, artist: 'Rihanna', title: 'Shut Up and Drive', note: '' },
      ],
    },
    {
      theme: 'Bay Area artists',
      tracks: [
        { id: 1275600554, artist: 'Metallica', title: 'Master of Puppets', note: 'El Cerrito / SF thrash' },
        { id: 1160082103, artist: 'Green Day', title: 'Longview', note: 'East Bay' },
        { id: 724210880, artist: 'Huey Lewis & The News', title: 'Hip to Be Square', note: 'San Francisco' },
        { id: 265816708, artist: 'Santana', title: 'Black Magic Woman', note: 'San Francisco' },
      ],
    },
    {
      theme: 'Upbeat anthems people misread',
      tracks: [
        { id: 203708455, artist: 'Bruce Springsteen', title: 'Born in the U.S.A.', note: 'A Vietnam vet\'s bitter lament, not a flag-waver' },
        { id: 177408447, artist: 'Barry Manilow', title: 'Copacabana (At the Copa)', note: 'Camp disco hiding a murder and lifelong grief' },
        { id: 1440846819, artist: 'Lynyrd Skynyrd', title: 'Sweet Home Alabama', note: 'Van Zant\'s reply to Neil Young\'s songs on Southern racism & civil rights' },
        { id: 1440673879, artist: 'Jimmy Buffett', title: 'Margaritaville', note: 'Beach escapism masking alcoholic self-destruction' },
      ],
    },
  ],
};

export default puzzle;
