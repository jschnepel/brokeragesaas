import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  MapPin,
  Maximize2,
  BedDouble,
  ShowerHead,
  TrendingUp,
  Compass,
  ArrowRight,
  Download,
  Calendar,
  Mountain,
  TreePine,
  Shield,
  Zap,
  Activity,
  GraduationCap,
  Car,
  Plane,
  Utensils,
  Star,
  Camera,
  VolumeX,
  Moon,
  Sun,
  Wind,
  Home,
  Flag,
} from 'lucide-react';
import MapGL, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import type { FillLayerSpecification, LineLayerSpecification } from 'maplibre-gl';
import { MAP_STYLE } from '../data/phoenixLuxuryZones';
import Footer from '../components/Footer';
import PageHero from '../components/shared/PageHero';
import SEOHead from '../components/shared/SEOHead';
import HeroKpiCards from '../components/shared/HeroKpiCards';
import { useScrollAnimation } from '../components/shared/useScrollAnimation';
import LoadingShell from '../components/community/LoadingShell';
import { agentSchema, breadcrumbSchema, placeSchema } from '../utils/structuredData';
import { getCommunityById } from '../data/communityLoader';
import { resolvedToTemplate } from '../utils/communityAdapter';

// --- Types (matching the JSON schema) ---

interface Listing {
  id: number;
  price: string;
  ppsf: string;
  beds: number;
  baths: number;
  sqft: number;
  address: string;
  status: 'Active' | 'Pending' | 'Coming Soon';
  lot: string;
  img: string;
}

interface MarketMetric {
  label: string;
  value: string;
  numericValue: number;
  suffix: string;
  trend: string;
  trendDir: 'up' | 'down' | 'neutral';
  description: string;
}

interface GalleryImage {
  url: string;
  caption: string;
  category: string;
}

interface QualityMetric {
  metric: string;
  value: string;
  score: number;
  icon: string;
  color: string;
}

interface School {
  name: string;
  type: string;
  rating: number;
  distance: string;
}

interface Restaurant {
  name: string;
  cuisine: string;
  distance: string;
  rating: number;
  image: string;
}

interface Employer {
  name: string;
  sector: string;
  employees: string;
}

interface EconomicStat {
  label: string;
  value: string;
  benchmark: string;
}

interface KeyDistance {
  place: string;
  time: string;
}

interface ExploreItem {
  id: number;
  name: string;
  coords: [number, number];
  // Listings
  price?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  // Dining
  cuisine?: string;
  rating?: number;
  // Trails
  difficulty?: 'Easy' | 'Moderate' | 'Difficult';
  distance?: string;
  // Golf
  type?: string;
  holes?: number;
}

interface ExploreTab {
  key: string;
  label: string;
  desc?: string;
  markerColor: string;
  items: ExploreItem[];
}

interface ExploreData {
  center: [number, number];
  zoom: number;
  tabs: ExploreTab[];
}

interface NarrativeSection {
  tab: string;
  content: string;
}

interface NarrativeStructured {
  lead: string;
  sections: NarrativeSection[];
}

interface CommunityTemplateData {
  id: string;
  name: string;
  city: string;
  region: string;
  tagline: string;
  description: string;
  narrative: string | NarrativeStructured;
  heroImage: string;
  elevation: string;
  zipCode: string;
  coordinates: [number, number];
  stats: {
    avgPrice: string;
    priceRange: string;
    avgPpsf: string;
    avgDom: number;
    inventory: number;
    trend: string;
  };
  metrics: MarketMetric[];
  features: string[];
  amenities: string[];
  gallery: GalleryImage[] | null;
  demographics: {
    population: string;
    medianAge: string;
    collegeEducated: string;
    householdIncome: string;
    homeOwnership: string;
    avgHomeValue: string;
  } | null;
  qualityOfLife: QualityMetric[] | null;
  schools: School[];
  restaurants: Restaurant[];
  employers: Employer[] | null;
  economicStats: EconomicStat[] | null;
  airports: {
    private: { name: string; type: string; distance: string };
    commercial: { name: string; type: string; distance: string };
  };
  keyDistances: KeyDistance[];
  signatureAmenity: {
    icon: string;
    title: string;
    description: string;
    stats: { value: string; label: string }[];
    image: string;
  };
  listings: Listing[];
  exploreData: ExploreData;
  boundary?: boolean;
}

// --- Teardrop Marker Style ---
const TeardropMarker: React.FC<{ color: string }> = ({ color }) => (
  <div
    style={{
      backgroundColor: color,
      width: 32,
      height: 32,
      borderRadius: '50% 50% 50% 0',
      transform: 'rotate(-45deg)',
      border: '3px solid white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      cursor: 'pointer',
    }}
  />
);

const TAB_ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  listings: Home,
  dining: Utensils,
  trails: Mountain,
  golf: Flag,
  shopping: MapPin,
  fitness: Activity,
  parks: TreePine,
};

// MapUpdater removed — MapLibre uses ref.flyTo() instead

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Wind,
  Sun,
  Shield,
  Activity,
  VolumeX,
  Moon,
  Mountain,
  TreePine,
  Zap,
};

// --- Template Component ---

interface TemplateCommunityPageProps {
  data?: CommunityTemplateData;
}

const TemplateCommunityPage: React.FC<TemplateCommunityPageProps> = ({ data }) => {
  // Use passed data or fall back to Desert Mountain from communityLoader
  const fallback = !data ? (() => {
    const resolved = getCommunityById('desert-mountain');
    return resolved ? resolvedToTemplate(resolved) : null;
  })() : null;
  const community = (data ?? fallback) as CommunityTemplateData | null;
  const exploreData = community?.exploreData;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [activeMapTab, setActiveMapTab] = useState<string>(exploreData?.tabs?.[0]?.key ?? 'listings');
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [narrativeTab, setNarrativeTab] = useState(0);
  const [popupMarker, setPopupMarker] = useState<ExploreItem | null>(null);
  const mapRef = useRef<MapRef>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [boundaryGeoJson, setBoundaryGeoJson] = useState<any>(null);

  const listingsPerPage = 3;
  const totalSlides = Math.ceil(community.listings.length / listingsPerPage);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch community boundary polygon from GeoJSON
  useEffect(() => {
    if (!community.boundary) return;
    fetch('/luxury-communities.geojson')
      .then(res => res.json())
      .then(data => {
        const feature = data.features?.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (f: any) => f.properties?.slug === community.id
        );
        if (feature) setBoundaryGeoJson(feature);
      })
      .catch(() => { /* boundary not critical */ });
  }, [community.boundary, community.id]);

  // Fit map to boundary polygon once loaded
  useEffect(() => {
    if (!boundaryGeoJson || !mapRef.current) return;
    const map = mapRef.current.getMap();
    // Flatten all coordinates from Polygon / MultiPolygon
    const coords: [number, number][] = [];
    const geom = boundaryGeoJson.geometry;
    if (geom?.type === 'Polygon') {
      for (const ring of geom.coordinates) {
        for (const c of ring) coords.push(c as [number, number]);
      }
    } else if (geom?.type === 'MultiPolygon') {
      for (const poly of geom.coordinates) {
        for (const ring of poly) {
          for (const c of ring) coords.push(c as [number, number]);
        }
      }
    }
    if (coords.length > 0) {
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 40, maxZoom: 14 }
      );
    }
  }, [boundaryGeoJson]);

  // Auto-rotate gallery
  useEffect(() => {
    if (!community.gallery || community.gallery.length === 0) return;
    const galleryLength = community.gallery.length;
    const interval = setInterval(() => {
      setGalleryIndex((prev) => (prev + 1) % galleryLength);
    }, 4000);
    return () => clearInterval(interval);
  }, [community.gallery]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  const currentListings = community.listings.slice(
    currentSlide * listingsPerPage,
    currentSlide * listingsPerPage + listingsPerPage
  );

  const featuredAnim = useScrollAnimation();

  // Guard: if no data loaded
  if (!community?.name) {
    return (
      <PageHero title="Community Template" image="" height="50vh">
        <div className="text-center mt-8">
          <p className="text-white/70 mb-8">No community data available.</p>
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
        title={`${community.name} Homes for Sale | ${community.city}, Phoenix`}
        description={community.tagline}
        structuredData={[
          agentSchema(),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Communities', path: '/communities' },
            { name: community.name, path: `/phoenix/${community.region}/${community.id}` },
          ]),
          placeSchema(community.name, community.tagline, community.city),
        ]}
      />

      {/* HERO — heroImage kept as data-driven field */}
      <PageHero
        title={community.name}
        image={community.heroImage}
        height="70vh"
        minHeight="600px"
        badge="Community Profile"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Communities', href: '/communities' },
          { label: community.name },
        ]}
        actions={
          <>
            <button className="bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2 group shadow-xl">
              Schedule Tour
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
            </button>
            <button className="bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2 shadow-xl">
              <Download size={14} />
              Get Guide
            </button>
          </>
        }
      >
        <div className="flex flex-wrap gap-3 md:gap-6 text-[10px] uppercase tracking-[0.25em] font-medium text-white/80 pl-1 -mt-4">
          <span className="flex items-center gap-2"><MapPin size={12}/> {community.city}, AZ {community.zipCode}</span>
          <span className="flex items-center gap-2"><Compass size={12}/> {community.elevation} Elevation</span>
        </div>
      </PageHero>

      {/* KPI CARDS */}
      <HeroKpiCards kpis={community.metrics.map(m => ({
        label: m.label,
        value: m.value,
        trend: m.trend,
        trendDirection: m.trendDir,
        subtext: m.description,
      }))} />

      {/* BENTO BOX LAYOUT */}
      <section className="py-10 md:py-16 max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20">
        <div className="grid grid-cols-12 gap-4">

          {/* THE NARRATIVE — 8 cols */}
          <div className="col-span-12 lg:col-span-8 bg-white p-6 md:p-10 shadow-lg shadow-black/5">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-6 block">The Narrative</span>
            <h2 className="text-3xl md:text-4xl font-serif leading-[1.1] text-[#0C1C2E] mb-8">
              {community.tagline} <span className="italic text-gray-400">— {community.city}</span>
            </h2>

            {(() => {
              const narr = community.narrative;

              // Structured narrative format: { lead, sections: [{ tab, content }] }
              if (typeof narr === 'object' && narr !== null && 'sections' in narr) {
                const structured = narr as NarrativeStructured;
                return (
                  <div className="mb-8">
                    <p className="text-gray-500 font-light leading-relaxed text-[16px] first-letter:text-5xl first-letter:font-serif first-letter:text-[#0C1C2E] first-letter:mr-3 first-letter:float-left first-letter:leading-none mb-8">
                      {structured.lead}
                    </p>

                    <div className="flex gap-3 mb-10 border-b border-[#0C1C2E]/10 pb-0 overflow-x-auto no-scrollbar">
                      {structured.sections.map((sec, si) => (
                        <button
                          key={si}
                          onClick={() => setNarrativeTab(si)}
                          className={`relative px-4 md:px-5 pb-4 pt-2 text-[11px] uppercase tracking-[0.25em] font-bold transition-all duration-300 whitespace-nowrap min-h-[44px] ${
                            narrativeTab === si
                              ? 'text-[#0C1C2E]'
                              : 'text-[#0C1C2E]/30 hover:text-[#0C1C2E]/60'
                          }`}
                        >
                          <span className="relative z-10">{sec.tab}</span>
                          <span className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
                            narrativeTab === si
                              ? 'h-[3px] bg-[#Bfa67a]'
                              : 'h-[1px] bg-transparent'
                          }`} />
                        </button>
                      ))}
                    </div>

                    {structured.sections.map((sec, si) => (
                      <div key={si} className={narrativeTab === si ? 'animate-fadeIn block' : 'hidden'}>
                        <div className="text-gray-500 font-light leading-relaxed text-[16px]">
                          {sec.content.split('\n\n').map((p, pi) => (
                            <p key={pi} className={pi > 0 ? 'mt-6' : ''}>{p}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              // Legacy string format fallback
              const text = typeof narr === 'string' ? narr : '';
              const paragraphs = text.split('\n\n');

              if (paragraphs.length <= 2) {
                return (
                  <div className="text-gray-500 font-light leading-relaxed text-[16px] mb-8">
                    {paragraphs.map((p, pi) => (
                      <p key={pi} className={pi === 0 ? 'first-letter:text-5xl first-letter:font-serif first-letter:text-[#0C1C2E] first-letter:mr-3 first-letter:float-left first-letter:leading-none' : 'mt-6'}>
                        {p}
                      </p>
                    ))}
                  </div>
                );
              }

              const lead = paragraphs[0];
              const rest = paragraphs.slice(1);
              const chunkSize = Math.max(1, Math.ceil(rest.length / 3));
              const TAB_LABELS = ['Legacy', 'Lifestyle', 'The Homes'];
              const tabs: { label: string; paras: string[] }[] = [];
              for (let t = 0; t < 3 && t * chunkSize < rest.length; t++) {
                tabs.push({
                  label: TAB_LABELS[t],
                  paras: rest.slice(t * chunkSize, (t + 1) * chunkSize),
                });
              }

              return (
                <div className="mb-8">
                  <p className="text-gray-500 font-light leading-relaxed text-[16px] first-letter:text-5xl first-letter:font-serif first-letter:text-[#0C1C2E] first-letter:mr-3 first-letter:float-left first-letter:leading-none mb-8">
                    {lead}
                  </p>

                  <div className="flex gap-3 mb-10 border-b border-[#0C1C2E]/10 pb-0 overflow-x-auto no-scrollbar">
                    {tabs.map((tab, ti) => (
                      <button
                        key={ti}
                        onClick={() => setNarrativeTab(ti)}
                        className={`relative px-4 md:px-5 pb-4 pt-2 text-[11px] uppercase tracking-[0.25em] font-bold transition-all duration-300 whitespace-nowrap min-h-[44px] ${
                          narrativeTab === ti
                            ? 'text-[#0C1C2E]'
                            : 'text-[#0C1C2E]/30 hover:text-[#0C1C2E]/60'
                        }`}
                      >
                        <span className="relative z-10">{tab.label}</span>
                        <span className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
                          narrativeTab === ti
                            ? 'h-[3px] bg-[#Bfa67a]'
                            : 'h-[1px] bg-transparent'
                        }`} />
                      </button>
                    ))}
                  </div>

                  {tabs.map((tab, ti) => (
                    <div key={ti} className={narrativeTab === ti ? 'animate-fadeIn block' : 'hidden'}>
                      <div className="text-gray-500 font-light leading-relaxed text-[16px]">
                        {tab.paras.map((p, pi) => (
                          <p key={pi} className={pi > 0 ? 'mt-6' : ''}>{p}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Features Tags */}
            <div className="flex flex-wrap gap-3 mb-8">
              {community.features.map((feature, i) => (
                <span key={i} className="bg-gray-100 text-[#0C1C2E] px-4 py-2.5 md:py-2 text-[10px] uppercase tracking-widest font-bold">
                  {feature}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to={`/listings?community=${community.id}`}
                className="bg-[#0C1C2E] text-white px-6 py-4 md:py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#Bfa67a] transition-all flex items-center gap-2 group"
              >
                View Active Listings
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
              <button className="border border-[#0C1C2E] text-[#0C1C2E] px-6 py-4 md:py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#0C1C2E] hover:text-white transition-all flex items-center gap-2">
                Get Property Alerts
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN — Gallery + Demographics (4 cols) */}
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* GALLERY */}
              {community.gallery === null && (
                <LoadingShell icon={<Camera size={14} />} label="Gallery" title="Community Photos" height="h-[320px]" />
              )}
              {community.gallery && community.gallery.length > 0 && community.gallery[0].url && (
                <div className="relative h-[320px] overflow-hidden group">
                  {community.gallery.map((image, index) => (
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
                    <span className="text-[9px] uppercase tracking-widest text-[#Bfa67a] font-bold block">{community.gallery[galleryIndex]?.category}</span>
                    <h3 className="text-lg font-serif">{community.gallery[galleryIndex]?.caption}</h3>
                  </div>
                  <div className="absolute bottom-4 right-4 flex gap-1 z-10">
                    {community.gallery.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setGalleryIndex(index)}
                        className={`h-2 md:h-1 rounded-full transition-all ${galleryIndex === index ? 'w-6 md:w-4 bg-[#Bfa67a]' : 'w-2 md:w-1 bg-white/50'} min-h-[8px] min-w-[8px]`}
                      />
                    ))}
                  </div>
                  <button className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-2.5 md:py-1.5 text-[10px] md:text-[9px] uppercase tracking-widest font-bold text-[#0C1C2E] z-10">
                    <Camera size={12} /> {community.gallery.length} Photos
                  </button>
                </div>
              )}

              {/* DEMOGRAPHICS */}
              <div className="bg-[#0C1C2E] p-6">
                <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold mb-5 block">At a Glance</span>
                {community.demographics === null ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-3">
                      <span className="text-[#Bfa67a] animate-spin"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg></span>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Demographics loading</span>
                  </div>
                ) : (
                <div className="space-y-4">
                  {[
                    { label: 'Population', value: community.demographics.population },
                    { label: 'Median Age', value: community.demographics.medianAge },
                    { label: 'College Educated', value: community.demographics.collegeEducated },
                    { label: 'Median Income', value: community.demographics.householdIncome },
                    { label: 'Home Ownership', value: community.demographics.homeOwnership },
                    { label: 'Avg Home Value', value: community.demographics.avgHomeValue },
                  ].map((item, i, arr) => (
                    <div key={i} className={`flex justify-between items-center group cursor-pointer ${i < arr.length - 1 ? 'pb-3 border-b border-white/10' : ''}`}>
                      <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{item.label}</span>
                      <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">{item.value}</span>
                    </div>
                  ))}
                </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-white/10">
                  <div className="text-center p-3 bg-white/5 rounded">
                    <span className="text-2xl font-serif text-[#Bfa67a] block">{community.stats.avgPrice}</span>
                    <span className="text-[10px] md:text-[8px] uppercase tracking-widest text-gray-500">Avg Price</span>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded">
                    <span className="text-2xl font-serif text-emerald-400 block">{community.stats.trend}</span>
                    <span className="text-[10px] md:text-[8px] uppercase tracking-widest text-gray-500">YoY Growth</span>
                  </div>
                </div>

                {/* Market Intel Link */}
                <Link
                  to={`/market-intel/${community.id}`}
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
                <div className="mt-5 space-y-3">
                  <Link
                    to="/contact"
                    className="w-full bg-[#Bfa67a] text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center justify-center gap-2 group"
                  >
                    Contact Yong Choi
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to={`/listings?community=${community.id}`}
                    className="w-full border border-white/20 text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center justify-center gap-2"
                  >
                    Browse {community.stats.inventory} Listings
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* EXPLORE THE AREA — Full Width Map */}
          {exploreData && exploreData.center && exploreData.center[0] !== 0 && (
            <div className="col-span-12 shadow-lg shadow-black/5 overflow-hidden">
              <div className="grid grid-cols-12">
                {/* Left Side — Tab Navigation */}
                <div className="col-span-12 lg:col-span-5 flex flex-col h-auto lg:h-[580px]">
                  <div className="p-8 bg-[#0C1C2E]">
                    <div className="flex items-center gap-2 mb-3">
                      <Compass size={14} className="text-[#Bfa67a]" />
                      <span className="text-[9px] uppercase tracking-[0.25em] text-[#Bfa67a] font-bold">Explore the Area</span>
                    </div>
                    <h3 className="text-2xl font-serif text-white">What's <span className="italic font-light">Nearby</span></h3>
                  </div>

                  <div className="flex-1 bg-white">
                    {exploreData.tabs.map((tab) => {
                      const TabIcon = TAB_ICON_MAP[tab.key] ?? MapPin;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => {
                            setActiveMapTab(tab.key);
                            setSelectedMarker(null);
                          }}
                          className={`w-full p-5 flex items-center gap-5 transition-all duration-300 group border-b border-gray-100 ${
                            activeMapTab === tab.key ? 'bg-[#F9F8F6]' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-12 h-12 flex items-center justify-center transition-all duration-300 ${
                            activeMapTab === tab.key ? 'bg-[#Bfa67a]' : 'bg-gray-100 group-hover:bg-gray-200'
                          }`}>
                            <TabIcon size={20} className={activeMapTab === tab.key ? 'text-white' : 'text-gray-500'} />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`font-serif text-lg transition-colors ${
                                activeMapTab === tab.key ? 'text-[#0C1C2E]' : 'text-gray-600 group-hover:text-[#0C1C2E]'
                              }`}>{tab.label}</span>
                              <span className={`text-xl font-serif transition-colors ${
                                activeMapTab === tab.key ? 'text-[#Bfa67a]' : 'text-gray-300'
                              }`}>{tab.items.length}</span>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-gray-400">{tab.desc}</span>
                          </div>
                          <ChevronRight size={16} className={`transition-all duration-300 ${
                            activeMapTab === tab.key ? 'text-[#Bfa67a] translate-x-1' : 'text-gray-300 group-hover:text-gray-400'
                          }`} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Featured Items List */}
                  {(() => {
                    const activeTab = exploreData.tabs.find(t => t.key === activeMapTab) ?? exploreData.tabs[0];
                    return (
                      <div className="bg-[#F9F8F6] flex-1 flex flex-col min-h-0">
                        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#Bfa67a]" />
                            <span className="text-[9px] uppercase tracking-[0.2em] text-[#0C1C2E] font-bold">
                              {activeTab.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400">{activeTab.items.length} locations</span>
                        </div>
                        <div className="divide-y divide-gray-100 flex-1 overflow-y-auto no-scrollbar">
                          {activeTab.items.map((item, idx) => (
                            <div
                              key={item.id}
                              onClick={() => setSelectedMarker(item.id)}
                              className={`px-5 py-3 cursor-pointer transition-all flex items-center gap-4 ${
                                selectedMarker === item.id
                                  ? 'bg-[#Bfa67a]/10 border-l-2 border-[#Bfa67a]'
                                  : 'bg-white hover:bg-gray-50 border-l-2 border-transparent'
                              }`}
                            >
                              <span className="text-[10px] text-gray-300 font-mono w-4">{String(idx + 1).padStart(2, '0')}</span>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-[#0C1C2E] truncate block">{item.name}</span>
                                {item.cuisine && <span className="text-[10px] text-gray-400">{item.cuisine}</span>}
                                {item.type && !item.cuisine && <span className="text-[10px] text-gray-400">{item.type}</span>}
                              </div>
                              {/* Listing detail */}
                              {item.price && <span className="text-[#Bfa67a] font-serif text-sm whitespace-nowrap">{item.price}</span>}
                              {/* Dining detail */}
                              {item.rating != null && (
                                <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                  <Star size={10} className="text-[#Bfa67a] fill-[#Bfa67a]" />
                                  <span className="text-xs font-medium text-[#0C1C2E]">{item.rating}</span>
                                </div>
                              )}
                              {/* Trail detail */}
                              {item.difficulty && (
                                <div className="flex items-center gap-2">
                                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
                                    item.difficulty === 'Easy' ? 'bg-emerald-50' :
                                    item.difficulty === 'Moderate' ? 'bg-amber-50' : 'bg-rose-50'
                                  }`}>
                                    {item.difficulty === 'Easy' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                                    {item.difficulty === 'Moderate' && <div className="w-2.5 h-2.5 bg-amber-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />}
                                    {item.difficulty === 'Difficult' && <div className="w-2.5 h-2.5 bg-rose-500" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />}
                                    <span className={`text-[9px] uppercase tracking-wider font-bold ${
                                      item.difficulty === 'Easy' ? 'text-emerald-600' :
                                      item.difficulty === 'Moderate' ? 'text-amber-600' : 'text-rose-600'
                                    }`}>{item.difficulty}</span>
                                  </div>
                                  {item.distance && <span className="text-sm text-gray-400 font-serif">{item.distance}</span>}
                                </div>
                              )}
                              {/* Golf detail */}
                              {item.holes != null && <span className="text-sm text-[#Bfa67a] font-serif">{item.holes}H</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Right Side — Map */}
                <div className="col-span-12 lg:col-span-7 h-[400px] lg:h-[580px] relative bg-[#F9F8F6]">
                  <MapGL
                    ref={mapRef}
                    initialViewState={{
                      longitude: exploreData.center[1],
                      latitude: exploreData.center[0],
                      zoom: exploreData.zoom,
                    }}
                    mapStyle={MAP_STYLE.light}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <NavigationControl position="bottom-right" />

                    {/* Community boundary polygon */}
                    {boundaryGeoJson && (
                      <Source id="boundary" type="geojson" data={boundaryGeoJson}>
                        <Layer {...{
                          id: 'boundary-fill',
                          type: 'fill',
                          paint: {
                            'fill-color': '#Bfa67a',
                            'fill-opacity': 0.08,
                          },
                        } as FillLayerSpecification} />
                        <Layer {...{
                          id: 'boundary-line',
                          type: 'line',
                          paint: {
                            'line-color': '#Bfa67a',
                            'line-width': 2,
                            'line-opacity': 0.8,
                            'line-dasharray': [6, 4],
                          },
                        } as LineLayerSpecification} />
                      </Source>
                    )}

                    {(() => {
                      const activeTab = exploreData.tabs.find(t => t.key === activeMapTab) ?? exploreData.tabs[0];
                      return activeTab.items.map((item) => (
                        <Marker
                          key={item.id}
                          longitude={item.coords[1]}
                          latitude={item.coords[0]}
                          anchor="bottom"
                          onClick={(e) => {
                            e.originalEvent.stopPropagation();
                            setSelectedMarker(item.id);
                            setPopupMarker(item);
                          }}
                        >
                          <TeardropMarker color={activeTab.markerColor} />
                        </Marker>
                      ));
                    })()}

                    {/* Popup for selected marker */}
                    {popupMarker && (
                      <Popup
                        longitude={popupMarker.coords[1]}
                        latitude={popupMarker.coords[0]}
                        anchor="bottom"
                        offset={[0, -32] as [number, number]}
                        onClose={() => setPopupMarker(null)}
                        closeOnClick={false}
                      >
                        <div className="p-3 min-w-[200px]">
                          <h4 className="font-serif text-[#0C1C2E] text-lg mb-1">{popupMarker.name}</h4>
                          {popupMarker.price && <p className="text-[#Bfa67a] font-serif text-xl mb-3">{popupMarker.price}</p>}
                          {popupMarker.beds != null && popupMarker.baths != null && popupMarker.sqft != null && (
                            <div className="flex gap-4 text-[10px] uppercase tracking-widest text-gray-500 pt-2 border-t border-gray-100">
                              <span>{popupMarker.beds} Beds</span>
                              <span>{popupMarker.baths} Baths</span>
                              <span>{popupMarker.sqft.toLocaleString()} SF</span>
                            </div>
                          )}
                          {popupMarker.cuisine && <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">{popupMarker.cuisine}</p>}
                          {popupMarker.rating != null && (
                            <div className="flex items-center gap-1">
                              <Star size={14} className="text-[#Bfa67a] fill-[#Bfa67a]" />
                              <span className="font-serif text-lg text-[#0C1C2E]">{popupMarker.rating}</span>
                            </div>
                          )}
                          {popupMarker.difficulty && (
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-bold uppercase tracking-widest ${
                                popupMarker.difficulty === 'Easy' ? 'text-emerald-500' :
                                popupMarker.difficulty === 'Moderate' ? 'text-amber-500' : 'text-rose-500'
                              }`}>{popupMarker.difficulty}</span>
                              {popupMarker.distance && <span className="font-serif text-[#0C1C2E]">{popupMarker.distance}</span>}
                            </div>
                          )}
                          {popupMarker.holes != null && (
                            <>
                              {popupMarker.type && <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">{popupMarker.type}</p>}
                              <span className="text-[#Bfa67a] font-serif text-lg">{popupMarker.holes} Holes</span>
                            </>
                          )}
                        </div>
                      </Popup>
                    )}
                  </MapGL>

                  {(() => {
                    const activeTab = exploreData.tabs.find(t => t.key === activeMapTab) ?? exploreData.tabs[0];
                    return (
                      <>
                        <div className="absolute top-6 left-6 bg-white px-5 py-3 shadow-xl z-10">
                          <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-1">Showing</span>
                          <span className="text-lg font-serif text-[#0C1C2E]">{activeTab.label}</span>
                        </div>

                        <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-lg z-10">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeTab.markerColor }} />
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                              {activeTab.items.length} Locations
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* SIGNATURE AMENITY */}
          <div className="col-span-12 bg-[#0C1C2E] shadow-lg shadow-black/5 overflow-hidden">
            <div className="grid grid-cols-12 min-h-[380px]">
              <div className="col-span-12 lg:col-span-6 p-6 md:p-10 lg:p-14 flex flex-col justify-center order-2 lg:order-1">
                <div className="flex items-center gap-2 mb-4">
                  {community.signatureAmenity.icon === 'Mountain' && <Mountain size={18} className="text-[#Bfa67a]" />}
                  {community.signatureAmenity.icon === 'TreePine' && <TreePine size={18} className="text-[#Bfa67a]" />}
                  {community.signatureAmenity.icon === 'Shield' && <Shield size={18} className="text-[#Bfa67a]" />}
                  {community.signatureAmenity.icon === 'Zap' && <Zap size={18} className="text-[#Bfa67a]" />}
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#Bfa67a] font-bold">Signature Amenity</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-serif text-white mb-5 leading-tight">{community.signatureAmenity.title}</h3>
                <p className="text-white/60 text-[15px] leading-relaxed mb-8">{community.signatureAmenity.description}</p>
                {community.signatureAmenity.stats.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-white/10">
                    {community.signatureAmenity.stats.map((stat, i) => (
                      <div key={i}>
                        <span className="text-white font-bold text-2xl font-serif block">{stat.value}</span>
                        <span className="text-[10px] md:text-[9px] uppercase tracking-widest text-white/40 font-bold mt-1 block">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-span-12 lg:col-span-6 h-72 lg:h-auto relative order-1 lg:order-2">
                {community.signatureAmenity.image ? (
                  <img
                    src={community.signatureAmenity.image}
                    alt={community.signatureAmenity.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0C1C2E] via-[#162a42] to-[#0C1C2E] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                    <div className="text-center z-10">
                      <Camera size={40} className="text-white/10 mx-auto mb-3" />
                      <span className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold block">Photo Coming Soon</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AIRPORTS */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center gap-2 mb-4">
              <Plane size={16} className="text-[#Bfa67a]" />
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Air Travel</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div>
                  <p className="font-bold text-[#0C1C2E] text-sm">{community.airports.private.name}</p>
                  <p className="text-[9px] uppercase tracking-widest text-[#Bfa67a] font-bold">{community.airports.private.type}</p>
                </div>
                <span className="text-xl font-serif text-[#0C1C2E]">{community.airports.private.distance}</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-[#0C1C2E] text-sm">{community.airports.commercial.name}</p>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">{community.airports.commercial.type}</p>
                </div>
                <span className="text-xl font-serif text-[#0C1C2E]">{community.airports.commercial.distance}</span>
              </div>
            </div>
          </div>

          {/* KEY DISTANCES */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center gap-2 mb-4">
              <Car size={16} className="text-[#Bfa67a]" />
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Key Distances</span>
            </div>
            <div className="space-y-2">
              {community.keyDistances.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-600 text-sm">{item.place}</span>
                  <span className="text-lg font-serif text-[#0C1C2E]">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* QUALITY OF LIFE */}
          {community.qualityOfLife === null ? (
            <LoadingShell icon={<Activity size={14} />} label="Quality of Life" title="Living Standards" colSpan="col-span-12 sm:col-span-6 lg:col-span-4" height="h-64" />
          ) : community.qualityOfLife.length > 0 && (
          <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-[#Bfa67a]" />
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Quality of Life</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {community.qualityOfLife.map((item, i) => {
                const IconComponent = ICON_MAP[item.icon] || Activity;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <IconComponent size={14} className="text-gray-400" />
                    <div>
                      <p className="font-bold text-[#0C1C2E] text-sm">{item.value}</p>
                      <p className="text-[10px] md:text-[8px] uppercase tracking-widest text-gray-400">{item.metric}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* SCHOOLS */}
          <div className="col-span-12 lg:col-span-6 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap size={16} className="text-[#Bfa67a]" />
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Top Schools</span>
              </div>
              <span className="bg-emerald-50 text-emerald-700 px-3 py-1 text-[9px] uppercase tracking-widest font-bold rounded-full">A+ District</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {community.schools.slice(0, 4).map((school, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded group cursor-pointer hover:bg-[#Bfa67a]/10 transition-colors">
                  <div className="min-w-0">
                    <p className="font-bold text-[#0C1C2E] text-sm truncate group-hover:text-[#Bfa67a] transition-colors">{school.name}</p>
                    <p className="text-[9px] text-gray-400">{school.type} · {school.distance}</p>
                  </div>
                  {school.rating > 0 ? (
                    <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                      <Star size={10} className="text-emerald-500 fill-emerald-500" />
                      <span className="text-emerald-600 font-bold">{school.rating}</span>
                      <span className="text-emerald-600 text-[10px] md:text-[8px]">/10</span>
                    </div>
                  ) : (
                    <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                      <span className="text-gray-400 text-[9px] uppercase tracking-wider font-medium">No Rating</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* DINING */}
          {community.restaurants.length > 0 && (
          <div className="col-span-12 lg:col-span-6 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center gap-2 mb-4">
              <Utensils size={16} className="text-[#Bfa67a]" />
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Fine Dining</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {community.restaurants.slice(0, 4).map((restaurant, i) => (
                <div key={i} className="flex gap-3 group cursor-pointer">
                  {restaurant.image && (
                    <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded">
                      <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-[#0C1C2E] text-sm truncate group-hover:text-[#Bfa67a] transition-colors">{restaurant.name}</p>
                    <p className="text-[9px] text-gray-400 truncate">{restaurant.cuisine}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {restaurant.rating > 0 && (
                        <div className="flex items-center gap-0.5">
                          <Star size={10} className="text-[#Bfa67a] fill-[#Bfa67a]" />
                          <span className="text-[10px] font-bold text-[#0C1C2E]">{restaurant.rating}</span>
                        </div>
                      )}
                      <span className="text-[9px] text-gray-400">{restaurant.distance}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* ECONOMY & EMPLOYERS */}
          {community.economicStats === null && community.employers === null ? (
            <LoadingShell icon={<TrendingUp size={14} />} label="Economy" title="Economic Indicators" bg="navy" height="h-64" />
          ) : (community.economicStats || community.employers) && (
          <div className="col-span-12 bg-[#0C1C2E] p-6">
            <div className="grid grid-cols-12 gap-6">
              {community.economicStats && community.economicStats.length > 0 && (
              <div className="col-span-12 lg:col-span-4">
                <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold mb-4 block">Economic Indicators</span>
                <div className="grid grid-cols-2 gap-4">
                  {community.economicStats.map((stat, i) => (
                    <div key={i}>
                      <span className="text-2xl font-serif text-white block">{stat.value}</span>
                      <span className="text-[10px] md:text-[8px] uppercase tracking-widest text-gray-500 font-bold">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              )}
              {community.employers && community.employers.length > 0 && (
              <div className="col-span-12 lg:col-span-8">
                <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold mb-4 block">Major Employers</span>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {community.employers.map((employer, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors cursor-pointer group">
                      <p className="text-white font-bold text-sm group-hover:text-[#Bfa67a] transition-colors truncate">{employer.name}</p>
                      <p className="text-gray-500 text-[9px]">{employer.sector}</p>
                      <p className="text-[#Bfa67a] font-bold text-xs mt-1">{employer.employees}</p>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
          </div>
          )}

        </div>
      </section>

      {/* FEATURED LISTING */}
      {community.listings.length > 0 && community.listings[0].img && (
        <section ref={featuredAnim.ref} className="py-16 md:py-32 max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20">
          <div
            className={`
              flex flex-col lg:flex-row shadow-2xl shadow-black/5
              transition-all duration-1000
              ${featuredAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
            `}
          >
            <div className="lg:w-7/12 h-[350px] md:h-[500px] lg:h-[700px] relative overflow-hidden group">
              <img
                src={community.listings[0].img}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                alt="Featured"
              />
              <div className="absolute top-6 left-6 flex gap-2">
                <span className="bg-[#0C1C2E] text-white px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold">Featured Listing</span>
              </div>
              <div className="absolute bottom-6 left-6 flex gap-2">
                {[1,2,3,4,5].map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/40'}`} />
                ))}
              </div>
            </div>

            <div className="lg:w-5/12 bg-[#0C1C2E] text-white p-8 md:p-12 lg:p-16 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-8 text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold">
                <div className="w-8 h-px bg-[#Bfa67a]"></div>
                Primary Offering
              </div>

              <h3 className="text-3xl md:text-4xl lg:text-5xl font-serif mb-6 leading-tight">{community.listings[0].address.split(' ').slice(1).join(' ')}</h3>
              <p className="text-gray-400 font-light mb-12 text-sm leading-relaxed max-w-sm">
                An exceptional property in {community.name}, offering the finest in luxury desert living with stunning views and world-class amenities.
              </p>

              <div className="grid grid-cols-2 gap-y-8 gap-x-4 border-t border-white/10 pt-8 mb-12">
                <div className="group cursor-pointer">
                  <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1 group-hover:text-[#Bfa67a] transition-colors">List Price</span>
                  <span className="text-2xl font-serif">{community.listings[0].price}</span>
                </div>
                <div className="group cursor-pointer">
                  <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1 group-hover:text-[#Bfa67a] transition-colors">Interior</span>
                  <span className="text-2xl font-serif">{community.listings[0].sqft.toLocaleString()} SF</span>
                </div>
                <div className="group cursor-pointer">
                  <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1 group-hover:text-[#Bfa67a] transition-colors">Lot Size</span>
                  <span className="text-2xl font-serif">{community.listings[0].lot}</span>
                </div>
                <div className="group cursor-pointer">
                  <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1 group-hover:text-[#Bfa67a] transition-colors">Config</span>
                  <span className="text-2xl font-serif">{community.listings[0].beds}BD / {community.listings[0].baths}BA</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to={`/listing/${community.listings[0].id}`}
                  className="flex-1 bg-white text-[#0C1C2E] py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-[#Bfa67a] hover:text-white transition-all flex justify-between px-6 items-center group"
                >
                  View Full Details
                  <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={16}/>
                </Link>
                <button className="flex-1 border border-white/20 text-white py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex justify-between px-6 items-center">
                  Request Private Showing
                  <Calendar size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* LISTING GRID */}
      {community.listings.length > 1 && (
        <section className="py-24 bg-[#F5F5F0]">
          <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 md:mb-16">
              <div>
                <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Available Properties</span>
                <h2 className="text-3xl font-serif text-[#0C1C2E]">Current Inventory in {community.name}</h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">
                  {currentSlide + 1} / {totalSlides}
                </span>
                <button onClick={prevSlide} className="p-4 bg-white border border-gray-200 hover:border-[#0C1C2E] hover:bg-[#0C1C2E] hover:text-white transition-all">
                  <ChevronLeft size={16}/>
                </button>
                <button onClick={nextSlide} className="p-4 bg-white border border-gray-200 hover:border-[#0C1C2E] hover:bg-[#0C1C2E] hover:text-white transition-all">
                  <ChevronRight size={16}/>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentListings.map((listing, index) => (
                <div
                  key={listing.id}
                  className="bg-white group cursor-pointer transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
                  style={{ opacity: 1, animation: `fadeSlideIn 0.5s ease-out ${index * 100}ms both` }}
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img src={listing.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={listing.address} />
                    <div className={`
                      absolute top-4 right-4 backdrop-blur px-3 py-1 text-[9px] font-bold uppercase tracking-widest
                      ${listing.status === 'Active' ? 'bg-white/95 text-[#0C1C2E]' :
                        listing.status === 'Pending' ? 'bg-[#Bfa67a] text-white' :
                        'bg-[#0C1C2E] text-white'}
                    `}>
                      {listing.status}
                    </div>
                    <div className="absolute inset-0 bg-[#0C1C2E]/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <button className="bg-white text-[#0C1C2E] px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        Quick View <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 md:p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-2xl font-serif text-[#0C1C2E] mb-1">{listing.price}</p>
                        <p className="text-[10px] uppercase tracking-widest text-gray-400">{listing.ppsf} / SqFt</p>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-[0.15em] text-gray-800 mb-2 truncate group-hover:text-[#Bfa67a] transition-colors">{listing.address}</h4>
                    <p className="text-[10px] text-gray-400 mb-6">{listing.lot}</p>
                    <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500 border-t border-gray-100 pt-6">
                      <span className="flex items-center gap-2"><BedDouble size={14} className="text-[#Bfa67a]"/> {listing.beds}</span>
                      <span className="flex items-center gap-2"><ShowerHead size={14} className="text-[#Bfa67a]"/> {listing.baths}</span>
                      <span className="flex items-center gap-2"><Maximize2 size={14} className="text-[#Bfa67a]"/> {listing.sqft.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-2 mt-12">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-3 md:h-2 rounded-full transition-all duration-300 ${currentSlide === index ? 'w-8 bg-[#0C1C2E]' : 'w-3 md:w-2 bg-gray-300 hover:bg-gray-400'} min-h-[12px] min-w-[12px]`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA SECTION */}
      <section className="py-20 bg-[#0C1C2E]">
        <div className="max-w-[800px] mx-auto px-4 md:px-8 text-center">
          <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Ready to Explore?</span>
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">
            Find Your Home in <span className="italic font-light">{community.name}</span>
          </h2>
          <p className="text-white/60 mb-8">
            Let me help you discover the perfect property in one of {community.city}'s most desirable communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all"
            >
              Schedule Consultation
            </Link>
            <Link
              to={`/listing?community=${community.id}`}
              className="border border-white/30 text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all"
            >
              View Listings
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TemplateCommunityPage;
export type { CommunityTemplateData };
