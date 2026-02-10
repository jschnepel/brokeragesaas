import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  Home,
  DollarSign,
  Percent,
  Calendar,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  HelpCircle,
  Check,
  FileText,
  Target,
  Clock,
  Building2,
  Info,
  Search,
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import SEOHead from '../components/shared/SEOHead';

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper function to format percentage
const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

const BuyersCenter: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState<'affordability' | 'mortgage'>('affordability');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Affordability Calculator State
  const [annualIncome, setAnnualIncome] = useState<number>(200000);
  const [monthlyDebts, setMonthlyDebts] = useState<number>(500);
  const [downPayment, setDownPayment] = useState<number>(200000);
  const [interestRate, setInterestRate] = useState<number>(6.5);
  const [loanTerm, setLoanTerm] = useState<number>(30);
  const [propertyTaxRate, setPropertyTaxRate] = useState<number>(0.75);
  const [insuranceRate, setInsuranceRate] = useState<number>(0.35);

  // Mortgage Calculator State
  const [homePrice, setHomePrice] = useState<number>(1000000);
  const [mortgageDownPayment, setMortgageDownPayment] = useState<number>(200000);
  const [mortgageInterestRate, setMortgageInterestRate] = useState<number>(6.5);
  const [mortgageLoanTerm, setMortgageLoanTerm] = useState<number>(30);
  const [mortgagePropertyTax, setMortgagePropertyTax] = useState<number>(625);
  const [mortgageInsurance, setMortgageInsurance] = useState<number>(292);
  const [mortgageHOA, setMortgageHOA] = useState<number>(0);

  // Calculate Affordability
  const calculateAffordability = () => {
    const monthlyIncome = annualIncome / 12;
    const maxHousingPayment = (monthlyIncome * 0.28) - monthlyDebts; // 28% DTI ratio
    const maxTotalDebt = (monthlyIncome * 0.36) - monthlyDebts; // 36% DTI ratio

    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;

    // Calculate max loan based on monthly payment capacity
    const maxMonthlyForMortgage = Math.min(maxHousingPayment, maxTotalDebt) * 0.7; // Reserve 30% for taxes/insurance
    const maxLoanAmount = maxMonthlyForMortgage * ((1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate);

    const maxHomePrice = maxLoanAmount + downPayment;
    const monthlyPayment = maxMonthlyForMortgage + (maxHomePrice * (propertyTaxRate / 100 / 12)) + (maxHomePrice * (insuranceRate / 100 / 12));

    return {
      maxHomePrice: Math.max(0, maxHomePrice),
      maxLoanAmount: Math.max(0, maxLoanAmount),
      monthlyPayment: Math.max(0, monthlyPayment),
      downPaymentPercent: maxHomePrice > 0 ? (downPayment / maxHomePrice) * 100 : 0,
    };
  };

  // Calculate Mortgage Payment
  const calculateMortgage = () => {
    const loanAmount = homePrice - mortgageDownPayment;
    const monthlyRate = mortgageInterestRate / 100 / 12;
    const numPayments = mortgageLoanTerm * 12;

    const principalInterest = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const totalMonthly = principalInterest + mortgagePropertyTax + mortgageInsurance + mortgageHOA;
    const totalInterest = (principalInterest * numPayments) - loanAmount;

    return {
      loanAmount,
      principalInterest: Math.max(0, principalInterest),
      totalMonthly: Math.max(0, totalMonthly),
      totalInterest: Math.max(0, totalInterest),
      totalCost: loanAmount + Math.max(0, totalInterest),
    };
  };

  const affordability = calculateAffordability();
  const mortgage = calculateMortgage();

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans">
      <SEOHead
        title="Buyer's Guide | Scottsdale Luxury Real Estate"
        description="Everything you need to know about buying luxury real estate in Scottsdale and Paradise Valley."
      />
      <Navigation variant="transparent" />

      {/* Hero Section - Immersive with Parallax */}
      <section className="relative h-[50vh] min-h-[400px] w-full overflow-hidden flex items-end">
        <div
          className="absolute inset-0 w-full h-[110%]"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        >
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000"
            alt="Buyer's Center"
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
              <span className="text-[#Bfa67a]">Buyer's Center</span>
            </nav>

            <div className="flex items-center gap-3 mb-4">
              <Search size={20} className="text-[#Bfa67a]" />
              <span className="text-[#Bfa67a] text-[11px] uppercase tracking-[0.4em] font-bold">Tools for Buyers</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif leading-[0.95] tracking-tight mb-6">
              Buyer's<br /><span className="italic font-light">Center</span>
            </h1>
            <p className="text-xl text-white/70 font-light italic max-w-lg">
              Calculate your budget, estimate monthly payments, and make informed decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('affordability')}
              className={`py-4 border-b-2 transition-all text-sm font-medium ${
                activeTab === 'affordability'
                  ? 'border-[#Bfa67a] text-[#0C1C2E]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <Home size={16} />
                Affordability Calculator
              </span>
            </button>
            <button
              onClick={() => setActiveTab('mortgage')}
              className={`py-4 border-b-2 transition-all text-sm font-medium ${
                activeTab === 'mortgage'
                  ? 'border-[#Bfa67a] text-[#0C1C2E]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <Calculator size={16} />
                Mortgage Calculator
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Affordability Calculator */}
      {activeTab === 'affordability' && (
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
                    <h2 className="text-xl font-serif text-[#0C1C2E]">Affordability Calculator</h2>
                    <p className="text-gray-400 text-sm">Enter your financial details to see what you can afford</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Annual Income */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Annual Gross Income
                    </label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        value={annualIncome}
                        onChange={(e) => setAnnualIncome(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Monthly Debts */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Monthly Debt Payments
                    </label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        value={monthlyDebts}
                        onChange={(e) => setMonthlyDebts(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Car loans, credit cards, student loans, etc.</p>
                  </div>

                  {/* Down Payment */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Down Payment
                    </label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        value={downPayment}
                        onChange={(e) => setDownPayment(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Interest Rate
                    </label>
                    <div className="relative">
                      <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        step="0.125"
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Loan Term */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Loan Term
                    </label>
                    <select
                      value={loanTerm}
                      onChange={(e) => setLoanTerm(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors bg-white"
                    >
                      <option value={30}>30 Years</option>
                      <option value={20}>20 Years</option>
                      <option value={15}>15 Years</option>
                      <option value={10}>10 Years</option>
                    </select>
                  </div>

                  {/* Property Tax Rate */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Property Tax Rate (Annual %)
                    </label>
                    <div className="relative">
                      <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        step="0.05"
                        value={propertyTaxRate}
                        onChange={(e) => setPropertyTaxRate(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Maricopa County avg: ~0.75%</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-[#F9F8F6] border-l-4 border-[#Bfa67a]">
                  <div className="flex items-start gap-3">
                    <Info size={18} className="text-[#Bfa67a] mt-0.5" />
                    <p className="text-sm text-gray-600">
                      This calculator uses standard lending guidelines (28% front-end DTI, 36% back-end DTI).
                      Your actual pre-approval amount may vary based on credit score, employment history, and other factors.
                    </p>
                  </div>
                </div>
              </div>

              {/* Results Panel */}
              <div className="lg:col-span-2">
                <div className="bg-[#0C1C2E] p-8 text-white sticky top-[70px]">
                  <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold mb-4 block">
                    Your Estimated Budget
                  </span>
                  <h3 className="text-4xl font-serif mb-2">
                    {formatCurrency(affordability.maxHomePrice)}
                  </h3>
                  <p className="text-white/60 text-sm mb-8">Maximum home price you may qualify for</p>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <span className="text-white/60 text-sm">Loan Amount</span>
                      <span className="font-medium">{formatCurrency(affordability.maxLoanAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <span className="text-white/60 text-sm">Down Payment</span>
                      <span className="font-medium">{formatCurrency(downPayment)} ({affordability.downPaymentPercent.toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <span className="text-white/60 text-sm">Est. Monthly Payment</span>
                      <span className="font-medium text-[#Bfa67a]">{formatCurrency(affordability.monthlyPayment)}/mo</span>
                    </div>
                  </div>

                  <Link
                    to="/listings"
                    className="w-full bg-[#Bfa67a] text-white py-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all"
                  >
                    Browse Homes in Budget <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Mortgage Calculator */}
      {activeTab === 'mortgage' && (
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
                    <h2 className="text-xl font-serif text-[#0C1C2E]">Mortgage Calculator</h2>
                    <p className="text-gray-400 text-sm">Calculate your estimated monthly mortgage payment</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Home Price */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Home Price
                    </label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        value={homePrice}
                        onChange={(e) => setHomePrice(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Down Payment */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Down Payment
                    </label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        value={mortgageDownPayment}
                        onChange={(e) => setMortgageDownPayment(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {homePrice > 0 ? `${((mortgageDownPayment / homePrice) * 100).toFixed(1)}% of home price` : '—'}
                    </p>
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Interest Rate
                    </label>
                    <div className="relative">
                      <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        step="0.125"
                        value={mortgageInterestRate}
                        onChange={(e) => setMortgageInterestRate(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Loan Term */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Loan Term
                    </label>
                    <select
                      value={mortgageLoanTerm}
                      onChange={(e) => setMortgageLoanTerm(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors bg-white"
                    >
                      <option value={30}>30 Years</option>
                      <option value={20}>20 Years</option>
                      <option value={15}>15 Years</option>
                      <option value={10}>10 Years</option>
                    </select>
                  </div>

                  {/* Property Tax */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Property Tax (Monthly)
                    </label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        value={mortgagePropertyTax}
                        onChange={(e) => setMortgagePropertyTax(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Insurance */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      Homeowners Insurance (Monthly)
                    </label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        value={mortgageInsurance}
                        onChange={(e) => setMortgageInsurance(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* HOA */}
                  <div className="md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                      HOA Fees (Monthly)
                    </label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        value={mortgageHOA}
                        onChange={(e) => setMortgageHOA(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-[#Bfa67a] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-[#F9F8F6] border-l-4 border-[#Bfa67a]">
                  <div className="flex items-start gap-3">
                    <Info size={18} className="text-[#Bfa67a] mt-0.5" />
                    <p className="text-sm text-gray-600">
                      This is an estimate based on the values you entered. Actual payments may vary based on lender requirements,
                      PMI (if applicable), and other factors. Contact a lender for precise figures.
                    </p>
                  </div>
                </div>
              </div>

              {/* Results Panel */}
              <div className="lg:col-span-2">
                <div className="bg-[#0C1C2E] p-8 text-white sticky top-[70px]">
                  <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold mb-4 block">
                    Monthly Payment
                  </span>
                  <h3 className="text-4xl font-serif mb-2">
                    {formatCurrency(mortgage.totalMonthly)}
                  </h3>
                  <p className="text-white/60 text-sm mb-8">Estimated total monthly payment</p>

                  {/* Payment Breakdown */}
                  <div className="mb-8">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3 block">
                      Payment Breakdown
                    </span>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white/60">Principal & Interest</span>
                          <span>{formatCurrency(mortgage.principalInterest)}</span>
                        </div>
                        <div className="w-full bg-white/10 h-2">
                          <div
                            className="bg-[#Bfa67a] h-full"
                            style={{ width: `${(mortgage.principalInterest / mortgage.totalMonthly) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white/60">Property Tax</span>
                          <span>{formatCurrency(mortgagePropertyTax)}</span>
                        </div>
                        <div className="w-full bg-white/10 h-2">
                          <div
                            className="bg-emerald-500 h-full"
                            style={{ width: `${(mortgagePropertyTax / mortgage.totalMonthly) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white/60">Insurance</span>
                          <span>{formatCurrency(mortgageInsurance)}</span>
                        </div>
                        <div className="w-full bg-white/10 h-2">
                          <div
                            className="bg-sky-500 h-full"
                            style={{ width: `${(mortgageInsurance / mortgage.totalMonthly) * 100}%` }}
                          />
                        </div>
                      </div>
                      {mortgageHOA > 0 && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-white/60">HOA</span>
                            <span>{formatCurrency(mortgageHOA)}</span>
                          </div>
                          <div className="w-full bg-white/10 h-2">
                            <div
                              className="bg-violet-500 h-full"
                              style={{ width: `${(mortgageHOA / mortgage.totalMonthly) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 mb-8 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Loan Amount</span>
                      <span className="font-medium">{formatCurrency(mortgage.loanAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Total Interest</span>
                      <span className="font-medium">{formatCurrency(mortgage.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Total Cost</span>
                      <span className="font-medium text-[#Bfa67a]">{formatCurrency(mortgage.totalCost)}</span>
                    </div>
                  </div>

                  <Link
                    to="/listings"
                    className="w-full bg-[#Bfa67a] text-white py-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all"
                  >
                    Find Your Home <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Buyer's Guide Section */}
      <section className="py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="text-center mb-12">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-2">
              Buyer's Guide
            </span>
            <h2 className="text-3xl font-serif text-[#0C1C2E]">
              Steps to <span className="italic font-light">Homeownership</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Get Pre-Approved',
                description: 'Know your budget before you start shopping. A pre-approval letter shows sellers you\'re serious.',
                icon: FileText,
              },
              {
                step: '02',
                title: 'Define Your Criteria',
                description: 'Location, size, features, must-haves vs nice-to-haves. Create your wish list.',
                icon: Target,
              },
              {
                step: '03',
                title: 'Tour & Compare',
                description: 'View properties, take notes, and compare options. Don\'t rush this important decision.',
                icon: Home,
              },
              {
                step: '04',
                title: 'Make an Offer',
                description: 'When you find the one, work with your agent to craft a competitive offer.',
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
            Ready to Begin?
          </span>
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">
            Let's Find Your <span className="italic font-light">Dream Home</span>
          </h2>
          <p className="text-white/60 mb-8 text-lg font-light">
            Work with an experienced agent who knows the Scottsdale luxury market inside and out.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/listings"
              className="bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all inline-flex items-center justify-center gap-2"
            >
              Browse Listings <ArrowRight size={14} />
            </Link>
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

export default BuyersCenter;
