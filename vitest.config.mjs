import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.spec.js', 'tests/unit/**/*.test.js'],
    globals: false,
    environment: 'node'
  }
});
