import type { Puzzle } from './types';

export const puzzles: Puzzle[] = [
  {
    day: 1,
    date: '2026-05-10',
    author: 'Corey Farwell',
    themes: [
      {
        theme: 'Heaven in the title',
        tracks: [
          { id: 31739774, artist: 'The Cure', title: 'Just Like Heaven' },
          { id: 580708180, artist: 'Led Zeppelin', title: 'Stairway to Heaven' },
          { id: 1648144423, artist: 'Eric Clapton', title: 'Tears in Heaven' },
          { id: 1440771048, artist: 'Belinda Carlisle', title: 'Heaven Is a Place on Earth' },
        ],
      },
      {
        theme: 'Canadian artists',
        tracks: [
          { id: 323395690, artist: 'Avril Lavigne', title: 'My Happy Ending' },
          { id: 1440661545, artist: 'Justin Bieber', title: 'Baby' },
          { id: 1440823965, artist: 'Bryan Adams', title: "Summer of '69" },
          { id: 1440656027, artist: 'Rush', title: 'Tom Sawyer' },
        ],
      },
      {
        theme: 'Bands with repeated names',
        tracks: [
          { id: 696670364, artist: 'Talk Talk', title: "It's My Life" },
          { id: 693610953, artist: 'Duran Duran', title: 'Hungry Like the Wolf' },
          { id: 1445308818, artist: 'Yeah Yeah Yeahs', title: 'Maps' },
          { id: 1440843876, artist: "The Go-Go's", title: 'We Got the Beat' },
        ],
      },
      {
        theme: 'Bands of all siblings',
        tracks: [
          { id: 1440790544, artist: 'Hanson', title: 'MMMBop' },
          { id: 1440912109, artist: 'Jackson 5', title: 'ABC' },
          { id: 1445664553, artist: 'Bee Gees', title: 'How Deep Is Your Love' },
          { id: 121052796, artist: 'Sister Sledge', title: 'We Are Family' },
        ],
      },
    ],
  },
  {
    day: 2,
    date: '2026-05-11',
    author: 'Corey Farwell',
    releaseAt: '2026-05-11T00:00:00Z',
    themes: [
      {
        theme: 'Songs made for movies',
        tracks: [
          { id: 507536740, artist: 'Céline Dion', title: 'My Heart Will Go On', note: 'Titanic' },
          { id: 254685026, artist: 'Survivor', title: 'Eye of the Tiger', note: 'Rocky III' },
          { id: 1440903439, artist: 'Eminem', title: 'Lose Yourself', note: '8 Mile' },
          { id: 203304387, artist: 'Simon & Garfunkel', title: 'Mrs. Robinson', note: 'The Graduate' },
        ],
      },
      {
        theme: 'Sense in the title',
        tracks: [
          { id: 1440783625, artist: 'Nirvana', title: 'Smells Like Teen Spirit', note: 'smell' },
          { id: 217273922, artist: 'Johnny Nash', title: 'I Can See Clearly Now', note: 'sight' },
          { id: 1550208949, artist: 'Mariah Carey', title: 'Touch My Body', note: 'touch' },
          { id: 1444106658, artist: 'Marvin Gaye', title: 'I Heard It Through the Grapevine', note: 'hearing' },
        ],
      },
      {
        theme: 'Cover of a Beatles song',
        tracks: [
          { id: 1434916256, artist: 'Joe Cocker', title: 'With a Little Help from My Friends' },
          { id: 1469582093, artist: 'Stevie Wonder', title: 'We Can Work It Out' },
          { id: 995304388, artist: 'Tina Turner', title: 'Help!' },
          { id: 1738363769, artist: 'Beyoncé', title: 'BLACKBIIRD' },
        ],
      },
      {
        theme: 'Profession in the name',
        tracks: [
          { id: 1752214923, artist: 'Sabrina Carpenter', title: 'Espresso' },
          { id: 169628364, artist: 'Spin Doctors', title: 'Two Princes' },
          { id: 1440797616, artist: 'The Police', title: 'Roxanne' },
          { id: 20922894, artist: 'The Postal Service', title: 'Such Great Heights' },
        ],
      },
    ],
  },
  {
    day: 3,
    date: '2026-05-12',
    author: 'Corey Farwell',
    releaseAt: '2026-05-12T00:00:00Z',
    themes: [
      {
        theme: 'Mr. ___ songs',
        tracks: [
          { id: 1440891171, artist: 'The Killers', title: 'Mr. Brightside' },
          { id: 196426738, artist: 'Electric Light Orchestra', title: 'Mr. Blue Sky' },
          { id: 1442449547, artist: 'Counting Crows', title: 'Mr. Jones' },
          { id: 1750853097, artist: 'The Chordettes', title: 'Mr. Sandman' },
        ],
      },
      {
        theme: 'Produce in the band name',
        tracks: [
          { id: 1440912292, artist: 'The Cranberries', title: 'Dreams' },
          { id: 725821929, artist: 'Blind Melon', title: 'No Rain' },
          { id: 721224621, artist: 'The Smashing Pumpkins', title: '1979' },
          { id: 945575413, artist: 'Red Hot Chili Peppers', title: 'Californication' },
        ],
      },
      {
        theme: 'French artists',
        tracks: [
          { id: 828259377, artist: 'M83', title: 'Midnight City' },
          { id: 696886431, artist: 'Daft Punk', title: 'Around the World' },
          { id: 1771710539, artist: 'Phoenix', title: '1901' },
          { id: 1452878212, artist: 'Debussy', title: 'Clair de Lune', note: 'performed by Jean-Yves Thibaudet' },
        ],
      },
      {
        theme: 'Frontpeople who went solo',
        tracks: [
          { id: 986876652, artist: 'Peter Gabriel', title: 'Solsbury Hill', note: 'Genesis' },
          { id: 1491226770, artist: 'Gwen Stefani', title: 'Hollaback Girl', note: 'No Doubt' },
          { id: 252606598, artist: 'Justin Timberlake', title: 'Rock Your Body', note: '*NSYNC' },
          { id: 300205685, artist: 'Björk', title: 'Army of Me', note: 'The Sugarcubes' },
        ],
      },
    ],
  },
  {
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
  },
  {
    day: 5,
    date: '2026-05-14',
    author: 'Corey Farwell',
    releaseAt: '2026-05-14T00:00:00Z',
    themes: [
      {
        theme: 'Primates in the artist name',
        tracks: [
          { id: 4512481, artist: 'The Monkees', title: "I'm a Believer", note: 'monkey' },
          { id: 850576665, artist: 'Gorillaz', title: 'Clint Eastwood', note: 'gorilla' },
          { id: 663097965, artist: 'Arctic Monkeys', title: 'Do I Wanna Know?', note: 'monkey' },
          { id: 724437870, artist: 'The Human League', title: "Don't You Want Me", note: 'human' },
        ],
      },
      {
        theme: 'Cats in the artist name',
        tracks: [
          { id: 1535560798, artist: 'Cat Stevens', title: 'Wild World', note: 'cat' },
          { id: 1486465101, artist: 'Doja Cat', title: 'Say So', note: 'cat' },
          { id: 1440762326, artist: 'The Pussycat Dolls', title: "Don't Cha", note: 'pussycat' },
          { id: 1440904267, artist: 'Def Leppard', title: 'Pour Some Sugar On Me', note: 'leopard' },
        ],
      },
      {
        theme: 'Birds in the artist name',
        tracks: [
          { id: 171708539, artist: 'Eagle-Eye Cherry', title: 'Save Tonight', note: 'eagle' },
          { id: 1440919037, artist: 'Sheryl Crow', title: 'All I Wanna Do', note: 'crow' },
          { id: 635770202, artist: 'Eagles', title: 'Hotel California', note: 'eagle' },
          { id: 155682268, artist: 'The Chicks', title: 'Wide Open Spaces', note: 'chick; f.k.a. Dixie Chicks' },
        ],
      },
      {
        theme: 'Canines in the artist name',
        tracks: [
          { id: 1485025432, artist: 'Dr. Dog', title: "Where'd All the Time Go?", note: 'dog' },
          { id: 1443396469, artist: 'Snoop Dogg', title: "Drop It Like It's Hot", note: 'dog' },
          { id: 327408153, artist: 'Bloodhound Gang', title: 'The Bad Touch', note: 'bloodhound' },
          { id: 281086428, artist: 'Fleet Foxes', title: 'White Winter Hymnal', note: 'fox' },
        ],
      },
    ],
  },
  {
    day: 6,
    date: '2026-05-15',
    author: 'Corey Farwell',
    releaseAt: '2026-05-15T00:00:00Z',
    themes: [
      {
        theme: 'House in the title',
        tracks: [
          { id: 1442866180, artist: 'Madness', title: 'Our House' },
          { id: 300202249, artist: 'Talking Heads', title: 'Burning Down the House' },
          { id: 1440743961, artist: 'The Animals', title: 'House of the Rising Sun' },
          { id: 1442972077, artist: 'The Commodores', title: 'Brick House' },
        ],
      },
      {
        theme: 'Songs featured in Back to the Future',
        tracks: [
          { id: 1440829906, artist: 'Huey Lewis & The News', title: 'The Power of Love' },
          { id: 1440829927, artist: 'Alan Silvestri', title: 'Back to the Future', note: 'main theme; performed by The Outatime Orchestra' },
          { id: 1443115554, artist: 'The Penguins', title: 'Earth Angel (Will You Be Mine)' },
          { id: 1425230917, artist: 'Chuck Berry', title: 'Johnny B. Goode' },
        ],
      },
      {
        theme: 'Internal rhyme in the title',
        tracks: [
          { id: 1440751392, artist: 'Bill Haley and His Comets', title: 'Rock Around the Clock' },
          { id: 1657869393, artist: 'SZA', title: 'Kill Bill' },
          { id: 1097862833, artist: 'Radiohead', title: 'High and Dry' },
          { id: 159573861, artist: 'Cypress Hill', title: 'Insane in the Brain' },
        ],
      },
      {
        theme: 'Masked / anonymous artists',
        tracks: [
          { id: 926187884, artist: 'Slipknot', title: 'Duality' },
          { id: 1440946831, artist: 'Ghost', title: 'Square Hammer' },
          { id: 1654811470, artist: 'MF DOOM', title: 'Doomsday' },
          { id: 1446363543, artist: 'Orville Peck', title: 'Dead of Night' },
        ],
      },
    ],
  },
  {
    day: 7,
    date: '2026-05-16',
    author: 'Corey Farwell',
    releaseAt: '2026-05-16T00:00:00Z',
    themes: [
      {
        theme: 'Songs about a US state',
        tracks: [
          { id: 1413948381, artist: 'Lynyrd Skynyrd', title: 'Sweet Home Alabama', note: 'Alabama' },
          { id: 1881665710, artist: 'Ray Charles', title: 'Georgia on My Mind', note: 'Georgia' },
          { id: 1440777015, artist: 'JAY-Z', title: 'Empire State of Mind', note: 'New York; feat. Alicia Keys' },
          { id: 1425259894, artist: 'The Mamas & The Papas', title: "California Dreamin'", note: 'California' },
        ],
      },
      {
        theme: 'Bands with a number in their name',
        tracks: [
          { id: 1428782513, artist: 'Maroon 5', title: 'This Love' },
          { id: 1440659999, artist: 'Sum 41', title: 'Fat Lip' },
          { id: 1440840510, artist: 'blink-182', title: 'All the Small Things' },
          { id: 983850963, artist: "The B-52's", title: 'Love Shack' },
        ],
      },
      {
        theme: 'Songs with prominent cowbell',
        tracks: [
          { id: 217556132, artist: 'Blue Öyster Cult', title: "(Don't Fear) The Reaper" },
          { id: 1488653325, artist: 'The Rolling Stones', title: 'Honky Tonk Women' },
          { id: 1202371162, artist: 'War', title: 'Low Rider' },
          { id: 715534851, artist: 'Grand Funk Railroad', title: "We're an American Band" },
        ],
      },
      {
        theme: 'Bands named after a movie or book',
        tracks: [
          { id: 1440905717, artist: 'Veruca Salt', title: 'Seether', note: "character in Roald Dahl's Charlie and the Chocolate Factory" },
          { id: 190780833, artist: 'Modest Mouse', title: 'Float On', note: "phrase from Virginia Woolf's The Mark on the Wall" },
          { id: 1440860171, artist: 'Steppenwolf', title: 'Born to Be Wild', note: 'Hermann Hesse novel' },
          { id: 785232521, artist: 'Black Sabbath', title: 'Paranoid', note: '1963 Mario Bava horror film' },
        ],
      },
    ],
  },
  {
    day: 8,
    date: '2026-05-17',
    author: 'Jonathon Klobucar',
    releaseAt: '2026-05-17T00:00:00Z',
    themes: [
      {
        theme: 'Color in the title',
        tracks: [
          { id: 1122782283, artist: 'Coldplay', title: 'Yellow' },
          { id: 1838782096, artist: 'Van Morrison', title: 'Brown Eyed Girl' },
          { id: 257424857, artist: 'Eiffel 65', title: 'Blue (Da Ba Dee)' },
          { id: 425465351, artist: 'Pearl Jam', title: 'Black' },
        ],
      },
      {
        theme: "Girl's name is the title",
        tracks: [
          { id: 1062400330, artist: 'Dolly Parton', title: 'Jolene' },
          { id: 269573364, artist: 'Michael Jackson', title: 'Billie Jean' },
          { id: 1440663520, artist: 'Derek and the Dominos', title: 'Layla' },
          { id: 912323296, artist: 'Fleetwood Mac', title: 'Rhiannon' },
        ],
      },
      {
        theme: 'Bond film title songs',
        tracks: [
          { id: 712850997, artist: 'Tina Turner', title: 'GoldenEye', note: 'GoldenEye' },
          { id: 1536005324, artist: 'Nancy Sinatra', title: 'You Only Live Twice', note: 'You Only Live Twice' },
          { id: 697012276, artist: 'Duran Duran', title: 'A View to a Kill', note: 'A View to a Kill' },
          { id: 715595121, artist: 'Carly Simon', title: 'Nobody Does It Better', note: 'The Spy Who Loved Me' },
        ],
      },
      {
        theme: 'Covers more famous than the original',
        tracks: [
          { id: 1452875626, artist: 'Johnny Cash', title: 'Hurt', note: 'orig. Nine Inch Nails' },
          { id: 1440517679, artist: 'Soft Cell', title: 'Tainted Love', note: 'orig. Gloria Jones' },
          { id: 937107838, artist: 'Aretha Franklin', title: 'Respect', note: 'orig. Otis Redding' },
          { id: 1440893075, artist: 'Nirvana', title: 'Where Did You Sleep Last Night', note: 'orig. Lead Belly' },
        ],
      },
    ],
  },
  {
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
        theme: 'Performed on The Simpsons',
        tracks: [
          { id: 1443811916, artist: 'Tom Jones', title: "It's Not Unusual", note: 'Marge Gets a Job' },
          { id: 1127410268, artist: 'Ramones', title: 'Blitzkrieg Bop', note: 'Rosebud' },
          { id: 721224391, artist: 'The Smashing Pumpkins', title: 'Zero', note: 'Homerpalooza' },
          { id: 1533513756, artist: 'The White Stripes', title: 'The Hardest Button to Button', note: 'Jazzy and the Pussycats' },
        ],
      },
      {
        theme: 'Sampled by the Beastie Boys',
        tracks: [
          { id: 580708184, artist: 'Led Zeppelin', title: 'When the Levee Breaks', note: "Rhymin & Stealin'" },
          { id: 785239189, artist: 'Black Sabbath', title: 'Sweet Leaf', note: "Rhymin & Stealin'" },
          { id: 1048472613, artist: 'Curtis Mayfield', title: 'Superfly', note: 'Egg Man' },
          { id: 216553256, artist: 'Sly & The Family Stone', title: 'Loose Booty', note: 'Shadrach' },
        ],
      },
    ],
  },
  {
    day: 10,
    date: '2026-05-19',
    author: 'Rob Chahin',
    releaseAt: '2026-05-19T00:00:00Z',
    themes: [
      {
        theme: 'Famous Ricks',
        tracks: [
          { id: 1559885421, artist: 'Rick Astley', title: 'Never Gonna Give You Up' },
          { id: 1440778713, artist: 'Rick Ross', title: "Hustlin'" },
          { id: 1440805227, artist: 'Rick James', title: 'Super Freak' },
          { id: 286005748, artist: 'Rick Springfield', title: "Jessie's Girl" },
        ],
      },
      {
        theme: 'Movie titles',
        tracks: [
          { id: 1454593961, artist: 'Irene Cara', title: 'Fame' },
          { id: 388155861, artist: 'Roy Orbison', title: 'Oh, Pretty Woman' },
          { id: 279366591, artist: 'Will Smith', title: 'Men in Black' },
          { id: 1170755174, artist: "Quad City DJ's", title: 'Space Jam' },
        ],
      },
      {
        theme: 'Artists with more famous siblings',
        tracks: [
          { id: 303171653, artist: 'Aaron Carter', title: "That's How I Beat Shaq", note: 'brother of Nick Carter (Backstreet Boys)' },
          { id: 1440838749, artist: 'Janet Jackson', title: 'Rhythm Nation', note: 'sister of Michael Jackson' },
          { id: 1444134333, artist: 'Daniel Bedingfield', title: 'Gotta Get Thru This', note: 'brother of Natasha Bedingfield' },
          { id: 1478457166, artist: 'Warren G', title: 'Regulate', note: 'stepbrother of Dr. Dre' },
        ],
      },
      {
        theme: 'Songs covered by Whitney Houston',
        tracks: [
          { id: 282883579, artist: 'Dolly Parton', title: 'I Will Always Love You' },
          { id: 281615481, artist: 'Chaka Khan', title: "I'm Every Woman" },
          { id: 1122666765, artist: 'George Benson', title: 'The Greatest Love of All' },
          { id: 1449494596, artist: 'Steve Winwood', title: 'Higher Love' },
        ],
      },
    ],
  },
];

export const MAX_MISTAKES = 4;
export const THEME_EMOJI = ['🟨', '🟩', '🟦', '🟪'] as const;

export function isReleased(p: Puzzle, now: number = Date.now()): boolean {
  if (!p.releaseAt) return true;
  return now >= new Date(p.releaseAt).getTime();
}

export function latestReleasedIndex(now: number = Date.now()): number {
  for (let i = puzzles.length - 1; i >= 0; i--) {
    if (isReleased(puzzles[i], now)) return i;
  }
  return 0;
}
