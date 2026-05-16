import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 4,
  date: '2026-05-13',
  author: 'Corey Farwell',
  releaseAt: '2026-05-13T00:00:00Z',
  themes: [
    {
      theme: 'Day of the week in the title',
      tracks: [
        { id: 1288102605, artist: 'The Cure', title: "Friday I'm in Love" },
        { id: 200007628, artist: 'The Bangles', title: 'Manic Monday' },
        { id: 1440729870, artist: 'U2', title: 'Sunday Bloody Sunday' },
        { id: 1440863140, artist: 'Elton John', title: "Saturday Night's Alright for Fighting" },
      ],
    },
    {
      theme: 'TV theme songs',
      tracks: [
        { id: 160975431, artist: 'Pratt & McClain', title: 'Happy Days', note: 'Happy Days' },
        { id: 373221221, artist: 'The Rembrandts', title: "I'll Be There for You", note: 'Friends' },
        { id: 206201765, artist: 'DJ Jazzy Jeff & The Fresh Prince', title: 'The Fresh Prince of Bel-Air', note: 'The Fresh Prince of Bel-Air' },
        { id: 1608608752, artist: 'Alabama 3', title: 'Woke Up This Morning', note: 'The Sopranos' },
      ],
    },
    {
      theme: '27 Club',
      tracks: [
        { id: 344799464, artist: 'Jimi Hendrix', title: 'Purple Haze' },
        { id: 917030915, artist: 'Janis Joplin', title: 'Me and Bobby McGee' },
        { id: 1192962303, artist: 'The Doors', title: 'Light My Fire', note: 'Jim Morrison' },
        { id: 1422677781, artist: 'Amy Winehouse', title: 'Rehab' },
      ],
    },
    {
      theme: 'Children of famous musicians',
      tracks: [
        { id: 1625058461, artist: 'Norah Jones', title: "Don't Know Why", note: 'Ravi Shankar' },
        { id: 1576574977, artist: 'Nancy Sinatra', title: "These Boots Are Made for Walkin'", note: 'Frank Sinatra' },
        { id: 1460315319, artist: 'Miley Cyrus', title: 'Wrecking Ball', note: 'Billy Ray Cyrus' },
        { id: 715770841, artist: 'Natalie Cole', title: 'This Will Be (An Everlasting Love)', note: 'Nat King Cole' },
      ],
    },
  ],
};

export default puzzle;
