import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// End-to-end runs against a REAL Laravel API + Postgres (database mios_e2e) and the real Next.js app.
// Mail is written to the Laravel log; tests read verification links from it (no test-only backdoors).
const API_PORT = 8100;
const WEB_PORT = 3100;
const apiDir = resolve(import.meta.dirname, '../api');

export const apiEnv = {
  APP_ENV: 'local',
  APP_DEBUG: 'false',
  APP_URL: `http://127.0.0.1:${API_PORT}`,
  FRONTEND_URL: `http://127.0.0.1:${WEB_PORT}`,
  DB_CONNECTION: 'pgsql',
  DB_HOST: process.env.E2E_DB_HOST ?? '127.0.0.1',
  DB_PORT: process.env.E2E_DB_PORT ?? '5432',
  DB_DATABASE: process.env.E2E_DB_DATABASE ?? 'mios_e2e',
  DB_USERNAME: process.env.E2E_DB_USERNAME ?? 'mios',
  DB_PASSWORD: process.env.E2E_DB_PASSWORD ?? 'mios',
  SESSION_DRIVER: 'database',
  CACHE_STORE: 'database',
  QUEUE_CONNECTION: 'sync',
  MAIL_MAILER: 'log',
  LOG_CHANNEL: 'single',
  LOG_STACK: 'single',
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://127.0.0.1:${WEB_PORT}`, trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { executablePath: existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined },
      },
    },
  ],
  webServer: [
    {
      // Fresh schema + empty mail log, then serve. (Playwright starts web servers before globalSetup.)
      command: `sh -c "php artisan migrate:fresh --force > /dev/null && : > storage/logs/laravel.log && exec php -S 127.0.0.1:${API_PORT} -t public public/index.php"`,
      stderr: 'ignore',
      cwd: apiDir,
      url: `http://127.0.0.1:${API_PORT}/api/v1/system/health`,
      env: apiEnv,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx next dev -p ${WEB_PORT}`,
      url: `http://127.0.0.1:${WEB_PORT}/login`,
      env: { API_INTERNAL_URL: `http://127.0.0.1:${API_PORT}` },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
