import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 19,
  date: '2026-05-28',
  author: 'Jonathon Klobucar',
  releaseAt: '2026-05-28T00:00:00Z',
  themes: [
    {
      theme: 'Dancers turned pop stars',
      tracks: [
        { id: 723700423, artist: 'Paula Abdul', title: 'Straight Up' },
        { id: 265144699, artist: 'Jennifer Lopez', title: 'Waiting for Tonight' },
        { id: 188261029, artist: 'Shakira', title: 'Whenever, Wherever' },
        { id: 386153478, artist: 'Usher', title: 'Yeah!' },
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
    {
      theme: 'Songs made for video games',
      tracks: [
        { id: 1445150297, artist: 'Breaking Benjamin', title: 'Blow Me Away', note: 'Halo 2' },
        { id: 1030633518, artist: 'Cynthia Harrell', title: 'Snake Eater', note: 'Metal Gear Solid 3' },
        {
          id: 1540793097,
          artist: 'Rosa Walton & Hallie Coggins',
          title: 'I Really Want to Stay at Your House',
          note: 'Cyberpunk 2077 / Edgerunners',
        },
        {
          id: 1645947564,
          artist: 'Lil Nas X',
          title: "STAR WALKIN' (League of Legends Worlds Anthem)",
          note: 'League of Legends',
        },
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
  ],
};

export default puzzle;
