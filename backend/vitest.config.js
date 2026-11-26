import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/services/actaService.js', 'src/services/posicionesService.js'],
      thresholds: { lines: 70, functions: 65, branches: 60 },
    },
  },
});
