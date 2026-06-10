import { afterEach, describe, expect, it, vi } from 'vitest';
import { backoffDelayMs, fetchTrackInfoBatch } from './itunes';

function stubLookupResponse(results: unknown): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ results }),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTrackInfoBatch', () => {
  it('fetches /lookup as plain CORS JSON (no JSONP callback) and maps results by trackId', async () => {
    const fetchMock = stubLookupResponse([
      { trackId: 1, previewUrl: 'https://audio-ssl.itunes.apple.com/a.m4a', trackViewUrl: 'https://music.apple.com/album/x?i=1' },
      { trackId: 2, previewUrl: 'https://audio-ssl.itunes.apple.com/b.m4a' },
    ]);

    const out = await fetchTrackInfoBatch([1, 2]);

    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toBe('https://itunes.apple.com/lookup?id=1,2');
    expect(url).not.toContain('callback');
    expect(out.get(1)).toEqual({
      previewUrl: 'https://audio-ssl.itunes.apple.com/a.m4a',
      trackViewUrl: 'https://music.apple.com/album/x?i=1',
    });
    expect(out.get(2)).toEqual({ previewUrl: 'https://audio-ssl.itunes.apple.com/b.m4a' });
  });

  it('drops tracks with a non-https previewUrl and strips non-https trackViewUrls', async () => {
    stubLookupResponse([
      { trackId: 1, previewUrl: 'http://insecure.example/a.m4a' },
      { trackId: 2, previewUrl: 'https://audio-ssl.itunes.apple.com/b.m4a', trackViewUrl: 'javascript:alert(1)' },
    ]);

    const out = await fetchTrackInfoBatch([1, 2]);

    expect(out.has(1)).toBe(false);
    expect(out.get(2)).toEqual({ previewUrl: 'https://audio-ssl.itunes.apple.com/b.m4a' });
  });

  it('rejects on a non-OK response and on a body without a results array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(fetchTrackInfoBatch([1])).rejects.toThrow('HTTP 503');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ errorMessage: 'nope' }) }),
    );
    await expect(fetchTrackInfoBatch([1])).rejects.toThrow('no results array');
  });
});

describe('backoffDelayMs', () => {
  it('doubles the delay on each successive attempt', () => {
    expect(backoffDelayMs(1)).toBe(500);
    expect(backoffDelayMs(2)).toBe(1000);
    expect(backoffDelayMs(3)).toBe(2000);
    expect(backoffDelayMs(4)).toBe(4000);
    expect(backoffDelayMs(5)).toBe(8000);
  });

  it('caps the delay at 10 seconds', () => {
    expect(backoffDelayMs(6)).toBe(10_000);
    expect(backoffDelayMs(20)).toBe(10_000);
  });
});
