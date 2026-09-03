import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['packages/runtime/tests/lazy.test.ts', 'happy-dom'],
      ['packages/runtime/tests/testing.test.ts', 'happy-dom'],
      ['packages/runtime/tests/components.test.ts', 'happy-dom'],
      ['packages/runtime/tests/new-components.test.ts', 'happy-dom'],
      ['packages/runtime/tests/security.test.ts', 'happy-dom'],
      ['packages/runtime/tests/styles.test.ts', 'happy-dom'],
      ['packages/runtime/tests/router-v2.test.ts', 'happy-dom'],
      ['packages/runtime/tests/seo.test.ts', 'happy-dom'],
      ['packages/runtime/tests/image.test.ts', 'happy-dom'],
      ['packages/runtime/tests/pwa.test.ts', 'happy-dom'],
      ['packages/runtime/tests/a11y.test.ts', 'happy-dom'],
      ['packages/runtime/tests/animations.test.ts', 'happy-dom'],
      ['packages/runtime/tests/server-components.test.ts', 'happy-dom'],
      ['packages/runtime/tests/activity-effect-event.test.ts', 'happy-dom'],
    ],
    include: ['packages/*/src/**/*.test.ts', 'packages/*/tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@flint/compiler': path.resolve(__dirname, 'packages/compiler/src'),
      '@flint/runtime': path.resolve(__dirname, 'packages/runtime/src'),
      '@flint/reactivity': path.resolve(__dirname, 'packages/reactivity/src'),
      '@flint/store': path.resolve(__dirname, 'packages/store/src'),
    },
  },
})
