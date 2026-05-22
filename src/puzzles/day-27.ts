import type { Puzzle } from '../types';

const puzzle: Puzzle = {
  day: 27,
  date: '2026-06-05',
  author: 'Bojan Rajkovic',
  releaseAt: '2026-06-05T00:00:00Z',
  themes: [
    {
      theme: 'Head, Shoulders, Knees, and Toes',
      tracks: [
        { id: 1440784280, artist: 'Yeah Yeah Yeahs', title: 'Heads Will Roll' },
        { id: 1545382789, artist: 'Adele', title: 'Cold Shoulder' },
        { id: 1440926503, artist: 'Boyz II Men', title: 'On Bended Knee' },
        { id: 1585172565, artist: 'Zac Brown Band', title: 'Toes' },
      ],
    },
    {
      theme: 'Spooky / undead creature in the title',
      tracks: [
        { id: 1440735264, artist: 'The Cranberries', title: 'Zombie', note: 'about the Troubles' },
        { id: 1842444457, artist: 'Tame Impala', title: 'Dracula' },
        { id: 1216344997, artist: 'Jason Isbell', title: 'If We Were Vampires' },
        { id: 1443821690, artist: 'Andrew Gold', title: 'Spooky, Scary Skeletons' },
      ],
    },
    {
      theme: 'All written by Diane Warren',
      tracks: [
        { id: 217271368, artist: 'Aerosmith', title: "I Don't Want to Miss a Thing", note: 'Armageddon' },
        { id: 1473319252, artist: 'Céline Dion', title: 'Because You Loved Me', note: 'Up Close & Personal' },
        { id: 526521417, artist: 'Toni Braxton', title: 'Un-Break My Heart' },
        { id: 79590476, artist: 'LeAnn Rimes', title: 'How Do I Live', note: 'Con Air' },
      ],
    },
    {
      theme: 'Mickey Mouse Club alumni (1989–94 cast)',
      tracks: [
        { id: 267954487, artist: 'Britney Spears', title: 'Oops!... I Did It Again', note: 'MMC 1992–94' },
        { id: 1154239184, artist: 'Justin Timberlake', title: "Can't Stop the Feeling!", note: 'MMC 1993–94' },
        { id: 279647295, artist: 'Christina Aguilera', title: 'Dirrty', note: 'MMC 1991–94' },
        { id: 1440864026, artist: 'Ryan Gosling', title: 'City of Stars', note: 'MMC 1991–95' },
      ],
    },
  ],
};

export default puzzle;
