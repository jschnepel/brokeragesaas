'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics/events';
import { recordListingView } from '@/lib/analytics/contact-payload';
import type { Listing } from '@/lib/types';

type Source = 'home' | 'portfolio' | 'listings' | 'search' | 'community' | 'direct';

/**
 * Mounted inside `app/portfolio/[slug]/page.tsx`. Fires:
 *   - listing_view on mount (with a derived `source` from the referrer)
 *   - listing_view_long after 30s (still on page)
 *   - listing_scroll_to_facts / _to_map / _to_the_read via IntersectionObserver
 *
 * The observed sections are matched by `data-track="..."` attributes on the
 * listing detail page rather than by class names, so a styling refactor can't
 * silently break the analytics.
 */
type Props = { listing: Listing; source?: Source };

export function ListingDetailTracker({ listing, source }: Props) {
  useEffect(() => {
    const resolvedSource: Source = source ?? deriveSourceFromReferrer();

    track('listing_view', {
      listingKey: listing.listingKey,
      address: listing.unparsedAddress,
      price: listing.listPrice,
      community: listing.communityName ?? null,
      source: resolvedSource,
    });
    // Persistent behavior store — drives the lead-score signals
    // "uniqueListingViews" and "maxListingPrice" at form submission time.
    recordListingView(listing.listingKey, listing.listPrice ?? null);

    const t = setTimeout(() => {
      track('listing_view_long', {
        listingKey: listing.listingKey,
        ms_on_page: 30_000,
      });
    }, 30_000);

    type ScrollEvent =
      | 'listing_scroll_to_facts'
      | 'listing_scroll_to_map'
      | 'listing_scroll_to_the_read';
    const observe = (selector: string, event: ScrollEvent): IntersectionObserver | null => {
      const el = document.querySelector(selector);
      if (!el) return null;
      let fired = false;
      const obs = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && !fired) {
              fired = true;
              track(event, { listingKey: listing.listingKey });
              obs.disconnect();
            }
          }
        },
        { threshold: 0.4 },
      );
      obs.observe(el);
      return obs;
    };

    const obs1 = observe('[data-track="facts"]', 'listing_scroll_to_facts');
    const obs2 = observe('[data-track="map"]', 'listing_scroll_to_map');
    const obs3 = observe('[data-track="the-read"]', 'listing_scroll_to_the_read');

    return () => {
      clearTimeout(t);
      obs1?.disconnect();
      obs2?.disconnect();
      obs3?.disconnect();
    };
  }, [
    listing.listingKey,
    listing.unparsedAddress,
    listing.listPrice,
    listing.communityName,
    source,
  ]);

  return null;
}

function deriveSourceFromReferrer(): Source {
  if (typeof document === 'undefined') return 'direct';
  const referrer = document.referrer;
  if (!referrer) return 'direct';
  try {
    const r = new URL(referrer);
    if (r.hostname !== window.location.hostname) return 'direct';
    if (r.pathname === '/') return 'home';
    if (r.pathname.startsWith('/portfolio')) return 'portfolio';
    if (r.pathname.startsWith('/listings')) return 'listings';
    if (r.pathname.startsWith('/communities')) return 'community';
    return 'direct';
  } catch {
    return 'direct';
  }
}
