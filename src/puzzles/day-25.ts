import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 25,
  date: '2026-06-03',
  author: 'Jonathon Klobucar',
  releaseAt: '2026-06-03T00:00:00Z',
  themes: [
    {
      theme: 'Anime theme songs',
      tracks: [
        { id: 1521453384, artist: 'The Seatbelts', title: 'Tank!', note: 'Cowboy Bebop' },
        { id: 1721842999, artist: 'Nujabes feat. Shing02', title: 'Battlecry', note: 'Samurai Champloo' },
        { id: 1613377502, artist: 'Rui Nagai', title: 'Big-O!', note: 'The Big O' },
        { id: 1317448793, artist: 'Jason Paige', title: 'Pokémon Theme', note: 'Pokémon' },
      ],
    },
    {
      theme: 'Songs used in Donnie Darko',
      tracks: [
        { id: 906900619, artist: 'Gary Jules', title: 'Mad World' },
        { id: 1440825700, artist: 'Tears for Fears', title: 'Head Over Heels' },
        { id: 693606402, artist: 'Duran Duran', title: 'Notorious' },
        { id: 31740178, artist: 'Echo & the Bunnymen', title: 'The Killing Moon' },
      ],
    },
    {
      theme: 'Artists who changed their name',
      tracks: [
        { id: 1442846328, artist: 'Kanye West', title: 'Stronger', note: 'now Ye' },
        { id: 1683195628, artist: 'Snoop Dogg', title: 'Gin and Juice', note: 'briefly Snoop Lion' },
        { id: 1586832573, artist: 'Cat Stevens', title: 'Peace Train', note: 'now Yusuf' },
        { id: 1545712784, artist: 'Prince', title: 'When Doves Cry', note: 'became "the Artist"' },
      ],
    },
    {
      theme: 'Did covers on social media first',
      tracks: [
        { id: 1440826320, artist: 'Justin Bieber', title: 'Sorry' },
        { id: 1729494488, artist: 'Madison Beer', title: 'Make You Mine' },
        { id: 1579117772, artist: 'Bella Poarch & Sub Urban', title: 'Inferno' },
        { id: 1724488124, artist: 'Benson Boone', title: 'Beautiful Things' },
      ],
    },
  ],
};

export default puzzle;
