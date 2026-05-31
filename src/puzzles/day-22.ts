import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 22,
  date: '2026-05-31',
  author: 'Rob Wood',
  releaseAt: '2026-05-31T00:00:00Z',
  themes: [
    {
      theme: 'Bangers from the Sing movie soundrack',
      tracks: [
        { id: 1440912993, artist: 'Elton John', title: "I'm Still Standing" },
        { id: 1440936016, artist: 'Taylor Swift', title: 'Shake It Off' },
        { id: 1440806739, artist: 'Queen', title: 'Under Pressure' },
        { id: 192678693, artist: 'Leonard Cohen', title: 'Hallelujah' },
      ],
    },
    {
      theme: 'Songs featuring a didgeridoo',
      tracks: [
        { id: 1744404480, artist: 'Aphex Twin', title: 'Didgeridoo' },
        { id: 344481734, artist: 'Jamiroquai', title: 'When You Gonna Learn?' },
        { id: 1675375195, artist: 'Kate Bush', title: 'The Dreaming' },
        { id: 1056468746, artist: 'Like a Storm', title: 'Love the Way You Hate Me' },
      ],
    },
    {
      theme: 'Smugglers and Pirates',
      tracks: [
        { id: 1694459811, artist: 'Elastic Justice', title: 'The Melody of Pirate Software' },
        { id: 332518134, artist: 'Great Big Sea', title: 'French Perfume' },
        { id: 1718025213, artist: 'MudLark', title: 'Budgie Smuggler' },
        { id: 951931645, artist: 'Arrogant Worms', title: 'The Last Saskatchewan Pirate' },
      ],
    },
    {
      theme: 'Bands that changed names at least twice',
      tracks: [
        { id: 281811771, artist: 'Jefferson Airplane', title: 'White Rabbit', note: 'Jefferson Airplane/Jefferson Starship/Starship' },
        { id: 590431785, artist: 'Linkin Park', title: 'In the End', note: 'Xero/Hybrid Theory/Lincoln Park/Linkin Park' },
        { id: 1440855898, artist: 'Snow Patrol', title: 'Chasing Cars', note: 'Shrug/Polarbear/Snow Patrol' },
        { id: 1441133277, artist: 'The Beatles', title: 'Hey Jude', note: 'The Blackjacks/The Quarry Men/Johnny and the Moondogs/The Beatles' },
      ],
    },
  ],
};

export default puzzle;
