import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'aschmitz',
  constraint: 'turn and face the strange',
  themes: [
    {
      theme: 'Change in the title',
      tracks: [
        { id: 159476284, artist: 'Bob Dylan', title: "The Times They Are A-Changin'" },
        { id: 787641279, artist: 'Black Sabbath', title: 'Changes' },
        { id: 1440495265, artist: 'Sam Cooke', title: 'A Change Is Gonna Come' },
        { id: 1445001516, artist: 'Sigma (featuring Paloma Faith)', title: 'Changing' },
      ],
    },
    {
      theme: 'Songs best known for their live recording',
      tracks: [
        { id: 186352862, artist: 'Cheap Trick', title: 'I Want You to Want Me' },
        { id: 1469575886, artist: 'Bob Marley & The Wailers', title: 'No Woman, No Cry' },
        { id: 251002659, artist: 'Johnny Cash', title: 'A Boy Named Sue' },
        { id: 1853653758, artist: 'Kiss', title: 'Rock and Roll All Nite' },
      ],
    },
    {
      theme: 'Songs released first in a non-English language',
      tracks: [
        { id: 1672585478, artist: 'Nena', title: '99 Red Balloons', note: 'German: 99 Luftballons' },
        { id: 1454026498, artist: 't.A.T.u.', title: 'All the Things She Said', note: 'Russian: Ya Soshla s Uma' },
        { id: 1550643319, artist: 'Peter Schilling', title: 'Major Tom (Coming Home)', note: 'German: Major Tom [völlig losgelöst]' },
        { id: 895837208, artist: 'Ricky Martin', title: 'The Cup of Life', note: 'Spanish: La Copa de la Vida' },
      ],
    },
    {
      theme: 'Album covers changed due to controversy',
      tracks: [
        { id: 1377813288, artist: "Guns N' Roses", title: 'Welcome to the Jungle', note: 'Appetite for Destruction' },
        { id: 1440816778, artist: 'The Rolling Stones', title: 'Miss You', note: 'Some Girls' },
        { id: 1469583292, artist: 'Lynyrd Skynyrd', title: "What's Your Name", note: 'Street Survivors' },
        { id: 1195108771, artist: 'David Bowie', title: 'Rebel Rebel', note: 'Diamond Dogs' },
      ],
    },
  ],
};

export default puzzle;
