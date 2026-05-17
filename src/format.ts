/** Shared date formatters. All pass `undefined` for locale so the browser's
 *  region settings drive month names, weekday names, and 12/24-hour clock. */

/** Long-form date for a puzzle's calendar day ("May 17, 2026").
 *  Input is a YYYY-MM-DD string; parsed at noon UTC so the displayed day
 *  doesn't flip across timezone boundaries. */
export function formatPuzzleDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

/** Short-form datetime for a locked puzzle's unlock moment
 *  ("Sat, May 24, 12:00 AM"). Input is an ISO timestamp; the wall-clock
 *  output is in the browser's local timezone. */
export function formatReleaseAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
