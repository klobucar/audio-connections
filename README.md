# Audio Connections

A daily song puzzle.

## Contributing

- **Submitting a puzzle?** See [PUZZLE_AUTHORS.md](./PUZZLE_AUTHORS.md).
- **Working on the site code?** See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Moving your save between devices

The game stores progress in `localStorage`, so it lives on whichever device played it. To move it:

1. On the source device, click **Settings** (top-right) → **Copy backup**. A base64 string lands on your clipboard.
2. Send it to the target device any way you like — Messages, Notes, email.
3. On the target device, click **Settings** → paste into the import box → **Import** → **Replace**.

Only finished days (won or lost) are carried. In-progress sessions stay on whichever device you started them on.

## Editing your history

If you played offline, lost a backup, or want to clean up your record, there's a history editor at [`/?mode=editor`](https://audioconnections.io/?mode=editor). It's not linked from the game itself.

The editor decodes a backup string, lets you mark each day as not played, won, or lost (individually or in bulk over a day range), and re-encodes a new backup string you can import back into the game. It can also read from and write directly to this device's localStorage as a shortcut around the copy/paste round-trip.

Untouched rows preserve their original emoji grid byte-for-byte; any row you edit becomes summary-only (the post-game card shows the outcome but not the per-guess grid).
