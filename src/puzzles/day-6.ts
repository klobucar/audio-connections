import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 6,
  date: '2026-05-15',
  author: 'Corey Farwell',
  releaseAt: '2026-05-15T00:00:00Z',
  themes: [
    {
      theme: 'House in the title',
      tracks: [
        { id: 1442866180, artist: 'Madness', title: 'Our House' },
        { id: 300202249, artist: 'Talking Heads', title: 'Burning Down the House' },
        { id: 1440743961, artist: 'The Animals', title: 'House of the Rising Sun' },
        { id: 1442972077, artist: 'The Commodores', title: 'Brick House' },
      ],
    },
    {
      theme: 'Songs featured in Back to the Future',
      tracks: [
        { id: 1440829906, artist: 'Huey Lewis & The News', title: 'The Power of Love' },
        { id: 1440829927, artist: 'Alan Silvestri', title: 'Back to the Future', note: 'main theme; performed by The Outatime Orchestra' },
        { id: 1443115554, artist: 'The Penguins', title: 'Earth Angel (Will You Be Mine)' },
        { id: 1425230917, artist: 'Chuck Berry', title: 'Johnny B. Goode' },
      ],
    },
    {
      theme: 'Internal rhyme in the title',
      tracks: [
        { id: 1440751392, artist: 'Bill Haley and His Comets', title: 'Rock Around the Clock' },
        { id: 1657869393, artist: 'SZA', title: 'Kill Bill' },
        { id: 1097862833, artist: 'Radiohead', title: 'High and Dry' },
        { id: 159573861, artist: 'Cypress Hill', title: 'Insane in the Brain' },
      ],
    },
    {
      theme: 'Masked / anonymous artists',
      tracks: [
        { id: 926187884, artist: 'Slipknot', title: 'Duality' },
        { id: 1440946831, artist: 'Ghost', title: 'Square Hammer' },
        { id: 1654811470, artist: 'MF DOOM', title: 'Doomsday' },
        { id: 1446363543, artist: 'Orville Peck', title: 'Dead of Night' },
      ],
    },
  ],
};

export default puzzle;
