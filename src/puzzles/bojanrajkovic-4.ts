import type { PuzzleContent } from "../types";

const puzzle: PuzzleContent = {
  author: "Bojan Rajkovic",
  constraint: "Vive la France!",
  themes: [
    {
      theme: "Sung in French",
      tracks: [
        { id: 726378511, artist: "Édith Piaf", title: "La Vie en rose" },
        { id: 1440830407, artist: "Indila", title: "Dernière danse" },
        { id: 693461512, artist: "ZAZ", title: "Je veux" },
        { id: 1440862293, artist: "Stromae", title: "Formidable" },
      ],
    },
    {
      theme: "Songs by Bastille",
      tracks: [
        {
          id: 1440858321,
          artist: "Bastille",
          title: "Pompeii",
          note: "The band is named after Bastille Day — it's frontman Dan Smith's birthday.",
        },
        { id: 1440838546, artist: "Bastille", title: "Good Grief" },
        { id: 1440873712, artist: "Bastille", title: "Of the Night" },
        { id: 1440858446, artist: "Bastille", title: "Bad Blood" },
      ],
    },
    {
      theme: "English songs with a French hook",
      tracks: [
        {
          id: 188249353,
          artist: "Labelle",
          title: "Lady Marmalade",
          note: "Hook: « Voulez-vous coucher avec moi ce soir ? »",
        },
        {
          id: 20833655,
          artist: "Talking Heads",
          title: "Psycho Killer",
          note: "The « qu’est-ce que c’est » refrain",
        },
        {
          id: 1440816444,
          artist: "ABBA",
          title: "Voulez-Vous",
          note: "A French title bolted onto an English lyric",
        },
        {
          id: 192671835,
          artist: "B*Witched",
          title: "C'est la Vie",
          note: "French for “that’s life”",
        },
      ],
    },
    {
      theme: "English hits that are secretly French",
      tracks: [
        {
          id: 388128266,
          artist: "Elvis Presley",
          title: "Can't Help Falling in Love",
          note: "Melody from the 1784 French romance « Plaisir d’amour »",
        },
        {
          id: 706260534,
          artist: "Little Peggy March",
          title: "I Will Follow Him",
          note: "Began life as « Chariot », a 1962 French instrumental",
        },
        {
          id: 30393096,
          artist: "Bobby Darin",
          title: "Beyond the Sea",
          note: "Charles Trenet’s « La Mer », fitted with English words",
        },
        {
          id: 355934698,
          artist: "Terry Jacks",
          title: "Seasons in the Sun",
          note: "English rewrite of Jacques Brel’s « Le Moribond »",
        },
      ],
    },
  ],
};

export default puzzle;
