import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Jonathon Klobucar',
  themes: [
    {
      theme: "Song titles that begin with 'Don't'",
      tracks: [
        { id: 1640102584, artist: 'Journey', title: "Don't Stop Believin'  (2022 Remaster)" },
        { id: 6819425980, artist: 'Queen', title: "Don't Stop Me Now" },
        { id: 202271895, artist: 'Fleetwood Mac', title: "Don't Stop" },
        { id: 724437870, artist: 'The Human League', title: "Don't You Want Me" },
      ],
    },
    {
      theme: 'Songs that spell out a word in the vocal hook',
      tracks: [
        { id: 937107838, artist: 'Aretha Franklin', title: 'Respect', note: 'Spells out R-E-S-P-E-C-T in the iconic chorus hook' },
        { id: 1491226770, artist: 'Gwen Stefani', title: 'Hollaback Girl', note: 'Spells out B-A-N-A-N-A-S in the memorable bridge hook' },
        { id: 271457297, artist: 'Bay City Rollers', title: 'Saturday Night', note: 'Spells out S-A-T-U-R-D-A-Y Night in the opening and chorus chant' },
        { id: 1440825374, artist: 'Village People', title: 'Y.M.C.A.', note: 'Spells out Y-M-C-A in the anthemic chorus hook' },
      ],
    },
    {
      theme: 'Hit songs written by Dolly Parton recorded by others',
      tracks: [
        { id: 388151901, artist: 'Whitney Houston', title: 'I Will Always Love You', note: "Written by Dolly Parton in 1973; Houston's 1992 version spent 14 weeks at #1" },
        { id: 1534388457, artist: 'The White Stripes', title: 'Jolene', note: 'Written by Dolly Parton; The White Stripes released this acclaimed live cover in 2000' },
        { id: 5560311, artist: 'Emmylou Harris', title: 'To Daddy', note: 'Written by Dolly Parton; Emmylou Harris took it to #3 on the country chart in 1978' },
        { id: 714562741, artist: 'Merle Haggard & The Strangers', title: 'Kentucky Gambler', note: 'Written by Dolly Parton; Merle Haggard took it to #1 on the country chart in 1975' },
      ],
    },
    {
      theme: 'Musicians who were elected to public office',
      tracks: [
        { id: 994424268, artist: 'Sonny & Cher', title: 'I Got You Babe (Single Version)', note: 'Sonny Bono was elected Mayor of Palm Springs in 1988 and to the US House of Representatives in 1994' },
        { id: 288955173, artist: 'Midnight Oil', title: 'Beds Are Burning', note: 'Peter Garrett was elected to the Australian Parliament in 2004 and served as a Cabinet Minister' },
        { id: 65130453, artist: 'Orleans', title: 'Dance With Me', note: 'Orleans co-founder John Hall was elected to the US House of Representatives representing NY-19 in 2006' },
        { id: 1442267432, artist: 'Martha Reeves & The Vandellas', title: 'Dancing In the Street', note: 'Martha Reeves was elected to the Detroit City Council in 2005, serving until 2009' },
      ],
    },
  ],
};

export default puzzle;
