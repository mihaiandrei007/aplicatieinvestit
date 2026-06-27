import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.int.test.ts'],
    // Rulează serial (împart aceeași bază de date).
    fileParallelism: false,
    testTimeout: 20000,
  },
});
