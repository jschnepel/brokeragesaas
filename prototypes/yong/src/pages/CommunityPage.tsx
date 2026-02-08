import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  MapPin,
  Maximize2,
  BedDouble,
  ShowerHead,
  TrendingUp,
  TrendingDown,
  Compass,
  ArrowRight,
  Download,
  Calendar,
  Play,
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
  Minus,
  Home,
  Flag,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { getCommunityById, getAllCommunities, type CommunityData } from '../data/communities';
import { useSparkListings } from '../hooks/useSparkListings';
import { formatPrice, formatSqft } from '../lib/sparkApi';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons for different categories
const createCustomIcon = (color: string) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    background-color: ${color};
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const MARKER_ICONS = {
  listings: createCustomIcon('#Bfa67a'),
  restaurants: createCustomIcon('#E07A5F'),
  hiking: createCustomIcon('#81B29A'),
  clubs: createCustomIcon('#3D405B'),
};

// Map data for Desert Mountain area
const EXPLORE_DATA = {
  'desert-mountain': {
    center: [33.7825, -111.8450] as [number, number],
    zoom: 13,
    listings: [
      { id: 1, name: '10585 E Crescent Moon Dr', price: '$4,250,000', coords: [33.7892, -111.8523] as [number, number], beds: 5, baths: 6, sqft: 6850 },
      { id: 2, name: '9127 E Balancing Rock Rd', price: '$3,795,000', coords: [33.7801, -111.8401] as [number, number], beds: 4, baths: 5, sqft: 5200 },
      { id: 3, name: '41588 N 107th Way', price: '$5,950,000', coords: [33.7856, -111.8489] as [number, number], beds: 6, baths: 7, sqft: 8400 },
      { id: 4, name: '10040 E Happy Valley Rd', price: '$2,875,000', coords: [33.7745, -111.8567] as [number, number], beds: 4, baths: 4, sqft: 4100 },
      { id: 5, name: '42180 N 97th Way', price: '$6,200,000', coords: [33.7912, -111.8378] as [number, number], beds: 5, baths: 6, sqft: 7200 },
    ],
    restaurants: [
      { id: 1, name: 'The Overlook at Desert Mountain', cuisine: 'American Fine Dining', coords: [33.7845, -111.8456] as [number, number], rating: 4.8 },
      { id: 2, name: 'Apache Clubhouse', cuisine: 'Southwestern', coords: [33.7823, -111.8412] as [number, number], rating: 4.6 },
      { id: 3, name: 'Cochise/Geronimo Grill', cuisine: 'Contemporary American', coords: [33.7867, -111.8501] as [number, number], rating: 4.7 },
      { id: 4, name: 'Constantino\'s', cuisine: 'Italian', coords: [33.7889, -111.8345] as [number, number], rating: 4.5 },
      { id: 5, name: 'Renegade Clubhouse', cuisine: 'Casual American', coords: [33.7756, -111.8534] as [number, number], rating: 4.4 },
    ],
    hiking: [
      { id: 1, name: 'Apache Peak Trail', difficulty: 'Moderate', coords: [33.7901, -111.8512] as [number, number], distance: '4.2 mi' },
      { id: 2, name: 'Cochise Trail', difficulty: 'Easy', coords: [33.7834, -111.8389] as [number, number], distance: '2.8 mi' },
      { id: 3, name: 'Geronimo Trail', difficulty: 'Difficult', coords: [33.7778, -111.8567] as [number, number], distance: '6.1 mi' },
      { id: 4, name: 'Desert Vista Loop', difficulty: 'Easy', coords: [33.7856, -111.8423] as [number, number], distance: '1.5 mi' },
      { id: 5, name: 'Sunset Ridge Trail', difficulty: 'Moderate', coords: [33.7923, -111.8478] as [number, number], distance: '3.4 mi' },
    ],
    clubs: [
      { id: 1, name: 'Chiricahua Golf Course', type: 'Jack Nicklaus Signature', coords: [33.7867, -111.8445] as [number, number], holes: 18 },
      { id: 2, name: 'Cochise Golf Course', type: 'Jack Nicklaus Signature', coords: [33.7812, -111.8398] as [number, number], holes: 18 },
      { id: 3, name: 'Geronimo Golf Course', type: 'Jack Nicklaus Signature', coords: [33.7889, -111.8523] as [number, number], holes: 18 },
      { id: 4, name: 'Apache Golf Course', type: 'Jack Nicklaus Signature', coords: [33.7756, -111.8467] as [number, number], holes: 18 },
      { id: 5, name: 'Renegade Golf Course', type: 'Jack Nicklaus Signature', coords: [33.7934, -111.8389] as [number, number], holes: 18 },
      { id: 6, name: 'Outlaw Golf Course', type: 'Jack Nicklaus Signature', coords: [33.7801, -111.8556] as [number, number], holes: 18 },
    ],
  },
};

// Map bounds update component
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Icon mapping for quality of life metrics
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

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: number; suffix: string; prefix?: string; duration?: number }> = ({
  value, suffix, prefix = "", duration = 2000
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(easeOutQuart * value);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, value, duration]);

  const displayValue = value >= 1 && value < 10
    ? count.toFixed(2)
    : Math.round(count).toLocaleString();

  return (
    <span ref={ref}>
      {prefix}{displayValue}{suffix}
    </span>
  );
};

// Scroll Animation Hook
const useScrollAnimation = (threshold = 0.2) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

const CommunityPage: React.FC = () => {
  const { id, community: communitySlug } = useParams<{ id?: string; community?: string; region?: string }>();

  // Support both /community/:id and /:region/:community URLs
  const communityId = communitySlug || id;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [activeMapTab, setActiveMapTab] = useState<'listings' | 'restaurants' | 'hiking' | 'clubs'>('listings');
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [selectedSparkListing, setSelectedSparkListing] = useState<string | null>(null);

  const community = communityId ? getCommunityById(communityId) : undefined;
  const exploreData = communityId && EXPLORE_DATA[communityId as keyof typeof EXPLORE_DATA] ? EXPLORE_DATA[communityId as keyof typeof EXPLORE_DATA] : null;

  // Fetch MLS listings from Spark API
  const { listings: sparkListings, loading: listingsLoading, error: listingsError } = useSparkListings({
    limit: 10,
    orderby: '-ListPrice',
  });

  const listingsPerPage = 3;
  const totalSlides = community ? Math.ceil(community.listings.length / listingsPerPage) : 0;

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top on community change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [communityId]);

  // Auto-rotate community gallery
  useEffect(() => {
    if (!community || !community.gallery || community.gallery.length === 0) return;
    const galleryLength = community.gallery.length;
    const interval = setInterval(() => {
      setGalleryIndex((prev) => (prev + 1) % galleryLength);
    }, 4000);
    return () => clearInterval(interval);
  }, [community]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const currentListings = community?.listings.slice(
    currentSlide * listingsPerPage,
    currentSlide * listingsPerPage + listingsPerPage
  ) || [];

  // Animation hooks for sections
  const metricsAnim = useScrollAnimation();
  const featuredAnim = useScrollAnimation();

  // Get related communities (same region, excluding current)
  const relatedCommunities = community
    ? getAllCommunities().filter(c => c.region === community.region && c.id !== community.id).slice(0, 3)
    : [];

  if (!community) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col">
        <Navigation variant="solid" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-serif text-[#0C1C2E] mb-4">Community Not Found</h1>
            <p className="text-gray-500 mb-8">The community you're looking for doesn't exist.</p>
            <Link
              to="/communities"
              className="bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#Bfa67a] transition-all"
            >
              View All Communities
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] page-zoom-90 font-sans selection:bg-[#0C1C2E] selection:text-white antialiased overflow-x-hidden">

      {/* Navigation */}
      <Navigation variant="transparent" />

      {/* Hero Section - Immersive */}
      <section className="relative h-[85vh] w-full overflow-hidden flex items-end">
        <div
          className="absolute inset-0 w-full h-[110%]"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        >
          <img
            src={community.heroImage}
            className="w-full h-full object-cover"
            alt={community.name}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E]/90 via-[#0C1C2E]/20 to-transparent" />

        {/* Video Play Button */}
        <button
          onClick={() => setIsVideoPlaying(!isVideoPlaying)}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 group"
        >
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              <Play size={24} className="text-[#0C1C2E] ml-1" fill="#0C1C2E" />
            </div>
          </div>
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white text-[10px] uppercase tracking-[0.2em] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Watch Community Film
          </span>
        </button>

        {/* Hero Content - Bottom Left */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 lg:px-20 pb-20">
          <div className="flex flex-col md:flex-row items-end justify-between gap-12">
            <div className="text-white">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold mb-4">
                <Link to="/" className="text-white/40 hover:text-white transition-colors">Home</Link>
                <span className="text-white/20">/</span>
                <Link to="/communities" className="text-white/40 hover:text-white transition-colors">Communities</Link>
                <span className="text-white/20">/</span>
                <span className="text-[#Bfa67a]">{community.name}</span>
              </nav>

              <span className="block text-[#Bfa67a] text-[11px] uppercase tracking-[0.4em] font-bold mb-4 pl-1">Community Profile</span>
              <h1 className="text-6xl md:text-8xl font-serif leading-[0.9] tracking-tight mb-6">
                {community.name.split(' ').map((word, i, arr) => (
                  i === arr.length - 1 && arr.length > 1
                    ? <span key={i}><br/><span className="italic font-light">{word}</span></span>
                    : <span key={i}>{word} </span>
                ))}
              </h1>
              <div className="flex gap-6 text-[10px] uppercase tracking-[0.25em] font-medium opacity-80 pl-1">
                <span className="flex items-center gap-2"><MapPin size={12}/> {community.city}, AZ {community.zipCode}</span>
                <span className="flex items-center gap-2"><Compass size={12}/> {community.elevation} Elevation</span>
              </div>
            </div>

            {/* Hero CTA */}
            <div className="hidden lg:flex flex-col sm:flex-row gap-3">
              <button className="bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2 group shadow-xl">
                 Schedule Tour
                 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
              </button>
              <button className="bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2 shadow-xl">
                 <Download size={14} />
                 Get Guide
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Market Intelligence Dashboard (KPIs) - Overlapping Hero */}
      <section ref={metricsAnim.ref} className="relative z-20 -mt-16 max-w-[1600px] mx-auto px-8 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {community.metrics.map((metric, i) => (
            <div
              key={i}
              className={`
                bg-white p-8 shadow-xl shadow-black/5 border-t-4 border-[#Bfa67a]
                transition-all duration-500 hover:shadow-2xl hover:-translate-y-1
                ${metricsAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
              `}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">{metric.label}</span>
                {metric.trendDir === 'up' ? (
                  <TrendingUp size={16} className="text-[#0C1C2E]"/>
                ) : metric.trendDir === 'down' ? (
                  <TrendingDown size={16} className="text-rose-500"/>
                ) : (
                  <Minus size={16} className="text-gray-300"/>
                )}
              </div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-serif text-[#0C1C2E]">
                  {metric.label === "Median List Price" ? "$" : ""}
                  <AnimatedCounter
                    value={metric.numericValue}
                    suffix={metric.suffix}
                    prefix={metric.label === "Price Per SqFt" ? "$" : ""}
                  />
                </span>
                <span className={`text-xs font-bold ${metric.trendDir === 'up' ? 'text-emerald-600' : metric.trendDir === 'down' ? 'text-rose-500' : 'text-gray-500'}`}>
                  {metric.trend}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">{metric.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bento Box Layout - Community Information */}
      <section className="py-16 max-w-[1600px] mx-auto px-8 lg:px-20">
        <div className="grid grid-cols-12 gap-4">

          {/* THE NARRATIVE - Main Content (8 cols) */}
          <div className="col-span-12 lg:col-span-8 bg-white p-10 shadow-lg shadow-black/5">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-6 block">The Narrative</span>
            <h2 className="text-3xl md:text-4xl font-serif leading-[1.1] text-[#0C1C2E] mb-8">
              {community.tagline} <span className="italic text-gray-400">— {community.city}</span>
            </h2>

            <div className="prose prose-lg text-gray-500 font-light leading-relaxed mb-8 max-w-none">
              {community.narrative.split('\n\n').map((paragraph, i) => (
                <p key={i} className={i === 0 ? "first-letter:text-5xl first-letter:font-serif first-letter:text-[#0C1C2E] first-letter:mr-3 first-letter:float-left first-letter:leading-none" : "mt-6"}>
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-3 mb-8">
              {community.features.map((feature, i) => (
                <span key={i} className="bg-gray-100 text-[#0C1C2E] px-4 py-2 text-[10px] uppercase tracking-widest font-bold">
                  {feature}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to={`/listings?community=${community.id}`}
                className="bg-[#0C1C2E] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#Bfa67a] transition-all flex items-center gap-2 group"
              >
                View Active Listings
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
              <button className="border border-[#0C1C2E] text-[#0C1C2E] px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#0C1C2E] hover:text-white transition-all flex items-center gap-2">
                Get Property Alerts
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN - Sticky sidebar with Gallery + Demographics (4 cols) */}
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* GALLERY - Auto Rotating */}
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
                      className={`h-1 rounded-full transition-all ${galleryIndex === index ? 'w-4 bg-[#Bfa67a]' : 'w-1 bg-white/50'}`}
                    />
                  ))}
                </div>
                <button className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold text-[#0C1C2E] z-10">
                  <Camera size={12} /> {community.gallery.length} Photos
                </button>
              </div>

              {/* DEMOGRAPHICS - At a Glance */}
              <div className="bg-[#0C1C2E] p-6">
                <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold mb-5 block">At a Glance</span>
                <div className="space-y-4">
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Population</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">{community.demographics.population}</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Median Age</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">{community.demographics.medianAge}</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">College Educated</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">{community.demographics.collegeEducated}</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Median Income</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">{community.demographics.householdIncome}</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Home Ownership</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">{community.demographics.homeOwnership}</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Avg Home Value</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">{community.demographics.avgHomeValue}</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-white/10">
                  <div className="text-center p-3 bg-white/5 rounded">
                    <span className="text-2xl font-serif text-[#Bfa67a] block">{community.stats.avgPrice}</span>
                    <span className="text-[8px] uppercase tracking-widest text-gray-500">Avg Price</span>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded">
                    <span className="text-2xl font-serif text-emerald-400 block">{community.stats.trend}</span>
                    <span className="text-[8px] uppercase tracking-widest text-gray-500">YoY Growth</span>
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

          {/* EXPLORE THE AREA - Two Column Card (Full Width) */}
          {exploreData && exploreData.center && exploreData.center[0] && exploreData.center[1] && (
            <div className="col-span-12 shadow-lg shadow-black/5 overflow-hidden">
              <div className="grid grid-cols-12">
                {/* Left Side - Elegant Tab Navigation */}
                <div className="col-span-12 lg:col-span-5 flex flex-col h-[580px]">
                  {/* Header - Navy */}
                  <div className="p-8 bg-[#0C1C2E]">
                    <div className="flex items-center gap-2 mb-3">
                      <Compass size={14} className="text-[#Bfa67a]" />
                      <span className="text-[9px] uppercase tracking-[0.25em] text-[#Bfa67a] font-bold">Explore the Area</span>
                    </div>
                    <h3 className="text-2xl font-serif text-white">What's <span className="italic font-light">Nearby</span></h3>
                  </div>

                  {/* Tab Navigation - White */}
                  <div className="flex-1 bg-white">
                    {[
                      { key: 'listings', label: 'Active Listings', icon: Home, count: sparkListings.length > 0 ? sparkListings.length : exploreData.listings.length, desc: 'Properties for sale' },
                      { key: 'restaurants', label: 'Dining', icon: Utensils, count: exploreData.restaurants.length, desc: 'Fine dining & casual' },
                      { key: 'hiking', label: 'Trails', icon: Mountain, count: exploreData.hiking.length, desc: 'Hiking & nature' },
                      { key: 'clubs', label: 'Golf', icon: Flag, count: exploreData.clubs.length, desc: 'Championship courses' },
                    ].map((tab, idx) => (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setActiveMapTab(tab.key as typeof activeMapTab);
                          setSelectedMarker(null);
                        }}
                        className={`w-full p-5 flex items-center gap-5 transition-all duration-300 group border-b border-gray-100 ${
                          activeMapTab === tab.key
                            ? 'bg-[#F9F8F6]'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-12 h-12 flex items-center justify-center transition-all duration-300 ${
                          activeMapTab === tab.key
                            ? 'bg-[#Bfa67a]'
                            : 'bg-gray-100 group-hover:bg-gray-200'
                        }`}>
                          <tab.icon size={20} className={activeMapTab === tab.key ? 'text-white' : 'text-gray-500'} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-serif text-lg transition-colors ${
                              activeMapTab === tab.key ? 'text-[#0C1C2E]' : 'text-gray-600 group-hover:text-[#0C1C2E]'
                            }`}>
                              {tab.label}
                            </span>
                            <span className={`text-xl font-serif transition-colors ${
                              activeMapTab === tab.key ? 'text-[#Bfa67a]' : 'text-gray-300'
                            }`}>
                              {tab.count}
                            </span>
                          </div>
                          <span className="text-[10px] uppercase tracking-widest text-gray-400">
                            {tab.desc}
                          </span>
                        </div>
                        <ChevronRight
                          size={16}
                          className={`transition-all duration-300 ${
                            activeMapTab === tab.key ? 'text-[#Bfa67a] translate-x-1' : 'text-gray-300 group-hover:text-gray-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Featured Items List */}
                  <div className="bg-[#F9F8F6] flex-1 flex flex-col min-h-0">
                    <div className="px-5 py-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#Bfa67a]" />
                        <span className="text-[9px] uppercase tracking-[0.2em] text-[#0C1C2E] font-bold">
                          {activeMapTab === 'listings' ? 'Properties' :
                           activeMapTab === 'restaurants' ? 'Restaurants' :
                           activeMapTab === 'hiking' ? 'Trails' : 'Courses'}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {activeMapTab === 'listings' && sparkListings.length > 0
                          ? `${sparkListings.length} MLS listings`
                          : `${exploreData[activeMapTab].length} locations`}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100 flex-1 overflow-y-auto no-scrollbar">
                      {activeMapTab === 'listings' && listingsLoading && (
                        <div className="p-5 text-center">
                          <div className="inline-block w-5 h-5 border-2 border-[#Bfa67a] border-t-transparent rounded-full animate-spin" />
                          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">Loading MLS Data...</p>
                        </div>
                      )}
                      {activeMapTab === 'listings' && !listingsLoading && sparkListings.length > 0 && sparkListings.map((item, idx) => {
                        const address = item.StandardFields.UnparsedFirstLineAddress ||
                                        item.StandardFields.UnparsedAddress ||
                                        `${item.StandardFields.StreetNumber || ''} ${item.StandardFields.StreetName || ''}`.trim();
                        return (
                          <div
                            key={item.Id}
                            onClick={() => setSelectedSparkListing(item.Id)}
                            className={`px-5 py-3 cursor-pointer transition-all flex items-center gap-4 ${
                              selectedSparkListing === item.Id
                                ? 'bg-[#Bfa67a]/10 border-l-2 border-[#Bfa67a]'
                                : 'bg-white hover:bg-gray-50 border-l-2 border-transparent'
                            }`}
                          >
                            <span className="text-[10px] text-gray-300 font-mono w-4">{String(idx + 1).padStart(2, '0')}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-[#0C1C2E] truncate block">{address}</span>
                              <span className="text-[10px] text-gray-400">{item.StandardFields.City}, {item.StandardFields.StateOrProvince}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[#Bfa67a] font-serif text-sm whitespace-nowrap block">{formatPrice(item.StandardFields.ListPrice)}</span>
                              <span className="text-[9px] text-gray-400">{item.StandardFields.BedsTotal}bd · {item.StandardFields.BathsFull}ba</span>
                            </div>
                          </div>
                        );
                      })}
                      {activeMapTab === 'listings' && !listingsLoading && sparkListings.length === 0 && exploreData.listings.map((item, idx) => (
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
                          </div>
                          <span className="text-[#Bfa67a] font-serif text-sm whitespace-nowrap">{item.price}</span>
                        </div>
                      ))}
                      {activeMapTab === 'restaurants' && exploreData.restaurants.map((item, idx) => (
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
                            <span className="text-[10px] text-gray-400">{item.cuisine}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                            <Star size={10} className="text-[#Bfa67a] fill-[#Bfa67a]" />
                            <span className="text-xs font-medium text-[#0C1C2E]">{item.rating}</span>
                          </div>
                        </div>
                      ))}
                      {activeMapTab === 'hiking' && exploreData.hiking.map((item, idx) => (
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
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
                              item.difficulty === 'Easy' ? 'bg-emerald-50' :
                              item.difficulty === 'Moderate' ? 'bg-amber-50' : 'bg-rose-50'
                            }`}>
                              {item.difficulty === 'Easy' && (
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                              )}
                              {item.difficulty === 'Moderate' && (
                                <div className="w-2.5 h-2.5 bg-amber-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
                              )}
                              {item.difficulty === 'Difficult' && (
                                <div className="w-2.5 h-2.5 bg-rose-500" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                              )}
                              <span className={`text-[9px] uppercase tracking-wider font-bold ${
                                item.difficulty === 'Easy' ? 'text-emerald-600' :
                                item.difficulty === 'Moderate' ? 'text-amber-600' : 'text-rose-600'
                              }`}>{item.difficulty}</span>
                            </div>
                            <span className="text-sm text-gray-400 font-serif">{item.distance}</span>
                          </div>
                        </div>
                      ))}
                      {activeMapTab === 'clubs' && exploreData.clubs.map((item, idx) => (
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
                            <span className="text-[10px] text-gray-400">{item.type}</span>
                          </div>
                          <span className="text-sm text-[#Bfa67a] font-serif">{item.holes}H</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side - Map */}
                <div className="col-span-12 lg:col-span-7 h-[400px] lg:h-[580px] relative bg-[#F9F8F6]">
                  <MapContainer
                    center={exploreData.center}
                    zoom={exploreData.zoom}
                    className="w-full h-full z-0"
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                    <MapUpdater center={exploreData.center} zoom={exploreData.zoom} />

                    {/* Show Spark API listings only if they have valid coordinates */}
                    {activeMapTab === 'listings' && sparkListings
                      .filter((item) => {
                        const lat = item.StandardFields.Latitude;
                        const lng = item.StandardFields.Longitude;
                        return typeof lat === 'number' && typeof lng === 'number' &&
                               !isNaN(lat) && !isNaN(lng) &&
                               lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
                      })
                      .map((item) => {
                      const lat = item.StandardFields.Latitude!;
                      const lng = item.StandardFields.Longitude!;
                      const address = item.StandardFields.UnparsedFirstLineAddress ||
                                      item.StandardFields.UnparsedAddress ||
                                      `${item.StandardFields.StreetNumber || ''} ${item.StandardFields.StreetName || ''}`.trim();
                      return (
                        <Marker
                          key={item.Id}
                          position={[lat, lng]}
                          icon={MARKER_ICONS.listings}
                          eventHandlers={{ click: () => setSelectedSparkListing(item.Id) }}
                        >
                          <Popup>
                            <div className="p-3 min-w-[220px]">
                              <h4 className="font-serif text-[#0C1C2E] text-lg mb-1">{address}</h4>
                              <p className="text-[#Bfa67a] font-serif text-xl mb-3">{formatPrice(item.StandardFields.ListPrice)}</p>
                              <div className="flex gap-4 text-[10px] uppercase tracking-widest text-gray-500 pt-2 border-t border-gray-100">
                                <span>{item.StandardFields.BedsTotal} Beds</span>
                                <span>{item.StandardFields.BathsFull} Baths</span>
                                {item.StandardFields.BuildingAreaTotal && (
                                  <span>{formatSqft(item.StandardFields.BuildingAreaTotal)} SF</span>
                                )}
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                    {/* Always show fallback explore data listings (they have valid hardcoded coords) */}
                    {activeMapTab === 'listings' && exploreData.listings.map((item) => (
                      <Marker
                        key={item.id}
                        position={item.coords}
                        icon={MARKER_ICONS.listings}
                        eventHandlers={{ click: () => setSelectedMarker(item.id) }}
                      >
                        <Popup>
                          <div className="p-3 min-w-[220px]">
                            <h4 className="font-serif text-[#0C1C2E] text-lg mb-1">{item.name}</h4>
                            <p className="text-[#Bfa67a] font-serif text-xl mb-3">{item.price}</p>
                            <div className="flex gap-4 text-[10px] uppercase tracking-widest text-gray-500 pt-2 border-t border-gray-100">
                              <span>{item.beds} Beds</span>
                              <span>{item.baths} Baths</span>
                              <span>{item.sqft.toLocaleString()} SF</span>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {activeMapTab === 'restaurants' && exploreData.restaurants.map((item) => (
                      <Marker
                        key={item.id}
                        position={item.coords}
                        icon={MARKER_ICONS.restaurants}
                        eventHandlers={{ click: () => setSelectedMarker(item.id) }}
                      >
                        <Popup>
                          <div className="p-3 min-w-[200px]">
                            <h4 className="font-serif text-[#0C1C2E] text-lg mb-1">{item.name}</h4>
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">{item.cuisine}</p>
                            <div className="flex items-center gap-1">
                              <Star size={14} className="text-[#Bfa67a] fill-[#Bfa67a]" />
                              <span className="font-serif text-lg text-[#0C1C2E]">{item.rating}</span>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {activeMapTab === 'hiking' && exploreData.hiking.map((item) => (
                      <Marker
                        key={item.id}
                        position={item.coords}
                        icon={MARKER_ICONS.hiking}
                        eventHandlers={{ click: () => setSelectedMarker(item.id) }}
                      >
                        <Popup>
                          <div className="p-3 min-w-[180px]">
                            <h4 className="font-serif text-[#0C1C2E] text-lg mb-2">{item.name}</h4>
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-bold uppercase tracking-widest ${
                                item.difficulty === 'Easy' ? 'text-emerald-500' :
                                item.difficulty === 'Moderate' ? 'text-amber-500' : 'text-rose-500'
                              }`}>{item.difficulty}</span>
                              <span className="font-serif text-[#0C1C2E]">{item.distance}</span>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {activeMapTab === 'clubs' && exploreData.clubs.map((item) => (
                      <Marker
                        key={item.id}
                        position={item.coords}
                        icon={MARKER_ICONS.clubs}
                        eventHandlers={{ click: () => setSelectedMarker(item.id) }}
                      >
                        <Popup>
                          <div className="p-3 min-w-[200px]">
                            <h4 className="font-serif text-[#0C1C2E] text-lg mb-1">{item.name}</h4>
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">{item.type}</p>
                            <span className="text-[#Bfa67a] font-serif text-lg">{item.holes} Holes</span>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>

                  {/* Elegant Category Label */}
                  <div className="absolute top-6 left-6 bg-white px-5 py-3 shadow-xl z-10">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-1">Showing</span>
                    <span className="text-lg font-serif text-[#0C1C2E]">
                      {activeMapTab === 'listings' && 'Active Listings'}
                      {activeMapTab === 'restaurants' && 'Dining & Entertainment'}
                      {activeMapTab === 'hiking' && 'Hiking & Trails'}
                      {activeMapTab === 'clubs' && 'Golf Courses'}
                    </span>
                  </div>

                  {/* Map Legend */}
                  <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-lg z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-[#Bfa67a]" />
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                        {activeMapTab === 'listings' && sparkListings.length > 0
                          ? `${sparkListings.filter(l => l.StandardFields.Latitude && l.StandardFields.Longitude).length} MLS Listings`
                          : `${exploreData[activeMapTab].length} Locations`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SIGNATURE AMENITY + MAP (Full Width) */}
          <div className="col-span-12 bg-[#0C1C2E] shadow-lg shadow-black/5 overflow-hidden">
            <div className="grid grid-cols-12">
              {/* Editorial Content */}
              <div className="col-span-12 lg:col-span-5 p-8 flex flex-col justify-center order-2 lg:order-1">
                <div className="flex items-center gap-2 mb-3">
                  {community.signatureAmenity.icon === 'Mountain' && <Mountain size={16} className="text-[#Bfa67a]" />}
                  {community.signatureAmenity.icon === 'TreePine' && <TreePine size={16} className="text-[#Bfa67a]" />}
                  {community.signatureAmenity.icon === 'Shield' && <Shield size={16} className="text-[#Bfa67a]" />}
                  {community.signatureAmenity.icon === 'Zap' && <Zap size={16} className="text-[#Bfa67a]" />}
                  <span className="text-[9px] uppercase tracking-[0.3em] text-[#Bfa67a] font-bold">Signature Amenity</span>
                </div>
                <h3 className="text-2xl font-serif text-white mb-4">{community.signatureAmenity.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-6">
                  {community.signatureAmenity.description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {community.signatureAmenity.stats.map((stat, i) => (
                    <div key={i}>
                      <span className="text-white font-bold text-lg font-serif block">{stat.value}</span>
                      <span className="text-[8px] uppercase tracking-widest text-white/40 font-bold">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Image */}
              <div className="col-span-12 lg:col-span-7 h-80 lg:h-auto relative order-1 lg:order-2 bg-[#0C1C2E]">
                <img
                  src={community.signatureAmenity.image}
                  alt={community.signatureAmenity.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* TRANSPORTATION - Airports (4 cols) */}
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

          {/* KEY DISTANCES (4 cols) */}
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

          {/* QUALITY OF LIFE (4 cols) */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-[#Bfa67a]" />
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Quality of Life</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {community.qualityOfLife.map((item, i) => {
                const IconComponent = ICON_MAP[item.icon] || Activity;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <IconComponent size={14} className="text-gray-400" />
                    <div>
                      <p className="font-bold text-[#0C1C2E] text-sm">{item.value}</p>
                      <p className="text-[8px] uppercase tracking-widest text-gray-400">{item.metric}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SCHOOLS (6 cols) */}
          <div className="col-span-12 lg:col-span-6 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap size={16} className="text-[#Bfa67a]" />
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Top Schools</span>
              </div>
              <span className="bg-emerald-50 text-emerald-700 px-3 py-1 text-[9px] uppercase tracking-widest font-bold rounded-full">A+ District</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {community.schools.slice(0, 4).map((school, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded group cursor-pointer hover:bg-[#Bfa67a]/10 transition-colors">
                  <div className="min-w-0">
                    <p className="font-bold text-[#0C1C2E] text-sm truncate group-hover:text-[#Bfa67a] transition-colors">{school.name}</p>
                    <p className="text-[9px] text-gray-400">{school.type} · {school.distance}</p>
                  </div>
                  <div className="flex items-center gap-0.5 bg-emerald-50 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                    <span className="text-emerald-600 font-bold">{school.rating}</span>
                    <span className="text-emerald-600 text-[8px]">/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DINING (6 cols) */}
          <div className="col-span-12 lg:col-span-6 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center gap-2 mb-4">
              <Utensils size={16} className="text-[#Bfa67a]" />
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Fine Dining</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {community.restaurants.slice(0, 4).map((restaurant, i) => (
                <div key={i} className="flex gap-3 group cursor-pointer">
                  <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded">
                    <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#0C1C2E] text-sm truncate group-hover:text-[#Bfa67a] transition-colors">{restaurant.name}</p>
                    <p className="text-[9px] text-gray-400 truncate">{restaurant.cuisine}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5">
                        <Star size={10} className="text-[#Bfa67a] fill-[#Bfa67a]" />
                        <span className="text-[10px] font-bold text-[#0C1C2E]">{restaurant.rating}</span>
                      </div>
                      <span className="text-[9px] text-gray-400">{restaurant.distance}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ECONOMY & EMPLOYERS (Full Width) */}
          <div className="col-span-12 bg-[#0C1C2E] p-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Economic Stats */}
              <div className="col-span-12 lg:col-span-4">
                <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold mb-4 block">Economic Indicators</span>
                <div className="grid grid-cols-2 gap-4">
                  {community.economicStats.map((stat, i) => (
                    <div key={i}>
                      <span className="text-2xl font-serif text-white block">{stat.value}</span>
                      <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Top Employers */}
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
            </div>
          </div>

        </div>
      </section>

      {/* Featured Listing */}
      {community.listings.length > 0 && (
        <section ref={featuredAnim.ref} className="py-32 max-w-[1600px] mx-auto px-8 lg:px-20">
          <div
            className={`
              flex flex-col lg:flex-row shadow-2xl shadow-black/5
              transition-all duration-1000
              ${featuredAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
            `}
          >
            <div className="lg:w-7/12 h-[700px] relative overflow-hidden group">
              <img
                src={community.listings[0].img}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                alt="Featured"
              />
              <div className="absolute top-6 left-6 flex gap-2">
                 <span className="bg-[#0C1C2E] text-white px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold">Featured Listing</span>
              </div>

              {/* Image gallery indicators */}
              <div className="absolute bottom-6 left-6 flex gap-2">
                {[1,2,3,4,5].map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/40'}`} />
                ))}
              </div>
            </div>

            <div className="lg:w-5/12 bg-[#0C1C2E] text-white p-16 flex flex-col justify-center">
               <div className="flex items-center gap-2 mb-8 text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold">
                 <div className="w-8 h-px bg-[#Bfa67a]"></div>
                 Primary Offering
               </div>

               <h3 className="text-5xl font-serif mb-6 leading-tight">{community.listings[0].address.split(' ').slice(1).join(' ')}</h3>
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

      {/* Listing Grid with Carousel */}
      {community.listings.length > 1 && (
        <section className="py-24 bg-[#F5F5F0]">
          <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
             <div className="flex justify-between items-end mb-16">
                <div>
                  <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Available Properties</span>
                  <h2 className="text-3xl font-serif text-[#0C1C2E]">Current Inventory in {community.name}</h2>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">
                    {currentSlide + 1} / {totalSlides}
                  </span>
                   <button
                     onClick={prevSlide}
                     className="p-4 bg-white border border-gray-200 hover:border-[#0C1C2E] hover:bg-[#0C1C2E] hover:text-white transition-all"
                   >
                     <ChevronLeft size={16}/>
                   </button>
                   <button
                     onClick={nextSlide}
                     className="p-4 bg-white border border-gray-200 hover:border-[#0C1C2E] hover:bg-[#0C1C2E] hover:text-white transition-all"
                   >
                     <ChevronRight size={16}/>
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentListings.map((listing, index) => (
                   <div
                     key={listing.id}
                     className="bg-white group cursor-pointer transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
                     style={{
                       opacity: 1,
                       animation: `fadeSlideIn 0.5s ease-out ${index * 100}ms both`
                     }}
                   >
                      <div className="aspect-[4/3] overflow-hidden relative">
                         <img
                           src={listing.img}
                           className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                           alt={listing.address}
                         />
                         <div className={`
                           absolute top-4 right-4 backdrop-blur px-3 py-1 text-[9px] font-bold uppercase tracking-widest
                           ${listing.status === 'Active' ? 'bg-white/95 text-[#0C1C2E]' :
                             listing.status === 'Pending' ? 'bg-[#Bfa67a] text-white' :
                             'bg-[#0C1C2E] text-white'}
                         `}>
                            {listing.status}
                         </div>

                         {/* Quick view overlay */}
                         <div className="absolute inset-0 bg-[#0C1C2E]/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                           <button className="bg-white text-[#0C1C2E] px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                             Quick View <ArrowUpRight size={14} />
                           </button>
                         </div>
                      </div>

                      <div className="p-8">
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

             {/* Pagination dots */}
             <div className="flex justify-center gap-2 mt-12">
               {Array.from({ length: totalSlides }).map((_, index) => (
                 <button
                   key={index}
                   onClick={() => setCurrentSlide(index)}
                   className={`
                     h-2 rounded-full transition-all duration-300
                     ${currentSlide === index ? 'w-8 bg-[#0C1C2E]' : 'w-2 bg-gray-300 hover:bg-gray-400'}
                   `}
                 />
               ))}
             </div>
          </div>
        </section>
      )}

      {/* Related Communities */}
      {relatedCommunities.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
            <div className="flex items-center justify-between mb-12">
              <div>
                <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-2 block">Explore More</span>
                <h2 className="text-3xl font-serif text-[#0C1C2E]">Nearby Communities</h2>
              </div>
              <Link
                to="/communities"
                className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors"
              >
                View All <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedCommunities.map((c) => (
                <Link
                  key={c.id}
                  to={`/${c.region}/${c.id}`}
                  className="group"
                >
                  <div className="aspect-[4/3] overflow-hidden mb-4">
                    <img
                      src={c.heroImage}
                      alt={c.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={12} className="text-[#Bfa67a]" />
                    <span className="text-gray-400 text-[10px] uppercase tracking-widest">{c.city}</span>
                  </div>
                  <h3 className="text-xl font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors mb-2">
                    {c.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3">{c.tagline}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-[#0C1C2E] font-medium">{c.stats.avgPrice}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-emerald-600">{c.stats.trend}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-[#0C1C2E]">
        <div className="max-w-[800px] mx-auto px-8 text-center">
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

      {/* Footer */}
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

export default CommunityPage;
