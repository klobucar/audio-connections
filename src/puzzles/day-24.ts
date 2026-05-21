import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 24,
  date: '2026-06-02',
  author: 'Frankie Arana',
  releaseAt: '2026-06-02T00:00:00Z',
  themes: [
    {
      theme: "Songs about Workin'",
      tracks: [
        { id: 411941745, artist: 'Dolly Parton', title: '9 to 5' },
        { id: 1809209397, artist: 'Loverboy', title: 'Working for the Weekend' },
        { id: 1443196867, artist: 'Donna Summer', title: 'She Works Hard for the Money' },
        { id: 295509796, artist: 'Lee Dorsey', title: 'Working in the Coal Mine' },
      ],
    },
    {
      theme: '"Step" in the song title',
      tracks: [
        { id: 1109715066, artist: 'Radiohead', title: '15 Step' },
        { id: 1440773792, artist: 'Bobby Brown', title: 'Every Little Step' },
        { id: 1450141547, artist: 'The Cardigans', title: 'Step On Me' },
        { id: 157281771, artist: 'New Kids on the Block', title: 'Step by Step' },
      ],
    },
    {
      theme: 'Songs that sample Oh Honey - Delegation',
      tracks: [
        { id: 1444773950, artist: 'Ice Cube', title: "Ain't Got No Haters" },
        { id: 1752591733, artist: 'Kali Uchis', title: 'Never Be Yours' },
        { id: 1464818052, artist: 'Your Old Droog', title: 'Train Love' },
        { id: 1440791850, artist: 'Dizzee Rascal', title: 'Chillin Wiv Da Mandem' },
      ],
    },
    {
      theme: "Songs about Cheatin'",
      tracks: [
        { id: 270246711, artist: 'TLC', title: 'Creep' },
        { id: 1440745627, artist: 'Shaggy', title: "It Wasn't Me" },
        { id: 1444201924, artist: 'Montell Jordan', title: 'Get It On Tonite' },
        { id: 1443846163, artist: 'Rupert Holmes', title: 'Escape (The Pina Colada Song)' },
      ],
    },
  ],
};

export default puzzle;
