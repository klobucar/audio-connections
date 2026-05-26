import { describe, expect, it } from 'vitest';
import {
  FORMAT_VERSION,
  decodeBackup,
  encodeBackup,
  toTransferGuess,
  type PerDayRecord,
} from './transfer';

const sample: PerDayRecord[] = [
  { day: 5, outcome: 'won', guessHistory: [
    { themes: [0, 1, 2, 3], correct: false },
    { themes: [0, 0, 0, 0], correct: true },
    { themes: [1, 1, 1, 1], correct: true },
    { themes: [2, 2, 2, 2], correct: true },
    { themes: [3, 3, 3, 3], correct: true },
  ] },
  { day: 6, outcome: 'lost', guessHistory: [
    { themes: [0, 1, 2, 3], correct: false },
    { themes: [0, 1, 2, 3], correct: false },
    { themes: [0, 1, 2, 3], correct: false },
    { themes: [0, 1, 2, 3], correct: false },
  ] },
  // Editor-synthesized record: no history.
  { day: 7, outcome: 'won' },
];

describe('encodeBackup / decodeBackup', () => {
  it('round-trips a full envelope including the editor-synthesized record', () => {
    const b64 = encodeBackup(sample, new Date('2026-05-26T12:00:00Z'));
    const result = decodeBackup(b64);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.envelope.formatVersion).toBe(FORMAT_VERSION);
    expect(result.envelope.exportedAt).toBe('2026-05-26T12:00:00.000Z');
    expect(result.envelope.app).toBe('audio-connections');
    expect(result.envelope.days).toEqual(sample);
  });

  it('rejects empty input', () => {
    expect(decodeBackup('')).toEqual({ ok: false, error: 'Empty input.' });
    expect(decodeBackup('   ')).toEqual({ ok: false, error: 'Empty input.' });
  });

  it('rejects non-base64 garbage', () => {
    const result = decodeBackup('!!!not base64!!!');
    expect(result.ok).toBe(false);
  });

  it('rejects valid base64 that decodes to non-JSON', () => {
    const result = decodeBackup(btoa('hello world'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/corrupted/);
  });

  it('rejects a backup from a different app', () => {
    const b64 = btoa(JSON.stringify({
      formatVersion: 1,
      exportedAt: '',
      app: 'other-game',
      days: [],
    }));
    const result = decodeBackup(b64);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/different app/);
  });

  it('rejects a backup with a newer formatVersion', () => {
    const b64 = btoa(JSON.stringify({
      formatVersion: FORMAT_VERSION + 1,
      exportedAt: '',
      app: 'audio-connections',
      days: [],
    }));
    const result = decodeBackup(b64);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/newer build/);
  });

  it('rejects a malformed per-day record', () => {
    const b64 = btoa(JSON.stringify({
      formatVersion: 1,
      exportedAt: '',
      app: 'audio-connections',
      days: [{ day: 5, outcome: 'tied' }],
    }));
    const result = decodeBackup(b64);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/Day record #1/);
  });

  it('rejects a guess with non-numeric theme indices', () => {
    const b64 = btoa(JSON.stringify({
      formatVersion: 1,
      exportedAt: '',
      app: 'audio-connections',
      days: [{ day: 5, outcome: 'won', guessHistory: [{ themes: ['a'], correct: true }] }],
    }));
    expect(decodeBackup(b64).ok).toBe(false);
  });

  it('accepts an empty days list', () => {
    const result = decodeBackup(encodeBackup([]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.envelope.days).toEqual([]);
  });
});

describe('toTransferGuess', () => {
  it('strips the ids field so wrong-guess track identity is never serialized', () => {
    const wire = toTransferGuess({ themes: [0, 0, 1, 2], correct: false, ids: [99, 100, 101, 102] });
    expect(wire).toEqual({ themes: [0, 0, 1, 2], correct: false });
    expect('ids' in wire).toBe(false);
  });
});
