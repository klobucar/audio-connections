import type { PuzzleContent } from "../types";

const puzzle: PuzzleContent = {
  author: "Bojan Rajkovic",
  constraint: "You gotta know when to hold 'em",
  themes: [
    {
      theme: "A playing-card suit in the title",
      tracks: [
        { id: 1440907550, artist: "50 Cent", title: "In Da Club" },
        { id: 1436882689, artist: "Marilyn Monroe", title: "Diamonds Are a Girl's Best Friend" },
        { id: 1440648376, artist: "Styx", title: "Queen of Spades" },
        { id: 1415203739, artist: "Sting", title: "Shape of My Heart" },
      ],
    },
    {
      theme: "A playing card in the band's name",
      tracks: [
        { id: 1440727148, artist: "Queens of the Stone Age", title: "Little Sister" },
        { id: 290303018, artist: "Kings of Leon", title: "Use Somebody" },
        { id: 1049015475, artist: "Jack's Mannequin", title: "Dark Blue" },
        { id: 293814576, artist: "Ace of Base", title: "All That She Wants" },
      ],
    },
    {
      theme: "Song titles that are card games",
      tracks: [
        { id: 1444049092, artist: "Edwin Starr", title: "War", note: "The schoolyard card game — split the deck, high card wins" },
        { id: 1440905397, artist: "Guns N' Roses", title: "Patience", note: "Patience is the British name for solitaire" },
        { id: 1843488376, artist: "Elaine Paige", title: "Memory", note: "The matching-pairs card game, a.k.a. Concentration" },
        { id: 991516218, artist: "Muse", title: "Uno", note: "The card-shedding game, created in 1971" },
      ],
    },
    {
      theme: "Themes from poker movies",
      tracks: [
        { id: 1440761672, artist: "Chris Cornell", title: "You Know My Name", note: "Casino Royale (2006) — Bond wins it all at Texas hold 'em" },
        { id: 1440495612, artist: "Marvin Hamlisch", title: "The Entertainer", note: "The Sting (1973) — the ragtime theme for the big poker con" },
        { id: 258656687, artist: "Clint Black", title: "A Good Run of Bad Luck", note: "Written for Maverick (1994), Mel Gibson's poker western" },
        { id: 1569554513, artist: "Ray Charles", title: "The Cincinnati Kid", note: "Title song of the 1965 five-card-stud classic" },
      ],
    },
  ],
};

export default puzzle;
