import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 7,
  date: '2026-05-16',
  author: 'Corey Farwell',
  releaseAt: '2026-05-16T00:00:00Z',
  themes: [
    {
      theme: 'Songs about a US state',
      tracks: [
        { id: 1413948381, artist: 'Lynyrd Skynyrd', title: 'Sweet Home Alabama', note: 'Alabama' },
        { id: 1881665710, artist: 'Ray Charles', title: 'Georgia on My Mind', note: 'Georgia' },
        { id: 1440777015, artist: 'JAY-Z', title: 'Empire State of Mind', note: 'New York; feat. Alicia Keys' },
        { id: 1425259894, artist: 'The Mamas & The Papas', title: "California Dreamin'", note: 'California' },
      ],
    },
    {
      theme: 'Bands with a number in their name',
      tracks: [
        { id: 1428782513, artist: 'Maroon 5', title: 'This Love' },
        { id: 1440659999, artist: 'Sum 41', title: 'Fat Lip' },
        { id: 1440840510, artist: 'blink-182', title: 'All the Small Things' },
        { id: 983850963, artist: "The B-52's", title: 'Love Shack' },
      ],
    },
    {
      theme: 'Songs with prominent cowbell',
      tracks: [
        { id: 217556132, artist: 'Blue Öyster Cult', title: "(Don't Fear) The Reaper" },
        { id: 1488653325, artist: 'The Rolling Stones', title: 'Honky Tonk Women' },
        { id: 1202371162, artist: 'War', title: 'Low Rider' },
        { id: 715534851, artist: 'Grand Funk Railroad', title: "We're an American Band" },
      ],
    },
    {
      theme: 'Bands named after a movie or book',
      tracks: [
        { id: 1440905717, artist: 'Veruca Salt', title: 'Seether', note: "character in Roald Dahl's Charlie and the Chocolate Factory" },
        { id: 190780833, artist: 'Modest Mouse', title: 'Float On', note: "phrase from Virginia Woolf's The Mark on the Wall" },
        { id: 1440860171, artist: 'Steppenwolf', title: 'Born to Be Wild', note: 'Hermann Hesse novel' },
        { id: 785232521, artist: 'Black Sabbath', title: 'Paranoid', note: '1963 Mario Bava horror film' },
      ],
    },
  ],
};

export default puzzle;
