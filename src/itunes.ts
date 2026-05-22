interface ITunesLookupResult {
  results: Array<{ previewUrl?: string }>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function jsonpLookup(itunesId: number, timeoutMs = 10_000): Promise<ITunesLookupResult['results'][number] | null> {
  return new Promise((resolve, reject) => {
    const callbackName = `__itunes_cb_${itunesId}_${Math.random().toString(36).slice(2)}`;
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
      resolve(data.results[0] ?? null);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error(`JSONP load failed for ${itunesId}`));
    };
    timer = setTimeout(() => {
      cleanup();
      reject(new Error(`JSONP timeout for ${itunesId}`));
    }, timeoutMs);
    script.src = `https://itunes.apple.com/lookup?id=${itunesId}&callback=${callbackName}`;
    document.head.appendChild(script);
  });
}

/** Exponential backoff (capped at 10s) before the Nth retry of a lookup. */
export function backoffDelayMs(attempt: number): number {
  return Math.min(500 * 2 ** (attempt - 1), 10_000);
}

export async function fetchPreviewUrl(itunesId: number, attempt = 1): Promise<string | null> {
  const MAX_ATTEMPTS = 6;
  try {
    const result = await jsonpLookup(itunesId);
    if (!result?.previewUrl) {
      console.warn(`No preview for ID ${itunesId}`);
      return null;
    }
    return result.previewUrl;
  } catch (e) {
    if (attempt < MAX_ATTEMPTS) {
      await sleep(backoffDelayMs(attempt));
      return fetchPreviewUrl(itunesId, attempt + 1);
    }
    console.warn(`Failed to fetch ID ${itunesId} after ${attempt} attempts:`, e);
    return null;
  }
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
