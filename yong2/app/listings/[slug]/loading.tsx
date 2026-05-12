/**
 * Listing-detail loading skeleton.
 *
 * Next App Router shows the previous route until SSR for the new
 * route resolves. Without this file, clicking a listing pin or card
 * on /listings made the source page hang for ~1.5s before transition,
 * which read as "the hero appears last" — the user perceived the
 * delay as image load time when it was actually navigation latency.
 *
 * Layout mirrors the real page's hero/story/sidebar shape so the
 * transition has near-zero layout shift when SSR HTML lands.
 */
import { Navigation } from '@/components/chrome/Navigation';
import { SectionFrame } from '@/components/shared/SectionFrame';

export default function Loading() {
  return (
    <>
      <Navigation initialTransparent />

      {/* Hero placeholder — same dimensions as the real hero so the
       *  swap is seamless. Subtle pulse animation cues "loading"
       *  without being distracting. */}
      <section
        className="relative w-full overflow-hidden bg-ink-elevated"
        style={{ height: '90vh', minHeight: '640px' }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-ink/60 via-ink-elevated to-ink/80" />
        {/* Bottom overlay shape — mirrors the real overlay text block
         *  so the heading/price region doesn't visibly shift in. */}
        <div className="absolute inset-x-0 bottom-0 pb-12 md:pb-16">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 space-y-5">
            <div className="h-3 w-32 bg-stone/15 rounded-sm animate-pulse" />
            <div className="h-12 md:h-14 w-3/4 max-w-[700px] bg-stone/15 rounded-sm animate-pulse" />
            <div className="h-4 w-40 bg-stone/10 rounded-sm animate-pulse" />
            <div className="flex items-baseline gap-6 pt-3">
              <div className="h-9 w-48 bg-stone/15 rounded-sm animate-pulse" />
              <div className="h-4 w-56 bg-stone/10 rounded-sm animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Thumbnail strip placeholder */}
      <div className="hidden md:grid grid-cols-4 gap-px bg-ink" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="relative aspect-[16/9] bg-ink-elevated animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>

      {/* Story + sidebar placeholder */}
      <SectionFrame className="py-20 md:py-28" aria-hidden="true">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-12 md:gap-16">
          <div className="space-y-4">
            <div className="h-3 w-40 bg-stone/15 rounded-sm animate-pulse" />
            <div className="h-8 w-3/4 bg-stone/15 rounded-sm animate-pulse" />
            <div className="h-6 w-32 bg-stone/15 rounded-sm animate-pulse" />
            <div className="space-y-3 pt-6">
              <div className="h-4 w-full bg-stone/10 rounded-sm animate-pulse" />
              <div className="h-4 w-[95%] bg-stone/10 rounded-sm animate-pulse" />
              <div className="h-4 w-[88%] bg-stone/10 rounded-sm animate-pulse" />
              <div className="h-4 w-[92%] bg-stone/10 rounded-sm animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-48 w-full bg-ink-elevated rounded-sm animate-pulse" />
            <div className="h-32 w-full bg-ink-elevated rounded-sm animate-pulse" />
          </div>
        </div>
      </SectionFrame>
    </>
  );
}
