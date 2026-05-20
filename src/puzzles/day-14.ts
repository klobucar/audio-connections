import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 14,
  date: '2026-05-23',
  author: 'Rob Chahin',
  releaseAt: '2026-05-23T00:00:00Z',
  themes: [
    {
      theme: 'Songs about San Francisco',
      tracks: [
        { id: 997088846, artist: 'Otis Redding', title: "(Sittin' On) The Dock of the Bay" },
        { id: 425320491, artist: 'Train', title: 'Save Me, San Francisco' },
        { id: 1450142860, artist: 'Scott McKenzie', title: 'San Francisco (Be Sure to Wear Some Flowers In Your Hair)' },
        { id: 1443787302, artist: 'Village People', title: "San Francisco (You've Got Me)" },
      ],
    },
    {
      theme: 'Artists with alter egos',
      tracks: [
        { id: 1445007713, artist: 'Miley Cyrus', title: 'Party In the U.S.A.', note: 'Hannah Montana' },
        { id: 1039797280, artist: 'David Bowie', title: 'Starman', note: 'Ziggy Stardust' },
        { id: 1379065464, artist: 'Childish Gambino', title: 'This Is America', note: 'Donald Glover' },
        { id: 1440821643, artist: 'Eminem', title: 'Without Me', note: 'Slim Shady' },
      ],
    },
    {
      theme: 'iPod ads',
      tracks: [
        { id: 1778048261, artist: 'Jet', title: 'Are You Gonna Be My Girl' },
        { id: 699701391, artist: 'Caesars', title: 'Jerk It Out' },
        { id: 1440891551, artist: 'U2', title: 'Vertigo' },
        { id: 1455130625, artist: 'Black Eyed Peas', title: 'Hey Mama' },
      ],
    },
    {
      theme: 'Banned songs',
      tracks: [
        { id: 1365569655, artist: 'Frankie Goes to Hollywood', title: 'Relax', note: 'BBC ban (1984), too provocative' },
        { id: 266317271, artist: 'Sex Pistols', title: 'God Save the Queen', note: "BBC ban (1977), Queen's Silver Jubilee" },
        { id: 1439223877, artist: 'The Kinks', title: 'Lola', note: 'BBC ban (until "Coca-Cola" replaced with "cherry cola")' },
        { id: 545183430, artist: 'Link Wray', title: 'Rumble', note: 'US radio bans (1958), feared incitement of violence' },
      ],
    },
  ],
};

export default puzzle;
