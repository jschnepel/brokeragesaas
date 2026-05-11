'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { FadeImage } from '@/components/shared/FadeImage';
import {
  getSavedListings,
  onSavedListingsChange,
  type SavedListingSnapshot,
} from '@/components/portfolio/HeroTopBar';

const DOLLAR = (n: number | null) =>
  n != null
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(n)
    : 'Price Upon Request';

/**
 * /saved index. Reads snapshots from localStorage written by the
 * heart toggle on listing detail pages. Pure client render — never
 * sees a user's saved set until after hydration, which is correct:
 * the data lives in the browser and there's no server-side notion
 * of identity here.
 */
export function SavedListingsClient() {
  const [items, setItems] = useState<SavedListingSnapshot[] | null>(null);

  useEffect(() => {
    setItems(getSavedListings());
    const unsub = onSavedListingsChange(() => setItems(getSavedListings()));
    return unsub;
  }, []);

  if (items === null) {
    // SSR / pre-hydration — render a minimal placeholder so the
    // page doesn't flash.
    return (
      <SectionFrame className="pt-8 pb-8">
        <Header />
      </SectionFrame>
    );
  }

  if (items.length === 0) {
    return (
      <SectionFrame className="pt-8 pb-8">
        <Header />
        <div className="border border-white/10 px-8 py-20 text-center mt-12">
          <p className="font-serif italic text-stone/80 text-xl md:text-2xl">
            No saved listings yet.
          </p>
          <p className="text-stone/55 text-sm mt-3 max-w-md mx-auto leading-relaxed">
            Click the Save button on any listing detail page and it will land
            here for easy comparison.
          </p>
          <Link
            href="/listings"
            className="caps inline-block mt-8 px-5 py-3 border border-gold/40 text-gold hover:border-gold transition-colors"
          >
            Browse listings →
          </Link>
        </div>
      </SectionFrame>
    );
  }

  return (
    <SectionFrame className="pt-8 pb-8">
      <Header count={items.length} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
        {items.map((l) => (
          <Link
            key={l.key}
            href={l.slug ? `/listings/${l.slug}` : '/listings'}
            className="relative aspect-[4/5] overflow-hidden bg-ink-elevated group block"
          >
            {l.imageUrl ? (
              <FadeImage
                src={l.imageUrl}
                alt={l.address}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-stone/30 caps text-xs">
                No photo
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4">
              {l.community ? (
                <div className="caps text-[10px] tracking-widest text-stone/75 mb-1">
                  {l.community}
                </div>
              ) : null}
              <div className="font-serif text-lg leading-tight text-stone">
                {l.address || 'Saved listing'}
              </div>
              <div className="caps text-stone/85 mt-1 tabular-nums">
                {DOLLAR(l.price)}
              </div>
              {(l.beds || l.baths || l.livingArea) && (
                <div className="text-xs text-stone/60 mt-1 tabular-nums">
                  {[
                    l.beds ? `${l.beds} bd` : null,
                    l.baths ? `${l.baths} ba` : null,
                    l.livingArea ? `${l.livingArea.toLocaleString('en-US')} sf` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </SectionFrame>
  );
}

function Header({ count }: { count?: number }) {
  return (
    <div>
      <CapsLabel as="div">Your collection</CapsLabel>
      <h1 className="display-lg italic mt-3">
        {count != null && count > 0
          ? `${count} saved ${count === 1 ? 'listing' : 'listings'}.`
          : 'Saved listings.'}
      </h1>
      <p className="text-stone/65 text-sm md:text-base mt-4 max-w-xl leading-relaxed">
        Your saved listings live in this browser. They aren't synced — switch
        devices and you'll start fresh.
      </p>
    </div>
  );
}
