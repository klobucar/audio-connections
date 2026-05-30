import { test, expect, devices } from '@playwright/test';
import { gotoDay, groupByTheme, readTrackIds } from './helpers/game';

// Pixel 5 (393×851) gives a representative narrow-mobile viewport while
// staying on the Chromium engine we already have installed.
test.use(devices['Pixel 5']);

test.describe('Mobile (Pixel 5) layout', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDay(page, 1);
  });

  test('page has no horizontal overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      return Math.max(html.scrollWidth, body.scrollWidth) - html.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('cassette deck and tile-actions fit inside every tile', async ({ page }) => {
    // Measure in-browser so the parent/child relationship is by DOM tree,
    // not by locator chaining (which proved order-dependent here).
    const overflows = await page.evaluate(() => {
      const out: { id: string; what: string; tileRight: number; childRight: number }[] = [];
      document.querySelectorAll<HTMLElement>('.tile').forEach((tile) => {
        const tb = tile.getBoundingClientRect();
        for (const sel of ['.cassette-deck', '.tile-actions']) {
          const child = tile.querySelector<HTMLElement>(sel);
          if (!child) continue;
          const cb = child.getBoundingClientRect();
          if (cb.left < tb.left - 0.5 || cb.right > tb.right + 0.5) {
            out.push({
              id: tile.dataset.trackId ?? '?',
              what: sel,
              tileRight: Math.round(tb.right),
              childRight: Math.round(cb.right),
            });
          }
        }
      });
      return out;
    });
    expect(overflows, JSON.stringify(overflows)).toEqual([]);
  });

  test('focused note input stays within its tile bounds', async ({ page }) => {
    // With the grid horizontally scrollable on mobile, "stays within viewport"
    // is the wrong test — instead the focused input must not expand outside
    // its parent tile (otherwise it would clip against the grid's overflow).
    const offenders = await page.evaluate(() => {
      const tiles = Array.from(document.querySelectorAll<HTMLElement>('.tile'));
      const out: { id: string; tileLeft: number; tileRight: number; inputLeft: number; inputRight: number }[] = [];
      for (const tile of tiles) {
        const input = tile.querySelector<HTMLInputElement>('.tile-label-input');
        if (!input) continue;
        input.focus();
        const tb = tile.getBoundingClientRect();
        const ib = input.getBoundingClientRect();
        if (ib.left < tb.left - 0.5 || ib.right > tb.right + 0.5) {
          out.push({
            id: tile.dataset.trackId ?? '?',
            tileLeft: Math.round(tb.left),
            tileRight: Math.round(tb.right),
            inputLeft: Math.round(ib.left),
            inputRight: Math.round(ib.right),
          });
        }
        input.blur();
      }
      return out;
    });
    expect(offenders, JSON.stringify(offenders)).toEqual([]);
  });

  // The responsive PoC (May 2026) replaced the 4-col-with-horizontal-scroll
  // mobile grid with a 2-col edge-to-edge grid below 1024px, so the prior
  // "scrolls horizontally" tests no longer apply. Their reframed
  // counterparts below assert the new behavior.

  test('grid fits within the viewport (no horizontal scroll)', async ({ page }) => {
    const { scrollWidth, clientWidth } = await page.evaluate(() => {
      const grid = document.querySelector<HTMLElement>('.grid')!;
      return { scrollWidth: grid.scrollWidth, clientWidth: grid.clientWidth };
    });
    // 1px tolerance — sub-pixel rounding sometimes gives scrollWidth a hair
    // more than clientWidth even when nothing actually overflows.
    expect(scrollWidth - clientWidth).toBeLessThanOrEqual(1);
  });

  test('selected tile keeps its accent border within the grid bounds', async ({ page }) => {
    const result = await page.evaluate(() => {
      const grid = document.querySelector<HTMLElement>('.grid')!;
      const first = grid.querySelector<HTMLElement>('.tile')!;
      first.classList.add('selected');
      const gb = grid.getBoundingClientRect();
      const tb = first.getBoundingClientRect();
      return { gridLeft: gb.left, tileLeft: tb.left };
    });
    // No horizontal scroll on mobile any more, so the first tile's left
    // edge should land at or after the grid's left edge.
    expect(result.tileLeft).toBeGreaterThanOrEqual(result.gridLeft);
  });

  test('grid uses 2 columns on a narrow phone', async ({ page }) => {
    const cols = await page.evaluate(() => {
      const grid = document.querySelector<HTMLElement>('.grid')!;
      return getComputedStyle(grid).gridTemplateColumns.split(/\s+/).length;
    });
    expect(cols).toBe(2);
  });

  test('day picker chips are reachable (not clipped)', async ({ page }) => {
    await page.getByTestId('day-selector-pill').click();
    await expect(page.getByTestId('day-picker')).toHaveClass(/open/);
    const chips = page.locator('[data-testid^="day-chip-"]');
    const count = await chips.count();
    expect(count).toBeGreaterThan(0);
    const viewport = page.viewportSize()!;
    for (let i = 0; i < count; i++) {
      const box = await chips.nth(i).boundingBox();
      // Some chips below the fold may not have a box; skip those.
      if (!box) continue;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    }
  });

  test('full gameplay flow works on mobile', async ({ page }) => {
    // Note: mobile uses .tap() instead of .click() for the select action,
    // so we can't reuse the shared selectIds() helper here.
    const themes = groupByTheme(await readTrackIds(page));
    for (const id of themes.get(0)!) {
      await page.getByTestId(`select-${id}`).tap();
    }
    await expect(page.getByTestId('submit-btn')).toContainText('SUBMIT 4/4');
    await page.getByTestId('submit-btn').tap();
    // SolvedList banners are hidden on mobile in favor of the SolvedBar
    // squircles — verify the new mobile chrome surface instead.
    await expect(page.getByTestId('solved-squircle-0')).toBeVisible();
  });

  test('terminal state swaps squircles for the MobileEndCards accordion', async ({ page }) => {
    const themes = groupByTheme(await readTrackIds(page));
    // Solve all four groups. Mid-game the squircles are the active surface.
    for (let t = 0; t < 4; t++) {
      for (const id of themes.get(t)!) {
        await page.getByTestId(`select-${id}`).tap();
      }
      await page.getByTestId('submit-btn').tap();
    }

    // Now terminal: squircles give way to the card accordion, with the
    // EndPanel j-card still below it.
    await expect(page.getByTestId('mobile-end')).toBeVisible();
    await expect(page.getByTestId('solved-squircle-0')).toHaveCount(0);
    await expect(page.getByTestId('end-panel')).toBeVisible();

    // The first-solved group's card is open by default; its first track plays.
    // Scope to the card — the hidden desktop SolvedList also carries play
    // buttons with the same test ids.
    const firstCard = page.getByTestId('mobile-end-card-0');
    const firstHead = page.getByTestId('mobile-end-card-head-0');
    await expect(firstHead).toHaveAttribute('aria-expanded', 'true');
    const play = firstCard.getByTestId('solved-play-0');
    await expect(play).toHaveAttribute('aria-pressed', 'false');
    await play.tap();
    await expect(play).toHaveAttribute('aria-pressed', 'true');

    // A collapsed card expands on tap (and the previously-open one stays a
    // sibling — accordion keeps exactly one open).
    const secondHead = page.getByTestId('mobile-end-card-head-1');
    await expect(secondHead).toHaveAttribute('aria-expanded', 'false');
    await secondHead.tap();
    await expect(secondHead).toHaveAttribute('aria-expanded', 'true');
    await expect(firstHead).toHaveAttribute('aria-expanded', 'false');
  });
});
