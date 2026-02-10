import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  TrendingUp,
  Globe,
  BedDouble,
  Bath,
  Maximize,
  Mountain,
  Palmtree,
  Building2,
  ChevronDown
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import SEOHead from '../components/shared/SEOHead';
import AnimatedCounter from '../components/shared/AnimatedCounter';
import { FEATURED_LISTINGS, LIFESTYLE_COLLECTIONS } from '../data/homePage';

const ICON_MAP: Record<string, React.FC<{ size?: number }>> = { Mountain, Palmtree, Building2 };

const HomePage: React.FC = () => {
  const [searchTab, setSearchTab] = useState<'buy' | 'sell' | 'rent'>('buy');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans selection:bg-[#0C1C2E] selection:text-white page-zoom-85">
      <SEOHead
        title="Yong Choi | Scottsdale Luxury Real Estate | Sotheby's"
        description="Discover extraordinary properties in the most coveted addresses of the Phoenix Metro. $1.2B in career sales."
      />

      {/* Navigation */}
      <Navigation variant="transparent" />

      {/* Hero Section */}
      <header className="relative h-screen w-full overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2400"
            className="w-full h-full object-cover"
            alt="Hero Estate"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4 pt-20">

          {/* Main Heading with Staggered Animation */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-6 leading-tight tracking-tight">
            <span className="block opacity-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              The Art of
            </span>
            <span className="block italic font-light opacity-0 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              Desert Living
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/70 text-lg md:text-xl font-light max-w-xl mb-12 opacity-0 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            Discover extraordinary properties in the most coveted addresses of the Phoenix Metro
          </p>

          {/* Search Bar - Minimal */}
          <div className="w-full max-w-2xl opacity-0 animate-slide-up" style={{ animationDelay: '0.8s' }}>
            <div className="relative mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchTab === 'buy' ? "Try: 5 bedrooms in Desert Mountain, or just search an address..." :
                  searchTab === 'sell' ? "Enter your property address" :
                  "Search luxury rentals..."
                }
                className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 py-5 pl-6 pr-14 text-base font-light outline-none border-b border-white/30 focus:border-[#Bfa67a] transition-colors"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-[#Bfa67a] transition-colors">
                <ArrowRight size={20} />
              </button>
            </div>

            {/* Tabs - Enhanced */}
            <div className="flex justify-center gap-8">
              {[
                { id: 'buy', label: 'Buy' },
                { id: 'sell', label: 'Sell' },
                { id: 'rent', label: 'Rent' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSearchTab(tab.id as 'buy' | 'sell' | 'rent')}
                  className={`relative text-[11px] uppercase tracking-[0.25em] font-bold py-2 transition-all duration-500 ${
                    searchTab === tab.id
                      ? 'text-white'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {tab.label}
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-[#Bfa67a] transition-all duration-500 ${
                    searchTab === tab.id ? 'w-full' : 'w-0'
                  }`}></span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex gap-6 mt-12 opacity-0 animate-fade-in" style={{ animationDelay: '1s' }}>
            <Link to="/map" className="group flex items-center gap-2 text-white/60 hover:text-white text-[10px] uppercase tracking-[0.2em] transition-all">
              <span className="w-8 h-px bg-white/30 group-hover:w-12 group-hover:bg-[#Bfa67a] transition-all"></span>
              Explore Map
            </Link>
            <Link to="/communities" className="group flex items-center gap-2 text-white/60 hover:text-white text-[10px] uppercase tracking-[0.2em] transition-all">
              <span className="w-8 h-px bg-white/30 group-hover:w-12 group-hover:bg-[#Bfa67a] transition-all"></span>
              Communities
            </Link>
          </div>
        </div>

        {/* Scroll Indicator - Animated */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-white/50 opacity-0 animate-fade-in" style={{ animationDelay: '1.2s' }}>
          <span className="text-[9px] uppercase tracking-[0.3em]">Scroll to Explore</span>
          <div className="relative">
            <div className="w-px h-16 bg-gradient-to-b from-white/50 to-transparent"></div>
            <ChevronDown size={16} className="absolute -bottom-2 left-1/2 -translate-x-1/2 animate-bounce" />
          </div>
        </div>

      </header>

      {/* Social Proof Strip - Animated Counters */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-8 lg:px-24 flex flex-wrap justify-around gap-8 text-[#0C1C2E]">
          <div className="text-center group cursor-default">
            <p className="text-3xl lg:text-4xl font-serif text-[#Bfa67a] mb-2 transition-transform group-hover:scale-110">
              $<AnimatedCounter value={1.2} suffix="B+" duration={2500} />
            </p>
            <p className="text-[9px] uppercase tracking-widest text-gray-400">Career Sales</p>
          </div>
          <div className="text-center hidden sm:flex items-center">
            <div className="h-12 w-px bg-gray-200"></div>
          </div>
          <div className="text-center group cursor-default">
            <p className="text-3xl lg:text-4xl font-serif text-[#Bfa67a] mb-2 transition-transform group-hover:scale-110">
              #<AnimatedCounter value={1} duration={1500} />
            </p>
            <p className="text-[9px] uppercase tracking-widest text-gray-400">Team in N. Scottsdale</p>
          </div>
          <div className="text-center hidden sm:flex items-center">
            <div className="h-12 w-px bg-gray-200"></div>
          </div>
          <div className="text-center group cursor-default">
            <p className="text-3xl lg:text-4xl font-serif text-[#Bfa67a] mb-2 transition-transform group-hover:scale-110">
              <AnimatedCounter value={98} suffix="%" duration={2000} />
            </p>
            <p className="text-[9px] uppercase tracking-widest text-gray-400">List-to-Sale Ratio</p>
          </div>
          <div className="text-center hidden sm:flex items-center">
            <div className="h-12 w-px bg-gray-200"></div>
          </div>
          <div className="text-center group cursor-default">
            <p className="text-3xl lg:text-4xl font-serif text-[#Bfa67a] mb-2 transition-transform group-hover:scale-110">
              <AnimatedCounter value={34} suffix="+" duration={2000} />
            </p>
            <p className="text-[9px] uppercase tracking-widest text-gray-400">Years Experience</p>
          </div>
        </div>
      </section>

      {/* Agent Profile Section */}
      <section className="bg-[#0C1C2E] text-white py-20 lg:py-24 overflow-hidden relative">
         <div className="max-w-[1400px] mx-auto px-8 lg:px-24 relative z-10">
            <div className="grid grid-cols-12 gap-8 lg:gap-16 items-center">

               {/* Left: Content */}
               <div className="col-span-12 lg:col-span-7 order-2 lg:order-1">
                  <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold block mb-6">Your Trusted Advisor</span>

                  <h2 className="text-3xl lg:text-4xl font-serif mb-6 leading-snug">
                     In luxury real estate, the difference between a transaction and a legacy is the advisor you choose.
                  </h2>

                  <div className="h-px w-16 bg-[#Bfa67a] mb-6"></div>

                  <p className="text-gray-400 text-sm leading-relaxed mb-6 font-light max-w-xl">
                     With $1.2 billion in career sales and 34 years navigating Arizona's most prestigious markets, Yong Choi has built a practice on one principle: your goals define the strategy. From discrete off-market acquisitions to record-setting sales, every transaction is handled with the precision and confidentiality you expect.
                  </p>

                  <div className="flex flex-wrap gap-x-8 gap-y-4 mb-8 text-sm">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#Bfa67a] rounded-full"></div>
                        <span className="text-gray-300">Off-Market Access</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#Bfa67a] rounded-full"></div>
                        <span className="text-gray-300">Confidential Transactions</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#Bfa67a] rounded-full"></div>
                        <span className="text-gray-300">Global Buyer Network</span>
                     </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                     <button className="group bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center justify-center gap-2">
                        Schedule Consultation
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                     </button>
                     <button className="border border-white/30 text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all">
                        View Track Record
                     </button>
                  </div>
               </div>

               {/* Right: Image */}
               <div className="col-span-12 lg:col-span-5 order-1 lg:order-2">
                  <div className="relative max-w-[320px] mx-auto lg:mx-0 lg:ml-auto">
                     {/* Decorative frame */}
                     <div className="absolute -top-3 -left-3 w-full h-full border border-[#Bfa67a]/40"></div>

                     {/* Image container */}
                     <div className="relative aspect-[3/4] overflow-hidden bg-gray-800">
                        <img
                          src="/images/yong-choi.jpg"
                          className="w-full h-full object-cover"
                          alt="Yong Choi"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E]/30 to-transparent"></div>
                     </div>

                     {/* Name card */}
                     <div className="absolute -bottom-4 -right-4 bg-white text-[#0C1C2E] px-5 py-3 shadow-xl">
                        <p className="font-serif text-lg">Yong Choi</p>
                        <p className="text-[9px] uppercase tracking-widest text-gray-500">Global Real Estate Advisor</p>
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </section>

      {/* Featured Properties */}
      <section className="pt-32 pb-12 bg-white">
        <div className="max-w-[1800px] mx-auto px-8 lg:px-24">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-4">Curated Collection</span>
              <h2 className="text-4xl lg:text-5xl font-serif text-[#0C1C2E]">Featured Estates</h2>
            </div>
            <Link to="/properties" className="hidden sm:flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-bold text-[#0C1C2E] border border-[#0C1C2E]/20 px-6 py-3 hover:bg-[#0C1C2E] hover:text-white transition-all group">
              View All Properties <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
            {FEATURED_LISTINGS.map((item, index) => (
              <div
                key={item.id}
                className="group cursor-pointer opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="aspect-[4/5] overflow-hidden relative mb-8 border border-gray-100 shadow-sm">
                  <div className="absolute inset-0 bg-gray-100 z-0"></div>
                  <img
                    src={item.img}
                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 z-10 relative"
                    alt={item.address}
                  />
                  <div className="absolute inset-0 bg-[#0C1C2E]/0 group-hover:bg-[#0C1C2E]/20 transition-colors duration-500 z-20"></div>

                  {/* Price Tag */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-4 py-2 z-30">
                    <span className="font-serif text-[#0C1C2E] text-lg">{item.price}</span>
                  </div>

                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-30">
                    <button className="bg-white text-[#0C1C2E] px-6 py-3 text-[9px] uppercase tracking-[0.2em] font-bold shadow-xl hover:bg-[#Bfa67a] hover:text-white transition-colors">
                      View Residence
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">{item.area}</p>
                  <h3 className="text-2xl font-serif text-[#0C1C2E] mb-2 group-hover:text-[#Bfa67a] transition-colors">{item.address}</h3>

                  <div className="h-px w-8 bg-[#0C1C2E]/20 mx-auto my-4 group-hover:w-16 group-hover:bg-[#Bfa67a] transition-all duration-500"></div>

                  <div className="flex justify-center items-center gap-6 text-xs text-[#0C1C2E]">
                    <span className="flex items-center gap-1"><BedDouble size={12} className="text-gray-400"/> {item.specs.beds} Beds</span>
                    <span className="flex items-center gap-1"><Bath size={12} className="text-gray-400"/> {item.specs.baths} Baths</span>
                    <span className="flex items-center gap-1"><Maximize size={12} className="text-gray-400"/> {item.specs.sqft} SF</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link to="/properties" className="sm:hidden w-full mt-12 border border-[#0C1C2E] py-4 text-[10px] uppercase tracking-[0.2em] font-bold flex items-center justify-center">
            View All Properties
          </Link>
        </div>
      </section>

      {/* Area Expertise */}
      <section className="bg-white pt-24 pb-40 border-t border-gray-100">
        <div className="max-w-[1800px] mx-auto px-8 lg:px-24">
           <div className="text-center mb-24">
             <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-4">Area Expertise</span>
             <h2 className="text-4xl lg:text-5xl font-serif text-[#0C1C2E]">Curated Lifestyles</h2>
           </div>

           <div className="space-y-32">
              {LIFESTYLE_COLLECTIONS.map((collection, idx) => (
                 <div key={collection.id} className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

                    <div className={`lg:col-span-3 ${idx % 2 === 1 ? 'lg:order-2 lg:text-right' : ''}`}>
                       <div className={`flex items-center gap-3 mb-4 text-[#0C1C2E] ${idx % 2 === 1 ? 'lg:justify-end' : ''}`}>
                          {(() => { const Icon = ICON_MAP[collection.iconName]; return Icon ? <Icon size={20} /> : null; })()}
                          <h3 className="text-2xl font-serif">{collection.title}</h3>
                       </div>
                       <p className="text-sm text-gray-500 leading-relaxed font-light mb-8 max-w-xs ml-0 mr-auto lg:mx-0">
                          {collection.description}
                       </p>
                       <button className="group text-[9px] uppercase tracking-[0.2em] font-bold text-[#Bfa67a] hover:text-[#0C1C2E] transition-colors flex items-center gap-2">
                          View All {collection.title} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform"/>
                       </button>
                    </div>

                    <div className={`lg:col-span-9 ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {collection.enclaves.map((enclave, i) => (
                             <Link key={i} to={enclave.link} className="group cursor-pointer">
                                <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-4 relative">
                                   <img
                                     src={enclave.img}
                                     className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-out transform group-hover:scale-105"
                                     alt={enclave.name}
                                   />
                                   <div className="absolute inset-0 bg-[#0C1C2E]/0 group-hover:bg-[#0C1C2E]/10 transition-colors"></div>
                                   <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                     <span className="text-white text-[10px] uppercase tracking-widest">Explore</span>
                                   </div>
                                </div>
                                <div className="text-center">
                                   <h4 className="text-sm font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">{enclave.name}</h4>
                                   <div className="h-px w-0 bg-[#Bfa67a] mx-auto mt-2 group-hover:w-8 transition-all duration-500"></div>
                                </div>
                             </Link>
                          ))}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* Marketing & Intel Split */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[500px]">
        <Link to="/marketing" className="relative group overflow-hidden cursor-pointer flex items-center justify-center bg-[#F5F5F0]">
          <div className="absolute inset-0 bg-[#0C1C2E] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
          <div className="text-center p-12 z-10 relative">
            <Globe size={40} className="mb-6 mx-auto opacity-50 group-hover:opacity-100 transition-all group-hover:scale-110 text-[#0C1C2E] group-hover:text-white" />
            <h3 className="text-2xl font-serif mb-4 text-[#0C1C2E] group-hover:text-white transition-colors">Strategic Marketing</h3>
            <p className="text-sm max-w-xs mx-auto mb-8 text-gray-500 group-hover:text-gray-300 transition-colors">
              We leverage the Sotheby's global network to put your property in front of the world's most qualified buyers.
            </p>
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold border-b pb-1 text-[#0C1C2E] group-hover:text-white border-[#0C1C2E] group-hover:border-[#Bfa67a] transition-colors">Learn More</span>
          </div>
        </Link>

        <Link to="/market-report" className="relative group overflow-hidden cursor-pointer flex items-center justify-center bg-[#0C1C2E] text-white">
          <div className="absolute inset-0 bg-[#Bfa67a] transform translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
          <div className="text-center p-12 z-10 relative">
            <TrendingUp size={40} className="text-[#Bfa67a] group-hover:text-[#0C1C2E] mb-6 mx-auto opacity-50 group-hover:opacity-100 transition-all group-hover:scale-110" />
            <h3 className="text-2xl font-serif mb-4 group-hover:text-[#0C1C2E] transition-colors">Market Intelligence</h3>
            <p className="text-gray-400 group-hover:text-[#0C1C2E]/70 text-sm max-w-xs mx-auto mb-8 transition-colors">
              Real-time data and deep-dive analysis on the Phoenix Metro's luxury sector. Empowering smarter decisions.
            </p>
            <span className="text-white group-hover:text-[#0C1C2E] text-[10px] uppercase tracking-[0.25em] font-bold border-b border-[#Bfa67a] group-hover:border-[#0C1C2E] pb-1 transition-colors">View Reports</span>
          </div>
        </Link>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
