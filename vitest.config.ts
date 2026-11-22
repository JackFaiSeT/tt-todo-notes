import { defineConfig } from 'vitest/config'
import { APP_ALIASES, resolveAppPath } from './config/aliases.mts'
import { integrationTestProject, unitTestProject } from './config/vitest/projects.mjs'

const INTEGRATION_TIMEOUT_MS = 30_000

const FIXTURE_BUILD_TIMEOUT_MS = 180_000

const AUTO_IMPORTS_SETUP = 'tests/setup/auto-imports.ts'

export default defineConfig({
  resolve: {
    alias: {
      ...APP_ALIASES,
      '#server': resolveAppPath('./src/server')
    }
  },
  test: {
    maxWorkers: 4,
    projects: [
      unitTestProject({ setupFiles: [AUTO_IMPORTS_SETUP] }),
      integrationTestProject({ testTimeout: INTEGRATION_TIMEOUT_MS, hookTimeout: FIXTURE_BUILD_TIMEOUT_MS })
    ]
  }
})
