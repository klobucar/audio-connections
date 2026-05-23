import { configDefaults, defineConfig } from 'vitest/config';

// Unit-test layer, separate from the Playwright e2e suite in tests/.
//   - Playwright globs tests/**/*.spec.ts and drives a real browser.
//   - Vitest globs src/**/*.test.ts and runs pure logic in Node.
// The split `include` / file-suffix convention keeps each runner from
// trying to execute the other's files. `*.itunes.test.ts` is the
// network-touching iTunes check — excluded here so `npm run test:unit`
// stays offline; run it via `npm run test:itunes` (its own config) or the
// path-filtered GitHub workflow that fires on puzzle-file changes.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: [...configDefaults.exclude, '**/*.itunes.test.ts'],
    // Pure logic only — no DOM needed. storage.ts wants a `localStorage`
    // global; vitest.setup.ts installs an in-memory one.
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
});
