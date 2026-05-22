import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearState,
  loadCurrentDay,
  loadState,
  saveCurrentDay,
  saveState,
} from './storage';
import type { PersistedGameState } from './storage';

// happy-dom supplies a real localStorage; these exercise the load/save
// round-trip and — more importantly — the defensive rejections that keep a
// stale or cross-day payload from being trusted.

// Storage keys are duplicated here on purpose: they are a stable wire format
// (changing them already orphans every player's save), so pinning them in the
// test is a feature, not brittleness.
const dayKey = (day: number) => `audio-connections:day:${day}`;
const CURRENT_DAY_KEY = 'audio-connections:currentDay';

const sample: Omit<PersistedGameState, '__v' | 'day'> = {
  selected: [1, 2],
  solvedThemes: [0],
  notes: [[3, 'a guitar riff']],
  mistakes: 1,
  guessHistory: [{ themes: [0, 0, 0, 1], correct: false, ids: [0, 1, 2, 3] }],
  gameOver: false,
  trackOrder: [3, 1, 0, 2],
  guessSignatures: ['0,1,2,3'],
};

describe('day state storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a saved day', () => {
    saveState(5, sample);
    expect(loadState(5)).toEqual({ __v: 1, day: 5, ...sample });
  });

  it('returns null for a day that was never saved', () => {
    expect(loadState(99)).toBeNull();
  });

  it('rejects a payload whose schema version does not match', () => {
    localStorage.setItem(dayKey(5), JSON.stringify({ __v: 999, day: 5, ...sample }));
    expect(loadState(5)).toBeNull();
  });

  it('rejects a payload whose day field does not match its slot', () => {
    // An older build once wrote day N-1's state into day N's key; this guard
    // is what stops that contamination from being read back.
    localStorage.setItem(dayKey(6), JSON.stringify({ __v: 1, day: 5, ...sample }));
    expect(loadState(6)).toBeNull();
  });

  it('returns null for malformed JSON instead of throwing', () => {
    localStorage.setItem(dayKey(5), '{ not json');
    expect(loadState(5)).toBeNull();
  });

  it('clearState removes a saved day', () => {
    saveState(5, sample);
    clearState(5);
    expect(loadState(5)).toBeNull();
  });
});

describe('current-day pointer', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips the current day', () => {
    saveCurrentDay(12);
    expect(loadCurrentDay()).toBe(12);
  });

  it('returns null when unset', () => {
    expect(loadCurrentDay()).toBeNull();
  });

  it('returns null for a non-numeric stored value', () => {
    localStorage.setItem(CURRENT_DAY_KEY, 'banana');
    expect(loadCurrentDay()).toBeNull();
  });
});
