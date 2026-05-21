import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 1,
  date: '2026-05-10',
  author: 'Corey Farwell',
  releaseAt: '2026-05-10T00:00:00Z',
  themes: [
    {
      theme: 'Heaven in the title',
      tracks: [
        { id: 31739774, artist: 'The Cure', title: 'Just Like Heaven' },
        { id: 580708180, artist: 'Led Zeppelin', title: 'Stairway to Heaven' },
        { id: 1648144423, artist: 'Eric Clapton', title: 'Tears in Heaven' },
        { id: 1440771048, artist: 'Belinda Carlisle', title: 'Heaven Is a Place on Earth' },
      ],
    },
    {
      theme: 'Canadian artists',
      tracks: [
        { id: 323395690, artist: 'Avril Lavigne', title: 'My Happy Ending' },
        { id: 1440661545, artist: 'Justin Bieber', title: 'Baby' },
        { id: 1440823965, artist: 'Bryan Adams', title: "Summer of '69" },
        { id: 1440656027, artist: 'Rush', title: 'Tom Sawyer' },
      ],
    },
    {
      theme: 'Bands with repeated names',
      tracks: [
        { id: 696670364, artist: 'Talk Talk', title: "It's My Life" },
        { id: 693610953, artist: 'Duran Duran', title: 'Hungry Like the Wolf' },
        { id: 1445308818, artist: 'Yeah Yeah Yeahs', title: 'Maps' },
        { id: 1440843876, artist: "The Go-Go's", title: 'We Got the Beat' },
      ],
    },
    {
      theme: 'Bands of all siblings',
      tracks: [
        { id: 1440790544, artist: 'Hanson', title: 'MMMBop' },
        { id: 1440912109, artist: 'Jackson 5', title: 'ABC' },
        { id: 1445664553, artist: 'Bee Gees', title: 'How Deep Is Your Love' },
        { id: 121052796, artist: 'Sister Sledge', title: 'We Are Family' },
      ],
    },
  ],
};

export default puzzle;
