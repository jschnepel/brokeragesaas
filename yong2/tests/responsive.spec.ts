/**
 * Responsive smoke — visits every public surface at iPhone-SE (375),
 * iPad-portrait (768), and small-laptop (1024) widths, asserts no
 * horizontal scroll, asserts the hero/headline is visible, and saves
 * a screenshot for human review.
 *
 * Run via `npm run test:e2e`. Screenshots are written to
 * `tests/screenshots/` which is gitignored.
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'tests', 'screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const VIEWPORTS = [
  { label: '375', width: 375, height: 812 },
  { label: '768', width: 768, height: 1024 },
  { label: '1024', width: 1024, height: 768 },
] as const;

// One representative listing slug + community slug + report slug are
// resolved at runtime from the index pages so the spec is resilient
// to data churn (no hard-coded MLS IDs). Uses an attribute-prefix CSS
// selector so we never have to reach into page.evaluate.
async function pickFirstSlug(
  page: Page,
  indexUrl: string,
  hrefPrefix: string,
): Promise<string | null> {
  await page.goto(indexUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  const links = page.locator(`a[href^="${hrefPrefix}/"]`);
  const count = await links.count();
  for (let i = 0; i < count; i += 1) {
    const href = await links.nth(i).getAttribute('href');
    if (href && href.length > hrefPrefix.length + 1) return href;
  }
  return null;
}

async function assertNoHorizontalScroll(page: Page, viewport: string, route: string) {
  const overflow = await page.evaluate(() => {
    const docW = document.documentElement.scrollWidth;
    const cliW = document.documentElement.clientWidth;
    return { scrollWidth: docW, clientWidth: cliW, diff: docW - cliW };
  });
  // Allow a 2px tolerance for sub-pixel rounding.
  expect(
    overflow.diff,
    `Horizontal overflow on ${route} @ ${viewport}: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`,
  ).toBeLessThanOrEqual(2);
}

async function snap(page: Page, route: string, viewport: string) {
  const safeRoute = route.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'home';
  const file = path.join(SCREENSHOT_DIR, `${safeRoute}-${viewport}.png`);
  await page.screenshot({ path: file, fullPage: true });
}

const STATIC_ROUTES = [
  { route: '/', heroSelector: 'h1' },
  { route: '/portfolio', heroSelector: 'h1' },
  { route: '/communities', heroSelector: 'h1' },
  { route: '/about', heroSelector: 'h1' },
  { route: '/contact', heroSelector: 'h1' },
  { route: '/market-reports', heroSelector: 'h1' },
] as const;

for (const v of VIEWPORTS) {
  test.describe(`Responsive @ ${v.label}px`, () => {
    test.use({ viewport: { width: v.width, height: v.height } });

    for (const r of STATIC_ROUTES) {
      test(`${r.route} renders without horizontal overflow`, async ({ page }) => {
        await page.goto(r.route, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => {});
        await expect(page.locator(r.heroSelector).first()).toBeVisible({ timeout: 10_000 });
        await snap(page, r.route, v.label);
        await assertNoHorizontalScroll(page, v.label, r.route);
      });
    }

    test(`/portfolio/[first-active] renders fact sheet without overflow`, async ({ page }) => {
      const slug = await pickFirstSlug(page, '/portfolio', '/portfolio');
      test.skip(!slug, 'No active listings available to test detail page');
      await page.goto(slug!, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      await expect(page.locator('h1').first()).toBeVisible();
      // Fact sheet is a <dl> with "Price" caps row
      await expect(page.getByText('Price', { exact: true }).first()).toBeVisible();
      await snap(page, slug!, v.label);
      await assertNoHorizontalScroll(page, v.label, slug!);
    });

    test(`/communities/[first] renders KPI strip without overflow`, async ({ page }) => {
      const slug = await pickFirstSlug(page, '/communities', '/communities');
      test.skip(!slug, 'No communities available to test detail page');
      await page.goto(slug!, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      await expect(page.locator('h1').first()).toBeVisible();
      await snap(page, slug!, v.label);
      await assertNoHorizontalScroll(page, v.label, slug!);
    });

    test(`/market-reports/[first] renders charts without overflow`, async ({ page }) => {
      const slug = await pickFirstSlug(page, '/market-reports', '/market-reports');
      test.skip(!slug, 'No market reports available to test detail page');
      await page.goto(slug!, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      await expect(page.locator('h1').first()).toBeVisible();
      // Wait briefly for dynamic-imported charts to mount
      await page.waitForTimeout(800);
      await snap(page, slug!, v.label);
      await assertNoHorizontalScroll(page, v.label, slug!);
    });
  });
}

test.describe('Mobile nav', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test('burger button toggles mobile menu', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const burger = page.getByRole('button', { name: 'Open menu' });
    await expect(burger).toBeVisible();
    const menu = page.locator('#mobile-menu');
    await expect(menu).toBeHidden();
    await burger.click();
    await expect(menu).toBeVisible();
  });
});
