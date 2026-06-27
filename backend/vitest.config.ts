import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Teste unitare (funcții pure). Cele de integrare (*.int.test.ts) au DB — vezi vitest.int.config.ts.
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/*.int.test.ts'],
  },
});
