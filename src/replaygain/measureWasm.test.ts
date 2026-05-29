import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { WasmLoudness } from './measureWasm';

// Tests the SHIPPING wasm (the reference ebur128 crate compiled to wasm32)
// directly against known signals. This is the correctness gate for the artifact
// committed at src/replaygain/ebur128.wasm — if wasm:build regenerates it, these
// must still pass. (During development the wasm was also matched to the
// natively-compiled crate to ±0.005 LU / exact dBTP; see PROVENANCE.md.)

let wasm: WasmLoudness;
beforeAll(async () => {
  const bytes = readFileSync(new URL('./ebur128.wasm', import.meta.url));
  wasm = await WasmLoudness.fromBytes(bytes);
});

function sine(freq: number, amp: number, durSec: number, fs: number, phase = 0): Float32Array {
  const n = Math.round(durSec * fs);
  const out = new Float32Array(n);
  const w = (2 * Math.PI * freq) / fs;
  for (let i = 0; i < n; i++) out[i] = amp * Math.sin(w * i + phase);
  return out;
}
const dbfs = (db: number) => Math.pow(10, db / 20);

describe('ebur128 wasm — integrated LUFS', () => {
  it('reads a stereo -23 dBFS 1 kHz sine at -23 LUFS (EBU anchor)', () => {
    const ch = sine(1000, dbfs(-23), 4, 48000);
    expect(wasm.measure([ch, ch], 48000).integratedLufs).toBeCloseTo(-23, 1);
  });

  it('is +3.01 LU louder stereo than mono of the same signal', () => {
    const ch = sine(1000, dbfs(-20), 4, 48000);
    const mono = wasm.measure([ch], 48000).integratedLufs;
    const stereo = wasm.measure([ch, ch], 48000).integratedLufs;
    expect(stereo - mono).toBeCloseTo(3.01, 1);
  });

  it('lands the anchor at 44.1 kHz too', () => {
    const ch = sine(1000, dbfs(-23), 4, 44100);
    expect(wasm.measure([ch, ch], 44100).integratedLufs).toBeCloseTo(-23, 1);
  });

  it('returns -Infinity for digital silence', () => {
    expect(wasm.measure([new Float32Array(48000 * 2)], 48000).integratedLufs).toBe(-Infinity);
  });
});

describe('ebur128 wasm — true peak', () => {
  it('detects an inter-sample peak the raw samples miss (~0 dBTP)', () => {
    // 0 dBFS sine at fs/4, 45° phase: samples sit at ±0.707 (raw peak -3 dBFS)
    // but the true peak is ~0 dBTP. The reference oversampler should catch it.
    const ch = sine(12000, 1.0, 1, 48000, Math.PI / 4);
    let rawPeak = 0;
    for (const v of ch) rawPeak = Math.max(rawPeak, Math.abs(v));
    expect(20 * Math.log10(rawPeak)).toBeLessThan(-2.5);
    const tp = wasm.measure([ch], 48000).truePeakDbtp;
    expect(tp).toBeGreaterThan(-1);
    expect(tp).toBeLessThan(1);
  });

  it('reports ~ -23 dBTP for a -23 dBFS low-frequency sine', () => {
    const tp = wasm.measure([sine(997, dbfs(-23), 2, 48000)], 48000).truePeakDbtp;
    expect(tp).toBeGreaterThan(-23.2);
    expect(tp).toBeLessThan(-22.5);
  });

  it('returns -Infinity true peak for digital silence', () => {
    expect(wasm.measure([new Float32Array(4096)], 48000).truePeakDbtp).toBe(-Infinity);
  });
});
