import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 15000,
    server: {
      deps: {
        external: [/node:sqlite/, 'node:sqlite'],
      },
    },
  },
  ssr: {
    external: ['node:sqlite'],
  },
});
