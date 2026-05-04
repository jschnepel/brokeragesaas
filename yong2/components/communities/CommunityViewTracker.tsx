'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics/events';

/**
 * Fires `community_view` once per mount of `/communities/[slug]`. Mounted
 * inline as a client island inside an otherwise-server-rendered page; keeps
 * the page's RSC boundary intact while still giving us a typed analytics
 * call-site that depends on the resolved slug + scopeType.
 */
export function CommunityViewTracker({
  slug,
  scopeType,
}: {
  slug: string;
  scopeType: 'community' | 'region';
}) {
  useEffect(() => {
    track('community_view', { slug, scopeType });
  }, [slug, scopeType]);
  return null;
}
