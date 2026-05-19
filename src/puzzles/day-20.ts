import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 20,
  date: '2026-05-29',
  author: 'Rob Chahin',
  releaseAt: '2026-05-29T00:00:00Z',
  themes: [
    {
      theme: '"Midnight" in the title',
      tracks: [
        { id: 1649434301, artist: 'Taylor Swift', title: 'Midnight Rain' },
        { id: 943204009, artist: 'Gladys Knight & The Pips', title: 'Midnight Train to Georgia' },
        { id: 537029676, artist: 'Wilson Pickett', title: 'In the Midnight Hour' },
        { id: 1442737712, artist: 'Patsy Cline', title: "Walkin' After Midnight" },
      ],
    },
    {
      theme: 'Gay artists',
      tracks: [
        { id: 1452863597, artist: 'Elton John', title: 'Tiny Dancer' },
        { id: 192821659, artist: 'Ricky Martin', title: "Livin' la Vida Loca" },
        { id: 1468166468, artist: 'Lil Nas X', title: 'Old Town Road' },
        { id: 282658468, artist: 'George Michael', title: 'Faith' },
      ],
    },
    {
      theme: 'Lesbian artists',
      tracks: [
        { id: 201265808, artist: 'Indigo Girls', title: 'Closer to Fine' },
        { id: 352478721, artist: 'k.d. lang', title: 'Constant Craving' },
        { id: 1443720584, artist: 'Melissa Etheridge', title: 'I Want to Come Over' },
        { id: 1707413109, artist: 'Chappell Roan', title: 'Pink Pony Club' },
      ],
    },
    {
      theme: 'Songs rejected by other artists',
      tracks: [
        { id: 273143820, artist: 'Britney Spears', title: '...Baby One More Time', note: 'TLC passed' },
        { id: 1441154437, artist: 'Rihanna', title: 'Umbrella (feat. JAY-Z)', note: 'Britney Spears, Mary J. Blige passed' },
        { id: 1443234020, artist: 'Simple Minds', title: "Don't You (Forget About Me)", note: 'Bryan Ferry, Chrissie Hynde, Billy Idol passed' },
        { id: 1442897218, artist: 'The Weather Girls', title: "It's Raining Men", note: 'Donna Summer, Diana Ross, Cher, Streisand passed' },
      ],
    },
  ],
};

export default puzzle;
