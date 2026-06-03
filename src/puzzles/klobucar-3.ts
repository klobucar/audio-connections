import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Jonathon Klobucar',
  themes: [
    {
      theme: 'City in the title',
      tracks: [
        { id: 217635876, artist: 'Elvis Presley', title: 'Viva Las Vegas' },
        { id: 300207270, artist: 'Randy Newman', title: 'I Love L.A.' },
        { id: 712606043, artist: 'Tony Bennett', title: 'I Left My Heart in San Francisco' },
        { id: 259204195, artist: 'Glenn Miller and His Orchestra', title: "(I've Got a Gal In) Kalamazoo" },
      ],
    },
    {
      theme: "Some form of 'sing' in the title",
      tracks: [
        { id: 1590332409, artist: 'The New Pornographers', title: 'Sing Me Spanish Techno' },
        { id: 181630629, artist: 'Cake', title: 'Opera Singer' },
        { id: 1196295123, artist: 'Alan Walker', title: "Sing Me to Sleep" },
        { id: 1440656636, artist: 'The Moody Blues', title: "I'm Just a Singer (In a Rock and Roll Band)" },
      ],
    },
    {
      theme: 'Hosted and performed on SNL',
      tracks: [
        { id: 380625785, artist: 'Paul Simon', title: 'You Can Call Me Al' },
        { id: 252606592, artist: 'Justin Timberlake', title: 'Cry Me a River' },
        { id: 251948354, artist: 'Britney Spears', title: 'Toxic' },
        { id: 1560735480, artist: 'Olivia Rodrigo', title: 'drivers license' },
      ],
    },
    {
      theme: 'Songs referencing a sci-fi property',
      tracks: [
        { id: 714905123, artist: 'Fatboy Slim', title: 'Weapon of Choice', note: 'Dune' },
        { id: 1097861770, artist: 'Radiohead', title: 'Paranoid Android', note: "The Hitchhiker's Guide to the Galaxy" },
        { id: 1440645631, artist: 'Queen', title: 'Flash', note: 'Flash Gordon' },
        { id: 313873494, artist: 'Eurythmics', title: 'Sex Crime (1984)', note: "Orwell's Nineteen Eighty-Four" },
      ],
    },
  ],
};

export default puzzle;
