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

  test('grid scrolls horizontally when columns do not fit', async ({ page }) => {
    const { scrollWidth, clientWidth } = await page.evaluate(() => {
      const grid = document.querySelector<HTMLElement>('.grid')!;
      return { scrollWidth: grid.scrollWidth, clientWidth: grid.clientWidth };
    });
    expect(scrollWidth).toBeGreaterThan(clientWidth);
  });

  test('selected tile at scroll edge keeps its accent border visible', async ({ page }) => {
    // Scroll the grid all the way left so the first visible tile sits flush
    // against the grid's left clip edge, then select it. With the grid's
    // inset padding, the selected border should still render inside the
    // grid's visible area (no left-edge clipping).
    const result = await page.evaluate(() => {
      const grid = document.querySelector<HTMLElement>('.grid')!;
      grid.scrollLeft = 0;
      const first = grid.querySelector<HTMLElement>('.tile')!;
      first.classList.add('selected');
      const gridBox = grid.getBoundingClientRect();
      const tileBox = first.getBoundingClientRect();
      return {
        gridLeft: gridBox.left,
        tileLeft: tileBox.left,
        marginToLeftEdge: tileBox.left - gridBox.left,
      };
    });
    // Selected tile scales by ~2%, so it grows ~1.3px on each side at 130px
    // wide. We just need any positive buffer, since 0 would mean it's flush
    // and would clip; require >= 2px for safety.
    expect(result.marginToLeftEdge).toBeGreaterThanOrEqual(2);
  });

  test('grid is horizontally centered on initial load', async ({ page }) => {
    const { scrollLeft, scrollWidth, clientWidth } = await page.evaluate(() => {
      const g = document.querySelector<HTMLElement>('.grid')!;
      return {
        scrollLeft: g.scrollLeft,
        scrollWidth: g.scrollWidth,
        clientWidth: g.clientWidth,
      };
    });
    const expectedCenter = (scrollWidth - clientWidth) / 2;
    expect(Math.abs(scrollLeft - expectedCenter)).toBeLessThanOrEqual(1);
  });

  test('day selector buttons are reachable (not clipped)', async ({ page }) => {
    const buttons = page.locator('[data-testid^="day-btn-"]');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    const viewport = page.viewportSize()!;
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    }
  });

  test('full gameplay flow works on mobile', async ({ page }) => {
    // Note: mobile uses .tap() instead of .click() for the select action,
    // so we can't reuse the shared selectIds() helper here.
    const themes = groupByTheme(await readTrackIds(page));
    for (const id of themes.get(0)!) {
      await page.getByTestId(`select-${id}`).tap();
    }
    await expect(page.getByTestId('submit-btn')).toHaveText('Submit (4/4)');
    await page.getByTestId('submit-btn').tap();
    await expect(page.getByTestId('solved-row-0')).toBeVisible();
  });
});
