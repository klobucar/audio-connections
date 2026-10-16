import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Jonathon Klobucar',
  constraint: 'So long, thank you, we will be back',
  themes: [
    {
      theme: "'Goodbye' or farewell in the song title",
      tracks: [
        { id: 1440521638, artist: 'Supertramp', title: 'Goodbye Stranger' },
        { id: 714604040, artist: 'James Blunt', title: 'Goodbye My Lover' },
        { id: 1088527520, artist: 'The Cars', title: 'Bye Bye Love' },
        { id: 1046187579, artist: 'Jeff Buckley', title: 'Last Goodbye' },
      ],
    },
    {
      theme: "'Thank you' in the song title",
      tracks: [
        { id: 254579170, artist: 'Dido', title: 'Thank You' },
        { id: 1051409741, artist: 'Alanis Morissette', title: 'Thank U' },
        { id: 1422649007, artist: 'ABBA', title: 'Thank You for the Music' },
        { id: 580708474, artist: 'Led Zeppelin', title: 'Thank You' },
      ],
    },
    {
      theme: "'Back' or 'return' in the song title",
      tracks: [
        { id: 1440918941, artist: 'Thin Lizzy', title: 'The Boys Are Back In Town' },
        { id: 81902612, artist: 'Mark Morrison', title: 'Return of the Mack' },
        { id: 294843559, artist: 'John Sebastian', title: 'Welcome Back (Theme from "Welcome Back, Kotter")' },
        { id: 723349014, artist: 'Soul II Soul', title: 'Back to Life' },
      ],
    },
    {
      theme: 'Swan songs released as final farewell recordings',
      tracks: [
        { id: 6781081188, artist: 'Queen', title: 'The Show Must Go On', note: "Freddie Mercury's triumphant final album single from Innuendo, released six weeks before his death" },
        { id: 2521492, artist: 'Warren Zevon', title: 'Keep Me in Your Heart', note: 'Recorded while terminally ill with pleural mesothelioma as his final farewell message to loved ones' },
        { id: 1676286742, artist: 'David Bowie', title: 'Lazarus', note: "Released on Blackstar as a parting gift to fans days before Bowie's death in January 2016" },
        { id: 996111414, artist: 'Joy Division', title: 'Love Will Tear Us Apart', note: "Joy Division's defining final single, released in June 1980 following the death of Ian Curtis" },
      ],
    },
  ],
};

export default puzzle;
