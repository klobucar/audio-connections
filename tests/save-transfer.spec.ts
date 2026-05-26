import { test, expect, type Page } from '@playwright/test';
import { APP_URL, openPicker } from './helpers/game';

// End-to-end coverage for the save/restore flow. The transfer + backup
// modules have unit coverage; this exercises the UI surfaces and the
// localStorage round-trip a real player sees.

const DAY_KEY = (day: number) => `audio-connections:day:${day}`;

interface PlantedDay {
  day: number;
  outcome: 'won' | 'lost';
  guessHistory?: Array<{ themes: number[]; correct: boolean }>;
}

/** Encode the same envelope shape src/transfer.ts produces, so the test
 *  doesn't need to import the runtime module (which runs in the browser). */
function encodeEnvelope(days: PlantedDay[]): string {
  const envelope = {
    formatVersion: 1,
    exportedAt: '2026-05-26T00:00:00.000Z',
    app: 'audio-connections',
    days,
  };
  return Buffer.from(JSON.stringify(envelope)).toString('base64');
}

/** Seed localStorage with a finished day so the export has something to
 *  carry. Bypasses the puzzle session loader entirely — the persistence
 *  shape is the same one usePuzzleSession would write. */
async function seedFinishedDay(
  page: Page,
  day: number,
  opts: { mistakes: number; wonHistory?: boolean } = { mistakes: 1, wonHistory: true },
): Promise<void> {
  await page.evaluate(
    ({ key, day, mistakes, wonHistory }) => {
      const guessHistory = wonHistory
        ? [
            { themes: [0, 1, 2, 3], correct: false, ids: [10, 11, 12, 13] },
            { themes: [0, 0, 0, 0], correct: true, ids: [0, 1, 2, 3] },
            { themes: [1, 1, 1, 1], correct: true, ids: [4, 5, 6, 7] },
            { themes: [2, 2, 2, 2], correct: true, ids: [8, 9, 14, 15] },
            { themes: [3, 3, 3, 3], correct: true, ids: [16, 17, 18, 19] },
          ]
        : [];
      localStorage.setItem(
        key,
        JSON.stringify({
          __v: 1,
          day,
          selected: [],
          solvedThemes: [0, 1, 2, 3],
          notes: [],
          mistakes,
          guessHistory,
          gameOver: true,
          // trackOrder will likely not match the freshly loaded set; the
          // session loader will load-fresh in that case, but for export
          // we only need the state to be terminal on disk.
          trackOrder: [],
          guessSignatures: [],
        }),
      );
    },
    { key: DAY_KEY(day), day, mistakes: opts.mistakes, wonHistory: opts.wonHistory ?? true },
  );
}

test.describe('Settings — export', () => {
  test('shows finished-day count and copies b64 to the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(APP_URL);
    await seedFinishedDay(page, 1);
    await seedFinishedDay(page, 2, { mistakes: 4, wonHistory: false });
    await page.reload();

    await page.getByTestId('settings-trigger').click();
    await expect(page.getByTestId('settings-modal')).toBeVisible();
    await expect(page.getByText('Backs up your 2 finished days')).toBeVisible();

    await page.getByTestId('settings-export').click();
    await expect(page.getByTestId('settings-export')).toHaveText('Copied!');

    const clip = await page.evaluate(() => navigator.clipboard.readText());
    const decoded = JSON.parse(Buffer.from(clip, 'base64').toString());
    expect(decoded.app).toBe('audio-connections');
    expect(decoded.formatVersion).toBe(1);
    expect(decoded.days).toHaveLength(2);
    expect(decoded.days[0]).toMatchObject({ day: 1, outcome: 'won' });
    // wonHistory=false on the lost seed → guessHistory is empty.
    expect(decoded.days[1]).toMatchObject({ day: 2, outcome: 'lost' });
  });

  test('shows the empty-state message when no days are finished', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByTestId('settings-trigger').click();
    await expect(page.getByText('No finished days yet')).toBeVisible();
    await expect(page.getByTestId('settings-export')).toBeDisabled();
  });
});

test.describe('Settings — import', () => {
  test('rejects malformed input with a readable error', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByTestId('settings-trigger').click();
    await page.getByTestId('settings-import-input').fill('not a backup');
    await page.getByTestId('settings-import-go').click();
    await expect(page.getByTestId('settings-import-error')).toBeVisible();
  });

  test('confirm step shows the day count, replace wipes existing state', async ({ page }) => {
    await page.goto(APP_URL);
    await seedFinishedDay(page, 1);
    await page.reload();

    // Existing state on disk; incoming envelope describes only day 3.
    const incoming = encodeEnvelope([{ day: 3, outcome: 'won' }]);

    await page.getByTestId('settings-trigger').click();
    await page.getByTestId('settings-import-input').fill(incoming);
    await page.getByTestId('settings-import-go').click();

    const confirm = page.getByTestId('settings-import-confirm');
    await expect(confirm).toBeVisible();
    await expect(confirm).toContainText('Replace your 1 finished day with 1 from this backup?');

    await page.getByTestId('settings-import-confirm-yes').click();
    // applyBackup → reload; once back, day 1 should be wiped and day 3 saved.
    await expect(page.getByTestId('settings-trigger')).toBeVisible();
    const stored = await page.evaluate((keys) => keys.map((k) => localStorage.getItem(k)), [
      DAY_KEY(1),
      DAY_KEY(3),
    ]);
    expect(stored[0]).toBeNull();
    expect(stored[1]).not.toBeNull();
    const day3 = JSON.parse(stored[1]!);
    expect(day3.gameOver).toBe(true);
    expect(day3.solvedThemes).toEqual([0, 1, 2, 3]);
  });
});

test.describe('Editor', () => {
  test('round-trips a backup: load, flip a row, copy new b64', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const input = encodeEnvelope([
      { day: 1, outcome: 'won' },
      { day: 2, outcome: 'lost' },
    ]);

    await page.goto('/?mode=editor');
    await page.getByTestId('editor-input').fill(input);
    await page.getByTestId('editor-load-text').click();
    await expect(page.getByText('Loaded 2 days.')).toBeVisible();

    // Flip day 2 to "won".
    await page.getByTestId('editor-day-2-won').click();

    // Copy the new b64 and verify the change is reflected.
    await page.getByTestId('editor-copy').click();
    await expect(page.getByTestId('editor-copy')).toHaveText('Copied!');
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    const decoded = JSON.parse(Buffer.from(clip, 'base64').toString());
    expect(decoded.days).toEqual([
      { day: 1, outcome: 'won' },
      { day: 2, outcome: 'won' },
    ]);
  });

  test('untouched rows preserve their original guessHistory byte-for-byte', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const history = [
      { themes: [0, 0, 0, 0], correct: true },
      { themes: [1, 1, 1, 1], correct: true },
      { themes: [2, 2, 2, 2], correct: true },
      { themes: [3, 3, 3, 3], correct: true },
    ];
    const input = encodeEnvelope([{ day: 1, outcome: 'won', guessHistory: history }]);

    await page.goto('/?mode=editor');
    await page.getByTestId('editor-input').fill(input);
    await page.getByTestId('editor-load-text').click();

    // Don't touch row 1 — copy directly. Should pass through unchanged.
    await page.getByTestId('editor-copy').click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    const decoded = JSON.parse(Buffer.from(clip, 'base64').toString());
    expect(decoded.days[0]).toEqual({ day: 1, outcome: 'won', guessHistory: history });
  });

  test('bulk set range converts touched rows to synthetic records', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/?mode=editor');

    await page.getByTestId('editor-bulk-from').fill('1');
    await page.getByTestId('editor-bulk-to').fill('3');
    await page.getByRole('button', { name: 'Set won' }).click();

    await page.getByTestId('editor-copy').click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    const decoded = JSON.parse(Buffer.from(clip, 'base64').toString());
    expect(decoded.days).toEqual([
      { day: 1, outcome: 'won' },
      { day: 2, outcome: 'won' },
      { day: 3, outcome: 'won' },
    ]);
  });
});

test.describe('Edited day → game', () => {
  test('renders a summary EndPanel (no emoji grid) for an imported edited day', async ({ page }) => {
    // Import an editor-style record (no guessHistory) and confirm the
    // EndPanel renders the summary variant: no share text, no copy button.
    const incoming = encodeEnvelope([{ day: 1, outcome: 'won' }]);

    await page.goto(APP_URL);
    await page.getByTestId('settings-trigger').click();
    await page.getByTestId('settings-import-input').fill(incoming);
    await page.getByTestId('settings-import-go').click();
    await page.getByTestId('settings-import-confirm-yes').click();
    await page.waitForLoadState('load');

    // Can't use gotoDay — its 16-tile assertion doesn't hold once all themes
    // are solved (Grid filters them out). Open picker and click day 1 inline.
    await openPicker(page);
    await page.getByTestId('day-chip-1').click();
    await expect(page.getByTestId('puzzle-heading')).toHaveText('Audio Connections 1');
    await expect(page.getByTestId('end-panel')).toBeVisible();
    await expect(page.getByTestId('share-text')).toHaveCount(0);
    await expect(page.getByTestId('copy-btn')).toHaveCount(0);
  });
});
