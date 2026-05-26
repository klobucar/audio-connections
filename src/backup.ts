/** Glue between the wire format (transfer.ts) and localStorage
 *  (storage.ts). Collect projects live per-day state to wire records;
 *  Apply replaces all per-day state with a given set of wire records,
 *  leaving the currentDay / introSeen / sort singletons alone. */
import { MAX_MISTAKES, puzzles } from './puzzles';
import {
  clearState,
  loadState,
  saveState,
  type PersistedGameState,
} from './storage';
import { toTransferGuess, type PerDayRecord, type TransferGuess } from './transfer';

const DAY_KEY_PREFIX = 'audio-connections:day:';

/** Read every terminal-day record out of localStorage in puzzle order.
 *  In-progress days are skipped — the wire format is terminal-only. */
export function collectBackup(): PerDayRecord[] {
  const records: PerDayRecord[] = [];
  for (const puzzle of puzzles) {
    const state = loadState(puzzle.day);
    if (!state || !state.gameOver) continue;
    records.push(stateToRecord(state));
  }
  return records;
}

/** Wipe every per-day record and write the supplied set. Singletons
 *  (currentDay, introSeen, sort) are intentionally untouched — they're
 *  device-local UX state, not progress. */
export function applyBackup(records: PerDayRecord[]): void {
  if (typeof localStorage === 'undefined') return;

  for (const puzzle of puzzles) clearState(puzzle.day);

  for (const record of records) {
    const puzzle = puzzles.find((p) => p.day === record.day);
    // Records for days that don't exist in this build are dropped silently —
    // could happen after a fork rename or an editor-fabricated day number.
    if (!puzzle) continue;
    // trackOrder uses positional indices, matching how usePuzzleSession
    // assigns LoadedTrack.id (id = i in the flattened theme×track list).
    const trackCount = puzzle.themes.reduce((sum, t) => sum + t.tracks.length, 0);
    const trackOrder = Array.from({ length: trackCount }, (_, i) => i);
    saveState(record.day, materializeRecord(record, trackOrder));
  }
}

function stateToRecord(state: PersistedGameState): PerDayRecord {
  const won = state.mistakes < MAX_MISTAKES;
  return {
    day: state.day,
    outcome: won ? 'won' : 'lost',
    guessHistory: state.guessHistory.map(toTransferGuess),
  };
}

/** Build a PersistedGameState that satisfies the runtime invariants for
 *  a terminal record.
 *
 *  - solvedThemes is always [0,1,2,3]: on a win every theme is solved by
 *    play; on a loss usePuzzleSession auto-reveals the unsolved themes as
 *    a final flourish, so deriveDayState only distinguishes won from lost
 *    via the mistake count, never via this list.
 *  - mistakes < MAX_MISTAKES means won; mistakes === MAX_MISTAKES means lost.
 *    When guessHistory is present we count wrongs from it; when absent
 *    (editor record) we set 0 for won and MAX_MISTAKES for lost.
 *  - trackOrder must be set-equal to the freshly-loaded track ids when the
 *    user opens this day, or the session loader treats our save as stale
 *    and reseeds via load-fresh — which immediately overwrites our record
 *    with an empty in-progress state. The check exists to catch puzzles
 *    that have been edited since a real save (a track added/removed); we
 *    have to manufacture a value that passes it. LoadedTrack.id is the
 *    positional index `i` in the flattened theme×track list (see
 *    usePuzzleSession.ts at the `id: i` assignment), NOT the iTunes id
 *    from RawTrack, so we use [0..trackCount-1]. */
function materializeRecord(
  record: PerDayRecord,
  trackOrder: number[],
): Omit<PersistedGameState, '__v' | 'day'> {
  const history: TransferGuess[] = record.guessHistory ?? [];
  const mistakes = record.guessHistory
    ? history.filter((g) => !g.correct).length
    : record.outcome === 'won'
      ? 0
      : MAX_MISTAKES;

  return {
    selected: [],
    solvedThemes: [0, 1, 2, 3],
    notes: [],
    mistakes,
    guessHistory: history.map((g) => ({ themes: g.themes, correct: g.correct, ids: [] })),
    gameOver: true,
    trackOrder,
    guessSignatures: [],
  };
}

export const __testing = { DAY_KEY_PREFIX, materializeRecord };
