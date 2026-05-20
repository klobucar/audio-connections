import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 15,
  date: '2026-05-24',
  author: 'Jonathon Klobucar',
  releaseAt: '2026-05-24T00:00:00Z',
  themes: [
    {
      theme: 'Tarot card in the title',
      tracks: [
        { id: 1391327247, artist: 'Smash Mouth', title: "Walkin' on the Sun", note: 'The Sun' },
        { id: 1440858129, artist: 'Frank Sinatra', title: 'Fly Me to the Moon', note: 'The Moon' },
        { id: 1500643398, artist: 'The Rolling Stones', title: 'Sympathy for the Devil', note: 'The Devil' },
        { id: 1441163498, artist: 'The Beatles', title: 'The Fool on the Hill', note: 'The Fool' },
      ],
    },
    {
      theme: 'Number in the title',
      tracks: [
        { id: 1446013598, artist: 'Nena', title: '99 Luftballons' },
        { id: 273166378, artist: 'Dolly Parton', title: '9 to 5' },
        { id: 1322068804, artist: 'Lou Bega', title: 'Mambo No. 5' },
        { id: 1450334168, artist: 'Ariana Grande', title: '7 rings' },
      ],
    },
    {
      theme: 'Famous saxophone solo',
      tracks: [
        { id: 693606496, artist: 'Gerry Rafferty', title: 'Baker Street' },
        { id: 193085066, artist: 'George Michael', title: 'Careless Whisper' },
        { id: 1531037503, artist: 'John Coltrane', title: 'Giant Steps' },
        { id: 1045058681, artist: 'Bruce Springsteen', title: 'Born to Run' },
      ],
    },
    {
      theme: 'Music video directed by Hype Williams',
      tracks: [
        { id: 302943332, artist: 'Missy Elliott', title: 'The Rain (Supa Dupa Fly)' },
        { id: 1440777314, artist: 'Jay-Z', title: "Big Pimpin'" },
        { id: 321975721, artist: 'Busta Rhymes', title: 'Put Your Hands Where My Eyes Could See' },
        { id: 1440763833, artist: 'Kanye West', title: 'Gold Digger' },
      ],
    },
  ],
};

export default puzzle;
