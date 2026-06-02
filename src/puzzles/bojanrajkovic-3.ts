import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Bojan & Erika Rajkovic',
  themes: [
    {
      theme: 'Songs that mention a specific year',
      tracks: [
        { id: 271371090, artist: 'Bowling for Soup', title: '1985', note: 'Name-drops Springsteen, Madonna, U2 and Blondie' },
        { id: 303080548, artist: 'Zager & Evans', title: 'In the Year 2525', note: 'A 1969 one-hit wonder about the far future' },
        { id: 870331003, artist: 'The Four Seasons', title: 'December, 1963 (Oh, What a Night)' },
        { id: 1445877164, artist: 'Rush', title: '2112', note: 'Rush’s 1976 sci-fi epic, set in the year 2112' },
      ],
    },
    {
      theme: 'Iconic music videos',
      tracks: [
        { id: 269573303, artist: 'Michael Jackson', title: 'Thriller', note: 'The 14-minute zombie horror video' },
        { id: 296016899, artist: 'Beyoncé', title: 'Single Ladies (Put a Ring on It)', note: 'That black-leotard one-take dance' },
        { id: 1460315319, artist: 'Miley Cyrus', title: 'Wrecking Ball', note: 'The sledgehammer-and-wrecking-ball clip' },
        { id: 299545317, artist: 'Dire Straits', title: 'Money for Nothing', note: 'Pioneering early-CGI video — “I want my MTV”' },
      ],
    },
    {
      theme: 'Songs about committing a crime',
      tracks: [
        { id: 1469576021, artist: 'Bob Marley & The Wailers', title: 'I Shot the Sheriff', note: '“…but I did not shoot the deputy”' },
        { id: 1544268348, artist: 'Taylor Swift', title: 'No Body No Crime', note: 'No body, no crime — the perfect alibi' },
        { id: 1440946852, artist: 'Cold War Kids', title: 'Saint John', note: 'A condemned man on his way to death row' },
        { id: 435761212, artist: 'Foster the People', title: 'Pumped Up Kicks', note: 'Sunny pop masking a school-shooter’s threat' },
      ],
    },
    {
      theme: 'Name-dropped in “1985” by Bowling for Soup',
      tracks: [
        { id: 1443155645, artist: 'U2', title: 'With or Without You' },
        { id: 80815632, artist: 'Madonna', title: 'Holiday' },
        { id: 310730206, artist: 'Bruce Springsteen', title: 'Thunder Road' },
        { id: 724177451, artist: 'Blondie', title: 'Call Me' },
      ],
    },
  ],
};

export default puzzle;
