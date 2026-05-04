import { test, expect } from '@playwright/test';

/**
 * Phase 2 lead-tracking call-site verification.
 *
 * We don't have a real PostHog project key in CI/dev, so the actual SDK
 * never loads. Instead we install a stub on `window.posthog` *before* the
 * page scripts run and assert the stub gets called from our `track()`
 * helper. The stub mimics the surface the events module checks
 * (`__loaded === true`, `capture`, `identify`).
 *
 * Each test runs in a fresh context so the consent cookie can't leak.
 */

// Initialize the in-page sink that `lib/analytics/events.ts` writes to when
// it detects a Playwright-managed test environment. Setting this before any
// page script runs means every `track()` call gets recorded regardless of
// whether PostHog itself loaded (in CI/dev there's no NEXT_PUBLIC_POSTHOG_KEY,
// so the real SDK never inits — but we still want to assert call sites).
const stubInit = `
  window.__yong2_test_capture__ = [];
`;

test.describe('lead-tracking call sites', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    // Inject the PostHog stub before any page script runs.
    await page.addInitScript(stubInit);
    // Stub consent to "accepted" so our tracking gate is open immediately.
    // The consent cookie is the source of truth for `useConsent()`.
    const consent = encodeURIComponent(
      JSON.stringify({
        necessary: true,
        analytics: true,
        marketing: true,
        decidedAt: new Date().toISOString(),
        version: 1,
      }),
    );
    await context.addCookies([
      {
        name: 'yong2_consent',
        value: consent,
        domain: 'localhost',
        path: '/',
        sameSite: 'Lax',
      },
    ]);
  });

  test('home → MarketBlurb fires cta_market_intelligence_click', async ({ page }) => {
    await page.goto('/');
    // Prevent navigation so we can read the in-page sink before it resets.
    await page.evaluate(() => {
      document.addEventListener(
        'click',
        (e) => {
          const a = (e.target as HTMLElement | null)?.closest('a');
          if (a && /market-reports/.test(a.getAttribute('href') ?? '')) e.preventDefault();
        },
        true,
      );
    });
    await page.getByRole('link', { name: /Read the Reports/i }).first().click();
    await page.waitForFunction(() => {
      const captured = (window as unknown as { __yong2_test_capture__?: { event: string }[] }).__yong2_test_capture__ ?? [];
      return captured.some((e) => e.event === 'cta_market_intelligence_click');
    }, undefined, { timeout: 5000 });
  });

  test('communities slug page fires community_view', async ({ page }) => {
    await page.goto('/communities/silverleaf');
    // Give the client effect a tick to fire.
    await page.waitForFunction(() => {
      const captured = (window as unknown as { __yong2_test_capture__?: { event: string }[] }).__yong2_test_capture__ ?? [];
      return captured.some((e) => e.event === 'community_view');
    }, undefined, { timeout: 5000 });
    const events = await page.evaluate(() => (window as unknown as { __yong2_test_capture__: { event: string; props: unknown }[] }).__yong2_test_capture__);
    const view = events.find((e) => e.event === 'community_view');
    expect(view).toBeDefined();
    expect((view!.props as { slug: string }).slug).toBe('silverleaf');
  });

  test('market-reports slug page fires market_report_view', async ({ page }) => {
    await page.goto('/market-reports/q1-2026');
    await page.waitForFunction(() => {
      const captured = (window as unknown as { __yong2_test_capture__?: { event: string }[] }).__yong2_test_capture__ ?? [];
      return captured.some((e) => e.event === 'market_report_view');
    }, undefined, { timeout: 5000 });
    const events = await page.evaluate(() => (window as unknown as { __yong2_test_capture__: { event: string; props: unknown }[] }).__yong2_test_capture__);
    const view = events.find((e) => e.event === 'market_report_view');
    expect(view).toBeDefined();
  });

  test('contact page fires contact_form_view + focus_first + field_complete', async ({ page }) => {
    await page.goto('/contact');
    // contact_form_view fires on mount.
    await page.waitForFunction(() => {
      const captured = (window as unknown as { __yong2_test_capture__?: { event: string }[] }).__yong2_test_capture__ ?? [];
      return captured.some((e) => e.event === 'contact_form_view');
    }, undefined, { timeout: 5000 });

    // Focus + fill the name field, then blur.
    const name = page.getByLabel('Your Name');
    await name.focus();
    await name.fill('Test User');
    await name.blur();

    await page.waitForFunction(() => {
      const captured = (window as unknown as { __yong2_test_capture__?: { event: string }[] }).__yong2_test_capture__ ?? [];
      return (
        captured.some((e) => e.event === 'contact_form_focus_first') &&
        captured.some((e) => e.event === 'contact_form_field_complete')
      );
    }, undefined, { timeout: 5000 });

    const events = await page.evaluate(() => (window as unknown as { __yong2_test_capture__: { event: string }[] }).__yong2_test_capture__);
    const names = events.map((e) => e.event);
    expect(names).toContain('contact_form_view');
    expect(names).toContain('contact_form_focus_first');
    expect(names).toContain('contact_form_field_complete');
  });

  test('global anchor delegate fires cta_email_click on mailto:', async ({ page }) => {
    await page.goto('/contact');
    // Don't actually navigate — preventDefault on the click. We attach a
    // capturing listener that calls e.preventDefault() *after* the delegate
    // runs so the delegate still fires, but the browser doesn't try to
    // launch a mail client.
    await page.evaluate(() => {
      document.addEventListener(
        'click',
        (e) => {
          const a = (e.target as HTMLElement | null)?.closest('a');
          if (a && a.protocol === 'mailto:') e.preventDefault();
        },
        true,
      );
    });
    const mailto = page.locator('a[href^="mailto:"]').first();
    await mailto.click();
    await page.waitForFunction(() => {
      const captured = (window as unknown as { __yong2_test_capture__?: { event: string }[] }).__yong2_test_capture__ ?? [];
      return captured.some((e) => e.event === 'cta_email_click');
    }, undefined, { timeout: 5000 });
  });
});
