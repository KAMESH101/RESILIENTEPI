import { defineConfig, devices } from '@playwright/test'

/** Visual QA: screenshots of every page at 375 / 768 / 1440 px (see qa/visual.spec.ts). */
export default defineConfig({
  testDir: './qa',
  outputDir: './test-results',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5199',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    // Pin the demo month so screenshots are comparable between runs.
    command: 'npx vite --port 5199 --strictPort',
    env: { VITE_DEMO_AS_OF: '2026-10' },
    url: 'http://localhost:5199',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
