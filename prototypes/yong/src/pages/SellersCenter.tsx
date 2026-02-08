import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  DollarSign,
  Percent,
  ArrowRight,
  Home,
  FileText,
  Check,
  Send,
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  Phone,
  Mail,
  User,
  Info,
  TrendingUp,
  Clock,
  Target,
  Sparkles,
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const SellersCenter: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState<'netproceeds' | 'valuation'>('netproceeds');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Net Proceeds Calculator State
  const [salePrice, setSalePrice] = useState<number>(1500000);
  const [mortgageBalance, setMortgageBalance] = useState<number>(600000);
  const [commissionRate, setCommissionRate] = useState<number>(5);
  const [closingCostRate, setClosingCostRate] = useState<number>(1.5);
  const [repairs, setRepairs] = useState<number>(5000);
  const [otherCosts, setOtherCosts] = useState<number>(0);

  // CMA Request Form State
  const [cmaForm, setCmaForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipcode: '',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    yearBuilt: '',
    condition: 'good',
    recentUpdates: '',
    timeframe: '3-6months',
    notes: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Calculate Net Proceeds
  const calculateNetProceeds = () => {
    const commission = salePrice * (commissionRate / 100);
    const closingCosts = salePrice * (closingCostRate / 100);
    const totalCosts = commission + closingCosts + repairs + otherCosts + mortgageBalance;
    const netProceeds = salePrice - totalCosts;

    return {
      commission,
      closingCosts,
      totalCosts,
      netProceeds,
      grossEquity: salePrice - mortgageBalance,
    };
  };

  const proceeds = calculateNetProceeds();

  const handleCmaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would submit to an API
    console.log('CMA Form submitted:', cmaForm);
    setFormSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans">
      <Navigation variant="transparent" />

      {/* Hero Section - Immersive with Parallax */}
      <section className="relative h-[50vh] min-h-[400px] w-full overflow-hidden flex items-end">
        <div
          className="absolute inset-0 w-full h-[110%]"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        >
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2000"
            alt="Seller's Center"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E]/90 via-[#0C1C2E]/40 to-[#0C1C2E]/20" />

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 lg:px-20 pb-12">
          <div className="text-white">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold mb-4">
              <Link to="/" className="text-white/40 hover:text-white transition-colors">Home</Link>
              <span className="text-white/20">/</span>
              <Link to="/insights" className="text-white/40 hover:text-white transition-colors">Insights</Link>
              <span className="text-white/20">/</span>
              <span className="text-[#Bfa67a]">Seller's Center</span>
            </nav>

            <div className="flex items-center gap-3 mb-4">
              <DollarSign size={20} className="text-[#Bfa67a]" />
              <span className="text-[#Bfa67a] text-[11px] uppercase tracking-[0.4em] font-bold">Tools for Sellers</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif leading-[0.95] tracking-tight mb-6">
              Seller's<br /><span className="italic font-light">Center</span>
            </h1>
            <p className="text-xl text-white/70 font-light italic max-w-lg">
              Calculate your net proceeds, request a professional valuation, and prepare for success.
            </p>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('netproceeds')}
              className={`py-4 border-b-2 transition-all text-sm font-medium ${
                activeTab === 'netproceeds'
                  ? 'border-[#Bfa67a] text-[#0C1C2E]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <Calculator size={16} />
                Net Proceeds Calculator
              </span>
            </button>
            <button
              onClick={() => setActiveTab('valuation')}
              className={`py-4 border-b-2 transition-all text-sm font-medium ${
                activeTab === 'valuation'
                  ? 'border-[#Bfa67a] text-[#0C1C2E]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <Home size={16} />
                Request Home Valuation
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Net Proceeds Calculator */}
      {activeTab === 'netproceeds' && (
        <section className="py-12">
          <div className="max-w-[1400px] mx-auto px-8">
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Input Form */}
              <div className="lg:col-span-3 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#Bfa67a]/10 flex items-center justify-center">
                    <Calculator size={20} className="text-[#Bfa67a]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif text-[#0C1C2E]">Net Proceeds Calculator</h2>
                    <p className="text-gray-400 text-sm">Estimate how much you'll walk away with after selling</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Sale Price */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Expected Sale Price
                    </label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        value={salePrice}
                        onChange={(e) => setSalePrice(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Your expected or listing price</p>
                  </div>

                  {/* Mortgage Balance */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Remaining Mortgage
                    </label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        value={mortgageBalance}
                        onChange={(e) => setMortgageBalance(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Current loan payoff amount</p>
                  </div>

                  {/* Commission Rate */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Agent Commission (%)
                    </label>
                    <div className="relative">
                      <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        step="0.25"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Total commission (buyer + seller agents)</p>
                  </div>

                  {/* Closing Costs */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Closing Costs (%)
                    </label>
                    <div className="relative">
                      <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        step="0.25"
                        value={closingCostRate}
                        onChange={(e) => setClosingCostRate(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Title, escrow, transfer taxes, etc.</p>
                  </div>

                  {/* Repairs/Credits */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Repairs / Seller Credits
                    </label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        value={repairs}
                        onChange={(e) => setRepairs(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Pre-sale repairs or buyer credits</p>
                  </div>

                  {/* Other Costs */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Other Costs
                    </label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        value={otherCosts}
                        onChange={(e) => setOtherCosts(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Moving, staging, home warranty, etc.</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-[#F9F8F6] border-l-4 border-[#Bfa67a]">
                  <div className="flex items-start gap-3">
                    <Info size={18} className="text-[#Bfa67a] mt-0.5" />
                    <p className="text-sm text-gray-600">
                      This is an estimate based on the values you provide. Actual proceeds will depend on final sale price,
                      negotiated terms, and specific closing costs. Request a CMA for a professional market analysis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Results Panel */}
              <div className="lg:col-span-2">
                <div className="bg-[#0C1C2E] p-8 text-white sticky top-[70px]">
                  <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold mb-4 block">
                    Estimated Net Proceeds
                  </span>
                  <h3 className={`text-4xl font-serif mb-2 ${proceeds.netProceeds >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(proceeds.netProceeds)}
                  </h3>
                  <p className="text-white/60 text-sm mb-8">Amount you'll receive at closing</p>

                  {/* Cost Breakdown */}
                  <div className="mb-8">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3 block">
                      Cost Breakdown
                    </span>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-white/60 text-sm">Sale Price</span>
                        <span className="font-medium text-emerald-400">+{formatCurrency(salePrice)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-white/60 text-sm">Mortgage Payoff</span>
                        <span className="font-medium text-rose-400">-{formatCurrency(mortgageBalance)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-white/60 text-sm">Commission ({commissionRate}%)</span>
                        <span className="font-medium text-rose-400">-{formatCurrency(proceeds.commission)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-white/60 text-sm">Closing Costs ({closingCostRate}%)</span>
                        <span className="font-medium text-rose-400">-{formatCurrency(proceeds.closingCosts)}</span>
                      </div>
                      {repairs > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                          <span className="text-white/60 text-sm">Repairs / Credits</span>
                          <span className="font-medium text-rose-400">-{formatCurrency(repairs)}</span>
                        </div>
                      )}
                      {otherCosts > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                          <span className="text-white/60 text-sm">Other Costs</span>
                          <span className="font-medium text-rose-400">-{formatCurrency(otherCosts)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 mb-8">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Gross Equity</span>
                      <span className="font-medium">{formatCurrency(proceeds.grossEquity)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('valuation')}
                    className="w-full bg-[#Bfa67a] text-white py-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all"
                  >
                    Get Professional Valuation <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Request Home Valuation (CMA) */}
      {activeTab === 'valuation' && (
        <section className="py-12">
          <div className="max-w-[1400px] mx-auto px-8">
            {!formSubmitted ? (
              <div className="grid lg:grid-cols-5 gap-8">
                {/* CMA Request Form */}
                <div className="lg:col-span-3 bg-white p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#Bfa67a]/10 flex items-center justify-center">
                      <Home size={20} className="text-[#Bfa67a]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-serif text-[#0C1C2E]">Request a Home Valuation</h2>
                      <p className="text-gray-400 text-sm">Get a professional Comparative Market Analysis (CMA)</p>
                    </div>
                  </div>

                  <form onSubmit={handleCmaSubmit}>
                    {/* Contact Information */}
                    <div className="mb-8">
                      <h3 className="text-[10px] uppercase tracking-widest text-[#Bfa67a] font-bold mb-4">
                        Contact Information
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                            Full Name *
                          </label>
                          <div className="relative">
                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              required
                              value={cmaForm.name}
                              onChange={(e) => setCmaForm({ ...cmaForm, name: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                              placeholder="John Smith"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                            Email *
                          </label>
                          <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="email"
                              required
                              value={cmaForm.email}
                              onChange={(e) => setCmaForm({ ...cmaForm, email: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                              placeholder="john@example.com"
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                            Phone
                          </label>
                          <div className="relative">
                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="tel"
                              value={cmaForm.phone}
                              onChange={(e) => setCmaForm({ ...cmaForm, phone: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                              placeholder="(555) 123-4567"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Property Information */}
                    <div className="mb-8">
                      <h3 className="text-[10px] uppercase tracking-widest text-[#Bfa67a] font-bold mb-4">
                        Property Information
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                            Property Address *
                          </label>
                          <div className="relative">
                            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              required
                              value={cmaForm.address}
                              onChange={(e) => setCmaForm({ ...cmaForm, address: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                              placeholder="123 Main Street"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                            City *
                          </label>
                          <input
                            type="text"
                            required
                            value={cmaForm.city}
                            onChange={(e) => setCmaForm({ ...cmaForm, city: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                            placeholder="Scottsdale"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                            ZIP Code *
                          </label>
                          <input
                            type="text"
                            required
                            value={cmaForm.zipcode}
                            onChange={(e) => setCmaForm({ ...cmaForm, zipcode: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                            placeholder="85255"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                            Bedrooms
                          </label>
                          <div className="relative">
                            <Bed size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="number"
                              value={cmaForm.bedrooms}
                              onChange={(e) => setCmaForm({ ...cmaForm, bedrooms: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                              placeholder="4"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                            Bathrooms
                          </label>
                          <div className="relative">
                            <Bath size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="number"
                              step="0.5"
                              value={cmaForm.bathrooms}
                              onChange={(e) => setCmaForm({ ...cmaForm, bathrooms: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                              placeholder="3.5"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                            Square Feet
                          </label>
                          <div className="relative">
                            <Square size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="number"
                              value={cmaForm.squareFeet}
                              onChange={(e) => setCmaForm({ ...cmaForm, squareFeet: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                              placeholder="3500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                            Year Built
                          </label>
                          <div className="relative">
                            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="number"
                              value={cmaForm.yearBuilt}
                              onChange={(e) => setCmaForm({ ...cmaForm, yearBuilt: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                              placeholder="2015"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                            Property Condition
                          </label>
                          <select
                            value={cmaForm.condition}
                            onChange={(e) => setCmaForm({ ...cmaForm, condition: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors bg-white"
                          >
                            <option value="excellent">Excellent / Move-in Ready</option>
                            <option value="good">Good / Well Maintained</option>
                            <option value="fair">Fair / Some Updates Needed</option>
                            <option value="needs-work">Needs Significant Work</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                            Selling Timeframe
                          </label>
                          <select
                            value={cmaForm.timeframe}
                            onChange={(e) => setCmaForm({ ...cmaForm, timeframe: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors bg-white"
                          >
                            <option value="asap">ASAP</option>
                            <option value="1-3months">1-3 Months</option>
                            <option value="3-6months">3-6 Months</option>
                            <option value="6-12months">6-12 Months</option>
                            <option value="just-curious">Just Curious</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                            Recent Updates / Renovations
                          </label>
                          <textarea
                            value={cmaForm.recentUpdates}
                            onChange={(e) => setCmaForm({ ...cmaForm, recentUpdates: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors resize-none"
                            placeholder="New kitchen (2023), pool resurfaced, etc."
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                            Additional Notes
                          </label>
                          <textarea
                            value={cmaForm.notes}
                            onChange={(e) => setCmaForm({ ...cmaForm, notes: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors resize-none"
                            placeholder="Anything else you'd like us to know..."
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#0C1C2E] text-white py-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#Bfa67a] transition-all"
                    >
                      Request My Free Valuation <Send size={14} />
                    </button>
                  </form>
                </div>

                {/* Info Panel */}
                <div className="lg:col-span-2">
                  <div className="bg-[#0C1C2E] p-8 text-white sticky top-[70px]">
                    <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold mb-4 block">
                      What is a CMA?
                    </span>
                    <h3 className="text-2xl font-serif mb-4">
                      Comparative Market <span className="italic font-light">Analysis</span>
                    </h3>
                    <p className="text-white/60 text-sm mb-8">
                      A CMA is a professional evaluation of your home's market value based on recent comparable sales
                      in your area. Unlike automated estimates, a CMA considers your home's unique features and current
                      market conditions.
                    </p>

                    <div className="space-y-6 mb-8">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-[#Bfa67a]/20 flex items-center justify-center flex-shrink-0">
                          <TrendingUp size={18} className="text-[#Bfa67a]" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-1">Recent Comparable Sales</h4>
                          <p className="text-white/60 text-sm">Analysis of similar homes sold in your neighborhood</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-[#Bfa67a]/20 flex items-center justify-center flex-shrink-0">
                          <Target size={18} className="text-[#Bfa67a]" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-1">Accurate Pricing Strategy</h4>
                          <p className="text-white/60 text-sm">Price your home to sell quickly at maximum value</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-[#Bfa67a]/20 flex items-center justify-center flex-shrink-0">
                          <Sparkles size={18} className="text-[#Bfa67a]" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-1">Personalized Insights</h4>
                          <p className="text-white/60 text-sm">Tailored recommendations for your specific property</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock size={16} className="text-[#Bfa67a]" />
                        <span className="text-sm font-medium">Delivered Within 24-48 Hours</span>
                      </div>
                      <p className="text-white/60 text-xs">
                        You'll receive a comprehensive market analysis report directly from Yong Choi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Success State */
              <div className="max-w-[600px] mx-auto text-center py-16">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check size={40} className="text-emerald-600" />
                </div>
                <h2 className="text-3xl font-serif text-[#0C1C2E] mb-4">
                  Request <span className="italic font-light">Submitted!</span>
                </h2>
                <p className="text-gray-500 text-lg mb-8">
                  Thank you for your interest. Yong Choi will prepare your personalized Comparative Market Analysis
                  and contact you within 24-48 hours.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/insights"
                    className="bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#Bfa67a] transition-all inline-flex items-center justify-center gap-2"
                  >
                    Back to Insights <ArrowRight size={14} />
                  </Link>
                  <Link
                    to="/listings"
                    className="bg-transparent border border-[#0C1C2E] text-[#0C1C2E] px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#0C1C2E] hover:text-white transition-all inline-flex items-center justify-center gap-2"
                  >
                    Browse Listings <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Seller's Guide Section */}
      <section className="py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="text-center mb-12">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-2">
              Seller's Guide
            </span>
            <h2 className="text-3xl font-serif text-[#0C1C2E]">
              Steps to a <span className="italic font-light">Successful Sale</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Know Your Value',
                description: 'Get a professional CMA to understand your home\'s true market value.',
                icon: Target,
              },
              {
                step: '02',
                title: 'Prepare Your Home',
                description: 'Declutter, make repairs, and stage your home to attract buyers.',
                icon: Home,
              },
              {
                step: '03',
                title: 'Market Strategically',
                description: 'Professional photography, targeted marketing, and maximum exposure.',
                icon: TrendingUp,
              },
              {
                step: '04',
                title: 'Close Successfully',
                description: 'Navigate offers, negotiations, and closing with expert guidance.',
                icon: Check,
              },
            ].map((item) => (
              <div key={item.step} className="group">
                <div className="bg-[#F9F8F6] p-6 h-full hover:bg-[#0C1C2E] transition-colors duration-300">
                  <span className="text-[#Bfa67a] text-3xl font-serif block mb-4">{item.step}</span>
                  <item.icon size={24} className="text-gray-400 group-hover:text-[#Bfa67a] transition-colors mb-4" />
                  <h3 className="font-serif text-lg text-[#0C1C2E] group-hover:text-white transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 group-hover:text-white/60 transition-colors text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#0C1C2E]">
        <div className="max-w-[800px] mx-auto px-8 text-center">
          <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">
            Ready to Sell?
          </span>
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">
            Let's Maximize Your <span className="italic font-light">Home's Value</span>
          </h2>
          <p className="text-white/60 mb-8 text-lg font-light">
            Partner with an experienced agent who understands the Scottsdale luxury market and can deliver results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setActiveTab('valuation');
                setFormSubmitted(false);
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all inline-flex items-center justify-center gap-2"
            >
              Get Free Valuation <ArrowRight size={14} />
            </button>
            <Link
              to="/contact"
              className="bg-transparent border border-white/30 text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all inline-flex items-center justify-center gap-2"
            >
              Schedule Consultation <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SellersCenter;
