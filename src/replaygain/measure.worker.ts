/** Dedicated module worker: runs the reference ebur128 wasm off the main thread.
 *
 *  Loads ebur128.wasm once (lazily) and measures transferred PCM with it. If the
 *  wasm can't be fetched/instantiated, it posts a null result and the track
 *  stays at unity gain. Vite bundles this when the controller does
 *  `new Worker(new URL('./measure.worker.ts', import.meta.url), { type: 'module' })`. */

import type { MeasureRequest, MeasureResponse } from './measure';
import { WasmLoudness } from './measureWasm';

// Typed view of the worker global that does not require the "webworker" TS lib
// (which would clash with the DOM lib used everywhere else in the project).
const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<MeasureRequest>) => void) | null;
  postMessage(message: MeasureResponse): void;
};

let wasmPromise: Promise<WasmLoudness | null> | null = null;
function getWasm(): Promise<WasmLoudness | null> {
  if (!wasmPromise) {
    wasmPromise = WasmLoudness.fromResponse(
      fetch(new URL('./ebur128.wasm', import.meta.url)),
    ).catch(() => null);
  }
  return wasmPromise;
}

ctx.onmessage = (e: MessageEvent<MeasureRequest>) => {
  const { id, sampleRate, channels } = e.data;
  void getWasm()
    .then((wasm) => (wasm ? wasm.measure(channels, sampleRate) : null))
    .catch(() => null)
    .then((result) => {
      ctx.postMessage({ id, result });
    });
};
