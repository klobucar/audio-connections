import { test, expect, Page } from '@playwright/test';
import { puzzles } from '../src/puzzles';

const APP_URL = '/?mock=1';

test('puzzles expose author metadata for every day', () => {
  for (const puzzle of puzzles) {
    expect(puzzle.author).toBe('robchahin');
  }
});

/** Switch to a specific day so tests are independent of the host clock. */
async function gotoDay(page: Page, day: number) {
  await page.goto(APP_URL);
  await page.getByTestId(`day-btn-${day}`).click();
  await expect(page.getByTestId('puzzle-heading')).toHaveText(`Audio Connections ${day}`);
  await expect(page.getByTestId('grid')).toBeVisible();
  await expect(page.locator('.tile')).toHaveCount(16);
}

/**
 * Map themeIdx → array of loaded track ids in the grid.
 * Each loaded track's stable `id` is its position (0–15) in the unshuffled
 * theme×track list, so `themeIdx = floor(id / 4)`.
 */
function groupByTheme(ids: number[]): Map<number, number[]> {
  const out = new Map<number, number[]>();
  for (const id of ids) {
    const t = Math.floor(id / 4);
    const arr = out.get(t) ?? [];
    arr.push(id);
    out.set(t, arr);
  }
  return out;
}

async function readTrackIds(page: Page): Promise<number[]> {
  return await page.$$eval('.tile[data-track-id]', (els) =>
    els.map((el) => Number((el as HTMLElement).dataset.trackId)),
  );
}

async function selectIds(page: Page, ids: number[]) {
  for (const id of ids) {
    await page.getByTestId(`select-${id}`).click();
  }
}

test.describe('Audio Connections — Day 1 gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDay(page, 1);
  });

  test('renders heading, date, and 16 tiles', async ({ page }) => {
    await expect(page.getByTestId('puzzle-heading')).toHaveText('Audio Connections 1');
    await expect(page.getByTestId('puzzle-date')).not.toBeEmpty();
    await expect(page.locator('.tile')).toHaveCount(16);
  });

  test('submit button is disabled until 4 are selected; Deselect clears', async ({ page }) => {
    const submit = page.getByTestId('submit-btn');
    await expect(submit).toBeDisabled();
    await expect(submit).toHaveText('Submit (0/4)');

    const ids = await readTrackIds(page);
    const themes = groupByTheme(ids);
    const firstTheme = themes.get(0)!;
    await selectIds(page, [firstTheme[0]!]);
    await expect(submit).toHaveText('Submit (1/4)');
    await expect(submit).toBeDisabled();

    await selectIds(page, firstTheme.slice(1));
    await expect(submit).toHaveText('Submit (4/4)');
    await expect(submit).toBeEnabled();

    await page.getByTestId('deselect-btn').click();
    await expect(submit).toHaveText('Submit (0/4)');
    await expect(submit).toBeDisabled();
  });

  test('submitting a correct group shows the solved banner and removes tiles', async ({ page }) => {
    const themes = groupByTheme(await readTrackIds(page));
    await selectIds(page, themes.get(0)!);
    await page.getByTestId('submit-btn').click();

    await expect(page.getByTestId('solved-row-0')).toBeVisible();
    await expect(page.getByTestId('solved-row-0')).toContainText(puzzles[0]!.themes[0]!.theme);
    await expect(page.locator('.tile')).toHaveCount(12, { timeout: 4000 });
  });

  test('correct guess pauses the currently-playing preview', async ({ page }) => {
    const themes = groupByTheme(await readTrackIds(page));
    const correctIds = themes.get(0)!;
    // Start playing one of the about-to-be-correct tiles.
    const playingId = correctIds[0]!;
    await page.getByTestId(`play-${playingId}`).click();
    await expect(page.locator(`[data-testid="tile-${playingId}"]`)).toHaveClass(/playing/);

    await selectIds(page, correctIds);
    await page.getByTestId('submit-btn').click();

    // After submit, no tile should still be in the playing state.
    await expect(page.locator('.tile.playing')).toHaveCount(0);
    await expect(page.locator('.play-btn.playing')).toHaveCount(0);
  });

  test('correct guess pulses tiles in theme color before the banner appears', async ({ page }) => {
    const themes = groupByTheme(await readTrackIds(page));
    const correctIds = themes.get(0)!;
    await selectIds(page, correctIds);
    await page.getByTestId('submit-btn').click();

    // During the pulse window, the four tiles carry `matched` and
    // `matched-theme-0` classes and the banner is not yet visible.
    const pulsedTiles = page.locator('.tile.matched-theme-0');
    await expect(pulsedTiles).toHaveCount(4);
    for (const id of correctIds) {
      await expect(page.locator(`[data-testid="tile-${id}"]`)).toHaveClass(/matched/);
    }
    // After the pulse, the banner appears and the matched class is gone.
    await expect(page.getByTestId('solved-row-0')).toBeVisible();
    await expect(page.locator('.tile.matched')).toHaveCount(0);
  });

  test('an incorrect group costs a mistake and shows status', async ({ page }) => {
    const themes = groupByTheme(await readTrackIds(page));
    const mixed = [themes.get(0)![0]!, themes.get(1)![0]!, themes.get(2)![0]!, themes.get(3)![0]!];
    await selectIds(page, mixed);
    await page.getByTestId('submit-btn').click();
    await expect(page.getByTestId('status')).toContainText(/Not a group|One away/);
    await expect(page.locator('.mistake-dot.used')).toHaveCount(1);
  });

  test('"one away" message when 3 of 4 share a theme', async ({ page }) => {
    const themes = groupByTheme(await readTrackIds(page));
    const oneAway = [
      themes.get(0)![0]!,
      themes.get(0)![1]!,
      themes.get(0)![2]!,
      themes.get(1)![0]!,
    ];
    await selectIds(page, oneAway);
    await page.getByTestId('submit-btn').click();
    await expect(page.getByTestId('status')).toContainText('One away');
  });

  test('solving all four themes shows the end panel with share text', async ({ page }) => {
    const themes = groupByTheme(await readTrackIds(page));
    for (let t = 0; t < 4; t++) {
      await selectIds(page, themes.get(t)!);
      await page.getByTestId('submit-btn').click();
      await expect(page.getByTestId(`solved-row-${t}`)).toBeVisible();
    }
    await expect(page.getByTestId('end-panel')).toBeVisible();
    await expect(page.getByTestId('end-panel')).toContainText('Solved!');
    await expect(page.getByTestId('share-text')).toContainText('Audio Connections 1');
    const share = await page.getByTestId('share-text').textContent();
    expect(share!.split('\n').length).toBe(5);
  });

  test('four wrong guesses ends the game with "Game over"', async ({ page }) => {
    const themes = groupByTheme(await readTrackIds(page));
    const wrongSets = [
      [themes.get(0)![0]!, themes.get(1)![0]!, themes.get(2)![0]!, themes.get(3)![0]!],
      [themes.get(0)![1]!, themes.get(1)![1]!, themes.get(2)![1]!, themes.get(3)![1]!],
      [themes.get(0)![2]!, themes.get(1)![2]!, themes.get(2)![2]!, themes.get(3)![2]!],
      [themes.get(0)![3]!, themes.get(1)![3]!, themes.get(2)![3]!, themes.get(3)![3]!],
    ];
    for (let i = 0; i < wrongSets.length; i++) {
      if (i > 0) await page.getByTestId('deselect-btn').click();
      await selectIds(page, wrongSets[i]!);
      await page.getByTestId('submit-btn').click();
    }
    await expect(page.getByTestId('end-panel')).toBeVisible();
    await expect(page.getByTestId('end-panel')).toContainText('Game over');
    await expect(page.locator('.mistake-dot.used')).toHaveCount(4);
  });

  test('tile note input persists value while typing', async ({ page }) => {
    const themes = groupByTheme(await readTrackIds(page));
    const id = themes.get(0)![0]!;
    const input = page.locator(`[data-testid="tile-${id}"] .tile-label-input`);
    await input.fill('mine');
    await input.press('Enter');
    await expect(input).toHaveValue('mine');
  });
});

test.describe('Audio Connections — day switching', () => {
  test('Day 1, 2, 3 are all reachable when releaseAt has passed for them', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByTestId('day-btn-1').click();
    await expect(page.getByTestId('puzzle-heading')).toHaveText('Audio Connections 1');
    await expect(page.locator('.tile')).toHaveCount(16);

    await page.getByTestId('day-btn-2').click();
    await expect(page.getByTestId('puzzle-heading')).toHaveText('Audio Connections 2');
    await expect(page.locator('.tile')).toHaveCount(16);
  });

  test('switching off a just-won day does not mark the new day done', async ({ page }) => {
    await gotoDay(page, 1);
    const themes = groupByTheme(await readTrackIds(page));
    for (let t = 0; t < 4; t++) {
      await selectIds(page, themes.get(t)!);
      await page.getByTestId('submit-btn').click();
      await expect(page.getByTestId(`solved-row-${t}`)).toBeVisible();
    }
    await expect(page.getByTestId('end-panel')).toContainText('Solved!');
    await expect(page.getByTestId('day-btn-1')).toHaveClass(/done/);

    await page.getByTestId('day-btn-2').click();
    // Wait for the new day's tiles to actually load before asserting, so the
    // check runs against the post-load state, not the brief stale window.
    await expect(page.getByTestId('puzzle-heading')).toHaveText('Audio Connections 2');
    await expect(page.locator('.tile')).toHaveCount(16);

    await expect(page.getByTestId('day-btn-2')).not.toHaveClass(/done/);
    await expect(page.getByTestId('day-btn-2')).not.toContainText('✓');
    // Day 1 still done.
    await expect(page.getByTestId('day-btn-1')).toHaveClass(/done/);
  });

  test('winning a day marks its button done (green ✓), survives reload', async ({ page }) => {
    await gotoDay(page, 1);
    const themes = groupByTheme(await readTrackIds(page));
    for (let t = 0; t < 4; t++) {
      await selectIds(page, themes.get(t)!);
      await page.getByTestId('submit-btn').click();
      await expect(page.getByTestId(`solved-row-${t}`)).toBeVisible();
    }
    await expect(page.getByTestId('end-panel')).toContainText('Solved!');
    const dayBtn = page.getByTestId('day-btn-1');
    await expect(dayBtn).toHaveClass(/done/);
    await expect(dayBtn).toContainText('✓');

    // Reload: the green check persists thanks to localStorage seeding.
    await page.reload();
    await expect(page.getByTestId('day-btn-1')).toHaveClass(/done/);
    await expect(page.getByTestId('day-btn-1')).toContainText('✓');

    // Other days remain un-done.
    await expect(page.getByTestId('day-btn-2')).not.toHaveClass(/done/);
  });

  test('losing a day does NOT mark it done', async ({ page }) => {
    await gotoDay(page, 1);
    const themes = groupByTheme(await readTrackIds(page));
    const wrongSets = [
      [themes.get(0)![0]!, themes.get(1)![0]!, themes.get(2)![0]!, themes.get(3)![0]!],
      [themes.get(0)![1]!, themes.get(1)![1]!, themes.get(2)![1]!, themes.get(3)![1]!],
      [themes.get(0)![2]!, themes.get(1)![2]!, themes.get(2)![2]!, themes.get(3)![2]!],
      [themes.get(0)![3]!, themes.get(1)![3]!, themes.get(2)![3]!, themes.get(3)![3]!],
    ];
    for (let i = 0; i < wrongSets.length; i++) {
      if (i > 0) await page.getByTestId('deselect-btn').click();
      await selectIds(page, wrongSets[i]!);
      await page.getByTestId('submit-btn').click();
    }
    await expect(page.getByTestId('end-panel')).toContainText('Game over');
    await expect(page.getByTestId('day-btn-1')).not.toHaveClass(/done/);
  });

  test('losing one day does not leak fail state into the next day', async ({ page }) => {
    // Reproduces the "switched to Day 2 and it was in the fail state" bug:
    // the save effect used to fire on puzzle.day change with the outgoing
    // day's gameplay state, writing it under the incoming day's key, and the
    // load effect's setEqual check (positions 0..15) happily accepted it.
    await gotoDay(page, 1);
    const themes = groupByTheme(await readTrackIds(page));
    const wrongSets = [
      [themes.get(0)![0]!, themes.get(1)![0]!, themes.get(2)![0]!, themes.get(3)![0]!],
      [themes.get(0)![1]!, themes.get(1)![1]!, themes.get(2)![1]!, themes.get(3)![1]!],
      [themes.get(0)![2]!, themes.get(1)![2]!, themes.get(2)![2]!, themes.get(3)![2]!],
      [themes.get(0)![3]!, themes.get(1)![3]!, themes.get(2)![3]!, themes.get(3)![3]!],
    ];
    for (let i = 0; i < wrongSets.length; i++) {
      if (i > 0) await page.getByTestId('deselect-btn').click();
      await selectIds(page, wrongSets[i]!);
      await page.getByTestId('submit-btn').click();
    }
    await expect(page.getByTestId('end-panel')).toBeVisible();
    await expect(page.getByTestId('end-panel')).toContainText('Game over');

    await page.getByTestId('day-btn-2').click();
    await expect(page.getByTestId('puzzle-heading')).toHaveText('Audio Connections 2');
    await expect(page.locator('.tile')).toHaveCount(16);
    await expect(page.getByTestId('end-panel')).toHaveCount(0);
    await expect(page.locator('.mistake-dot.used')).toHaveCount(0);
    await expect(page.getByTestId('submit-btn')).toHaveText('Submit (0/4)');
  });
});

test.describe('Audio Connections — Konami unlock', () => {
  const KONAMI = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a',
  ];

  async function typeKonami(page: Page) {
    for (const key of KONAMI) {
      await page.keyboard.press(key);
    }
  }

  test('the code unlocks every Day button', async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByTestId('grid')).toBeVisible();
    await typeKonami(page);
    await expect(page.getByTestId('status')).toContainText(/Konami/);
    for (const p of puzzles) {
      await expect(page.getByTestId(`day-btn-${p.day}`)).toBeEnabled();
    }
  });

  test('keys typed inside a note input do not trigger the unlock', async ({ page }) => {
    await gotoDay(page, 1);
    const id = (await readTrackIds(page))[0]!;
    const input = page.locator(`[data-testid="tile-${id}"] .tile-label-input`);
    await input.focus();
    // Type a sequence that contains the trigger letters, but inside an input.
    await input.type('ba');
    // Move focus away then send the rest of the konami sequence on its own —
    // it should not complete because progress starts from 0.
    await input.blur();
    await page.keyboard.press('b');
    await page.keyboard.press('a');
    // Status should not contain "Konami" — it might still hold a load message
    // or be empty, but not the unlock string.
    await expect(page.getByTestId('status')).not.toContainText(/Konami/);
  });
});

test.describe('Audio Connections — persistence & reset', () => {
  test('selections, notes, and current day survive a reload', async ({ page }) => {
    await gotoDay(page, 1);
    const themes = groupByTheme(await readTrackIds(page));
    const firstTwo = themes.get(0)!.slice(0, 2);
    await selectIds(page, firstTwo);

    // Add a note to one of the selected tiles
    const noteId = firstTwo[0]!;
    const noteInput = page.locator(`[data-testid="tile-${noteId}"] .tile-label-input`);
    await noteInput.fill('keep me');
    await noteInput.press('Enter');

    await expect(page.getByTestId('submit-btn')).toHaveText('Submit (2/4)');

    await page.reload();
    // Persisted current day brings us back to Day 1 without an extra click.
    await expect(page.getByTestId('puzzle-heading')).toHaveText('Audio Connections 1');
    await expect(page.locator('.tile')).toHaveCount(16);
    await expect(page.getByTestId('submit-btn')).toHaveText('Submit (2/4)');
    for (const id of firstTwo) {
      await expect(page.locator(`[data-testid="tile-${id}"]`)).toHaveClass(/selected/);
    }
    await expect(
      page.locator(`[data-testid="tile-${noteId}"] .tile-label-input`),
    ).toHaveValue('keep me');
  });

  test('solved themes and mistakes survive a reload', async ({ page }) => {
    await gotoDay(page, 1);
    const themes = groupByTheme(await readTrackIds(page));

    // One correct group + one wrong guess.
    await selectIds(page, themes.get(0)!);
    await page.getByTestId('submit-btn').click();
    await expect(page.getByTestId('solved-row-0')).toBeVisible();
    await expect(page.locator('.tile')).toHaveCount(12, { timeout: 4000 });

    await selectIds(page, [
      themes.get(1)![0]!,
      themes.get(2)![0]!,
      themes.get(3)![0]!,
      themes.get(1)![1]!,
    ]);
    await page.getByTestId('submit-btn').click();
    await expect(page.locator('.mistake-dot.used')).toHaveCount(1);

    await page.reload();
    await expect(page.getByTestId('solved-row-0')).toBeVisible();
    await expect(page.locator('.tile')).toHaveCount(12);
    await expect(page.locator('.mistake-dot.used')).toHaveCount(1);
  });

  test('reset button requires two clicks and clears state', async ({ page }) => {
    await gotoDay(page, 1);
    const themes = groupByTheme(await readTrackIds(page));
    await selectIds(page, themes.get(0)!.slice(0, 3));
    await expect(page.getByTestId('submit-btn')).toHaveText('Submit (3/4)');

    const resetBtn = page.getByTestId('reset-btn');
    await expect(resetBtn).toHaveText('Reset puzzle');

    // First click arms the confirm state; selection remains.
    await resetBtn.click();
    await expect(resetBtn).toHaveText('Click again to confirm reset');
    await expect(page.getByTestId('submit-btn')).toHaveText('Submit (3/4)');

    // Second click actually resets.
    await resetBtn.click();
    await expect(resetBtn).toHaveText('Reset puzzle');
    await expect(page.getByTestId('submit-btn')).toHaveText('Submit (0/4)');

    // The reset clears persisted state — reload should not bring selections back.
    await page.reload();
    await expect(page.locator('.tile')).toHaveCount(16);
    await expect(page.getByTestId('submit-btn')).toHaveText('Submit (0/4)');
  });

  test('confirm state auto-cancels after timeout (no double-click within window)', async ({ page }) => {
    await gotoDay(page, 1);
    const themes = groupByTheme(await readTrackIds(page));
    await selectIds(page, themes.get(0)!.slice(0, 2));

    const resetBtn = page.getByTestId('reset-btn');
    await resetBtn.click();
    await expect(resetBtn).toHaveText('Click again to confirm reset');

    // Wait long enough for the 3s confirm window to lapse.
    await expect(resetBtn).toHaveText('Reset puzzle', { timeout: 5000 });
    // Selection should still be intact since reset never fired.
    await expect(page.getByTestId('submit-btn')).toHaveText('Submit (2/4)');
  });
});
