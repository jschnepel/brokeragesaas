import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  Map,
  TrendingUp,
  Home,
  BarChart3,
  Bell,
  Clock,
  ArrowRight,
  Target,
  Building2,
  DollarSign,
  Calculator,
  FileText,
  Users,
  PieChart,
  Activity,
  Scale,
} from 'lucide-react';

interface NavigationProps {
  variant?: 'transparent' | 'solid';
}

const Navigation: React.FC<NavigationProps> = ({ variant = 'transparent' }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const location = useLocation();
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location]);

  // Determine if we should use dark or light text
  const isDark = variant === 'solid' || scrolled;

  const handleMouseEnter = (dropdown: string) => {
    if (dropdownTimeout.current) {
      clearTimeout(dropdownTimeout.current);
    }
    setActiveDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  // Region data for the mega menu
  const regions = [
    {
      name: 'North Scottsdale',
      href: '/phoenix/north-scottsdale',
      communities: ['Desert Mountain', 'Silverleaf', 'DC Ranch', 'Estancia', 'Whisper Rock', 'Troon North', 'Pinnacle Peak', 'Terravita', 'Legend Trail', 'Winfield'],
    },
    {
      name: 'Paradise Valley',
      href: '/phoenix/paradise-valley',
      communities: ['Paradise Valley Estates', 'Clearwater Hills', 'Mummy Mountain', 'Camelback Country Estates', 'Paradise Reserve', 'Cheney Estates'],
    },
    {
      name: 'Carefree & Cave Creek',
      href: '/phoenix/carefree-cave-creek',
      communities: ['Carefree', 'Cave Creek', 'The Boulders', 'Rancho Mañana', 'Black Mountain', 'Lone Mountain'],
    },
    {
      name: 'Central Scottsdale',
      href: '/phoenix/central-scottsdale',
      communities: ['Kierland', 'Old Town', 'Gainey Ranch', 'McCormick Ranch', 'Stonegate', 'Grayhawk'],
    },
    {
      name: 'South Scottsdale',
      href: '/phoenix/south-scottsdale',
      communities: ['Papago Park', 'Old Town South', 'Vista del Camino', 'Continental Golf'],
    },
    {
      name: 'Arcadia',
      href: '/phoenix/arcadia',
      communities: ['Arcadia Proper', 'Arcadia Lite', 'Arcadia Estates', 'Camelback Corridor'],
    },
    {
      name: 'Fountain Hills',
      href: '/phoenix/fountain-hills',
      communities: ['Fountain Hills', 'Eagle Mountain', 'FireRock', 'SunRidge Canyon', 'CopperWynd'],
    },
    {
      name: 'Rio Verde',
      href: '/phoenix/rio-verde',
      communities: ['Rio Verde', 'Rio Verde Foothills', 'Tonto Verde'],
    },
  ];

  return (
    <>
      {/* Main Navigation */}
      <nav
        className={`
          fixed top-0 w-full z-50 transition-all duration-500
          ${isDark
            ? 'bg-white/95 backdrop-blur-md py-4 border-b border-gray-100 shadow-sm'
            : 'bg-transparent py-6'
          }
        `}
      >
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8 flex justify-between items-center">
          {/* Logo & Agent Name */}
          <Link to="/" className="flex items-center gap-4 lg:gap-6 transition-opacity hover:opacity-80">
            <img
              src="/images/rlsir-logo.png"
              alt="Russ Lyon Sotheby's International Realty"
              className={`h-14 lg:h-16 object-contain transition-all duration-500 ${isDark ? 'brightness-0' : 'brightness-0 invert'}`}
            />
            <div className={`hidden md:block border-l ${isDark ? 'border-gray-300' : 'border-white/30'} pl-4 lg:pl-6`}>
              <span className={`text-xl lg:text-2xl font-serif tracking-wide ${isDark ? 'text-[#0C1C2E]' : 'text-white'}`}>
                Yong Choi
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className={`hidden lg:flex items-center gap-10 ${isDark ? 'text-[#0C1C2E]' : 'text-white'}`}>

            {/* Discover - Mega Menu Trigger */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('valley')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`flex items-center gap-1.5 text-[15px] tracking-wide hover:text-[#Bfa67a] transition-colors ${
                  activeDropdown === 'valley' ? 'text-[#Bfa67a]' : ''
                }`}
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Discover
                <ChevronDown size={14} className={`transition-transform opacity-60 ${activeDropdown === 'valley' ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega Menu */}
              {activeDropdown === 'valley' && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[800px] bg-white shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 z-[60]"
                  style={{ fontFamily: 'var(--font-sans)' }}
                  onMouseEnter={() => handleMouseEnter('valley')}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="grid grid-cols-12 gap-0">
                    {/* Map Preview - Left Side */}
                    <div className="col-span-5 bg-[#0C1C2E] p-6 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20">
                        <img
                          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800"
                          alt="Scottsdale"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <Map size={16} className="text-[#Bfa67a]" />
                          <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold">Interactive Map</span>
                        </div>
                        <h3 className="text-white text-xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>Explore the Valley</h3>
                        <p className="text-white/60 text-xs leading-relaxed mb-6">
                          Discover 35+ luxury communities across the Scottsdale corridor with our interactive map.
                        </p>
                        <Link
                          to="/map"
                          className="inline-flex items-center gap-2 bg-[#Bfa67a] text-white px-5 py-3 text-[9px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all group"
                        >
                          Enter the Map
                          <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>

                    {/* Right Side - Regions */}
                    <div className="col-span-7 p-6">
                      <span className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-bold mb-3 block">Explore by Region</span>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {regions.map((region) => (
                          <Link
                            key={region.name}
                            to={region.href}
                            className="group flex items-center justify-between py-2.5 border-b border-gray-100 hover:border-[#Bfa67a] transition-colors"
                          >
                            <span className="text-[#0C1C2E] text-[14px] group-hover:text-[#Bfa67a] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>
                              {region.name}
                            </span>
                            <ChevronRight size={14} className="text-gray-300 group-hover:text-[#Bfa67a] transition-colors" />
                          </Link>
                        ))}
                      </div>
                      <Link
                        to="/communities"
                        className="inline-flex items-center gap-1 text-[#Bfa67a] text-[10px] uppercase tracking-[0.2em] font-bold mt-4 hover:gap-2 transition-all"
                      >
                        View All Communities <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Collection - Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('properties')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`flex items-center gap-1.5 text-[15px] tracking-wide hover:text-[#Bfa67a] transition-colors ${
                  activeDropdown === 'properties' ? 'text-[#Bfa67a]' : ''
                }`}
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Collection
                <ChevronDown size={14} className={`transition-transform opacity-60 ${activeDropdown === 'properties' ? 'rotate-180' : ''}`} />
              </button>

              {/* Properties Dropdown */}
              {activeDropdown === 'properties' && (
                <div
                  className="absolute top-full left-0 mt-4 w-[240px] bg-white shadow-2xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[60]"
                  style={{ fontFamily: 'var(--font-sans)' }}
                  onMouseEnter={() => handleMouseEnter('properties')}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link to="/listings" className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                    <Home size={16} className="text-gray-400 group-hover:text-[#Bfa67a] transition-colors" />
                    <span className="text-[#0C1C2E] text-[14px] group-hover:text-[#Bfa67a] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>All Listings</span>
                  </Link>
                  <Link to="/listings?status=new" className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                    <Clock size={16} className="text-gray-400 group-hover:text-[#Bfa67a] transition-colors" />
                    <span className="text-[#0C1C2E] text-[14px] group-hover:text-[#Bfa67a] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>New to Market</span>
                  </Link>
                  <Link to="/listings?status=coming-soon" className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                    <Bell size={16} className="text-gray-400 group-hover:text-[#Bfa67a] transition-colors" />
                    <span className="text-[#0C1C2E] text-[14px] group-hover:text-[#Bfa67a] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>Coming Soon</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Insights - Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('insights')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`flex items-center gap-1.5 text-[15px] tracking-wide hover:text-[#Bfa67a] transition-colors ${
                  activeDropdown === 'insights' ? 'text-[#Bfa67a]' : ''
                }`}
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Insights
                <ChevronDown size={14} className={`transition-transform opacity-60 ${activeDropdown === 'insights' ? 'rotate-180' : ''}`} />
              </button>

              {/* Insights Mega Menu - Redesigned */}
              {activeDropdown === 'insights' && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[820px] bg-white shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 z-[60]"
                  style={{ fontFamily: 'var(--font-sans)' }}
                  onMouseEnter={() => handleMouseEnter('insights')}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="grid grid-cols-12 gap-0">
                    {/* Left Side - Market Dashboard CTA */}
                    <div className="col-span-4 bg-[#0C1C2E] p-6 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10">
                        <img
                          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"
                          alt="Market Data"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity size={16} className="text-[#Bfa67a]" />
                          <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold">Live Data</span>
                        </div>
                        <h3 className="text-white text-xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>Market Dashboard</h3>
                        <p className="text-white/60 text-xs leading-relaxed mb-6">
                          Real-time market pulse, key metrics, and trend analysis at a glance.
                        </p>
                        <Link
                          to="/insights"
                          className="inline-flex items-center gap-2 bg-[#Bfa67a] text-white px-5 py-3 text-[9px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all group"
                        >
                          View Dashboard
                          <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>

                    {/* Right Side - Categories */}
                    <div className="col-span-8 p-6">
                      <div className="grid grid-cols-2 gap-6">
                        {/* For Buyers */}
                        <div>
                          <span className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-bold mb-3 block flex items-center gap-2">
                            <Target size={12} className="text-[#Bfa67a]" />
                            For Buyers
                          </span>
                          <div className="space-y-1">
                            <Link
                              to="/insights/buyers"
                              className="flex items-center gap-3 p-2.5 hover:bg-[#Bfa67a]/10 transition-colors group rounded"
                            >
                              <FileText size={15} className="text-gray-400 group-hover:text-[#Bfa67a] transition-colors" />
                              <div>
                                <span className="text-[#0C1C2E] text-[13px] block group-hover:text-[#Bfa67a] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>Buyer's Guide</span>
                                <span className="text-[9px] text-gray-400">Market conditions & timing</span>
                              </div>
                            </Link>
                            <Link
                              to="/insights/buyers#affordability"
                              className="flex items-center gap-3 p-2.5 hover:bg-[#Bfa67a]/10 transition-colors group rounded"
                            >
                              <Calculator size={15} className="text-gray-400 group-hover:text-[#Bfa67a] transition-colors" />
                              <div>
                                <span className="text-[#0C1C2E] text-[13px] block group-hover:text-[#Bfa67a] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>Affordability Calculator</span>
                                <span className="text-[9px] text-gray-400">Estimate your buying power</span>
                              </div>
                            </Link>
                            <Link
                              to="/insights/buyers#mortgage"
                              className="flex items-center gap-3 p-2.5 hover:bg-[#Bfa67a]/10 transition-colors group rounded"
                            >
                              <PieChart size={15} className="text-gray-400 group-hover:text-[#Bfa67a] transition-colors" />
                              <div>
                                <span className="text-[#0C1C2E] text-[13px] block group-hover:text-[#Bfa67a] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>Mortgage Calculator</span>
                                <span className="text-[9px] text-gray-400">Monthly payment estimates</span>
                              </div>
                            </Link>
                          </div>
                        </div>

                        {/* For Sellers */}
                        <div>
                          <span className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-bold mb-3 block flex items-center gap-2">
                            <DollarSign size={12} className="text-[#Bfa67a]" />
                            For Sellers
                          </span>
                          <div className="space-y-1">
                            <Link
                              to="/insights/sellers"
                              className="flex items-center gap-3 p-2.5 hover:bg-[#Bfa67a]/10 transition-colors group rounded"
                            >
                              <FileText size={15} className="text-gray-400 group-hover:text-[#Bfa67a] transition-colors" />
                              <div>
                                <span className="text-[#0C1C2E] text-[13px] block group-hover:text-[#Bfa67a] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>Seller's Guide</span>
                                <span className="text-[9px] text-gray-400">Pricing & market strategy</span>
                              </div>
                            </Link>
                            <Link
                              to="/insights/sellers#valuation"
                              className="flex items-center gap-3 p-2.5 hover:bg-[#Bfa67a]/10 transition-colors group rounded"
                            >
                              <Home size={15} className="text-gray-400 group-hover:text-[#Bfa67a] transition-colors" />
                              <div>
                                <span className="text-[#0C1C2E] text-[13px] block group-hover:text-[#Bfa67a] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>Request Home Valuation</span>
                                <span className="text-[9px] text-gray-400">Get a professional CMA</span>
                              </div>
                            </Link>
                            <Link
                              to="/insights/sellers#proceeds"
                              className="flex items-center gap-3 p-2.5 hover:bg-[#Bfa67a]/10 transition-colors group rounded"
                            >
                              <Calculator size={15} className="text-gray-400 group-hover:text-[#Bfa67a] transition-colors" />
                              <div>
                                <span className="text-[#0C1C2E] text-[13px] block group-hover:text-[#Bfa67a] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>Net Proceeds Calculator</span>
                                <span className="text-[9px] text-gray-400">Estimate your take-home</span>
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Market Intelligence Row */}
                      <div className="mt-5 pt-5 border-t border-gray-100">
                        <span className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-bold mb-3 block flex items-center gap-2">
                          <BarChart3 size={12} className="text-[#Bfa67a]" />
                          Market Intelligence
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <Link
                            to="/market-report"
                            className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-[#Bfa67a]/10 transition-colors group rounded"
                          >
                            <Scale size={15} className="text-[#Bfa67a]" />
                            <span className="text-[#0C1C2E] text-[12px] group-hover:text-[#Bfa67a] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>Market Comparison</span>
                          </Link>
                          <Link
                            to="/insights#trends"
                            className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-[#Bfa67a]/10 transition-colors group rounded"
                          >
                            <TrendingUp size={15} className="text-[#Bfa67a]" />
                            <span className="text-[#0C1C2E] text-[12px] group-hover:text-[#Bfa67a] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>Price Trends</span>
                          </Link>
                          <Link
                            to="/insights#reports"
                            className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-[#Bfa67a]/10 transition-colors group rounded"
                          >
                            <FileText size={15} className="text-[#Bfa67a]" />
                            <span className="text-[#0C1C2E] text-[12px] group-hover:text-[#Bfa67a] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>Monthly Reports</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* The Advisor - Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('advisor')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`flex items-center gap-1.5 text-[15px] tracking-wide hover:text-[#Bfa67a] transition-colors ${
                  activeDropdown === 'advisor' ? 'text-[#Bfa67a]' : ''
                }`}
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                The Advisor
                <ChevronDown size={14} className={`transition-transform opacity-60 ${activeDropdown === 'advisor' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'advisor' && (
                <div
                  className="absolute top-full right-0 mt-4 w-[240px] bg-white shadow-2xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[60]"
                  style={{ fontFamily: 'var(--font-sans)' }}
                  onMouseEnter={() => handleMouseEnter('advisor')}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link to="/about" className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                    <Users size={16} className="text-gray-400 group-hover:text-[#Bfa67a] transition-colors" />
                    <span className="text-[#0C1C2E] text-[14px] group-hover:text-[#Bfa67a] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>About Yong</span>
                  </Link>
                  <Link to="/blog" className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                    <FileText size={16} className="text-gray-400 group-hover:text-[#Bfa67a] transition-colors" />
                    <span className="text-[#0C1C2E] text-[14px] group-hover:text-[#Bfa67a] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>Blog & Insights</span>
                  </Link>
                  <Link to="/contact" className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                    <Mail size={16} className="text-gray-400 group-hover:text-[#Bfa67a] transition-colors" />
                    <span className="text-[#0C1C2E] text-[14px] group-hover:text-[#Bfa67a] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>Contact</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className={`p-2 hover:text-[#Bfa67a] transition-colors ${isDark ? 'text-[#0C1C2E]' : 'text-white'}`}
            >
              <Search size={20} />
            </button>

            {/* Contact Button - Desktop */}
            <Link
              to="/contact"
              className="hidden sm:block bg-[#Bfa67a] text-white px-6 py-2.5 text-[10px] uppercase tracking-[0.25em] font-bold transition-all hover:bg-[#0C1C2E]"
            >
              Contact Yong
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`lg:hidden p-2 ${isDark ? 'text-[#0C1C2E]' : 'text-white'}`}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] bg-[#0C1C2E]/98 flex items-center justify-center animate-in fade-in duration-300">
          <button
            onClick={() => setSearchOpen(false)}
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
          >
            <X size={32} />
          </button>

          <div className="w-full max-w-2xl px-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search properties, communities, or addresses..."
                autoFocus
                className="w-full bg-transparent border-b-2 border-white/30 text-white text-2xl lg:text-3xl font-serif placeholder-white/40 py-4 pr-12 outline-none focus:border-[#Bfa67a] transition-colors"
              />
              <Search size={28} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40" />
            </div>

            <div className="mt-12">
              <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold mb-4">Popular Searches</p>
              <div className="flex flex-wrap gap-3">
                {['Desert Mountain', 'Paradise Valley', 'Silverleaf', 'DC Ranch', '$5M+', 'Golf Communities'].map((tag) => (
                  <Link
                    key={tag}
                    to={`/listings?q=${encodeURIComponent(tag)}`}
                    onClick={() => setSearchOpen(false)}
                    className="px-4 py-2 border border-white/20 text-white/60 text-sm hover:bg-white hover:text-[#0C1C2E] transition-all"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-[#0C1C2E] lg:hidden animate-in slide-in-from-right duration-300 overflow-y-auto">
          {/* Mobile Menu Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img
                src="/images/rlsir-logo.png"
                alt="Russ Lyon Sotheby's International Realty"
                className="h-10 object-contain brightness-0 invert"
              />
              <div className="border-l border-white/30 pl-3">
                <span className="text-lg font-serif text-white">Yong Choi</span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-white p-2"
            >
              <X size={28} />
            </button>
          </div>

          {/* Mobile Menu Links */}
          <div className="p-6">
            <nav className="space-y-1">
              {/* Discover - Expandable */}
              <div>
                <button
                  onClick={() => setMobileSubmenu(mobileSubmenu === 'valley' ? null : 'valley')}
                  className="flex items-center justify-between w-full py-4 border-b border-white/10 text-lg font-serif text-white hover:text-[#Bfa67a] transition-colors"
                >
                  Discover
                  <ChevronDown size={20} className={`opacity-40 transition-transform ${mobileSubmenu === 'valley' ? 'rotate-180' : ''}`} />
                </button>
                {mobileSubmenu === 'valley' && (
                  <div className="pl-4 py-2 space-y-1 bg-white/5">
                    <Link to="/map" className="flex items-center gap-3 py-3 text-[#Bfa67a] font-medium">
                      <Map size={16} />
                      Interactive Map
                    </Link>
                    <div className="py-2">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold">Explore by Region</span>
                    </div>
                    {regions.map((region) => (
                      <Link
                        key={region.name}
                        to={region.href}
                        className="flex items-center justify-between py-2 text-white/80 hover:text-[#Bfa67a] transition-colors"
                      >
                        {region.name}
                        <ChevronRight size={14} className="text-gray-500" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Collection - Expandable */}
              <div>
                <button
                  onClick={() => setMobileSubmenu(mobileSubmenu === 'properties' ? null : 'properties')}
                  className="flex items-center justify-between w-full py-4 border-b border-white/10 text-lg font-serif text-white hover:text-[#Bfa67a] transition-colors"
                >
                  Collection
                  <ChevronDown size={20} className={`opacity-40 transition-transform ${mobileSubmenu === 'properties' ? 'rotate-180' : ''}`} />
                </button>
                {mobileSubmenu === 'properties' && (
                  <div className="pl-4 py-2 space-y-1 bg-white/5">
                    <Link to="/listings" className="flex items-center gap-3 py-3 text-white/80 hover:text-[#Bfa67a] transition-colors">
                      <Home size={16} className="text-gray-500" />
                      All Listings
                    </Link>
                    <Link to="/listings?status=new" className="flex items-center gap-3 py-3 text-white/80 hover:text-[#Bfa67a] transition-colors">
                      <Clock size={16} className="text-gray-500" />
                      New to Market
                    </Link>
                    <Link to="/listings?status=coming-soon" className="flex items-center gap-3 py-3 text-white/80 hover:text-[#Bfa67a] transition-colors">
                      <Bell size={16} className="text-gray-500" />
                      Coming Soon
                    </Link>
                  </div>
                )}
              </div>

              {/* Insights */}
              <div>
                <button
                  onClick={() => setMobileSubmenu(mobileSubmenu === 'insights' ? null : 'insights')}
                  className="w-full flex items-center justify-between py-4 border-b border-white/10 text-lg font-serif text-white hover:text-[#Bfa67a] transition-colors"
                >
                  Insights
                  <ChevronDown size={20} className={`opacity-40 transition-transform ${mobileSubmenu === 'insights' ? 'rotate-180' : ''}`} />
                </button>
                {mobileSubmenu === 'insights' && (
                  <div className="pl-4 py-2 space-y-1 border-b border-white/10">
                    <Link to="/insights" className="flex items-center gap-3 py-3 text-[#Bfa67a] font-medium">
                      <Activity size={16} />
                      Market Dashboard
                    </Link>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold pt-2 block">For Buyers</span>
                    <Link to="/insights/buyers" className="flex items-center gap-3 py-3 text-white/80 hover:text-[#Bfa67a] transition-colors">
                      <FileText size={16} className="text-gray-500" />
                      Buyer's Guide
                    </Link>
                    <Link to="/insights/buyers#affordability" className="flex items-center gap-3 py-3 text-white/80 hover:text-[#Bfa67a] transition-colors">
                      <Calculator size={16} className="text-gray-500" />
                      Affordability Calculator
                    </Link>
                    <Link to="/insights/buyers#mortgage" className="flex items-center gap-3 py-3 text-white/80 hover:text-[#Bfa67a] transition-colors">
                      <PieChart size={16} className="text-gray-500" />
                      Mortgage Calculator
                    </Link>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold pt-2 block">For Sellers</span>
                    <Link to="/insights/sellers" className="flex items-center gap-3 py-3 text-white/80 hover:text-[#Bfa67a] transition-colors">
                      <FileText size={16} className="text-gray-500" />
                      Seller's Guide
                    </Link>
                    <Link to="/insights/sellers#valuation" className="flex items-center gap-3 py-3 text-white/80 hover:text-[#Bfa67a] transition-colors">
                      <Home size={16} className="text-gray-500" />
                      Request Home Valuation
                    </Link>
                    <Link to="/insights/sellers#proceeds" className="flex items-center gap-3 py-3 text-white/80 hover:text-[#Bfa67a] transition-colors">
                      <Calculator size={16} className="text-gray-500" />
                      Net Proceeds Calculator
                    </Link>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold pt-2 block">Market Intelligence</span>
                    <Link to="/market-report" className="flex items-center gap-3 py-3 text-white/80 hover:text-[#Bfa67a] transition-colors">
                      <Scale size={16} className="text-gray-500" />
                      Market Comparison Tool
                    </Link>
                    <Link to="/insights#trends" className="flex items-center gap-3 py-3 text-white/80 hover:text-[#Bfa67a] transition-colors">
                      <TrendingUp size={16} className="text-gray-500" />
                      Price Trends
                    </Link>
                  </div>
                )}
              </div>

              {/* The Advisor - Expandable */}
              <div>
                <button
                  onClick={() => setMobileSubmenu(mobileSubmenu === 'advisor' ? null : 'advisor')}
                  className="flex items-center justify-between w-full py-4 border-b border-white/10 text-lg font-serif text-white hover:text-[#Bfa67a] transition-colors"
                >
                  The Advisor
                  <ChevronDown size={20} className={`opacity-40 transition-transform ${mobileSubmenu === 'advisor' ? 'rotate-180' : ''}`} />
                </button>
                {mobileSubmenu === 'advisor' && (
                  <div className="pl-4 py-2 space-y-1 bg-white/5">
                    <Link to="/about" className="flex items-center gap-3 py-3 text-white/80 hover:text-[#Bfa67a] transition-colors">
                      <Users size={16} className="text-gray-500" />
                      About Yong
                    </Link>
                    <Link to="/blog" className="flex items-center gap-3 py-3 text-white/80 hover:text-[#Bfa67a] transition-colors">
                      <FileText size={16} className="text-gray-500" />
                      Blog & Insights
                    </Link>
                    <Link to="/contact" className="flex items-center gap-3 py-3 text-white/80 hover:text-[#Bfa67a] transition-colors">
                      <Mail size={16} className="text-gray-500" />
                      Contact
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            {/* Mobile Contact Info */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold mb-6">Contact Yong Choi</p>
              <div className="space-y-4 text-white/60 text-sm">
                <a href="tel:+19093765494" className="flex items-center gap-3 hover:text-white transition-colors">
                  <Phone size={16} />
                  (909) 376-5494
                </a>
                <a href="mailto:yong.choi@russlyon.com" className="flex items-center gap-3 hover:text-white transition-colors">
                  <Mail size={16} />
                  yong.choi@russlyon.com
                </a>
                <p className="flex items-center gap-3">
                  <MapPin size={16} />
                  North Scottsdale, AZ
                </p>
              </div>
            </div>

            {/* Mobile CTA */}
            <Link
              to="/contact"
              className="block w-full mt-8 bg-[#Bfa67a] text-white py-4 text-[11px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all text-center"
            >
              Schedule Consultation
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
