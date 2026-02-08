import { useState } from 'react';
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
  Sun,
  Wind,
  ArrowRight,
  Download,
  Calendar,
  Activity,
  Award,
  Percent,
  GraduationCap,
  Lock
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
  trend: string;
  trendDir: 'up' | 'down' | 'neutral';
  description: string;
}

// --- Constants ---
const LISTINGS: Listing[] = [
  { id: 1, price: "$4,850,000", ppsf: "$892", beds: 5, baths: 5.5, sqft: 5430, address: "1024 Pinnacle Vista Dr", status: "Active", lot: "1.4 Acres", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800" },
  { id: 2, price: "$2,975,000", ppsf: "$714", beds: 4, baths: 4, sqft: 4165, address: "8842 Ocotillo Ridge", status: "Pending", lot: "0.8 Acres", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800" },
  { id: 3, price: "$7,200,000", ppsf: "$1,104", beds: 6, baths: 7.5, sqft: 6520, address: "12 Canyon Overlook", status: "Active", lot: "2.1 Acres", img: "https://images.unsplash.com/photo-1600607687940-47a04b629733?auto=format&fit=crop&q=80&w=800" },
  { id: 4, price: "$3,450,000", ppsf: "$780", beds: 4, baths: 4.5, sqft: 4420, address: "901 Desert Bloom Cir", status: "Active", lot: "1.1 Acres", img: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&q=80&w=800" },
];

const METRICS: MarketMetric[] = [
  { label: "Median List Price", value: "$3.12M", trend: "+14.2%", trendDir: 'up', description: "12-Month Rolling Avg" },
  { label: "Avg Days on Market", value: "24", trend: "-8%", trendDir: 'down', description: "High Velocity" },
  { label: "Price Per SqFt", value: "$842", trend: "+$45", trendDir: 'up', description: "Sector Leading" },
  { label: "Absorption Rate", value: "1.4 Mo", trend: "0.2", trendDir: 'neutral', description: "Seller's Market" },
];

const NeighborhoodProfile2: React.FC = () => {
  const [currentPage] = useState(1);

  const currentListings = LISTINGS.slice((currentPage - 1) * 3, currentPage * 3);

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] page-zoom-90 font-sans selection:bg-[#0C1C2E] selection:text-white antialiased">

      {/* Navigation */}
      <Navigation variant="transparent" />

      {/* Hero Section - Immersive */}
      <section className="relative h-[85vh] w-full overflow-hidden flex items-end">
        <img
          src="https://images.unsplash.com/photo-1469022563428-aa04fef9f5a2?auto=format&fit=crop&q=80&w=2400"
          className="absolute inset-0 w-full h-full object-cover"
          alt="Hero"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E]/90 via-[#0C1C2E]/20 to-transparent" />

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
            <div className="hidden lg:flex flex-col sm:flex-row gap-4">
              <button className="bg-white text-[#0C1C2E] px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#Bfa67a] hover:text-white transition-all flex items-center gap-2 group shadow-lg shadow-black/20">
                 Schedule Tour
                 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
              </button>
              <button className="border border-white/30 backdrop-blur-sm text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2">
                 <Download size={14} />
                 Get Guide
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Market Intelligence Dashboard (KPIs) */}
      <section className="relative z-20 -mt-16 max-w-[1600px] mx-auto px-8 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {METRICS.map((metric, i) => (
            <div key={i} className="bg-white p-8 shadow-xl shadow-black/5 border-t-4 border-[#Bfa67a]">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">{metric.label}</span>
                {metric.trendDir === 'up' ? <TrendingUp size={16} className="text-[#0C1C2E]"/> : <TrendingUp size={16} className="text-gray-300 rotate-180"/>}
              </div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-serif text-[#0C1C2E]">{metric.value}</span>
                <span className={`text-xs font-bold ${metric.trendDir === 'up' ? 'text-emerald-600' : 'text-rose-500'}`}>{metric.trend}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">{metric.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial Section: The Narrative */}
      <section className="py-32 max-w-[1600px] mx-auto px-8 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          {/* Sticky Image Column */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-32 h-[600px] w-full overflow-hidden">
               <img
                 src="https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?auto=format&fit=crop&q=80&w=1200"
                 className="w-full h-full object-cover"
                 alt="Architecture"
               />
               <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur px-4 py-2">
                 <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#0C1C2E]">Architectural Context</p>
               </div>
            </div>
          </div>

          {/* Editorial Content Column */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-8">The Narrative</span>
            <h2 className="text-4xl md:text-5xl font-serif leading-[1.15] text-[#0C1C2E] mb-12">
              Where the high desert meets <br/>
              <span className="italic text-gray-400">uncompromising precision.</span>
            </h2>

            <div className="prose prose-lg text-gray-500 font-light leading-relaxed mb-12 max-w-2xl">
              <p className="first-letter:text-6xl first-letter:font-serif first-letter:text-[#0C1C2E] first-letter:mr-3 first-letter:float-left">
                Saguaro Highlands is not merely a collection of estates; it is a masterfully curated dialogue between modern architecture and the ancient Sonoran landscape.
                Establish in the foothills of the McDowell Mountains, this enclave represents the pinnacle of low-density, high-privacy living.
              </p>
              <p className="mt-6">
                Residents here trade the noise of the city for the silence of the saguaros, without sacrificing access. With Scottsdale's private airpark just minutes away and the Troon North golf corridor at your doorstep, it is a sanctuary for those who demand accessibility and seclusion in equal measure.
              </p>
            </div>

            {/* Editorial CTA */}
            <div className="mb-12">
              <button className="flex items-center gap-3 text-[#0C1C2E] border-b border-[#0C1C2E] pb-1 text-[10px] uppercase tracking-[0.2em] font-bold hover:text-[#Bfa67a] hover:border-[#Bfa67a] transition-all group">
                Download Neighborhood Guide
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
              </button>
            </div>

            {/* Micro-Features within Editorial */}
            <div className="grid grid-cols-2 gap-8 border-t border-gray-200 pt-10">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Sun size={18} className="text-[#Bfa67a]" />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#0C1C2E]">Solar Orientation</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">Strict guidelines ensure every estate maximizes winter sun while shielding summer heat.</p>
               </div>
               <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Wind size={18} className="text-[#Bfa67a]" />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#0C1C2E]">Thermal Design</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">Elevated positioning provides a consistent 5-7° cooling differential from the valley floor.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Graphs & Deep Dive */}
      <section className="bg-white py-24 border-y border-gray-100">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">

            {/* Left Col: Compact Velocity Chart */}
            <div className="lg:col-span-2">
              <div className="flex flex-col sm:flex-row justify-between items-end mb-10">
                <div>
                   <h3 className="text-2xl font-serif text-[#0C1C2E] mb-2">Market Velocity</h3>
                   <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">Inventory vs. Sold Volume (Q1-Q2)</p>
                </div>
                <div className="flex gap-6 text-[10px] uppercase tracking-[0.2em] font-bold mt-4 sm:mt-0">
                   <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#0C1C2E] rounded-full"></span> Active</div>
                   <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#Bfa67a] rounded-full"></span> Sold</div>
                </div>
              </div>

              <div className="h-64 w-full flex items-end justify-between gap-2 md:gap-4 px-4 border-b border-gray-200 relative">
                 <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                    <div className="w-full h-px bg-[#0C1C2E]"></div>
                    <div className="w-full h-px bg-[#0C1C2E]"></div>
                    <div className="w-full h-px bg-[#0C1C2E]"></div>
                 </div>
                 {[
                   { label: 'Jan', active: 40, sold: 25 },
                   { label: 'Feb', active: 35, sold: 30 },
                   { label: 'Mar', active: 28, sold: 45 },
                   { label: 'Apr', active: 22, sold: 35 },
                   { label: 'May', active: 18, sold: 42 },
                   { label: 'Jun', active: 15, sold: 38 },
                   { label: 'Jul', active: 20, sold: 25 },
                   { label: 'Aug', active: 24, sold: 20 },
                 ].map((data, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 h-full z-10 group cursor-pointer">
                       <div className="w-full flex gap-1 items-end justify-center h-full relative">
                          <div className="w-2 md:w-5 bg-[#0C1C2E] transition-all duration-700 hover:opacity-80" style={{ height: `${data.active}%` }}></div>
                          <div className="w-2 md:w-5 bg-[#Bfa67a] transition-all duration-700 hover:opacity-80" style={{ height: `${data.sold}%` }}></div>
                       </div>
                       <span className="text-[9px] uppercase tracking-widest text-gray-400 mt-4">{data.label}</span>
                    </div>
                 ))}
              </div>
            </div>

            {/* Right Col: Quality Signals */}
            <div className="lg:col-span-1 lg:pl-12 lg:border-l border-gray-100 flex flex-col justify-center">
               <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#Bfa67a] mb-8 flex items-center gap-2">
                 <Award size={14} /> Proven Sales Drivers
               </h4>
               <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-gray-100 pb-3 group hover:border-[#Bfa67a] transition-colors">
                      <div className="flex items-center gap-2">
                        <Percent size={14} className="text-gray-400" />
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">5-Year Equity Growth</span>
                      </div>
                      <span className="text-xl font-serif text-[#0C1C2E]">+42.5%</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 pb-3 group hover:border-[#Bfa67a] transition-colors">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-gray-400" />
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Sale-to-List Ratio</span>
                      </div>
                      <span className="text-xl font-serif text-[#0C1C2E]">98.8%</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 pb-3 group hover:border-[#Bfa67a] transition-colors">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={14} className="text-gray-400" />
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">School Proficiency</span>
                      </div>
                      <span className="text-xl font-serif text-[#0C1C2E]">10/10</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 pb-3 group hover:border-[#Bfa67a] transition-colors">
                      <div className="flex items-center gap-2">
                        <Lock size={14} className="text-gray-400" />
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Safety Index</span>
                      </div>
                      <span className="text-xl font-serif text-[#0C1C2E]">99/100</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-100 pb-3 group hover:border-[#Bfa67a] transition-colors">
                      <div className="flex items-center gap-2">
                        <Activity size={14} className="text-gray-400" />
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Market Demand</span>
                      </div>
                      <span className="text-xl font-serif text-emerald-600">High</span>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Listing - High Impact */}
      <section className="py-32 max-w-[1600px] mx-auto px-8 lg:px-20">
        <div className="flex flex-col lg:flex-row shadow-2xl shadow-black/5">
          <div className="lg:w-7/12 h-[700px] relative overflow-hidden group">
            <img
              src="https://images.unsplash.com/photo-1600607687940-47a04b629733?auto=format&fit=crop&q=80&w=1600"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              alt="Featured"
            />
            <div className="absolute top-6 left-6 flex gap-2">
               <span className="bg-[#0C1C2E] text-white px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold">Featured Listing</span>
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
                <div>
                   <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">List Price</span>
                   <span className="text-2xl font-serif">$8,450,000</span>
                </div>
                <div>
                   <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">Interior</span>
                   <span className="text-2xl font-serif">8,200 SF</span>
                </div>
                <div>
                   <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">Lot Size</span>
                   <span className="text-2xl font-serif">2.5 AC</span>
                </div>
                <div>
                   <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">Config</span>
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

      {/* Listing Grid */}
      <section className="py-24 bg-[#F5F5F0]">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
           <div className="flex justify-between items-end mb-16">
              <h2 className="text-3xl font-serif text-[#0C1C2E]">Current Inventory</h2>
              <div className="flex gap-2">
                 <button className="p-4 bg-white border border-gray-200 hover:border-[#0C1C2E] transition-colors"><ChevronLeft size={16}/></button>
                 <button className="p-4 bg-white border border-gray-200 hover:border-[#0C1C2E] transition-colors"><ChevronRight size={16}/></button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentListings.map(listing => (
                 <div key={listing.id} className="bg-white group cursor-pointer transition-shadow hover:shadow-xl">
                    <div className="aspect-[4/3] overflow-hidden relative">
                       <img src={listing.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={listing.address} />
                       <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 text-[9px] font-bold uppercase tracking-widest">
                          {listing.status}
                       </div>
                    </div>

                    <div className="p-8">
                       <div className="flex justify-between items-start mb-6">
                          <div>
                             <p className="text-2xl font-serif text-[#0C1C2E] mb-1">{listing.price}</p>
                             <p className="text-[10px] uppercase tracking-widest text-gray-400">{listing.ppsf} / SqFt</p>
                          </div>
                       </div>

                       <h4 className="text-sm font-bold uppercase tracking-[0.15em] text-gray-800 mb-6 truncate">{listing.address}</h4>

                       <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500 border-t border-gray-100 pt-6">
                          <span className="flex items-center gap-2"><BedDouble size={14} className="text-[#Bfa67a]"/> {listing.beds}</span>
                          <span className="flex items-center gap-2"><ShowerHead size={14} className="text-[#Bfa67a]"/> {listing.baths}</span>
                          <span className="flex items-center gap-2"><Maximize2 size={14} className="text-[#Bfa67a]"/> {listing.sqft}</span>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default NeighborhoodProfile2;
