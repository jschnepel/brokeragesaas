'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type {
  GalleryImage,
  RegionHighlight,
  AmenityCategory,
  MarketMetric,
  QualityOfLifeItem,
  LifestyleCategory,
} from '../data';

/* ── Inline SVG Icons ── */
function IconChevronRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function IconChevronLeft({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
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
function IconCamera({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function IconTrendUp({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
function IconTrendDown({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

// Icon mapping for highlights
const HIGHLIGHT_ICONS: Record<string, (props: { size?: number }) => React.ReactElement> = {
  Mountain: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  ),
  Star: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Shield: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Sun: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  Activity: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Users: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

/* ── Gallery Component ── */
export function RegionGallery({ gallery }: { gallery: GalleryImage[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % gallery.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [gallery.length]);

  return (
    <div className="relative h-[320px] overflow-hidden group">
      {gallery.map((image, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-all duration-1000 ${
            index === i ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={image.caption} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/20 to-transparent" />
        </div>
      ))}
      <div className="absolute bottom-4 left-4 text-white z-10">
        <span className="text-[9px] uppercase tracking-widest text-gold font-bold block">{gallery[index]?.category}</span>
        <h3 className="text-lg font-serif">{gallery[index]?.caption}</h3>
      </div>
      <div className="absolute bottom-4 right-4 flex gap-1 z-10">
        {gallery.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1 rounded-full transition-all ${index === i ? 'w-4 bg-gold' : 'w-1 bg-white/50'}`}
          />
        ))}
      </div>
      <button className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold text-navy z-10">
        <IconCamera /> {gallery.length} Photos
      </button>
    </div>
  );
}

/* ── Lifestyle Explorer Component ── */
export function LifestyleExplorer({ lifestyles, regionId }: { lifestyles: LifestyleCategory[]; regionId: string }) {
  const [activeLifestyle, setActiveLifestyle] = useState(0);
  const [activeCommunity, setActiveCommunity] = useState(0);

  const currentLifestyle = lifestyles[activeLifestyle];
  if (!currentLifestyle) return null;

  return (
    <section className="py-10 md:py-16">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20">
        <div className="flex flex-col lg:flex-row min-h-[500px] overflow-hidden bg-navy">
          {/* Left - Lifestyle List */}
          <div className="w-full lg:w-1/3 p-6 sm:p-8 lg:p-12 flex flex-col justify-center z-10">
            <div className="mb-8 lg:mb-12">
              <span className="text-gold text-xs font-bold tracking-[0.2em] uppercase block mb-4">Curated Lifestyles</span>
              <h2 className="font-serif text-3xl lg:text-4xl text-white">Find Your Niche</h2>
            </div>
            <div className="space-y-2">
              {lifestyles.map((style, i) => (
                <div
                  key={style.id}
                  className="group cursor-pointer py-4 border-b border-white/10"
                  onMouseEnter={() => { setActiveLifestyle(i); setActiveCommunity(0); }}
                >
                  <div className="flex justify-between items-center group-hover:pl-4 transition-all duration-300">
                    <h3 className={`font-serif text-xl lg:text-2xl transition-colors ${activeLifestyle === i ? 'text-white' : 'text-white/40'}`}>
                      {style.title}
                    </h3>
                    <span className={`transition-opacity ${activeLifestyle === i ? 'opacity-100 text-gold' : 'opacity-0'}`}>
                      <IconChevronRight />
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/phoenix"
              className="mt-8 lg:mt-12 text-left text-xs font-bold uppercase tracking-[0.2em] border-b border-white/30 pb-2 self-start text-white hover:text-gold hover:border-gold transition-colors"
            >
              Explore All Communities
            </Link>
          </div>

          {/* Right - Community Cards */}
          <div className="w-full lg:w-2/3 relative min-h-[400px] lg:min-h-0 bg-navy/80 p-4 sm:p-6 lg:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-serif text-xl">{currentLifestyle.title}</h3>
                <p className="text-white/50 text-xs mt-1">Hover to explore communities</p>
              </div>
              {currentLifestyle.communities.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveCommunity(prev => prev === 0 ? currentLifestyle.communities.length - 1 : prev - 1)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <IconChevronLeft size={16} />
                  </button>
                  <span className="text-white/50 text-xs font-medium min-w-[40px] text-center">
                    {activeCommunity + 1} / {currentLifestyle.communities.length}
                  </span>
                  <button
                    onClick={() => setActiveCommunity(prev => prev === currentLifestyle.communities.length - 1 ? 0 : prev + 1)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <IconChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 flex gap-3 overflow-hidden">
              {currentLifestyle.communities.map((community, idx) => (
                <Link
                  key={community.id}
                  href={`/phoenix/${regionId}/${community.id}`}
                  className={`group relative overflow-hidden transition-all duration-500 ease-out cursor-pointer ${
                    activeCommunity === idx ? 'flex-[3]' : 'flex-[1]'
                  }`}
                  onMouseEnter={() => setActiveCommunity(idx)}
                >
                  <div className="absolute inset-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={community.image} alt={community.name} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
                    <div className={`absolute inset-0 transition-all duration-500 ${activeCommunity === idx ? 'bg-gradient-to-t from-navy via-navy/40 to-transparent' : 'bg-navy/60'}`} />
                  </div>
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <div className={`transition-all duration-500 ${activeCommunity === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 absolute'}`}>
                      <div className="h-[2px] w-8 bg-gold mb-3 group-hover:w-16 transition-all duration-500" />
                      <h4 className="text-white font-serif text-xl mb-2">{community.name}</h4>
                      <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-2">{community.priceRange}</p>
                      <p className="text-white/70 text-xs leading-relaxed mb-4 line-clamp-2">{community.bio}</p>
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white group-hover:text-gold transition-colors">
                        Explore <span className="group-hover:translate-x-1 transition-transform inline-block"><IconArrowRight size={12} /></span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {currentLifestyle.communities.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCommunity(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${activeCommunity === idx ? 'w-6 bg-gold' : 'w-1.5 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Info Tabs Component ── */
type InfoTab = 'special' | 'numbers' | 'amenities' | 'residents';

export function RegionInfoTabs({
  regionName,
  highlights,
  marketMetrics,
  amenities,
  qualityOfLife,
}: {
  regionName: string;
  highlights?: RegionHighlight[];
  marketMetrics?: MarketMetric[];
  amenities?: AmenityCategory[];
  qualityOfLife?: QualityOfLifeItem[];
}) {
  const [activeTab, setActiveTab] = useState<InfoTab>('special');

  const allTabs: { key: InfoTab; label: string; title: string; titleItalic: string; available: boolean }[] = [
    { key: 'special' as const, label: `Why ${regionName}`, title: 'What Makes It', titleItalic: 'Special', available: !!highlights },
    { key: 'numbers' as const, label: 'Market Intelligence', title: 'By the', titleItalic: 'Numbers', available: !!marketMetrics },
    { key: 'amenities' as const, label: "What's Nearby", title: 'Amenities &', titleItalic: 'Attractions', available: !!amenities },
    { key: 'residents' as const, label: 'Quality of Life', title: 'What Residents', titleItalic: 'Love', available: !!qualityOfLife },
  ];
  const tabs = allTabs.filter(t => t.available);

  if (tabs.length === 0) return null;

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20">
        {/* Tab Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-left p-3 md:p-4 transition-all duration-300 border-b-2 ${
                activeTab === tab.key ? 'border-gold bg-cream' : 'border-transparent hover:bg-cream/50'
              }`}
            >
              <span className={`text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold block mb-1 transition-colors ${activeTab === tab.key ? 'text-gold' : 'text-navy/30'}`}>
                {tab.label}
              </span>
              <h3 className={`text-sm md:text-lg font-serif transition-colors ${activeTab === tab.key ? 'text-navy' : 'text-navy/30'}`}>
                {tab.title} <span className="italic font-light">{tab.titleItalic}</span>
              </h3>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[180px]">
          {activeTab === 'special' && highlights && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {highlights.map((h, idx) => {
                const IconFn = HIGHLIGHT_ICONS[h.icon] || HIGHLIGHT_ICONS.Mountain;
                return (
                  <div key={idx} className="text-center p-4 bg-cream hover:shadow-md transition-all duration-300 group cursor-pointer">
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-navy/5 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                      <span className="text-gold">{IconFn && <IconFn size={18} />}</span>
                    </div>
                    <h3 className="text-sm font-serif text-navy mb-1 group-hover:text-gold transition-colors">{h.title}</h3>
                    <p className="text-navy/40 text-[11px] leading-snug">{h.description}</p>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'numbers' && marketMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {marketMetrics.map((metric, idx) => (
                <div key={idx} className="bg-cream p-4 hover:shadow-md transition-all duration-300 group cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] uppercase tracking-wider text-navy/40 font-bold truncate">{metric.label}</span>
                    {metric.change && (
                      <span className={`flex items-center text-[10px] font-bold ${
                        metric.trend === 'up' ? 'text-emerald-600' : metric.trend === 'down' ? 'text-rose-500' : 'text-navy/40'
                      }`}>
                        {metric.trend === 'up' && <IconTrendUp />}
                        {metric.trend === 'down' && <IconTrendDown />}
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-serif text-navy group-hover:text-gold transition-colors">{metric.value}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'amenities' && amenities && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {amenities.map((cat, idx) => (
                <div key={idx} className="bg-cream p-4 hover:shadow-md transition-shadow">
                  <h3 className="text-[10px] uppercase tracking-[0.15em] text-gold font-bold mb-3 pb-2 border-b border-navy/10">{cat.category}</h3>
                  <ul className="space-y-2">
                    {cat.items.map((item, i) => (
                      <li key={i} className="flex items-center justify-between text-[11px] group cursor-pointer">
                        <span className="text-navy/60 group-hover:text-navy transition-colors truncate pr-2">{item.name}</span>
                        {item.distance && <span className="text-navy/30 text-[10px] group-hover:text-gold transition-colors whitespace-nowrap">{item.distance}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'residents' && qualityOfLife && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {qualityOfLife.map((item, idx) => (
                <div key={idx} className="bg-cream p-4 hover:shadow-md transition-all duration-300 group">
                  <span className="text-[9px] uppercase tracking-wider text-navy/40 font-bold mb-1 block">{item.metric}</span>
                  <span className="text-gold font-serif text-lg group-hover:scale-105 transition-transform block">{item.value}</span>
                  <p className="text-[11px] text-navy/50 leading-snug mt-1">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
