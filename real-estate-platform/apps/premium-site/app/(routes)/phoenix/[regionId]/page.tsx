import Link from 'next/link';
import { notFound } from 'next/navigation';
import { resolveAgentConfig } from '../../../agent-config/index';
import { REGIONS_DATA, getRegionById, getRegionEditorial } from '../data';
import { RegionGallery, LifestyleExplorer, RegionInfoTabs } from './RegionInteractive';
import type { Metadata } from 'next';

const agent = resolveAgentConfig();

/* ── Inline SVG Icons ── */
function IconArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
function IconArrowUpRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
    </svg>
  );
}
function IconMapPin({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconShield({ size = 8 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconHome({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IconStar({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconSun({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
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
function IconTrendUp({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

/* ── Static Params ── */
export function generateStaticParams() {
  return REGIONS_DATA.map((region) => ({ regionId: region.id }));
}

/* ── Metadata ── */
export async function generateMetadata({ params }: { params: Promise<{ regionId: string }> }): Promise<Metadata> {
  const { regionId } = await params;
  const region = getRegionById(regionId);
  if (!region) return { title: 'Region Not Found' };
  return {
    title: `${region.name} Real Estate`,
    description: `Discover luxury homes in ${region.name}. ${region.tagline}`,
  };
}

/* ── Page ── */
export default async function RegionPage({ params }: { params: Promise<{ regionId: string }> }) {
  const { regionId } = await params;
  const region = getRegionById(regionId);
  if (!region) notFound();

  const editorial = getRegionEditorial(regionId);
  const hasEditorial = !!editorial;

  return (
    <div className="min-h-screen bg-cream text-navy font-sans antialiased">

      {/* ─── Hero ─── */}
      <section className="relative w-full flex items-end" style={{ height: '70vh', minHeight: '480px' }}>
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={region.heroImage} alt={region.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/40 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20 pb-12 md:pb-20">
          <div className="text-white">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold mb-4">
              <Link href="/" className="text-white/40 hover:text-white transition-colors">Home</Link>
              <span className="text-white/20">/</span>
              <Link href="/phoenix" className="text-white/40 hover:text-white transition-colors">Communities</Link>
              <span className="text-white/20">/</span>
              <span className="text-gold">{region.name}</span>
            </nav>

            <span className="flex items-center gap-2 text-gold text-[11px] uppercase tracking-[0.4em] font-bold mb-4 pl-1">
              Region Profile
            </span>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif leading-[0.9] tracking-tight mb-4">
              {region.name}
            </h1>

            <p className="text-base sm:text-xl text-white/70 font-light italic max-w-lg mb-8">
              {region.tagline}
            </p>

            {/* Hero Actions */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/phoenix"
                className="bg-gold text-white px-6 sm:px-8 py-3 sm:py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-navy transition-all flex items-center gap-2 group shadow-xl"
              >
                <IconMapPin size={14} />
                View on Map
                <span className="group-hover:translate-x-1 transition-transform inline-block"><IconArrowRight /></span>
              </Link>
              <Link
                href="/contact"
                className="bg-navy/80 backdrop-blur text-white px-6 sm:px-8 py-3 sm:py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-navy transition-all flex items-center gap-2 shadow-xl"
              >
                Schedule Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── KPI Cards ─── */}
      {(editorial?.editorialStats || region.stats.length > 0) && (
        <section className="relative -mt-8 z-20">
          <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {(editorial?.editorialStats || region.stats).map((stat, idx) => {
                const es = editorial?.editorialStats?.[idx];
                return (
                  <div key={idx} className="bg-white p-4 md:p-6 shadow-lg shadow-black/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-navy/40 font-bold">{'label' in stat ? stat.label : ''}</span>
                      {es?.trend && (
                        <span className={`flex items-center gap-1 text-[10px] font-bold ${es.trendDir === 'up' ? 'text-emerald-600' : es.trendDir === 'down' ? 'text-rose-500' : 'text-navy/40'}`}>
                          {es.trendDir === 'up' && <IconTrendUp size={10} />}
                          {es.trend}
                        </span>
                      )}
                    </div>
                    <div className="text-2xl md:text-3xl font-serif text-navy">{'value' in stat ? stat.value : ''}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Bento Layout: Narrative + Gallery + Stats ─── */}
      <section className="py-10 md:py-16 max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20">
        <div className="grid grid-cols-12 gap-3 md:gap-4 items-stretch">

          {/* Main Narrative Card */}
          <div className="col-span-12 lg:col-span-8 bg-white p-6 md:p-8 lg:p-10 shadow-lg shadow-black/5 flex flex-col">
            <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-6 block">
              {editorial?.lifestyle ? 'Living Here' : 'The Region'}
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif leading-[1.1] text-navy mb-6 md:mb-8">
              {editorial?.lifestyle?.title || region.name}{' '}
              <span className="italic text-navy/30">&mdash; {region.name}</span>
            </h2>

            <div className="text-navy/50 font-light leading-relaxed mb-8 space-y-6">
              <p className="first-letter:text-5xl first-letter:font-serif first-letter:text-navy first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                {region.description}
              </p>
              {editorial?.lifestyle?.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Quick Facts Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="bg-cream text-navy px-3 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                <span className="text-gold"><IconHome /></span> {region.communities.length} Communities
              </span>
              {region.highlights.includes('Guard-Gated') && (
                <span className="bg-cream text-navy px-3 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                  <span className="text-gold"><IconShield size={12} /></span> Guard-Gated
                </span>
              )}
              {region.highlights.includes('Golf') && (
                <span className="bg-cream text-navy px-3 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                  <span className="text-gold"><IconStar /></span> Golf Communities
                </span>
              )}
              <span className="bg-cream text-navy px-3 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                <span className="text-gold"><IconSun /></span> 330+ Sunny Days
              </span>
            </div>

            <div className="flex flex-wrap gap-3 mt-auto">
              <Link
                href={`/listings?region=${region.id}`}
                className="bg-navy text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-gold transition-all flex items-center gap-2 group"
              >
                View Active Listings
                <span className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform inline-block"><IconArrowUpRight /></span>
              </Link>
              <Link
                href="/contact"
                className="border border-navy text-navy px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-navy hover:text-white transition-all flex items-center gap-2"
              >
                Schedule Consultation
                <IconArrowRight />
              </Link>
            </div>
          </div>

          {/* Right Column: Gallery + Stats */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 md:gap-4">
            {/* Gallery (editorial only) */}
            {editorial?.gallery && editorial.gallery.length > 0 && (
              <RegionGallery gallery={editorial.gallery} />
            )}

            {/* Stats Card */}
            <div className="bg-navy p-6 flex-1 flex flex-col">
              <span className="text-gold text-[9px] uppercase tracking-[0.3em] font-bold mb-5 block">At a Glance</span>
              <div className="space-y-4">
                {region.stats.map((stat) => (
                  <div key={stat.label} className="flex justify-between items-center pb-3 border-b border-white/10 last:border-0 last:pb-0">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{stat.label}</span>
                    <span className="text-xl font-serif text-white">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Market Intel Link */}
              <Link
                href={`/market?region=${region.id}`}
                className="flex items-center justify-between mt-5 p-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-gold/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gold"><IconTrendUp size={18} /></span>
                  <div>
                    <span className="text-white text-sm font-medium block group-hover:text-gold transition-colors">Market Intelligence</span>
                    <span className="text-[9px] uppercase tracking-widest text-white/40">Full Analytics Report</span>
                  </div>
                </div>
                <span className="text-white/40 group-hover:text-gold group-hover:translate-x-1 transition-all inline-block"><IconArrowRight /></span>
              </Link>

              {/* CTA Buttons */}
              <div className="mt-auto pt-5 space-y-3">
                <Link
                  href="/contact"
                  className="w-full bg-gold text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-navy transition-all flex items-center justify-center gap-2 group"
                >
                  Contact {agent.name.split(' ')[0]}
                  <span className="group-hover:translate-x-1 transition-transform inline-block"><IconArrowRight /></span>
                </Link>
                <Link
                  href={`/listings?region=${region.id}`}
                  className="w-full border border-white/20 text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-navy transition-all flex items-center justify-center gap-2"
                >
                  Browse All Listings
                  <IconArrowUpRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Lifestyle Explorer (editorial only) ─── */}
      {editorial?.lifestyles && editorial.lifestyles.length > 0 && (
        <LifestyleExplorer lifestyles={editorial.lifestyles} regionId={region.id} />
      )}

      {/* ─── Info Tabs (editorial only) ─── */}
      {hasEditorial && (
        <RegionInfoTabs
          regionName={region.name}
          highlights={editorial?.highlights}
          marketMetrics={editorial?.marketMetrics}
          amenities={editorial?.amenities}
          qualityOfLife={editorial?.qualityOfLife}
        />
      )}

      {/* ─── Communities Grid ─── */}
      <section className="py-10 md:py-16 bg-cream/80">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20">
          <div className="flex justify-between items-end mb-8 md:mb-10">
            <div>
              <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-3 block">Explore Communities</span>
              <h2 className="text-2xl md:text-3xl font-serif text-navy">
                {region.name} <span className="italic font-light">Communities</span>
              </h2>
            </div>
            <Link
              href="/phoenix"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-navy hover:text-gold transition-colors group"
            >
              View All
              <span className="group-hover:translate-x-1 transition-transform inline-block"><IconArrowRight /></span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {region.communities.map((community) => (
              <Link
                key={community.id}
                href={`/phoenix/${region.id}/${community.id}`}
                className="group relative h-[200px] sm:h-[260px] md:h-[280px] overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-navy">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={region.heroImage}
                    alt={community.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent opacity-90" />
                </div>
                <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 text-white">
                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    {community.tags.includes('Guard-Gated') && (
                      <span className="inline-flex items-center gap-1 bg-gold/80 text-white text-[7px] sm:text-[8px] uppercase tracking-widest font-bold px-2 py-1 mb-2">
                        <IconShield /> Guard-Gated
                      </span>
                    )}
                    <h4 className="font-serif text-base sm:text-lg md:text-xl mb-1.5 leading-tight">{community.name}</h4>
                    <div className="h-[1px] w-6 bg-gold mb-1.5 group-hover:w-12 transition-all duration-500" />
                    <p className="text-white/70 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase mb-0.5">
                      {region.name} &middot; {community.zipCode}
                    </p>
                    <p className="text-gold text-xs font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      {community.price}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200 text-white">
                      Explore <span className="text-gold"><IconArrowRight size={10} /></span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="bg-navy py-16 md:py-24">
        <div className="max-w-[800px] mx-auto px-4 md:px-8 text-center">
          <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Ready to Explore?</span>
          <h2 className="text-3xl md:text-5xl font-serif text-white mb-6">
            Find Your Home in <span className="italic font-light">{region.name}</span>
          </h2>
          <p className="text-white/60 mb-10 text-base md:text-lg font-light">
            Let {agent.name} guide you through the nuances of each community to find the perfect match for your lifestyle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/listings?region=${region.id}`}
              className="bg-gold text-white px-8 sm:px-10 py-4 sm:py-5 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-navy transition-all flex items-center justify-center gap-2 group"
            >
              <IconHome />
              View Active Listings
              <span className="group-hover:translate-x-1 transition-transform inline-block"><IconArrowRight /></span>
            </Link>
            <Link
              href="/contact"
              className="border border-white/30 text-white px-8 sm:px-10 py-4 sm:py-5 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-navy transition-all flex items-center justify-center gap-2"
            >
              <IconCalendar />
              Schedule Consultation
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-navy py-12 md:py-16">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mb-12">
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
