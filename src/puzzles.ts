import type { Puzzle } from './types';

export const puzzles: Puzzle[] = [
  {
    day: 1,
    date: '2026-05-10',
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
  },
  {
    day: 2,
    date: '2026-05-11',
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
  },
  {
    day: 3,
    date: '2026-05-12',
    releaseAt: '2026-05-12T00:00:00Z',
    themes: [
      {
        theme: 'Mr. ___ songs',
        tracks: [
          { id: 1440891171, artist: 'The Killers', title: 'Mr. Brightside' },
          { id: 196426738, artist: 'Electric Light Orchestra', title: 'Mr. Blue Sky' },
          { id: 1442449547, artist: 'Counting Crows', title: 'Mr. Jones' },
          { id: 1750853097, artist: 'The Chordettes', title: 'Mr. Sandman' },
        ],
      },
      {
        theme: 'Produce in the band name',
        tracks: [
          { id: 1440912292, artist: 'The Cranberries', title: 'Dreams' },
          { id: 725821929, artist: 'Blind Melon', title: 'No Rain' },
          { id: 721224621, artist: 'The Smashing Pumpkins', title: '1979' },
          { id: 945575413, artist: 'Red Hot Chili Peppers', title: 'Californication' },
        ],
      },
      {
        theme: 'French artists',
        tracks: [
          { id: 828259377, artist: 'M83', title: 'Midnight City' },
          { id: 696886431, artist: 'Daft Punk', title: 'Around the World' },
          { id: 1771710539, artist: 'Phoenix', title: '1901' },
          { id: 1452878212, artist: 'Debussy', title: 'Clair de Lune', note: 'performed by Jean-Yves Thibaudet' },
        ],
      },
      {
        theme: 'Frontpeople who went solo',
        tracks: [
          { id: 986876652, artist: 'Peter Gabriel', title: 'Solsbury Hill', note: 'Genesis' },
          { id: 1491226770, artist: 'Gwen Stefani', title: 'Hollaback Girl', note: 'No Doubt' },
          { id: 252606598, artist: 'Justin Timberlake', title: 'Rock Your Body', note: '*NSYNC' },
          { id: 300205685, artist: 'Björk', title: 'Army of Me', note: 'The Sugarcubes' },
        ],
      },
    ],
  },
];

export const MAX_MISTAKES = 4;
export const THEME_EMOJI = ['🟨', '🟩', '🟦', '🟪'] as const;

export function isReleased(p: Puzzle, now: number = Date.now()): boolean {
  if (!p.releaseAt) return true;
  return now >= new Date(p.releaseAt).getTime();
}

export function latestReleasedIndex(now: number = Date.now()): number {
  for (let i = puzzles.length - 1; i >= 0; i--) {
    if (isReleased(puzzles[i], now)) return i;
  }
  return 0;
}
