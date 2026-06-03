import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Jonathon Klobucar',
  constraint: '💡 🎥 🎬 🍿 🎞️ ⭐',
  themes: [
    {
      theme: 'Fictional bands from the movies',
      tracks: [
        { id: 217281662, artist: 'The Wonders', title: 'That Thing You Do!', note: 'That Thing You Do! (1996)' },
        { id: 1834225688, artist: 'Spinal Tap', title: 'Big Bottom', note: 'This Is Spinal Tap (1984)' },
        { id: 1434905331, artist: 'Stillwater', title: 'Fever Dog', note: 'Almost Famous (2000)' },
        { id: 452584459, artist: 'The Blues Brothers', title: 'Everybody Needs Somebody to Love', note: 'The Blues Brothers (1980)' },
      ],
    },
    {
      theme: 'Songs released for Batman movies',
      tracks: [
        { id: 213038838, artist: 'Prince', title: 'Partyman', note: 'Batman (1989)' },
        { id: 302788219, artist: 'Seal', title: 'Kiss from a Rose', note: 'Batman Forever (1995)' },
        { id: 1440656117, artist: 'U2', title: 'Hold Me, Thrill Me, Kiss Me, Kill Me', note: 'Batman Forever (1995)' },
        { id: 1434728179, artist: 'The Smashing Pumpkins', title: 'The Beginning Is the End Is the Beginning', note: 'Batman & Robin (1997)' },
      ],
    },
    {
      theme: 'Artists who scored an entire movie',
      tracks: [
        { id: 1812890484, artist: 'Air', title: 'Playground Love', note: 'The Virgin Suicides (1999)' },
        { id: 1440617959, artist: 'Daft Punk', title: 'Derezzed', note: 'TRON: Legacy (2010)' },
        { id: 617133378, artist: 'M83', title: 'Oblivion', note: 'Oblivion (2013)' },
        { id: 921323600, artist: 'Trent Reznor & Atticus Ross', title: 'Technically, Missing', note: 'Gone Girl (2014)' },
      ],
    },
    {
      theme: 'EGOT winners',
      tracks: [
        { id: 533470769, artist: 'Rita Moreno', title: 'America', note: 'West Side Story (1961)' },
        { id: 395768530, artist: 'Jennifer Hudson', title: 'And I Am Telling You I\'m Not Going', note: 'Dreamgirls (2006)' },
        { id: 1519700987, artist: 'Common & John Legend', title: 'Glory', note: 'Selma (2014) — John Legend is the EGOT winner' },
        { id: 1440722345, artist: 'Peabo Bryson & Regina Belle', title: 'A Whole New World', note: 'Aladdin (1992) — composer Alan Menken is the EGOT winner' },
      ],
    },
  ],
};

export default puzzle;
