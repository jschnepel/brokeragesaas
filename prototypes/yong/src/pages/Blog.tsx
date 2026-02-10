import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  ArrowRight,
  Search,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Tag,
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import SEOHead from '../components/shared/SEOHead';

// Blog post interface
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  image: string;
  date: string;
  readTime: string;
  featured?: boolean;
}

// Mock blog data
const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: '5 Essential Financial Steps Before Investing In Real Estate',
    excerpt: 'Understanding your financial position is crucial before making one of the largest investments of your life. Here are the key steps every buyer should take.',
    category: 'Buyer Advisory',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1200',
    date: 'January 28, 2025',
    readTime: '6 min read',
    featured: true,
  },
  {
    id: '2',
    title: 'North Scottsdale Market Update: Q4 2024 Analysis',
    excerpt: 'The luxury market continues to show strength with limited inventory driving premium pricing. Here\'s what the numbers tell us about the current state of the market.',
    category: 'Market Analysis',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200',
    date: 'January 15, 2025',
    readTime: '8 min read',
    featured: true,
  },
  {
    id: '3',
    title: 'Desert Mountain: A Complete Community Guide',
    excerpt: 'Explore one of Scottsdale\'s most prestigious golf communities, featuring six Jack Nicklaus-designed courses and stunning Sonoran Desert landscapes.',
    category: 'Community',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200',
    date: 'January 8, 2025',
    readTime: '10 min read',
  },
  {
    id: '4',
    title: 'Understanding Mortgage Options for Luxury Properties',
    excerpt: 'Jumbo loans, cash purchases, and creative financing options for high-value real estate transactions. What you need to know.',
    category: 'Investment',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200',
    date: 'December 20, 2024',
    readTime: '7 min read',
  },
  {
    id: '5',
    title: 'Why California Buyers Are Choosing Arizona',
    excerpt: 'Tax benefits, lifestyle upgrades, and value for money - understanding the migration trend that\'s reshaping the Phoenix luxury market.',
    category: 'Market Analysis',
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&q=80&w=1200',
    date: 'December 12, 2024',
    readTime: '5 min read',
  },
  {
    id: '6',
    title: 'Staging Your Luxury Home for Maximum Impact',
    excerpt: 'First impressions matter. Learn how professional staging can help your property stand out in the competitive luxury market.',
    category: 'Seller Strategy',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200',
    date: 'December 5, 2024',
    readTime: '6 min read',
  },
  {
    id: '7',
    title: 'Silverleaf at DC Ranch: Exclusive Living Defined',
    excerpt: 'Inside one of Arizona\'s most exclusive gated communities, where privacy meets luxury and every detail is meticulously crafted.',
    category: 'Community',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1200',
    date: 'November 28, 2024',
    readTime: '9 min read',
  },
  {
    id: '8',
    title: 'The Art of Negotiating Luxury Real Estate',
    excerpt: 'Strategies and insights for both buyers and sellers navigating high-stakes real estate transactions.',
    category: 'Buyer Advisory',
    image: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?auto=format&fit=crop&q=80&w=1200',
    date: 'November 15, 2024',
    readTime: '7 min read',
  },
];

const CATEGORIES = [
  'All Insights',
  'Market Analysis',
  'Buyer Advisory',
  'Seller Strategy',
  'Community',
  'Investment',
];

const Blog: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Insights');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter posts
  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory = selectedCategory === 'All Insights' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get featured posts
  const featuredPosts = BLOG_POSTS.filter((post) => post.featured);
  const regularPosts = filteredPosts.filter((post) => !post.featured || selectedCategory !== 'All');

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] page-zoom-90 font-sans antialiased">
      <SEOHead
        title="Real Estate Blog | Market News & Insights"
        description="Stay informed with the latest real estate market news, insights, and expert analysis for Scottsdale and Phoenix."
      />
      <Navigation variant="transparent" />

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] w-full overflow-hidden flex items-end">
        <div
          className="absolute inset-0 w-full h-[120%]"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2400"
            className="w-full h-full object-cover"
            alt="Blog"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E]/90 via-[#0C1C2E]/40 to-transparent" />

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 lg:px-20 pb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#Bfa67a] text-[11px] uppercase tracking-[0.4em] font-bold">Insights & Analysis</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif text-white leading-[0.95] tracking-tight">
            Market <span className="italic font-light">Intelligence</span>
          </h1>
          <p className="text-white/60 text-lg mt-4 max-w-xl">
            Expert insights on North Scottsdale's luxury real estate market, community guides, and strategic advice for buyers and sellers.
          </p>
        </div>
      </section>

      {/* Refined Filter Navigation */}
      <section className="sticky top-[72px] z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
          <div className="flex items-center justify-between">
            {/* Elegant Category Navigation */}
            <nav className="flex items-center -mb-px overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="relative group"
                >
                  <span
                    className={`
                      block px-6 py-5 text-[11px] uppercase tracking-[0.2em] font-bold whitespace-nowrap transition-colors
                      ${selectedCategory === category
                        ? 'text-[#0C1C2E]'
                        : 'text-gray-400 hover:text-[#0C1C2E]'
                      }
                    `}
                  >
                    {category}
                  </span>
                  {/* Active indicator line */}
                  <span
                    className={`
                      absolute bottom-0 left-6 right-6 h-0.5 transition-all duration-300
                      ${selectedCategory === category
                        ? 'bg-[#Bfa67a]'
                        : 'bg-transparent group-hover:bg-gray-200'
                      }
                    `}
                  />
                </button>
              ))}
            </nav>

            {/* Refined Search */}
            <div className="hidden md:flex items-center gap-3 py-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 bg-transparent border-b border-gray-200 px-0 py-2 pr-8 text-sm outline-none focus:border-[#Bfa67a] transition-colors placeholder-gray-300"
                />
                <Search size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {selectedCategory === 'All Insights' && searchQuery === '' && (
        <section className="py-16 max-w-[1600px] mx-auto px-8 lg:px-20">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold">Featured</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredPosts.map((post, index) => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className={`
                  group relative overflow-hidden bg-white shadow-lg shadow-black/5
                  ${index === 0 ? 'lg:row-span-2' : ''}
                `}
              >
                <div className={`relative overflow-hidden ${index === 0 ? 'aspect-[4/3] lg:aspect-auto lg:h-full' : 'aspect-[16/9]'}`}>
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E]/80 via-transparent to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                    <span className="inline-block px-3 py-1 bg-[#Bfa67a] text-white text-[9px] uppercase tracking-widest font-bold mb-4">
                      {post.category}
                    </span>
                    <h3 className={`font-serif text-white leading-tight mb-3 group-hover:text-[#Bfa67a] transition-colors ${index === 0 ? 'text-2xl lg:text-3xl' : 'text-xl'}`}>
                      {post.title}
                    </h3>
                    <p className="text-white/60 text-sm line-clamp-2 mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-white/40 text-[10px] uppercase tracking-widest font-bold">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {post.readTime}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Posts Grid */}
      <section className="py-16 max-w-[1600px] mx-auto px-8 lg:px-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold">
              {selectedCategory === 'All Insights' ? 'All Articles' : selectedCategory}
            </span>
            <div className="flex-1 h-px bg-gray-200 w-24" />
          </div>
          <span className="text-gray-400 text-sm">
            {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No articles found matching your criteria.</p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="mt-4 text-[#Bfa67a] text-sm font-bold hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(selectedCategory === 'All Insights' && searchQuery === '' ? regularPosts : filteredPosts).map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className="group bg-white shadow-lg shadow-black/5 overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={12} className="text-[#Bfa67a]" />
                    <span className="text-[9px] uppercase tracking-widest text-[#Bfa67a] font-bold">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-serif text-[#0C1C2E] leading-snug mb-3 group-hover:text-[#Bfa67a] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {post.date}
                      </span>
                    </div>
                    <span className="text-[#0C1C2E] text-[10px] uppercase tracking-widest font-bold flex items-center gap-1 group-hover:text-[#Bfa67a] transition-colors">
                      Read <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-[#0C1C2E]">
        <div className="max-w-[800px] mx-auto px-8 text-center">
          <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Stay Informed</span>
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">
            Market Intelligence, <span className="italic font-light">Delivered</span>
          </h2>
          <p className="text-white/60 mb-8">
            Subscribe to receive exclusive market updates, new listings, and expert insights directly to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-white/10 border border-white/20 text-white px-5 py-3.5 text-sm placeholder-white/40 outline-none focus:border-[#Bfa67a] transition-colors"
            />
            <button
              type="submit"
              className="bg-[#Bfa67a] text-white px-8 py-3.5 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all"
            >
              Subscribe
            </button>
          </form>
          <p className="text-white/30 text-xs mt-4">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* Agent CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 lg:col-span-4">
              <div className="aspect-square max-w-[300px] mx-auto lg:mx-0 overflow-hidden">
                <img
                  src="https://media.placester.com/image/upload/c_fill,dpr_1.0,f_auto,fl_lossy,h_768,q_auto,w_768/c_scale,w_768/v1/inception-app-prod/NjY3YTZkOTktMzhiOS00OWVhLWJjMDQtNWZlMWRmODUyYTU3/content/2024/06/8bbcec7735e907c73a61342dd761093e5aed2002.jpg"
                  alt="Yong Choi"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">About the Author</span>
              <h3 className="text-2xl lg:text-3xl font-serif text-[#0C1C2E] mb-2">Yong Choi</h3>
              <p className="text-gray-400 text-sm mb-6">Realtor® • Russ Lyon Sotheby's International Realty</p>
              <p className="text-gray-500 leading-relaxed mb-6 max-w-2xl">
                With over 32 years of experience in the mortgage industry and deep expertise in North Scottsdale's luxury market,
                Yong provides unparalleled insights into market conditions, investment strategies, and the nuances of high-end real estate transactions.
              </p>
              <div className="flex flex-wrap gap-6 mb-8">
                <a href="tel:+19093765494" className="flex items-center gap-2 text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors">
                  <Phone size={16} className="text-[#Bfa67a]" />
                  <span className="text-sm">(909) 376-5494</span>
                </a>
                <a href="mailto:yong.choi@russlyon.com" className="flex items-center gap-2 text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors">
                  <Mail size={16} className="text-[#Bfa67a]" />
                  <span className="text-sm">yong.choi@russlyon.com</span>
                </a>
              </div>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#Bfa67a] transition-all"
              >
                Schedule a Consultation
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Blog;
