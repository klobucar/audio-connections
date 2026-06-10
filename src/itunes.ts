interface ITunesLookupResult {
  results: Array<{ trackId?: number; previewUrl?: string; trackViewUrl?: string }>;
}

/** Subset of fields we keep from iTunes' /lookup response. `trackViewUrl`
 *  is the canonical music.apple.com URL Apple itself generates for the
 *  song — for tracks on multi-track albums it includes the album id +
 *  `?i=<trackId>` so the track is highlighted on landing. We fall back to
 *  the looser `/song/<id>` shortcut when it's missing. */
export interface TrackInfo {
  previewUrl: string;
  trackViewUrl?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Plain CORS fetch against /lookup. This used to be JSONP, which handed
 *  itunes.apple.com first-party script execution; the endpoint serves
 *  Access-Control-Allow-Origin nowadays, so fetch confines Apple's response
 *  to data. (The body arrives as text/javascript but is plain JSON without
 *  the callback param — .json() doesn't care about the content-type.) */
async function lookupIds(itunesIds: ReadonlyArray<number>, timeoutMs = 10_000): Promise<ITunesLookupResult['results']> {
  const idsLabel = itunesIds.join(',');
  const r = await fetch(`https://itunes.apple.com/lookup?id=${idsLabel}`, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!r.ok) throw new Error(`iTunes lookup failed for ${idsLabel}: HTTP ${r.status}`);
  const data = (await r.json()) as ITunesLookupResult;
  if (!Array.isArray(data.results)) throw new Error(`iTunes lookup returned no results array for ${idsLabel}`);
  return data.results;
}

function lookupId(itunesId: number, timeoutMs = 10_000): Promise<ITunesLookupResult['results'][number] | null> {
  return lookupIds([itunesId], timeoutMs).then((results) => results[0] ?? null);
}

/** Accept only https URLs from the lookup response. previewUrl is fetched and
 *  fed to <audio>, trackViewUrl becomes an <a href> — neither should ever be
 *  another scheme, so anything else is treated as absent. */
function httpsOnly(url: string | undefined): string | undefined {
  return url?.startsWith('https://') ? url : undefined;
}

/** Exponential backoff (capped at 10s) before the Nth retry of a lookup. */
export function backoffDelayMs(attempt: number): number {
  return Math.min(500 * 2 ** (attempt - 1), 10_000);
}

export async function fetchTrackInfo(itunesId: number, attempt = 1): Promise<TrackInfo | null> {
  const MAX_ATTEMPTS = 6;
  try {
    const result = await lookupId(itunesId);
    const previewUrl = httpsOnly(result?.previewUrl);
    if (!previewUrl) {
      console.warn(`No preview for ID ${itunesId}`);
      return null;
    }
    const info: TrackInfo = { previewUrl };
    const trackViewUrl = httpsOnly(result?.trackViewUrl);
    if (trackViewUrl) info.trackViewUrl = trackViewUrl;
    return info;
  } catch (e) {
    if (attempt < MAX_ATTEMPTS) {
      await sleep(backoffDelayMs(attempt));
      return fetchTrackInfo(itunesId, attempt + 1);
    }
    console.warn(`Failed to fetch ID ${itunesId} after ${attempt} attempts:`, e);
    return null;
  }
}

/** Batch lookup for a puzzle's metadata. Missing IDs are deliberately silent:
 *  the session retries those with fetchTrackInfo(), which logs by iTunes ID if
 *  they still fail individually. */
export async function fetchTrackInfoBatch(itunesIds: ReadonlyArray<number>): Promise<Map<number, TrackInfo>> {
  const results = await lookupIds(itunesIds);
  const out = new Map<number, TrackInfo>();
  for (const result of results) {
    const previewUrl = httpsOnly(result.previewUrl);
    if (typeof result.trackId !== 'number' || !previewUrl) continue;
    const info: TrackInfo = { previewUrl };
    const trackViewUrl = httpsOnly(result.trackViewUrl);
    if (trackViewUrl) info.trackViewUrl = trackViewUrl;
    out.set(result.trackId, info);
  }
  return out;
}

/** Fetch the .m4a preview into a Blob and return a blob: URL the caller
 *  can hand to an <audio> element. Returns null on any failure so the
 *  caller can gracefully fall back to streaming on play. */
export async function fetchPreviewBlobUrl(previewUrl: string): Promise<string | null> {
  try {
    const r = await fetch(previewUrl);
    if (!r.ok) return null;
    const blob = await r.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn('Preview blob fetch failed:', e);
    return null;
  }
}

export { sleep };
