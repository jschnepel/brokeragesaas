'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { siteContent } from '@/content/site';
import { track } from '@/lib/analytics/events';

type StickyContactProps = {
  /** Listing key for analytics — every interaction is stitched to the listing. */
  listingKey: string;
  /** Tour-request href with the listing pre-filled. */
  tourHref: string;
};

/**
 * Sticky contact pill — bottom-right floating action group, appears once
 * the visitor scrolls past the hero gallery. Persistent buyer-action
 * affordance per the luxury IDX baseline (sticky CTA, click-to-call,
 * thumb-friendly mobile placement).
 *
 * Two affordances stacked: phone (primary call action) + tour request.
 * Mobile: shrinks to a circular phone-only pill to avoid eating thumb
 * space; tap reveals both.
 */
export function StickyContact({ listingKey, tourHref }: StickyContactProps) {
  const [visible, setVisible] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  useEffect(() => {
    function onScroll() {
      // Reveal once the visitor has scrolled past ~half the hero
      // (which is 65vh, so ~32vh) — avoids competing with the hero
      // overlay's price + quick stats.
      setVisible(window.scrollY > window.innerHeight * 0.32);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Desktop / tablet — full pill, always-expanded */}
      <div
        className="hidden md:flex fixed bottom-6 right-6 z-40 items-center gap-2 bg-ink/95 backdrop-blur-md border border-gold/30 shadow-2xl"
        role="region"
        aria-label="Contact Yong about this listing"
      >
        <a
          href={siteContent.contact.mobileHref}
          onClick={() => track('cta_call_click', { listingKey, surface: 'sticky' })}
          className="caps inline-flex items-center gap-2 px-5 py-3 text-stone hover:text-gold transition-colors"
          aria-label={`Call Yong at ${siteContent.contact.mobile}`}
        >
          <PhoneIcon /> <span>{siteContent.contact.mobile}</span>
        </a>
        <span aria-hidden="true" className="w-px h-6 bg-white/15" />
        <Link
          href={tourHref}
          onClick={() => track('cta_request_tour_click', { listingKey, surface: 'sticky' })}
          className="caps inline-flex items-center gap-2 px-5 py-3 bg-gold text-ink hover:bg-gold-muted transition-colors"
        >
          <span>Request Tour</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* Mobile — circular pill (phone) that expands on tap */}
      {!mobileExpanded ? (
        <button
          type="button"
          onClick={() => setMobileExpanded(true)}
          aria-label="Contact Yong about this listing"
          className="md:hidden fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-gold text-ink flex items-center justify-center shadow-2xl hover:bg-gold-muted transition-colors"
        >
          <PhoneIcon />
        </button>
      ) : (
        <div
          className="md:hidden fixed bottom-4 right-4 left-4 z-40 bg-ink/95 backdrop-blur-md border border-gold/30 shadow-2xl"
          role="region"
          aria-label="Contact Yong about this listing"
        >
          <div className="flex flex-col">
            <a
              href={siteContent.contact.mobileHref}
              onClick={() => track('cta_call_click', { listingKey, surface: 'sticky-mobile' })}
              className="caps inline-flex items-center gap-3 px-5 py-4 text-stone hover:text-gold transition-colors border-b border-white/10"
            >
              <PhoneIcon /> <span>{siteContent.contact.mobile}</span>
            </a>
            <Link
              href={tourHref}
              onClick={() => track('cta_request_tour_click', { listingKey, surface: 'sticky-mobile' })}
              className="caps inline-flex items-center justify-center gap-2 px-5 py-4 bg-gold text-ink hover:bg-gold-muted transition-colors"
            >
              <span>Request Tour</span>
              <span aria-hidden="true">→</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileExpanded(false)}
              aria-label="Close contact actions"
              className="caps text-stone/60 text-[10px] py-2 hover:text-gold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
      />
    </svg>
  );
}
