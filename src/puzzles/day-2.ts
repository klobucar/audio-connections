import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 2,
  date: '2026-05-11',
  author: 'Corey Farwell',
  releaseAt: '2026-05-11T00:00:00Z',
  themes: [
    {
      theme: 'Songs made for movies',
      tracks: [
        { id: 507536740, artist: 'Céline Dion', title: 'My Heart Will Go On', note: 'Titanic' },
        { id: 254685026, artist: 'Survivor', title: 'Eye of the Tiger', note: 'Rocky III' },
        { id: 1440903439, artist: 'Eminem', title: 'Lose Yourself', note: '8 Mile' },
        { id: 203304387, artist: 'Simon & Garfunkel', title: 'Mrs. Robinson', note: 'The Graduate' },
      ],
    },
    {
      theme: 'Sense in the title',
      tracks: [
        { id: 1440783625, artist: 'Nirvana', title: 'Smells Like Teen Spirit', note: 'smell' },
        { id: 217273922, artist: 'Johnny Nash', title: 'I Can See Clearly Now', note: 'sight' },
        { id: 1550208949, artist: 'Mariah Carey', title: 'Touch My Body', note: 'touch' },
        { id: 1444106658, artist: 'Marvin Gaye', title: 'I Heard It Through the Grapevine', note: 'hearing' },
      ],
    },
    {
      theme: 'Cover of a Beatles song',
      tracks: [
        { id: 1434916256, artist: 'Joe Cocker', title: 'With a Little Help from My Friends' },
        { id: 1469582093, artist: 'Stevie Wonder', title: 'We Can Work It Out' },
        { id: 995304388, artist: 'Tina Turner', title: 'Help!' },
        { id: 1738363769, artist: 'Beyoncé', title: 'BLACKBIIRD' },
      ],
    },
    {
      theme: 'Profession in the name',
      tracks: [
        { id: 1752214923, artist: 'Sabrina Carpenter', title: 'Espresso' },
        { id: 169628364, artist: 'Spin Doctors', title: 'Two Princes' },
        { id: 1440797616, artist: 'The Police', title: 'Roxanne' },
        { id: 20922894, artist: 'The Postal Service', title: 'Such Great Heights' },
      ],
    },
  ],
};

export default puzzle;
