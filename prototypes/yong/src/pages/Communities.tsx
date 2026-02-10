import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  TrendingUp,
  ChevronRight,
  Phone,
  Mail,
  ArrowRight,
  ArrowUpRight,
  Home,
  Users,
  Mountain,
  Play,
  Compass,
  Star,
  Calendar,
  Building,
  Sun,
  Shield,
  TreePine,
  Search,
  X,
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import AnimatedCounter from '../components/shared/AnimatedCounter';
import { useScrollAnimation } from '../components/shared/useScrollAnimation';
import { REGIONS_DATA, fuzzyMatch, type SearchResult } from '../data/communitiesPage';

const Communities: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Animation hooks
  const heroAnim = useScrollAnimation();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      // Check if region matches
      if (fuzzyMatch(region.name, searchQuery)) {
        results.push({
          type: 'region',
          regionId: region.id,
          regionName: region.name,
          image: region.image,
        });
      }

      // Check communities
      region.communities.forEach(community => {
        if (fuzzyMatch(community.name, searchQuery)) {
          results.push({
            type: 'community',
            regionId: region.id,
            regionName: region.name,
            communityId: community.id,
            communityName: community.name,
            price: community.price,
            image: community.image,
          });
        }
      });
    });

    setSearchResults(results.slice(0, 8)); // Limit to 8 results
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans selection:bg-[#0C1C2E] selection:text-white antialiased overflow-x-hidden">
      <Navigation variant="transparent" />

      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden flex items-end">
        <div
          className="absolute inset-0 w-full h-[120%]"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        >
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2400"
            className="w-full h-full object-cover"
            alt="Scottsdale Communities"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E]/95 via-[#0C1C2E]/40 to-transparent" />

        {/* Video Play Button */}
        <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 group">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              <Play size={24} className="text-[#0C1C2E] ml-1" fill="#0C1C2E" />
            </div>
          </div>
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white text-[10px] uppercase tracking-[0.2em] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Discover Arizona
          </span>
        </button>

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 pb-16">
          <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold mb-4">
            <Link to="/" className="text-white/40 hover:text-white transition-colors">Home</Link>
            <span className="text-white/20">/</span>
            <span className="text-[#Bfa67a]">Communities</span>
          </nav>

          <span className="block text-[#Bfa67a] text-[11px] uppercase tracking-[0.4em] font-bold mb-4 pl-1">Explore Arizona</span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[0.9] tracking-tight mb-6 text-white">
            Scottsdale <br/>
            <span className="italic font-light">Communities</span>
          </h1>
          <p className="text-white/70 text-lg max-w-xl font-light mb-8">
            Discover the most prestigious neighborhoods across Scottsdale, Paradise Valley, and the surrounding desert communities.
          </p>

          {/* Search Bar */}
          <div ref={searchRef} className="relative max-w-2xl">
            <div className={`relative flex items-center transition-all duration-500 ${isSearchFocused ? 'bg-white shadow-2xl' : 'bg-white/95 shadow-xl'}`}>
              <div className="flex items-center gap-3 pl-6 pr-2 border-r border-gray-200">
                <Search size={16} className={`transition-colors ${isSearchFocused ? 'text-[#Bfa67a]' : 'text-gray-400'}`} />
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400 hidden sm:block">Find</span>
              </div>
              <input
                type="text"
                placeholder="Search by region or community name..."
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
                    to={result.type === 'region' ? `/region/${result.regionId}` : `/${result.regionId}/${result.communityId}`}
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
                          {result.regionName} <span className="text-[#Bfa67a]">•</span> {result.price}
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
                  <p className="text-gray-400 text-sm">No regions or communities match "{searchQuery}"</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Region Bento Boxes */}
      {REGIONS_DATA.map((region, regionIndex) => (
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
                Realtor® • Russ Lyon Sotheby's International Realty
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
  const isEven = index % 2 === 0;

  return (
    <section
      ref={anim.ref}
      className={`py-16 ${index === 0 ? 'pt-24' : ''}`}
    >
      <div className="max-w-[1600px] mx-auto px-8">
        {/* Region Header */}
        <div className={`flex items-center gap-4 mb-8 transition-all duration-700 ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Link
            to={`/region/${region.id}`}
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
              to={`/region/${region.id}`}
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
              Market Metrics
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
              {region.communities.map((community, idx) => (
                <Link
                  key={community.id}
                  to={`/${region.id}/${community.id}`}
                  className="group relative h-[320px] overflow-hidden cursor-pointer"
                >
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
