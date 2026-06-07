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

function jsonpLookupIds(itunesIds: ReadonlyArray<number>, timeoutMs = 10_000): Promise<ITunesLookupResult['results']> {
  return new Promise((resolve, reject) => {
    const idsLabel = itunesIds.join(',');
    const callbackName = `__itunes_cb_${itunesIds.join('_')}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    // Narrow the JSONP callback slot locally instead of widening Window
    // globally. The only thing we put on `window` is this one callback
    // per request; everything else stays strictly typed.
    const callbackHost = window as unknown as Record<string, unknown>;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      delete callbackHost[callbackName];
      script.remove();
      if (timer) clearTimeout(timer);
    };
    callbackHost[callbackName] = (data: ITunesLookupResult) => {
      cleanup();
      resolve(data.results);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error(`JSONP load failed for ${idsLabel}`));
    };
    timer = setTimeout(() => {
      cleanup();
      reject(new Error(`JSONP timeout for ${idsLabel}`));
    }, timeoutMs);
    script.src = `https://itunes.apple.com/lookup?id=${idsLabel}&callback=${encodeURIComponent(callbackName)}`;
    document.head.appendChild(script);
  });
}

function jsonpLookup(itunesId: number, timeoutMs = 10_000): Promise<ITunesLookupResult['results'][number] | null> {
  return jsonpLookupIds([itunesId], timeoutMs).then((results) => results[0] ?? null);
}

/** Exponential backoff (capped at 10s) before the Nth retry of a lookup. */
export function backoffDelayMs(attempt: number): number {
  return Math.min(500 * 2 ** (attempt - 1), 10_000);
}

export async function fetchTrackInfo(itunesId: number, attempt = 1): Promise<TrackInfo | null> {
  const MAX_ATTEMPTS = 6;
  try {
    const result = await jsonpLookup(itunesId);
    if (!result?.previewUrl) {
      console.warn(`No preview for ID ${itunesId}`);
      return null;
    }
    const info: TrackInfo = { previewUrl: result.previewUrl };
    if (result.trackViewUrl) info.trackViewUrl = result.trackViewUrl;
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
  const results = await jsonpLookupIds(itunesIds);
  const out = new Map<number, TrackInfo>();
  for (const result of results) {
    if (typeof result.trackId !== 'number' || !result.previewUrl) continue;
    const info: TrackInfo = { previewUrl: result.previewUrl };
    if (result.trackViewUrl) info.trackViewUrl = result.trackViewUrl;
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
