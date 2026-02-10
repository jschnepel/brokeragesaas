import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Globe,
  Shield,
  TrendingUp,
  Users,
  Phone,
  Mail,
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import SEOHead from '../components/shared/SEOHead';
import AnimatedCounter from '../components/shared/AnimatedCounter';
import { agentSchema } from '../utils/structuredData';

const CREDENTIALS = [
  { icon: Award, title: 'Top 1% Nationally', description: 'Ranked among the top 1% of real estate professionals nationwide by sales volume.' },
  { icon: Globe, title: "Sotheby's Global Network", description: 'Access to 26,000+ advisors across 83 countries and territories worldwide.' },
  { icon: Shield, title: 'Certified Luxury Specialist', description: 'Institute for Luxury Home Marketing certified with decades of high-end expertise.' },
  { icon: Users, title: 'Relocation Expert', description: 'Specialized in guiding out-of-state buyers through seamless Arizona transitions.' },
];

const MILESTONES = [
  { year: '1991', event: 'Began career in mortgage and real estate' },
  { year: '2005', event: 'Joined Russ Lyon Sotheby\'s International Realty' },
  { year: '2012', event: 'Achieved $500M in cumulative career sales' },
  { year: '2018', event: '#1 individual agent, North Scottsdale office' },
  { year: '2023', event: 'Surpassed $1.2B in career sales volume' },
];

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans page-zoom-85">
      <SEOHead
        title="About Yong Choi | Scottsdale Luxury Real Estate Advisor"
        description="With $1.2B in career sales and 34 years of experience, Yong Choi is North Scottsdale's premier luxury real estate advisor at Russ Lyon Sotheby's International Realty."
        structuredData={agentSchema()}
      />
      <Navigation variant="transparent" />

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden flex items-end">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2400"
            className="w-full h-full object-cover"
            alt="Scottsdale luxury estate"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E]/90 via-[#0C1C2E]/40 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 lg:px-20 pb-16">
          <span className="text-[#Bfa67a] text-[11px] uppercase tracking-[0.4em] font-bold block mb-4">The Advisor</span>
          <h1 className="text-5xl md:text-7xl font-serif text-white leading-[0.95] tracking-tight">
            Yong <span className="italic font-light">Choi</span>
          </h1>
          <p className="text-white/60 text-lg mt-4 max-w-xl">
            Global Real Estate Advisor at Russ Lyon Sotheby's International Realty
          </p>
        </div>
      </section>

      {/* Stats Strip */}
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
              <AnimatedCounter value={34} suffix="+" duration={2000} />
            </p>
            <p className="text-[9px] uppercase tracking-widest text-gray-400">Years Experience</p>
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
        </div>
      </section>

      {/* Bio Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-24">
          <div className="grid grid-cols-12 gap-8 lg:gap-16 items-start">
            {/* Photo */}
            <div className="col-span-12 lg:col-span-5">
              <div className="relative max-w-[400px] mx-auto lg:mx-0">
                <div className="absolute -top-3 -left-3 w-full h-full border border-[#Bfa67a]/40"></div>
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <img
                    src="/images/yong-choi.jpg"
                    className="w-full h-full object-cover"
                    alt="Yong Choi"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E]/20 to-transparent"></div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white text-[#0C1C2E] px-5 py-3 shadow-xl">
                  <p className="font-serif text-lg">Yong Choi</p>
                  <p className="text-[9px] uppercase tracking-widest text-gray-500">Global Real Estate Advisor</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="col-span-12 lg:col-span-7 pt-4">
              <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold block mb-6">My Philosophy</span>

              <h2 className="text-3xl lg:text-4xl font-serif text-[#0C1C2E] mb-6 leading-snug">
                In luxury real estate, the difference between a transaction and a legacy is the advisor you choose.
              </h2>

              <div className="h-px w-16 bg-[#Bfa67a] mb-6"></div>

              <div className="space-y-4 text-gray-500 text-sm leading-relaxed font-light max-w-xl">
                <p>
                  With $1.2 billion in career sales and over three decades navigating Arizona's most prestigious markets, I've built my practice on one principle: your goals define the strategy. Whether you're seeking a desert retreat, a family compound, or a trophy asset, I bring the market intelligence and global network to deliver results.
                </p>
                <p>
                  My background in the mortgage industry gives me a financial perspective that most agents lack. I understand not just the property — but the transaction structure, tax implications, and long-term wealth strategy behind every decision.
                </p>
                <p>
                  As part of Sotheby's International Realty, I connect local expertise with a global platform reaching qualified buyers in 83 countries. From discrete off-market acquisitions to record-setting sales, every engagement is handled with the precision and confidentiality you expect.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link
                  to="/contact"
                  className="group bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#0C1C2E] transition-all flex items-center justify-center gap-2"
                >
                  Schedule Consultation
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/market-report"
                  className="border border-[#0C1C2E]/20 text-[#0C1C2E] px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#0C1C2E] hover:text-white transition-all text-center"
                >
                  View Market Reports
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-24 bg-[#F9F8F6]">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-24">
          <div className="text-center mb-16">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-4">Credentials</span>
            <h2 className="text-4xl font-serif text-[#0C1C2E]">Why Clients Choose Yong</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CREDENTIALS.map((cred, i) => (
              <div
                key={i}
                className="bg-white p-8 shadow-lg shadow-black/5 border-t-4 border-[#Bfa67a] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <cred.icon size={28} className="text-[#Bfa67a] mb-4" />
                <h3 className="font-serif text-lg text-[#0C1C2E] mb-2">{cred.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{cred.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-[#0C1C2E]">
        <div className="max-w-[1000px] mx-auto px-8 lg:px-24">
          <div className="text-center mb-16">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-4">Career Highlights</span>
            <h2 className="text-4xl font-serif text-white">A Track Record of Excellence</h2>
          </div>

          <div className="space-y-0">
            {MILESTONES.map((milestone, i) => (
              <div key={i} className="flex gap-8 items-start group">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-[#Bfa67a] group-hover:scale-150 transition-transform"></div>
                  {i < MILESTONES.length - 1 && <div className="w-px h-16 bg-white/10"></div>}
                </div>
                <div className="pb-12">
                  <span className="text-[#Bfa67a] text-sm font-bold">{milestone.year}</span>
                  <p className="text-white/80 text-lg font-serif mt-1">{milestone.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-24">
          <div className="text-center mb-16">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-4">Specializations</span>
            <h2 className="text-4xl font-serif text-[#0C1C2E]">How I Serve My Clients</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <TrendingUp size={32} className="text-[#Bfa67a] mx-auto mb-4" />
              <h3 className="font-serif text-xl text-[#0C1C2E] mb-3">Luxury Sales & Acquisitions</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Strategic pricing, global exposure through Sotheby's network, and skilled negotiation to maximize value on every transaction.
              </p>
            </div>
            <div className="text-center p-8">
              <Globe size={32} className="text-[#Bfa67a] mx-auto mb-4" />
              <h3 className="font-serif text-xl text-[#0C1C2E] mb-3">Relocation Services</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                End-to-end guidance for buyers relocating from California, the Midwest, and international markets to the Phoenix metro area.
              </p>
            </div>
            <div className="text-center p-8">
              <Shield size={32} className="text-[#Bfa67a] mx-auto mb-4" />
              <h3 className="font-serif text-xl text-[#0C1C2E] mb-3">Off-Market & Private Deals</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Access to exclusive pre-market and pocket listings, handled with complete discretion for high-profile buyers and sellers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#F9F8F6]">
        <div className="max-w-[800px] mx-auto px-8 text-center">
          <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-4">Get Started</span>
          <h2 className="text-3xl md:text-4xl font-serif text-[#0C1C2E] mb-4">
            Ready to Find Your Next Home?
          </h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            Whether you're buying, selling, or simply exploring the market, I'd love to hear about your goals and how I can help.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/contact"
              className="group bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#Bfa67a] transition-all flex items-center justify-center gap-2"
            >
              Contact Yong
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="tel:+19093765494"
              className="flex items-center justify-center gap-2 border border-[#0C1C2E]/20 text-[#0C1C2E] px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#0C1C2E] hover:text-white transition-all"
            >
              <Phone size={14} />
              (909) 376-5494
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
