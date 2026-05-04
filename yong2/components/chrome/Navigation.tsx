'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { siteContent } from '@/content/site';

type NavigationProps = {
  initialTransparent?: boolean;
};

export function Navigation({ initialTransparent = false }: NavigationProps) {
  const [scrolled, setScrolled] = useState(!initialTransparent);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!initialTransparent) return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [initialTransparent]);

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
          <a href={siteContent.contact.mobileHref} className="caps mt-4 text-gold">
            {siteContent.contact.mobile}
          </a>
        </div>
      </div>
    </nav>
  );
}
