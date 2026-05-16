import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 8,
  date: '2026-05-17',
  author: 'Jonathon Klobucar',
  releaseAt: '2026-05-17T00:00:00Z',
  themes: [
    {
      theme: 'Color in the title',
      tracks: [
        { id: 1122782283, artist: 'Coldplay', title: 'Yellow' },
        { id: 1838782096, artist: 'Van Morrison', title: 'Brown Eyed Girl' },
        { id: 257424857, artist: 'Eiffel 65', title: 'Blue (Da Ba Dee)' },
        { id: 425465351, artist: 'Pearl Jam', title: 'Black' },
      ],
    },
    {
      theme: "Girl's name is the title",
      tracks: [
        { id: 1062400330, artist: 'Dolly Parton', title: 'Jolene' },
        { id: 269573364, artist: 'Michael Jackson', title: 'Billie Jean' },
        { id: 1440663520, artist: 'Derek and the Dominos', title: 'Layla' },
        { id: 912323296, artist: 'Fleetwood Mac', title: 'Rhiannon' },
      ],
    },
    {
      theme: 'Bond film title songs',
      tracks: [
        { id: 712850997, artist: 'Tina Turner', title: 'GoldenEye', note: 'GoldenEye' },
        { id: 1536005324, artist: 'Nancy Sinatra', title: 'You Only Live Twice', note: 'You Only Live Twice' },
        { id: 697012276, artist: 'Duran Duran', title: 'A View to a Kill', note: 'A View to a Kill' },
        { id: 715595121, artist: 'Carly Simon', title: 'Nobody Does It Better', note: 'The Spy Who Loved Me' },
      ],
    },
    {
      theme: 'Covers more famous than the original',
      tracks: [
        { id: 1452875626, artist: 'Johnny Cash', title: 'Hurt', note: 'orig. Nine Inch Nails' },
        { id: 1440517679, artist: 'Soft Cell', title: 'Tainted Love', note: 'orig. Gloria Jones' },
        { id: 937107838, artist: 'Aretha Franklin', title: 'Respect', note: 'orig. Otis Redding' },
        { id: 1440893075, artist: 'Nirvana', title: 'Where Did You Sleep Last Night', note: 'orig. Lead Belly' },
      ],
    },
  ],
};

export default puzzle;
