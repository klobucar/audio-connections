/** Animation timing constants driven by CSS custom properties on `:root`.
    The hook that orchestrates the solve animation (usePuzzleSession) and
    the App component both need these — keeping one source of truth here
    avoids two getComputedStyle calls and prevents the values from drifting
    if a future caller forgets to copy. */
function readCssDurationMs(prop: string, fallbackMs: number): number {
  if (typeof window === 'undefined') return fallbackMs;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  if (!raw) return fallbackMs;
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallbackMs;
  return raw.endsWith('ms') ? n : n * 1000;
}

export const EXIT_ANIM_MS = readCssDurationMs('--exit-anim-ms', 350);
export const MATCH_PULSE_MS = readCssDurationMs('--match-pulse-ms', 500);
