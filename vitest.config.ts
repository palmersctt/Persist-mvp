import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  // Next compiles JSX itself (tsconfig "jsx": "preserve"); tests need the
  // automatic runtime so components render without importing React.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}', 'lib/**/*.{js,ts}'],
      exclude: ['**/*.test.*', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
