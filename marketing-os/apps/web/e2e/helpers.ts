import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, type Page } from '@playwright/test';

/** Waits until React has hydrated so clicks are handled by React, not by native form submission. */
export async function hydrated(page: Page) {
  await page.locator('html[data-hydrated="true"]').waitFor({ state: 'attached' });
}

export const PASSWORD = 'correct-horse-battery-9';
const LOG = resolve(import.meta.dirname, '../../api/storage/logs/laravel.log');

export const uniqueEmail = (prefix: string) => `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e5)}@example.com`;

/** Finds the most recent emailed link for `email` whose URL matches `pattern` in the mail log. */
export async function latestMailLink(page: Page, email: string, pattern: RegExp): Promise<string> {
  let found: string | undefined;
  await expect
    .poll(
      () => {
        const log = readFileSync(LOG, 'utf8');
        const messages = log.split(/(?=^\[\d{4}-\d{2}-\d{2} )/m).filter((m) => m.includes(`To: ${email}`) || m.includes(`<${email}>`) || m.includes(email));
        for (const m of messages.reverse()) {
          const hit = m.match(pattern);
          if (hit) {
            found = hit[0].replace(/&amp;/g, '&').replace(/=\r?\n/g, '').replace(/=3D/g, '=');
            return true;
          }
        }
        return false;
      },
      { message: `mail link for ${email} matching ${pattern}`, timeout: 15_000 },
    )
    .toBe(true);
  return found!;
}

export async function register(page: Page, name: string, email: string) {
  await page.goto('/register');
  await hydrated(page);
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Work email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/verify-email/);
}

export async function verifyEmail(page: Page, email: string) {
  const link = await latestMailLink(page, email, /https?:\/\/[^\s"'<>\])]+\/api\/v1\/auth\/email\/verify\/[^\s"'<>\])]+/);
  await page.goto(link);
  await expect(page).toHaveURL(/\/login\?verified=1/);
}

export async function login(page: Page, email: string) {
  await page.goto('/login');
  await hydrated(page);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}

/** Navigate and wait for hydration so interactions are handled by React. */
export async function gotoApp(page: Page, path: string) {
  await page.goto(path);
  await hydrated(page);
}
