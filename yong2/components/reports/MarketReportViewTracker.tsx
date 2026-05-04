'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics/events';

/**
 * Fires `market_report_view` once per mount of `/market-reports/[slug]`.
 * Mounted inside the otherwise-server page so the route stays statically
 * generated while still emitting the event reliably on hydration.
 */
export function MarketReportViewTracker({
  slug,
  quarter,
}: {
  slug: string;
  quarter: string;
}) {
  useEffect(() => {
    track('market_report_view', { slug, quarter });
  }, [slug, quarter]);
  return null;
}
