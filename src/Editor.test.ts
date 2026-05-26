import { describe, expect, it } from 'vitest';
import { encodeBackup, decodeBackup, type PerDayRecord } from './transfer';

// The editor's interesting logic is the row → record projection. UI is
// covered end-to-end by Playwright; here we exercise the pure parts via
// the same path the component uses internally.

interface EditorRow {
  day: number;
  outcome: 'notPlayed' | 'won' | 'lost';
  preserved?: PerDayRecord;
}

function rowsToRecords(rows: EditorRow[], hidden: PerDayRecord[] = []): PerDayRecord[] {
  const records: PerDayRecord[] = [];
  for (const row of rows) {
    if (row.outcome === 'notPlayed') continue;
    if (row.preserved && row.preserved.outcome === row.outcome) {
      records.push(row.preserved);
    } else {
      records.push({ day: row.day, outcome: row.outcome });
    }
  }
  for (const h of hidden) records.push(h);
  return records;
}

function applyRecordsToRows(rows: EditorRow[], records: PerDayRecord[]): { rows: EditorRow[]; hidden: PerDayRecord[] } {
  const byDay = new Map(records.map((r) => [r.day, r]));
  const knownDays = new Set(rows.map((r) => r.day));
  const nextRows = rows.map<EditorRow>((row) => {
    const record = byDay.get(row.day);
    if (!record) return { day: row.day, outcome: 'notPlayed' };
    return { day: row.day, outcome: record.outcome, preserved: record };
  });
  const hidden = records.filter((r) => !knownDays.has(r.day));
  return { rows: nextRows, hidden };
}

describe('editor row projection', () => {
  const preservedWon: PerDayRecord = {
    day: 5,
    outcome: 'won',
    guessHistory: [
      { themes: [0, 0, 0, 0], correct: true },
      { themes: [1, 1, 1, 1], correct: true },
      { themes: [2, 2, 2, 2], correct: true },
      { themes: [3, 3, 3, 3], correct: true },
    ],
  };

  it('untouched rows preserve their original record byte-for-byte', () => {
    const rows: EditorRow[] = [{ day: 5, outcome: 'won', preserved: preservedWon }];
    expect(rowsToRecords(rows)).toEqual([preservedWon]);
  });

  it('dropping preserved (outcome changed) emits a synthetic record', () => {
    const rows: EditorRow[] = [{ day: 5, outcome: 'lost', preserved: undefined }];
    expect(rowsToRecords(rows)).toEqual([{ day: 5, outcome: 'lost' }]);
  });

  it('omits notPlayed rows from the export entirely', () => {
    const rows: EditorRow[] = [
      { day: 1, outcome: 'notPlayed' },
      { day: 2, outcome: 'won' },
      { day: 3, outcome: 'notPlayed' },
    ];
    expect(rowsToRecords(rows)).toEqual([{ day: 2, outcome: 'won' }]);
  });

  it('round-trips through encode/decode unchanged', () => {
    const rows: EditorRow[] = [
      { day: 5, outcome: 'won', preserved: preservedWon },
      { day: 6, outcome: 'lost' },
    ];
    const b64 = encodeBackup(rowsToRecords(rows));
    const result = decodeBackup(b64);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.envelope.days).toEqual([
      preservedWon,
      { day: 6, outcome: 'lost' },
    ]);
  });

  it('preserves records for days the editor does not display (future-dated)', () => {
    // Editor only shows released days; a backup may carry records for
    // Konami-played future days. Those should pass through on re-export.
    const releasedRows: EditorRow[] = [{ day: 1, outcome: 'notPlayed' }];
    const incoming: PerDayRecord[] = [
      { day: 1, outcome: 'won' },
      { day: 99, outcome: 'won' }, // unreleased / unknown to editor
    ];
    const { rows, hidden } = applyRecordsToRows(releasedRows, incoming);
    expect(rows).toEqual([{ day: 1, outcome: 'won', preserved: { day: 1, outcome: 'won' } }]);
    expect(hidden).toEqual([{ day: 99, outcome: 'won' }]);
    expect(rowsToRecords(rows, hidden)).toEqual([
      { day: 1, outcome: 'won' },
      { day: 99, outcome: 'won' },
    ]);
  });
});
