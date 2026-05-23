import { defineConfig } from 'vitest/config';

// Dedicated config for the network-touching iTunes ID check. Lives apart from
// the default unit config so `npm run test:unit` stays offline and fast; this
// one is invoked by `npm run test:itunes` and by the path-filtered
// itunes-check workflow on pushes that touch src/puzzles/day-*.ts.
export default defineConfig({
  test: {
    include: ['src/**/*.itunes.test.ts'],
    environment: 'node',
  },
});
