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
      const delay = Math.min(500 * Math.pow(2, attempt - 1), 10_000);
      await sleep(delay);
      return fetchPreviewUrl(itunesId, attempt + 1);
    }
    console.warn(`Failed to fetch ID ${itunesId} after ${attempt} attempts:`, e);
    return null;
  }
}

export { sleep };
