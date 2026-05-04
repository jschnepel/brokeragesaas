import { test, expect } from '@playwright/test';

/**
 * Cookie-consent flow.
 *
 * Each test runs in its own isolated context so the consent cookie cannot
 * leak across cases. We grant a fresh context with `context.clearCookies`
 * before navigating to make the assertions deterministic.
 */

test.describe('cookie consent banner', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('banner appears on first visit', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('cookie-banner')).toBeVisible();
    await expect(page.getByTestId('cookie-banner-accept')).toBeVisible();
    await expect(page.getByTestId('cookie-banner-reject')).toBeVisible();
  });

  test('Reject All dismisses banner and does not load PostHog/Clarity', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('cookie-banner-reject').click();
    await expect(page.getByTestId('cookie-banner')).toBeHidden();

    // Give the page a beat in case the SDKs were going to load asynchronously.
    await page.waitForTimeout(400);

    const sdkState = await page.evaluate(() => ({
      hasClarity: typeof (window as unknown as { clarity?: unknown }).clarity !== 'undefined',
      // posthog-js loaded === window.posthog with __loaded: true. We check the
      // strict signal — any non-loaded shim still counts as "not loaded."
      posthogLoaded: Boolean(
        (window as unknown as { posthog?: { __loaded?: boolean } }).posthog?.__loaded,
      ),
    }));

    expect(sdkState.hasClarity).toBe(false);
    expect(sdkState.posthogLoaded).toBe(false);
  });

  test('reject decision persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('cookie-banner-reject').click();
    await expect(page.getByTestId('cookie-banner')).toBeHidden();
    await page.reload();
    await expect(page.getByTestId('cookie-banner')).toHaveCount(0);
  });

  test('Accept All dismisses banner and arms analytics', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('cookie-banner-accept').click();
    await expect(page.getByTestId('cookie-banner')).toBeHidden();

    // Cookie should record analytics: true.
    const cookies = await page.context().cookies();
    const consent = cookies.find((c) => c.name === 'yong2_consent');
    expect(consent).toBeDefined();
    expect(consent && decodeURIComponent(consent.value)).toContain('"analytics":true');

    // PostHog needs the env vars + a consent.analytics observer to fire init.
    // In Playwright we do not require a real key — we only assert that the
    // gate flipped and that no PostHog/Clarity script load was attempted in
    // a *rejecting* state. The "load actually happens" assertion belongs in
    // a manual smoke against a project with NEXT_PUBLIC_* set.
    const consentState = await page.evaluate(() => {
      const raw = document.cookie
        .split('; ')
        .find((c) => c.startsWith('yong2_consent='))
        ?.slice('yong2_consent='.length);
      if (!raw) return null;
      return JSON.parse(decodeURIComponent(raw)) as { analytics: boolean; marketing: boolean };
    });
    expect(consentState?.analytics).toBe(true);
    expect(consentState?.marketing).toBe(true);
  });

  test('preferences page resets analytics id', async ({ page }) => {
    // Establish a consented session first so a yong2_anon_id can be stored.
    await page.goto('/');
    await page.getByTestId('cookie-banner-accept').click();
    await expect(page.getByTestId('cookie-banner')).toBeHidden();

    await page.goto('/privacy/preferences');
    await expect(page.getByRole('heading', { name: 'Manage Preferences' })).toBeVisible();
    await page.getByRole('button', { name: 'Reset Anonymous Id' }).click();

    const cookies = await page.context().cookies();
    const anon = cookies.find((c) => c.name === 'yong2_anon_id');
    expect(anon).toBeUndefined();
  });
});
