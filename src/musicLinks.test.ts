import { describe, expect, it } from 'vitest';
import { appleMusicUrl, spotifyUrl } from './musicLinks';

describe('appleMusicUrl', () => {
  it('prefers iTunes-supplied trackViewUrl when present — it highlights the track on landing', () => {
    const trackViewUrl =
      'https://music.apple.com/us/album/stairway-to-heaven/580708166?i=580708180';
    expect(appleMusicUrl(580708180, trackViewUrl)).toBe(trackViewUrl);
  });

  it('falls back to /song/<id> shortcut when trackViewUrl is absent', () => {
    expect(appleMusicUrl(580708180)).toBe('https://music.apple.com/song/580708180');
  });

  it('rejects a non-https trackViewUrl — it goes straight into an <a href>', () => {
    expect(appleMusicUrl(580708180, 'javascript:alert(1)')).toBe(
      'https://music.apple.com/song/580708180',
    );
    expect(appleMusicUrl(580708180, 'http://music.apple.com/song/580708180')).toBe(
      'https://music.apple.com/song/580708180',
    );
  });
});

describe('spotifyUrl', () => {
  it('builds a search URL with title + artist', () => {
    expect(spotifyUrl('Led Zeppelin', 'Stairway to Heaven')).toBe(
      'https://open.spotify.com/search/Stairway%20to%20Heaven%20Led%20Zeppelin',
    );
  });

  it('percent-encodes punctuation that would otherwise break the URL', () => {
    // Apostrophes, slashes, hashes — anything that needs encoding.
    expect(spotifyUrl("Guns N' Roses", 'Sweet Child o\' Mine')).toContain('Sweet%20Child%20o');
    expect(spotifyUrl('A/B', 'Track #1')).toBe(
      'https://open.spotify.com/search/Track%20%231%20A%2FB',
    );
  });
});
