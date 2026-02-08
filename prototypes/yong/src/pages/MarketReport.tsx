import { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Download,
  Share2,
  Home,
  Activity,
  Clock,
  Phone,
  Mail,
  DollarSign,
  ChevronDown,
  Check,
  ArrowRight,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  Scale,
  FileText,
  Building2,
  Zap,
  Plane,
  Target,
  CheckCircle2,
  Banknote,
  LineChart,
  Percent,
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

// --- Types & Interfaces ---
interface MarketStat {
  label: string;
  value: string;
  rawValue: number;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  subtext: string;
}

interface PriceSegment {
  range: string;
  active: number;
  sold: number;
}

interface YoYStat {
  metric: string;
  current: string;
  prevYear: string;
  change: string;
  direction: 'up' | 'down' | 'neutral';
}

interface DomBucket {
  range: string;
  count: number;
  percentage: number;
}

interface RegionalStat {
  metric: string;
  local: string;
  regional: string;
  metro: string;
}

interface TrendPoint {
  month: string;
  price: number;
  vol: number;
}

interface CommunityData {
  id: string;
  name: string;
  zipCode: string;
  type: string;
  image: string;
  quarters: {
    [key: string]: {
      summary: string;
      marketIndex: number;
      kpis: MarketStat[];
      priceSegments: PriceSegment[];
      trendHistory: TrendPoint[];
      yoyStats: YoYStat[];
      benchmarks: {
        highestSale: string;
        lowestSale: string;
        avgSqFt: string;
        cashPortion: string;
      };
      domDistribution: DomBucket[];
      pricingDynamics: {
        successRate: number;
        listingsWithCuts: number;
        avgPriceCut: number;
        negotiationGap: number;
      };
      regionalContext: RegionalStat[];
    };
  };
}

// --- Mock Data ---
const COMMUNITIES: CommunityData[] = [
  {
    id: 'desert-mountain',
    name: 'Desert Mountain',
    zipCode: '85262',
    type: 'Luxury Golf Community',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2400',
    quarters: {
      'Q4 2024': {
        summary: "Q4 saw continued momentum with luxury buyers seeking year-end acquisitions. The market index reached its highest point of the year with strong seller advantage.",
        marketIndex: 65,
        kpis: [
          { label: "Median List Price", value: "$3,400,000", rawValue: 3400000, trend: "+14.2%", trendDirection: "up", subtext: "Year over Year" },
          { label: "Avg Days on Market", value: "38", rawValue: 38, trend: "-4 Days", trendDirection: "down", subtext: "Faster than Q3" },
          { label: "Active Inventory", value: "72", rawValue: 72, trend: "-7.7%", trendDirection: "down", subtext: "Low Supply" },
          { label: "Months Supply", value: "2.1", rawValue: 2.1, trend: "-0.3", trendDirection: "down", subtext: "Strong Seller's" },
        ],
        priceSegments: [
          { range: "$2M - $3M", active: 12, sold: 9 },
          { range: "$3M - $5M", active: 30, sold: 14 },
          { range: "$5M - $8M", active: 18, sold: 6 },
          { range: "$8M+", active: 12, sold: 3 },
        ],
        trendHistory: [
          { month: 'Jul', price: 3.05, vol: 14 },
          { month: 'Aug', price: 3.15, vol: 16 },
          { month: 'Sep', price: 3.25, vol: 20 },
          { month: 'Oct', price: 3.3, vol: 18 },
          { month: 'Nov', price: 3.35, vol: 15 },
          { month: 'Dec', price: 3.4, vol: 12 },
        ],
        yoyStats: [
          { metric: "Sold Listings", current: "45", prevYear: "40", change: "+12.5%", direction: "up" },
          { metric: "Pending Listings", current: "20", prevYear: "16", change: "+25.0%", direction: "up" },
          { metric: "New Listings", current: "50", prevYear: "58", change: "-13.8%", direction: "down" },
          { metric: "Median Sold Price", current: "$3.25M", prevYear: "$2.9M", change: "+12.1%", direction: "up" },
          { metric: "Avg. Sold $/SqFt", current: "$865", prevYear: "$805", change: "+7.5%", direction: "up" },
        ],
        benchmarks: {
          highestSale: "$9,200,000",
          lowestSale: "$1,950,000",
          avgSqFt: "4,320",
          cashPortion: "65%"
        },
        domDistribution: [
          { range: "< 30 Days", count: 32, percentage: 50 },
          { range: "30-60 Days", count: 16, percentage: 25 },
          { range: "60-90 Days", count: 10, percentage: 16 },
          { range: "90+ Days", count: 6, percentage: 9 },
        ],
        pricingDynamics: {
          successRate: 90.2,
          listingsWithCuts: 12,
          avgPriceCut: -115000,
          negotiationGap: -1.5
        },
        regionalContext: [
          { metric: "Median Price", local: "$3.4M", regional: "$1.92M", metro: "$555K" },
          { metric: "Avg $/SqFt", local: "$865", regional: "$535", metro: "$318" },
          { metric: "Inv. Turnover", local: "13.8%", regional: "19.5%", metro: "25.2%" },
          { metric: "5-Year Equity", local: "+68%", regional: "+54%", metro: "+50%" },
        ]
      }
    }
  },
  {
    id: 'silverleaf',
    name: 'Silverleaf',
    zipCode: '85255',
    type: 'Private Golf Community',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2400',
    quarters: {
      'Q4 2024': {
        summary: "Year-end brought continued strength with Silverleaf setting new price records. Limited inventory drove premium pricing with 85% cash transactions.",
        marketIndex: 75,
        kpis: [
          { label: "Median List Price", value: "$6,200,000", rawValue: 6200000, trend: "+22.8%", trendDirection: "up", subtext: "Year over Year" },
          { label: "Avg Days on Market", value: "40", rawValue: 40, trend: "-5 Days", trendDirection: "down", subtext: "Faster than Q3" },
          { label: "Active Inventory", value: "18", rawValue: 18, trend: "-10.0%", trendDirection: "down", subtext: "Historic Low" },
          { label: "Months Supply", value: "2.1", rawValue: 2.1, trend: "-0.3", trendDirection: "down", subtext: "Extreme Seller's" },
        ],
        priceSegments: [
          { range: "$3M - $5M", active: 3, sold: 4 },
          { range: "$5M - $8M", active: 7, sold: 6 },
          { range: "$8M - $12M", active: 5, sold: 3 },
          { range: "$12M+", active: 3, sold: 2 },
        ],
        trendHistory: [
          { month: 'Jul', price: 5.65, vol: 5 },
          { month: 'Aug', price: 5.75, vol: 6 },
          { month: 'Sep', price: 5.85, vol: 7 },
          { month: 'Oct', price: 5.95, vol: 6 },
          { month: 'Nov', price: 6.1, vol: 5 },
          { month: 'Dec', price: 6.2, vol: 4 },
        ],
        yoyStats: [
          { metric: "Sold Listings", current: "18", prevYear: "13", change: "+38.5%", direction: "up" },
          { metric: "Pending Listings", current: "8", prevYear: "5", change: "+60.0%", direction: "up" },
          { metric: "New Listings", current: "10", prevYear: "15", change: "-33.3%", direction: "down" },
          { metric: "Median Sold Price", current: "$5.95M", prevYear: "$4.85M", change: "+22.7%", direction: "up" },
          { metric: "Avg. Sold $/SqFt", current: "$1,165", prevYear: "$1,005", change: "+15.9%", direction: "up" },
        ],
        benchmarks: {
          highestSale: "$21,000,000",
          lowestSale: "$3,850,000",
          avgSqFt: "6,250",
          cashPortion: "85%"
        },
        domDistribution: [
          { range: "< 30 Days", count: 8, percentage: 44 },
          { range: "30-60 Days", count: 5, percentage: 28 },
          { range: "60-90 Days", count: 3, percentage: 17 },
          { range: "90+ Days", count: 2, percentage: 11 },
        ],
        pricingDynamics: {
          successRate: 88.8,
          listingsWithCuts: 15,
          avgPriceCut: -225000,
          negotiationGap: -1.9
        },
        regionalContext: [
          { metric: "Median Price", local: "$6.2M", regional: "$2.4M", metro: "$575K" },
          { metric: "Avg $/SqFt", local: "$1,165", regional: "$665", metro: "$325" },
          { metric: "Inv. Turnover", local: "11.8%", regional: "17.5%", metro: "26.5%" },
          { metric: "5-Year Equity", local: "+82%", regional: "+60%", metro: "+52%" },
        ]
      }
    }
  },
  {
    id: 'paradise-valley',
    name: 'Paradise Valley',
    zipCode: '85253',
    type: 'Premier Estate Living',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2400',
    quarters: {
      'Q4 2024': {
        summary: "Year-end brought strong activity from buyers seeking to close before year-end for tax purposes, driving multiple competitive situations on premium properties.",
        marketIndex: 66,
        kpis: [
          { label: "Median List Price", value: "$4,850,000", rawValue: 4850000, trend: "+16.8%", trendDirection: "up", subtext: "Year over Year" },
          { label: "Avg Days on Market", value: "48", rawValue: 48, trend: "-4 Days", trendDirection: "down", subtext: "Faster than Q3" },
          { label: "Active Inventory", value: "72", rawValue: 72, trend: "-7.7%", trendDirection: "down", subtext: "Very Low" },
          { label: "Months Supply", value: "3.0", rawValue: 3.0, trend: "-0.4", trendDirection: "down", subtext: "Strong Seller's" },
        ],
        priceSegments: [
          { range: "$2M - $4M", active: 18, sold: 16 },
          { range: "$4M - $7M", active: 26, sold: 14 },
          { range: "$7M - $10M", active: 18, sold: 6 },
          { range: "$10M+", active: 10, sold: 4 },
        ],
        trendHistory: [
          { month: 'Jul', price: 4.45, vol: 10 },
          { month: 'Aug', price: 4.5, vol: 12 },
          { month: 'Sep', price: 4.6, vol: 15 },
          { month: 'Oct', price: 4.7, vol: 14 },
          { month: 'Nov', price: 4.8, vol: 12 },
          { month: 'Dec', price: 4.85, vol: 10 },
        ],
        yoyStats: [
          { metric: "Sold Listings", current: "40", prevYear: "32", change: "+25.0%", direction: "up" },
          { metric: "Pending Listings", current: "18", prevYear: "13", change: "+38.5%", direction: "up" },
          { metric: "New Listings", current: "28", prevYear: "35", change: "-20.0%", direction: "down" },
          { metric: "Median Sold Price", current: "$4.7M", prevYear: "$4.0M", change: "+17.5%", direction: "up" },
          { metric: "Avg. Sold $/SqFt", current: "$760", prevYear: "$695", change: "+9.4%", direction: "up" },
        ],
        benchmarks: {
          highestSale: "$19,200,000",
          lowestSale: "$2,450,000",
          avgSqFt: "5,800",
          cashPortion: "62%"
        },
        domDistribution: [
          { range: "< 30 Days", count: 14, percentage: 38 },
          { range: "30-60 Days", count: 11, percentage: 30 },
          { range: "60-90 Days", count: 8, percentage: 22 },
          { range: "90+ Days", count: 4, percentage: 10 },
        ],
        pricingDynamics: {
          successRate: 87.5,
          listingsWithCuts: 15,
          avgPriceCut: -135000,
          negotiationGap: -2.0
        },
        regionalContext: [
          { metric: "Median Price", local: "$4.85M", regional: "$2.1M", metro: "$575K" },
          { metric: "Avg $/SqFt", local: "$760", regional: "$565", metro: "$325" },
          { metric: "Inv. Turnover", local: "13.2%", regional: "18.5%", metro: "26.5%" },
          { metric: "5-Year Equity", local: "+72%", regional: "+58%", metro: "+52%" },
        ]
      }
    }
  }
];

// --- Additional Market Data ---

// Buyer Migration Data
const BUYER_MIGRATION = [
  { state: 'California', percentage: 42, change: '+8%', color: '#0C1C2E' },
  { state: 'Texas', percentage: 18, change: '+3%', color: '#Bfa67a' },
  { state: 'Illinois', percentage: 12, change: '+2%', color: '#6B7280' },
  { state: 'Washington', percentage: 8, change: '+1%', color: '#9CA3AF' },
  { state: 'Local (AZ)', percentage: 14, change: '-5%', color: '#D1D5DB' },
  { state: 'International', percentage: 6, change: '+2%', color: '#E5E7EB' },
];

// Pricing Success Metrics
const PRICING_SUCCESS = {
  aboveList: 12,
  atList: 38,
  belowList: 50,
  avgOverList: '+2.4%',
  avgUnderList: '-3.8%',
};

// Property Type Breakdown
const PROPERTY_TYPES = [
  { type: 'Single Family', active: 52, sold: 28, avgPrice: '$3.8M', ppsf: '$845' },
  { type: 'Custom Lot', active: 15, sold: 4, avgPrice: '$1.2M', ppsf: 'N/A' },
  { type: 'Townhome', active: 8, sold: 5, avgPrice: '$1.6M', ppsf: '$720' },
  { type: 'Patio Home', active: 6, sold: 3, avgPrice: '$2.1M', ppsf: '$785' },
];

// Seasonal Trends (Monthly data for past 12 months)
const SEASONAL_TRENDS = [
  { month: 'Jan', sales: 8, avgDOM: 52, label: 'Slow' },
  { month: 'Feb', sales: 12, avgDOM: 45, label: 'Warming' },
  { month: 'Mar', sales: 18, avgDOM: 38, label: 'Peak' },
  { month: 'Apr', sales: 22, avgDOM: 32, label: 'Peak' },
  { month: 'May', sales: 20, avgDOM: 35, label: 'Strong' },
  { month: 'Jun', sales: 15, avgDOM: 42, label: 'Moderate' },
  { month: 'Jul', sales: 10, avgDOM: 55, label: 'Summer Lull' },
  { month: 'Aug', sales: 9, avgDOM: 58, label: 'Summer Lull' },
  { month: 'Sep', sales: 14, avgDOM: 48, label: 'Recovery' },
  { month: 'Oct', sales: 18, avgDOM: 40, label: 'Fall Peak' },
  { month: 'Nov', sales: 15, avgDOM: 42, label: 'Strong' },
  { month: 'Dec', sales: 10, avgDOM: 50, label: 'Holiday' },
];

// Listing Success Metrics
const LISTING_METRICS = {
  totalListed: 124,
  sold: 85,
  expired: 18,
  withdrawn: 12,
  pending: 9,
  successRate: 68.5,
  avgPriceReduction: -4.2,
  listingsWithReductions: 32,
};

// Absorption Rate Trend (Monthly)
const ABSORPTION_TREND = [
  { month: 'Jul', rate: 2.8 },
  { month: 'Aug', rate: 2.6 },
  { month: 'Sep', rate: 2.3 },
  { month: 'Oct', rate: 2.1 },
  { month: 'Nov', rate: 2.0 },
  { month: 'Dec', rate: 2.1 },
];

// Price Per Square Foot Trend
const PPSF_TREND = [
  { month: 'Q1 2023', ppsf: 725 },
  { month: 'Q2 2023', ppsf: 752 },
  { month: 'Q3 2023', ppsf: 780 },
  { month: 'Q4 2023', ppsf: 805 },
  { month: 'Q1 2024', ppsf: 825 },
  { month: 'Q2 2024', ppsf: 845 },
  { month: 'Q3 2024', ppsf: 858 },
  { month: 'Q4 2024', ppsf: 865 },
];

// Financing Breakdown
const FINANCING_DATA = {
  cash: 65,
  conventional: 22,
  jumbo: 10,
  other: 3,
  avgDownPayment: '48%',
  avgLoanAmount: '$1.8M',
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

const MarketReport: React.FC = () => {
  const [selectedCommunity, setSelectedCommunity] = useState(COMMUNITIES[0]);
  const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [hoveredChart, setHoveredChart] = useState<number | null>(null);

  // Get current data
  const currentData = selectedCommunity.quarters['Q4 2024'];

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation hooks
  const metricsAnim = useScrollAnimation();
  const narrativeAnim = useScrollAnimation();
  const trendsAnim = useScrollAnimation();
  const segmentsAnim = useScrollAnimation();
  const benchmarksAnim = useScrollAnimation();
  const migrationAnim = useScrollAnimation();
  const seasonalAnim = useScrollAnimation();
  const agentAnim = useScrollAnimation();

  const getMarketLabel = (index: number) => {
    if (index < 40) return "Buyer's Market";
    if (index < 55) return "Balanced Market";
    if (index < 70) return "Seller's Market";
    return "Strong Seller's Market";
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans selection:bg-[#0C1C2E] selection:text-white antialiased overflow-x-hidden">

      {/* Navigation */}
      <Navigation variant="transparent" />

      {/* Hero Section - Cinematic with Parallax */}
      <section className="relative h-[55vh] w-full overflow-hidden flex items-end">
        <div
          className="absolute inset-0 w-full h-[120%]"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          <img
            src={selectedCommunity.image}
            className="w-full h-full object-cover transition-all duration-700"
            alt={selectedCommunity.name}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E]/90 via-[#0C1C2E]/30 to-transparent" />

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 pb-20">
          <div className="flex flex-col md:flex-row items-end justify-between gap-12">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[#Bfa67a] text-[11px] uppercase tracking-[0.4em] font-bold">Q4 2024 Market Intelligence</span>
                <span className="px-3 py-1 bg-[#Bfa67a] text-white text-[9px] uppercase tracking-widest font-bold">Latest</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-serif leading-[0.9] tracking-tight mb-6">
                Market <br/> <span className="italic font-light">Report</span>
              </h1>

              {/* Community Selector */}
              <div className="relative inline-block">
                <button
                  onClick={() => setCommunityDropdownOpen(!communityDropdownOpen)}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white px-6 py-3 text-sm uppercase tracking-widest font-bold hover:bg-white/20 transition-all"
                >
                  <MapPin size={16} />
                  <span>{selectedCommunity.name}</span>
                  <ChevronDown size={16} className={`transition-transform ${communityDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {communityDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-xl min-w-[280px] z-50 overflow-hidden">
                    {COMMUNITIES.map((community) => (
                      <button
                        key={community.id}
                        onClick={() => {
                          setSelectedCommunity(community);
                          setCommunityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-6 py-4 text-sm uppercase tracking-widest font-bold transition-colors flex items-center justify-between ${
                          selectedCommunity.id === community.id
                            ? 'bg-[#0C1C2E] text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div>
                          <span className="block">{community.name}</span>
                          <span className="text-[10px] font-normal opacity-60">{community.type}</span>
                        </div>
                        {selectedCommunity.id === community.id && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hero CTA */}
            <div className="hidden lg:flex flex-col sm:flex-row gap-3">
              <button className="bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2 group shadow-xl">
                <Download size={14} />
                Download Report
              </button>
              <button className="bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2 shadow-xl">
                <Share2 size={14} />
                Share
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Cards - Overlapping Hero */}
      <section ref={metricsAnim.ref} className="relative z-20 -mt-16 max-w-[1600px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentData.kpis.map((stat, i) => (
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
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">{stat.label}</span>
                {stat.trendDirection === 'up' ? (
                  <TrendingUp size={16} className="text-emerald-600"/>
                ) : stat.trendDirection === 'down' ? (
                  <TrendingDown size={16} className="text-[#0C1C2E]"/>
                ) : (
                  <Minus size={16} className="text-gray-300"/>
                )}
              </div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-serif text-[#0C1C2E]">
                  {stat.value}
                </span>
                <span className={`text-xs font-bold ${
                  stat.trendDirection === 'up' ? 'text-emerald-600' :
                  stat.trendDirection === 'down' ? 'text-[#0C1C2E]' : 'text-gray-500'
                }`}>
                  {stat.trend}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">{stat.subtext}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bento Box Layout - Market Data */}
      <section className="py-16 max-w-[1600px] mx-auto px-8">
        <div className="grid grid-cols-12 gap-4">

          {/* THE NARRATIVE - Main Content */}
          <div
            ref={narrativeAnim.ref}
            className={`
              col-span-12 lg:col-span-8 bg-white p-10 shadow-lg shadow-black/5
              transition-all duration-1000
              ${narrativeAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
            `}
          >
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-6 block">Market Analysis</span>
            <h2 className="text-3xl md:text-4xl font-serif leading-[1.1] text-[#0C1C2E] mb-8">
              {selectedCommunity.name}: <span className="italic text-gray-400">{getMarketLabel(currentData.marketIndex)}</span>
            </h2>

            <div className="prose prose-lg text-gray-500 font-light leading-relaxed mb-8 max-w-none">
              <p className="first-letter:text-5xl first-letter:font-serif first-letter:text-[#0C1C2E] first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                {currentData.summary}
              </p>
              <p className="mt-6">
                The luxury segment continues to outperform broader market indices, driven by limited inventory and sustained demand from high-net-worth buyers relocating from high-tax states. Cash transactions remain the dominant force, representing {currentData.benchmarks.cashPortion} of all closings this quarter.
              </p>
            </div>

            {/* Market Index Gauge */}
            <div className="bg-[#F9F8F6] p-6 border-l-4 border-[#Bfa67a] mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-gray-400">Market Conditions Index</span>
                <span className="text-2xl font-serif text-[#0C1C2E]">{currentData.marketIndex}/100</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gray-400 via-[#Bfa67a] to-[#0C1C2E] rounded-full transition-all duration-1000"
                  style={{ width: `${currentData.marketIndex}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[8px] uppercase tracking-widest text-gray-400 font-bold">
                <span>Buyer's</span>
                <span>Balanced</span>
                <span>Seller's</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="bg-[#0C1C2E] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#Bfa67a] transition-all flex items-center gap-2">
                <Download size={14} />
                Full Report PDF
              </button>
              <button className="border border-[#0C1C2E] text-[#0C1C2E] px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#0C1C2E] hover:text-white transition-all flex items-center gap-2">
                Schedule Consultation
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* BENCHMARKS - At a Glance */}
          <div className="col-span-12 lg:col-span-4 bg-[#0C1C2E] p-8">
            <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold mb-6 block">Quarter Highlights</span>
            <div className="space-y-6">
              {[
                { icon: <DollarSign size={18} />, label: 'Highest Sale', value: currentData.benchmarks.highestSale },
                { icon: <ArrowDown size={18} />, label: 'Entry Point', value: currentData.benchmarks.lowestSale },
                { icon: <Home size={18} />, label: 'Avg Home Size', value: `${currentData.benchmarks.avgSqFt} SF` },
                { icon: <Zap size={18} />, label: 'Cash Transactions', value: currentData.benchmarks.cashPortion },
                { icon: <Clock size={18} />, label: 'Avg Days to Sell', value: `${currentData.kpis[1].rawValue} Days` },
                { icon: <Percent size={18} />, label: 'List-to-Sale Ratio', value: `${(100 - Math.abs(currentData.pricingDynamics.negotiationGap)).toFixed(1)}%` },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div className="p-2 bg-white/10 text-[#Bfa67a] group-hover:bg-[#Bfa67a] group-hover:text-white transition-all">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold block">{item.label}</span>
                    <span className="text-lg font-serif text-white group-hover:text-[#Bfa67a] transition-colors">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PRICE TREND CHART */}
          <div
            ref={trendsAnim.ref}
            className={`
              col-span-12 lg:col-span-8 bg-white p-8 shadow-lg shadow-black/5
              transition-all duration-1000
              ${trendsAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
            `}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-[#Bfa67a]" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Price & Volume Trend</span>
              </div>
              <div className="flex items-center gap-4 text-[9px] uppercase tracking-widest">
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#0C1C2E] rounded-full"></span> Price ($M)</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#Bfa67a]/30 rounded"></span> Volume</span>
              </div>
            </div>

            {/* Interactive Chart */}
            <div className="relative h-64 w-full">
              <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                {/* Grid lines */}
                {[0, 50, 100, 150, 200].map(y => (
                  <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#f3f4f6" strokeWidth="1" />
                ))}

                {/* Bars */}
                {currentData.trendHistory.map((d, i) => (
                  <g key={`bar-${i}`}>
                    <rect
                      x={i * 100 + 35}
                      y={200 - (d.vol * 6)}
                      width="30"
                      height={d.vol * 6}
                      fill={hoveredChart === i ? '#Bfa67a' : '#Bfa67a20'}
                      className="transition-colors duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredChart(i)}
                      onMouseLeave={() => setHoveredChart(null)}
                    />
                  </g>
                ))}

                {/* Line */}
                <path
                  d={`M ${currentData.trendHistory.map((d, i) => {
                    const minPrice = Math.min(...currentData.trendHistory.map(p => p.price));
                    const maxPrice = Math.max(...currentData.trendHistory.map(p => p.price));
                    const y = 180 - ((d.price - minPrice) / (maxPrice - minPrice + 0.5)) * 160;
                    return `${i * 100 + 50} ${y}`;
                  }).join(' L ')}`}
                  fill="none"
                  stroke="#0C1C2E"
                  strokeWidth="3"
                  className="drop-shadow-sm"
                />

                {/* Data Points */}
                {currentData.trendHistory.map((d, i) => {
                  const minPrice = Math.min(...currentData.trendHistory.map(p => p.price));
                  const maxPrice = Math.max(...currentData.trendHistory.map(p => p.price));
                  const y = 180 - ((d.price - minPrice) / (maxPrice - minPrice + 0.5)) * 160;
                  return (
                    <g key={`point-${i}`}>
                      <circle
                        cx={i * 100 + 50}
                        cy={y}
                        r={hoveredChart === i ? 8 : 5}
                        fill="white"
                        stroke="#0C1C2E"
                        strokeWidth="2"
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredChart(i)}
                        onMouseLeave={() => setHoveredChart(null)}
                      />
                      {/* Month labels */}
                      <text x={i * 100 + 50} y="220" textAnchor="middle" className="text-[10px] fill-gray-400 font-bold">
                        {d.month}
                      </text>
                      {/* Tooltip */}
                      {hoveredChart === i && (
                        <g>
                          <rect x={i * 100 + 10} y={y - 50} width="80" height="40" fill="#0C1C2E" rx="4" />
                          <text x={i * 100 + 50} y={y - 32} textAnchor="middle" className="text-[10px] fill-white font-bold">
                            ${d.price.toFixed(2)}M
                          </text>
                          <text x={i * 100 + 50} y={y - 18} textAnchor="middle" className="text-[9px] fill-white/60">
                            {d.vol} Sales
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* DAYS ON MARKET DISTRIBUTION */}
          <div className="col-span-12 lg:col-span-4 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center gap-2 mb-6">
              <Clock size={16} className="text-[#Bfa67a]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Days on Market</span>
            </div>
            <div className="space-y-4">
              {currentData.domDistribution.map((bucket, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">{bucket.range}</span>
                    <span className="text-sm font-bold text-[#0C1C2E]">{bucket.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#Bfa67a] rounded-full transition-all duration-1000"
                      style={{ width: `${bucket.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex justify-between">
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Avg Days</span>
                <span className="text-lg font-serif text-[#0C1C2E]">{currentData.kpis[1].rawValue}</span>
              </div>
            </div>
          </div>

          {/* PRICE SEGMENTS */}
          <div
            ref={segmentsAnim.ref}
            className={`
              col-span-12 lg:col-span-6 bg-white p-6 shadow-lg shadow-black/5
              transition-all duration-1000
              ${segmentsAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
            `}
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={16} className="text-[#Bfa67a]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Inventory by Price</span>
            </div>
            <div className="space-y-4">
              {currentData.priceSegments.map((segment, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600 group-hover:text-[#0C1C2E] transition-colors">{segment.range}</span>
                    <div className="flex items-center gap-4 text-[10px] font-bold">
                      <span className="text-[#0C1C2E]">{segment.active} Active</span>
                      <span className="text-[#Bfa67a]">{segment.sold} Sold</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-[#0C1C2E] transition-all duration-500"
                      style={{ width: `${(segment.active / (segment.active + segment.sold)) * 100}%` }}
                    />
                    <div
                      className="h-full bg-[#Bfa67a] transition-all duration-500"
                      style={{ width: `${(segment.sold / (segment.active + segment.sold)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* YEAR OVER YEAR */}
          <div className="col-span-12 lg:col-span-6 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center gap-2 mb-6">
              <Scale size={16} className="text-[#Bfa67a]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Year-Over-Year Comparison</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-[9px] uppercase tracking-widest text-gray-400 font-bold py-2">Metric</th>
                    <th className="text-right text-[9px] uppercase tracking-widest text-gray-400 font-bold py-2">Current</th>
                    <th className="text-right text-[9px] uppercase tracking-widest text-gray-400 font-bold py-2">Prior Year</th>
                    <th className="text-right text-[9px] uppercase tracking-widest text-gray-400 font-bold py-2">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.yoyStats.map((stat, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 text-sm text-gray-600">{stat.metric}</td>
                      <td className="py-3 text-sm text-right font-medium text-[#0C1C2E]">{stat.current}</td>
                      <td className="py-3 text-sm text-right text-gray-400">{stat.prevYear}</td>
                      <td className="py-3 text-sm text-right font-bold">
                        <span className={`flex items-center justify-end gap-1 ${
                          stat.direction === 'up' ? 'text-emerald-600' :
                          stat.direction === 'down' ? 'text-rose-500' : 'text-gray-400'
                        }`}>
                          {stat.direction === 'up' ? <ArrowUp size={12} /> : stat.direction === 'down' ? <ArrowDown size={12} /> : null}
                          {stat.change}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* REGIONAL CONTEXT */}
          <div
            ref={benchmarksAnim.ref}
            className={`
              col-span-12 bg-[#0C1C2E] p-8 text-white
              transition-all duration-1000
              ${benchmarksAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
            `}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-[#Bfa67a]" />
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Regional Benchmark Comparison</span>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">{selectedCommunity.name} vs Market</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {currentData.regionalContext.map((stat, i) => (
                <div key={i} className="text-center">
                  <span className="text-[8px] uppercase tracking-widest text-white/40 font-bold block mb-3">{stat.metric}</span>
                  <div className="space-y-2">
                    <div className="bg-[#Bfa67a] px-4 py-2">
                      <span className="text-[8px] uppercase tracking-widest text-white/60 font-bold block">{selectedCommunity.name}</span>
                      <span className="text-xl font-serif">{stat.local}</span>
                    </div>
                    <div className="bg-white/10 px-4 py-2">
                      <span className="text-[8px] uppercase tracking-widest text-white/40 font-bold block">N. Scottsdale</span>
                      <span className="text-lg font-serif text-white/80">{stat.regional}</span>
                    </div>
                    <div className="bg-white/5 px-4 py-2">
                      <span className="text-[8px] uppercase tracking-widest text-white/40 font-bold block">Phoenix Metro</span>
                      <span className="text-base font-serif text-white/60">{stat.metro}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BUYER MIGRATION */}
          <div className="col-span-12 lg:col-span-6 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center gap-2 mb-6">
              <Plane size={16} className="text-[#Bfa67a]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Buyer Migration</span>
            </div>
            <p className="text-[10px] text-gray-400 mb-4">Where buyers are relocating from</p>
            <div className="space-y-3">
              {BUYER_MIGRATION.map((source, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 group-hover:text-[#0C1C2E] transition-colors">{source.state}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${source.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'}`}>{source.change}</span>
                      <span className="text-sm font-bold text-[#0C1C2E]">{source.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${source.percentage}%`, backgroundColor: source.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PRICING SUCCESS */}
          <div className="col-span-12 lg:col-span-6 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center gap-2 mb-6">
              <Target size={16} className="text-[#Bfa67a]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Pricing Success Analysis</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-[#F9F8F6] border-t-2 border-[#Bfa67a]">
                <ArrowUp size={18} className="text-[#Bfa67a] mx-auto mb-2" />
                <span className="text-2xl font-serif text-[#0C1C2E] block">{PRICING_SUCCESS.aboveList}%</span>
                <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Above List</span>
                <span className="text-[10px] text-[#Bfa67a] font-bold block mt-1">{PRICING_SUCCESS.avgOverList}</span>
              </div>
              <div className="text-center p-4 bg-[#F9F8F6] border-t-2 border-[#0C1C2E]">
                <Minus size={18} className="text-[#0C1C2E] mx-auto mb-2" />
                <span className="text-2xl font-serif text-[#0C1C2E] block">{PRICING_SUCCESS.atList}%</span>
                <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">At List</span>
                <span className="text-[10px] text-[#0C1C2E] font-bold block mt-1">Full Price</span>
              </div>
              <div className="text-center p-4 bg-[#F9F8F6] border-t-2 border-gray-300">
                <ArrowDown size={18} className="text-gray-400 mx-auto mb-2" />
                <span className="text-2xl font-serif text-[#0C1C2E] block">{PRICING_SUCCESS.belowList}%</span>
                <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Below List</span>
                <span className="text-[10px] text-gray-500 font-bold block mt-1">{PRICING_SUCCESS.avgUnderList}</span>
              </div>
            </div>
            <div className="bg-[#F9F8F6] p-4 rounded">
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Key Insight</span>
              <p className="text-sm text-gray-600">Half of all sales close below asking price, averaging 3.8% under list. Proper pricing strategy is critical.</p>
            </div>
          </div>

          {/* PROPERTY TYPE BREAKDOWN */}
          <div className="col-span-12 lg:col-span-8 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center gap-2 mb-6">
              <Home size={16} className="text-[#Bfa67a]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Property Type Analysis</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-[9px] uppercase tracking-widest text-gray-400 font-bold py-3">Type</th>
                    <th className="text-center text-[9px] uppercase tracking-widest text-gray-400 font-bold py-3">Active</th>
                    <th className="text-center text-[9px] uppercase tracking-widest text-gray-400 font-bold py-3">Sold (Q4)</th>
                    <th className="text-right text-[9px] uppercase tracking-widest text-gray-400 font-bold py-3">Avg Price</th>
                    <th className="text-right text-[9px] uppercase tracking-widest text-gray-400 font-bold py-3">$/SqFt</th>
                  </tr>
                </thead>
                <tbody>
                  {PROPERTY_TYPES.map((type, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 text-sm font-medium text-[#0C1C2E]">{type.type}</td>
                      <td className="py-4 text-sm text-center">
                        <span className="bg-[#0C1C2E] text-white px-2 py-1 rounded text-xs">{type.active}</span>
                      </td>
                      <td className="py-4 text-sm text-center">
                        <span className="bg-[#Bfa67a] text-white px-2 py-1 rounded text-xs">{type.sold}</span>
                      </td>
                      <td className="py-4 text-sm text-right font-serif text-[#0C1C2E]">{type.avgPrice}</td>
                      <td className="py-4 text-sm text-right text-gray-500">{type.ppsf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* LISTING SUCCESS METRICS */}
          <div className="col-span-12 lg:col-span-4 bg-[#0C1C2E] p-6 text-white">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 size={16} className="text-[#Bfa67a]" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Listing Outcomes</span>
            </div>

            {/* Donut-style visualization */}
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff10" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#Bfa67a" strokeWidth="12"
                  strokeDasharray={`${LISTING_METRICS.successRate * 2.51} 251`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-serif text-[#Bfa67a]">{LISTING_METRICS.successRate}%</span>
                <span className="text-[8px] uppercase tracking-widest text-white/60">Success Rate</span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Total Listed', value: LISTING_METRICS.totalListed },
                { label: 'Sold', value: LISTING_METRICS.sold },
                { label: 'Pending', value: LISTING_METRICS.pending },
                { label: 'Expired', value: LISTING_METRICS.expired },
                { label: 'Withdrawn', value: LISTING_METRICS.withdrawn },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/60">
                    {item.label}
                  </span>
                  <span className="text-sm font-serif">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SEASONAL TRENDS */}
          <div className="col-span-12 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#Bfa67a]" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Seasonal Market Patterns</span>
              </div>
              <div className="flex items-center gap-4 text-[9px] uppercase tracking-widest text-gray-400">
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#Bfa67a]"></span> Peak Season</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-gray-300"></span> Slow Season</span>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-2">
              {SEASONAL_TRENDS.map((month, i) => {
                const maxSales = Math.max(...SEASONAL_TRENDS.map(m => m.sales));
                const height = (month.sales / maxSales) * 100;
                const isPeak = month.label === 'Peak' || month.label === 'Fall Peak';
                const isSlow = month.label === 'Summer Lull' || month.label === 'Slow' || month.label === 'Holiday';
                return (
                  <div key={i} className="text-center group cursor-pointer">
                    <div className="h-32 flex flex-col justify-end mb-2">
                      <div
                        className={`w-full rounded-t transition-all duration-500 group-hover:opacity-80 ${
                          isPeak ? 'bg-[#Bfa67a]' : isSlow ? 'bg-gray-300' : 'bg-[#0C1C2E]'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-gray-600 block">{month.month}</span>
                    <span className="text-[8px] text-gray-400">{month.sales}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                      <span className="text-[8px] text-[#Bfa67a] font-bold block">{month.avgDOM}d DOM</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <span className="text-lg font-serif text-[#0C1C2E] block">Mar-Apr</span>
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Best to Sell</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-serif text-[#0C1C2E] block">Jul-Aug</span>
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Best to Buy</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-serif text-[#0C1C2E] block">32 Days</span>
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Peak Season DOM</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-serif text-[#0C1C2E] block">58 Days</span>
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Slow Season DOM</span>
              </div>
            </div>
          </div>

          {/* FINANCING BREAKDOWN */}
          <div className="col-span-12 lg:col-span-6 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center gap-2 mb-6">
              <Banknote size={16} className="text-[#Bfa67a]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Financing Breakdown</span>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Cash', value: FINANCING_DATA.cash, color: '#0C1C2E' },
                { label: 'Conventional', value: FINANCING_DATA.conventional, color: '#Bfa67a' },
                { label: 'Jumbo', value: FINANCING_DATA.jumbo, color: '#6B7280' },
                { label: 'Other', value: FINANCING_DATA.other, color: '#D1D5DB' },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-full h-24 bg-gray-100 rounded relative overflow-hidden mb-2">
                    <div
                      className="absolute bottom-0 w-full transition-all duration-1000 rounded-t"
                      style={{ height: `${item.value}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <span className="text-lg font-serif text-[#0C1C2E] block">{item.value}%</span>
                  <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 bg-[#F9F8F6] p-4 rounded">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Avg Down Payment</span>
                <span className="text-xl font-serif text-[#0C1C2E]">{FINANCING_DATA.avgDownPayment}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Avg Loan Amount</span>
                <span className="text-xl font-serif text-[#0C1C2E]">{FINANCING_DATA.avgLoanAmount}</span>
              </div>
            </div>
          </div>

          {/* PRICE PER SQFT TREND */}
          <div className="col-span-12 lg:col-span-6 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center gap-2 mb-6">
              <LineChart size={16} className="text-[#Bfa67a]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Price Per SqFt Trend</span>
            </div>
            <div className="relative h-48">
              <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
                {/* Grid */}
                {[0, 37.5, 75, 112.5, 150].map(y => (
                  <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#f3f4f6" strokeWidth="1" />
                ))}

                {/* Area fill */}
                <path
                  d={`M 0 150 ${PPSF_TREND.map((d, i) => {
                    const x = (i / (PPSF_TREND.length - 1)) * 400;
                    const y = 150 - ((d.ppsf - 700) / 200) * 150;
                    return `L ${x} ${y}`;
                  }).join(' ')} L 400 150 Z`}
                  fill="url(#ppsfGradient)"
                />

                {/* Line */}
                <path
                  d={`M ${PPSF_TREND.map((d, i) => {
                    const x = (i / (PPSF_TREND.length - 1)) * 400;
                    const y = 150 - ((d.ppsf - 700) / 200) * 150;
                    return `${x} ${y}`;
                  }).join(' L ')}`}
                  fill="none"
                  stroke="#Bfa67a"
                  strokeWidth="3"
                />

                {/* Points */}
                {PPSF_TREND.map((d, i) => {
                  const x = (i / (PPSF_TREND.length - 1)) * 400;
                  const y = 150 - ((d.ppsf - 700) / 200) * 150;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="4" fill="white" stroke="#Bfa67a" strokeWidth="2" />
                      <text x={x} y="165" textAnchor="middle" className="text-[8px] fill-gray-400">
                        {d.month}
                      </text>
                    </g>
                  );
                })}

                <defs>
                  <linearGradient id="ppsfGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#Bfa67a" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#Bfa67a" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block">2-Year Change</span>
                <span className="text-emerald-600 font-bold">+19.3%</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block">Current $/SqFt</span>
                <span className="text-xl font-serif text-[#0C1C2E]">$865</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Agent Contact Section */}
      <section ref={agentAnim.ref} className="py-16 bg-white">
        <div className="max-w-[1600px] mx-auto px-8">
          <div
            className={`
              grid grid-cols-12 gap-8
              transition-all duration-1000
              ${agentAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
            `}
          >
            {/* Agent Image */}
            <div className="col-span-12 lg:col-span-4">
              <div className="aspect-[3/4] overflow-hidden bg-gray-100 shadow-lg shadow-black/5 relative">
                <img
                  src="https://media.placester.com/image/upload/c_fill,dpr_1.0,f_auto,fl_lossy,h_768,q_auto,w_768/c_scale,w_768/v1/inception-app-prod/NjY3YTZkOTktMzhiOS00OWVhLWJjMDQtNWZlMWRmODUyYTU3/content/2024/06/8bbcec7735e907c73a61342dd761093e5aed2002.jpg"
                  className="w-full h-full object-cover"
                  alt="Yong Choi"
                />
                {/* Sotheby's Logo Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-white p-4 flex items-center justify-center">
                  <img
                    src="https://media.placester.com/image/upload/c_scale,dpr_1.0,f_auto,fl_lossy,q_auto/c_scale,w_3320/v1/inception-app-prod/MTU0NTVlNzktY2QyZC00ODFhLTkyNTQtYzAxNzY2ZGYyMGVk/content/2023/05/e8d40bc595dcf2e580a6dd7a0fde2a5e80f9327a.png"
                    alt="Russ Lyon Sotheby's International Realty"
                    className="h-12 object-contain brightness-0"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="col-span-12 lg:col-span-5 flex flex-col justify-center">
              <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.4em] font-bold mb-4">Your Market Expert</span>
              <h3 className="text-2xl lg:text-3xl font-serif text-[#0C1C2E] mb-1">Yong Choi</h3>
              <p className="text-gray-400 text-sm mb-2">Realtor® • License #SA713323000</p>
              <p className="text-[#Bfa67a] text-xs mb-6">Russ Lyon Sotheby's International Realty</p>

              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                With over 32 years of experience in the mortgage industry and deep knowledge of North Scottsdale's luxury market,
                Yong provides unparalleled insight into market conditions, financing strategies, and investment opportunities.
                His understanding of mortgage underwriting guidelines is a crucial asset in navigating today's dynamic market.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <a href="tel:+19093765494" className="text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors text-sm flex items-center gap-2">
                  <Phone size={14} className="text-[#Bfa67a]" />
                  (909) 376-5494
                </a>
                <span className="text-gray-300">|</span>
                <a href="mailto:yong.choi@russlyon.com" className="text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors text-sm flex items-center gap-2">
                  <Mail size={14} className="text-[#Bfa67a]" />
                  yong.choi@russlyon.com
                </a>
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 bg-[#0C1C2E] text-white px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#Bfa67a] transition-all">
                  <FileText size={14} />
                  Request Custom Report
                </button>
                <button className="flex items-center gap-2 border border-gray-300 text-[#0C1C2E] px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] font-bold hover:border-[#0C1C2E] transition-all">
                  <Phone size={14} />
                  Schedule Call
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="col-span-12 lg:col-span-3 flex flex-col justify-center gap-4">
              <div className="bg-[#F9F8F6] p-6 space-y-4">
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#Bfa67a] font-bold">Report Coverage</span>
                {[
                  { value: '3', label: 'Communities Analyzed' },
                  { value: 'Q4 2024', label: 'Reporting Period' },
                  { value: '$3M - $21M', label: 'Price Range' },
                  { value: 'Weekly', label: 'Update Frequency' },
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-end border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold">{stat.label}</span>
                    <span className="text-sm font-serif text-[#0C1C2E]">{stat.value}</span>
                  </div>
                ))}
              </div>

              <a
                href="https://www.yong-choi.com/blog"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0C1C2E] p-6 group hover:bg-[#Bfa67a] transition-all"
              >
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#Bfa67a] group-hover:text-white font-bold block mb-2">Latest Insights</span>
                <h4 className="text-sm font-medium text-white leading-snug">
                  5 Essential Financial Steps Before Investing In Real Estate
                </h4>
                <span className="text-[9px] uppercase tracking-[0.15em] text-white/60 font-bold mt-3 inline-flex items-center gap-1 group-hover:text-white transition-colors">
                  Read More <ArrowRight size={10} />
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MarketReport;
