import type { PuzzleContent } from "../types";

const puzzle: PuzzleContent = {
  author: "Bojan Rajkovic",
  themes: [
    {
      theme: "Songs about wealth",
      tracks: [
        { id: 262058983, artist: "Hall & Oates", title: "Rich Girl" },
        { id: 80815209, artist: "Madonna", title: "Material Girl" },
        { id: 374419706, artist: "Travie McCoy feat. Bruno Mars", title: "Billionaire" },
        { id: 1665303764, artist: "Pink Floyd", title: "Money" },
      ],
    },
    {
      theme: "The Bird Is the Word",
      tracks: [
        { id: 1441133834, artist: "The Beatles", title: "Blackbird" },
        { id: 299941623, artist: "Bobby Day", title: "Rockin' Robin" },
        { id: 1435774732, artist: "Eminem", title: "Mockingbird" },
        { id: 1448967247, artist: "Hozier", title: "Shrike", note: "A shrike is a songbird — the predatory 'butcherbird'" },
      ],
    },
    {
      theme: "Songs about a specific historical event",
      tracks: [
        { id: 321976504, artist: "Gordon Lightfoot", title: "The Wreck of the Edmund Fitzgerald", note: "Lost in a Lake Superior gale, Nov 10 1975 — all 29 hands" },
        { id: 1713861908, artist: "Iron Maiden", title: "The Trooper", note: "The 1854 Charge of the Light Brigade, Crimean War" },
        { id: 1440834619, artist: "Don McLean", title: "American Pie", note: "'The day the music died' — the Feb 3 1959 plane crash" },
        { id: 986713204, artist: "Peter Gabriel", title: "Biko", note: "Anti-apartheid activist Steve Biko, killed in custody, 1977" },
      ],
    },
    {
      theme: "Bands Eric Clapton was in",
      tracks: [
        { id: 1440830954, artist: "Cream", title: "White Room", note: "Clapton's power trio with Jack Bruce & Ginger Baker" },
        { id: 1440663641, artist: "Derek & The Dominos", title: "Thorn Tree in the Garden", note: "The closing track on the Layla album, 1970" },
        { id: 1671540930, artist: "The Yardbirds", title: "For Your Love", note: "Clapton played on this 1965 hit, then quit over the band going pop" },
        { id: 1440853875, artist: "Blind Faith", title: "Can't Find My Way Home", note: "Clapton & Steve Winwood's 1969 supergroup" },
      ],
    },
  ],
};

export default puzzle;
