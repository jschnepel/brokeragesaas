'use client';

import Script from 'next/script';
import { useConsent } from '@/lib/analytics/use-consent';

/**
 * Google Analytics 4 (GA4) — page-view and event tracking.
 *
 * Loads only when:
 * - consent.analytics === true (DNT auto-rejects via the consent module), AND
 * - NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 *
 * Uses next/script with `afterInteractive` strategy so it doesn't block
 * critical rendering. The gtag config call fires once on mount; subsequent
 * page-view events are handled automatically by GA4's enhanced measurement.
 */
export function GoogleAnalyticsScript() {
    const consent = useConsent();
    if (!consent.analytics) return null;

  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (!measurementId) return null;

  return (
        <>
              <Script
                        id="ga4-init"
                        strategy="afterInteractive"
                        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
                      />
              <Script id="ga4-config" strategy="afterInteractive">
                {`
                          window.dataLayer = window.dataLayer || [];
                                    function gtag(){dataLayer.push(arguments);}
                                              gtag('js', new Date());
                                                        gtag('config', '${measurementId}', {
                                                                    page_path: window.location.pathname,
                                                                              });
                                                                                      `}
              </Script>Script>
        </>>
      );
}</>
