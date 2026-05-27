import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 18,
  date: '2026-05-27',
  author: 'Rob Wood',
  releaseAt: '2026-05-27T00:00:00Z',
  themes: [
    {
      theme: 'Songs about red vehicles',
      tracks: [
        { id: 1544173943, artist: 'Prince', title: "Little Red Corvette" },
        { id: 1436234589, artist: 'Dijon', title: "Nico's Red Truck" },
        { id: 1440884661, artist: 'The Royal Guardsmen', title: "Snoopy vs. The Red Baron" },
        { id: 1440656028, artist: 'Rush', title: "Red Barchetta" },
      ],
    },
    {
      theme: 'Bands with emotions in the name',
      tracks: [
        { id: 663662731, artist: 'Grateful Dead', title: "Touch of Grey" },
        { id: 191450927, artist: 'Rage Against the Machine', title: "Killing In The Name" },
        { id: 1440813509, artist: 'Tears for Fears', title: "Shout" },
        { id: 996111414, artist: 'Joy Division', title: "Love Will Tear Us Apart" },
      ],
    },
    {
      theme: 'Songs about drinking alone',
      tracks: [
        { id: 1583655305, artist: 'Merle Haggard', title: "I Think I'll Just Stay Here and Drink" },
        { id: 882945383, artist: 'Sia', title: 'Chandelier' },
        { id: 158182876, artist: 'Hank Williams', title: "There's a Tear In My Beer" },
        { id: 1611391433, artist: "George Thorogood and the Destroyers", title: 'I Drink Alone' },
      ],
    },
    {
      theme: 'Artists who were adopted',
      tracks: [
        { id: 254344790, artist: 'Run-DMC', title: "It's Tricky", note: "Darryl DMC McDaniels" },
        { id: 1842974732, artist: 'Blondie', title: "Heart of Glass", note: "Debbie Harry" },
        { id: 331985117, artist: 'Faith Hill', title: "Wild One", note: "Faith Hill" },
        { id: 388153872, artist: 'Sarah McLachlan', title: "Building a Mystery", note: "Sarah McLachlan" },
      ],
    },
  ],
};

export default puzzle;
