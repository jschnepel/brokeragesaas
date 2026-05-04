import { defineConfig } from '@playwright/test';

/**
 * `PLAYWRIGHT_BASE_URL` lets local dev point at the docker-compose
 * container (`http://localhost:3200`) without spinning up a second
 * `next dev` on port 3000. CI keeps the default and starts its own
 * dev server.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const useExternalServer = baseURL !== 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.ts'],
  timeout: 30_000,
  use: { baseURL, headless: true },
  webServer: useExternalServer
    ? undefined
    : {
        command: 'npm run dev',
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
