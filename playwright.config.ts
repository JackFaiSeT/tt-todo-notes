import { defineConfig, devices } from '@playwright/test'

const IS_CI = process.env.CI === 'true'

process.env.TZ = 'Europe/Moscow'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  tsconfig: './tests/e2e/tsconfig.json',
  globalSetup: './tests/e2e/server.ts',
  outputDir: '.dev-artifacts/playwright/results',
  forbidOnly: IS_CI,
  retries: IS_CI ? 1 : 0,
  fullyParallel: true,
  workers: 2,
  reporter: IS_CI
    ? [['list'], ['html', { open: 'never', outputFolder: '.dev-artifacts/playwright/report' }]]
    : [['list']],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://127.0.0.1:4317',
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    trace: IS_CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
})
