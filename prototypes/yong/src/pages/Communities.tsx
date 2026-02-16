import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  ChevronRight,
  Phone,
  Mail,
  ArrowRight,
  ArrowUpRight,
  Mountain,
  Compass,
  Star,
  Calendar,
  Shield,
  Sun,
  Search,
  X,
  Filter,
  ChevronDown,
  Droplets,
  Building2,
  LayoutGrid,
  Sparkles,
  Flag,
} from 'lucide-react';
import Footer from '../components/Footer';
import PageHero from '../components/shared/PageHero';
import SEOHead from '../components/shared/SEOHead';
import AnimatedCounter from '../components/shared/AnimatedCounter';
import { useScrollAnimation } from '../components/shared/useScrollAnimation';
import { REGIONS_DATA, fuzzyMatch } from '../data/communitiesPage';
import { getSections, getCommunitiesBySection, getAllCommunities } from '../data/communities';
import CompareButton from '../components/compare/CompareButton';

import type { SearchResult } from '../data/communitiesPage';

// Icon mapping for lifestyle filter chips
const SECTION_ICONS: Record<string, React.ReactElement> = {
  'guard-gated': <Shield size={13} />,
  'golf': <Flag size={13} />,
  'mountain-desert': <Mountain size={13} />,
  'waterfront': <Droplets size={13} />,
  'active-adult-55+': <Sun size={13} />,
  'master-planned': <LayoutGrid size={13} />,
  'condo-high-rise': <Building2 size={13} />,
  'resort-branded': <Star size={13} />,
  'new-development': <Sparkles size={13} />,
};

const Communities: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);

  const sections = getSections();
  const allCommunities = getAllCommunities();
  const totalCount = allCommunities.length;
  const isFiltered = activeSection !== null || activeRegion !== null;

  const clearFilters = () => {
    setActiveSection(null);
    setActiveRegion(null);
  };

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const results: SearchResult[] = [];

    REGIONS_DATA.forEach(region => {
      if (fuzzyMatch(region.name, searchQuery)) {
        results.push({
          type: 'region',
          regionId: region.id,
          regionName: region.name,
          image: region.image,
        });
      }

      region.communities.forEach(community => {
        const nameMatch = fuzzyMatch(community.name, searchQuery);
        const zipMatch = community.zipCode?.startsWith(searchQuery.trim()) ?? false;
        if (nameMatch || zipMatch) {
          results.push({
            type: 'community',
            regionId: region.id,
            regionName: region.name,
            communityId: community.id,
            communityName: community.name,
            price: community.price,
            zipCode: community.zipCode,
            image: community.image,
          });
        }
      });
    });

    setSearchResults(results.slice(0, 8));
  }, [searchQuery]);

  // Combined filter: section + region
  const filteredCommunities = activeSection
    ? allCommunities.filter(c => {
        if (c.identity.sectionId !== activeSection) return false;
        if (activeRegion && c.identity.regionId !== activeRegion) return false;
        return true;
      })
    : null;

  // Count for results display
  const shownCount = filteredCommunities
    ? filteredCommunities.length
    : activeRegion
      ? (REGIONS_DATA.find(r => r.id === activeRegion)?.communities.length ?? totalCount)
      : totalCount;

  // Regions to show in bento view (filtered by region or all)
  const visibleRegions = activeRegion && !activeSection
    ? REGIONS_DATA.filter(r => r.id === activeRegion)
    : REGIONS_DATA;

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans selection:bg-[#0C1C2E] selection:text-white antialiased overflow-x-hidden">
      <SEOHead
        title="Scottsdale Communities | 133 Luxury Neighborhoods | Yong Choi"
        description="Discover 133 prestigious neighborhoods across Scottsdale, Paradise Valley, Cave Creek, Fountain Hills, and the greater Phoenix luxury corridor."
      />

      <PageHero
        title="Luxury Communities"
        subtitle="Discover 133 prestigious neighborhoods across Scottsdale, Paradise Valley, and the surrounding desert communities."
        image="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2400"
        height="70vh"
        minHeight="600px"
        badge="Explore Arizona"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Communities' },
        ]}
        gradient="bg-gradient-to-t from-[#0C1C2E]/95 via-[#0C1C2E]/40 to-transparent"
      >
        {/* Search Bar */}
        <div ref={searchRef} className="relative max-w-2xl mt-8">
            <div className={`relative flex items-center transition-all duration-500 ${isSearchFocused ? 'bg-white shadow-2xl' : 'bg-white/95 shadow-xl'}`}>
              <div className="flex items-center gap-3 pl-6 pr-2 border-r border-gray-200">
                <Search size={16} className={`transition-colors ${isSearchFocused ? 'text-[#Bfa67a]' : 'text-gray-400'}`} />
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400 hidden sm:block">Find</span>
              </div>
              <input
                type="text"
                placeholder="Search by region, community, or zip code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="flex-1 bg-transparent text-[#0C1C2E] placeholder-gray-400 px-5 py-5 text-sm focus:outline-none font-light"
              />
              {searchQuery ? (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="mr-3 p-2 text-gray-400 hover:text-[#0C1C2E] hover:bg-gray-100 transition-all"
                >
                  <X size={16} />
                </button>
              ) : (
                <div className="mr-4 px-4 py-2 bg-[#0C1C2E] text-white text-[9px] uppercase tracking-[0.15em] font-bold">
                  Search
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-2xl max-h-[420px] overflow-y-auto z-50 border-t-2 border-[#Bfa67a]">
                <div className="p-3 bg-[#F9F8F6] border-b border-gray-100">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-500">
                    {searchResults.length} Result{searchResults.length !== 1 ? 's' : ''} Found
                  </span>
                </div>
                {searchResults.map((result, idx) => (
                  <Link
                    key={`${result.regionId}-${result.communityId || 'region'}-${idx}`}
                    to={result.type === 'region' ? `/phoenix/${result.regionId}` : `/phoenix/${result.regionId}/${result.communityId}`}
                    onClick={() => { setSearchQuery(''); setIsSearchFocused(false); }}
                    className="flex items-center gap-4 p-4 hover:bg-[#F9F8F6] transition-all duration-300 border-b border-gray-100 last:border-0 group"
                  >
                    <div className="w-14 h-14 flex-shrink-0 overflow-hidden relative">
                      <img
                        src={result.image}
                        alt={result.communityName || result.regionName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-[#0C1C2E]/20 group-hover:bg-transparent transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[8px] uppercase tracking-[0.15em] font-bold ${
                          result.type === 'region' ? 'text-[#0C1C2E]' : 'text-[#Bfa67a]'
                        }`}>
                          {result.type === 'region' ? '● Region' : '○ Community'}
                        </span>
                      </div>
                      <h4 className="text-[#0C1C2E] font-serif text-base truncate group-hover:text-[#Bfa67a] transition-colors">
                        {result.communityName || result.regionName}
                      </h4>
                      {result.type === 'community' && (
                        <p className="text-gray-400 text-[11px] truncate flex items-center gap-2">
                          <MapPin size={10} className="text-[#Bfa67a]" />
                          {result.regionName} <span className="text-[#Bfa67a]">•</span> {result.zipCode && <>{result.zipCode} <span className="text-[#Bfa67a]">•</span></>} {result.price}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-[#Bfa67a]">View</span>
                      <ArrowRight size={14} className="text-[#Bfa67a] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* No Results */}
            {isSearchFocused && searchQuery && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-2xl border-t-2 border-[#Bfa67a] z-50">
                <div className="p-8 text-center">
                  <Search size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-[#0C1C2E] font-serif text-lg mb-1">No Results Found</p>
                  <p className="text-gray-400 text-sm">No regions, communities, or zip codes match "{searchQuery}"</p>
                </div>
              </div>
            )}
          </div>
      </PageHero>

      {/* ─── Filter Panel ─── */}
      <section className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8">
          {/* Toggle Row */}
          <div className="flex items-center justify-between py-3">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 flex items-center justify-center border border-[#Bfa67a]/30 group-hover:border-[#Bfa67a] transition-colors">
                <Filter size={14} className="text-[#Bfa67a]" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#0C1C2E]">
                Filter Communities
              </span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-300 ${filterOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <div className="flex items-center gap-5">
              {/* Results count */}
              <span className="text-[11px] text-gray-400 font-light">
                Showing{' '}
                <span className="text-[#0C1C2E] font-bold font-serif text-sm">{shownCount}</span>
                {isFiltered && <> of {totalCount}</>}
                {' '}communities
              </span>

              {/* Active filter pills */}
              {isFiltered && (
                <div className="flex items-center gap-2">
                  {activeRegion && (
                    <span className="inline-flex items-center gap-1.5 bg-[#0C1C2E] text-white px-3 py-1 text-[9px] uppercase tracking-widest font-bold">
                      <MapPin size={10} className="text-[#Bfa67a]" />
                      {REGIONS_DATA.find(r => r.id === activeRegion)?.name}
                      <button onClick={() => setActiveRegion(null)} className="ml-1 opacity-60 hover:opacity-100">
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  {activeSection && (
                    <span className="inline-flex items-center gap-1.5 bg-[#0C1C2E] text-white px-3 py-1 text-[9px] uppercase tracking-widest font-bold">
                      {SECTION_ICONS[activeSection]}
                      {sections.find(s => s.id === activeSection)?.label}
                      <button onClick={() => setActiveSection(null)} className="ml-1 opacity-60 hover:opacity-100">
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-[9px] uppercase tracking-widest text-[#Bfa67a] font-bold hover:text-[#0C1C2E] transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Expandable Filter Options */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              filterOpen ? 'max-h-[500px] opacity-100 pb-6' : 'max-h-0 opacity-0'
            }`}
          >
            {/* Region Filter */}
            <div className="mb-5">
              <span className="text-[9px] uppercase tracking-[0.25em] text-gray-400 font-bold mb-3 block flex items-center gap-2">
                <MapPin size={11} className="text-[#Bfa67a]" />
                By Region
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveRegion(null)}
                  className={`px-5 py-2.5 text-[10px] uppercase tracking-[0.12em] font-bold transition-all duration-300 ${
                    !activeRegion
                      ? 'bg-[#0C1C2E] text-white shadow-md'
                      : 'bg-[#F4F2EF] text-gray-600 border border-gray-200/80 hover:border-[#Bfa67a] hover:text-[#0C1C2E] hover:bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                  }`}
                >
                  All Regions
                  <span className={`ml-2 text-[9px] ${!activeRegion ? 'text-[#Bfa67a]' : 'text-gray-400'}`}>
                    {totalCount}
                  </span>
                </button>
                {REGIONS_DATA.map(region => (
                  <button
                    key={region.id}
                    onClick={() => setActiveRegion(activeRegion === region.id ? null : region.id)}
                    className={`px-5 py-2.5 text-[10px] uppercase tracking-[0.12em] font-bold transition-all duration-300 ${
                      activeRegion === region.id
                        ? 'bg-[#0C1C2E] text-white shadow-md'
                        : 'bg-[#F4F2EF] text-gray-600 border border-gray-200/80 hover:border-[#Bfa67a] hover:text-[#0C1C2E] hover:bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                    }`}
                  >
                    {region.name}
                    <span className={`ml-2 text-[9px] ${activeRegion === region.id ? 'text-[#Bfa67a]' : 'text-gray-400'}`}>
                      {region.communities.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-gray-200 via-[#Bfa67a]/20 to-gray-200 mb-5" />

            {/* Lifestyle Filter */}
            <div>
              <span className="text-[9px] uppercase tracking-[0.25em] text-gray-400 font-bold mb-3 block flex items-center gap-2">
                <Compass size={11} className="text-[#Bfa67a]" />
                By Lifestyle
              </span>
              <div className="flex flex-wrap gap-2.5">
                {sections.map(section => {
                  const count = getCommunitiesBySection(section.id).length;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(isActive ? null : section.id)}
                      className={`group inline-flex items-center gap-2.5 px-5 py-3 text-[10px] uppercase tracking-[0.12em] font-bold transition-all duration-300 ${
                        isActive
                          ? 'bg-[#0C1C2E] text-white shadow-md'
                          : 'bg-[#F4F2EF] text-gray-600 border border-gray-200/80 hover:border-[#Bfa67a] hover:text-[#0C1C2E] hover:bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                      }`}
                    >
                      <span className={`transition-colors ${isActive ? 'text-[#Bfa67a]' : 'text-[#Bfa67a]/60 group-hover:text-[#Bfa67a]'}`}>
                        {SECTION_ICONS[section.id]}
                      </span>
                      {section.label}
                      <span className={`text-[9px] min-w-[16px] text-center ${isActive ? 'text-[#Bfa67a]' : 'text-gray-400'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section-Filtered Grid View ─── */}
      {activeSection && filteredCommunities && (
        <section className="py-16">
          <div className="max-w-[1600px] mx-auto px-8">
            {/* Section Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0C1C2E] flex items-center justify-center text-[#Bfa67a]">
                  {SECTION_ICONS[activeSection]}
                </div>
                <h2 className="text-3xl font-serif text-[#0C1C2E]">
                  {sections.find(s => s.id === activeSection)?.label}
                </h2>
              </div>
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[#Bfa67a] text-sm font-bold">{filteredCommunities.length} Communities</span>
            </div>
            <p className="text-gray-500 text-sm mb-10 max-w-2xl leading-relaxed">
              {sections.find(s => s.id === activeSection)?.description}
              {activeRegion && (
                <span className="text-[#0C1C2E] font-medium">
                  {' '}in {REGIONS_DATA.find(r => r.id === activeRegion)?.name}
                </span>
              )}
            </p>

            {filteredCommunities.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 border border-gray-200 flex items-center justify-center">
                  <Search size={24} className="text-gray-300" />
                </div>
                <p className="font-serif text-xl text-[#0C1C2E] mb-2">No Communities Found</p>
                <p className="text-gray-400 text-sm mb-6">
                  No {sections.find(s => s.id === activeSection)?.label.toLowerCase()} communities
                  {activeRegion && <> in {REGIONS_DATA.find(r => r.id === activeRegion)?.name}</>}
                </p>
                <button
                  onClick={clearFilters}
                  className="text-[10px] uppercase tracking-widest font-bold text-[#Bfa67a] hover:text-[#0C1C2E] transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredCommunities.map((community) => (
                  <Link
                    key={community.id}
                    to={`/phoenix/${community.identity.regionId}/${community.id}`}
                    className="group relative h-[320px] overflow-hidden cursor-pointer"
                  >
                    <CompareButton communityId={community.id} />
                    <div className="absolute inset-0 bg-[#0C1C2E]">
                      <img
                        src={community.heroImage}
                        alt={community.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-all duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E] via-transparent to-transparent opacity-90" />
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                      <div className="transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
                        {community.gating.toLowerCase().includes('guard') && (
                          <span className="inline-flex items-center gap-1 bg-[#Bfa67a]/80 text-white text-[8px] uppercase tracking-widest font-bold px-2 py-1 mb-2">
                            <Shield size={8} /> Guard-Gated
                          </span>
                        )}
                        <h4 className="font-serif text-lg md:text-xl mb-1.5">{community.name}</h4>
                        <div className="h-[1px] w-8 bg-[#Bfa67a] mb-2 group-hover:w-16 transition-all duration-500" />
                        <p className="text-white/70 text-[10px] font-bold tracking-widest uppercase mb-1">
                          {community.city.split('(')[0].trim()} · {community.zipCode}
                        </p>
                        <p className="text-[#Bfa67a] text-xs font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                          {community.priceRange}
                        </p>
                        <div className="mt-3 flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200 text-white">
                          Explore <ArrowRight size={12} className="text-[#Bfa67a]" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Region Bento Boxes (default / region-only filter) ─── */}
      {!activeSection && visibleRegions.map((region, regionIndex) => (
        <RegionBentoBox key={region.id} region={region} index={regionIndex} />
      ))}

      {/* Map CTA */}
      <section className="py-24">
        <div className="max-w-[1600px] mx-auto px-8">
          <div className="bg-[#0C1C2E] grid grid-cols-12 gap-0 items-stretch overflow-hidden">
            <div className="col-span-12 lg:col-span-6 p-12 lg:p-16 flex flex-col justify-center">
              <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Interactive</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white mb-6">
                Explore by <span className="italic font-light">Map</span>
              </h2>
              <p className="text-white/60 mb-8 max-w-lg leading-relaxed">
                Use our interactive market map to explore communities, view pricing data, and discover available properties across the Phoenix metro area.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/map"
                  className="bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2 group"
                >
                  <Compass size={14} />
                  Open Market Map
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-6 h-[300px] lg:h-auto min-h-[400px]">
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200"
                alt="Map preview"
                className="w-full h-full object-cover opacity-60"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Agent Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1600px] mx-auto px-8">
          <div className="grid grid-cols-12 gap-8 lg:gap-16 items-center">
            <div className="col-span-12 lg:col-span-4">
              <div className="aspect-square max-w-[400px] mx-auto lg:mx-0 overflow-hidden relative group">
                <img
                  src="https://media.placester.com/image/upload/c_fill,dpr_1.0,f_auto,fl_lossy,h_768,q_auto,w_768/c_scale,w_768/v1/inception-app-prod/NjY3YTZkOTktMzhiOS00OWVhLWJjMDQtNWZlMWRmODUyYTU3/content/2024/06/8bbcec7735e907c73a61342dd761093e5aed2002.jpg"
                  alt="Yong Choi"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Your Local Expert</span>
              <h3 className="text-4xl lg:text-5xl font-serif text-[#0C1C2E] mb-3">
                Yong <span className="italic font-light">Choi</span>
              </h3>
              <p className="text-gray-400 text-sm mb-6 flex items-center gap-2">
                <Star size={14} className="text-[#Bfa67a]" />
                Realtor® · Russ Lyon Sotheby's International Realty
              </p>
              <p className="text-gray-500 leading-relaxed mb-8 max-w-2xl text-lg font-light">
                With intimate knowledge of every community in the Scottsdale and Paradise Valley area, I can help you find the perfect neighborhood to call home. Whether you're seeking golf course living, urban convenience, or secluded estates, I'll guide you to the right fit.
              </p>
              <div className="flex flex-wrap gap-6 mb-8">
                <a href="tel:+19093765494" className="flex items-center gap-3 text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-[#F9F8F6] flex items-center justify-center group-hover:bg-[#Bfa67a]/10 transition-colors">
                    <Phone size={16} className="text-[#Bfa67a]" />
                  </div>
                  <span className="text-sm font-medium">(909) 376-5494</span>
                </a>
                <a href="mailto:yong.choi@russlyon.com" className="flex items-center gap-3 text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-[#F9F8F6] flex items-center justify-center group-hover:bg-[#Bfa67a]/10 transition-colors">
                    <Mail size={16} className="text-[#Bfa67a]" />
                  </div>
                  <span className="text-sm font-medium">yong.choi@russlyon.com</span>
                </a>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/contact"
                  className="bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#Bfa67a] transition-all flex items-center gap-2 group"
                >
                  <Calendar size={14} />
                  Schedule a Consultation
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// Region Bento Box Component
interface RegionBentoBoxProps {
  region: typeof REGIONS_DATA[0];
  index: number;
}

const RegionBentoBox: React.FC<RegionBentoBoxProps> = ({ region, index }) => {
  const anim = useScrollAnimation(0.1);

  return (
    <section
      ref={anim.ref}
      className={`py-16 ${index === 0 ? 'pt-24' : ''}`}
    >
      <div className="max-w-[1600px] mx-auto px-8">
        {/* Region Header */}
        <div className={`flex items-center gap-4 mb-8 transition-all duration-700 ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Link
            to={`/phoenix/${region.id}`}
            className="text-3xl md:text-4xl font-serif text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors group flex items-center gap-3"
          >
            {region.name}
            <ArrowUpRight size={24} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#Bfa67a]" />
          </Link>
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[#Bfa67a] text-sm font-bold">{region.communities.length} Communities</span>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Main Info Card */}
          <div
            className={`
              col-span-12 lg:col-span-5 bg-white p-8 lg:p-10 shadow-lg shadow-black/5
              transition-all duration-700 delay-100
              ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
          >
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">
              Region Overview
            </span>
            <h3 className="text-2xl font-serif text-[#0C1C2E] mb-2">{region.tagline}</h3>
            <p className="text-gray-500 leading-relaxed mb-6 text-sm">
              {region.description}
            </p>

            {/* Highlight Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {region.highlights.map((highlight, idx) => (
                <span
                  key={idx}
                  className="bg-[#F9F8F6] text-[#0C1C2E] px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5"
                >
                  {idx === 0 && <Shield size={10} className="text-[#Bfa67a]" />}
                  {idx === 1 && <Star size={10} className="text-[#Bfa67a]" />}
                  {idx === 2 && <Mountain size={10} className="text-[#Bfa67a]" />}
                  {idx === 3 && <Sun size={10} className="text-[#Bfa67a]" />}
                  {highlight}
                </span>
              ))}
            </div>

            <Link
              to={`/phoenix/${region.id}`}
              className="inline-flex items-center gap-2 bg-[#0C1C2E] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#Bfa67a] transition-all group"
            >
              Explore {region.name}
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Stats Card */}
          <div
            className={`
              col-span-12 md:col-span-6 lg:col-span-3 bg-[#0C1C2E] p-8 text-white
              transition-all duration-700 delay-200
              ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
          >
            <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold mb-6 block">
              At a Glance
            </span>
            <div className="space-y-5">
              {region.stats.map((stat, idx) => (
                <div key={idx} className="flex justify-between items-center pb-4 border-b border-white/10 last:border-0 last:pb-0">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{stat.label}</span>
                  <span className="text-xl font-serif text-white">
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix}
                      prefix={stat.prefix || ''}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Image */}
          <div
            className={`
              col-span-12 md:col-span-6 lg:col-span-4 relative overflow-hidden group h-[300px] lg:h-auto
              transition-all duration-700 delay-300
              ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
          >
            <img
              src={region.image}
              alt={region.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E]/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="text-[#Bfa67a] text-[9px] uppercase tracking-widest font-bold block mb-1">Featured</span>
              <span className="text-white font-serif text-lg">{region.name}</span>
            </div>
          </div>

          {/* Communities Grid */}
          <div
            className={`
              col-span-12 bg-[#F9F8F6] p-6 lg:p-8
              transition-all duration-700 delay-400
              ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
          >
            <div className="mb-6">
              <span className="text-[#0C1C2E] text-[10px] uppercase tracking-[0.3em] font-bold">
                Communities in {region.name}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {region.communities.map((community) => (
                <Link
                  key={community.id}
                  to={`/phoenix/${region.id}/${community.id}`}
                  className="group relative h-[320px] overflow-hidden cursor-pointer"
                >
                  <CompareButton communityId={community.id} />
                  {/* Image Background */}
                  <div className="absolute inset-0 bg-[#0C1C2E]">
                    <img
                      src={community.image}
                      alt={community.name}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-all duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E] via-transparent to-transparent opacity-90"></div>
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                    <div className="transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
                      <h4 className="font-serif text-lg md:text-xl mb-1.5">{community.name}</h4>
                      <div className="h-[1px] w-8 bg-[#Bfa67a] mb-2 group-hover:w-16 transition-all duration-500"></div>
                      <p className="text-[#Bfa67a] text-[10px] font-bold tracking-widest uppercase mb-1">
                        {region.name}
                      </p>
                      <p className="text-white/70 text-xs font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        {community.price}
                      </p>
                      <div className="mt-4 flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200 text-white">
                        Explore <ArrowRight size={12} className="text-[#Bfa67a]" />
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
  );
};

export default Communities;
