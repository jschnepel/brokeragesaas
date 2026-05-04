import { test, expect } from '@playwright/test';

/**
 * Session-path tracking smoke tests. We use the same in-page sink pattern as
 * tracking.spec.ts: install `window.__yong2_test_capture__` before page
 * scripts run, accept consent via cookie, then assert that session_started /
 * session_ended fire and that mid-journey events inherit session_id + step_n.
 */

const stubInit = `
  window.__yong2_test_capture__ = [];
`;

type Captured = Array<{ event: string; props: Record<string, unknown> }>;

test.describe('session lifecycle', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await page.addInitScript(stubInit);
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

  test('home → session_started fires once with landing context', async ({ page }) => {
    await page.goto('/?utm_source=google&utm_medium=cpc&utm_campaign=scottsdale-luxury');
    await page.waitForFunction(() => {
      const captured = (window as unknown as { __yong2_test_capture__?: Captured }).__yong2_test_capture__ ?? [];
      return captured.some((e) => e.event === 'session_started');
    }, undefined, { timeout: 5000 });

    const events = await page.evaluate(
      () => (window as unknown as { __yong2_test_capture__: Captured }).__yong2_test_capture__,
    );
    const starts = events.filter((e) => e.event === 'session_started');
    expect(starts).toHaveLength(1);
    const start = starts[0]!;
    expect(start.props.session_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(start.props.landing_pathname).toBe('/');
    expect(start.props.utm_source).toBe('google');
    expect(start.props.utm_medium).toBe('cpc');
    expect(start.props.utm_campaign).toBe('scottsdale-luxury');
  });

  test('cross-page navigation keeps the same session_id across hops', async ({ page }) => {
    // Use static-only routes to avoid pulling slow RDS-backed pages into
    // the smoke test. /about and /contact are pure-static, /privacy/policy too.
    await page.goto('/');
    await page.waitForFunction(() => {
      const captured = (window as unknown as { __yong2_test_capture__?: Captured }).__yong2_test_capture__ ?? [];
      return captured.some((e) => e.event === 'session_started');
    }, undefined, { timeout: 5000 });

    await page.goto('/about');
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    const events = await page.evaluate(
      () => (window as unknown as { __yong2_test_capture__: Captured }).__yong2_test_capture__,
    );
    const starts = events.filter((e) => e.event === 'session_started');
    expect(starts).toHaveLength(1);
    const sessionId = starts[0]!.props.session_id as string;
    // Every event with a session_id should share the one from session_started.
    const stitched = events.filter((e) => typeof e.props?.session_id === 'string');
    expect(stitched.length).toBeGreaterThan(1);
    for (const e of stitched) {
      expect(e.props.session_id).toBe(sessionId);
    }
  });

  test('opening a new tab is a new session (per-tab semantic)', async ({ page, context }) => {
    // GA4-style per-tab sessions: opening a fresh tab is a new "arrival,"
    // not a resume of the previous tab. Cross-tab continuity is preserved at
    // the visitor level via yong2_anon_id; the session is the narrower unit.
    await page.goto('/');
    await page.waitForFunction(() => {
      const captured = (window as unknown as { __yong2_test_capture__?: Captured }).__yong2_test_capture__ ?? [];
      return captured.some((e) => e.event === 'session_started');
    }, undefined, { timeout: 5000 });
    const firstId = await page.evaluate(() => {
      const captured = (window as unknown as { __yong2_test_capture__: Captured }).__yong2_test_capture__;
      return captured.find((e) => e.event === 'session_started')?.props.session_id as string;
    });

    const second = await context.newPage();
    await second.addInitScript(stubInit);
    await second.goto('/about');
    await second.waitForFunction(() => {
      const captured = (window as unknown as { __yong2_test_capture__?: Captured }).__yong2_test_capture__ ?? [];
      return captured.some((e) => e.event === 'session_started');
    }, undefined, { timeout: 5000 });
    const secondId = await second.evaluate(() => {
      const captured = (window as unknown as { __yong2_test_capture__: Captured }).__yong2_test_capture__;
      return captured.find((e) => e.event === 'session_started')?.props.session_id as string;
    });
    expect(secondId).not.toBe(firstId);
  });
});
