// New here? See PUZZLE_AUTHORS.md at the repo root for the full guide.
// Copy this file to src/puzzles/<your-github-handle>-N.ts,
// fill in the fields, then run `npm run validate` to check your work before
// opening a PR. The day number and release date aren't set here — a maintainer
// schedules those in src/schedule.ts.

import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Samuel Judson',
  themes: [
    {
      theme: 'Movie Theme Ballads',
      tracks: [
        { id: 30475379, artist: 'Seal', title: 'Kiss From A Rose', note: 'Batman Forever' },
        { id: 1229320478, artist: 'Prince', title: 'Purple Rain', note: 'Purple Rain' },
        { id: 1440952880, artist: 'Paul McCartney & Wings', title: 'Live and Let Die', note: 'Live and Let Die' },
        { id: 157451710, artist: 'Bob Dylan', title: 'Knockin\' on Heaven\'s Door', note: 'Pat Garrett and Billy the Kid' },
      ],
    },
    {
      theme: 'Rodgers, Edwards, and Thompson Grooves',
      tracks: [
        { id: 301649414, artist: 'Chic', title: 'Good Times', note: '' },
        { id: 281713751, artist: 'Sister Sledge', title: 'He\'s the Greatest Dancer', note: '' },
        { id: 1452791458, artist: 'Diana Ross', title: 'Upside Down', note: '' },
        { id: 80815209, artist: 'Madonna', title: 'Material Girl', note: '' },
      ],
    },
    {
      theme: 'Jazz Standards (By Subgenre)',
      tracks: [
        { id: 259203745, artist: 'Glenn Miller and His Orchestra', title: 'In The Mood', note: 'Big Band' },
        { id: 1452804207, artist: 'Chick Corea & Return to Forever', title: 'Spain', note: 'Fusion' },
        { id: 1440751703, artist: 'Thelonious Monk', title: '\'Round Midnight', note: 'Bebop' },
        { id: 1443217122, artist: 'Herbie Hancock', title: 'Watermelon Man', note: 'Hard Bop' },
      ],
    },
    {
      theme: 'Premier League(-ish) Team Anthems',
      tracks: [
        { id: 158449744, artist: 'Mormon Tabernacle Choir', title: 'Battle Hymn of the Republic', note: 'Tottenham Hotspur, as Glory, Glory, Tottenham Hotspur (written by Julia Ward Howe)' },
        { id: 691550586, artist: 'Gerry and the Pacemakers', title: 'You\'ll Never Walk Alone', note: 'Liverpool' },
        { id: 723604282, artist: 'Frank Sinatra', title: 'Blue Moon', note: 'Manchester City (written by Rodgers and Hart)' },
        { id: 1440755350, artist: 'Vera Lynn', title: 'I\'m Forever Blowing Bubbles', note: 'West Ham United (Tin Pan Alley standard)' },
      ],
    },
  ],
};

export default puzzle;
