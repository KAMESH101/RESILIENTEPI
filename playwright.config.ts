import { defineConfig, devices } from '@playwright/test'

const CI = !!process.env.CI

/** Visual QA (qa/visual.spec.ts), behaviour flows and boundary-file guards. */
export default defineConfig({
  testDir: './qa',
  // CI runs the suite in two steps; each writes to its own folders.
  outputDir: process.env.PW_RESULTS_DIR ?? './test-results',
  fullyParallel: true,
  workers: CI ? 2 : undefined,
  // One retry in CI so a slow runner doesn't fail the build; retried tests are reported as flaky.
  retries: CI ? 1 : 0,
  // In CI, failures also appear as annotations on the commit/PR.
  reporter: CI ? [['github'], ['list'], ['html', { open: 'never', outputFolder: process.env.PW_REPORT_DIR ?? 'playwright-report' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:5199',
    ...devices['Desktop Chrome'],
    trace: CI ? 'retain-on-failure' : 'off',
  },
  webServer: {
    // Pin the demo month so screenshots are comparable between runs.
    command: 'npx vite --port 5199 --strictPort',
    env: { VITE_DEMO_AS_OF: '2026-10' },
    url: 'http://localhost:5199',
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
})
