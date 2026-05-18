import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 16,
  date: '2026-05-25',
  author: 'Rob Chahin',
  releaseAt: '2026-05-25T00:00:00Z',
  themes: [
    {
      theme: 'Acronyms / initialisms',
      tracks: [
        { id: 1422648513, artist: 'ABBA', title: 'Dancing Queen' },
        { id: 1422693816, artist: 'R.E.M.', title: 'Losing My Religion' },
        { id: 270246724, artist: 'TLC', title: 'Waterfalls' },
        { id: 574050602, artist: 'AC/DC', title: 'Back In Black' },
      ],
    },
    {
      theme: 'Murdered artists',
      tracks: [
        { id: 1440853776, artist: 'John Lennon', title: 'Imagine' },
        { id: 714819752, artist: 'Selena', title: 'Bidi Bidi Bom Bom' },
        { id: 1440662041, artist: '2Pac', title: 'California Love' },
        { id: 158539332, artist: 'Marvin Gaye', title: 'Sexual Healing' },
      ],
    },
    {
      theme: 'Artist name contains "Orchestra"',
      tracks: [
        { id: 196426738, artist: 'Electric Light Orchestra', title: 'Mr. Blue Sky' },
        { id: 714776989, artist: 'Orchestral Manoeuvres In the Dark', title: 'Enola Gay' },
        { id: 206345482, artist: 'Trans-Siberian Orchestra', title: 'Christmas / Sarajevo 12/24' },
        { id: 259203745, artist: 'Glenn Miller and His Orchestra', title: 'In the Mood' },
      ],
    },
    {
      theme: 'Unusual time signatures',
      tracks: [
        { id: 193085790, artist: 'The Dave Brubeck Quartet', title: 'Take Five', note: '5/4' },
        { id: 1415203735, artist: 'Sting', title: 'Seven Days', note: '5/4' },
        { id: 986876652, artist: 'Peter Gabriel', title: 'Solsbury Hill', note: '7/4' },
        { id: 1444100762, artist: 'Lalo Schifrin', title: 'Mission: Impossible', note: '5/4' },
      ],
    },
  ],
};

export default puzzle;
