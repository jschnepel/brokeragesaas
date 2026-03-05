'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAgent } from './AgentProvider';

/* ── Inline SVG icons (avoids lucide-react dependency) ── */
function IconMenu() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function IconX() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconSearch({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IconChevronDown({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function IconChevronRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22,7 12,13 2,7" />
    </svg>
  );
}
function IconMapPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconMap() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}
function IconArrowRight({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function Navigation() {
  const agent = useAgent();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const pathname = usePathname();
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    setSearchOpen(false);
  }, [pathname]);

  // Determine if homepage hero (transparent) or inner page (solid)
  const isHome = pathname === '/';
  const isDark = !isHome || scrolled;

  const handleMouseEnter = (dropdown: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  return (
    <>
      <nav
        className={`
          fixed top-0 w-full z-50 transition-all duration-500
          ${isDark
            ? 'bg-white/95 backdrop-blur-md py-4 border-b border-navy/5 shadow-sm'
            : 'bg-transparent py-6'
          }
        `}
      >
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8 flex justify-between items-center">
          {/* Logo & Agent Name */}
          <Link href="/" className="flex items-center gap-4 lg:gap-6 transition-opacity hover:opacity-80">
            <div className={`hidden md:block border-l ${isDark ? 'border-navy/20' : 'border-white/30'} pl-4 lg:pl-6`}>
              <span className={`text-xl lg:text-2xl font-serif tracking-wide ${isDark ? 'text-navy' : 'text-white'}`}>
                {agent.name}
              </span>
            </div>
            <span className={`md:hidden text-xl font-serif ${isDark ? 'text-navy' : 'text-white'}`}>
              {agent.name}
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className={`hidden lg:flex items-center gap-10 ${isDark ? 'text-navy' : 'text-white'}`}>

            {/* Discover — Mega Menu */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('discover')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`flex items-center gap-1.5 text-[15px] tracking-wide font-serif hover:text-gold transition-colors ${
                  activeDropdown === 'discover' ? 'text-gold' : ''
                }`}
              >
                Discover
                <IconChevronDown className={`transition-transform opacity-60 ${activeDropdown === 'discover' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'discover' && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[700px] bg-white shadow-2xl border border-navy/5"
                  onMouseEnter={() => handleMouseEnter('discover')}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="grid grid-cols-12 gap-0">
                    {/* Map Preview */}
                    <div className="col-span-5 bg-navy p-6 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800"
                          alt="Scottsdale"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <IconMap />
                          <span className="text-gold text-[9px] uppercase tracking-[0.3em] font-bold">Interactive Map</span>
                        </div>
                        <h3 className="text-white text-xl font-serif mb-2">Explore the Valley</h3>
                        <p className="text-white/60 text-xs leading-relaxed mb-6">
                          Discover luxury communities across the Scottsdale corridor.
                        </p>
                        <Link
                          href="/phoenix"
                          className="inline-flex items-center gap-2 bg-gold text-white px-5 py-3 text-[9px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-navy transition-all group"
                        >
                          Explore Communities
                          <span className="group-hover:translate-x-1 transition-transform inline-block">
                            <IconArrowRight />
                          </span>
                        </Link>
                      </div>
                    </div>

                    {/* Regions */}
                    <div className="col-span-7 p-6">
                      <span className="text-[9px] uppercase tracking-[0.3em] text-navy/40 font-bold mb-3 block">
                        Explore by Region
                      </span>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {agent.regions.map((region) => (
                          <Link
                            key={region.name}
                            href={region.href}
                            className="group flex items-center justify-between py-2.5 border-b border-navy/5 hover:border-gold transition-colors"
                          >
                            <span className="text-navy text-[14px] font-serif group-hover:text-gold transition-colors">
                              {region.name}
                            </span>
                            <span className="text-navy/20 group-hover:text-gold transition-colors">
                              <IconChevronRight />
                            </span>
                          </Link>
                        ))}
                      </div>
                      <Link
                        href="/phoenix"
                        className="inline-flex items-center gap-1 text-gold text-[10px] uppercase tracking-[0.2em] font-bold mt-4 hover:gap-2 transition-all"
                      >
                        View All Communities <IconChevronRight />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Collection — Simple Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('collection')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`flex items-center gap-1.5 text-[15px] tracking-wide font-serif hover:text-gold transition-colors ${
                  activeDropdown === 'collection' ? 'text-gold' : ''
                }`}
              >
                Collection
                <IconChevronDown className={`transition-transform opacity-60 ${activeDropdown === 'collection' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'collection' && (
                <div
                  className="absolute top-full left-0 mt-4 w-[220px] bg-white shadow-2xl border border-navy/5 py-2"
                  onMouseEnter={() => handleMouseEnter('collection')}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link href="/listings/10293-n-chiricahua-dr" className="block px-5 py-3 text-navy text-[14px] font-serif hover:text-gold hover:bg-cream/50 transition-colors">
                    Featured Estates
                  </Link>
                  <Link href="/phoenix" className="block px-5 py-3 text-navy text-[14px] font-serif hover:text-gold hover:bg-cream/50 transition-colors">
                    By Community
                  </Link>
                </div>
              )}
            </div>

            {/* The Advisor — Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('advisor')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`flex items-center gap-1.5 text-[15px] tracking-wide font-serif hover:text-gold transition-colors ${
                  activeDropdown === 'advisor' ? 'text-gold' : ''
                }`}
              >
                The Advisor
                <IconChevronDown className={`transition-transform opacity-60 ${activeDropdown === 'advisor' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'advisor' && (
                <div
                  className="absolute top-full right-0 mt-4 w-[220px] bg-white shadow-2xl border border-navy/5 py-2"
                  onMouseEnter={() => handleMouseEnter('advisor')}
                  onMouseLeave={handleMouseLeave}
                >
                  {(agent.nav.find((n) => n.label === 'The Advisor')?.children ?? []).map((child) => (
                    <Link key={child.href} href={child.href} className="block px-5 py-3 text-navy text-[14px] font-serif hover:text-gold hover:bg-cream/50 transition-colors">
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(true)}
              className={`p-2 hover:text-gold transition-colors ${isDark ? 'text-navy' : 'text-white'}`}
              aria-label="Search"
            >
              <IconSearch />
            </button>

            <Link
              href="/contact"
              className="hidden sm:block bg-gold text-white px-6 py-2.5 text-[10px] uppercase tracking-[0.25em] font-bold transition-all hover:bg-navy"
            >
              Contact {agent.name.split(' ')[0]}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`lg:hidden p-2 ${isDark ? 'text-navy' : 'text-white'}`}
              aria-label="Open menu"
            >
              <IconMenu />
            </button>
          </div>
        </div>
      </nav>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] bg-navy/[0.98] flex items-center justify-center">
          <button
            onClick={() => setSearchOpen(false)}
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
            aria-label="Close search"
          >
            <IconX />
          </button>

          <div className="w-full max-w-2xl px-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search properties, communities, or addresses..."
                autoFocus
                className="w-full bg-transparent border-b-2 border-white/30 text-white text-2xl lg:text-3xl font-serif placeholder-white/40 py-4 pr-12 outline-none focus:border-gold transition-colors"
              />
              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40">
                <IconSearch size={28} />
              </span>
            </div>

            <div className="mt-12">
              <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold mb-4">Popular Searches</p>
              <div className="flex flex-wrap gap-3">
                {['Desert Mountain', 'Paradise Valley', 'Silverleaf', 'DC Ranch', '$5M+', 'Golf Communities'].map((tag) => (
                  <Link
                    key={tag}
                    href="/phoenix"
                    onClick={() => setSearchOpen(false)}
                    className="px-4 py-2 border border-white/20 text-white/60 text-sm hover:bg-white hover:text-navy transition-all"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-navy lg:hidden overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <span className="text-lg font-serif text-white">{agent.name}</span>
            <button onClick={() => setMobileMenuOpen(false)} className="text-white p-2" aria-label="Close menu">
              <IconX />
            </button>
          </div>

          {/* Links */}
          <div className="p-6">
            <nav className="space-y-1">
              {/* Discover */}
              <div>
                <button
                  onClick={() => setMobileSubmenu(mobileSubmenu === 'discover' ? null : 'discover')}
                  className="flex items-center justify-between w-full py-4 border-b border-white/10 text-lg font-serif text-white hover:text-gold transition-colors"
                >
                  Discover
                  <IconChevronDown size={20} className={`opacity-40 transition-transform ${mobileSubmenu === 'discover' ? 'rotate-180' : ''}`} />
                </button>
                {mobileSubmenu === 'discover' && (
                  <div className="pl-4 py-2 space-y-1 bg-white/5">
                    <Link href="/phoenix" className="flex items-center gap-3 py-3 text-gold font-medium">
                      <IconMap />
                      All Communities
                    </Link>
                    <div className="py-2">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">By Region</span>
                    </div>
                    {agent.regions.map((region) => (
                      <Link
                        key={region.name}
                        href={region.href}
                        className="flex items-center justify-between py-2 text-white/80 hover:text-gold transition-colors"
                      >
                        {region.name}
                        <span className="text-white/20"><IconChevronRight /></span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Collection */}
              <div>
                <button
                  onClick={() => setMobileSubmenu(mobileSubmenu === 'collection' ? null : 'collection')}
                  className="flex items-center justify-between w-full py-4 border-b border-white/10 text-lg font-serif text-white hover:text-gold transition-colors"
                >
                  Collection
                  <IconChevronDown size={20} className={`opacity-40 transition-transform ${mobileSubmenu === 'collection' ? 'rotate-180' : ''}`} />
                </button>
                {mobileSubmenu === 'collection' && (
                  <div className="pl-4 py-2 space-y-1 bg-white/5">
                    <Link href="/listings/10293-n-chiricahua-dr" className="block py-3 text-white/80 hover:text-gold transition-colors">
                      Featured Estates
                    </Link>
                    <Link href="/phoenix" className="block py-3 text-white/80 hover:text-gold transition-colors">
                      By Community
                    </Link>
                  </div>
                )}
              </div>

              {/* The Advisor */}
              <div>
                <button
                  onClick={() => setMobileSubmenu(mobileSubmenu === 'advisor' ? null : 'advisor')}
                  className="flex items-center justify-between w-full py-4 border-b border-white/10 text-lg font-serif text-white hover:text-gold transition-colors"
                >
                  The Advisor
                  <IconChevronDown size={20} className={`opacity-40 transition-transform ${mobileSubmenu === 'advisor' ? 'rotate-180' : ''}`} />
                </button>
                {mobileSubmenu === 'advisor' && (
                  <div className="pl-4 py-2 space-y-1 bg-white/5">
                    {(agent.nav.find((n) => n.label === 'The Advisor')?.children ?? []).map((child) => (
                      <Link key={child.href} href={child.href} className="block py-3 text-white/80 hover:text-gold transition-colors">
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Mobile Contact Info */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-gold text-[10px] uppercase tracking-[0.3em] font-bold mb-6">Contact {agent.name}</p>
              <div className="space-y-4 text-white/60 text-sm">
                <a href={`tel:${agent.contact.phone.replace(/[^+\d]/g, '')}`} className="flex items-center gap-3 hover:text-white transition-colors">
                  <IconPhone />
                  {agent.contact.phone}
                </a>
                <a href={`mailto:${agent.contact.email}`} className="flex items-center gap-3 hover:text-white transition-colors">
                  <IconMail />
                  {agent.contact.email}
                </a>
                <p className="flex items-center gap-3">
                  <IconMapPin />
                  {agent.contact.location}
                </p>
              </div>
            </div>

            <Link
              href="/contact"
              className="block w-full mt-8 bg-gold text-white py-4 text-[11px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-navy transition-all text-center"
            >
              Schedule Consultation
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
