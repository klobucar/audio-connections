import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 28,
  date: '2026-06-06',
  author: 'Rob Wood',
  releaseAt: '2026-06-06T00:00:00Z',
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
      theme: 'Songs with killer Saxophone solos',
      tracks: [
        { id: 429945616, artist: 'George Michael', title: 'Careless Whisper' },
        { id: 1442810074, artist: 'Cary Rae Jepsen', title: 'Run Away with Me' },
        { id: 693606496, artist: 'Gerry Rafferty', title: 'Baker Street' },
        { id: 1445883162, artist: 'Gino Vannelli', title: 'I Just Wanna Stop' },
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
      theme: 'Bands that changed names 3 or more times',
      tracks: [
        { id: 281811771, artist: 'Jefferson Airplane', title: 'White Rabbit' },
        { id: 590431785, artist: 'Linkin Park', title: 'In the End' },
        { id: 1440855898, artist: 'Snow Patrol', title: 'Chasing Cars' },
        { id: 1441133277, artist: 'The Beatles', title: 'Hey Jude' },
      ],
    },
  ],
};

export default puzzle;
