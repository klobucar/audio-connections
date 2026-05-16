import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 5,
  date: '2026-05-14',
  author: 'Corey Farwell',
  releaseAt: '2026-05-14T00:00:00Z',
  themes: [
    {
      theme: 'Primates in the artist name',
      tracks: [
        { id: 4512481, artist: 'The Monkees', title: "I'm a Believer", note: 'monkey' },
        { id: 850576665, artist: 'Gorillaz', title: 'Clint Eastwood', note: 'gorilla' },
        { id: 663097965, artist: 'Arctic Monkeys', title: 'Do I Wanna Know?', note: 'monkey' },
        { id: 724437870, artist: 'The Human League', title: "Don't You Want Me", note: 'human' },
      ],
    },
    {
      theme: 'Cats in the artist name',
      tracks: [
        { id: 1535560798, artist: 'Cat Stevens', title: 'Wild World', note: 'cat' },
        { id: 1486465101, artist: 'Doja Cat', title: 'Say So', note: 'cat' },
        { id: 1440762326, artist: 'The Pussycat Dolls', title: "Don't Cha", note: 'pussycat' },
        { id: 1440904267, artist: 'Def Leppard', title: 'Pour Some Sugar On Me', note: 'leopard' },
      ],
    },
    {
      theme: 'Birds in the artist name',
      tracks: [
        { id: 171708539, artist: 'Eagle-Eye Cherry', title: 'Save Tonight', note: 'eagle' },
        { id: 1440919037, artist: 'Sheryl Crow', title: 'All I Wanna Do', note: 'crow' },
        { id: 635770202, artist: 'Eagles', title: 'Hotel California', note: 'eagle' },
        { id: 155682268, artist: 'The Chicks', title: 'Wide Open Spaces', note: 'chick; f.k.a. Dixie Chicks' },
      ],
    },
    {
      theme: 'Canines in the artist name',
      tracks: [
        { id: 1485025432, artist: 'Dr. Dog', title: "Where'd All the Time Go?", note: 'dog' },
        { id: 1443396469, artist: 'Snoop Dogg', title: "Drop It Like It's Hot", note: 'dog' },
        { id: 327408153, artist: 'Bloodhound Gang', title: 'The Bad Touch', note: 'bloodhound' },
        { id: 281086428, artist: 'Fleet Foxes', title: 'White Winter Hymnal', note: 'fox' },
      ],
    },
  ],
};

export default puzzle;
