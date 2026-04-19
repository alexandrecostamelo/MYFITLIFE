import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: 'packages/core/vitest.config.ts',
    test: {
      name: 'core',
      root: 'packages/core',
    },
  },
  {
    extends: 'packages/ai/vitest.config.ts',
    test: {
      name: 'ai',
      root: 'packages/ai',
    },
  },
  {
    extends: 'apps/web/vitest.config.ts',
    test: {
      name: 'web',
      root: 'apps/web',
      exclude: ['tests/e2e/**', 'node_modules/**'],
    },
  },
]);
