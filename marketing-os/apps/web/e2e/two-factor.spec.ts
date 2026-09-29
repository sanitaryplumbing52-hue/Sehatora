import { createHmac } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { gotoApp, hydrated, login, PASSWORD, register, uniqueEmail, verifyEmail } from './helpers';

/** RFC 6238 TOTP (SHA-1, 30s, 6 digits) — enough to act as the user's authenticator app. */
function totp(base32: string, stepOffset = 0): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of base32.replace(/=+$/, '').toUpperCase()) bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Math.floor(Date.now() / 30_000) + stepOffset;
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac('sha1', key).update(msg).digest();
  const o = h[h.length - 1]! & 0xf;
  const code = ((h[o]! & 0x7f) << 24) | (h[o + 1]! << 16) | (h[o + 2]! << 8) | h[o + 3]!;
  return String(code % 1_000_000).padStart(6, '0');
}

test('enable two-factor, sign in with a code, and recovery codes are single-use', async ({ page }) => {
  const email = uniqueEmail('twofa');
  await register(page, 'Tara TwoFactor', email);
  await verifyEmail(page, email);
  await login(page, email);
  await page.getByLabel('Organization name').fill(`2FA Org ${Date.now()}`);
  await page.getByRole('button', { name: 'Create organization' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  const slug = new URL(page.url()).pathname.split('/')[1]!;

  // Enrol
  await gotoApp(page, `/${slug}/settings/security`);
  await page.getByLabel('Confirm password to begin').fill(PASSWORD);
  await page.getByRole('button', { name: 'Set up two-factor' }).click();
  await expect(page.getByAltText('Two-factor QR code')).toBeVisible();
  const secret = (await page.locator('span.font-mono.break-all').innerText()).trim();
  await page.getByLabel('6-digit code').fill('000000');
  await page.getByRole('button', { name: 'Confirm and turn on' }).click();
  await expect(page.getByText('That code is not valid.')).toBeVisible();
  await page.getByLabel('6-digit code').fill(totp(secret));
  await page.getByRole('button', { name: 'Confirm and turn on' }).click();
  await expect(page.getByText('Save your recovery codes now')).toBeVisible();
  const recovery = (await page.locator('ul.font-mono li').allInnerTexts()).map((t) => t.trim());
  expect(recovery).toHaveLength(8);

  // Sign out, then sign in: password alone is not enough.
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login/);
  await hydrated(page);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Two-factor authentication' })).toBeVisible();
  await page.goto(`/${slug}/dashboard`);
  await expect(page).toHaveURL(/\/login/); // not signed in yet

  await gotoApp(page, '/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByLabel('Authentication code').fill(totp(secret, 1)); // next window (current one was consumed at enrolment)
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page).toHaveURL(new RegExp(`/${slug}/dashboard`));

  // Recovery code works once.
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login/);
  for (const shouldWork of [true, false]) {
    await gotoApp(page, '/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('button', { name: 'Use a recovery code' }).click();
    await page.getByLabel('Recovery code').fill(recovery[0]!);
    await page.getByRole('button', { name: 'Verify' }).click();
    if (shouldWork) await expect(page).toHaveURL(new RegExp(`/${slug}/dashboard`));
    else await expect(page.getByText('That code is not valid.')).toBeVisible();
    if (shouldWork) {
      await page.getByRole('button', { name: 'Account menu' }).click();
      await page.getByRole('menuitem', { name: 'Sign out' }).click();
      await expect(page).toHaveURL(/\/login/);
    }
  }
});
