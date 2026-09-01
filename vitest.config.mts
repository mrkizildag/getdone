import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

const root = import.meta.dirname

// `@raycast/api` is a native module that only resolves inside the Raycast
// runtime, so tests alias it to a stub. Order matters: the scoped Raycast
// specifiers must be matched before the `@/` source alias.
export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@raycast/api',
        replacement: resolve(root, 'test/stubs/raycast-api.ts'),
      },
      {
        find: '@raycast/utils',
        replacement: resolve(root, 'test/stubs/raycast-utils.ts'),
      },
      { find: /^@\//, replacement: `${resolve(root, 'src')}/` },
    ],
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.ts'],
      // The suite covers the sub-issue feature, not the inherited upstream
      // code, so the gate is scoped to what it actually exercises rather than
      // asserting a repo-wide number that would be meaningless.
      thresholds: {
        'src/features/todo-list/utils/sub-issue-view.ts': {
          statements: 100,
          branches: 90,
          functions: 100,
          lines: 100,
        },
        'src/services/notion/operations/get-todos.ts': {
          statements: 90,
          branches: 75,
          functions: 100,
          lines: 90,
        },
      },
    },
  },
})
