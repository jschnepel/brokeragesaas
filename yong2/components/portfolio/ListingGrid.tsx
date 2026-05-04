'use client';

import { useMemo, useState } from 'react';
import type { Listing } from '@/lib/types';
import { ListingTile } from './ListingTile';

type ListingGridProps = { listings: Listing[] };
type StatusFilter = 'All' | 'Active' | 'Coming Soon' | 'Pending';
const FILTERS: StatusFilter[] = ['All', 'Active', 'Coming Soon', 'Pending'];

function matchesFilter(status: string, f: StatusFilter): boolean {
  if (f === 'All') return true;
  if (f === 'Pending') return status === 'Pending' || status === 'Active Under Contract';
  return status === f;
}

export function ListingGrid({ listings }: ListingGridProps) {
  const [filter, setFilter] = useState<StatusFilter>('All');
  const filtered = useMemo(
    () => listings.filter((l) => matchesFilter(l.status, filter)),
    [filter, listings],
  );
  return (
    <>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/10 pb-6 mb-10">
        {/* Page-level h1 lives in PageHero — this is the filter bar
         * heading; demoted to a caps eyebrow so it doesn't compete. */}
        <h2 className="caps text-gold">Filter the collection</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`caps whitespace-nowrap ${filter === f ? 'text-stone border-b border-gold pb-1' : 'text-gold hover:text-stone'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((l) => <ListingTile key={l.listingKey} listing={l} />)}
      </div>
      {filtered.length === 0 ? <p className="mt-16 text-center text-mute">No listings in this view.</p> : null}
    </>
  );
}
