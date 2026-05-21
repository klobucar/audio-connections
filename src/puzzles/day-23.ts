import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 23,
  date: '2026-06-01',
  author: 'Erika Rajkovic',
  releaseAt: '2026-06-01T00:00:00Z',
  themes: [
    {
      theme: 'Title phrased as a question',
      tracks: [
        { id: 1442259189, artist: 'Bee Gees', title: 'How Deep Is Your Love' },
        { id: 685585941, artist: 'The Clash', title: 'Should I Stay or Should I Go' },
        { id: 724474136, artist: 'Culture Club', title: 'Do You Really Want to Hurt Me' },
        { id: 1440948088, artist: 'Creedence Clearwater Revival', title: 'Have You Ever Seen the Rain?' },
      ],
    },
    {
      theme: 'Breakup songs',
      tracks: [
        { id: 594061859, artist: 'Fleetwood Mac', title: 'Go Your Own Way' },
        { id: 1057307827, artist: 'Carly Simon', title: "You're So Vain" },
        { id: 1536684150, artist: 'OutKast', title: 'Ms. Jackson' },
        { id: 1674691586, artist: 'Miley Cyrus', title: 'Flowers' },
      ],
    },
    {
      theme: 'Txtspeak in the title',
      tracks: [
        { id: 604742166, artist: 'P!nk', title: 'U + Ur Hand' },
        { id: 1560735856, artist: 'Olivia Rodrigo', title: 'Good 4 U' },
        { id: 268532564, artist: 'Usher', title: 'U Got It Bad' },
        { id: 1629185307, artist: "Sinéad O'Connor", title: 'Nothing Compares 2 U' },
      ],
    },
    {
      theme: 'Music biopic titles',
      tracks: [
        { id: 1440806768, artist: 'Queen', title: 'Bohemian Rhapsody', note: 'Bohemian Rhapsody (2018) — Freddie Mercury / Queen' },
        { id: 1440910931, artist: 'Elton John', title: 'Rocket Man', note: 'Rocketman (2019) — Elton John' },
        { id: 1890335608, artist: 'Johnny Cash', title: 'I Walk the Line', note: 'Walk the Line (2005) — Johnny Cash' },
        { id: 1440856228, artist: 'Amy Winehouse', title: 'Back to Black', note: 'Back to Black (2024) — Amy Winehouse' },
      ],
    },
  ],
};

export default puzzle;
