/** Shared types + protocol for loudness measurement.
 *
 *  The one measurement engine is the vendored reference ebur128 wasm
 *  (src/replaygain/ebur128.wasm, see wasm/ebur128/PROVENANCE.md), loaded via
 *  measureWasm.ts and run in measure.worker.ts. There is deliberately no
 *  pure-JS fallback: WebAssembly support is a superset of the Web Audio +
 *  module-worker support this feature already requires, so any browser that can
 *  decode and measure can run the wasm. If instantiation ever fails, the track
 *  simply stays at unity gain (the same path decode-failure and mock mode use). */

export interface LoudnessResult {
  /** Integrated loudness in LUFS; -Infinity for silence / fully-gated input. */
  integratedLufs: number;
  /** True peak in dBTP; -Infinity for digital silence. */
  truePeakDbtp: number;
}

/** Bumping this invalidates every cached measurement (see cache.ts). Bump when
 *  the measurement engine changes in a way that shifts results.
 *  v2: switched from the hand-written BS.1770 to the reference ebur128 wasm
 *  (true peak differs by up to ~0.7 dB on broadband content). */
export const ALGO_VERSION = 2;

export interface MeasureRequest {
  /** Correlates a response with its request. */
  id: number;
  sampleRate: number;
  /** 1 (mono) or 2 (stereo) channels of PCM; buffers are transferred. */
  channels: Float32Array[];
}

export interface MeasureResponse {
  id: number;
  /** null when the wasm couldn't measure — the track stays at unity gain. */
  result: LoudnessResult | null;
}
