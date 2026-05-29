//! Flat C-ABI wasm wrapper around the reference `ebur128` crate (a Rust port of
//! the C libebur128 used by FFmpeg/loudgain). Compiled to
//! `wasm32-unknown-unknown` and vendored as `src/replaygain/ebur128.wasm`; the
//! JS loader is `src/replaygain/measureWasm.ts`. See PROVENANCE.md.
//!
//! ABI (all numeric, no managed objects cross the boundary):
//!   reserve(frames)        – size the two planar channel buffers (zero-filled)
//!   left_ptr() -> *f32     – base of the left/mono buffer (read AFTER reserve)
//!   right_ptr() -> *f32    – base of the right buffer
//!   measure(len, rate, ch) -> f64   – integrated LUFS; stashes true peak
//!   last_true_peak() -> f64         – max true peak across channels, dBTP
//!
//! JS writes Float32 PCM into the buffers via memory views, then calls measure.
//! Single-threaded wasm, so the thread_local scratch is effectively global.

use core::cell::RefCell;
use ebur128::{EbuR128, Mode};

thread_local! {
    static LEFT: RefCell<Vec<f32>> = RefCell::new(Vec::new());
    static RIGHT: RefCell<Vec<f32>> = RefCell::new(Vec::new());
    static TRUE_PEAK: RefCell<f64> = const { RefCell::new(f64::NEG_INFINITY) };
}

/// Size both planar channel buffers to `frames` (zero-filled). Call before
/// reading the pointers — a resize may reallocate, moving the base address.
#[no_mangle]
pub extern "C" fn reserve(frames: usize) {
    LEFT.with(|b| {
        let mut v = b.borrow_mut();
        v.clear();
        v.resize(frames, 0.0);
    });
    RIGHT.with(|b| {
        let mut v = b.borrow_mut();
        v.clear();
        v.resize(frames, 0.0);
    });
}

#[no_mangle]
pub extern "C" fn left_ptr() -> *mut f32 {
    LEFT.with(|b| b.borrow_mut().as_mut_ptr())
}

#[no_mangle]
pub extern "C" fn right_ptr() -> *mut f32 {
    RIGHT.with(|b| b.borrow_mut().as_mut_ptr())
}

#[no_mangle]
pub extern "C" fn last_true_peak() -> f64 {
    TRUE_PEAK.with(|b| *b.borrow())
}

/// Measure `len` frames of `channels` (1 or 2) at `rate` Hz. Returns integrated
/// LUFS (-inf for silence/failure); stores the max true peak across channels in
/// dBTP for `last_true_peak()`.
#[no_mangle]
pub extern "C" fn measure(len: usize, rate: u32, channels: u32) -> f64 {
    let fail = || {
        TRUE_PEAK.with(|b| *b.borrow_mut() = f64::NEG_INFINITY);
        f64::NEG_INFINITY
    };
    if len == 0 || channels == 0 {
        return fail();
    }
    let ch = if channels >= 2 { 2u32 } else { 1u32 };
    let mut meter = match EbuR128::new(ch, rate, Mode::I | Mode::TRUE_PEAK) {
        Ok(m) => m,
        Err(_) => return fail(),
    };

    let ok = LEFT.with(|l| {
        let l = l.borrow();
        if ch == 2 {
            RIGHT.with(|r| {
                let r = r.borrow();
                meter.add_frames_planar_f32(&[&l[..len], &r[..len]]).is_ok()
            })
        } else {
            meter.add_frames_planar_f32(&[&l[..len]]).is_ok()
        }
    });
    if !ok {
        return fail();
    }

    let mut tp = 0.0f64;
    for c in 0..ch {
        if let Ok(v) = meter.true_peak(c) {
            if v > tp {
                tp = v;
            }
        }
    }
    TRUE_PEAK.with(|b| {
        *b.borrow_mut() = if tp > 0.0 {
            20.0 * tp.log10()
        } else {
            f64::NEG_INFINITY
        }
    });

    meter.loudness_global().unwrap_or(f64::NEG_INFINITY)
}
