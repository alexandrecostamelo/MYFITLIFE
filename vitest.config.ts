import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      'apps/web/tests/e2e/**',
      'node_modules/**',
      '**/node_modules/**',
    ],
  },
});
