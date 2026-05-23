import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 19,
  date: '2026-05-28',
  author: 'Jonathon Klobucar',
  releaseAt: '2026-05-28T00:00:00Z',
  themes: [
    {
      theme: 'Animal in the title',
      tracks: [
        { id: 1440832763, artist: 'Steve Miller Band', title: 'Fly Like an Eagle' },
        { id: 304760997, artist: 'The Tokens', title: 'The Lion Sleeps Tonight' },
        { id: 983126008, artist: "The B-52's", title: 'Rock Lobster' },
        { id: 724214046, artist: 'Culture Club', title: 'Karma Chameleon' },
      ],
    },
    {
      theme: 'Songs about rainbows',
      tracks: [
        { id: 281116081, artist: 'Boards of Canada', title: 'ROYGBIV' },
        { id: 6920352, artist: "Israel Kamakawiwo'ole", title: 'Somewhere Over the Rainbow' },
        { id: 1440805962, artist: 'Kermit the Frog', title: 'Rainbow Connection' },
        { id: 1440918405, artist: 'Kacey Musgraves', title: 'Rainbow' },
      ],
    },
    {
      theme: 'Songs made for video games',
      tracks: [
        { id: 1445150297, artist: 'Breaking Benjamin', title: 'Blow Me Away', note: 'Halo 2' },
        { id: 929920756, artist: 'Ted Poley & Tony Harnell', title: 'Escape from the City', note: 'Sonic Adventure 2' },
        {
          id: 1540793097,
          artist: 'Rosa Walton & Hallie Coggins',
          title: 'I Really Want to Stay at Your House',
          note: 'Cyberpunk 2077 / Edgerunners',
        },
        { id: 1645947564, artist: 'Lil Nas X', title: "STAR WALKIN'", note: 'League of Legends' },
      ],
    },
    {
      theme: 'Dancers turned pop stars',
      tracks: [
        { id: 723700423, artist: 'Paula Abdul', title: 'Straight Up', note: 'Laker Girl' },
        { id: 265144699, artist: 'Jennifer Lopez', title: 'Waiting for Tonight', note: 'Fly Girl on In Living Color' },
        { id: 188261029, artist: 'Shakira', title: 'Whenever, Wherever', note: 'Belly dancer' },
        { id: 1440662037, artist: '2Pac', title: 'Changes', note: 'Digital Underground' },
      ],
    },
  ],
};

export default puzzle;
