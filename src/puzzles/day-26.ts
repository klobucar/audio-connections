import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 26,
  date: '2026-06-04',
  author: 'Jonathon Klobucar',
  releaseAt: '2026-06-04T00:00:00Z',
  themes: [
    {
      theme: 'Songs about food',
      tracks: [
        { id: 1861769503, artist: 'The Presidents of the United States of America', title: 'Peaches' },
        { id: 1440673656, artist: 'Jimmy Buffett', title: 'Cheeseburger in Paradise' },
        { id: 1485802967, artist: 'Harry Styles', title: 'Watermelon Sugar' },
        { id: 275018555, artist: 'Kelis', title: 'Milkshake' },
      ],
    },
    {
      theme: "Onomatopoeia in the title — Holy '66, Batman!",
      tracks: [
        { id: 30394505, artist: 'Bobby Darin', title: 'Splish Splash' },
        { id: 1735534479, artist: 'Nancy Sinatra', title: 'Bang Bang (My Baby Shot Me Down)' },
        { id: 1443060256, artist: 'Black Eyed Peas', title: 'Boom Boom Pow' },
        { id: 1603515814, artist: 'Charli XCX', title: 'Boom Clap' },
      ],
    },
    {
      theme: 'Michael McDonald guest vocals',
      tracks: [
        { id: 1845049884, artist: 'Christopher Cross', title: 'Ride Like the Wind' },
        { id: 1706428468, artist: 'Steely Dan', title: 'Peg' },
        { id: 1444223467, artist: 'James Ingram & Michael McDonald', title: 'Yah Mo B There', note: 'Ya mo burn this place to the ground' },
        { id: 1197789382, artist: 'Thundercat', title: 'Show You the Way' },
      ],
    },
    {
      theme: "#1 hit off the artist's debut album",
      tracks: [
        { id: 1377826892, artist: "Guns N' Roses", title: "Sweet Child o' Mine", note: 'Appetite for Destruction' },
        { id: 716268684, artist: 'The Knack', title: 'My Sharona', note: 'Get the Knack' },
        { id: 1308542773, artist: 'Christina Aguilera', title: 'Genie in a Bottle', note: 'Christina Aguilera' },
        { id: 380907765, artist: 'a-ha', title: 'Take On Me', note: 'Hunting High and Low' },
      ],
    },
  ],
};

export default puzzle;
