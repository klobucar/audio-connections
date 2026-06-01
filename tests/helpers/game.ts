// Shared Playwright helpers for game.spec.ts and mobile.spec.ts.
//
// These had drifted between the two specs: game.spec.ts defined them at the
// top, mobile.spec.ts re-implemented the same logic inline. Keep one copy
// here so the "select 4 tiles of theme N" pattern stays in sync.
import { expect, type Page } from '@playwright/test';

export const APP_URL = '/?mock=1';

/** Map themeIdx → array of loaded track ids in the grid.
 *  Each loaded track's stable `id` is its position (0–15) in the unshuffled
 *  theme×track list, so `themeIdx = floor(id / 4)`. */
export function groupByTheme(ids: number[]): Map<number, number[]> {
  const out = new Map<number, number[]>();
  for (const id of ids) {
    const t = Math.floor(id / 4);
    const arr = out.get(t) ?? [];
    arr.push(id);
    out.set(t, arr);
  }
  return out;
}

export async function readTrackIds(page: Page): Promise<number[]> {
  return await page.$$eval('.tile[data-track-id]', (els) =>
    els.map((el) => Number((el as HTMLElement).dataset.trackId)),
  );
}

export async function selectIds(page: Page, ids: number[]): Promise<void> {
  for (const id of ids) {
    await page.getByTestId(`select-${id}`).click();
  }
}

/** Switch to a specific day so tests are independent of the host clock. */
export async function gotoDay(page: Page, day: number): Promise<void> {
  await page.goto(APP_URL);
  await openPicker(page);
  await page.getByTestId(`day-chip-${day}`).click();
  await expect(page.getByTestId('puzzle-heading')).toHaveText(`Audio Connections ${day}`);
  await expect(page.getByTestId('grid')).toBeVisible();
  await expect(page.locator('.tile')).toHaveCount(16);
}

/** Konami code (↑↑↓↓←→←→BA) — unlocks every day, including future ones. */
const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

/** Switch to a day that isn't released yet: Konami-unlock first so its chip is
 *  selectable, then navigate. Use for testing behaviour on future days. */
export async function gotoDayUnlocked(page: Page, day: number): Promise<void> {
  await page.goto(APP_URL);
  await expect(page.getByTestId('grid')).toBeVisible();
  for (const key of KONAMI) await page.keyboard.press(key);
  await expect(page.getByTestId('status')).toContainText(/Konami/);
  await openPicker(page);
  // The unlock re-renders the picker to reveal the previously-hidden future
  // chip; wait for it to settle before clicking so the click can't race the
  // re-render (a load-sensitive flake under parallel runs).
  const chip = page.getByTestId(`day-chip-${day}`);
  await expect(chip).toBeVisible();
  await expect(chip).toBeEnabled();
  await chip.click();
  await expect(page.getByTestId('puzzle-heading')).toHaveText(`Audio Connections ${day}`);
  await expect(page.getByTestId('grid')).toBeVisible();
  await expect(page.locator('.tile')).toHaveCount(16);
}

/** Open the day picker popover and wait for it to be interactable. */
export async function openPicker(page: Page): Promise<void> {
  await page.getByTestId('day-selector-pill').click();
  await expect(page.getByTestId('day-picker')).toHaveClass(/open/);
}
