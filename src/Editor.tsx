import { useCallback, useMemo, useState } from 'react';
import { isReleased, puzzles } from './puzzles';
import { applyBackup, collectBackup } from './backup';
import { decodeBackup, encodeBackup, type PerDayRecord } from './transfer';

/** Three editable per-day states. "notPlayed" is omission from the export. */
type RowOutcome = 'notPlayed' | 'won' | 'lost';

interface EditorRow {
  day: number;
  outcome: RowOutcome;
  /** Original record from the loaded backup, kept byte-for-byte until the
   *  user clicks any outcome button on this row. Re-emitted verbatim on
   *  export when present, so untouched rows preserve their guessHistory. */
  preserved?: PerDayRecord;
}

type LoadFeedback = { kind: 'idle' } | { kind: 'error'; message: string } | { kind: 'ok'; count: number };
type SaveFeedback = { kind: 'idle' } | { kind: 'saved' };

/** Days the editor shows. Future days are hidden to avoid surfacing
 *  release schedule information here. Konami-unlocked plays for those
 *  days still survive an editor round-trip via `hiddenRecords`. */
const releasedPuzzles = puzzles.filter((p) => isReleased(p));

function initialRows(): EditorRow[] {
  return releasedPuzzles.map((p) => ({ day: p.day, outcome: 'notPlayed' as const }));
}

interface ApplyResult {
  rows: EditorRow[];
  hidden: PerDayRecord[];
}

function applyRecordsToRows(rows: EditorRow[], records: PerDayRecord[]): ApplyResult {
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

function rowsToRecords(rows: EditorRow[], hidden: PerDayRecord[]): PerDayRecord[] {
  const records: PerDayRecord[] = [];
  for (const row of rows) {
    if (row.outcome === 'notPlayed') continue;
    if (row.preserved && row.preserved.outcome === row.outcome) {
      records.push(row.preserved);
    } else {
      records.push({ day: row.day, outcome: row.outcome });
    }
  }
  // Pass-through for records the editor doesn't display (future-dated days
  // a Konami-unlocked play produced). Preserved verbatim so a round-trip
  // through the editor doesn't silently delete them.
  for (const h of hidden) records.push(h);
  return records;
}

export function Editor() {
  const [rows, setRows] = useState<EditorRow[]>(initialRows);
  const [hiddenRecords, setHiddenRecords] = useState<PerDayRecord[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadFeedback, setLoadFeedback] = useState<LoadFeedback>({ kind: 'idle' });
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback>({ kind: 'idle' });
  const [bulkFrom, setBulkFrom] = useState('');
  const [bulkTo, setBulkTo] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const outputB64 = useMemo(
    () => encodeBackup(rowsToRecords(rows, hiddenRecords)),
    [rows, hiddenRecords],
  );
  const playedCount = useMemo(() => rows.filter((r) => r.outcome !== 'notPlayed').length, [rows]);
  const preservedCount = useMemo(
    () => rows.filter((r) => r.outcome !== 'notPlayed' && r.preserved && r.preserved.outcome === r.outcome).length,
    [rows],
  );

  const handleLoadFromText = useCallback(() => {
    const result = decodeBackup(inputText);
    if (!result.ok) {
      setLoadFeedback({ kind: 'error', message: result.error });
      return;
    }
    const applied = applyRecordsToRows(rows, result.envelope.days);
    setRows(applied.rows);
    setHiddenRecords(applied.hidden);
    setLoadFeedback({ kind: 'ok', count: result.envelope.days.length });
  }, [inputText, rows]);

  const handleLoadFromDevice = useCallback(() => {
    const records = collectBackup();
    const applied = applyRecordsToRows(rows, records);
    setRows(applied.rows);
    setHiddenRecords(applied.hidden);
    setLoadFeedback({ kind: 'ok', count: records.length });
  }, [rows]);

  const handleSetOutcome = useCallback((day: number, outcome: RowOutcome) => {
    setRows((prev) =>
      prev.map((row) =>
        row.day === day
          ? { day: row.day, outcome, preserved: row.preserved && outcome === row.preserved.outcome ? row.preserved : undefined }
          : row,
      ),
    );
    setSaveFeedback({ kind: 'idle' });
  }, []);

  const handleBulkSet = useCallback(
    (outcome: RowOutcome) => {
      const from = bulkFrom === '' ? -Infinity : Number(bulkFrom);
      const to = bulkTo === '' ? Infinity : Number(bulkTo);
      if (!Number.isFinite(from) && bulkFrom !== '') return;
      if (!Number.isFinite(to) && bulkTo !== '') return;
      setRows((prev) =>
        prev.map((row) =>
          row.day >= from && row.day <= to
            ? { day: row.day, outcome, preserved: row.preserved && outcome === row.preserved.outcome ? row.preserved : undefined }
            : row,
        ),
      );
      setSaveFeedback({ kind: 'idle' });
    },
    [bulkFrom, bulkTo],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(outputB64);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 1500);
    } catch {
      setCopyState('failed');
    }
  }, [outputB64]);

  const handleSaveToDevice = useCallback(() => {
    applyBackup(rowsToRecords(rows, hiddenRecords));
    setSaveFeedback({ kind: 'saved' });
  }, [rows, hiddenRecords]);

  return (
    <div className="editor-page">
      <header className="editor-header">
        <h1>Audio Connections · History Editor</h1>
        <p className="editor-sub">
          Decode a backup string, mark days won, lost, or not played, and re-encode.
          Untouched rows preserve their original emoji grid; edited rows become summary-only.
          <a href="/" className="editor-link"> ← Back to game</a>
        </p>
      </header>

      <section className="editor-section">
        <h2>1 · Load</h2>
        <textarea
          className="editor-textarea"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            if (loadFeedback.kind !== 'idle') setLoadFeedback({ kind: 'idle' });
          }}
          placeholder="Paste backup string here"
          spellCheck={false}
          data-testid="editor-input"
        />
        <div className="editor-row">
          <button
            type="button"
            className="settings-btn"
            onClick={handleLoadFromText}
            disabled={!inputText.trim()}
            data-testid="editor-load-text"
          >
            Load from text
          </button>
          <button
            type="button"
            className="settings-btn"
            onClick={handleLoadFromDevice}
            data-testid="editor-load-device"
          >
            Load from this device
          </button>
        </div>
        {loadFeedback.kind === 'error' && (
          <p className="settings-error" data-testid="editor-load-error">{loadFeedback.message}</p>
        )}
        {loadFeedback.kind === 'ok' && (
          <p className="editor-ok">Loaded {loadFeedback.count} day{loadFeedback.count === 1 ? '' : 's'}.</p>
        )}
      </section>

      <section className="editor-section">
        <h2>2 · Edit</h2>
        <div className="editor-bulk">
          <span className="editor-bulk-label">Bulk:</span>
          <label>
            from day
            <input
              type="number"
              value={bulkFrom}
              onChange={(e) => setBulkFrom(e.target.value)}
              className="editor-input-num"
              data-testid="editor-bulk-from"
            />
          </label>
          <label>
            to day
            <input
              type="number"
              value={bulkTo}
              onChange={(e) => setBulkTo(e.target.value)}
              className="editor-input-num"
              data-testid="editor-bulk-to"
            />
          </label>
          <button type="button" className="settings-btn" onClick={() => handleBulkSet('won')}>
            Set won
          </button>
          <button type="button" className="settings-btn" onClick={() => handleBulkSet('lost')}>
            Set lost
          </button>
          <button type="button" className="settings-btn" onClick={() => handleBulkSet('notPlayed')}>
            Set not played
          </button>
        </div>
        <p className="editor-hint">
          Leave a bound empty to mean "no limit". Bulk edits drop preserved history on any row they touch.
        </p>

        <ul className="editor-list" data-testid="editor-list">
          {rows.map((row) => (
            <li key={row.day} className="editor-list-row">
              <span className="editor-list-day">Day {row.day}</span>
              <span className="editor-list-meta">
                {row.preserved && row.preserved.outcome === row.outcome
                  ? row.preserved.guessHistory
                    ? 'preserved with history'
                    : 'preserved'
                  : row.outcome === 'notPlayed'
                    ? ''
                    : 'edited'}
              </span>
              <div className="editor-list-btns">
                <button
                  type="button"
                  className={`editor-pill ${row.outcome === 'notPlayed' ? 'editor-pill--on' : ''}`}
                  onClick={() => handleSetOutcome(row.day, 'notPlayed')}
                  data-testid={`editor-day-${row.day}-notplayed`}
                >
                  not played
                </button>
                <button
                  type="button"
                  className={`editor-pill ${row.outcome === 'won' ? 'editor-pill--on editor-pill--won' : ''}`}
                  onClick={() => handleSetOutcome(row.day, 'won')}
                  data-testid={`editor-day-${row.day}-won`}
                >
                  won
                </button>
                <button
                  type="button"
                  className={`editor-pill ${row.outcome === 'lost' ? 'editor-pill--on editor-pill--lost' : ''}`}
                  onClick={() => handleSetOutcome(row.day, 'lost')}
                  data-testid={`editor-day-${row.day}-lost`}
                >
                  lost
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="editor-section">
        <h2>3 · Export</h2>
        <p className="editor-hint">
          {playedCount} played day{playedCount === 1 ? '' : 's'} · {preservedCount} preserved with original history
        </p>
        <textarea
          className="editor-textarea"
          value={outputB64}
          readOnly
          spellCheck={false}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          data-testid="editor-output"
        />
        <div className="editor-row">
          <button
            type="button"
            className="settings-btn"
            onClick={handleCopy}
            data-testid="editor-copy"
          >
            {copyState === 'copied' ? 'Copied!' : copyState === 'failed' ? 'Copy failed' : 'Copy'}
          </button>
          <button
            type="button"
            className="settings-btn"
            onClick={handleSaveToDevice}
            data-testid="editor-save-device"
          >
            Save to this device
          </button>
        </div>
        {saveFeedback.kind === 'saved' && (
          <p className="editor-ok">
            Saved. Reload your game tab to see the changes.
          </p>
        )}
      </section>
    </div>
  );
}
