'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useConsent } from '@/lib/analytics/use-consent';
import { posthog } from './PostHog';

/**
 * SPA pageview tracker. We disabled `capture_pageview` in PostHog init so we
 * could control the pathname/search reporting ourselves; this effect fires
 * `$pageview` on every Next.js route change once consent + PostHog are ready.
 */
export function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const consent = useConsent();

  useEffect(() => {
    if (!consent.analytics) return;
    if (typeof window === 'undefined') return;
    const ph = posthog as unknown as { __loaded?: boolean; capture?: (event: string, props: Record<string, unknown>) => void };
    if (!ph.__loaded || !ph.capture) return;

    ph.capture('$pageview', {
      $current_url: window.location.href,
      pathname,
      search: searchParams?.toString() || undefined,
    });
  }, [pathname, searchParams, consent.analytics]);

  return null;
}
