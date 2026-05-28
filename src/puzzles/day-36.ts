import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 36,
  date: '2026-06-15',
  author: 'Thomas Ptacek',
  releaseAt: '2026-06-15T00:00:00Z',
  themes: [
    {
      theme: 'Oz-Coded',
      tracks: [
        { id: 1440863122, artist: 'Elton John', title: 'Goodbye Yellow Brick Road' },
        { id: 59413928, artist: 'America', title: 'Tin Man' },
        { id: 1443196825, artist: 'Diana Ross', title: 'Ease on Down the Road' },
        { id: 1440802840, artist: 'Kristin Chenoweth & Idina Menzel', title: 'Defying Gravity' },
      ],
    },
    {
      theme: 'Populaire ici, mais chanté en français',
      tracks: [
        { id: 311331447, artist: 'Joe Dassin', title: 'Les Champs-Élysées' },
        { id: 1650622324, artist: 'Plastic Bertrand', title: 'Ça Plane Pour Moi' },
        { id: 1440862113, artist: 'Stromae', title: 'Papaoutai' },
        { id: 322417717, artist: 'Desireless', title: 'Voyage voyage' },
      ],
    },
    {
      theme: 'Philadelphia Icons',
      tracks: [
        { id: 1586491649, artist: 'Kurt Vile', title: 'Loading Zones' },
        { id: 1479929795, artist: 'The Roots', title: 'Dynamite!' },
        { id: 1714905027, artist: 'The Dead Milkmen', title: 'Punk Rock Girl' },
        { id: 1444818206, artist: 'Daryl Hall & John Oates', title: 'Maneater' },
      ],
    },
    {
      theme: 'Where Did This Title Come From?',
      tracks: [
        { id: 1440850320, artist: 'The Who', title: "Baba O'Riley" },
        { id: 580708177, artist: 'Led Zeppelin', title: 'Black Dog' },
        { id: 1440783625, artist: 'Nirvana', title: 'Smells Like Teen Spirit' },
        { id: 265611986, artist: 'Buffalo Springfield', title: "For What It's Worth" },
      ],
    },
  ],
};

export default puzzle;
