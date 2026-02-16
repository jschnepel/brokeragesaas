import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  TrendingUp,
  TrendingDown,
  Home,
  ChevronRight,
  ChevronLeft,
  Mountain,
  TreePine,
  Sun,
  Shield,
  Plane,
  GraduationCap,
  Utensils,
  ShoppingBag,
  Activity,
  Users,
  Calendar,
  Star,
  Download,
  Camera,
} from 'lucide-react';
import Footer from '../components/Footer';
import PageHero from '../components/shared/PageHero';
import SEOHead from '../components/shared/SEOHead';
import HeroKpiCards from '../components/shared/HeroKpiCards';
import { useScrollAnimation } from '../components/shared/useScrollAnimation';
import { REGIONS } from '../data/regions';
import { getCommunitiesByRegion } from '../data/communities';
import { getRegionName, getRegionDescription } from '../data/regionMapping';
import { agentSchema, breadcrumbSchema, placeSchema } from '../utils/structuredData';
import CompareButton from '../components/compare/CompareButton';

// Icon mapping
const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Mountain,
  TreePine,
  Sun,
  Shield,
  Plane,
  GraduationCap,
  Utensils,
  ShoppingBag,
  Activity,
  Users,
  Star,
};

// Region hero images fallback
const REGION_HERO_IMAGES: Record<string, string> = {
  'north-scottsdale': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000',
  'paradise-valley': 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2000',
  'central-scottsdale': 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=2000',
  'south-scottsdale': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2000',
  'cave-creek': 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=2000',
  'carefree': 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=2000',
  'fountain-hills': 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=2000',
  'rio-verde': 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=2000',
  'desert-ridge': 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=2000',
  'biltmore': 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=2000',
  'anthem': 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=2000',
  'peoria': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000',
};


const RegionPage: React.FC = () => {
  const { regionId } = useParams<{ regionId: string }>();

  // Try editorial config first, then fall back to JSON-derived data
  const editorialRegion = regionId ? REGIONS[regionId] : null;
  const jsonCommunities = regionId ? getCommunitiesByRegion(regionId) : [];
  const regionName = editorialRegion?.name ?? (regionId ? getRegionName(regionId) : '');
  const regionDescription = editorialRegion?.description ?? (regionId ? getRegionDescription(regionId) : '');
  const regionHeroImage = editorialRegion?.heroImage ?? REGION_HERO_IMAGES[regionId ?? ''] ?? 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000';
  const regionTagline = editorialRegion?.tagline ?? regionName;

  const hasRegion = editorialRegion || jsonCommunities.length > 0;

  const [galleryIndex, setGalleryIndex] = useState(0);
  const [activeLifestyle, setActiveLifestyle] = useState(0);
  const [activeCommunity, setActiveCommunity] = useState(0);
  const [activeInfoTab, setActiveInfoTab] = useState<'special' | 'numbers' | 'amenities' | 'residents'>('special');

  // Auto-rotate gallery
  useEffect(() => {
    if (!editorialRegion?.gallery?.length) return;
    const interval = setInterval(() => {
      setGalleryIndex((prev) => (prev + 1) % (editorialRegion.gallery.length));
    }, 4000);
    return () => clearInterval(interval);
  }, [editorialRegion]);

  // Scroll to top on region change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [regionId]);

  // Animation hooks
  const highlightsAnim = useScrollAnimation();
  const communitiesAnim = useScrollAnimation();

  if (!hasRegion) {
    return (
      <PageHero title="Region Not Found" image="" height="50vh">
        <div className="text-center mt-8">
          <p className="text-white/70 mb-8">The region you're looking for doesn't exist.</p>
          <Link
            to="/communities"
            className="bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all"
          >
            View All Communities
          </Link>
        </div>
      </PageHero>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] page-zoom-90 font-sans selection:bg-[#0C1C2E] selection:text-white antialiased overflow-x-hidden">
      <SEOHead
        title={`${regionName} Real Estate | Luxury Homes in Phoenix`}
        description={regionTagline}
        structuredData={[
          agentSchema(),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Communities', path: '/communities' },
            { name: regionName, path: `/phoenix/${regionId}` },
          ]),
          placeSchema(regionName, regionTagline),
        ]}
      />

      <PageHero
        title={regionName}
        subtitle={regionTagline}
        image={regionHeroImage}
        height="70vh"
        minHeight="600px"
        badge="Region Profile"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Communities', href: '/communities' },
          { label: regionName },
        ]}
        actions={
          <>
            <Link
              to="/map"
              className="bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2 group shadow-xl"
            >
              <MapPin size={14} />
              View on Map
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
            <Link
              to={`/report?region=${regionId}`}
              className="bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2 shadow-xl"
            >
              <Download size={14} />
              Market Report
            </Link>
          </>
        }
      />

      {/* KPI Cards — editorial stats if available */}
      {editorialRegion?.stats && (
        <HeroKpiCards kpis={editorialRegion.stats.map(s => ({
          label: s.label,
          value: s.value,
          trend: s.trend,
          trendDirection: s.trendDir,
          subtext: 'vs. Last Year',
        }))} />
      )}

      {/* Bento Box Layout - Region Information */}
      <section className="py-16 max-w-[1600px] mx-auto px-8 lg:px-20">
        <div className="grid grid-cols-12 gap-4 items-stretch">

          {/* THE NARRATIVE - Main Content (8 cols) */}
          <div className="col-span-12 lg:col-span-8 bg-white p-10 shadow-lg shadow-black/5 flex flex-col">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-6 block">
              {editorialRegion?.lifestyle ? 'Living Here' : 'The Region'}
            </span>
            <h2 className="text-3xl md:text-4xl font-serif leading-[1.1] text-[#0C1C2E] mb-8">
              {editorialRegion?.lifestyle?.title || regionName} <span className="italic text-gray-400">— {regionName}</span>
            </h2>

            <div className="prose prose-lg text-gray-500 font-light leading-relaxed mb-8 max-w-none space-y-6">
              <p className="first-letter:text-5xl first-letter:font-serif first-letter:text-[#0C1C2E] first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                {regionDescription}
              </p>

              {editorialRegion?.lifestyle?.paragraphs.map((paragraph, idx) => (
                <p key={idx}>
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Quick Facts Tags */}
            <div className="flex flex-wrap gap-3 mb-8">
              {jsonCommunities.length > 0 && (
                <>
                  <span className="bg-gray-100 text-[#0C1C2E] px-4 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                    <Home size={12} className="text-[#Bfa67a]" /> {jsonCommunities.length} Communities
                  </span>
                  {jsonCommunities.some(c => c.gating.toLowerCase().includes('guard')) && (
                    <span className="bg-gray-100 text-[#0C1C2E] px-4 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                      <Shield size={12} className="text-[#Bfa67a]" /> Guard-Gated
                    </span>
                  )}
                  {jsonCommunities.some(c => c.golf) && (
                    <span className="bg-gray-100 text-[#0C1C2E] px-4 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                      <Star size={12} className="text-[#Bfa67a]" /> Golf Communities
                    </span>
                  )}
                  <span className="bg-gray-100 text-[#0C1C2E] px-4 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                    <Sun size={12} className="text-[#Bfa67a]" /> 330+ Sunny Days
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to={`/listings?region=${regionId}`}
                className="bg-[#0C1C2E] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#Bfa67a] transition-all flex items-center gap-2 group"
              >
                View Active Listings
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="border border-[#0C1C2E] text-[#0C1C2E] px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#0C1C2E] hover:text-white transition-all flex items-center gap-2"
              >
                Schedule Consultation
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN - Gallery (if editorial) + Quick Stats (4 cols) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col">
            <div className="flex flex-col flex-1 space-y-4">
              {/* GALLERY - Auto Rotating (only if editorial has gallery) */}
              {editorialRegion?.gallery && editorialRegion.gallery.length > 0 && (
                <div className="relative h-[320px] overflow-hidden group">
                  {editorialRegion.gallery.map((image, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-all duration-1000 ${
                        galleryIndex === index ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                      }`}
                    >
                      <img src={image.url} alt={image.caption} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>
                  ))}
                  <div className="absolute bottom-4 left-4 text-white z-10">
                    <span className="text-[9px] uppercase tracking-widest text-[#Bfa67a] font-bold block">{editorialRegion.gallery[galleryIndex]?.category}</span>
                    <h3 className="text-lg font-serif">{editorialRegion.gallery[galleryIndex]?.caption}</h3>
                  </div>
                  <div className="absolute bottom-4 right-4 flex gap-1 z-10">
                    {editorialRegion.gallery.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setGalleryIndex(index)}
                        className={`h-1 rounded-full transition-all ${galleryIndex === index ? 'w-4 bg-[#Bfa67a]' : 'w-1 bg-white/50'}`}
                      />
                    ))}
                  </div>
                  <button className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold text-[#0C1C2E] z-10">
                    <Camera size={12} /> {editorialRegion.gallery.length} Photos
                  </button>
                </div>
              )}

              {/* REGION STATS */}
              <div className="bg-[#0C1C2E] p-6 flex-1 flex flex-col">
                <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold mb-5 block">At a Glance</span>
                <div className="space-y-4">
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Communities</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">{jsonCommunities.length}</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Guard-Gated</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">{jsonCommunities.filter(c => c.gating.toLowerCase().includes('guard')).length}</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Golf Communities</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">{jsonCommunities.filter(c => c.golf).length}</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Sections</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">{new Set(jsonCommunities.map(c => c.identity.sectionId)).size}</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Zip Codes</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">{new Set(jsonCommunities.map(c => c.zipCode)).size}</span>
                  </div>
                </div>

                {/* Market Intel Link */}
                <Link
                  to={`/report?region=${regionId}`}
                  className="flex items-center justify-between mt-5 p-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#Bfa67a]/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp size={18} className="text-[#Bfa67a]" />
                    <div>
                      <span className="text-white text-sm font-medium block group-hover:text-[#Bfa67a] transition-colors">Market Intelligence</span>
                      <span className="text-[9px] uppercase tracking-widest text-gray-500">Full Analytics Report</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-500 group-hover:text-[#Bfa67a] group-hover:translate-x-1 transition-all" />
                </Link>

                {/* CTA Buttons */}
                <div className="mt-auto pt-5 space-y-3">
                  <Link
                    to="/contact"
                    className="w-full bg-[#Bfa67a] text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center justify-center gap-2 group"
                  >
                    Contact Yong Choi
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to={`/listings?region=${regionId}`}
                    className="w-full border border-white/20 text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center justify-center gap-2"
                  >
                    Browse All Listings
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curated Lifestyles - only if editorial config has them */}
      {editorialRegion?.lifestyles && (
        <section className="py-16">
          <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
            <div className="flex flex-col lg:flex-row min-h-[500px] overflow-hidden bg-[#0C1C2E]">
              <div className="w-full lg:w-1/3 p-8 lg:p-12 flex flex-col justify-center z-10">
                <div className="mb-12">
                  <span className="text-[#Bfa67a] text-xs font-bold tracking-[0.2em] uppercase block mb-4">Curated Lifestyles</span>
                  <h2 className="font-serif text-4xl text-white">Find Your Niche</h2>
                </div>
                <div className="space-y-2">
                  {editorialRegion.lifestyles.map((style, index) => (
                    <div
                      key={style.id}
                      className="group cursor-pointer py-4 border-b border-white/10"
                      onMouseEnter={() => { setActiveLifestyle(index); setActiveCommunity(0); }}
                    >
                      <div className="flex justify-between items-center group-hover:pl-4 transition-all duration-300">
                        <h3 className={`font-serif text-2xl transition-colors ${activeLifestyle === index ? 'text-white' : 'text-white/40'}`}>
                          {style.title}
                        </h3>
                        <ChevronRight className={`transition-opacity ${activeLifestyle === index ? 'opacity-100 text-[#Bfa67a]' : 'opacity-0'}`} size={20} />
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/communities"
                  className="mt-12 text-left text-xs font-bold uppercase tracking-[0.2em] border-b border-white/30 pb-2 self-start text-white hover:text-[#Bfa67a] hover:border-[#Bfa67a] transition-colors"
                >
                  Explore All Communities
                </Link>
              </div>
              <div className="w-full lg:w-2/3 relative min-h-[400px] lg:min-h-0 bg-[#0a1520] p-6 lg:p-8 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-serif text-xl">{editorialRegion.lifestyles[activeLifestyle]?.title}</h3>
                    <p className="text-white/50 text-xs mt-1">Hover to explore communities</p>
                  </div>
                  {(editorialRegion.lifestyles[activeLifestyle]?.communities.length ?? 0) > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveCommunity(prev => prev === 0 ? (editorialRegion.lifestyles?.[activeLifestyle]?.communities.length || 1) - 1 : prev - 1)}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-white/50 text-xs font-medium min-w-[40px] text-center">
                        {activeCommunity + 1} / {editorialRegion.lifestyles[activeLifestyle]?.communities.length}
                      </span>
                      <button
                        onClick={() => setActiveCommunity(prev => prev === (editorialRegion.lifestyles?.[activeLifestyle]?.communities.length || 1) - 1 ? 0 : prev + 1)}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex-1 flex gap-3 overflow-hidden">
                  {editorialRegion.lifestyles[activeLifestyle]?.communities.map((community, idx) => (
                    <Link
                      key={community.id}
                      to={`/phoenix/${regionId}/${community.id}`}
                      className={`
                        group relative overflow-hidden transition-all duration-500 ease-out cursor-pointer
                        ${activeCommunity === idx ? 'flex-[3]' : 'flex-[1]'}
                      `}
                      onMouseEnter={() => setActiveCommunity(idx)}
                    >
                      <div className="absolute inset-0">
                        <img
                          src={community.image}
                          alt={community.name}
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                        />
                        <div className={`absolute inset-0 transition-all duration-500 ${activeCommunity === idx ? 'bg-gradient-to-t from-[#0C1C2E] via-[#0C1C2E]/40 to-transparent' : 'bg-[#0C1C2E]/60'}`}></div>
                      </div>
                      <div className="absolute inset-0 flex flex-col justify-end p-4">
                        <div className={`transition-all duration-500 ${activeCommunity === idx ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                          <h4 className="text-white font-serif text-sm writing-mode-vertical transform -rotate-180" style={{ writingMode: 'vertical-rl' }}>
                            {community.name}
                          </h4>
                        </div>
                        <div className={`transition-all duration-500 ${activeCommunity === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 absolute'}`}>
                          <div className="h-[2px] w-8 bg-[#Bfa67a] mb-3 group-hover:w-16 transition-all duration-500"></div>
                          <h4 className="text-white font-serif text-xl mb-2">{community.name}</h4>
                          <p className="text-[#Bfa67a] text-[10px] font-bold tracking-widest uppercase mb-2">{community.priceRange}</p>
                          <p className="text-white/70 text-xs leading-relaxed mb-4 line-clamp-2">{community.bio}</p>
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white group-hover:text-[#Bfa67a] transition-colors">
                            Explore Community <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="flex justify-center gap-2 mt-4">
                  {editorialRegion.lifestyles[activeLifestyle]?.communities.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveCommunity(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${activeCommunity === idx ? 'w-6 bg-[#Bfa67a]' : 'w-1.5 bg-white/30 hover:bg-white/50'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Region Info Tabs — only if editorial data has them */}
      {editorialRegion && (editorialRegion.highlights || editorialRegion.marketMetrics || editorialRegion.amenities || editorialRegion.qualityOfLife) && (
        <section ref={highlightsAnim.ref} className="py-12 bg-white">
          <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {editorialRegion.highlights && (
                <button
                  onClick={() => setActiveInfoTab('special')}
                  className={`text-left p-4 transition-all duration-300 border-b-2 ${
                    activeInfoTab === 'special' ? 'border-[#Bfa67a] bg-[#F9F8F6]' : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-[0.25em] font-bold block mb-1 transition-colors ${activeInfoTab === 'special' ? 'text-[#Bfa67a]' : 'text-gray-400'}`}>
                    Why {regionName}
                  </span>
                  <h3 className={`text-lg font-serif transition-colors ${activeInfoTab === 'special' ? 'text-[#0C1C2E]' : 'text-gray-400'}`}>
                    What Makes It <span className="italic font-light">Special</span>
                  </h3>
                </button>
              )}
              {editorialRegion.marketMetrics && (
                <button
                  onClick={() => setActiveInfoTab('numbers')}
                  className={`text-left p-4 transition-all duration-300 border-b-2 ${
                    activeInfoTab === 'numbers' ? 'border-[#Bfa67a] bg-[#F9F8F6]' : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-[0.25em] font-bold block mb-1 transition-colors ${activeInfoTab === 'numbers' ? 'text-[#Bfa67a]' : 'text-gray-400'}`}>
                    Market Intelligence
                  </span>
                  <h3 className={`text-lg font-serif transition-colors ${activeInfoTab === 'numbers' ? 'text-[#0C1C2E]' : 'text-gray-400'}`}>
                    By the <span className="italic font-light">Numbers</span>
                  </h3>
                </button>
              )}
              {editorialRegion.amenities && (
                <button
                  onClick={() => setActiveInfoTab('amenities')}
                  className={`text-left p-4 transition-all duration-300 border-b-2 ${
                    activeInfoTab === 'amenities' ? 'border-[#Bfa67a] bg-[#F9F8F6]' : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-[0.25em] font-bold block mb-1 transition-colors ${activeInfoTab === 'amenities' ? 'text-[#Bfa67a]' : 'text-gray-400'}`}>
                    What's Nearby
                  </span>
                  <h3 className={`text-lg font-serif transition-colors ${activeInfoTab === 'amenities' ? 'text-[#0C1C2E]' : 'text-gray-400'}`}>
                    Amenities & <span className="italic font-light">Attractions</span>
                  </h3>
                </button>
              )}
              {editorialRegion.qualityOfLife && (
                <button
                  onClick={() => setActiveInfoTab('residents')}
                  className={`text-left p-4 transition-all duration-300 border-b-2 ${
                    activeInfoTab === 'residents' ? 'border-[#Bfa67a] bg-[#F9F8F6]' : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-[0.25em] font-bold block mb-1 transition-colors ${activeInfoTab === 'residents' ? 'text-[#Bfa67a]' : 'text-gray-400'}`}>
                    Quality of Life
                  </span>
                  <h3 className={`text-lg font-serif transition-colors ${activeInfoTab === 'residents' ? 'text-[#0C1C2E]' : 'text-gray-400'}`}>
                    What Residents <span className="italic font-light">Love</span>
                  </h3>
                </button>
              )}
            </div>

            <div className="min-h-[180px]">
              {activeInfoTab === 'special' && editorialRegion.highlights && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {editorialRegion.highlights.map((highlight, idx) => {
                    const IconComponent = ICON_MAP[highlight.icon] || Mountain;
                    return (
                      <div key={idx} className="text-center p-4 bg-[#F9F8F6] hover:shadow-md transition-all duration-300 group cursor-pointer">
                        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[#0C1C2E]/5 flex items-center justify-center group-hover:bg-[#Bfa67a]/20 transition-colors">
                          <IconComponent size={18} className="text-[#Bfa67a]" />
                        </div>
                        <h3 className="text-sm font-serif text-[#0C1C2E] mb-1 group-hover:text-[#Bfa67a] transition-colors">{highlight.title}</h3>
                        <p className="text-gray-500 text-[11px] leading-snug">{highlight.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              {activeInfoTab === 'numbers' && editorialRegion.marketMetrics && (
                <div>
                  <div className="flex justify-end mb-4">
                    <Link
                      to={`/report?region=${regionId}`}
                      className="inline-flex items-center gap-1 text-[#Bfa67a] text-[10px] uppercase tracking-[0.15em] font-bold hover:gap-2 transition-all group"
                    >
                      Full Market Report <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    {editorialRegion.marketMetrics.map((metric, idx) => (
                      <div key={idx} className="bg-[#F9F8F6] p-4 hover:shadow-md transition-all duration-300 group cursor-pointer">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold truncate">{metric.label}</span>
                          {metric.change && (
                            <span className={`flex items-center text-[10px] font-bold ${
                              metric.trend === 'up' ? 'text-emerald-600' : metric.trend === 'down' ? 'text-rose-500' : 'text-gray-500'
                            }`}>
                              {metric.trend === 'up' && <TrendingUp size={10} />}
                              {metric.trend === 'down' && <TrendingDown size={10} />}
                            </span>
                          )}
                        </div>
                        <div className="text-xl font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">{metric.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeInfoTab === 'amenities' && editorialRegion.amenities && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {editorialRegion.amenities.map((category, idx) => (
                    <div key={idx} className="bg-[#F9F8F6] p-4 hover:shadow-md transition-shadow">
                      <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold mb-3 pb-2 border-b border-gray-200">{category.category}</h3>
                      <ul className="space-y-2">
                        {category.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-center justify-between text-[11px] group cursor-pointer">
                            <span className="text-gray-700 group-hover:text-[#0C1C2E] transition-colors truncate pr-2">{item.name}</span>
                            {item.distance && <span className="text-gray-400 text-[10px] group-hover:text-[#Bfa67a] transition-colors whitespace-nowrap">{item.distance}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
              {activeInfoTab === 'residents' && editorialRegion.qualityOfLife && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {editorialRegion.qualityOfLife.map((item, idx) => (
                    <div key={idx} className="bg-[#F9F8F6] p-4 hover:shadow-md transition-all duration-300 group">
                      <div className="flex flex-col mb-2">
                        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-1">{item.metric}</span>
                        <span className="text-[#Bfa67a] font-serif text-lg group-hover:scale-105 transition-transform">{item.value}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Communities - from JSON data */}
      <section ref={communitiesAnim.ref} className="py-16 bg-[#F5F5F0]">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
          <div className={`flex justify-between items-end mb-10 transition-all duration-700 ${communitiesAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div>
              <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-3 block">Explore Communities</span>
              <h2 className="text-2xl md:text-3xl font-serif text-[#0C1C2E]">
                {regionName} <span className="italic font-light">Communities</span>
              </h2>
            </div>
            <Link
              to="/communities"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors group"
            >
              View All
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {jsonCommunities.map((community, index) => (
              <Link
                key={community.id}
                to={`/phoenix/${regionId}/${community.id}`}
                className="group relative h-[280px] overflow-hidden cursor-pointer"
                style={{
                  animation: `fadeSlideIn 0.5s ease-out ${index * 50}ms both`
                }}
              >
                <CompareButton communityId={community.id} />
                <div className="absolute inset-0 bg-[#0C1C2E]">
                  <img
                    src={community.heroImage}
                    alt={community.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E] via-transparent to-transparent opacity-90"></div>
                </div>
                <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    {community.gating.toLowerCase().includes('guard') && (
                      <span className="inline-flex items-center gap-1 bg-[#Bfa67a]/80 text-white text-[7px] uppercase tracking-widest font-bold px-1.5 py-0.5 mb-1">
                        <Shield size={7} /> Gated
                      </span>
                    )}
                    <h4 className="font-serif text-base md:text-lg mb-1">{community.name}</h4>
                    <div className="h-[1px] w-6 bg-[#Bfa67a] mb-1.5 group-hover:w-12 transition-all duration-500"></div>
                    <p className="text-[#Bfa67a] text-[9px] font-bold tracking-widest uppercase mb-0.5">{community.priceRange.split('–')[0]?.trim()}</p>
                    <div className="mt-3 flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200 text-white">
                      Explore <ArrowRight size={10} className="text-[#Bfa67a]" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#0C1C2E] py-24">
        <div className="max-w-[800px] mx-auto px-8 text-center">
          <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Ready to Explore?</span>
          <h2 className="text-3xl md:text-5xl font-serif text-white mb-6">
            Find Your Home in <span className="italic font-light">{regionName}</span>
          </h2>
          <p className="text-white/60 mb-10 text-lg font-light">
            Let Yong Choi guide you through the nuances of each community to find the perfect match for your lifestyle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={`/listings?region=${regionId}`}
              className="bg-[#Bfa67a] text-white px-10 py-5 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center justify-center gap-2 group"
            >
              <Home size={14} />
              View Active Listings
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/contact"
              className="border border-white/30 text-white px-10 py-5 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center justify-center gap-2"
            >
              <Calendar size={14} />
              Schedule Consultation
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default RegionPage;
