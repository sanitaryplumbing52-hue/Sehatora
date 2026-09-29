import { expect, test } from '@playwright/test';
import { gotoApp, hydrated, login, PASSWORD, register, uniqueEmail, verifyEmail } from './helpers';

// One user journey through the Phase 1 critical path against the real API + database.
test.describe.serial('Phase 1 critical flow', () => {
  const email = uniqueEmail('owner');
  const orgName = `E2E Agency ${Date.now()}`;
  let orgSlug = '';

  test('unauthenticated visitors are sent to sign in', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/acme/dashboard');
    await expect(page).toHaveURL(/\/login\?next=%2Facme%2Fdashboard/);
  });

  test('register, verify email, sign in', async ({ page }) => {
    await register(page, 'Sara Owner', email);
    await expect(page.getByText(email)).toBeVisible();

    // Unverified users cannot get past the verification wall.
    await page.goto('/onboarding/organization');
    await expect(page).toHaveURL(/\/verify-email/);

    await verifyEmail(page, email);
    await login(page, email);
    await expect(page).toHaveURL(/\/onboarding\/organization/);
  });

  test('create organization and see the truthful first-run dashboard', async ({ page }) => {
    await login(page, email);
    await page.getByLabel('Organization name').fill(orgName);
    await page.getByRole('button', { name: 'Create organization' }).click();
    await expect(page).toHaveURL(/\/[a-z0-9-]+\/dashboard/);
    orgSlug = new URL(page.url()).pathname.split('/')[1]!;

    await expect(page.getByRole('heading', { name: 'Welcome to Marketing Intelligence OS' })).toBeVisible();
    await expect(page.getByText('Your marketing data will appear here once connected')).toBeVisible();
    for (const source of ['Google Analytics', 'Search Console', 'Google Ads', 'Meta Ads']) {
      await expect(page.locator('#main').getByText(source, { exact: true })).toBeVisible();
    }
    // No fake numbers, no charts.
    await expect(page.locator('[data-testid^="metric-"]')).toHaveCount(0);
    await expect(page.locator('svg.recharts-surface, canvas')).toHaveCount(0);
  });

  test('create a project with a website; dashboard shows only "Not connected"', async ({ page }) => {
    await login(page, email);
    await gotoApp(page, `/${orgSlug}/dashboard`);
    await page.getByLabel('Project name').fill('Ariston UAE');
    await page.getByLabel('Website', { exact: true }).fill('https://WWW.Example.com/some/path');
    await page.getByRole('button', { name: 'Add website & create project' }).click();
    await expect(page).toHaveURL(new RegExp(`/${orgSlug}/projects/[0-9a-f-]{36}`));
    await expect(page.getByRole('heading', { name: 'Ariston UAE' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'https://www.example.com', exact: true })).toBeVisible();

    await gotoApp(page, `/${orgSlug}/dashboard`);
    const cards = page.locator('[data-testid^="metric-"]');
    await expect(cards).toHaveCount(11);
    for (const status of await cards.evaluateAll((els) => els.map((e) => e.getAttribute('data-status')))) expect(status).toBe('not_connected');
    await expect(page.getByText('Not connected').first()).toBeVisible();
    // Nothing on a fresh project may look like a measurement.
    const text = await page.locator('section[aria-label="Key metrics"]').innerText();
    expect(text).not.toMatch(/\d[\d,.]*\s*(%|×)/);
  });

  test('duplicate and invalid websites are rejected with helpful messages', async ({ page }) => {
    await login(page, email);
    await gotoApp(page, `/${orgSlug}/projects`);
    await page.getByRole('link', { name: 'Ariston UAE' }).click();
    await page.getByLabel('Add a website').fill('http://WWW.example.com/pricing');
    await page.getByRole('button', { name: 'Add website', exact: true }).click();
    await expect(page.getByText('This website is already added to your organization.')).toBeVisible();
    await page.getByLabel('Add a website').fill('192.168.0.1');
    await page.getByRole('button', { name: 'Add website', exact: true }).click();
    await expect(page.getByText(/valid website address/i)).toBeVisible();
  });

  test('audit log records the work; unbuilt modules are honest', async ({ page }) => {
    await login(page, email);
    await gotoApp(page, `/${orgSlug}/settings/audit-log`);
    await expect(page.getByRole('cell', { name: 'project.created' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'website.created' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'org.created' })).toBeVisible();

    await gotoApp(page, `/${orgSlug}/seo`);
    await expect(page.getByText('SEO arrives in Phase 2')).toBeVisible();
    await gotoApp(page, `/${orgSlug}/integrations`);
    await expect(page.getByText('Not connected').first()).toBeVisible();
  });

  test('another user cannot see this organization', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const other = uniqueEmail('intruder');
    await register(page, 'Ivan Intruder', other);
    await verifyEmail(page, other);
    await login(page, other);
    await gotoApp(page, `/${orgSlug}/dashboard`);
    await expect(page.getByRole('heading', { name: "We couldn't find that" })).toBeVisible();
    await expect(page.getByText('Ariston UAE')).toHaveCount(0);
    await ctx.close();
  });

  test('invite a teammate who joins with a limited role', async ({ page, browser }) => {
    const mate = uniqueEmail('viewer');
    const mateCtx = await browser.newContext();
    const matePage = await mateCtx.newPage();
    await register(matePage, 'Vera Viewer', mate);
    await verifyEmail(matePage, mate);

    await login(page, email);
    await gotoApp(page, `/${orgSlug}/settings/members`);
    await page.getByLabel('Email').fill(mate);
    await page.getByLabel('Role').selectOption('viewer');
    await page.getByRole('button', { name: 'Send invite' }).click();
    await expect(page.getByRole('cell', { name: mate })).toBeVisible();

    const { latestMailLink } = await import('./helpers');
    const link = await latestMailLink(page, mate, /https?:\/\/[^\s"'<>\])]+\/invitations\/accept\?token=[^\s"'<>\])]+/);
    await login(matePage, mate);
    await matePage.goto(link);
    await matePage.getByRole('button', { name: 'Accept invitation' }).click();
    await expect(matePage).toHaveURL(new RegExp(`/${orgSlug}/dashboard`));

    // Viewer: can read projects, cannot create them, cannot open the audit log.
    await gotoApp(matePage, `/${orgSlug}/projects`);
    await expect(matePage.getByRole('link', { name: 'Ariston UAE' })).toBeVisible();
    await expect(matePage.getByRole('button', { name: 'New project' })).toHaveCount(0);
    await gotoApp(matePage, `/${orgSlug}/settings/audit-log`);
    await expect(matePage.getByText("You don't have access to the audit log")).toBeVisible();
    await mateCtx.close();
  });

  test('sign out ends the session', async ({ page }) => {
    await login(page, email);
    await gotoApp(page, `/${orgSlug}/dashboard`);
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login/);
    await gotoApp(page, `/${orgSlug}/dashboard`);
    await expect(page).toHaveURL(/\/login/);
  });

  test('wrong password shows an inline error and no session', async ({ page }) => {
    await page.goto('/login');
    await hydrated(page);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('not-the-password-1');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('These credentials do not match our records.')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    void PASSWORD;
  });
});
