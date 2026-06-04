import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Jonathon Klobucar',
  themes: [
    {
      theme: 'Songs about boats',
      tracks: [
        { id: 1440841256, artist: 'The Beach Boys', title: 'Sloop John B' },
        { id: 1440713347, artist: 'Styx', title: 'Come Sail Away' },
        { id: 1452841465, artist: 'The Lonely Island', title: "I'm On a Boat (feat. T-Pain)" },
        { id: 1775785180, artist: 'Cate Le Bon', title: 'Harbour' },
      ],
    },
    {
      theme: 'Songs used as TV sport intros',
      tracks: [
        { id: 1817648857, artist: 'John Tesh', title: 'Roundball Rock', note: 'NBA on NBC' },
        { id: 651880159, artist: 'Fleetwood Mac', title: 'The Chain', note: 'BBC Formula 1 theme, 1978–96 & 2009–15' },
        { id: 1361376912, artist: 'Brian Tyler', title: 'Formula 1 Theme', note: 'F1 official theme' },
        { id: 1645084915, artist: 'Johnny Pearson', title: 'Heavy Action', note: 'Monday Night Football' },
      ],
    },
    {
      theme: 'Buying a house, step by step',
      tracks: [
        { id: 1819861170, artist: 'Sabrina Carpenter', title: 'House Tour', note: 'the viewing' },
        { id: 574050345, artist: 'AC/DC', title: 'Down Payment Blues', note: 'the deposit' },
        { id: 207074245, artist: 'Leftfield', title: 'Inspection (Check One)', note: 'the survey' },
        { id: 1432108898, artist: 'Semisonic', title: 'Closing Time', note: 'completion' },
      ],
    },
    {
      theme: 'Dave Grohl played drums',
      tracks: [
        { id: 1440759940, artist: 'Queens of the Stone Age', title: 'Go with the Flow', note: 'Songs for the Deaf (2002)' },
        { id: 1440852198, artist: 'Nine Inch Nails', title: 'The Hand That Feeds', note: 'With Teeth (2005)' },
        { id: 203998301, artist: 'Tenacious D', title: 'Beelzeboss (The Final Showdown)', note: 'The Pick of Destiny (2006) — also voices Satan' },
        { id: 1852692498, artist: 'The Prodigy', title: 'Run with the Wolves', note: 'Invaders Must Die (2009)' },
      ],
    },
  ],
};

export default puzzle;
