'use client';

import Link from 'next/link';
import { track } from '@/lib/analytics/events';

/**
 * Thin client wrapper around the listing-detail "Request a Private Tour"
 * link. We need a client component just so the onClick handler can fire the
 * `cta_request_tour_click` event before the navigation; the link itself is
 * still a regular Next `<Link>` so prefetch and routing stay intact.
 */
export function RequestTourCta({ href, listingKey }: { href: string; listingKey: string }) {
  return (
    <Link
      href={href}
      onClick={() => track('cta_request_tour_click', { listingKey })}
      className="caps bg-gold text-ink px-6 py-4 hover:bg-stone transition-colors"
    >
      Request a Private Tour →
    </Link>
  );
}
