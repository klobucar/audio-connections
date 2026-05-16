import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 10,
  date: '2026-05-19',
  author: 'Rob Chahin',
  releaseAt: '2026-05-19T00:00:00Z',
  themes: [
    {
      theme: 'Famous Ricks',
      tracks: [
        { id: 1559885421, artist: 'Rick Astley', title: 'Never Gonna Give You Up' },
        { id: 1440778713, artist: 'Rick Ross', title: "Hustlin'" },
        { id: 1440805227, artist: 'Rick James', title: 'Super Freak' },
        { id: 286005748, artist: 'Rick Springfield', title: "Jessie's Girl" },
      ],
    },
    {
      theme: 'Movie titles',
      tracks: [
        { id: 1454593961, artist: 'Irene Cara', title: 'Fame' },
        { id: 388155861, artist: 'Roy Orbison', title: 'Oh, Pretty Woman' },
        { id: 279366591, artist: 'Will Smith', title: 'Men in Black' },
        { id: 1170755174, artist: "Quad City DJ's", title: 'Space Jam' },
      ],
    },
    {
      theme: 'Artists with more famous siblings',
      tracks: [
        { id: 303171653, artist: 'Aaron Carter', title: "That's How I Beat Shaq", note: 'brother of Nick Carter (Backstreet Boys)' },
        { id: 1440838749, artist: 'Janet Jackson', title: 'Rhythm Nation', note: 'sister of Michael Jackson' },
        { id: 1444134333, artist: 'Daniel Bedingfield', title: 'Gotta Get Thru This', note: 'brother of Natasha Bedingfield' },
        { id: 1478457166, artist: 'Warren G', title: 'Regulate', note: 'stepbrother of Dr. Dre' },
      ],
    },
    {
      theme: 'Songs covered by Whitney Houston',
      tracks: [
        { id: 282883579, artist: 'Dolly Parton', title: 'I Will Always Love You' },
        { id: 281615481, artist: 'Chaka Khan', title: "I'm Every Woman" },
        { id: 1122666765, artist: 'George Benson', title: 'The Greatest Love of All' },
        { id: 1449494596, artist: 'Steve Winwood', title: 'Higher Love' },
      ],
    },
  ],
};

export default puzzle;
