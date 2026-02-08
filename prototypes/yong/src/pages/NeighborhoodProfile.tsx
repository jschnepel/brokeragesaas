import { useState, useEffect, useRef } from 'react';
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
  Sun,
  Wind,
  ArrowRight,
  Download,
  Calendar,
  Play,
  Mountain,
  TreePine,
  Shield,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Users,
  GraduationCap,
  Car,
  Clock,
  DollarSign,
  Home,
  Percent,
  ArrowUp,
  ArrowDown,
  Minus,
  Plane,
  Utensils,
  Star,
  Wine,
  Coffee,
  ShoppingBag,
  Camera,
  VolumeX,
  Moon,
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

// --- Types ---
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

interface LifestyleFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  image: string;
}

// --- Constants ---
const LISTINGS: Listing[] = [
  { id: 1, price: "$4,850,000", ppsf: "$892", beds: 5, baths: 5.5, sqft: 5430, address: "1024 Pinnacle Vista Dr", status: "Active", lot: "1.4 Acres", img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800" },
  { id: 2, price: "$2,975,000", ppsf: "$714", beds: 4, baths: 4, sqft: 4165, address: "8842 Ocotillo Ridge", status: "Pending", lot: "0.8 Acres", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800" },
  { id: 3, price: "$7,200,000", ppsf: "$1,104", beds: 6, baths: 7.5, sqft: 6520, address: "12 Canyon Overlook", status: "Active", lot: "2.1 Acres", img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800" },
  { id: 4, price: "$3,450,000", ppsf: "$780", beds: 4, baths: 4.5, sqft: 4420, address: "901 Desert Bloom Cir", status: "Active", lot: "1.1 Acres", img: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800" },
  { id: 5, price: "$5,200,000", ppsf: "$845", beds: 5, baths: 6, sqft: 6150, address: "4501 N Saguaro Way", status: "Coming Soon", lot: "1.8 Acres", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800" },
  { id: 6, price: "$3,875,000", ppsf: "$762", beds: 4, baths: 5, sqft: 5085, address: "7722 E Desert Vista", status: "Active", lot: "1.2 Acres", img: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800" },
];

const METRICS: MarketMetric[] = [
  { label: "Median List Price", value: "$3.12M", numericValue: 3.12, suffix: "M", trend: "+14.2%", trendDir: 'up', description: "12-Month Rolling Avg" },
  { label: "Avg Days on Market", value: "24", numericValue: 24, suffix: "", trend: "-8%", trendDir: 'down', description: "High Velocity" },
  { label: "Price Per SqFt", value: "$842", numericValue: 842, suffix: "", trend: "+$45", trendDir: 'up', description: "Sector Leading" },
  { label: "Absorption Rate", value: "1.4 Mo", numericValue: 1.4, suffix: " Mo", trend: "0.2", trendDir: 'neutral', description: "Seller's Market" },
];

const LIFESTYLE_FEATURES: LifestyleFeature[] = [
  {
    icon: <Mountain size={24} />,
    title: "Mountain Preserve",
    description: "Direct trail access to 30,000+ acres of pristine Sonoran Desert preserve.",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=600"
  },
  {
    icon: <TreePine size={24} />,
    title: "Desert Sanctuary",
    description: "Native landscaping with centuries-old saguaros and protected wildlife corridors.",
    image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&q=80&w=600"
  },
  {
    icon: <Shield size={24} />,
    title: "Gated Privacy",
    description: "24/7 manned security with advanced surveillance and controlled access.",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600"
  },
  {
    icon: <Zap size={24} />,
    title: "Smart Infrastructure",
    description: "Fiber optic connectivity and underground utilities throughout.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=600"
  },
];

// Nearby Schools Data
const NEARBY_SCHOOLS = [
  { name: 'Pinnacle Peak Preparatory', type: 'Private K-8', rating: 10, distance: '2.1 mi', students: 450, highlight: 'Blue Ribbon School' },
  { name: 'Desert Mountain High School', type: 'Public 9-12', rating: 9, distance: '3.4 mi', students: 2100, highlight: 'STEM Excellence' },
  { name: 'Scottsdale Country Day', type: 'Private K-12', rating: 10, distance: '4.2 mi', students: 680, highlight: 'IB Program' },
  { name: 'Basis Scottsdale', type: 'Charter 5-12', rating: 10, distance: '5.8 mi', students: 1200, highlight: '#1 in Arizona' },
];

// Employment & Economy Data
const EMPLOYMENT_DATA = {
  topEmployers: [
    { name: 'Mayo Clinic Arizona', sector: 'Healthcare', employees: '6,500+', distance: '12 mi' },
    { name: 'Scottsdale Healthcare', sector: 'Healthcare', employees: '4,200+', distance: '8 mi' },
    { name: 'General Dynamics', sector: 'Aerospace', employees: '3,800+', distance: '15 mi' },
    { name: 'CVS Health', sector: 'Corporate HQ', employees: '2,500+', distance: '10 mi' },
  ],
  stats: [
    { label: 'Unemployment Rate', value: '2.8%', benchmark: 'vs 3.7% National' },
    { label: 'Job Growth (YoY)', value: '+4.2%', benchmark: 'Tech & Healthcare' },
    { label: 'Median Household', value: '$425K', benchmark: 'Top 1% Nationally' },
    { label: 'Remote Work', value: '38%', benchmark: 'Work from Home' },
  ]
};

// Lifestyle Amenities
const LIFESTYLE_AMENITIES = [
  {
    category: 'Golf & Recreation',
    description: 'World-renowned courses designed by legends like Tom Weiskopf and Jay Morrish nestle into the natural desert terrain.',
    items: ['Troon North Golf Club', 'Grayhawk Golf Club', 'Pinnacle Peak Country Club', 'Desert Mountain Club'],
    stat: '12 Courses',
    statLabel: 'Within 10 miles',
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=800'
  },
  {
    category: 'Fine Dining',
    description: 'From farm-to-table Southwestern cuisine to internationally acclaimed chefs, culinary excellence awaits.',
    items: ['Talavera at Four Seasons', 'Deseo at The Westin', 'Cafe Monarch', 'Mastros City Hall'],
    stat: '45+',
    statLabel: 'Fine dining venues',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800'
  },
  {
    category: 'Wellness & Spa',
    description: 'Rejuvenate at world-class spas offering everything from traditional treatments to cutting-edge therapies.',
    items: ['Four Seasons Spa', 'Sanctuary on Camelback', 'Civana Wellness Resort', 'WELL & BEING Spa'],
    stat: '8 Luxury',
    statLabel: 'Spas nearby',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800'
  },
  {
    category: 'Shopping & Culture',
    description: 'Designer boutiques, art galleries, and curated retail experiences in architecturally stunning settings.',
    items: ['Scottsdale Quarter', 'Kierland Commons', 'El Pedregal', 'Scottsdale Arts District'],
    stat: '200+',
    statLabel: 'Boutiques & galleries',
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&q=80&w=800'
  },
];

// Quality of Life Metrics
const QUALITY_OF_LIFE = [
  { metric: 'Air Quality', value: 'Good', score: 92, icon: Wind, color: 'emerald' },
  { metric: 'Sunny Days', value: '299/yr', score: 82, icon: Sun, color: 'amber' },
  { metric: 'Crime Rate', value: 'Very Low', score: 95, icon: Shield, color: 'blue' },
  { metric: 'Healthcare', value: 'Excellent', score: 98, icon: Activity, color: 'rose' },
  { metric: 'Noise Level', value: 'Minimal', score: 96, icon: VolumeX, color: 'indigo' },
  { metric: 'Light Pollution', value: 'Dark Sky', score: 94, icon: Moon, color: 'purple' },
];

// Area Demographics
const DEMOGRAPHICS = [
  { label: 'Population', value: '2,450', detail: 'Within 3mi radius' },
  { label: 'Median Age', value: '52', detail: 'Years' },
  { label: 'College Educated', value: '78%', detail: 'Bachelor\'s or higher' },
  { label: 'Household Income', value: '$425K', detail: 'Median' },
  { label: 'Home Ownership', value: '94%', detail: 'Owner occupied' },
  { label: 'Avg Home Value', value: '$3.1M', detail: 'Current estimate' },
];

// Local Transportation & Key Distances
const LOCAL_INFO = {
  airport: {
    name: 'Scottsdale Airport (KSDL)',
    type: 'Private/Executive',
    distance: '12 min',
    details: 'FBO services, Gulfstream capable runway',
  },
  commercialAirport: {
    name: 'Phoenix Sky Harbor (PHX)',
    type: 'International',
    distance: '35 min',
    details: 'Direct flights to 100+ destinations',
  },
  keyDistances: [
    { place: 'Downtown Scottsdale', time: '18 min', miles: '12 mi' },
    { place: 'Phoenix CBD', time: '35 min', miles: '28 mi' },
    { place: 'Kierland Commons', time: '15 min', miles: '9 mi' },
    { place: 'Mayo Clinic Arizona', time: '20 min', miles: '14 mi' },
  ],
};

// Nearby Restaurants
const NEARBY_RESTAURANTS = [
  {
    name: 'Talavera',
    cuisine: 'Southwestern Fine Dining',
    location: 'Four Seasons Scottsdale',
    distance: '8 min',
    priceRange: '$$$$',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=600',
    highlight: 'Desert Views',
  },
  {
    name: 'Toca Madera',
    cuisine: 'Modern Mexican',
    location: 'Scottsdale Quarter',
    distance: '12 min',
    priceRange: '$$$',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600',
    highlight: 'Trendy Scene',
  },
  {
    name: 'Mastro\'s City Hall',
    cuisine: 'Steakhouse',
    location: 'Old Town Scottsdale',
    distance: '18 min',
    priceRange: '$$$$',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600',
    highlight: 'Prime Steaks',
  },
  {
    name: 'Café Monarch',
    cuisine: 'New American',
    location: 'Old Town Scottsdale',
    distance: '20 min',
    priceRange: '$$$$',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=600',
    highlight: 'Tasting Menu',
  },
  {
    name: 'The Mission',
    cuisine: 'Latin Inspired',
    location: 'Old Town Scottsdale',
    distance: '18 min',
    priceRange: '$$$',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600',
    highlight: 'Tableside Guac',
  },
  {
    name: 'Bourbon & Bones',
    cuisine: 'Steakhouse & Whiskey',
    location: 'Kierland Commons',
    distance: '14 min',
    priceRange: '$$$',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&q=80&w=600',
    highlight: '200+ Whiskeys',
  },
];

// Community Gallery Images
const COMMUNITY_GALLERY = [
  {
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200',
    caption: 'Contemporary Desert Architecture',
    category: 'Homes',
  },
  {
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=1200',
    caption: 'McDowell Mountain Preserve',
    category: 'Nature',
  },
  {
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200',
    caption: 'Luxury Interior Living',
    category: 'Interiors',
  },
  {
    url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1200',
    caption: 'World-Class Golf',
    category: 'Lifestyle',
  },
  {
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200',
    caption: 'Sunset Over the Valley',
    category: 'Views',
  },
  {
    url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1200',
    caption: 'Resort-Style Living',
    category: 'Pools',
  },
];

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

      // Easing function for smooth animation
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

const NeighborhoodProfile: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'schools' | 'lifestyle' | 'investment'>('overview');
  const [galleryIndex, setGalleryIndex] = useState(0);

  const listingsPerPage = 3;
  const totalSlides = Math.ceil(LISTINGS.length / listingsPerPage);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate lifestyle features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % LIFESTYLE_FEATURES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate community gallery
  useEffect(() => {
    const interval = setInterval(() => {
      setGalleryIndex((prev) => (prev + 1) % COMMUNITY_GALLERY.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const currentListings = LISTINGS.slice(
    currentSlide * listingsPerPage,
    currentSlide * listingsPerPage + listingsPerPage
  );

  // Animation hooks for sections
  const editorialAnim = useScrollAnimation();
  const metricsAnim = useScrollAnimation();
  const featuredAnim = useScrollAnimation();
  const lifestyleAnim = useScrollAnimation();
  const trendsAnim = useScrollAnimation();
  const activityAnim = useScrollAnimation();
  const investmentAnim = useScrollAnimation();
  const comparativeAnim = useScrollAnimation();
  const demographicsAnim = useScrollAnimation();

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] page-zoom-90 font-sans selection:bg-[#0C1C2E] selection:text-white antialiased overflow-x-hidden">

      {/* Navigation */}
      <Navigation variant="transparent" />

      {/* Hero Section - Immersive (Style from Template 2) */}
      <section className="relative h-[85vh] w-full overflow-hidden flex items-end">
        <div
          className="absolute inset-0 w-full h-[110%]"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        >
          <img
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=2400"
            className="w-full h-full object-cover"
            alt="Saguaro Highlands Desert Landscape"
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

        {/* Hero Content - Bottom Left (Style from Template 2) */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 lg:px-20 pb-20">
          <div className="flex flex-col md:flex-row items-end justify-between gap-12">
            <div className="text-white">
              <span className="block text-[#Bfa67a] text-[11px] uppercase tracking-[0.4em] font-bold mb-4 pl-1">Neighborhood Profile</span>
              <h1 className="text-6xl md:text-8xl font-serif leading-[0.9] tracking-tight mb-6">
                Saguaro <br/> <span className="italic font-light">Highlands</span>
              </h1>
              <div className="flex gap-6 text-[10px] uppercase tracking-[0.25em] font-medium opacity-80 pl-1">
                <span className="flex items-center gap-2"><MapPin size={12}/> Scottsdale, AZ 85255</span>
                <span className="flex items-center gap-2"><Compass size={12}/> 2,450' Elevation</span>
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

      {/* Market Intelligence Dashboard (KPIs) - Overlapping Hero (Style from Template 2) */}
      <section ref={metricsAnim.ref} className="relative z-20 -mt-16 max-w-[1600px] mx-auto px-8 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {METRICS.map((metric, i) => (
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

          {/* THE NARRATIVE - Main Content (8 cols, spans 2 rows) */}
          <div className="col-span-12 lg:col-span-8 row-span-2 bg-white p-10 shadow-lg shadow-black/5">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-6 block">The Narrative</span>
            <h2 className="text-3xl md:text-4xl font-serif leading-[1.1] text-[#0C1C2E] mb-8">
              Where the high desert meets <span className="italic text-gray-400">uncompromising precision.</span>
            </h2>

            <div className="prose prose-lg text-gray-500 font-light leading-relaxed mb-8 max-w-none">
              <p className="first-letter:text-5xl first-letter:font-serif first-letter:text-[#0C1C2E] first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                Saguaro Highlands is not merely a collection of estates; it is a masterfully curated dialogue between modern architecture and the ancient Sonoran landscape. Established in the foothills of the McDowell Mountains, this enclave represents the pinnacle of low-density, high-privacy living.
              </p>
              <p className="mt-6">
                Residents here trade the noise of the city for the silence of the saguaros, without sacrificing access. With Scottsdale's private airpark just minutes away and the Troon North golf corridor at your doorstep, it is a sanctuary for those who demand accessibility and seclusion in equal measure.
              </p>
              <p className="mt-6">
                The community features architectural guidelines that ensure every home complements the natural desert environment while maintaining individual character. Lot sizes range from one to three acres, providing exceptional privacy and unobstructed views of the McDowell Mountains and city lights. Underground utilities and thoughtfully planned roads minimize visual intrusion.
              </p>
              <p className="mt-6">
                World-renowned golf courses designed by legends like Tom Weiskopf and Jay Morrish nestle into the natural desert terrain. From farm-to-table Southwestern cuisine to internationally acclaimed chefs, culinary excellence awaits at every turn. Rejuvenate at world-class spas offering everything from traditional treatments to cutting-edge therapies.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="bg-[#0C1C2E] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#Bfa67a] transition-all flex items-center gap-2 group">
                <Download size={14} />
                Download Guide
              </button>
              <button className="border border-[#0C1C2E] text-[#0C1C2E] px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#0C1C2E] hover:text-white transition-all flex items-center gap-2">
                Schedule Tour
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* GALLERY - Auto Rotating (4 cols) */}
          <div className="col-span-12 lg:col-span-4 relative h-[280px] overflow-hidden group">
            {COMMUNITY_GALLERY.map((image, index) => (
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
              <span className="text-[9px] uppercase tracking-widest text-[#Bfa67a] font-bold block">{COMMUNITY_GALLERY[galleryIndex].category}</span>
              <h3 className="text-lg font-serif">{COMMUNITY_GALLERY[galleryIndex].caption}</h3>
            </div>
            <div className="absolute bottom-4 right-4 flex gap-1 z-10">
              {COMMUNITY_GALLERY.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setGalleryIndex(index)}
                  className={`h-1 rounded-full transition-all ${galleryIndex === index ? 'w-4 bg-[#Bfa67a]' : 'w-1 bg-white/50'}`}
                />
              ))}
            </div>
            <button className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold text-[#0C1C2E] z-10">
              <Camera size={12} /> {COMMUNITY_GALLERY.length} Photos
            </button>
          </div>

          {/* DEMOGRAPHICS - At a Glance (4 cols) */}
          <div className="col-span-12 lg:col-span-4 bg-[#0C1C2E] p-6">
            <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold mb-4 block">At a Glance</span>
            <div className="grid grid-cols-2 gap-4">
              {DEMOGRAPHICS.slice(0, 6).map((item, i) => (
                <div key={i} className="group cursor-pointer">
                  <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors block">{item.value}</span>
                  <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SIGNATURE AMENITY + MAP (Full Width) */}
          <div className="col-span-12 bg-white shadow-lg shadow-black/5 overflow-hidden">
            <div className="grid grid-cols-12">
              {/* Editorial Content */}
              <div className="col-span-12 lg:col-span-5 p-8 flex flex-col justify-center order-2 lg:order-1">
                <div className="flex items-center gap-2 mb-3">
                  <Mountain size={16} className="text-[#Bfa67a]" />
                  <span className="text-[9px] uppercase tracking-[0.3em] text-[#Bfa67a] font-bold">Signature Amenity</span>
                </div>
                <h3 className="text-2xl font-serif text-[#0C1C2E] mb-4">McDowell Sonoran Preserve</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Saguaro Highlands offers direct trail access to the McDowell Sonoran Preserve—the largest urban preserve in the United States. Over 30,000 acres of pristine Sonoran Desert landscape with 225+ miles of trails ranging from leisurely walks to challenging summit hikes.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#0C1C2E] font-bold text-lg font-serif block">30,000+</span>
                    <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Acres</span>
                  </div>
                  <div>
                    <span className="text-[#0C1C2E] font-bold text-lg font-serif block">225+</span>
                    <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Miles of Trails</span>
                  </div>
                  <div>
                    <span className="text-[#0C1C2E] font-bold text-lg font-serif block">5 min</span>
                    <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">To Trailhead</span>
                  </div>
                  <div>
                    <span className="text-[#0C1C2E] font-bold text-lg font-serif block">Year-Round</span>
                    <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Access</span>
                  </div>
                </div>
              </div>
              {/* Map */}
              <div className="col-span-12 lg:col-span-7 h-80 lg:h-auto relative order-1 lg:order-2 bg-[#E8E4DC]">
                {/* Placeholder Map - Replace with real map integration */}
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200"
                  alt="Saguaro Highlands Area Map"
                  className="w-full h-full object-cover"
                />
                {/* Map Overlay Elements */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Community Boundary Indicator */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-2 shadow-lg">
                    <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block">Community</span>
                    <span className="text-sm font-bold text-[#0C1C2E]">Saguaro Highlands</span>
                  </div>
                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur px-3 py-2 shadow-lg">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#Bfa67a] border-2 border-white shadow"></div>
                        <span className="text-[9px] text-gray-600">Trailheads</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#0C1C2E] border-2 border-white shadow"></div>
                        <span className="text-[9px] text-gray-600">Community</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-emerald-500"></div>
                        <span className="text-[9px] text-gray-600">Preserve Boundary</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Marker Pins (decorative for prototype) */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 rounded-full bg-[#0C1C2E] border-2 border-white shadow-lg"></div>
                </div>
                <div className="absolute top-1/4 right-1/3">
                  <div className="w-3 h-3 rounded-full bg-[#Bfa67a] border-2 border-white shadow-lg"></div>
                </div>
                <div className="absolute top-1/2 right-1/4">
                  <div className="w-3 h-3 rounded-full bg-[#Bfa67a] border-2 border-white shadow-lg"></div>
                </div>
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
                  <p className="font-bold text-[#0C1C2E] text-sm">{LOCAL_INFO.airport.name}</p>
                  <p className="text-[9px] uppercase tracking-widest text-[#Bfa67a] font-bold">{LOCAL_INFO.airport.type}</p>
                </div>
                <span className="text-xl font-serif text-[#0C1C2E]">{LOCAL_INFO.airport.distance}</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-[#0C1C2E] text-sm">{LOCAL_INFO.commercialAirport.name}</p>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">{LOCAL_INFO.commercialAirport.type}</p>
                </div>
                <span className="text-xl font-serif text-[#0C1C2E]">{LOCAL_INFO.commercialAirport.distance}</span>
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
              {LOCAL_INFO.keyDistances.map((item, i) => (
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
              {QUALITY_OF_LIFE.map((item, i) => {
                const IconComponent = item.icon;
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
              {NEARBY_SCHOOLS.slice(0, 4).map((school, i) => (
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
              {NEARBY_RESTAURANTS.slice(0, 4).map((restaurant, i) => (
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
                  {EMPLOYMENT_DATA.stats.map((stat, i) => (
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
                  {EMPLOYMENT_DATA.topEmployers.map((employer, i) => (
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
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1600"
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

             <h3 className="text-5xl font-serif mb-6 leading-tight">The Canyon <br/> Estate</h3>
             <p className="text-gray-400 font-light mb-12 text-sm leading-relaxed max-w-sm">
               An architectural masterpiece cantilevered over the desert floor. Floor-to-ceiling glass, negative edge pool, and unblockable city light views.
             </p>

             <div className="grid grid-cols-2 gap-y-8 gap-x-4 border-t border-white/10 pt-8 mb-12">
                <div className="group cursor-pointer">
                   <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1 group-hover:text-[#Bfa67a] transition-colors">List Price</span>
                   <span className="text-2xl font-serif">$8,450,000</span>
                </div>
                <div className="group cursor-pointer">
                   <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1 group-hover:text-[#Bfa67a] transition-colors">Interior</span>
                   <span className="text-2xl font-serif">8,200 SF</span>
                </div>
                <div className="group cursor-pointer">
                   <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1 group-hover:text-[#Bfa67a] transition-colors">Lot Size</span>
                   <span className="text-2xl font-serif">2.5 AC</span>
                </div>
                <div className="group cursor-pointer">
                   <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1 group-hover:text-[#Bfa67a] transition-colors">Config</span>
                   <span className="text-2xl font-serif">6BD / 7.5BA</span>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex-1 bg-white text-[#0C1C2E] py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-[#Bfa67a] hover:text-white transition-all flex justify-between px-6 items-center group">
                  View Details
                  <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={16}/>
                </button>
                <button className="flex-1 border border-white/20 text-white py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex justify-between px-6 items-center">
                  Schedule Tour
                  <Calendar size={16} />
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* Listing Grid with Carousel */}
      <section className="py-24 bg-[#F5F5F0]">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
           <div className="flex justify-between items-end mb-16">
              <div>
                <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Available Properties</span>
                <h2 className="text-3xl font-serif text-[#0C1C2E]">Current Inventory</h2>
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

export default NeighborhoodProfile;
