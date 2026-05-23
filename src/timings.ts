/** Animation timing constants driven by CSS custom properties on `:root`.
    The hook that orchestrates the solve animation (usePuzzleSession) and
    the App component both need these — keeping one source of truth here
    avoids two getComputedStyle calls and prevents the values from drifting
    if a future caller forgets to copy. */
/** Parse a CSS duration string ("350ms", "0.35s") to milliseconds, falling
 *  back to `fallbackMs` for an empty or unparseable value. */
export function parseCssDuration(raw: string, fallbackMs: number): number {
  const trimmed = raw.trim();
  if (!trimmed) return fallbackMs;
  const n = parseFloat(trimmed);
  if (!Number.isFinite(n)) return fallbackMs;
  return trimmed.endsWith('ms') ? n : n * 1000;
}

function readCssDurationMs(prop: string, fallbackMs: number): number {
  if (typeof window === 'undefined') return fallbackMs;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(prop);
  return parseCssDuration(raw, fallbackMs);
}

export const EXIT_ANIM_MS = readCssDurationMs('--exit-anim-ms', 350);
export const MATCH_PULSE_MS = readCssDurationMs('--match-pulse-ms', 500);
