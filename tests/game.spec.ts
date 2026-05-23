import { test, expect, Page } from '@playwright/test';
import { puzzles } from './helpers/puzzles';
import { APP_URL, gotoDay, openPicker, groupByTheme, readTrackIds, selectIds } from './helpers/game';

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
    await expect(submit).toContainText('SUBMIT 0/4');

    const ids = await readTrackIds(page);
    const themes = groupByTheme(ids);
    const firstTheme = themes.get(0)!;
    await selectIds(page, [firstTheme[0]!]);
    await expect(submit).toContainText('SUBMIT 1/4');
    await expect(submit).toBeDisabled();

    await selectIds(page, firstTheme.slice(1));
    await expect(submit).toContainText('SUBMIT 4/4');
    await expect(submit).toBeEnabled();

    await page.getByTestId('deselect-btn').click();
    await expect(submit).toContainText('SUBMIT 0/4');
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
    await expect(page.getByTestId('end-panel')).toContainText('Mixtape Mastered.');
    await expect(page.getByTestId('share-text')).toContainText('Audio Connections 1');
    const share = await page.getByTestId('share-text').textContent();
    expect(share!.split('\n').length).toBe(5);
  });

  test('four wrong guesses ends the game with "Out of Tape."', async ({ page }) => {
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
    await expect(page.getByTestId('end-panel')).toContainText('Out of Tape.');
    await expect(page.locator('.mistake-dot.used')).toHaveCount(4);
  });

  test('tile note input persists value while typing', async ({ page }) => {
    const themes = groupByTheme(await readTrackIds(page));
    const id = themes.get(0)![0]!;
    const input = page.locator(`[data-testid="tile-${id}"] .tile-label-input`);
    await input.fill('mine');
    // Escape commits/blurs without losing the value.
    await input.press('Escape');
    await expect(input).toHaveValue('mine');
    // Enter inserts a newline (multi-line notes like "Song\nArtist");
    // focus only changes on click/touch, not Enter.
    await input.fill('Song');
    await input.press('Enter');
    await input.pressSequentially('Artist');
    await expect(input).toHaveValue('Song\nArtist');
  });

  test('solved rows render in the order the groups were found (survives reload)', async ({
    page,
  }) => {
    const themes = groupByTheme(await readTrackIds(page));
    // Solve deliberately out of theme-index order.
    const solveOrder = [2, 0, 3, 1];
    for (const t of solveOrder) {
      await selectIds(page, themes.get(t)!);
      await page.getByTestId('submit-btn').click();
      await expect(page.getByTestId(`solved-row-${t}`)).toBeVisible();
    }

    const expected = solveOrder.map((t) => `solved-row-${t}`);
    const domOrder = () =>
      page
        .locator('[data-testid^="solved-row-"]')
        .evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));

    // Rendered in solve order, not theme order (which would be 0,1,2,3).
    expect(await domOrder()).toEqual(expected);

    // The order is reconstructed from persisted guessHistory, so it must
    // survive a reload rather than fall back to theme-index order. A
    // finished day is no longer auto-resumed on cold-load (it jumps to the
    // latest puzzle), so re-open Day 1 from the picker — its stored
    // guessHistory must still drive the solve order.
    await page.reload();
    await openPicker(page);
    await page.getByTestId('day-chip-1').click();
    await expect(page.getByTestId('solved-row-1')).toBeVisible();
    expect(await domOrder()).toEqual(expected);
  });
});

test.describe('Audio Connections — day switching', () => {
  test('Day 1, 2, 3 are all reachable when releaseAt has passed for them', async ({ page }) => {
    await page.goto(APP_URL);
    await openPicker(page);
    await page.getByTestId('day-chip-1').click();
    await expect(page.getByTestId('puzzle-heading')).toHaveText('Audio Connections 1');
    await expect(page.locator('.tile')).toHaveCount(16);

    await openPicker(page);
    await page.getByTestId('day-chip-2').click();
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
    await expect(page.getByTestId('end-panel')).toContainText('Mixtape Mastered.');
    await openPicker(page);
    await expect(page.getByTestId('day-chip-1')).toHaveClass(/day-chip-done/);
    await page.getByTestId('day-chip-2').click();
    // Wait for the new day's tiles to actually load before asserting, so the
    // check runs against the post-load state, not the brief stale window.
    await expect(page.getByTestId('puzzle-heading')).toHaveText('Audio Connections 2');
    await expect(page.locator('.tile')).toHaveCount(16);

    await openPicker(page);
    await expect(page.getByTestId('day-chip-2')).not.toHaveClass(/day-chip-done/);
    // Day 1 still done.
    await expect(page.getByTestId('day-chip-1')).toHaveClass(/day-chip-done/);
  });

  test('winning a day marks its chip done, survives reload', async ({ page }) => {
    await gotoDay(page, 1);
    const themes = groupByTheme(await readTrackIds(page));
    for (let t = 0; t < 4; t++) {
      await selectIds(page, themes.get(t)!);
      await page.getByTestId('submit-btn').click();
      await expect(page.getByTestId(`solved-row-${t}`)).toBeVisible();
    }
    await expect(page.getByTestId('end-panel')).toContainText('Mixtape Mastered.');
    await openPicker(page);
    await expect(page.getByTestId('day-chip-1')).toHaveClass(/day-chip-done/);

    // Reload: the done state persists thanks to localStorage seeding.
    await page.reload();
    await openPicker(page);
    await expect(page.getByTestId('day-chip-1')).toHaveClass(/day-chip-done/);

    // Other days remain un-done.
    await expect(page.getByTestId('day-chip-2')).not.toHaveClass(/day-chip-done/);
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
    await expect(page.getByTestId('end-panel')).toContainText('Out of Tape.');
    await openPicker(page);
    await expect(page.getByTestId('day-chip-1')).not.toHaveClass(/day-chip-done/);
    await expect(page.getByTestId('day-chip-1')).toHaveClass(/day-chip-failed/);
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
    await expect(page.getByTestId('end-panel')).toContainText('Out of Tape.');

    await openPicker(page);
    await page.getByTestId('day-chip-2').click();
    await expect(page.getByTestId('puzzle-heading')).toHaveText('Audio Connections 2');
    await expect(page.locator('.tile')).toHaveCount(16);
    await expect(page.getByTestId('end-panel')).toHaveCount(0);
    await expect(page.locator('.mistake-dot.used')).toHaveCount(0);
    await expect(page.getByTestId('submit-btn')).toContainText('SUBMIT 0/4');
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

  test('the code unlocks every Day chip', async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByTestId('grid')).toBeVisible();
    await typeKonami(page);
    await expect(page.getByTestId('status')).toContainText(/Konami/);
    await openPicker(page);
    for (const p of puzzles) {
      await expect(page.getByTestId(`day-chip-${p.day}`)).toBeEnabled();
      await expect(page.getByTestId(`day-chip-${p.day}`)).not.toHaveClass(/day-chip-locked/);
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
    await noteInput.press('Escape');

    await expect(page.getByTestId('submit-btn')).toContainText('SUBMIT 2/4');

    await page.reload();
    // Persisted current day brings us back to Day 1 without an extra click.
    await expect(page.getByTestId('puzzle-heading')).toHaveText('Audio Connections 1');
    await expect(page.locator('.tile')).toHaveCount(16);
    await expect(page.getByTestId('submit-btn')).toContainText('SUBMIT 2/4');
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
    await expect(page.getByTestId('submit-btn')).toContainText('SUBMIT 3/4');

    const resetBtn = page.getByTestId('reset-btn');
    await expect(resetBtn).toHaveText('Erase Tape');

    // First click arms the confirm state; selection remains.
    await resetBtn.click();
    await expect(resetBtn).toHaveText('Confirm Erase');
    await expect(page.getByTestId('submit-btn')).toContainText('SUBMIT 3/4');

    // Second click actually resets.
    await resetBtn.click();
    await expect(resetBtn).toHaveText('Erase Tape');
    await expect(page.getByTestId('submit-btn')).toContainText('SUBMIT 0/4');

    // The reset clears persisted state — reload should not bring selections back.
    await page.reload();
    await expect(page.locator('.tile')).toHaveCount(16);
    await expect(page.getByTestId('submit-btn')).toContainText('SUBMIT 0/4');
  });

  test('confirm state auto-cancels after timeout (no double-click within window)', async ({ page }) => {
    await gotoDay(page, 1);
    const themes = groupByTheme(await readTrackIds(page));
    await selectIds(page, themes.get(0)!.slice(0, 2));

    const resetBtn = page.getByTestId('reset-btn');
    await resetBtn.click();
    await expect(resetBtn).toHaveText('Confirm Erase');

    // Wait long enough for the 3s confirm window to lapse.
    await expect(resetBtn).toHaveText('Erase Tape', { timeout: 5000 });
    // Selection should still be intact since reset never fired.
    await expect(page.getByTestId('submit-btn')).toContainText('SUBMIT 2/4');
  });
});

test.describe('Audio Connections — cold load default day', () => {
  // The latest released puzzle is the one a returning visitor *might* be
  // redirected to. Compute it at test time so the suite tracks the puzzle
  // calendar without having to edit constants.
  const latest = (() => {
    const now = Date.now();
    for (let i = puzzles.length - 1; i >= 0; i--) {
      const p = puzzles[i]!;
      if (!p.releaseAt || new Date(p.releaseAt).getTime() <= now) return p;
    }
    return puzzles[0]!;
  })();

  /** Build a minimal valid PersistedGameState. Only the fields the cold-load
   *  heuristic reads (solvedThemes.length, mistakes) need realistic values. */
  function persistedState(opts: { day: number; solvedThemes: number[]; mistakes: number; gameOver: boolean }) {
    return {
      __v: 1,
      day: opts.day,
      selected: [],
      solvedThemes: opts.solvedThemes,
      notes: [],
      mistakes: opts.mistakes,
      guessHistory: [],
      gameOver: opts.gameOver,
      trackOrder: [],
      guessSignatures: [],
    };
  }

  async function seedStorage(page: Page, entries: Record<string, unknown>) {
    await page.addInitScript((data) => {
      for (const [k, v] of Object.entries(data)) {
        localStorage.setItem(k, JSON.stringify(v));
      }
    }, entries);
  }

  /** Like seedStorage but writes the currentDay key as a raw number string. */
  async function seedCurrentDay(page: Page, day: number) {
    await page.addInitScript((d) => {
      localStorage.setItem('audio-connections:currentDay', String(d));
    }, day);
  }

  test('first-time visitor lands on the latest puzzle', async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByTestId('puzzle-heading')).toHaveText(`Audio Connections ${latest.day}`);
  });

  test('returning visitor with a solved saved day jumps to fresh latest', async ({ page }) => {
    await seedCurrentDay(page, 1);
    await seedStorage(page, {
      'audio-connections:day:1': persistedState({ day: 1, solvedThemes: [0, 1, 2, 3], mistakes: 0, gameOver: true }),
    });
    await page.goto(APP_URL);
    await expect(page.getByTestId('puzzle-heading')).toHaveText(`Audio Connections ${latest.day}`);
  });

  test('returning visitor mid-play on saved day stays on it', async ({ page }) => {
    await seedCurrentDay(page, 1);
    await seedStorage(page, {
      'audio-connections:day:1': persistedState({ day: 1, solvedThemes: [0], mistakes: 1, gameOver: false }),
    });
    await page.goto(APP_URL);
    await expect(page.getByTestId('puzzle-heading')).toHaveText('Audio Connections 1');
  });

  test('returning visitor with terminal saved day stays put when the latest is already touched', async ({ page }) => {
    await seedCurrentDay(page, 1);
    await seedStorage(page, {
      'audio-connections:day:1': persistedState({ day: 1, solvedThemes: [0, 1, 2, 3], mistakes: 0, gameOver: true }),
      [`audio-connections:day:${latest.day}`]: persistedState({ day: latest.day, solvedThemes: [0], mistakes: 0, gameOver: false }),
    });
    await page.goto(APP_URL);
    await expect(page.getByTestId('puzzle-heading')).toHaveText('Audio Connections 1');
  });
});

test.describe('Audio Connections — picker hides future locked days', () => {
  // Pull the soonest locked day at test time so the suite tracks the puzzle
  // calendar without baked-in day numbers.
  const futureLocked = (() => {
    const now = Date.now();
    return puzzles
      .filter((p) => p.releaseAt && new Date(p.releaseAt).getTime() > now)
      .sort((a, b) => a.day - b.day);
  })();

  test('exactly one locked chip is rendered, and it is the soonest one', async ({ page }) => {
    test.skip(futureLocked.length === 0, 'no locked puzzles in the current calendar');
    await page.goto(APP_URL);
    await page.getByTestId('day-selector-pill').click();
    await expect(page.getByTestId('day-picker')).toHaveClass(/open/);

    await expect(page.locator('.day-picker-grid .day-chip-locked')).toHaveCount(1);
    const soonest = futureLocked[0]!;
    await expect(page.getByTestId(`day-chip-${soonest.day}`)).toBeVisible();
  });

  test('further-out locked days are absent from the grid', async ({ page }) => {
    test.skip(futureLocked.length < 2, 'need at least 2 future-locked days to verify');
    await page.goto(APP_URL);
    await page.getByTestId('day-selector-pill').click();
    await expect(page.getByTestId('day-picker')).toHaveClass(/open/);

    for (let i = 1; i < futureLocked.length; i++) {
      const hidden = futureLocked[i]!;
      await expect(page.getByTestId(`day-chip-${hidden.day}`)).toHaveCount(0);
    }
  });
});
