/**
 * Playwright Configuration for Affiliate Chain Testing
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'html',
  timeout: 60000,
  expect: { timeout: 15000 },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://76.13.222.232:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],

  webServer: {
    command: 'pnpm dev -p 3002',
    url: 'http://localhost:3002',
    reuseExistingServer: true,
    timeout: 120000
  }
});
