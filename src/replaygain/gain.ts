/** ReplayGain target/ceiling and the clip-safe gain computation.
 *
 *  Pure module — no DOM, no Web Audio — so it is fully unit-tested. The
 *  measurement (LUFS + true peak) comes from the reference ebur128 wasm
 *  (measureWasm.ts); this turns those numbers into a single gain the player
 *  applies. */

/** Default reference loudness. -14 LUFS matches Spotify/YouTube; iTunes
 *  previews are hook excerpts and skew loud, so most corrections are negative
 *  (attenuation) and boosting is the exception. */
export const DEFAULT_TARGET_LUFS = -14;

/** True-peak ceiling in dBTP. Applied gain is capped so the post-gain true peak
 *  never exceeds this, leaving 1 dB of headroom below 0 dBFS for the
 *  inter-sample peaks that the playback DAC can reconstruct. */
export const TRUE_PEAK_CEILING_DBTP = -1;

/** Convert a gain in dB to the linear multiplier a GainNode wants. */
export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Clip-safe ReplayGain for one track, in dB.
 *
 * - `targetLufs - integratedLufs` is the loudness correction: positive boosts a
 *   quiet track up to target, negative pulls a loud track down.
 * - `ceilingDbtp - truePeakDbtp` is the most gain we can add before the loudest
 *   inter-sample peak would cross the ceiling.
 *
 * Taking the smaller of the two guarantees `truePeak + gain <= ceiling`, so
 * playback can never clip and no runtime limiter is needed. A quiet-but-peaky
 * track is therefore boosted only as far as its true peak allows.
 */
export function computeGainDb(
  integratedLufs: number,
  truePeakDbtp: number,
  targetLufs: number = DEFAULT_TARGET_LUFS,
  ceilingDbtp: number = TRUE_PEAK_CEILING_DBTP,
): number {
  // Silence / fully-gated: no meaningful loudness — leave the track untouched.
  if (!Number.isFinite(integratedLufs)) return 0;
  const desired = targetLufs - integratedLufs;
  // If true peak is unknown, refuse to boost (headroom 0) but still allow cuts.
  const peak = Number.isFinite(truePeakDbtp) ? truePeakDbtp : ceilingDbtp;
  const headroom = ceilingDbtp - peak;
  return Math.min(desired, headroom);
}
