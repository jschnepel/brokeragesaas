import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowUpRight,
  Home,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  Target,
  ChevronRight,
  Calendar,
  MapPin,
  Minus,
  Scale,
  Users,
  Building2,
  Percent,
  Layers,
  Eye,
  Zap,
  Award,
  LineChart,
  PieChart,
} from 'lucide-react';
import Footer from '../components/Footer';
import PageHero from '../components/shared/PageHero';
import SEOHead from '../components/shared/SEOHead';
import AnimatedCounter from '../components/shared/AnimatedCounter';
import { useScrollAnimation } from '../components/shared/useScrollAnimation';
import { MARKET_DATA } from '../data/insightsConfig';


type MetricTab = 'overview' | 'speed' | 'value' | 'demand';
type IntelPerspective = 'buyers' | 'sellers' | 'homeowners';
type IntelDrilldown = 'region' | 'zipcode' | 'community';

const InsightsDashboard: React.FC = () => {
  const [activeRegion, setActiveRegion] = useState(0);
  const [activeMetricTab, setActiveMetricTab] = useState<MetricTab>('overview');
  const [intelPerspective, setIntelPerspective] = useState<IntelPerspective>('buyers');
  const [intelDrilldown, setIntelDrilldown] = useState<IntelDrilldown>('region');
  const intelAnim = useScrollAnimation(0.2);
  const metricsAnim = useScrollAnimation(0.2);
  const trendsAnim = useScrollAnimation(0.2);
  const regionsAnim = useScrollAnimation(0.2);

  const getMarketLabel = (condition: string) => {
    switch (condition) {
      case 'seller': return "Seller's Market";
      case 'buyer': return "Buyer's Market";
      default: return "Balanced Market";
    }
  };

  const maxPrice = Math.max(...MARKET_DATA.monthlyTrends.map(m => m.medianPrice));
  const minPrice = Math.min(...MARKET_DATA.monthlyTrends.map(m => m.medianPrice));
  const priceRange = maxPrice - minPrice;

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans">
      <SEOHead
        title="Market Intelligence Dashboard | Scottsdale Real Estate"
        description="Real-time analytics powering informed decisions in Scottsdale's luxury real estate market."
      />

      <PageHero
        title="Market Intelligence"
        subtitle="Real-time analytics powering informed decisions in Scottsdale's luxury real estate market."
        image="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000"
        height="70vh"
        minHeight="600px"
        badge="Live Market Data"
        badgeIcon={<div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Market Insights' },
        ]}
        gradient="bg-gradient-to-t from-[#0C1C2E] via-[#0C1C2E]/50 to-[#0C1C2E]/20"
      />

      {/* Overlapping Stats Cards */}
      <section className="relative z-20 -mt-24 max-w-[1600px] mx-auto px-8 lg:px-20">
        <div
          ref={metricsAnim.ref}
          className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-700 ${metricsAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {/* Median Price */}
          <div className="bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <DollarSign size={20} className="text-[#Bfa67a]" />
              <span className="text-emerald-500 text-xs font-medium flex items-center gap-1">
                <TrendingUp size={12} /> +{MARKET_DATA.primaryMetrics.medianPrice.change}%
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
              Median Sale Price
            </span>
            <span className="text-3xl font-serif text-[#0C1C2E]">
              $<AnimatedCounter value={1.85} suffix="M" decimals={2} />
            </span>
          </div>

          {/* Days on Market */}
          <div className="bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Clock size={20} className="text-[#Bfa67a]" />
              <span className="text-emerald-500 text-xs font-medium flex items-center gap-1">
                <TrendingDown size={12} /> -8 days
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
              Avg Days on Market
            </span>
            <span className="text-3xl font-serif text-[#0C1C2E]">
              <AnimatedCounter value={42} suffix=" days" />
            </span>
          </div>

          {/* Inventory */}
          <div className="bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Layers size={20} className="text-[#Bfa67a]" />
              <span className="text-rose-500 text-xs font-medium flex items-center gap-1">
                <TrendingDown size={12} /> Low
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
              Months of Inventory
            </span>
            <span className="text-3xl font-serif text-[#0C1C2E]">
              <AnimatedCounter value={3.2} suffix=" mo" decimals={1} />
            </span>
          </div>

          {/* List to Sale */}
          <div className="bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Target size={20} className="text-[#Bfa67a]" />
              <span className="text-emerald-500 text-xs font-medium flex items-center gap-1">
                <TrendingUp size={12} /> Strong
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
              List-to-Sale Ratio
            </span>
            <span className="text-3xl font-serif text-[#0C1C2E]">
              <AnimatedCounter value={97.2} suffix="%" decimals={1} />
            </span>
          </div>
        </div>
      </section>

      {/* Market Condition & Trends */}
      <section className="py-20">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Market Condition Card */}
            <div className="lg:col-span-4">
              <div className="bg-[#0C1C2E] p-8 h-full">
                <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold mb-6 block">
                  Market Condition
                </span>

                {/* Gauge */}
                <div className="flex justify-center mb-8">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#1a2a3a" strokeWidth="6" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke="#Bfa67a"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${MARKET_DATA.conditionScore * 2.64} 264`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-serif text-white">{MARKET_DATA.conditionScore}</span>
                      <span className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Score</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-3xl font-serif text-[#Bfa67a] text-center mb-3">
                  {getMarketLabel(MARKET_DATA.overallCondition)}
                </h3>
                <p className="text-white/60 text-sm text-center mb-8">
                  Low inventory and high demand favor sellers. Homes are selling quickly at or above asking price.
                </p>

                {/* Indicators */}
                <div className="space-y-3">
                  {Object.entries(MARKET_DATA.indicators).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/60 text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className={`text-sm font-medium ${
                        value === 'High' || value === 'Strong' || value === 'Excellent'
                          ? 'text-emerald-400'
                          : value === 'Low'
                            ? 'text-[#Bfa67a]'
                            : 'text-white'
                      }`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Trends Chart */}
            <div
              ref={trendsAnim.ref}
              className={`lg:col-span-8 bg-white p-8 shadow-sm transition-all duration-700 ${trendsAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-2">
                    6-Month Trend
                  </span>
                  <h2 className="text-2xl font-serif text-[#0C1C2E]">
                    Price <span className="italic font-light">Trajectory</span>
                  </h2>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#Bfa67a] rounded-full" />
                    <span className="text-gray-500">Median Price</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#0C1C2E] rounded-full" />
                    <span className="text-gray-500">Sales Volume</span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-64 flex items-end gap-4 mb-6">
                {MARKET_DATA.monthlyTrends.map((month, idx) => {
                  const priceHeight = ((month.medianPrice - minPrice) / priceRange) * 100 + 40;
                  const salesHeight = (month.sales / 200) * 100;

                  return (
                    <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center gap-1 h-48">
                        <div
                          className="w-1/3 bg-[#Bfa67a] transition-all duration-500 hover:bg-[#0C1C2E]"
                          style={{ height: `${priceHeight}%` }}
                          title={`$${(month.medianPrice / 1000000).toFixed(2)}M`}
                        />
                        <div
                          className="w-1/3 bg-[#0C1C2E]/20 transition-all duration-500 hover:bg-[#0C1C2E]/40"
                          style={{ height: `${salesHeight}%` }}
                          title={`${month.sales} sales`}
                        />
                      </div>
                      <span className="text-xs text-gray-400 font-medium">{month.month}</span>
                    </div>
                  );
                })}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
                    Price Growth
                  </span>
                  <span className="text-xl font-serif text-[#0C1C2E]">+7.6%</span>
                  <span className="text-gray-400 text-xs ml-2">6-mo</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
                    Total Sales
                  </span>
                  <span className="text-xl font-serif text-[#0C1C2E]">1,024</span>
                  <span className="text-gray-400 text-xs ml-2">units</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
                    Inventory Decline
                  </span>
                  <span className="text-xl font-serif text-[#0C1C2E]">-22%</span>
                  <span className="text-gray-400 text-xs ml-2">6-mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regional Comparison - Tabbed Bento Box */}
      <section className="py-16 bg-white">
        <div
          ref={regionsAnim.ref}
          className={`max-w-[1600px] mx-auto px-8 lg:px-20 transition-all duration-700 ${regionsAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {/* Section Header */}
          <div className="mb-8">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-2">
              Regional Performance
            </span>
            <h2 className="text-2xl font-serif text-[#0C1C2E]">
              Neighborhood <span className="italic font-light">Breakdown</span>
            </h2>
          </div>

          {/* Main Content Container - Unified with shared background */}
          <div className="bg-[#0C1C2E] shadow-xl">
            <div className="grid lg:grid-cols-12">
              {/* Region List - Left Panel */}
              <div className="lg:col-span-4 bg-[#0C1C2E]">
                <div className="p-5 border-b border-white/10">
                  <span className="text-[11px] uppercase tracking-widest text-[#Bfa67a] font-bold">Select Region</span>
                </div>
                <div className="divide-y divide-white/5">
                  {MARKET_DATA.regions.map((region, idx) => (
                    <div
                      key={region.name}
                      className={`p-4 cursor-pointer transition-all duration-300 ${
                        activeRegion === idx
                          ? 'bg-[#Bfa67a]'
                          : 'hover:bg-white/5'
                      }`}
                      onClick={() => setActiveRegion(idx)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 flex items-center justify-center font-serif text-sm ${
                            activeRegion === idx ? 'bg-white text-[#0C1C2E]' : 'bg-white/10 text-white/60'
                          }`}>
                            {String(idx + 1).padStart(2, '0')}
                          </div>
                          <div>
                            <h3 className={`font-serif text-sm ${activeRegion === idx ? 'text-white' : 'text-white'}`}>
                              {region.name}
                            </h3>
                            <span className={`text-xs ${activeRegion === idx ? 'text-white/80' : 'text-white/40'}`}>
                              ${(region.medianPrice / 1000000).toFixed(1)}M median
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${region.trend === 'up' ? 'text-emerald-400' : 'text-white/40'}`}>
                            {region.trend === 'up' ? '+' : ''}{region.change}%
                          </span>
                          <ChevronRight size={14} className={activeRegion === idx ? 'text-white' : 'text-white/30'} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bento Box Metrics Grid - Right Panel */}
              <div className="lg:col-span-8 bg-[#F9F8F6]">
                {/* Tabs inside the right panel */}
                <div className="p-5 bg-[#0C1C2E] border-b border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-[#Bfa67a] font-bold">Market Analysis</span>
                    <div className="inline-flex items-center">
                      {[
                        { id: 'overview' as MetricTab, label: 'Overview' },
                        { id: 'speed' as MetricTab, label: 'Speed' },
                        { id: 'value' as MetricTab, label: 'Value' },
                        { id: 'demand' as MetricTab, label: 'Demand' },
                      ].map((tab, index, arr) => (
                        <div key={tab.id} className="flex items-center">
                          <button
                            onClick={() => setActiveMetricTab(tab.id)}
                            className={`px-3 py-1 transition-all relative ${
                              activeMetricTab === tab.id
                                ? 'text-white'
                                : 'text-white/40 hover:text-white/70'
                            }`}
                          >
                            <span className={`font-serif text-sm tracking-wide ${activeMetricTab === tab.id ? 'italic' : ''}`}>
                              {tab.label}
                            </span>
                            {activeMetricTab === tab.id && (
                              <span className="absolute bottom-0 left-3 right-3 h-[1px] bg-[#Bfa67a]" />
                            )}
                          </button>
                          {index < arr.length - 1 && (
                            <span className="text-white/20 text-xs mx-1 font-light">|</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tab Content - Stretch to fill container */}
                <div className="p-4 h-[580px]">
              {/* Overview Tab */}
              {activeMetricTab === 'overview' && (
                <div className="grid grid-cols-3 grid-rows-4 gap-3 h-full">
                  {/* Selected Region Stats - Large Card */}
                  <div className="bg-[#0C1C2E] p-4 row-span-3 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#Bfa67a]" />
                        <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.15em] font-bold">Selected</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 bg-[#Bfa67a]/20 text-[#Bfa67a]`}>
                        {MARKET_DATA.regions[activeRegion].trend === 'up' ? '↑' : '→'} {MARKET_DATA.regions[activeRegion].change}%
                      </span>
                    </div>
                    <h3 className="text-lg font-serif text-white mb-3">{MARKET_DATA.regions[activeRegion].name}</h3>
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div className="bg-white/5 p-3">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-white/40 block">Median</span>
                        <span className="text-xl font-serif text-white">${(MARKET_DATA.regions[activeRegion].medianPrice / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="bg-white/5 p-3">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-white/40 block">$/Sq Ft</span>
                        <span className="text-xl font-serif text-[#Bfa67a]">${MARKET_DATA.regions[activeRegion].pricePerSqFt}</span>
                      </div>
                      <div className="bg-white/5 p-3">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-white/40 block">List-to-Sale</span>
                        <span className="text-xl font-serif text-white">{MARKET_DATA.regions[activeRegion].listToSale}%</span>
                      </div>
                      <div className="bg-white/5 p-3">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-white/40 block">DOM</span>
                        <span className="text-xl font-serif text-white">{MARKET_DATA.regions[activeRegion].dom}d</span>
                      </div>
                      <div className="bg-white/5 p-3">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-white/40 block">Inventory</span>
                        <span className="text-xl font-serif text-white">{MARKET_DATA.regions[activeRegion].inventory}mo</span>
                      </div>
                      <div className="bg-white/5 p-3">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-white/40 block">Sales/Mo</span>
                        <span className="text-xl font-serif text-white">{MARKET_DATA.regions[activeRegion].sales}</span>
                      </div>
                    </div>
                    <Link
                      to={`/phoenix/${MARKET_DATA.regions[activeRegion].name.toLowerCase().replace(/ /g, '-').replace(/\//g, '-')}`}
                      className="mt-3 w-full bg-[#Bfa67a] text-white py-3 flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.15em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all"
                    >
                      View Region <ArrowRight size={12} />
                    </Link>
                  </div>

                  {/* Price Comparison Bar Chart */}
                  <div className="bg-white p-3 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#0C1C2E]/50 font-bold">Median Price</span>
                    </div>
                    <div className="space-y-[5px] flex-1">
                      {MARKET_DATA.regions.slice(0, 4).map((r, i) => (
                        <div key={r.name} className="flex items-center gap-2">
                          <span className="text-[9px] text-[#0C1C2E]/60 w-14 truncate">{r.name.split(' ')[0]}</span>
                          <div className="flex-1 h-3 bg-[#0C1C2E]/5 relative">
                            <div
                              className={`h-full transition-all ${activeRegion === i ? 'bg-[#Bfa67a]' : 'bg-[#0C1C2E]/20'}`}
                              style={{ width: `${(r.medianPrice / 4500000) * 100}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-[#0C1C2E]/50 w-10">${(r.medianPrice/1000000).toFixed(1)}M</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DOM Comparison */}
                  <div className="bg-white p-3 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#0C1C2E]/50 font-bold">Days on Market</span>
                    </div>
                    <div className="space-y-[5px] flex-1">
                      {MARKET_DATA.regions.slice(0, 4).map((r, i) => (
                        <div key={r.name} className="flex items-center gap-2">
                          <span className="text-[9px] text-[#0C1C2E]/60 w-14 truncate">{r.name.split(' ')[0]}</span>
                          <div className="flex-1 h-3 bg-[#0C1C2E]/5">
                            <div
                              className={`h-full transition-all ${activeRegion === i ? 'bg-[#Bfa67a]' : 'bg-[#0C1C2E]/20'}`}
                              style={{ width: `${(r.dom / 60) * 100}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-[#0C1C2E]/50 w-6">{r.dom}d</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Communities Fastest Selling */}
                  <div className="bg-white p-3 shadow-sm overflow-hidden flex flex-col border-l-2 border-[#Bfa67a] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold">Fastest Selling</span>
                      <div className="w-5 h-5 rounded-full bg-[#Bfa67a]/10 flex items-center justify-center">
                        <span className="text-[8px] text-[#Bfa67a]">⚡</span>
                      </div>
                    </div>
                    <div className="space-y-[6px] flex-1">
                      {MARKET_DATA.communityMetrics.fastestSelling.slice(0, 4).map((c, i) => (
                        <div key={c.name} className={`flex items-center justify-between p-1.5 rounded ${i === 0 ? 'bg-[#Bfa67a]/10' : 'hover:bg-[#F9F8F6]'} transition-colors cursor-pointer`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-serif w-4 h-4 flex items-center justify-center rounded-full ${i === 0 ? 'bg-[#Bfa67a] text-white' : 'text-[#Bfa67a]'}`}>{i + 1}</span>
                            <span className="text-[10px] text-[#0C1C2E] truncate max-w-[70px]">{c.name}</span>
                          </div>
                          <span className={`text-[9px] font-medium ${i === 0 ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]/60'}`}>{c.dom}d</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Highest $/SqFt */}
                  <div className="bg-white p-3 shadow-sm overflow-hidden flex flex-col border-l-2 border-[#0C1C2E]/20 hover:border-[#Bfa67a] hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#0C1C2E]/50 font-bold">Top $/Sq Ft</span>
                      <div className="w-5 h-5 rounded-full bg-[#0C1C2E]/5 flex items-center justify-center">
                        <span className="text-[8px] text-[#0C1C2E]/50">$</span>
                      </div>
                    </div>
                    <div className="space-y-[6px] flex-1">
                      {MARKET_DATA.communityMetrics.highestPricePerSqFt.slice(0, 4).map((c, i) => (
                        <div key={c.name} className={`flex items-center justify-between p-1.5 rounded ${i === 0 ? 'bg-[#0C1C2E]/5' : 'hover:bg-[#F9F8F6]'} transition-colors cursor-pointer`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-serif w-4 h-4 flex items-center justify-center rounded-full ${i === 0 ? 'bg-[#0C1C2E] text-white' : 'text-[#0C1C2E]/40'}`}>{i + 1}</span>
                            <span className="text-[10px] text-[#0C1C2E] truncate max-w-[70px]">{c.name}</span>
                          </div>
                          <span className={`text-[9px] font-medium ${i === 0 ? 'text-[#0C1C2E]' : 'text-[#0C1C2E]/60'}`}>${c.pricePerSqFt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Most Active Communities */}
                  <div className="bg-white p-3 shadow-sm overflow-hidden flex flex-col border-l-2 border-[#0C1C2E]/20 hover:border-[#Bfa67a] hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#0C1C2E]/50 font-bold">Most Active</span>
                      <div className="w-5 h-5 rounded-full bg-[#0C1C2E]/5 flex items-center justify-center">
                        <span className="text-[8px] text-[#0C1C2E]/50">📊</span>
                      </div>
                    </div>
                    <div className="space-y-[6px] flex-1">
                      {MARKET_DATA.communityMetrics.mostActive.slice(0, 4).map((c, i) => (
                        <div key={c.name} className={`flex items-center justify-between p-1.5 rounded ${i === 0 ? 'bg-[#0C1C2E]/5' : 'hover:bg-[#F9F8F6]'} transition-colors cursor-pointer`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-serif w-4 h-4 flex items-center justify-center rounded-full ${i === 0 ? 'bg-[#0C1C2E] text-white' : 'text-[#0C1C2E]/40'}`}>{i + 1}</span>
                            <span className="text-[10px] text-[#0C1C2E] truncate max-w-[70px]">{c.name}</span>
                          </div>
                          <span className={`text-[9px] font-medium ${i === 0 ? 'text-[#0C1C2E]' : 'text-[#0C1C2E]/60'}`}>{c.sales}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Highest Appreciation */}
                  <div className="bg-white p-3 shadow-sm overflow-hidden flex flex-col border-l-2 border-[#Bfa67a] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold">Top Appreciation</span>
                      <div className="w-5 h-5 rounded-full bg-[#Bfa67a]/10 flex items-center justify-center">
                        <span className="text-[8px] text-[#Bfa67a]">↑</span>
                      </div>
                    </div>
                    <div className="space-y-[6px] flex-1">
                      {MARKET_DATA.communityMetrics.highestAppreciation.slice(0, 4).map((c, i) => (
                        <div key={c.name} className={`flex items-center justify-between p-1.5 rounded ${i === 0 ? 'bg-[#Bfa67a]/10' : 'hover:bg-[#F9F8F6]'} transition-colors cursor-pointer`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-serif w-4 h-4 flex items-center justify-center rounded-full ${i === 0 ? 'bg-[#Bfa67a] text-white' : 'text-[#Bfa67a]'}`}>{i + 1}</span>
                            <span className="text-[10px] text-[#0C1C2E] truncate max-w-[70px]">{c.name}</span>
                          </div>
                          <span className={`text-[9px] font-medium ${i === 0 ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]/60'}`}>+{c.change}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Stats Row - Full Width */}
                  <div className="col-span-3 overflow-hidden">
                    <div className="grid grid-cols-6 gap-2 h-full">
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Median</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">$1.85M</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Avg DOM</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">42d</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">List/Sale</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">97.2%</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Mo Supply</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">3.2</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">YoY</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">+6.2%</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Sales</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">198</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Speed Tab */}
              {activeMetricTab === 'speed' && (
                <div className="grid grid-cols-3 grid-rows-4 gap-3 h-full">
                  {/* DOM Gauge - Tall Card */}
                  <div className="bg-[#0C1C2E] p-4 row-span-3 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.15em] font-bold">Market Speed</span>
                      <span className="text-[9px] px-2 py-0.5 bg-[#Bfa67a]/20 text-[#Bfa67a]">
                        {MARKET_DATA.regions[activeRegion].dom < 42 ? 'FAST' : 'MODERATE'}
                      </span>
                    </div>
                    <div className="flex justify-center mb-2">
                      <div className="relative w-24 h-24">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#1a2a3a" strokeWidth="6" />
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#Bfa67a" strokeWidth="6" strokeLinecap="round"
                            strokeDasharray={`${((60 - MARKET_DATA.regions[activeRegion].dom) / 60) * 264} 264`} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-serif text-white">{MARKET_DATA.regions[activeRegion].dom}</span>
                          <span className="text-[8px] uppercase tracking-[0.15em] text-white/40">Days</span>
                        </div>
                      </div>
                    </div>
                    <h4 className="text-white font-serif text-base text-center mb-2">{MARKET_DATA.regions[activeRegion].name}</h4>
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div className="bg-white/5 p-3 text-center">
                        <span className="text-lg font-serif text-white block">42d</span>
                        <span className="text-[8px] uppercase tracking-[0.15em] text-white/40">Mkt Avg</span>
                      </div>
                      <div className="bg-white/5 p-3 text-center">
                        <span className="text-lg font-serif text-[#Bfa67a] block">
                          {MARKET_DATA.regions[activeRegion].dom < 42 ? '' : '+'}{MARKET_DATA.regions[activeRegion].dom - 42}d
                        </span>
                        <span className="text-[8px] uppercase tracking-[0.15em] text-white/40">vs Avg</span>
                      </div>
                      <div className="bg-white/5 p-3 text-center">
                        <span className="text-lg font-serif text-[#Bfa67a] block">-8%</span>
                        <span className="text-[8px] uppercase tracking-[0.15em] text-white/40">vs LY</span>
                      </div>
                      <div className="bg-white/5 p-3 text-center">
                        <span className="text-lg font-serif text-[#Bfa67a] block">↑</span>
                        <span className="text-[8px] uppercase tracking-[0.15em] text-white/40">Trend</span>
                      </div>
                    </div>
                    {/* Speed meter */}
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex justify-between text-[8px] text-white/40 mb-1">
                        <span>Slower</span>
                        <span>Faster</span>
                      </div>
                      <div className="h-2 bg-white/10 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-[#Bfa67a]/60 to-[#Bfa67a]" />
                        <div
                          className="absolute top-0 w-1 h-full bg-white"
                          style={{ left: `${100 - (MARKET_DATA.regions[activeRegion].dom / 60) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fastest Selling Communities */}
                  <div className="col-span-2 bg-white p-3 shadow-sm overflow-hidden flex flex-col border-t-2 border-[#Bfa67a] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold">Speed Leaderboard</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] text-[#0C1C2E]/30">fastest →</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 flex-1">
                      {MARKET_DATA.communityMetrics.fastestSelling.map((c, i) => (
                        <div key={c.name} className={`p-2 flex flex-col justify-center items-center ${i === 0 ? 'bg-[#Bfa67a]/15 border-2 border-[#Bfa67a]' : 'bg-[#F9F8F6] border border-[#0C1C2E]/10'} hover:border-[#Bfa67a] hover:scale-105 transition-all cursor-pointer rounded`}>
                          <span className={`text-xl font-serif ${i === 0 ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]'}`}>{c.dom}</span>
                          <span className="text-[8px] text-[#0C1C2E]/40 uppercase">days</span>
                          <span className="text-[9px] text-[#0C1C2E] block truncate w-full text-center mt-1">{c.name}</span>
                          <span className="text-[7px] text-[#0C1C2E]/40">{c.region}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DOM by Region Bar Chart */}
                  <div className="col-span-2 bg-white p-3 shadow-sm overflow-hidden flex flex-col border-l-2 border-[#0C1C2E]/20 hover:border-[#Bfa67a] hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#0C1C2E]/50 font-bold">DOM by Region</span>
                      <div className="w-5 h-5 rounded-full bg-[#0C1C2E]/5 flex items-center justify-center">
                        <span className="text-[8px] text-[#0C1C2E]/50">📊</span>
                      </div>
                    </div>
                    <div className="flex items-end gap-1 flex-1">
                      {MARKET_DATA.regions.map((r, i) => (
                        <div key={r.name} className="flex-1 flex flex-col items-center justify-end h-full group">
                          <span className={`text-[8px] mb-1 ${activeRegion === i ? 'text-[#Bfa67a] font-bold' : 'text-[#0C1C2E]/40 group-hover:text-[#Bfa67a]'} transition-colors`}>{r.dom}d</span>
                          <div
                            className={`w-full max-w-[20px] cursor-pointer transition-all rounded-t ${activeRegion === i ? 'bg-[#Bfa67a]' : 'bg-[#0C1C2E]/20 hover:bg-[#Bfa67a]/60'}`}
                            style={{ height: `${(r.dom / 60) * 70}px` }}
                            onClick={() => setActiveRegion(i)}
                          />
                          <span className={`text-[7px] mt-1 truncate w-full text-center ${activeRegion === i ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]/40'}`}>{r.name.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DOM Trend - 6 Month */}
                  <div className="col-span-2 bg-white p-3 shadow-sm overflow-hidden flex flex-col border-l-2 border-[#Bfa67a] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold">6-Month DOM Trend</span>
                      <span className="text-[8px] text-[#Bfa67a] bg-[#Bfa67a]/10 px-2 py-0.5 rounded">↓ Improving</span>
                    </div>
                    <div className="flex items-end justify-between gap-2 flex-1">
                      {['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'].map((month, i) => {
                        const dom = [48, 46, 45, 44, 43, 42][i];
                        const isLatest = i === 5;
                        return (
                          <div key={month} className="flex-1 flex flex-col items-center justify-end h-full group">
                            <span className={`text-[9px] mb-1 ${isLatest ? 'text-[#Bfa67a] font-bold' : 'text-[#0C1C2E]/50'}`}>{dom}d</span>
                            <div className={`w-full max-w-[24px] rounded-t transition-all group-hover:scale-105 ${isLatest ? 'bg-[#Bfa67a]' : 'bg-[#0C1C2E]/20 hover:bg-[#Bfa67a]/50'}`} style={{ height: `${(dom / 50) * 60}px` }} />
                            <span className={`text-[8px] mt-1 ${isLatest ? 'text-[#Bfa67a] font-medium' : 'text-[#0C1C2E]/40'}`}>{month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Speed Summary Stats - Full Width */}
                  <div className="col-span-3 overflow-hidden">
                    <div className="grid grid-cols-6 gap-2 h-full">
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Fastest</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">18d</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Slowest</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">55d</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Average</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">42d</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">vs LY</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">-8%</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Wks Avg</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">3.2wk</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Trend</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">↑</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Value Tab */}
              {activeMetricTab === 'value' && (
                <div className="grid grid-cols-3 grid-rows-4 gap-3 h-full">
                  {/* Region $/SqFt - Tall Card */}
                  <div className="bg-[#0C1C2E] p-4 row-span-3 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#Bfa67a] text-[9px] uppercase tracking-widest font-bold">Value Index</span>
                      <span className={`text-[9px] px-2 py-0.5 ${MARKET_DATA.regions[activeRegion].pricePerSqFt > 485 ? 'bg-[#Bfa67a]/20 text-[#Bfa67a]' : 'bg-white/20 text-white'}`}>
                        {MARKET_DATA.regions[activeRegion].pricePerSqFt > 600 ? 'PREMIUM' : MARKET_DATA.regions[activeRegion].pricePerSqFt > 400 ? 'MID-TIER' : 'VALUE'}
                      </span>
                    </div>
                    <div className="text-center mb-2">
                      <span className="text-3xl font-serif text-white">${MARKET_DATA.regions[activeRegion].pricePerSqFt}</span>
                      <span className="text-white/40 text-xs block">/sq ft</span>
                    </div>
                    <h4 className="text-white font-serif text-base text-center mb-3">{MARKET_DATA.regions[activeRegion].name}</h4>
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div className="bg-white/5 p-3 text-center">
                        <span className="text-lg font-serif text-white block">${(MARKET_DATA.regions[activeRegion].medianPrice / 1000000).toFixed(1)}M</span>
                        <span className="text-[8px] uppercase text-white/40">Median</span>
                      </div>
                      <div className="bg-white/5 p-3 text-center">
                        <span className={`text-lg font-serif block ${MARKET_DATA.regions[activeRegion].pricePerSqFt > 485 ? 'text-[#Bfa67a]' : 'text-white'}`}>
                          {MARKET_DATA.regions[activeRegion].pricePerSqFt > 485 ? '+' : ''}{((MARKET_DATA.regions[activeRegion].pricePerSqFt - 485) / 485 * 100).toFixed(0)}%
                        </span>
                        <span className="text-[8px] uppercase text-white/40">vs Avg</span>
                      </div>
                      <div className="bg-white/5 p-3 text-center">
                        <span className="text-lg font-serif text-[#Bfa67a] block">+{MARKET_DATA.regions[activeRegion].change}%</span>
                        <span className="text-[8px] uppercase text-white/40">YoY</span>
                      </div>
                      <div className="bg-white/5 p-3 text-center">
                        <span className="text-lg font-serif text-white block">{MARKET_DATA.regions[activeRegion].listToSale}%</span>
                        <span className="text-[8px] uppercase text-white/40">List/Sale</span>
                      </div>
                    </div>
                    {/* Value meter */}
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex justify-between text-[8px] text-white/40 mb-1">
                        <span>Value</span>
                        <span>Premium</span>
                      </div>
                      <div className="h-2 bg-white/10 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-[#Bfa67a]/60 to-[#Bfa67a]" />
                        <div
                          className="absolute top-0 w-1 h-full bg-white"
                          style={{ left: `${Math.min((MARKET_DATA.regions[activeRegion].pricePerSqFt / 850) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* $/SqFt Leaders with Tier Indicators */}
                  <div className="col-span-2 bg-white p-3 shadow-sm overflow-hidden flex flex-col border-t-2 border-[#Bfa67a] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold">$/Sq Ft Leaderboard</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-[#Bfa67a] rounded-full" />
                        <span className="text-[8px] text-[#0C1C2E]/40">Premium</span>
                      </div>
                    </div>
                    <div className="space-y-[4px] flex-1">
                      {MARKET_DATA.communityMetrics.highestPricePerSqFt.map((c, i) => (
                        <div key={c.name} className={`flex items-center gap-2 p-1 rounded ${i === 0 ? 'bg-[#Bfa67a]/10' : 'hover:bg-[#F9F8F6]'} transition-colors cursor-pointer`}>
                          <div className={`w-5 h-5 flex items-center justify-center text-[10px] font-serif rounded ${i === 0 ? 'bg-[#Bfa67a] text-white' : 'bg-[#F9F8F6] text-[#0C1C2E]'}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#0C1C2E]">{c.name}</span>
                              <span className={`text-[10px] font-bold ${i === 0 ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]'}`}>${c.pricePerSqFt}</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#F9F8F6] mt-[2px] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${i === 0 ? 'bg-[#Bfa67a]' : 'bg-[#0C1C2E]/30'}`} style={{ width: `${(c.pricePerSqFt / 850) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Appreciation Heat Map */}
                  <div className="col-span-2 bg-white p-3 shadow-sm overflow-hidden flex flex-col border-l-2 border-[#Bfa67a] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold">YoY Appreciation</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-[#0C1C2E]/40">Low</span>
                        <div className="flex gap-0.5">
                          <div className="w-3 h-2 bg-[#Bfa67a]/30 rounded-sm" />
                          <div className="w-3 h-2 bg-[#Bfa67a]/60 rounded-sm" />
                          <div className="w-3 h-2 bg-[#Bfa67a] rounded-sm" />
                        </div>
                        <span className="text-[8px] text-[#0C1C2E]/40">High</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 flex-1">
                      {MARKET_DATA.communityMetrics.highestAppreciation.map((c, i) => (
                        <div key={c.name} className={`p-2 flex flex-col justify-center items-center border rounded ${c.change > 12 ? 'bg-[#Bfa67a]/20 border-[#Bfa67a]' : c.change > 10 ? 'bg-[#Bfa67a]/10 border-[#Bfa67a]/40' : 'bg-[#F9F8F6] border-[#0C1C2E]/10'} hover:scale-105 hover:border-[#Bfa67a] transition-all cursor-pointer`}>
                          <span className={`text-lg font-serif ${c.change > 12 ? 'text-[#Bfa67a]' : c.change > 10 ? 'text-[#0C1C2E]' : 'text-[#0C1C2E]/60'}`}>+{c.change}%</span>
                          <span className="text-[9px] text-[#0C1C2E] block truncate w-full text-center">{c.name}</span>
                          <span className="text-[7px] text-[#0C1C2E]/40">{c.region}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* $/SqFt by Region Chart */}
                  <div className="col-span-2 bg-white p-3 shadow-sm overflow-hidden flex flex-col border-l-2 border-[#0C1C2E]/20 hover:border-[#Bfa67a] hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#0C1C2E]/50 font-bold">$/Sq Ft by Region</span>
                      <div className="w-5 h-5 rounded-full bg-[#Bfa67a]/10 flex items-center justify-center">
                        <BarChart3 size={10} className="text-[#Bfa67a]" />
                      </div>
                    </div>
                    <div className="flex items-end gap-1 flex-1">
                      {MARKET_DATA.regions.map((r, i) => (
                        <div key={r.name} className="flex-1 flex flex-col items-center justify-end h-full group">
                          <span className={`text-[8px] mb-1 ${activeRegion === i ? 'text-[#Bfa67a] font-bold' : 'text-[#0C1C2E]/40 group-hover:text-[#Bfa67a]'} transition-colors`}>${r.pricePerSqFt}</span>
                          <div
                            className={`w-full max-w-[20px] cursor-pointer transition-all rounded-t ${activeRegion === i ? 'bg-[#Bfa67a]' : r.pricePerSqFt > 500 ? 'bg-[#Bfa67a]/60 hover:bg-[#Bfa67a]' : r.pricePerSqFt > 350 ? 'bg-[#0C1C2E]/40 hover:bg-[#Bfa67a]/60' : 'bg-[#0C1C2E]/20 hover:bg-[#Bfa67a]/40'}`}
                            style={{ height: `${(r.pricePerSqFt / 700) * 70}px` }}
                            onClick={() => setActiveRegion(i)}
                          />
                          <span className={`text-[7px] mt-1 truncate w-full text-center ${activeRegion === i ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]/40'}`}>{r.name.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Value Summary Stats - Full Width */}
                  <div className="col-span-3 overflow-hidden">
                    <div className="grid grid-cols-6 gap-2 h-full">
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Avg $/SF</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">$485</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Top $/SF</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">$845</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Low $/SF</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">$275</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">YoY</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">+6.2%</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Median</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">$1.85M</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Trend</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">↑</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Demand Tab */}
              {activeMetricTab === 'demand' && (
                <div className="grid grid-cols-3 grid-rows-4 gap-3 h-full">
                  {/* Inventory Gauge - Tall Card */}
                  <div className="bg-[#0C1C2E] p-4 row-span-3 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#Bfa67a] text-[9px] uppercase tracking-widest font-bold">Supply/Demand</span>
                      <span className={`text-[9px] px-2 py-0.5 ${MARKET_DATA.regions[activeRegion].inventory < 3 ? 'bg-[#Bfa67a]/20 text-[#Bfa67a]' : MARKET_DATA.regions[activeRegion].inventory < 5 ? 'bg-white/20 text-white/80' : 'bg-white/10 text-white/50'}`}>
                        {MARKET_DATA.regions[activeRegion].inventory < 3 ? 'HOT' : MARKET_DATA.regions[activeRegion].inventory < 5 ? 'WARM' : 'COOL'}
                      </span>
                    </div>
                    <div className="flex justify-center mb-2">
                      <div className="relative w-24 h-24">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#1a2a3a" strokeWidth="6" />
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#Bfa67a" strokeWidth="6" strokeLinecap="round"
                            strokeDasharray={`${((6 - MARKET_DATA.regions[activeRegion].inventory) / 6) * 264} 264`} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-serif text-white">{MARKET_DATA.regions[activeRegion].inventory}</span>
                          <span className="text-[8px] uppercase tracking-widest text-white/40">Months</span>
                        </div>
                      </div>
                    </div>
                    <h4 className="text-white font-serif text-base text-center mb-2">{MARKET_DATA.regions[activeRegion].name}</h4>
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div className="bg-white/5 p-3 text-center">
                        <span className="text-lg font-serif text-white block">{MARKET_DATA.regions[activeRegion].sales}</span>
                        <span className="text-[8px] uppercase text-white/40">Sales/Mo</span>
                      </div>
                      <div className="bg-white/5 p-3 text-center">
                        <span className="text-lg font-serif text-[#Bfa67a] block">{MARKET_DATA.regions[activeRegion].listToSale}%</span>
                        <span className="text-[8px] uppercase text-white/40">List/Sale</span>
                      </div>
                      <div className="bg-white/5 p-3 text-center">
                        <span className={`text-lg font-serif block ${MARKET_DATA.regions[activeRegion].inventory < 4 ? 'text-[#Bfa67a]' : 'text-white/70'}`}>
                          {MARKET_DATA.regions[activeRegion].inventory < 3 ? "Seller's" : MARKET_DATA.regions[activeRegion].inventory < 5 ? 'Balanced' : "Buyer's"}
                        </span>
                        <span className="text-[8px] uppercase text-white/40">Type</span>
                      </div>
                      <div className="bg-white/5 p-3 text-center">
                        <span className="text-lg font-serif text-[#Bfa67a] block">45%</span>
                        <span className="text-[8px] uppercase text-white/40">Multi-Offer</span>
                      </div>
                    </div>
                    {/* Demand meter */}
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex justify-between text-[8px] text-white/40 mb-1">
                        <span>Low Demand</span>
                        <span>High Demand</span>
                      </div>
                      <div className="h-2 bg-white/10 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-[#Bfa67a]/60 to-[#Bfa67a]" />
                        <div
                          className="absolute top-0 w-1 h-full bg-white"
                          style={{ left: `${100 - (MARKET_DATA.regions[activeRegion].inventory / 6) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Most Active Communities with Sales Volume Bars */}
                  <div className="bg-white p-3 shadow-sm overflow-hidden flex flex-col border-l-2 border-[#Bfa67a] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold">Most Active</span>
                      <div className="w-5 h-5 rounded-full bg-[#Bfa67a]/10 flex items-center justify-center">
                        <Activity size={10} className="text-[#Bfa67a]" />
                      </div>
                    </div>
                    <div className="space-y-[5px] flex-1">
                      {MARKET_DATA.communityMetrics.mostActive.map((c, i) => (
                        <div key={c.name} className={`flex items-center gap-2 p-1 rounded ${i === 0 ? 'bg-[#Bfa67a]/10' : 'hover:bg-[#F9F8F6]'} transition-colors cursor-pointer`}>
                          <div className={`w-4 h-4 flex items-center justify-center text-[9px] font-serif rounded ${i === 0 ? 'bg-[#Bfa67a] text-white' : 'bg-[#F9F8F6] text-[#0C1C2E]'}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#0C1C2E] truncate max-w-[60px]">{c.name}</span>
                              <span className={`text-[10px] font-bold ${i === 0 ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]'}`}>{c.sales}</span>
                            </div>
                            <div className="w-full h-1 bg-[#F9F8F6] mt-[1px] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${i === 0 ? 'bg-[#Bfa67a]' : 'bg-[#0C1C2E]/30'}`} style={{ width: `${(c.sales / 30) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lowest Inventory with Heat Indicators */}
                  <div className="bg-white p-3 shadow-sm overflow-hidden flex flex-col border-l-2 border-[#0C1C2E]/20 hover:border-[#Bfa67a] hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#0C1C2E]/50 font-bold">Tightest Supply</span>
                      <div className="w-5 h-5 rounded-full bg-[#Bfa67a]/10 flex items-center justify-center">
                        <Zap size={10} className="text-[#Bfa67a]" />
                      </div>
                    </div>
                    <div className="space-y-[5px] flex-1">
                      {MARKET_DATA.communityMetrics.lowestInventory.map((c, i) => (
                        <div key={c.name} className={`flex items-center gap-2 p-1 rounded ${c.inventory < 2 ? 'bg-[#Bfa67a]/10' : 'hover:bg-[#F9F8F6]'} transition-colors cursor-pointer`}>
                          <div className={`w-4 h-4 flex items-center justify-center text-[9px] font-serif rounded ${c.inventory < 2 ? 'bg-[#Bfa67a] text-white' : 'bg-[#F9F8F6] text-[#0C1C2E]'}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#0C1C2E] truncate max-w-[60px]">{c.name}</span>
                              <span className={`text-[10px] font-bold ${c.inventory < 2 ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]/70'}`}>{c.inventory}mo</span>
                            </div>
                            <div className="w-full h-1 bg-[#F9F8F6] mt-[1px] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${c.inventory < 2 ? 'bg-[#Bfa67a]' : 'bg-[#Bfa67a]/50'}`} style={{ width: `${100 - (c.inventory / 4) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Best List-to-Sale Communities */}
                  <div className="bg-white p-3 shadow-sm overflow-hidden flex flex-col border-l-2 border-[#Bfa67a] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold">Best List/Sale</span>
                      <div className="w-5 h-5 rounded-full bg-[#Bfa67a]/10 flex items-center justify-center">
                        <Target size={10} className="text-[#Bfa67a]" />
                      </div>
                    </div>
                    <div className="space-y-[5px] flex-1">
                      {MARKET_DATA.communityMetrics.bestListToSale.map((c, i) => (
                        <div key={c.name} className={`flex items-center gap-2 p-1 rounded ${c.ratio >= 100 ? 'bg-[#Bfa67a]/10' : 'hover:bg-[#F9F8F6]'} transition-colors cursor-pointer`}>
                          <div className={`w-4 h-4 flex items-center justify-center text-[9px] font-serif rounded ${c.ratio >= 100 ? 'bg-[#Bfa67a] text-white' : 'bg-[#F9F8F6] text-[#0C1C2E]'}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#0C1C2E] truncate max-w-[60px]">{c.name}</span>
                              <span className={`text-[10px] font-bold ${c.ratio >= 100 ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]/70'}`}>{c.ratio}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Inventory by Region Chart */}
                  <div className="bg-white p-3 shadow-sm overflow-hidden flex flex-col border-l-2 border-[#0C1C2E]/20 hover:border-[#Bfa67a] hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#0C1C2E]/50 font-bold">Inventory by Region</span>
                      <div className="w-5 h-5 rounded-full bg-[#0C1C2E]/5 flex items-center justify-center">
                        <BarChart3 size={10} className="text-[#0C1C2E]/50" />
                      </div>
                    </div>
                    <div className="flex items-end gap-1 flex-1">
                      {MARKET_DATA.regions.slice(0, 4).map((r, i) => (
                        <div key={r.name} className="flex-1 flex flex-col items-center justify-end h-full group">
                          <span className={`text-[8px] mb-1 ${r.inventory < 3 ? 'text-[#Bfa67a] font-bold' : 'text-[#0C1C2E]/50 group-hover:text-[#Bfa67a]'} transition-colors`}>{r.inventory}</span>
                          <div
                            className={`w-full max-w-[16px] rounded-t transition-all cursor-pointer ${r.inventory < 3 ? 'bg-[#Bfa67a]' : r.inventory < 5 ? 'bg-[#0C1C2E]/40 hover:bg-[#Bfa67a]/60' : 'bg-[#0C1C2E]/20 hover:bg-[#Bfa67a]/40'}`}
                            style={{ height: `${(r.inventory / 6) * 50}px` }}
                          />
                          <span className="text-[7px] text-[#0C1C2E]/40 mt-1 truncate w-full text-center">{r.name.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sales Trend Chart */}
                  <div className="col-span-2 bg-white p-3 shadow-sm overflow-hidden flex flex-col border-t-2 border-[#Bfa67a] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold">6-Month Sales Trend</span>
                      <span className="text-[8px] text-[#Bfa67a] bg-[#Bfa67a]/10 px-2 py-0.5 rounded">↑ Growing</span>
                    </div>
                    <div className="flex items-end justify-between gap-2 flex-1">
                      {MARKET_DATA.monthlyTrends.map((month, i) => {
                        const isLatest = i === MARKET_DATA.monthlyTrends.length - 1;
                        return (
                        <div key={month.month} className="flex-1 flex flex-col items-center justify-end h-full group">
                          <span className={`text-[9px] mb-1 ${isLatest ? 'text-[#Bfa67a] font-bold' : 'text-[#0C1C2E]/50'}`}>{month.sales}</span>
                          <div className={`w-full max-w-[24px] rounded-t transition-all group-hover:scale-105 ${isLatest ? 'bg-[#Bfa67a]' : 'bg-[#0C1C2E]/20 hover:bg-[#Bfa67a]/50'}`} style={{ height: `${(month.sales / 200) * 70}px` }} />
                          <span className={`text-[8px] mt-1 ${isLatest ? 'text-[#Bfa67a] font-medium' : 'text-[#0C1C2E]/40'}`}>{month.month}</span>
                        </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Demand Summary Stats - Full Width */}
                  <div className="col-span-3 overflow-hidden">
                    <div className="grid grid-cols-6 gap-2 h-full">
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Mo Supply</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">3.2</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">List/Sale</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">97.2%</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Multi-Offer</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">45%</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Sales</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">198</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Demand</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">High</span>
                      </div>
                      <div className="bg-white p-3 shadow-sm flex flex-col justify-center text-center hover:shadow-md hover:border-b-2 hover:border-[#Bfa67a] transition-all cursor-pointer group">
                        <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 mb-1 group-hover:text-[#Bfa67a] transition-colors">Inventory</span>
                        <span className="text-lg font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">Low</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Intelligence Section */}
      <section
        ref={intelAnim.ref}
        className="py-16 bg-[#F9F8F6]"
      >
        <div className={`max-w-[1600px] mx-auto px-8 lg:px-20 transition-all duration-700 ${intelAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-8">
            <div>
              <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-2">
                Market Intelligence
              </span>
              <h2 className="text-2xl font-serif text-[#0C1C2E]">
                Desert Luxury <span className="italic font-light">Insights</span>
              </h2>
            </div>
            {/* Perspective Tabs - styled like Neighborhood Breakdown tabs */}
            <div className="mt-4 lg:mt-0 inline-flex items-center">
              {([
                { id: 'buyers' as IntelPerspective, label: 'Buyers', icon: Target },
                { id: 'sellers' as IntelPerspective, label: 'Sellers', icon: DollarSign },
                { id: 'homeowners' as IntelPerspective, label: 'Homeowners', icon: Home },
              ]).map((tab, index, arr) => (
                <div key={tab.id} className="flex items-center">
                  <button
                    onClick={() => setIntelPerspective(tab.id)}
                    className={`px-3 py-1 transition-all relative flex items-center gap-1.5 ${
                      intelPerspective === tab.id
                        ? 'text-[#0C1C2E]'
                        : 'text-[#0C1C2E]/40 hover:text-[#0C1C2E]/70'
                    }`}
                  >
                    <tab.icon size={14} className={intelPerspective === tab.id ? 'text-[#Bfa67a]' : ''} />
                    <span className={`font-serif text-sm tracking-wide ${intelPerspective === tab.id ? 'italic' : ''}`}>
                      {tab.label}
                    </span>
                    {intelPerspective === tab.id && (
                      <span className="absolute bottom-0 left-3 right-3 h-[1px] bg-[#Bfa67a]" />
                    )}
                  </button>
                  {index < arr.length - 1 && (
                    <span className="text-[#0C1C2E]/20 text-xs mx-1 font-light">|</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Panel - Featured Insight Card */}
            <div className="lg:col-span-4 bg-[#0C1C2E] p-6">
              <div className="flex items-center gap-2 mb-4">
                {intelPerspective === 'buyers' && <MapPin size={14} className="text-[#Bfa67a]" />}
                {intelPerspective === 'sellers' && <Activity size={14} className="text-[#Bfa67a]" />}
                {intelPerspective === 'homeowners' && <TrendingUp size={14} className="text-[#Bfa67a]" />}
                <span className="text-[9px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold">
                  {intelPerspective === 'buyers' ? 'Buyer Origins' : intelPerspective === 'sellers' ? 'Seller Metrics' : 'Equity Growth'}
                </span>
              </div>

              {intelPerspective === 'buyers' && (
                <div className="space-y-3">
                  {MARKET_DATA.marketIntelligence.buyerMigration.slice(0, 5).map((source, idx) => (
                    <div key={source.state} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-serif w-5 h-5 flex items-center justify-center ${
                            idx === 0 ? 'bg-[#Bfa67a] text-white' : 'bg-white/10 text-white/60'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-white text-sm">{source.state}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#Bfa67a] font-serif">{source.percentage}%</span>
                          <span className={`text-[9px] flex items-center gap-0.5 ${source.change > 0 ? 'text-[#Bfa67a]' : 'text-white/40'}`}>
                            {source.change > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                            {Math.abs(source.change)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1 bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-[#Bfa67a] transition-all duration-500"
                          style={{ width: `${source.percentage * 2.5}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 mt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Out-of-State Total</span>
                      <span className="text-[#Bfa67a] font-bold">722 YTD</span>
                    </div>
                  </div>
                </div>
              )}

              {intelPerspective === 'sellers' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-3 text-center">
                      <span className="text-2xl font-serif text-[#Bfa67a]">3.2</span>
                      <span className="block text-[9px] text-white/50 uppercase tracking-wider mt-1">Offers/Listing</span>
                    </div>
                    <div className="bg-white/5 p-3 text-center">
                      <span className="text-2xl font-serif text-[#Bfa67a]">35%</span>
                      <span className="block text-[9px] text-white/50 uppercase tracking-wider mt-1">Above Asking</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/50 text-sm">First Week Showings</span>
                      <span className="text-white font-medium">12 avg</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/50 text-sm">Cash Buyers</span>
                      <span className="text-white font-medium">42%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/50 text-sm">Price Reduction</span>
                      <span className="text-white font-medium">2.4%</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-white/50 text-sm">Withdrawn</span>
                      <span className="text-white font-medium">4.8%</span>
                    </div>
                  </div>
                </div>
              )}

              {intelPerspective === 'homeowners' && (
                <div className="space-y-4">
                  <div className="bg-[#Bfa67a]/10 p-4 border-l-2 border-[#Bfa67a]">
                    <span className="text-[9px] text-white/50 uppercase tracking-wider block mb-1">1-Year Equity Gain</span>
                    <span className="text-3xl font-serif text-[#Bfa67a]">$86,500</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/50 text-sm">5-Year Gain</span>
                      <span className="text-white font-medium">$425,000</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/50 text-sm">Refi Opportunity</span>
                      <span className="text-white font-medium">34%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/50 text-sm">Renovation ROI</span>
                      <span className="text-white font-medium">72%</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-white/50 text-sm">HELOC Usage</span>
                      <span className="text-white font-medium">18%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Data Table with Drilldown */}
            <div className="lg:col-span-8 bg-white shadow-sm">
              {/* Drilldown Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#0C1C2E]/10">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-[#Bfa67a]" />
                  <span className="text-[9px] uppercase tracking-[0.15em] text-[#0C1C2E]/50 font-bold">
                    Market Data
                  </span>
                </div>
                <div className="inline-flex items-center">
                  {(['region', 'zipcode', 'community'] as IntelDrilldown[]).map((level, index, arr) => (
                    <div key={level} className="flex items-center">
                      <button
                        onClick={() => setIntelDrilldown(level)}
                        className={`px-2 py-1 transition-all relative ${
                          intelDrilldown === level
                            ? 'text-[#0C1C2E]'
                            : 'text-[#0C1C2E]/40 hover:text-[#0C1C2E]/70'
                        }`}
                      >
                        <span className={`text-xs tracking-wide capitalize ${intelDrilldown === level ? 'font-medium' : ''}`}>
                          {level}
                        </span>
                        {intelDrilldown === level && (
                          <span className="absolute bottom-0 left-2 right-2 h-[1px] bg-[#Bfa67a]" />
                        )}
                      </button>
                      {index < arr.length - 1 && (
                        <span className="text-[#0C1C2E]/20 text-xs mx-0.5 font-light">|</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#0C1C2E]/10 bg-[#F9F8F6]">
                      <th className="text-left py-3 px-4 text-[9px] uppercase tracking-wider text-[#0C1C2E]/40 font-medium">
                        {intelDrilldown === 'zipcode' ? 'Zipcode' : intelDrilldown === 'community' ? 'Community' : 'Region'}
                      </th>
                      <th className="text-right py-3 px-4 text-[9px] uppercase tracking-wider text-[#0C1C2E]/40 font-medium">Median</th>
                      <th className="text-right py-3 px-4 text-[9px] uppercase tracking-wider text-[#0C1C2E]/40 font-medium">YoY</th>
                      <th className="text-right py-3 px-4 text-[9px] uppercase tracking-wider text-[#0C1C2E]/40 font-medium">DOM</th>
                      <th className="text-right py-3 px-4 text-[9px] uppercase tracking-wider text-[#0C1C2E]/40 font-medium">Supply</th>
                      {intelDrilldown === 'zipcode' && (
                        <th className="text-right py-3 px-4 text-[9px] uppercase tracking-wider text-[#0C1C2E]/40 font-medium">5Yr</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {intelDrilldown === 'zipcode' ? (
                      MARKET_DATA.marketIntelligence.zipcodes.map((zip, idx) => (
                        <tr key={zip.code} className="border-b border-[#0C1C2E]/5 hover:bg-[#F9F8F6] transition-colors cursor-pointer group">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[#Bfa67a] font-mono text-sm">{zip.code}</span>
                              <span className="text-[#0C1C2E]/40 text-xs">{zip.name}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 text-[#0C1C2E] font-medium text-sm">
                            ${(zip.medianPrice / 1000000).toFixed(2)}M
                          </td>
                          <td className="text-right py-3 px-4">
                            <span className={`inline-flex items-center gap-1 text-sm ${zip.priceChange > 5 ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]/60'}`}>
                              {zip.priceChange > 0 && <TrendingUp size={11} />}
                              +{zip.priceChange}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-4 text-[#0C1C2E]/70 text-sm">{zip.dom}d</td>
                          <td className="text-right py-3 px-4 text-[#0C1C2E]/70 text-sm">{zip.inventory}mo</td>
                          <td className="text-right py-3 px-4 text-[#Bfa67a] font-medium text-sm">+{zip.appreciation5Yr}%</td>
                        </tr>
                      ))
                    ) : intelDrilldown === 'region' ? (
                      MARKET_DATA.regions.slice(0, 6).map((region, idx) => (
                        <tr key={region.name} className="border-b border-[#0C1C2E]/5 hover:bg-[#F9F8F6] transition-colors cursor-pointer group">
                          <td className="py-3 px-4">
                            <span className="text-[#0C1C2E] font-medium text-sm">{region.name}</span>
                          </td>
                          <td className="text-right py-3 px-4 text-[#0C1C2E] font-medium text-sm">
                            ${(region.medianPrice / 1000000).toFixed(2)}M
                          </td>
                          <td className="text-right py-3 px-4">
                            <span className={`inline-flex items-center gap-1 text-sm ${region.change > 5 ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]/60'}`}>
                              {region.change > 0 && <TrendingUp size={11} />}
                              +{region.change}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-4 text-[#0C1C2E]/70 text-sm">{region.dom}d</td>
                          <td className="text-right py-3 px-4 text-[#0C1C2E]/70 text-sm">{region.inventory}mo</td>
                        </tr>
                      ))
                    ) : (
                      MARKET_DATA.communityMetrics.highestAppreciation.slice(0, 5).map((community, idx) => (
                        <tr key={community.name} className="border-b border-[#0C1C2E]/5 hover:bg-[#F9F8F6] transition-colors cursor-pointer group">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[#0C1C2E] font-medium text-sm">{community.name}</span>
                              <span className="text-[9px] text-[#0C1C2E]/40">{community.region}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 text-[#0C1C2E]/40 text-sm">—</td>
                          <td className="text-right py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-sm text-[#Bfa67a]">
                              <TrendingUp size={11} />
                              +{community.change}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-4 text-[#0C1C2E]/40 text-sm">—</td>
                          <td className="text-right py-3 px-4 text-[#0C1C2E]/40 text-sm">—</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom KPI Row */}
              <div className="grid grid-cols-4 border-t border-[#0C1C2E]/10">
                <div className="p-4 text-center border-r border-[#0C1C2E]/10 hover:bg-[#F9F8F6] transition-colors cursor-pointer group">
                  <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 block mb-1 group-hover:text-[#Bfa67a] transition-colors">
                    {intelPerspective === 'buyers' ? 'Competition' : intelPerspective === 'sellers' ? 'Avg DOM' : 'Annual Appr'}
                  </span>
                  <span className="text-xl font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">
                    {intelPerspective === 'buyers' ? '78' : intelPerspective === 'sellers' ? '38d' : '6.2%'}
                  </span>
                </div>
                <div className="p-4 text-center border-r border-[#0C1C2E]/10 hover:bg-[#F9F8F6] transition-colors cursor-pointer group">
                  <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 block mb-1 group-hover:text-[#Bfa67a] transition-colors">
                    {intelPerspective === 'buyers' ? 'Avg Offers' : intelPerspective === 'sellers' ? 'List/Sale' : 'Median'}
                  </span>
                  <span className="text-xl font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">
                    {intelPerspective === 'buyers' ? '2.8' : intelPerspective === 'sellers' ? '97.2%' : '$1.85M'}
                  </span>
                </div>
                <div className="p-4 text-center border-r border-[#0C1C2E]/10 hover:bg-[#F9F8F6] transition-colors cursor-pointer group">
                  <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 block mb-1 group-hover:text-[#Bfa67a] transition-colors">
                    {intelPerspective === 'buyers' ? 'Cash Buyers' : intelPerspective === 'sellers' ? 'Best Month' : 'Reno ROI'}
                  </span>
                  <span className="text-xl font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">
                    {intelPerspective === 'buyers' ? '42%' : intelPerspective === 'sellers' ? 'April' : '72%'}
                  </span>
                </div>
                <div className="p-4 text-center hover:bg-[#F9F8F6] transition-colors cursor-pointer group">
                  <span className="text-[8px] uppercase tracking-[0.15em] text-[#0C1C2E]/40 block mb-1 group-hover:text-[#Bfa67a] transition-colors">
                    {intelPerspective === 'buyers' ? 'Best Month' : intelPerspective === 'sellers' ? 'Multi-Offer' : 'Refi Opp'}
                  </span>
                  <span className="text-xl font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">
                    {intelPerspective === 'buyers' ? 'Nov' : intelPerspective === 'sellers' ? '45%' : '34%'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Luxury Tier Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {Object.entries(MARKET_DATA.marketIntelligence.luxuryTiers).map(([tier, data]) => {
              const tierLabels: Record<string, string> = {
                tier1M: '$1M+',
                tier2M: '$2M+',
                tier5M: '$5M+',
                tier10M: '$10M+',
              };
              return (
                <div
                  key={tier}
                  className="bg-white p-4 shadow-sm border-l-2 border-[#0C1C2E]/10 hover:border-[#Bfa67a] hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[#0C1C2E] font-serif text-lg group-hover:text-[#Bfa67a] transition-colors">{tierLabels[tier]}</span>
                    <span className={`text-[9px] px-2 py-0.5 ${data.yoyChange > 15 ? 'bg-[#Bfa67a]/10 text-[#Bfa67a]' : 'bg-[#0C1C2E]/5 text-[#0C1C2E]/60'}`}>
                      +{data.yoyChange}%
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#0C1C2E]/40">Sales</span>
                      <span className="text-[#0C1C2E]">{data.sales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#0C1C2E]/40">DOM</span>
                      <span className="text-[#0C1C2E]">{data.avgDOM}d</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#0C1C2E]/40">Supply</span>
                      <span className="text-[#0C1C2E]">{data.inventory}mo</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="text-center mt-10">
            <Link
              to="/market-report"
              className="inline-flex items-center gap-3 bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#Bfa67a] transition-all group"
            >
              View Full Market Report
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Price Tier Breakdown */}
      <section className="py-16 bg-white">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-2">
                Market Segmentation
              </span>
              <h2 className="text-2xl font-serif text-[#0C1C2E]">
                Luxury Tier <span className="italic font-light">Analysis</span>
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-3 text-sm text-gray-500">
              <Calendar size={16} className="text-[#Bfa67a]" />
              Last 90 Days
            </div>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {MARKET_DATA.priceTiers.map((tier, idx) => (
              <div
                key={tier.tier}
                className="group bg-[#F9F8F6] p-6 hover:bg-[#0C1C2E] transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[#Bfa67a] text-2xl font-serif">{tier.percentage}%</span>
                  <PieChart size={18} className="text-gray-300 group-hover:text-[#Bfa67a] transition-colors" />
                </div>
                <h3 className="font-medium text-[#0C1C2E] group-hover:text-white transition-colors mb-4">
                  {tier.tier}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400 group-hover:text-white/60 transition-colors">Active</span>
                    <span className="text-gray-600 group-hover:text-white transition-colors">{tier.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 group-hover:text-white/60 transition-colors">Avg DOM</span>
                    <span className="text-gray-600 group-hover:text-white transition-colors">{tier.avgDOM} days</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4 w-full h-1 bg-gray-200 group-hover:bg-white/20 transition-colors">
                  <div
                    className="h-full bg-[#Bfa67a] transition-all duration-500"
                    style={{ width: `${tier.percentage * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Notable Sales */}
      <section className="py-16 bg-white">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-2">
                Market Activity
              </span>
              <h2 className="text-2xl font-serif text-[#0C1C2E]">
                Recent Notable <span className="italic font-light">Sales</span>
              </h2>
            </div>
            <Link
              to="/listings"
              className="hidden md:flex items-center gap-2 text-[#Bfa67a] text-[10px] uppercase tracking-[0.2em] font-bold hover:gap-3 transition-all group"
            >
              View All Listings <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MARKET_DATA.recentSales.map((sale, idx) => (
              <div key={idx} className="group cursor-pointer">
                <div className="bg-[#F9F8F6] p-6 hover:bg-[#0C1C2E] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[#Bfa67a] text-[10px] uppercase tracking-widest font-bold">
                      {sale.community}
                    </span>
                    <span className="text-gray-400 group-hover:text-white/60 text-xs transition-colors">
                      {sale.date}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl text-[#0C1C2E] group-hover:text-white mb-2 transition-colors">
                    ${(sale.price / 1000000).toFixed(2)}M
                  </h3>
                  <p className="text-gray-500 group-hover:text-white/60 text-sm mb-4 transition-colors truncate">
                    {sale.address}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 group-hover:border-white/20 transition-colors">
                    <span className="text-gray-400 group-hover:text-white/60 text-sm transition-colors">
                      {sale.dom} days on market
                    </span>
                    <Award size={16} className="text-[#Bfa67a]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools & Resources */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
          <div className="text-center mb-12">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-2">
              Tools & Resources
            </span>
            <h2 className="text-3xl font-serif text-[#0C1C2E]">
              Make <span className="italic font-light">Informed Decisions</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Buyer's Center */}
            <Link
              to="/insights/buyers"
              className="bg-white p-6 shadow-md hover:shadow-xl transition-all duration-300 group border-l-4 border-[#Bfa67a]"
            >
              <Target size={28} className="text-[#Bfa67a] mb-4" />
              <h3 className="font-serif text-xl text-[#0C1C2E] mb-2 group-hover:text-[#Bfa67a] transition-colors">
                Buyer's Center
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Affordability calculator, mortgage estimates, and market timing insights.
              </p>
              <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#Bfa67a] group-hover:gap-3 transition-all">
                Explore <ArrowRight size={12} />
              </span>
            </Link>

            {/* Seller's Center */}
            <Link
              to="/insights/sellers"
              className="bg-white p-6 shadow-md hover:shadow-xl transition-all duration-300 group border-l-4 border-[#Bfa67a]"
            >
              <DollarSign size={28} className="text-[#Bfa67a] mb-4" />
              <h3 className="font-serif text-xl text-[#0C1C2E] mb-2 group-hover:text-[#Bfa67a] transition-colors">
                Seller's Center
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Net proceeds calculator, home valuation request, and pricing strategy.
              </p>
              <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#Bfa67a] group-hover:gap-3 transition-all">
                Explore <ArrowRight size={12} />
              </span>
            </Link>

            {/* Market Comparison */}
            <Link
              to="/market-report"
              className="bg-white p-6 shadow-md hover:shadow-xl transition-all duration-300 group border-l-4 border-[#Bfa67a]"
            >
              <Scale size={28} className="text-[#Bfa67a] mb-4" />
              <h3 className="font-serif text-xl text-[#0C1C2E] mb-2 group-hover:text-[#Bfa67a] transition-colors">
                Market Report
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Compare regions and communities side-by-side with detailed metrics.
              </p>
              <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#Bfa67a] group-hover:gap-3 transition-all">
                Compare <ArrowRight size={12} />
              </span>
            </Link>

            {/* Consultation */}
            <Link
              to="/contact"
              className="bg-[#0C1C2E] p-6 shadow-sm hover:shadow-xl transition-all duration-300 group"
            >
              <Users size={28} className="text-[#Bfa67a] mb-4" />
              <h3 className="font-serif text-xl text-white mb-2 group-hover:text-[#Bfa67a] transition-colors">
                Expert Guidance
              </h3>
              <p className="text-white/60 text-sm mb-4">
                Get personalized insights from Yong Choi on your real estate goals.
              </p>
              <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#Bfa67a] group-hover:gap-3 transition-all">
                Schedule <ArrowRight size={12} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0C1C2E]">
        <div className="max-w-[800px] mx-auto px-8 text-center">
          <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Stay Informed</span>
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">
            Get Monthly Market <span className="italic font-light">Reports</span>
          </h2>
          <p className="text-white/60 mb-8 text-lg font-light">
            Receive exclusive market insights and analysis delivered to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-5 py-4 bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#Bfa67a] transition-colors"
            />
            <button
              type="submit"
              className="bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all"
            >
              Subscribe
            </button>
          </form>
          <p className="text-white/40 text-xs mt-4">
            Join 2,500+ subscribers. Unsubscribe anytime.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InsightsDashboard;
