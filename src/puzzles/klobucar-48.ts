import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Jonathon Klobucar',
  themes: [
    {
      theme: 'Song titles that ask a question',
      tracks: [
        { id: 685585941, artist: 'The Clash', title: 'Should I Stay or Should I Go' },
        { id: 1538081594, artist: 'Marvin Gaye', title: "What's Going On" },
        { id: 1731384547, artist: 'Haddaway', title: 'What Is Love (7" Mix)' },
        { id: 799969782, artist: 'The Smiths', title: 'How Soon Is Now? (12" Version)' },
      ],
    },
    {
      theme: 'Songs that open with a count-in',
      tracks: [
        { id: 1441164819, artist: 'The Beatles', title: 'I Saw Her Standing There', note: "Paul McCartney's iconic opening count-in: 'One, two, three, four!'" },
        { id: 1444137692, artist: 'Sam the Sham & The Pharaohs', title: 'Wooly Bully', note: "Opens with Domingo Samudio's count-in: 'Uno, dos, one, two, tres, quatro!'" },
        { id: 77816965, artist: 'Ramones', title: 'Rockaway Beach', note: "Opens with Dee Dee Ramone's rapid count-in: '1-2-3-4!'" },
        { id: 1423306160, artist: 'James Brown', title: 'Get Up I Feel Like Being Like A Sex Machine (Pts. 1 & 2)', note: "James Brown calls out the opening count-in: 'One, two, three, four!'" },
      ],
    },
    {
      theme: 'Lennon–McCartney songs recorded by others',
      tracks: [
        { id: 691546555, artist: 'Peter & Gordon', title: 'A World Without Love (2002 Remaster) [Mono]', note: 'Written by Paul McCartney in 1964; Peter and Gordon took it to #1 in the US and UK' },
        { id: 771782759, artist: 'Badfinger', title: 'Come and Get It (2010 - Remaster)', note: 'Written and produced by Paul McCartney for Badfinger on Apple Records' },
        { id: 771776669, artist: 'Mary Hopkin', title: 'Goodbye (2010 - Remaster)', note: 'Written and produced by Paul McCartney for Mary Hopkin in 1969' },
        { id: 691369058, artist: 'Billy J. Kramer & The Dakotas', title: 'Bad to Me', note: 'Written by John Lennon and Paul McCartney while on holiday in Spain in 1963' },
      ],
    },
    {
      theme: 'Musicians who hold United States patents',
      tracks: [
        { id: 913902137, artist: 'Boston', title: 'More Than a Feeling', note: 'MIT graduate and guitarist Tom Scholz holds patent US4584700 for the Rockman amplifier' },
        { id: 976832495, artist: 'Van Halen', title: 'Jump', note: 'Eddie Van Halen held patent US4656917 for a guitar support enabling two-handed fretboard tapping' },
        { id: 723700423, artist: 'Paula Abdul', title: 'Straight Up', note: "Paula Abdul holds patent US5303898 for a dynamic weighted 'tumbler' microphone stand" },
        { id: 159294551, artist: 'Michael Jackson', title: 'Smooth Criminal', note: 'Michael Jackson held patent US5255452 for the anti-gravity lean shoes used in Smooth Criminal' },
      ],
    },
  ],
};

export default puzzle;
