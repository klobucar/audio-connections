import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 3,
  date: '2026-05-12',
  author: 'Corey Farwell',
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
};

export default puzzle;
