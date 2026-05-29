import { useEffect } from 'react';

/** Below this many pixels of bottom occlusion we treat the gap as URL-bar
 *  jitter (already absorbed by `dvh`), not the on-screen keyboard. A soft
 *  keyboard is ~250px+, well clear of this floor. */
export const KEYBOARD_THRESHOLD_PX = 80;

/** Bottom inset (px) hidden by the on-screen keyboard, derived from the gap
 *  between the layout viewport and the visual viewport.
 *
 *  On iOS Safari the layout viewport (and `100dvh`) stay full-height when the
 *  keyboard opens — only the visual viewport shrinks — so a `sticky bottom:0`
 *  bar ends up behind the keyboard. This gap recovers the occluded height so
 *  the shell can shrink to match. On browsers that resize the layout viewport
 *  (Chrome Android with `interactive-widget=resizes-content`) the two move
 *  together and this stays ~0, avoiding any double-correction. */
export function computeKeyboardInset(
  layoutHeight: number,
  visual: { height: number; offsetTop: number },
  threshold: number = KEYBOARD_THRESHOLD_PX,
): number {
  const occluded = layoutHeight - visual.height - visual.offsetTop;
  return occluded > threshold ? Math.round(occluded) : 0;
}

/** Publishes the keyboard inset as the `--keyboard-inset` CSS custom property
 *  on the document root, kept in sync with `visualViewport`. The mobile shell
 *  subtracts it from its `100dvh` height so the pinned bottom chrome stays
 *  above the keyboard. No-ops where `visualViewport` is unavailable, and on
 *  desktop the inset never crosses the threshold, so the var stays `0px`. */
export function useKeyboardInset(): void {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const update = () => {
      const inset = computeKeyboardInset(window.innerHeight, vv);
      root.style.setProperty('--keyboard-inset', `${inset}px`);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      root.style.removeProperty('--keyboard-inset');
    };
  }, []);
}
