'use client';

import { Analytics } from '@vercel/analytics/next';
import { useConsent } from '@/lib/analytics/use-consent';

/**
 * Vercel Web Analytics — first-party CWV + pageview counts. Included with
 * the existing Vercel plan, so $0 incremental cost.
 *
 * The SDK respects DNT automatically and does not drop a tracking cookie by
 * default, but we still gate it behind `consent.analytics` for consistency
 * with Clarity / PostHog and to keep the cookie disclosure honest.
 */
export function VercelAnalyticsScript() {
  const consent = useConsent();
  if (!consent.analytics) return null;
  const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  return <Analytics mode={mode} />;
}
