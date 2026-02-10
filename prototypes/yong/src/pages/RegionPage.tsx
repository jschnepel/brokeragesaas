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
import { agentSchema, breadcrumbSchema, placeSchema } from '../utils/structuredData';

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


const RegionPage: React.FC = () => {
  const { regionId } = useParams<{ regionId: string }>();
  const region = regionId ? REGIONS[regionId] : null;

  const [galleryIndex, setGalleryIndex] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeLifestyle, setActiveLifestyle] = useState(0);
  const [activeCommunity, setActiveCommunity] = useState(0);
  const [activeInfoTab, setActiveInfoTab] = useState<'special' | 'numbers' | 'amenities' | 'residents'>('special');

  const communitiesPerPage = 4;
  const totalSlides = region ? Math.ceil(region.communities.length / communitiesPerPage) : 0;

  // Auto-rotate gallery
  useEffect(() => {
    if (!region) return;
    const interval = setInterval(() => {
      setGalleryIndex((prev) => (prev + 1) % region.gallery.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [region]);

  // Scroll to top on region change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [regionId]);

  // Animation hooks
  const highlightsAnim = useScrollAnimation();
  const communitiesAnim = useScrollAnimation();

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const currentCommunities = region?.communities.slice(
    currentSlide * communitiesPerPage,
    currentSlide * communitiesPerPage + communitiesPerPage
  ) || [];

  if (!region) {
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
        title={`${region.name} Real Estate | Luxury Homes in Phoenix`}
        description={region.tagline}
        structuredData={[
          agentSchema(),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Communities', path: '/communities' },
            { name: region.name, path: `/phoenix/${regionId}` },
          ]),
          placeSchema(region.name, region.tagline),
        ]}
      />

      <PageHero
        title={region.name}
        subtitle={region.tagline}
        image={region.heroImage}
        height="70vh"
        minHeight="600px"
        badge="Region Profile"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Communities', href: '/communities' },
          { label: region.name },
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

      <HeroKpiCards kpis={region.stats.map(s => ({
        label: s.label,
        value: s.value,
        trend: s.trend,
        trendDirection: s.trendDir,
        subtext: 'vs. Last Year',
      }))} />

      {/* Bento Box Layout - Region Information */}
      <section className="py-16 max-w-[1600px] mx-auto px-8 lg:px-20">
        <div className="grid grid-cols-12 gap-4 items-stretch">

          {/* THE NARRATIVE - Main Content (8 cols) */}
          <div className="col-span-12 lg:col-span-8 bg-white p-10 shadow-lg shadow-black/5 flex flex-col">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-6 block">
              {region.lifestyle ? 'Living Here' : 'The Region'}
            </span>
            <h2 className="text-3xl md:text-4xl font-serif leading-[1.1] text-[#0C1C2E] mb-8">
              {region.lifestyle?.title || region.name} <span className="italic text-gray-400">— {region.name}</span>
            </h2>

            <div className="prose prose-lg text-gray-500 font-light leading-relaxed mb-8 max-w-none space-y-6">
              <p className="first-letter:text-5xl first-letter:font-serif first-letter:text-[#0C1C2E] first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                {region.description}
              </p>

              {/* Lifestyle paragraphs integrated */}
              {region.lifestyle?.paragraphs.map((paragraph, idx) => (
                <p key={idx}>
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Quick Facts Tags */}
            <div className="flex flex-wrap gap-3 mb-8">
              <span className="bg-gray-100 text-[#0C1C2E] px-4 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                <Shield size={12} className="text-[#Bfa67a]" /> Guard-Gated
              </span>
              <span className="bg-gray-100 text-[#0C1C2E] px-4 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                <Star size={12} className="text-[#Bfa67a]" /> World-Class Golf
              </span>
              <span className="bg-gray-100 text-[#0C1C2E] px-4 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                <Mountain size={12} className="text-[#Bfa67a]" /> Desert Preserve
              </span>
              <span className="bg-gray-100 text-[#0C1C2E] px-4 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                <Sun size={12} className="text-[#Bfa67a]" /> 330+ Sunny Days
              </span>
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

          {/* RIGHT COLUMN - Gallery + Quick Stats (4 cols) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col">
            <div className="flex flex-col flex-1 space-y-4">
              {/* GALLERY - Auto Rotating */}
              <div className="relative h-[320px] overflow-hidden group">
                {region.gallery.map((image, index) => (
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
                  <span className="text-[9px] uppercase tracking-widest text-[#Bfa67a] font-bold block">{region.gallery[galleryIndex]?.category}</span>
                  <h3 className="text-lg font-serif">{region.gallery[galleryIndex]?.caption}</h3>
                </div>
                <div className="absolute bottom-4 right-4 flex gap-1 z-10">
                  {region.gallery.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setGalleryIndex(index)}
                      className={`h-1 rounded-full transition-all ${galleryIndex === index ? 'w-4 bg-[#Bfa67a]' : 'w-1 bg-white/50'}`}
                    />
                  ))}
                </div>
                <button className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold text-[#0C1C2E] z-10">
                  <Camera size={12} /> {region.gallery.length} Photos
                </button>
              </div>

              {/* REGION STATS */}
              <div className="bg-[#0C1C2E] p-6 flex-1 flex flex-col">
                <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold mb-5 block">At a Glance</span>
                <div className="space-y-4">
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Communities</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">{region.communities.length}+</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Price Range</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">$500K - $25M+</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Distance to PHX</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">25-35 min</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">School Rating</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">A+ District</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Golf Courses</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">40+</span>
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

      {/* Curated Lifestyles - Interactive Hover with Community Carousel */}
      {region.lifestyles && (
        <section className="py-16">
          <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
            <div className="flex flex-col lg:flex-row min-h-[500px] overflow-hidden bg-[#0C1C2E]">

              {/* Left Side: Navigation List */}
              <div className="w-full lg:w-1/3 p-8 lg:p-12 flex flex-col justify-center z-10">
                <div className="mb-12">
                  <span className="text-[#Bfa67a] text-xs font-bold tracking-[0.2em] uppercase block mb-4">Curated Lifestyles</span>
                  <h2 className="font-serif text-4xl text-white">Find Your Niche</h2>
                </div>

                <div className="space-y-2">
                  {region.lifestyles.map((style, index) => (
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

              {/* Right Side: Community Cards Carousel */}
              <div className="w-full lg:w-2/3 relative min-h-[400px] lg:min-h-0 bg-[#0a1520] p-6 lg:p-8 flex flex-col">
                {/* Collection Title */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-serif text-xl">{region.lifestyles[activeLifestyle]?.title}</h3>
                    <p className="text-white/50 text-xs mt-1">Hover to explore communities</p>
                  </div>
                  {region.lifestyles[activeLifestyle]?.communities.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveCommunity(prev => prev === 0 ? (region.lifestyles?.[activeLifestyle]?.communities.length || 1) - 1 : prev - 1)}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-white/50 text-xs font-medium min-w-[40px] text-center">
                        {activeCommunity + 1} / {region.lifestyles[activeLifestyle]?.communities.length}
                      </span>
                      <button
                        onClick={() => setActiveCommunity(prev => prev === (region.lifestyles?.[activeLifestyle]?.communities.length || 1) - 1 ? 0 : prev + 1)}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Community Cards */}
                <div className="flex-1 flex gap-3 overflow-hidden">
                  {region.lifestyles[activeLifestyle]?.communities.map((community, idx) => (
                    <Link
                      key={community.id}
                      to={`/phoenix/${regionId}/${community.id}`}
                      className={`
                        group relative overflow-hidden transition-all duration-500 ease-out cursor-pointer
                        ${activeCommunity === idx ? 'flex-[3]' : 'flex-[1]'}
                      `}
                      onMouseEnter={() => setActiveCommunity(idx)}
                    >
                      {/* Background Image */}
                      <div className="absolute inset-0">
                        <img
                          src={community.image}
                          alt={community.name}
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                        />
                        <div className={`absolute inset-0 transition-all duration-500 ${activeCommunity === idx ? 'bg-gradient-to-t from-[#0C1C2E] via-[#0C1C2E]/40 to-transparent' : 'bg-[#0C1C2E]/60'}`}></div>
                      </div>

                      {/* Content */}
                      <div className="absolute inset-0 flex flex-col justify-end p-4">
                        {/* Collapsed State - Just Name */}
                        <div className={`transition-all duration-500 ${activeCommunity === idx ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                          <h4 className="text-white font-serif text-sm writing-mode-vertical transform -rotate-180" style={{ writingMode: 'vertical-rl' }}>
                            {community.name}
                          </h4>
                        </div>

                        {/* Expanded State - Full Info */}
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

                {/* Dots Navigation */}
                <div className="flex justify-center gap-2 mt-4">
                  {region.lifestyles[activeLifestyle]?.communities.map((_, idx) => (
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

      {/* Region Info Tabs */}
      {(region.highlights || region.marketMetrics || region.amenities || region.qualityOfLife) && (
        <section ref={highlightsAnim.ref} className="py-12 bg-white">
          <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
            {/* Tab Navigation - Same title format as before */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {region.highlights && (
                <button
                  onClick={() => setActiveInfoTab('special')}
                  className={`text-left p-4 transition-all duration-300 border-b-2 ${
                    activeInfoTab === 'special'
                      ? 'border-[#Bfa67a] bg-[#F9F8F6]'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-[0.25em] font-bold block mb-1 transition-colors ${
                    activeInfoTab === 'special' ? 'text-[#Bfa67a]' : 'text-gray-400'
                  }`}>
                    Why {region.name}
                  </span>
                  <h3 className={`text-lg font-serif transition-colors ${
                    activeInfoTab === 'special' ? 'text-[#0C1C2E]' : 'text-gray-400'
                  }`}>
                    What Makes It <span className="italic font-light">Special</span>
                  </h3>
                </button>
              )}
              {region.marketMetrics && (
                <button
                  onClick={() => setActiveInfoTab('numbers')}
                  className={`text-left p-4 transition-all duration-300 border-b-2 ${
                    activeInfoTab === 'numbers'
                      ? 'border-[#Bfa67a] bg-[#F9F8F6]'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-[0.25em] font-bold block mb-1 transition-colors ${
                    activeInfoTab === 'numbers' ? 'text-[#Bfa67a]' : 'text-gray-400'
                  }`}>
                    Market Intelligence
                  </span>
                  <h3 className={`text-lg font-serif transition-colors ${
                    activeInfoTab === 'numbers' ? 'text-[#0C1C2E]' : 'text-gray-400'
                  }`}>
                    By the <span className="italic font-light">Numbers</span>
                  </h3>
                </button>
              )}
              {region.amenities && (
                <button
                  onClick={() => setActiveInfoTab('amenities')}
                  className={`text-left p-4 transition-all duration-300 border-b-2 ${
                    activeInfoTab === 'amenities'
                      ? 'border-[#Bfa67a] bg-[#F9F8F6]'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-[0.25em] font-bold block mb-1 transition-colors ${
                    activeInfoTab === 'amenities' ? 'text-[#Bfa67a]' : 'text-gray-400'
                  }`}>
                    What's Nearby
                  </span>
                  <h3 className={`text-lg font-serif transition-colors ${
                    activeInfoTab === 'amenities' ? 'text-[#0C1C2E]' : 'text-gray-400'
                  }`}>
                    Amenities & <span className="italic font-light">Attractions</span>
                  </h3>
                </button>
              )}
              {region.qualityOfLife && (
                <button
                  onClick={() => setActiveInfoTab('residents')}
                  className={`text-left p-4 transition-all duration-300 border-b-2 ${
                    activeInfoTab === 'residents'
                      ? 'border-[#Bfa67a] bg-[#F9F8F6]'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-[0.25em] font-bold block mb-1 transition-colors ${
                    activeInfoTab === 'residents' ? 'text-[#Bfa67a]' : 'text-gray-400'
                  }`}>
                    Quality of Life
                  </span>
                  <h3 className={`text-lg font-serif transition-colors ${
                    activeInfoTab === 'residents' ? 'text-[#0C1C2E]' : 'text-gray-400'
                  }`}>
                    What Residents <span className="italic font-light">Love</span>
                  </h3>
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="min-h-[180px]">
              {/* What Makes It Special */}
              {activeInfoTab === 'special' && region.highlights && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {region.highlights.map((highlight, idx) => {
                    const IconComponent = ICON_MAP[highlight.icon] || Mountain;
                    return (
                      <div
                        key={idx}
                        className="text-center p-4 bg-[#F9F8F6] hover:shadow-md transition-all duration-300 group cursor-pointer"
                      >
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

              {/* By the Numbers */}
              {activeInfoTab === 'numbers' && region.marketMetrics && (
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
                    {region.marketMetrics.map((metric, idx) => (
                      <div
                        key={idx}
                        className="bg-[#F9F8F6] p-4 hover:shadow-md transition-all duration-300 group cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold truncate">
                            {metric.label}
                          </span>
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

              {/* Amenities & Attractions */}
              {activeInfoTab === 'amenities' && region.amenities && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {region.amenities.map((category, idx) => (
                    <div key={idx} className="bg-[#F9F8F6] p-4 hover:shadow-md transition-shadow">
                      <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold mb-3 pb-2 border-b border-gray-200">
                        {category.category}
                      </h3>
                      <ul className="space-y-2">
                        {category.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-center justify-between text-[11px] group cursor-pointer">
                            <span className="text-gray-700 group-hover:text-[#0C1C2E] transition-colors truncate pr-2">{item.name}</span>
                            {item.distance && (
                              <span className="text-gray-400 text-[10px] group-hover:text-[#Bfa67a] transition-colors whitespace-nowrap">{item.distance}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* What Residents Love */}
              {activeInfoTab === 'residents' && region.qualityOfLife && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {region.qualityOfLife.map((item, idx) => (
                    <div key={idx} className="bg-[#F9F8F6] p-4 hover:shadow-md transition-all duration-300 group">
                      <div className="flex flex-col mb-2">
                        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-1">
                          {item.metric}
                        </span>
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

      {/* Communities - Showcase Cards */}
      <section ref={communitiesAnim.ref} className="py-16 bg-[#F5F5F0]">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
          <div className={`flex justify-between items-end mb-10 transition-all duration-700 ${communitiesAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div>
              <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-3 block">Explore Communities</span>
              <h2 className="text-2xl md:text-3xl font-serif text-[#0C1C2E]">
                {region.name} <span className="italic font-light">Communities</span>
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

          {/* Showcase Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {region.communities.map((community, index) => (
              <Link
                key={community.id}
                to={`/phoenix/${regionId}/${community.id}`}
                className="group relative h-[280px] overflow-hidden cursor-pointer"
                style={{
                  animation: `fadeSlideIn 0.5s ease-out ${index * 50}ms both`
                }}
              >
                {/* Background Image */}
                <div className="absolute inset-0 bg-[#0C1C2E]">
                  <img
                    src={community.image}
                    alt={community.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E] via-transparent to-transparent opacity-90"></div>
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <h4 className="font-serif text-base md:text-lg mb-1">{community.name}</h4>
                    <div className="h-[1px] w-6 bg-[#Bfa67a] mb-1.5 group-hover:w-12 transition-all duration-500"></div>
                    <p className="text-[#Bfa67a] text-[9px] font-bold tracking-widest uppercase mb-0.5">{region.name}</p>
                    <p className="text-white/70 text-[10px] font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{community.priceRange.split(' - ')[0]}</p>
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
            Find Your Home in <span className="italic font-light">{region.name}</span>
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

      {/* Custom CSS for animations */}
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
