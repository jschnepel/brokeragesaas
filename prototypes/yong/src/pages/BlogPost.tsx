import { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import SEOHead from '../components/shared/SEOHead';

// Blog post interface
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  date: string;
  readTime: string;
}

// Mock related posts
const RELATED_POSTS: BlogPost[] = [
  {
    id: '2',
    title: 'North Scottsdale Market Update: Q4 2024 Analysis',
    excerpt: 'The luxury market continues to show strength with limited inventory driving premium pricing.',
    category: 'Market Updates',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800',
    date: 'January 15, 2025',
    readTime: '8 min read',
  },
  {
    id: '4',
    title: 'Understanding Mortgage Options for Luxury Properties',
    excerpt: 'Jumbo loans, cash purchases, and creative financing options for high-value transactions.',
    category: 'Financing',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800',
    date: 'December 20, 2024',
    readTime: '7 min read',
  },
  {
    id: '3',
    title: 'Desert Mountain: A Complete Community Guide',
    excerpt: 'Explore one of Scottsdale\'s most prestigious golf communities.',
    category: 'Community Guides',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800',
    date: 'January 8, 2025',
    readTime: '10 min read',
  },
];

const BlogPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [scrollY, setScrollY] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!id) {
    return <Navigate to="/blog" replace />;
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] page-zoom-90 font-sans antialiased">
      <SEOHead
        title="5 Essential Financial Steps Before Investing In Real Estate | Blog"
        description="Understanding your financial position is crucial before making one of the largest investments of your life. Here are the key steps every buyer should take."
      />
      <Navigation variant="transparent" />

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] w-full overflow-hidden flex items-end">
        <div
          className="absolute inset-0 w-full h-[120%]"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          <img
            src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=2400"
            className="w-full h-full object-cover"
            alt="Blog post hero"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E] via-[#0C1C2E]/50 to-transparent" />

        <div className="relative z-10 w-full max-w-[900px] mx-auto px-8 pb-16">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold mb-8">
            <Link to="/" className="text-white/40 hover:text-white transition-colors">Home</Link>
            <span className="text-white/20">/</span>
            <Link to="/blog" className="text-white/40 hover:text-white transition-colors">Insights</Link>
            <span className="text-white/20">/</span>
            <span className="text-[#Bfa67a]">Buyer Advisory</span>
          </nav>

          <h1 className="text-3xl md:text-5xl font-serif text-white leading-tight mb-6">
            5 Essential Financial Steps Before Investing In Real Estate
          </h1>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src="https://media.placester.com/image/upload/c_fill,dpr_1.0,f_auto,fl_lossy,h_768,q_auto,w_768/c_scale,w_768/v1/inception-app-prod/NjY3YTZkOTktMzhiOS00OWVhLWJjMDQtNWZlMWRmODUyYTU3/content/2024/06/8bbcec7735e907c73a61342dd761093e5aed2002.jpg"
                alt="Yong Choi"
                className="w-11 h-11 rounded-full object-cover border-2 border-white/20"
              />
              <div>
                <span className="text-white text-sm font-medium block">Yong Choi</span>
                <span className="text-white/40 text-[10px] uppercase tracking-widest">Realtor®</span>
              </div>
            </div>
            <span className="hidden sm:block w-px h-8 bg-white/20" />
            <div className="flex items-center gap-4 text-white/50 text-[11px] uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <Calendar size={13} />
                January 28, 2025
              </span>
              <span className="flex items-center gap-2">
                <Clock size={13} />
                6 min read
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16">
        <div className="max-w-[900px] mx-auto px-8">
          {/* Share buttons - sticky sidebar on desktop */}
          <div className="lg:fixed lg:left-8 lg:top-1/2 lg:-translate-y-1/2 flex lg:flex-col gap-3 mb-8 lg:mb-0">
            <button className="p-3 bg-white shadow-lg shadow-black/5 text-gray-400 hover:text-[#1877F2] hover:bg-[#1877F2]/10 transition-all">
              <Facebook size={18} />
            </button>
            <button className="p-3 bg-white shadow-lg shadow-black/5 text-gray-400 hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-all">
              <Twitter size={18} />
            </button>
            <button className="p-3 bg-white shadow-lg shadow-black/5 text-gray-400 hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 transition-all">
              <Linkedin size={18} />
            </button>
            <button
              onClick={handleCopyLink}
              className="p-3 bg-white shadow-lg shadow-black/5 text-gray-400 hover:text-[#Bfa67a] hover:bg-[#Bfa67a]/10 transition-all relative"
            >
              <LinkIcon size={18} />
              {copied && (
                <span className="absolute -right-2 lg:left-full lg:ml-2 top-1/2 -translate-y-1/2 bg-[#0C1C2E] text-white text-xs px-2 py-1 whitespace-nowrap">
                  Copied!
                </span>
              )}
            </button>
          </div>

          {/* Article body */}
          <article className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-600 leading-relaxed mb-8 font-light">
              Understanding your financial position is crucial before making one of the largest investments of your life. Whether you're a first-time buyer or an experienced investor, these fundamental steps will help ensure you're truly ready to enter the luxury real estate market.
            </p>

            <h2 className="text-2xl font-serif text-[#0C1C2E] mt-12 mb-6">1. Assess Your Complete Financial Picture</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Before you start browsing listings or attending open houses, take a comprehensive look at your finances. This means reviewing your income sources, existing debts, monthly expenses, and savings. For luxury properties, lenders will scrutinize your financial history more closely than with conventional purchases.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              In my 32 years of experience in the mortgage industry, I've seen countless buyers who were surprised by what they could—or couldn't—afford. The luxury market requires not just a substantial down payment, but also proof of sustained income and manageable debt-to-income ratios.
            </p>

            <div className="bg-[#0C1C2E] text-white p-8 my-10">
              <p className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold mb-3">Key Insight</p>
              <p className="text-lg font-serif leading-relaxed">
                "In the luxury market, 65% of transactions are cash purchases. Understanding your financing options—and whether cash is truly the best choice for your situation—is essential."
              </p>
            </div>

            <h2 className="text-2xl font-serif text-[#0C1C2E] mt-12 mb-6">2. Get Pre-Approved, Not Just Pre-Qualified</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              There's a significant difference between pre-qualification and pre-approval. Pre-qualification is an estimate based on self-reported information. Pre-approval involves a thorough review of your financial documents and results in a conditional commitment from the lender.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              In competitive markets like North Scottsdale, sellers of luxury properties often won't even consider offers from buyers who aren't pre-approved. It demonstrates seriousness and financial capability—both crucial when competing for premium properties.
            </p>

            <figure className="my-10">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200"
                alt="Financial planning documents"
                className="w-full"
              />
              <figcaption className="text-center text-gray-400 text-sm mt-3">
                Proper financial preparation is the foundation of a successful real estate purchase.
              </figcaption>
            </figure>

            <h2 className="text-2xl font-serif text-[#0C1C2E] mt-12 mb-6">3. Understand Jumbo Loan Requirements</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Most luxury properties require jumbo loans—mortgages that exceed the conforming loan limits set by Fannie Mae and Freddie Mac. In 2024, that limit is $766,550 for most of the country, though it can be higher in certain high-cost areas.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Jumbo loans typically require:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
              <li>Higher credit scores (typically 700+)</li>
              <li>Larger down payments (often 20-30%)</li>
              <li>More extensive documentation</li>
              <li>Cash reserves covering 6-12 months of payments</li>
              <li>Lower debt-to-income ratios</li>
            </ul>

            <h2 className="text-2xl font-serif text-[#0C1C2E] mt-12 mb-6">4. Consider the True Cost of Ownership</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              The purchase price is just the beginning. Luxury properties come with luxury-sized expenses. Property taxes in prime Scottsdale communities can run $15,000-$50,000 annually. HOA fees in exclusive communities like Silverleaf or Desert Mountain can exceed $2,000 per month. Insurance, maintenance, and utilities for larger homes add significantly to monthly costs.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Create a realistic budget that accounts for all these expenses. A good rule of thumb: budget an additional 2-3% of the home's value annually for maintenance and unexpected repairs.
            </p>

            <h2 className="text-2xl font-serif text-[#0C1C2E] mt-12 mb-6">5. Build Your Advisory Team</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Luxury real estate transactions require expertise beyond a standard purchase. Assemble a team that includes:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
              <li>A real estate agent specializing in luxury properties</li>
              <li>A mortgage broker experienced with jumbo loans</li>
              <li>A real estate attorney</li>
              <li>A CPA familiar with real estate tax implications</li>
              <li>A wealth advisor who understands your overall financial strategy</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-6">
              The coordination between these professionals can mean the difference between a smooth transaction and a costly mistake.
            </p>

            <div className="border-l-4 border-[#Bfa67a] pl-6 my-10">
              <p className="text-xl text-[#0C1C2E] font-serif italic leading-relaxed">
                "The best time to start preparing financially for a luxury home purchase is at least six months before you plan to start looking. This gives you time to optimize your credit, accumulate reserves, and align your financial strategy."
              </p>
            </div>

            <h2 className="text-2xl font-serif text-[#0C1C2E] mt-12 mb-6">Final Thoughts</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Buying luxury real estate is both an emotional and financial decision. While finding the perfect property is exciting, the foundation of a successful purchase is solid financial preparation. Take the time to complete these steps before you start your search, and you'll be positioned to move confidently when the right property appears.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              If you have questions about preparing for a luxury home purchase in North Scottsdale, I'm happy to share my insights from three decades in the industry. Understanding the financial landscape is the first step toward finding your ideal home.
            </p>
          </article>

          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {['Buying Tips', 'Financing', 'Luxury Real Estate', 'First-Time Buyers', 'Investment'].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-white text-gray-600 text-[10px] uppercase tracking-widest font-bold border border-gray-200 hover:border-[#Bfa67a] hover:text-[#Bfa67a] transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Author Box */}
          <div className="mt-12 bg-white p-8 shadow-lg shadow-black/5">
            <div className="flex flex-col sm:flex-row gap-6">
              <img
                src="https://media.placester.com/image/upload/c_fill,dpr_1.0,f_auto,fl_lossy,h_768,q_auto,w_768/c_scale,w_768/v1/inception-app-prod/NjY3YTZkOTktMzhiOS00OWVhLWJjMDQtNWZlMWRmODUyYTU3/content/2024/06/8bbcec7735e907c73a61342dd761093e5aed2002.jpg"
                alt="Yong Choi"
                className="w-24 h-24 object-cover grayscale"
              />
              <div className="flex-1">
                <p className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold mb-1">Written by</p>
                <h3 className="text-xl font-serif text-[#0C1C2E] mb-1">Yong Choi</h3>
                <p className="text-gray-400 text-sm mb-3">Realtor® • Russ Lyon Sotheby's International Realty</p>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  With 32+ years in the mortgage industry and deep expertise in North Scottsdale luxury real estate, Yong provides clients with unmatched market insights and financial guidance.
                </p>
                <div className="flex gap-4">
                  <a href="tel:+19093765494" className="text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors">
                    <Phone size={18} />
                  </a>
                  <a href="mailto:yong.choi@russlyon.com" className="text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors">
                    <Mail size={18} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      <section className="py-16 bg-white">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
          <div className="flex items-center gap-3 mb-10">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold">Related Articles</span>
            <div className="flex-1 h-px bg-gray-200" />
            <Link to="/blog" className="text-[10px] uppercase tracking-widest font-bold text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {RELATED_POSTS.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className="group"
              >
                <div className="aspect-[16/10] overflow-hidden mb-4">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <span className="text-[#Bfa67a] text-[9px] uppercase tracking-widest font-bold">
                  {post.category}
                </span>
                <h3 className="text-lg font-serif text-[#0C1C2E] leading-snug mt-2 group-hover:text-[#Bfa67a] transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm mt-2 flex items-center gap-2">
                  <Calendar size={12} />
                  {post.date}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0C1C2E]">
        <div className="max-w-[800px] mx-auto px-8 text-center">
          <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Ready to Start?</span>
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">
            Let's Discuss Your <span className="italic font-light">Real Estate Goals</span>
          </h2>
          <p className="text-white/60 mb-8">
            Whether you're buying, selling, or investing, I'm here to provide expert guidance tailored to your unique situation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all"
            >
              Schedule Consultation
            </Link>
            <a
              href="tel:+19093765494"
              className="border border-white/30 text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all"
            >
              Call (909) 376-5494
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default BlogPost;
