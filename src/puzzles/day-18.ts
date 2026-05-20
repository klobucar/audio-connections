import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 18,
  date: '2026-05-27',
  author: 'Bojan Rajkovic',
  releaseAt: '2026-05-27T00:00:00Z',
  themes: [
    {
      theme: 'Day of the week in the title',
      tracks: [
        { id: 1440795944, artist: 'The Mamas & The Papas', title: 'Monday, Monday' },
        { id: 1440717883, artist: 'The Rolling Stones', title: 'Ruby Tuesday' },
        { id: 1012594546, artist: 'Chicago', title: 'Saturday in the Park' },
        { id: 1440851735, artist: 'Maroon 5', title: 'Sunday Morning' },
      ],
    },
    {
      theme: 'Won the Oscar for Best Original Song',
      tracks: [
        { id: 1440619007, artist: 'Céline Dion & Peabo Bryson', title: 'Beauty and the Beast', note: '1992 — Beauty and the Beast' },
        { id: 566322365, artist: 'Adele', title: 'Skyfall', note: '2013 — Skyfall' },
        { id: 1440619289, artist: 'Idina Menzel', title: 'Let It Go', note: '2014 — Frozen' },
        { id: 1434371887, artist: 'Lady Gaga & Bradley Cooper', title: 'Shallow', note: '2019 — A Star Is Born' },
      ],
    },
    {
      theme: 'Bandmates were romantically involved',
      tracks: [
        { id: 651880164, artist: 'Fleetwood Mac', title: 'Silver Springs', note: 'Stevie Nicks & Lindsey Buckingham — written about their breakup' },
        { id: 1440845557, artist: 'No Doubt', title: "Don't Speak", note: 'Gwen Stefani & Tony Kanal — written about their breakup' },
        { id: 1533513537, artist: 'The White Stripes', title: 'Seven Nation Army', note: 'Jack & Meg White (married, then divorced)' },
        { id: 1582343522, artist: 'The Civil Wars', title: 'Poison & Wine', note: 'Joy Williams & John Paul White (rumored)' },
      ],
    },
    {
      theme: 'Songs from the Elephant Love Medley (Moulin Rouge!)',
      tracks: [
        { id: 1441163780, artist: 'The Beatles', title: 'All You Need Is Love' },
        { id: 1440861216, artist: 'KISS', title: "I Was Made for Lovin' You" },
        { id: 1098944438, artist: 'Phil Collins', title: 'One More Night' },
        { id: 1347894092, artist: 'David Bowie', title: 'Heroes' },
      ],
    },
  ],
};

export default puzzle;
