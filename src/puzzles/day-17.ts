import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 17,
  date: '2026-05-26',
  author: 'Jonathon Klobucar',
  releaseAt: '2026-05-26T00:00:00Z',
  themes: [
    {
      theme: 'One-word song titles',
      tracks: [
        { id: 185717604, artist: 'Toto', title: 'Africa' },
        { id: 1097862901, artist: 'Radiohead', title: 'Just' },
        { id: 1440818664, artist: 'Lorde', title: 'Royals' },
        { id: 1440636710, artist: 'Beck', title: 'Loser' },
      ],
    },
    {
      theme: 'Famous duets',
      tracks: [
        { id: 1440810475, artist: 'Queen & David Bowie', title: 'Under Pressure' },
        { id: 1440913387, artist: 'Elton John & Kiki Dee', title: "Don't Go Breaking My Heart" },
        { id: 282883594, artist: 'Dolly Parton & Kenny Rogers', title: 'Islands in the Stream' },
        { id: 1443906384, artist: 'Ethel Merman & Ray Middleton', title: 'Anything You Can Do' },
      ],
    },
    {
      theme: 'Artists from Michigan',
      tracks: [
        { id: 1440888252, artist: 'Bob Seger', title: 'Old Time Rock & Roll', note: 'Detroit' },
        { id: 1440906589, artist: 'Eminem', title: 'The Real Slim Shady', note: 'Detroit' },
        { id: 83445997, artist: 'Madonna', title: 'Like a Prayer', note: 'Bay City' },
        { id: 1668009397, artist: 'Iggy Pop', title: 'Search and Destroy', note: 'Ann Arbor' },
      ],
    },
    {
      theme: 'Released posthumously',
      tracks: [
        { id: 995809798, artist: 'Otis Redding', title: "(Sittin' On) The Dock of the Bay" },
        { id: 917030915, artist: 'Janis Joplin', title: 'Me and Bobby McGee' },
        { id: 906586721, artist: 'The Notorious B.I.G.', title: 'Mo Money Mo Problems' },
        { id: 1440827543, artist: 'Selena', title: 'Dreaming of You' },
      ],
    },
  ],
};

export default puzzle;
