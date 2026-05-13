import Link from 'next/link';
import type { Listing } from '@/lib/types';

/**
 * Crawler-readable inventory list — emitted server-side inside the
 * Suspense boundary so the first byte that reaches a non-JS client
 * (curl, AI summarisers, older crawlers, screen readers if they
 * preferred quiet markup) carries real addresses, prices, and href
 * links. Without this the page is only renderable after JS executes
 * the interactive `ListingsClient`, which means crawlers see the
 * skeleton fallback and nothing else (audit item 2.1).
 *
 * Visually hidden via `sr-only` and marked `aria-hidden="true"` so it
 * doesn't fight the cinematic split-view layout for sighted JS users
 * or compete with the interactive UI for screen-reader users (those
 * still hear the rich ResultsList in the right pane). The list is
 * pure HTML — no client component, no hydration cost.
 */
export interface ListingsSeoListProps {
  listings: Listing[];
  total: number;
}

const NUM = (n: number) => n.toLocaleString('en-US');

function formatStats(l: Listing): string {
  const parts: string[] = [];
  if (l.bedrooms != null) parts.push(`${l.bedrooms} bd`);
  if (l.bathroomsTotal != null) parts.push(`${l.bathroomsTotal} ba`);
  if (l.livingArea != null) parts.push(`${NUM(l.livingArea)} sqft`);
  return parts.join(' · ');
}

export function ListingsSeoList({ listings, total }: ListingsSeoListProps) {
  if (listings.length === 0) {
    return (
      <div className="sr-only" aria-hidden="true">
        <h2>Active listings</h2>
        <p>No active listings currently match the default Phoenix-metro view.</p>
      </div>
    );
  }
  return (
    <div className="sr-only" aria-hidden="true">
      <h2>Active listings ({NUM(total)})</h2>
      <p>
        Server-rendered inventory snapshot for crawlers and accessibility tools. The
        interactive map and filters above are the canonical search surface for sighted
        users; this list mirrors the same default view (Phoenix metro · highest price).
      </p>
      <ul>
        {listings.map((l) => {
          const address = l.unparsedAddress?.trim() || `Listing ${l.listingId ?? l.listingKey}`;
          const community = l.community || l.city || 'Phoenix metro';
          const price = l.listPrice != null ? `$${NUM(l.listPrice)}` : 'Price on request';
          const stats = formatStats(l);
          const mls = l.listingId ? ` · MLS #${l.listingId}` : '';
          return (
            <li key={l.listingKey}>
              <Link href={`/listings/${l.slug}`}>
                {address} — {community} — {price}
                {stats ? ` — ${stats}` : ''}
                {mls}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
