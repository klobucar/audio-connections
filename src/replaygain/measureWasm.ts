/** Loader for the vendored reference ebur128 wasm (src/replaygain/ebur128.wasm,
 *  built from wasm/ebur128 — see PROVENANCE.md).
 *
 *  The caller supplies the wasm source (Node: readFile → fromBytes; worker /
 *  main thread: fetch(new URL('./ebur128.wasm', import.meta.url)) → fromResponse)
 *  so this module stays environment-agnostic. The module has no imports.
 *  Marshalling is manual: reserve() sizes the planar f32 buffers, then PCM is
 *  copied into wasm memory via typed-array views before measure() is called. */

import type { LoudnessResult } from './measure';

interface Ebur128Exports {
  memory: WebAssembly.Memory;
  reserve(frames: number): void;
  left_ptr(): number;
  right_ptr(): number;
  measure(len: number, rate: number, channels: number): number;
  last_true_peak(): number;
}

const SILENCE: LoudnessResult = { integratedLufs: -Infinity, truePeakDbtp: -Infinity };

export class WasmLoudness {
  private constructor(private readonly ex: Ebur128Exports) {}

  /** Instantiate from raw bytes (Node / preloaded). */
  static async fromBytes(bytes: BufferSource): Promise<WasmLoudness> {
    const { instance } = await WebAssembly.instantiate(bytes, {});
    return new WasmLoudness(instance.exports as unknown as Ebur128Exports);
  }

  /** Instantiate by streaming a fetch Response (browser / worker). */
  static async fromResponse(source: Response | PromiseLike<Response>): Promise<WasmLoudness> {
    const { instance } = await WebAssembly.instantiateStreaming(source, {});
    return new WasmLoudness(instance.exports as unknown as Ebur128Exports);
  }

  measure(channels: Float32Array[], sampleRate: number): LoudnessResult {
    const ex = this.ex;
    const numCh = Math.min(channels.length, 2);
    if (numCh === 0) return SILENCE;
    const len = channels[0]!.length;
    if (len === 0) return SILENCE;

    // reserve() may reallocate (and grow wasm memory), so read pointers and the
    // backing buffer AFTER it. measure() allocates internally but never moves
    // the planar buffers, so the writes below stay valid through the call.
    ex.reserve(len);
    const buf = ex.memory.buffer;
    new Float32Array(buf, ex.left_ptr(), len).set(channels[0]!);
    if (numCh === 2) {
      new Float32Array(buf, ex.right_ptr(), len).set(channels[1]!);
    }
    const integratedLufs = ex.measure(len, sampleRate, numCh);
    return { integratedLufs, truePeakDbtp: ex.last_true_peak() };
  }
}
