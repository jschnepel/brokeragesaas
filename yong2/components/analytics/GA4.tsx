'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useConsent } from '@/lib/analytics/use-consent';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Google Analytics 4 (gtag.js) — pageviews, sessions, and traffic
 * source measurement.
 *
 * Loads only when:
 *   - consent.analytics === true (DNT auto-rejects via the consent module), AND
 *   - NEXT_PUBLIC_GA_MEASUREMENT_ID is set (e.g. `G-1H6WE0GTMC`).
 *
 * SPA pageview behavior: `gtag('config', ID)` would fire a pageview
 * on every gtag.js bootstrap, but in an SPA we mount gtag.js once.
 * We disable the auto-pageview (`send_page_view: false`) and emit
 * a `page_view` event ourselves on every App Router route change.
 * The initial pageview is fired by the same effect on mount.
 *
 * Consent revocation: if the visitor later opts out after gtag.js has
 * loaded, we set `ga-disable-{ID}` on `window` — the official GA4
 * kill switch that stops any further hits without unloading the
 * script. Re-enabling consent flips the flag back to false.
 */
export function GA4Script() {
  const consent = useConsent();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Honor Google's documented kill switch when consent flips after
  // the script has already loaded. Set BEFORE the script tag renders
  // so a stale grant→deny transition stops hits immediately on the
  // next gtag call without waiting for unmount.
  useEffect(() => {
    if (typeof window === 'undefined' || !id) return;
    const flag = `ga-disable-${id}`;
    (window as unknown as Record<string, unknown>)[flag] = !consent.analytics;
  }, [consent.analytics, id]);

  // SPA pageview tracking. Fires once on mount (after gtag.js is
  // ready) and again on every pathname/search change. The function
  // guard short-circuits before gtag.js finishes loading on cold
  // start — the next route change picks it up.
  useEffect(() => {
    if (!consent.analytics) return;
    if (typeof window === 'undefined' || !id) return;
    if (typeof window.gtag !== 'function') return;
    const search = searchParams?.toString();
    window.gtag('event', 'page_view', {
      page_location: window.location.href,
      page_path: pathname + (search ? `?${search}` : ''),
      page_title: document.title,
    });
  }, [pathname, searchParams, consent.analytics, id]);

  if (!consent.analytics || !id) return null;

  // Two scripts — the loader (cached cross-route at googletagmanager.com)
  // and the inline init that bootstraps the dataLayer + assigns
  // gtag onto window so our SPA pageview effect can reach it. Both
  // use `afterInteractive` so they don't compete with critical
  // assets; this matches the strategy used by Clarity above.
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${id}', { send_page_view: false, anonymize_ip: true });`}
      </Script>
    </>
  );
}
