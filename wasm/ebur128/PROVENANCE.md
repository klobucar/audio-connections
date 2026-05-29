# Vendored ebur128 wasm — provenance

`src/replaygain/ebur128.wasm` is built from this crate, a thin flat-C-ABI
wrapper around the reference [`ebur128`](https://crates.io/crates/ebur128) crate
— a Rust port of the C `libebur128` that FFmpeg's `ebur128` filter and `loudgain`
use. We measure **integrated LUFS (ITU-R BS.1770 / EBU R128)** and **true peak**
with it; correctness is the crate's, not ours.

## Why vendored (not the `ebur128-wasm` npm package)

That npm package is stale and was adversarially refuted during design (≈3 years
old, BS.1770-4 not -5, dead README). Building the maintained Rust crate ourselves
to `wasm32-unknown-unknown` gives a current, audited implementation with no
wasm-bindgen/wasm-pack glue — the artifact is a plain module the JS loader
(`src/replaygain/measureWasm.ts`) instantiates directly.

## Build

```
npm run wasm:build   # → src/replaygain/ebur128.wasm
```

`npm run wasm:build` runs `wasm/build.sh`, which `cargo build`s inside this
crate so rustup picks up `rust-toolchain.toml` (pinned channel +
`wasm32-unknown-unknown` target, auto-installed on first build), then copies
`ac_ebur128.wasm` to `src/replaygain/ebur128.wasm`. The toolchain pin is what
makes the rebuild deterministic.

The committed `.wasm` means normal local dev, `vite build`, and the test job
need no Rust toolchain — only regenerating it does. **The Pages deploy workflow
rebuilds it from this source** (`.github/workflows/deploy.yml`, build job) so
the deployed artifact is provably built from the audited Rust, not a trusted
committed binary; it warns (not fails) if the committed copy has drifted from a
fresh build. Flip that `echo "::warning::…"` to `exit 1` to make drift a hard
deploy failure instead.

## Pinned versions (last built 2026-05-29)

| Component | Version |
|---|---|
| `ebur128` (reference crate) | 0.1.10 (see `Cargo.lock`) |
| wrapper `ac-ebur128` | 0.0.0 (this crate) |
| rustc / cargo | 1.94.1 |
| target | wasm32-unknown-unknown |
| artifact size | ~64 KB (opt-level z, LTO, stripped) |

`Cargo.lock` is committed for reproducibility. `wasm-opt` is **not** used (the
artifact is already small and dependency-free); it could shave a few KB if ever
wanted.

## ABI (see `src/lib.rs`)

`reserve(frames)` sizes two planar f32 buffers · `left_ptr()/right_ptr()` expose
their bases (read *after* reserve) · `measure(len, rate, channels)` returns
integrated LUFS and stashes true peak · `last_true_peak()` returns it (dBTP).
JS writes Float32 PCM into the buffers via memory views, then calls `measure`.

## Verification

`src/replaygain/measureWasm.test.ts` instantiates the shipping `.wasm` in Node
and checks it against the EBU −23 LUFS anchor and known true-peak cases
(inter-sample, broadband). During development it was also compared against the
**natively-compiled** crate (same source, `cargo build` for the host) and matched
to ±0.005 LU / exact dBTP — that's the byte-for-byte equivalence committing the
wasm relies on.
