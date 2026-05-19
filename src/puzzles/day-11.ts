import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 11,
  date: '2026-05-20',
  author: 'Jonathon Klobucar',
  releaseAt: '2026-05-20T00:00:00Z',
  themes: [
    {
      theme: 'Body part in the title',
      tracks: [
        { id: 724363409, artist: 'Kim Carnes', title: 'Bette Davis Eyes' },
        { id: 1440930363, artist: 'Blondie', title: 'Heart of Glass' },
        { id: 1817217063, artist: 'Shakira', title: "Hips Don't Lie" },
        { id: 1440756026, artist: 'Billy Ray Cyrus', title: 'Achy Breaky Heart' },
      ],
    },
    {
      theme: 'Songs over 7 minutes long',
      tracks: [
        { id: 1440850519, artist: 'The Who', title: "Won't Get Fooled Again", note: '8:36' },
        { id: 1389971322, artist: "Guns N' Roses", title: 'Civil War', note: '7:42' },
        { id: 1423285462, artist: 'Lynyrd Skynyrd', title: 'Free Bird', note: '9:09' },
        { id: 780234010, artist: 'Iron Butterfly', title: 'In-A-Gadda-Da-Vida', note: '17:04' },
      ],
    },
    {
      theme: 'Songs about a real person',
      tracks: [
        { id: 157451654, artist: 'Bob Dylan', title: 'Hurricane', note: 'Rubin "Hurricane" Carter' },
        { id: 1440863118, artist: 'Elton John', title: 'Candle in the Wind', note: 'Marilyn Monroe (1973 original)' },
        { id: 1440834638, artist: 'Don McLean', title: 'Vincent', note: 'Vincent van Gogh' },
        { id: 1443184298, artist: 'U2', title: 'Pride (In the Name of Love)', note: 'Martin Luther King Jr.' },
      ],
    },
    {
      theme: 'Bassist is the lead singer',
      tracks: [
        { id: 1197789377, artist: 'Thundercat', title: "A Fan's Mail (Tron Song Suite II)", note: 'Thundercat — bass & lead vocals' },
        { id: 1440744163, artist: 'The Police', title: 'Message in a Bottle', note: 'Sting — bass & lead vocals' },
        { id: 1440943745, artist: 'Wings', title: 'Silly Love Songs', note: 'McCartney — bass & lead vocals' },
        { id: 1439443121, artist: 'Motörhead', title: 'Ace of Spades', note: 'Lemmy — bass & lead vocals' },
      ],
    },
  ],
};

export default puzzle;
