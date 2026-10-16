import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Jonathon Klobucar',
  themes: [
    {
      theme: "'Sweet' in the song title",
      tracks: [
        { id: 1377813701, artist: "Guns N' Roses", title: "Sweet Child O' Mine" },
        { id: 1440846819, artist: 'Lynyrd Skynyrd', title: 'Sweet Home Alabama' },
        { id: 1018520425, artist: 'Anita Baker', title: 'Sweet Love' },
        { id: 1480026455, artist: 'James Taylor', title: 'Sweet Baby James' },
      ],
    },
    {
      theme: 'Hit songs under two minutes in length',
      tracks: [
        { id: 350890283, artist: 'Maurice Williams & The Zodiacs', title: 'Stay', note: 'Runs 1:37, making it the shortest song ever to reach #1 on the Billboard Hot 100' },
        { id: 284043488, artist: 'The Box Tops', title: 'The Letter', note: 'Runs 1:53; hit #1 on the Billboard Hot 100 for four weeks in 1967' },
        { id: 1434877969, artist: 'Buddy Holly', title: 'Rave On', note: 'Runs 1:47; legendary 1958 rockabilly single released on Coral Records' },
        { id: 1443217116, artist: 'The Beach Boys', title: 'Little Deuce Coupe', note: 'Runs 1:38; featured on Surfer Girl and Little Deuce Coupe in 1963' },
      ],
    },
    {
      theme: 'Hit songs written by Kris Kristofferson recorded by others',
      tracks: [
        { id: 917030915, artist: 'Janis Joplin', title: 'Me and Bobby McGee', note: "Written by Kris Kristofferson; Joplin's posthumous 1971 release became a #1 hit" },
        { id: 169963353, artist: 'Johnny Cash', title: "Sunday Mornin' Comin' Down", note: 'Written by Kris Kristofferson; Cash took it to #1 on the country chart and won CMA Song of the Year' },
        { id: 1443733096, artist: 'Sammi Smith', title: 'Help Me Make It Through the Night', note: "Written by Kris Kristofferson; Smith's recording was a #1 country and #8 pop hit, winning a Grammy" },
        { id: 1153759967, artist: 'Ray Price', title: 'For the Good Times', note: "Written by Kris Kristofferson; Price's 1970 recording won the ACM Song of the Year award" },
      ],
    },
    {
      theme: 'Musicians who published cookbooks',
      tracks: [
        { id: 1443396469, artist: 'Snoop Dogg', title: "Drop It Like It's Hot (feat. Pharrell Williams)", note: "Published the bestselling cookbook From Crook to Cook: Platinum Recipes from Tha Boss Dogg's Kitchen" },
        { id: 188249353, artist: 'LaBelle', title: 'Lady Marmalade', note: 'Published several bestselling cookbooks including LaBelle Cuisine: Recipes to Heal the Soul' },
        { id: 1440785838, artist: 'Trisha Yearwood', title: "She's In Love With the Boy", note: "Published three bestselling cookbooks and hosted Emmy-winning Food Network show Trisha's Southern Kitchen" },
        { id: 255432728, artist: 'Ziggy Marley', title: 'True to Myself', note: 'Published the Ziggy Marley and Family Cookbook with organic Jamaican recipes' },
      ],
    },
  ],
};

export default puzzle;
