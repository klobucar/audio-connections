/** Decode a prefetched preview blob to PCM channels on the main thread.
 *
 *  Workers can't decode compressed audio (no OfflineAudioContext in worker
 *  scope across browsers), so decoding happens here; the resulting Float32
 *  channels are then transferred to measure.worker.ts. decodeAudioData resamples
 *  to the decoding context's sample rate, so we read `audio.sampleRate` off the
 *  result and the measurement derives its K-weighting coefficients from that —
 *  we never assume 44.1 kHz.
 *
 *  Returns null whenever decoding isn't possible (no Web Audio, fetch/decode
 *  failure); the caller then leaves the track at unity gain. */

export interface DecodedPcm {
  /** 1 or 2 channels (downmix beyond stereo is unnecessary for measurement). */
  channels: Float32Array[];
  sampleRate: number;
}

type OfflineCtor = new (channels: number, length: number, sampleRate: number) => OfflineAudioContext;

let decoder: OfflineAudioContext | null = null;
let decoderUnavailable = false;

function getDecoder(): OfflineAudioContext | null {
  if (decoder) return decoder;
  if (decoderUnavailable) return null;
  const g = globalThis as unknown as {
    OfflineAudioContext?: OfflineCtor;
    webkitOfflineAudioContext?: OfflineCtor;
  };
  const Ctor = g.OfflineAudioContext ?? g.webkitOfflineAudioContext;
  if (!Ctor) {
    decoderUnavailable = true;
    return null;
  }
  // A 1-frame context is only ever used as a decoder; decodeAudioData resamples
  // its output to this context's rate. 48 kHz is deliberate, NOT a default to
  // "fix" to native: Apple previews decode at 88.2/96 kHz, and profiling showed
  // measuring at native rate is ~2x slower (twice the samples through the
  // BS.1770 loop) for no accuracy gain — 48 kHz is comfortably above the band
  // that K-weighting + true-peak care about. Downsampling here is the fast path.
  decoder = new Ctor(1, 1, 48000);
  return decoder;
}

/** True when this environment can decode audio (browser with Web Audio). */
export function canDecode(): boolean {
  return getDecoder() !== null;
}

export async function decodeToChannels(blobUrl: string): Promise<DecodedPcm | null> {
  const ctx = getDecoder();
  if (!ctx) return null;
  try {
    const res = await fetch(blobUrl);
    if (!res.ok) return null;
    const bytes = await res.arrayBuffer(); // fresh buffer; decodeAudioData detaches it
    const audio = await ctx.decodeAudioData(bytes);
    const numCh = Math.min(audio.numberOfChannels, 2);
    const channels: Float32Array[] = [];
    for (let c = 0; c < numCh; c++) {
      // Copy out of the AudioBuffer so the array owns a transferable buffer.
      channels.push(audio.getChannelData(c).slice());
    }
    if (channels.length === 0) return null;
    return { channels, sampleRate: audio.sampleRate };
  } catch {
    return null;
  }
}
