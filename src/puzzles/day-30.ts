import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 30,
  date: '2026-06-08',
  author: 'Rob Wood',
  releaseAt: '2026-06-08T00:00:00Z',
  themes: [
    {
      theme: 'Songs featuring Jukeboxes',
      tracks: [
        { id: 1881685586, artist: 'Joan Jett', title: "I Love Rock 'N Roll" },
        { id: 284531774, artist: 'Foreigner', title: "Juke Box Hero" },
        { id: 270629385, artist: 'Joe Diffie', title: "Prop Me Up Beside the Jukebox" },
        { id: 250107585, artist: 'Alan Jackson', title: "Don't Rock The Jukebox" },
      ],
    },
    {
      theme: 'Bands with playing cards in the name',
      tracks: [
        { id: 512526772, artist: 'Ace of Base', title: "The Sign" },
        { id: 290303003, artist: 'Kings of Leon', title: "Sex on Fire" },
        { id: 1443996879, artist: 'Queens of the Stone Age', title: "No One Knows" },
        { id: 262219679, artist: 'Jack Off Jill', title: "My Cat" },
      ],
    },
    {
      theme: 'Songs that have musicals of the same name',
      tracks: [
        { id: 1440861294, artist: 'ABBA', title: "Mamma Mia" },
        { id: 1455885774, artist: 'Gene Kelly', title: "Singin' in the Rain" },
        { id: 1465183521, artist: 'SIX', title: "Six" },
        { id: 405600299, artist: 'Kenny Loggins', title: "Footloose" },
      ],
    },
    {
      theme: 'Bands with bald drummers',
      tracks: [
        { id: 695689737, artist: 'Tina Turner', title: "Break Every Rule", note: "Phil Collins" },
        { id: 574051407, artist: 'AC/DC', title: "Thunderstruck", note: "Chris Slade" },
        { id: 1605786512, artist: 'Coldplay', title: "The Hardest Part", note: "Will Champion" },
        { id: 1097862231, artist: 'Radiohead', title: "Creep", note: "Phil Selway" },
      ],
    },
  ],
};

export default puzzle;
