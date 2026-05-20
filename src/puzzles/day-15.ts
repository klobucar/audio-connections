import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 15,
  date: '2026-05-24',
  author: 'Jonathon Klobucar',
  releaseAt: '2026-05-24T00:00:00Z',
  themes: [
    {
      theme: 'Spelled-out letters in the title',
      tracks: [
        { id: 1443926626, artist: 'Village People', title: 'Y.M.C.A.' },
        { id: 715748058, artist: 'Nat King Cole', title: 'L-O-V-E' },
        { id: 259751997, artist: 'Justice', title: 'D.A.N.C.E.' },
        { id: 1422648966, artist: 'ABBA', title: 'SOS' },
      ],
    },
    {
      theme: 'Fire in the title',
      tracks: [
        { id: 1192962303, artist: 'The Doors', title: 'Light My Fire' },
        { id: 251002253, artist: 'Johnny Cash', title: 'Ring of Fire' },
        { id: 158816462, artist: 'Billy Joel', title: "We Didn't Start the Fire" },
        { id: 1741021428, artist: 'The Prodigy', title: 'Fire' },
      ],
    },
    {
      theme: 'A span of time in the title',
      tracks: [
        { id: 724040009, artist: 'Robbie Williams', title: 'Millennium' },
        { id: 65122547, artist: 'Alphaville', title: 'Forever Young' },
        { id: 271371090, artist: 'Bowling for Soup', title: '1985' },
        { id: 1443111432, artist: 'Scott Walker', title: '30 Century Man' },
      ],
    },
    {
      theme: 'Famous for the Wall of Sound',
      tracks: [
        { id: 420123652, artist: 'The Ronettes', title: 'Be My Baby', note: 'Phil Spector' },
        { id: 1440843863, artist: 'The Beach Boys', title: "Wouldn't It Be Nice", note: 'Brian Wilson' },
        { id: 1504111288, artist: 'Bonnie Tyler', title: 'Total Eclipse of the Heart', note: 'Jim Steinman' },
        { id: 994424268, artist: 'Sonny & Cher', title: 'I Got You Babe', note: 'Sonny Bono' },
      ],
    },
  ],
};

export default puzzle;
