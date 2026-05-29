import { describe, it, expect } from 'vitest';
import { decodeToChannels, canDecode } from './decode';

// Browser-only behaviour (real decoding) is covered by the manual device matrix
// in the test plan. Here we only assert the Node/no-Web-Audio path degrades to
// null rather than throwing, which is what keeps playback at unity gain.
describe('decodeToChannels (no Web Audio)', () => {
  it('reports decoding unavailable in a non-browser environment', () => {
    expect(canDecode()).toBe(false);
  });

  it('resolves to null instead of throwing', async () => {
    await expect(decodeToChannels('blob:nonexistent')).resolves.toBeNull();
  });
});
