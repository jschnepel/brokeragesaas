'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { siteContent } from '@/content/site';
import {
  getSavedListings,
  onSavedListingsChange,
} from '@/components/portfolio/HeroTopBar';

type NavigationProps = {
  initialTransparent?: boolean;
};

export function Navigation({ initialTransparent = false }: NavigationProps) {
  const [scrolled, setScrolled] = useState(!initialTransparent);
  const [menuOpen, setMenuOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (!initialTransparent) return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [initialTransparent]);

  // Keep the saved-listings counter in sync with localStorage so the
  // heart badge reflects the live count without a page reload after
  // saving from a listing detail page.
  useEffect(() => {
    setSavedCount(getSavedListings().length);
    const unsub = onSavedListingsChange(() => {
      setSavedCount(getSavedListings().length);
    });
    return unsub;
  }, []);

  const isTransparent = initialTransparent && !scrolled && !menuOpen;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-500 ${
        isTransparent ? 'bg-transparent' : 'bg-ink/95 backdrop-blur-sm border-b border-white/5'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl text-stone tracking-tight hover:text-gold transition-colors">
          {siteContent.brand.name}
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {siteContent.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="caps text-stone hover:text-gold transition-colors"
              style={{ color: 'var(--stone)' }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/saved"
            aria-label={`Saved listings${savedCount > 0 ? ` (${savedCount})` : ''}`}
            className="relative text-stone hover:text-gold transition-colors flex items-center"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill={savedCount > 0 ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {savedCount > 0 ? (
              <span className="absolute -top-1.5 -right-2.5 bg-gold text-ink text-[10px] caps tabular-nums px-1.5 py-px rounded-full leading-none">
                {savedCount > 99 ? '99+' : savedCount}
              </span>
            ) : null}
          </Link>
        </div>
        <button
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="md:hidden text-stone"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="block w-6 h-px bg-current mb-1.5" />
          <span className="block w-6 h-px bg-current mb-1.5" />
          <span className="block w-4 h-px bg-current ml-auto" />
        </button>
      </div>
      {/*
       * `hidden` attribute is the source of truth for visibility — `md:hidden`
       * still hides the panel above the breakpoint. The state-driven `hidden`
       * keeps the menu collapsed until the user taps the burger.
       */}
      <div
        id="mobile-menu"
        hidden={!menuOpen}
        className="md:hidden bg-ink border-t border-white/5"
      >
        <div className="px-6 py-8 flex flex-col gap-6">
          {siteContent.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-serif italic text-2xl text-stone"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/saved"
            className="font-serif italic text-2xl text-stone"
            onClick={() => setMenuOpen(false)}
          >
            Saved{savedCount > 0 ? ` (${savedCount})` : ''}
          </Link>
          {siteContent.contact.primaryPhoneHref && siteContent.contact.primaryPhone ? (
            <a href={siteContent.contact.primaryPhoneHref} className="caps mt-4 text-gold">
              {siteContent.contact.primaryPhone}
            </a>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
