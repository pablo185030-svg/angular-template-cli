import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // the mock API keeps state in memory, so run specs one at a time
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // e2e runs against the mock API and the `e2e` build configuration, which fakes
  // authentication: no Keycloak server is needed.
  webServer: [
    {
      command: 'npm run mock:api',
      url: 'http://localhost:5000/health',
      reuseExistingServer: !process.env['CI'],
      timeout: 30_000,
    },
    {
      command: 'npm run start:e2e',
      url: 'http://localhost:4200',
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
    },
  ],
});
