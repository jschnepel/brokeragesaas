'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { track } from '@/lib/analytics/events';

interface ListingLightboxProps {
  photos: string[];
  address: string;
  initialIndex?: number;
  onClose: () => void;
  /**
   * Listing key for analytics. Optional so non-listing-detail callers (none
   * exist today) wouldn't break, but listing-detail always passes this.
   */
  listingKey?: string;
}

/**
 * Distance from `currentIndex` (in either swipe direction) within which
 * the main mobile photo loads eagerly. Photos beyond this range still
 * mount their `<img>` element — the browser's native `loading="lazy"`
 * defers their fetch until they're about to scroll into view, so all
 * photos remain reachable via swipe without paying the bandwidth cost
 * up front.
 */
const PRELOAD_RANGE = 2;

/**
 * Fullscreen photo lightbox for listing detail pages.
 *
 * Adapted from the premium-site GalleryLightbox; tabbed sections were
 * removed since yong2 photos aren't categorized. Keyboard, focus management,
 * mobile swipe, and ±2 neighbor preload are preserved.
 */
type ViewMode = 'carousel' | 'grid';

export function ListingLightbox({ photos, address, initialIndex = 0, onClose, listingKey }: ListingLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [viewMode, setViewMode] = useState<ViewMode>('carousel');
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const thumbContainerRef = useRef<HTMLDivElement>(null);
  // Track which photo indices the visitor actually viewed and how long the
  // gallery was open so we can calculate engagement quality, not just opens.
  const viewedRef = useRef<Set<number>>(new Set([initialIndex]));
  const openedAtRef = useRef<number>(Date.now());

  const total = photos.length;

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    overlayRef.current?.focus();
    const restore = previousFocusRef.current;
    return () => { restore?.focus?.(); };
  }, []);

  // Fire `gallery_close` exactly once when the lightbox unmounts. Captures
  // dwell time + breadth (how many photos the user actually looked at).
  useEffect(() => {
    return () => {
      if (!listingKey) return;
      track('gallery_close', {
        listingKey,
        ms_in_gallery: Date.now() - openedAtRef.current,
        photos_viewed: viewedRef.current.size,
      });
    };
  }, [listingKey]);

  // Each new index counts as a photo view. We dedupe via the Set so swiping
  // back and forth doesn't inflate the count.
  useEffect(() => {
    if (!listingKey) return;
    if (!viewedRef.current.has(currentIndex)) {
      viewedRef.current.add(currentIndex);
    }
    track('gallery_photo_view', { listingKey, index: currentIndex });
  }, [currentIndex, listingKey]);

  const goTo = useCallback((index: number) => {
    if (total === 0) return;
    setCurrentIndex(((index % total) + total) % total);
  }, [total]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // Grid view → back to carousel; carousel → close lightbox.
        if (viewMode === 'grid') {
          setViewMode('carousel');
        } else {
          onClose();
        }
      }
      // Arrow keys only navigate within the carousel view.
      if (viewMode === 'carousel') {
        if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
        if (e.key === 'ArrowRight') goTo(currentIndex + 1);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, goTo, onClose, viewMode]);

  useEffect(() => {
    const container = thumbContainerRef.current;
    if (!container) return;
    const thumb = container.children[currentIndex] as HTMLElement | undefined;
    if (thumb) thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentIndex]);

  /**
   * Circular distance between `index` and `currentIndex` along the
   * photo carousel — accounts for wrap-around (last photo neighbors
   * the first). Used to bias eager loading toward the visitor's
   * current view without gating render of distant photos.
   */
  const circularDistance = (index: number) => {
    if (total === 0) return 0;
    return Math.min(
      Math.abs(index - currentIndex),
      Math.abs(index - currentIndex + total),
      Math.abs(index - currentIndex - total),
    );
  };

  if (total === 0) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] bg-black/95 flex flex-col"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      data-testid="listing-lightbox"
    >
      {/* Header — counter + grid toggle + close */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="caps text-stone/60">
          {viewMode === 'carousel' ? `${currentIndex + 1} / ${total}` : `All ${total} photos`}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'carousel' ? 'grid' : 'carousel')}
            className={`caps text-[10px] tracking-[0.28em] px-3 py-2 border transition-colors ${
              viewMode === 'grid'
                ? 'border-gold text-gold bg-gold/10'
                : 'border-stone/25 text-stone/70 hover:border-gold hover:text-gold'
            }`}
            aria-pressed={viewMode === 'grid'}
            aria-label={viewMode === 'grid' ? 'View as carousel' : 'View all photos as grid'}
          >
            {viewMode === 'grid' ? 'Carousel' : 'All photos'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-stone/60 hover:text-gold transition-colors p-2"
            aria-label="Close gallery"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        // Grid view — every photo as a tile. Click any tile to jump
        // back to the carousel at that index. Native lazy loading on
        // each <img> keeps memory bounded for 50+ photo galleries.
        <div className="flex-1 overflow-y-auto px-3 md:px-6 pb-6">
          <div
            className="grid gap-2 md:gap-3"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            }}
          >
            {photos.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setCurrentIndex(i);
                  setViewMode('carousel');
                }}
                className={`relative aspect-[4/3] overflow-hidden bg-stone/10 group transition-transform ${
                  i === currentIndex ? 'ring-1 ring-gold' : ''
                }`}
                aria-label={`View photo ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${address} photo ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
                <span className="absolute top-1.5 left-1.5 caps text-[9px] tracking-widest text-stone/85 bg-ink/65 px-1.5 py-0.5 tabular-nums">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
      <>
      {/* Main image */}
      <div className="flex-1 flex items-center justify-center relative px-4 min-h-0">
        <button
          type="button"
          onClick={() => goTo(currentIndex - 1)}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center text-stone/40 hover:text-gold transition-colors"
          aria-label="Previous photo"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Desktop: single image (plain <img> for object-contain at full size) */}
        <div className="hidden md:flex items-center justify-center w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[currentIndex]}
            alt={`${address} photo ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain transition-opacity duration-200"
          />
          {[-2, -1, 1, 2].map((offset) => {
            const idx = ((currentIndex + offset) % total + total) % total;
            if (idx === currentIndex) return null;
            return <link key={idx} rel="preload" as="image" href={photos[idx]} />;
          })}
        </div>

        {/* Mobile: swipe gallery — every photo renders so the visitor can
         *  swipe to any of them. Neighbors within ±PRELOAD_RANGE load
         *  eagerly so the current photo and the next/prev are decoded
         *  before the visitor swipes; everything else uses native
         *  loading="lazy" and decodes only when scrolled into view. */}
        <div className="md:hidden w-full h-full overflow-x-auto scrollbar-hide snap-x snap-mandatory flex">
          {photos.map((url, i) => {
            const eager = circularDistance(i) <= PRELOAD_RANGE;
            return (
              <div key={i} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${address} photo ${i + 1}`}
                  className="max-w-full max-h-full object-contain"
                  loading={eager ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => goTo(currentIndex + 1)}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center text-stone/40 hover:text-gold transition-colors"
          aria-label="Next photo"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Thumbnail rail (desktop) — every thumb renders; native
       *  loading="lazy" defers the bytes for thumbs not yet scrolled
       *  into the rail's viewport so memory stays bounded even for
       *  50+ photo galleries. */}
      <div
        ref={thumbContainerRef}
        className="hidden md:flex gap-1 px-4 py-3 overflow-x-auto scrollbar-hide justify-center shrink-0"
      >
        {photos.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIndex(i)}
            className={`w-16 h-12 flex-shrink-0 overflow-hidden transition-opacity ${
              i === currentIndex ? 'opacity-100 ring-1 ring-gold' : 'opacity-40 hover:opacity-70'
            }`}
            aria-label={`Go to photo ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>
      </>
      )}
    </div>
  );
}
