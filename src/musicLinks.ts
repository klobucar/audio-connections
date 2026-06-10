/**
 * Deep links into music services for a solved track.
 *
 * Apple Music gets a direct deep link by trackId — same number we already
 * use for the iTunes preview lookup, so it lands on the exact song with no
 * ambiguity.
 *
 * Spotify doesn't expose a public ID-by-iTunes-id lookup, so we fall back
 * to a web-search query. The user picks the right hit; usually it's the
 * top result.
 */

export function appleMusicUrl(trackId: number, trackViewUrl?: string): string {
  // Prefer iTunes' canonical trackViewUrl — that's the album-page URL with
  // the `?i=<trackId>` query Apple Music uses to highlight the specific
  // track on landing. The `/song/<trackId>` shortcut redirects to a song
  // view sometimes and a non-highlighted album page other times, depending
  // on the storefront and whether the track is from a single vs. album.
  // Scheme check because this lands in an <a href>: itunes.ts already
  // filters lookup responses, but this is the last line of defense for a
  // URL that arrived some other way (e.g. an edited save).
  if (trackViewUrl?.startsWith('https://')) return trackViewUrl;
  return `https://music.apple.com/song/${trackId}`;
}

export function spotifyUrl(artist: string, title: string): string {
  const q = `${title} ${artist}`.trim();
  return `https://open.spotify.com/search/${encodeURIComponent(q)}`;
}
