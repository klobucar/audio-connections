import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 9,
  date: '2026-05-18',
  author: 'Jonathon Klobucar',
  releaseAt: '2026-05-18T00:00:00Z',
  themes: [
    {
      theme: 'Weather in the title',
      tracks: [
        { id: 1441164589, artist: 'The Beatles', title: 'Here Comes the Sun' },
        { id: 190758932, artist: 'Bob Dylan', title: "Blowin' in the Wind" },
        { id: 640047752, artist: 'The Doors', title: 'Riders on the Storm' },
        { id: 186092391, artist: 'The Weather Girls', title: "It's Raining Men" },
      ],
    },
    {
      theme: 'Super Bowl Halftime headliners',
      tracks: [
        { id: 1544173942, artist: 'Prince', title: '1999', note: 'Super Bowl XLI (2007)' },
        { id: 1161504024, artist: 'Bruno Mars', title: '24K Magic', note: 'Super Bowl XLVIII (2014)' },
        { id: 1488408568, artist: 'The Weeknd', title: 'Blinding Lights', note: 'Super Bowl LV (2021)' },
        { id: 1441154437, artist: 'Rihanna', title: 'Umbrella', note: 'Super Bowl LVII (2023)' },
      ],
    },
    {
      theme: 'Famously samples another hit',
      tracks: [
        { id: 716691562, artist: 'Vanilla Ice', title: 'Ice Ice Baby', note: "Queen & David Bowie – 'Under Pressure'" },
        { id: 1604645502, artist: 'Coolio', title: "Gangsta's Paradise", note: "Stevie Wonder – 'Pastime Paradise'" },
        { id: 906589235, artist: 'Puff Daddy', title: "I'll Be Missing You", note: "The Police – 'Every Breath You Take'" },
        { id: 724315201, artist: 'MC Hammer', title: "U Can't Touch This", note: "Rick James – 'Super Freak'" },
      ],
    },
    {
      theme: 'Performed on The Simpsons',
      tracks: [
        { id: 1443811916, artist: 'Tom Jones', title: "It's Not Unusual", note: 'Marge Gets a Job' },
        { id: 1127410268, artist: 'Ramones', title: 'Blitzkrieg Bop', note: 'Rosebud' },
        { id: 721224391, artist: 'The Smashing Pumpkins', title: 'Zero', note: 'Homerpalooza' },
        { id: 1533513756, artist: 'The White Stripes', title: 'The Hardest Button to Button', note: 'Jazzy and the Pussycats' },
      ],
    },
  ],
};

export default puzzle;
