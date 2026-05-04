import { test, expect } from '@playwright/test';

/**
 * E2E coverage for "The Read" analytics block on the listing detail page.
 *
 * The block depends on live mv_active_listings + mv_community_scorecard data
 * for a real listing. We resolve a slug dynamically by hitting /portfolio
 * and following the first listing link. If the portfolio is empty (e.g. when
 * the MV is still being rebuilt by the parallel-thread DDL work), we skip the
 * test rather than fail — surface that condition in the test report instead.
 */
test.describe('The Read · listing detail analytics block', () => {
  test('renders below the location map on a real listing', async ({ page }) => {
    await page.goto('/portfolio');
    const firstLink = page.locator('a[href^="/portfolio/"]').first();
    const count = await firstLink.count();
    test.skip(count === 0, 'Portfolio is empty — likely waiting on MV rebuild');

    const href = await firstLink.getAttribute('href');
    test.skip(!href, 'No listing href to follow');

    await page.goto(href as string);

    // The Read should appear below the map.
    const block = page.locator('[data-testid="the-read"]');
    await expect(block).toBeVisible({ timeout: 15000 });

    // Header
    await expect(block.getByText('The Read', { exact: true })).toBeVisible();

    // KPI strip — at least 4 of the 5 cells should render labels.
    const labels = ['Days on Market', '$/Sqft', 'Months of Supply', 'Price History'];
    for (const lbl of labels) {
      await expect(block.getByText(lbl, { exact: true }).first()).toBeVisible();
    }

    // Comps column or its empty-state.
    const comps = block.getByText('Currently Listed Nearby');
    await expect(comps).toBeVisible();
  });
});
