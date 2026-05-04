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
      className="caps inline-flex items-center gap-3 bg-gold text-ink px-7 py-4 hover:bg-gold-muted transition-colors group"
    >
      <span>Request a Private Tour</span>
      <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
    </Link>
  );
}
