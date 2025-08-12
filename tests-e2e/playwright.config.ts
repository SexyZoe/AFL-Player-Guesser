import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: true,
  },
});

