import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 19,
  date: '2026-05-28',
  author: 'Jonathon Klobucar',
  releaseAt: '2026-05-28T00:00:00Z',
  themes: [
    {
      theme: 'City in the title',
      tracks: [
        { id: 217635876, artist: 'Elvis Presley', title: 'Viva Las Vegas' },
        { id: 300207270, artist: 'Randy Newman', title: 'I Love L.A.' },
        { id: 712606043, artist: 'Tony Bennett', title: 'I Left My Heart in San Francisco' },
        { id: 259204195, artist: 'Glenn Miller and His Orchestra', title: "(I've Got a Gal In) Kalamazoo" },
      ],
    },
    {
      theme: "Some form of 'sing' in the title",
      tracks: [
        { id: 1590332409, artist: 'The New Pornographers', title: 'Sing Me Spanish Techno' },
        { id: 181630629, artist: 'Cake', title: 'Opera Singer' },
        { id: 1455420758, artist: 'Gene Kelly', title: "Singin' in the Rain" },
        { id: 1440656636, artist: 'The Moody Blues', title: "I'm Just a Singer (In a Rock and Roll Band)" },
      ],
    },
    {
      theme: '80s one-hit wonders',
      tracks: [
        { id: 398483947, artist: 'Falco', title: 'Rock Me Amadeus' },
        { id: 40633228, artist: 'Peter Schilling', title: 'Major Tom (Coming Home)' },
        { id: 1443124564, artist: 'Corey Hart', title: 'Sunglasses at Night' },
        { id: 1589119250, artist: 'Rockwell', title: "Somebody's Watching Me" },
      ],
    },
    {
      theme: 'Songs referencing a sci-fi property',
      tracks: [
        { id: 714905123, artist: 'Fatboy Slim', title: 'Weapon of Choice', note: 'Dune' },
        { id: 1097861770, artist: 'Radiohead', title: 'Paranoid Android', note: "The Hitchhiker's Guide to the Galaxy" },
        { id: 1440645631, artist: 'Queen', title: 'Flash', note: 'Flash Gordon' },
        { id: 313873494, artist: 'Eurythmics', title: 'Sex Crime (1984)', note: "Orwell's Nineteen Eighty-Four" },
      ],
    },
  ],
};

export default puzzle;
