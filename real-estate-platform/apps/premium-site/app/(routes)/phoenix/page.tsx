import Link from 'next/link';
import { resolveAgentConfig } from '../../agent-config/index';
import { REGIONS_DATA, getTotalCommunityCount } from './data';
import { HeroSearch } from './HeroSearch';
import type { Metadata } from 'next';

const agent = resolveAgentConfig();

export const metadata: Metadata = {
  title: 'Luxury Communities',
  description: `Discover ${getTotalCommunityCount()}+ prestigious neighborhoods across Scottsdale, Paradise Valley, and the greater Phoenix luxury corridor.`,
};

/* ── Inline SVG Icons ── */
function IconMapPin({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconShield({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconStar({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconMountain({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}
function IconSun({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
function IconCompass({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
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
function IconPhone({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconMail({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22,7 12,13 2,7" />
    </svg>
  );
}
function IconCalendar({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

const HIGHLIGHT_ICONS = [IconShield, IconStar, IconMountain, IconSun];

export default function CommunitiesPage() {
  const totalCount = getTotalCommunityCount();

  return (
    <div className="min-h-screen bg-cream text-navy font-sans antialiased">

      {/* ─── Hero ─── */}
      <section className="relative w-full flex items-end" style={{ height: '70vh', minHeight: '480px' }}>
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2400"
            alt="Luxury communities"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/40 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 md:px-8 pb-12 md:pb-20">
          <div className="text-white">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold mb-4">
              <Link href="/" className="text-white/40 hover:text-white transition-colors">Home</Link>
              <span className="text-white/20">/</span>
              <span className="text-gold">Communities</span>
            </nav>

            {/* Badge */}
            <span className="flex items-center gap-2 text-gold text-[11px] uppercase tracking-[0.4em] font-bold mb-4 pl-1">
              Explore Arizona
            </span>

            {/* Title */}
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-serif leading-[0.9] tracking-tight mb-6">
              Luxury{' '}
              <br />
              <span className="italic font-light">Communities</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-white/70 font-light italic max-w-lg">
              Discover {totalCount}+ prestigious neighborhoods across Scottsdale, Paradise Valley, and the surrounding desert communities.
            </p>

            <HeroSearch />
          </div>
        </div>
      </section>

      {/* ─── Quick Region Navigation ─── */}
      <section className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-navy/5 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <div className="flex items-center gap-4 py-3 md:py-4 overflow-x-auto scrollbar-hide">
            <span className="text-[9px] uppercase tracking-[0.25em] text-navy/40 font-bold flex items-center gap-2 flex-shrink-0 hidden md:flex">
              <span className="text-gold"><IconMapPin size={11} /></span>
              Regions
            </span>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {REGIONS_DATA.map((region) => (
                <a
                  key={region.id}
                  href={`#${region.id}`}
                  className="px-4 py-2 text-[10px] uppercase tracking-[0.12em] font-bold bg-cream text-navy/60 border border-navy/10 hover:border-gold hover:text-navy hover:bg-white transition-all flex-shrink-0"
                >
                  {region.name}
                  <span className="ml-1.5 text-[9px] text-navy/30">{region.communities.length}</span>
                </a>
              ))}
            </div>
            <div className="ml-auto flex-shrink-0 hidden lg:block">
              <span className="text-[11px] text-navy/40 font-light">
                <span className="text-navy font-bold font-serif text-sm">{totalCount}</span> communities
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Region Bento Boxes ─── */}
      {REGIONS_DATA.map((region, index) => (
        <section key={region.id} id={region.id} className={`py-10 md:py-16 ${index === 0 ? 'pt-16 md:pt-24' : ''}`}>
          <div className="max-w-[1600px] mx-auto px-4 md:px-8">
            {/* Region Header */}
            <div className="flex items-center gap-4 mb-6 md:mb-8">
              <h2 className="text-2xl md:text-4xl font-serif text-navy">
                {region.name}
              </h2>
              <div className="flex-1 h-px bg-navy/10" />
              <span className="text-gold text-xs sm:text-sm font-bold flex-shrink-0">{region.communities.length} Communities</span>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-12 gap-3 md:gap-4">
              {/* Main Info Card */}
              <div className="col-span-12 lg:col-span-5 bg-white p-6 md:p-8 lg:p-10 shadow-lg shadow-black/5">
                <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">
                  Region Overview
                </span>
                <h3 className="text-2xl font-serif text-navy mb-2">{region.tagline}</h3>
                <p className="text-navy/50 leading-relaxed mb-6 text-sm">
                  {region.description}
                </p>

                {/* Highlight Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {region.highlights.map((highlight, idx) => {
                    const Icon = HIGHLIGHT_ICONS[idx % HIGHLIGHT_ICONS.length];
                    return (
                      <span
                        key={highlight}
                        className="bg-cream text-navy px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5"
                      >
                        <span className="text-gold"><Icon /></span>
                        {highlight}
                      </span>
                    );
                  })}
                </div>

                <Link
                  href={`/phoenix/${region.id}`}
                  className="inline-flex items-center gap-2 bg-navy text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-gold transition-all group"
                >
                  Explore {region.name}
                  <span className="group-hover:translate-x-1 transition-transform inline-block">
                    <IconArrowRight />
                  </span>
                </Link>
              </div>

              {/* Stats Card */}
              <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-navy p-8 text-white">
                <span className="text-gold text-[9px] uppercase tracking-[0.3em] font-bold mb-6 block">
                  At a Glance
                </span>
                <div className="space-y-5">
                  {region.stats.map((stat) => (
                    <div key={stat.label} className="flex justify-between items-center pb-4 border-b border-white/10 last:border-0 last:pb-0">
                      <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{stat.label}</span>
                      <span className="text-xl font-serif text-white">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Featured Image */}
              <div className="col-span-12 md:col-span-6 lg:col-span-4 relative overflow-hidden group h-[300px] lg:h-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={region.heroImage}
                  alt={region.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="text-gold text-[9px] uppercase tracking-widest font-bold block mb-1">Featured</span>
                  <span className="text-white font-serif text-lg">{region.name}</span>
                </div>
              </div>

              {/* Communities Grid */}
              <div className="col-span-12 bg-cream/80 p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                  <span className="text-navy text-[10px] uppercase tracking-[0.3em] font-bold">
                    Communities in {region.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {region.communities.map((community) => (
                    <Link
                      key={community.id}
                      href={`/phoenix/${region.id}/${community.id}`}
                      className="group relative h-[200px] sm:h-[280px] md:h-[320px] overflow-hidden cursor-pointer"
                    >
                      {/* Image Background */}
                      <div className="absolute inset-0 bg-navy">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={region.heroImage}
                          alt={community.name}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-all duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent opacity-90" />
                      </div>

                      {/* Content */}
                      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 text-white">
                        <div className="transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
                          {community.tags.includes('Guard-Gated') && (
                            <span className="inline-flex items-center gap-1 bg-gold/80 text-white text-[7px] sm:text-[8px] uppercase tracking-widest font-bold px-2 py-1 mb-2">
                              <IconShield size={8} /> Guard-Gated
                            </span>
                          )}
                          <h4 className="font-serif text-base sm:text-lg md:text-xl mb-1.5 leading-tight">{community.name}</h4>
                          <div className="h-[1px] w-8 bg-gold mb-2 group-hover:w-16 transition-all duration-500" />
                          <p className="text-white/70 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase mb-1">
                            {region.name} · {community.zipCode}
                          </p>
                          <p className="text-gold text-xs font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                            {community.price}
                          </p>
                          <div className="mt-3 flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200 text-white">
                            Explore <span className="text-gold"><IconArrowRight size={12} /></span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* ─── Map CTA ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <div className="bg-navy grid grid-cols-12 gap-0 items-stretch overflow-hidden">
            <div className="col-span-12 lg:col-span-6 p-6 sm:p-10 lg:p-16 flex flex-col justify-center">
              <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Interactive</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white mb-6">
                Explore by <span className="italic font-light">Map</span>
              </h2>
              <p className="text-white/60 mb-8 max-w-lg leading-relaxed">
                Use our interactive market map to explore communities, view pricing data, and discover available properties across the Phoenix metro area.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/phoenix"
                  className="bg-gold text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-navy transition-all flex items-center gap-2 group"
                >
                  <IconCompass />
                  Open Market Map
                  <span className="group-hover:translate-x-1 transition-transform inline-block">
                    <IconChevronRight />
                  </span>
                </Link>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-6 h-[300px] lg:h-auto min-h-[400px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200"
                alt="Map preview"
                className="w-full h-full object-cover opacity-60"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Agent Section ─── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-12 gap-8 lg:gap-16 items-center">
            <div className="col-span-12 lg:col-span-4">
              <div className="aspect-square max-w-[280px] sm:max-w-[400px] mx-auto lg:mx-0 overflow-hidden relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={agent.photoUrl}
                  alt={agent.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Your Local Expert</span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-navy mb-3">
                {agent.name.split(' ')[0]}{' '}
                <span className="italic font-light">{agent.name.split(' ').slice(1).join(' ')}</span>
              </h3>
              <p className="text-navy/40 text-sm mb-6 flex items-center gap-2">
                <span className="text-gold"><IconStar size={14} /></span>
                {agent.title} · {agent.brokerage}
              </p>
              <p className="text-navy/50 leading-relaxed mb-8 max-w-2xl text-lg font-light">
                With intimate knowledge of every community in the Scottsdale and Paradise Valley area, I can help you find the perfect neighborhood to call home. Whether you&apos;re seeking golf course living, urban convenience, or secluded estates, I&apos;ll guide you to the right fit.
              </p>
              <div className="flex flex-wrap gap-6 mb-8">
                <a href={`tel:${agent.contact.phone.replace(/[^+\d]/g, '')}`} className="flex items-center gap-3 text-navy hover:text-gold transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                    <span className="text-gold"><IconPhone /></span>
                  </div>
                  <span className="text-sm font-medium">{agent.contact.phone}</span>
                </a>
                <a href={`mailto:${agent.contact.email}`} className="flex items-center gap-3 text-navy hover:text-gold transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                    <span className="text-gold"><IconMail /></span>
                  </div>
                  <span className="text-sm font-medium">{agent.contact.email}</span>
                </a>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="bg-navy text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-gold transition-all flex items-center gap-2 group"
                >
                  <IconCalendar />
                  Schedule a Consultation
                  <span className="group-hover:translate-x-1 transition-transform inline-block">
                    <IconChevronRight />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-navy py-16">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h4 className="text-white font-serif text-xl mb-2">{agent.name}</h4>
              <p className="text-white/40 text-sm">{agent.title}</p>
              <p className="text-white/40 text-sm">{agent.brokerage}</p>
            </div>
            <div>
              <span className="text-gold text-[10px] uppercase tracking-[0.3em] font-bold mb-4 block">Explore</span>
              <div className="space-y-2">
                <Link href="/phoenix" className="block text-white/60 text-sm hover:text-gold transition-colors">Communities</Link>
                <Link href="/about" className="block text-white/60 text-sm hover:text-gold transition-colors">About</Link>
                <Link href="/blog" className="block text-white/60 text-sm hover:text-gold transition-colors">Market Reports</Link>
                <Link href="/contact" className="block text-white/60 text-sm hover:text-gold transition-colors">Contact</Link>
              </div>
            </div>
            <div>
              <span className="text-gold text-[10px] uppercase tracking-[0.3em] font-bold mb-4 block">Contact</span>
              <div className="space-y-2 text-white/60 text-sm">
                <a href={`mailto:${agent.contact.email}`} className="block hover:text-gold transition-colors">{agent.contact.email}</a>
                <a href={`tel:${agent.contact.phone.replace(/[^+\d]/g, '')}`} className="block hover:text-gold transition-colors">{agent.contact.phone}</a>
                <p>{agent.contact.location}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-white/30 text-xs">
              &copy; {new Date().getFullYear()} {agent.name}. All rights reserved.
            </p>
            <p className="text-white/20 text-xs mt-1">{agent.brokerage}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
