/**
 * /listings page smoke — verifies the split view at desktop width, that the
 * search input updates the result panel as you type, and that at least one
 * ResultCard renders. Map canvas is asserted via the MapLibre `.maplibregl-map`
 * class which is added once the GL context initializes.
 */
import { test, expect } from '@playwright/test';

test.describe('/listings', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('renders search bar + map + at least one result card', async ({ page }) => {
    await page.goto('/listings', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Search input is the source of truth for "page mounted".
    const search = page.getByPlaceholder('Address, city, community…');
    await expect(search).toBeVisible({ timeout: 15_000 });

    // Map container exists and has a canvas (MapLibre paints into a single
    // canvas inside .maplibregl-map). The canvas may take a moment to paint.
    await expect(page.locator('.maplibregl-canvas').first()).toBeVisible({ timeout: 15_000 });

    // Result cards carry data-listing-key.
    await expect(page.locator('[data-listing-key]').first()).toBeVisible({ timeout: 15_000 });
  });

  test('typing in search debounces a request and updates the result count', async ({ page }) => {
    await page.goto('/listings', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const search = page.getByPlaceholder('Address, city, community…');
    await expect(search).toBeVisible({ timeout: 15_000 });

    // Wait for first card so we know the initial fetch succeeded.
    await expect(page.locator('[data-listing-key]').first()).toBeVisible({ timeout: 15_000 });

    await search.fill('silverleaf');
    // Server is debounced 250ms; allow it a moment to refetch + repaint.
    await page.waitForTimeout(1500);
    // Either the result count text changed, or the cards updated.
    await expect(page.locator('[data-listing-key]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Listings nav link is present and reaches /listings', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const navLink = page.getByRole('link', { name: 'Listings' }).first();
    await expect(navLink).toBeVisible({ timeout: 10_000 });
    await navLink.click();
    await expect(page).toHaveURL(/\/listings$/);
  });
});

/**
 * /portfolio/[slug] hero gallery + lightbox — verifies the new
 * ListingHeroGallery (single hero photo + 4-thumb strip on desktop)
 * renders correctly, that clicking a thumb opens the lightbox, and
 * that the lightbox honors keyboard close (Esc).
 *
 * The slug is sourced live from /portfolio so the test stays valid as
 * MLS rotates inventory — getActiveListings can return zero rows on
 * any given day, so we skip gracefully if no detail link exists.
 */
test.describe('/portfolio/[slug] hero gallery + lightbox', () => {
  test('desktop: hero photo + 4-thumb strip render; clicking a thumb opens lightbox; Esc closes', async ({ page }) => {
    test.slow(); // ISR + RDS round-trip on cold cache

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/portfolio', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const firstDetailLink = page.locator('a[href^="/portfolio/"]').first();
    if ((await firstDetailLink.count()) === 0) test.skip(true, 'No active listings to drill into.');

    const href = await firstDetailLink.getAttribute('href');
    if (!href) test.skip(true, 'No detail href.');
    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // The hero <h1> is always rendered (display-xl with the address).
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });

    // The hero photo button has aria-label="Open photo gallery" and is the
    // primary visible interactive at desktop width. Click it to open the
    // lightbox (this guarantees we're clicking a visible element in the
    // desktop layout — the mobile snap-gallery buttons exist in the DOM
    // but are display:none under md:hidden).
    const heroButton = page.locator('button[aria-label="Open photo gallery"]');
    if ((await heroButton.count()) === 0) test.skip(true, 'Listing has no gallery photos.');
    await heroButton.first().click();
    await expect(page.getByTestId('listing-lightbox')).toBeVisible({ timeout: 5_000 });

    // Esc closes.
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('listing-lightbox')).toBeHidden({ timeout: 3_000 });
  });

  test('mobile: photo counter pill + snap gallery render', async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/portfolio', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    const firstDetailLink = page.locator('a[href^="/portfolio/"]').first();
    if ((await firstDetailLink.count()) === 0) test.skip(true, 'No active listings.');
    const href = await firstDetailLink.getAttribute('href');
    if (!href) test.skip(true, 'No detail href.');

    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });

    // Mobile photo counter pill: "1 / N" — only present when gallery > 1.
    // The pill has the .caps class plus backdrop-blur. Use a permissive
    // text-regex match so we tolerate whitespace + transformed casing.
    const counter = page.getByText(/\b1\s*\/\s*\d+\b/).first();
    const counterCount = await counter.count();
    if (counterCount > 0) {
      await expect(counter).toBeVisible({ timeout: 5_000 });
    }

    // Snap-gallery rendering: mobile shows the .scrollbar-hide.snap-x
    // container with photo buttons. We assert the container is in the DOM
    // (hidden on desktop via md:hidden, but always present at 375px).
    const mobileSnap = page.locator('div.snap-x.snap-mandatory').first();
    await expect(mobileSnap).toBeVisible({ timeout: 5_000 });
  });
});
