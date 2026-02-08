import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  // Organized communities by region for SEO-friendly sitemap
  const regions = [
    {
      id: 'north-scottsdale',
      name: 'North Scottsdale',
      communities: [
        { id: 'desert-mountain', name: 'Desert Mountain' },
        { id: 'silverleaf', name: 'Silverleaf' },
        { id: 'dc-ranch', name: 'DC Ranch' },
        { id: 'troon-north', name: 'Troon North' },
        { id: 'grayhawk', name: 'Grayhawk' },
        { id: 'desert-highlands', name: 'Desert Highlands' },
        { id: 'whisper-rock', name: 'Whisper Rock' },
        { id: 'ancala', name: 'Ancala' },
        { id: 'terravita', name: 'Terravita' },
        { id: 'mcdowell-mountain-ranch', name: 'McDowell Mountain Ranch' },
      ],
    },
    {
      id: 'north-scottsdale',
      name: 'Pinnacle Peak Area',
      communities: [
        { id: 'pinnacle-peak-country-club', name: 'Pinnacle Peak CC' },
        { id: 'pinnacle-peak-heights', name: 'Pinnacle Peak Heights' },
        { id: 'pinnacle-peak-vistas', name: 'Pinnacle Peak Vistas' },
        { id: 'canyon-heights', name: 'Canyon Heights' },
        { id: 'sincuidados', name: 'Sincuidados' },
        { id: 'pima-acres', name: 'Pima Acres' },
      ],
    },
    {
      id: 'paradise-valley',
      name: 'Paradise Valley',
      communities: [
        { id: 'paradise-valley', name: 'Paradise Valley' },
        { id: 'gainey-ranch', name: 'Gainey Ranch' },
        { id: 'mccormick-ranch', name: 'McCormick Ranch' },
        { id: 'scottsdale-ranch', name: 'Scottsdale Ranch' },
      ],
    },
    {
      id: 'central-scottsdale',
      name: 'Central Scottsdale',
      communities: [
        { id: 'old-town-scottsdale', name: 'Old Town Scottsdale' },
        { id: 'central-scottsdale', name: 'Central Scottsdale' },
        { id: 'kierland', name: 'Kierland' },
        { id: 'stonegate', name: 'Stonegate' },
      ],
    },
    {
      id: 'carefree-cave-creek',
      name: 'Carefree & Cave Creek',
      communities: [
        { id: 'carefree', name: 'Carefree' },
        { id: 'cave-creek', name: 'Cave Creek' },
        { id: 'boulders', name: 'The Boulders' },
      ],
    },
    {
      id: 'north-scottsdale',
      name: 'Private Golf',
      communities: [
        { id: 'estancia', name: 'Estancia' },
        { id: 'mirabel', name: 'Mirabel' },
      ],
    },
    {
      id: null,
      name: 'North Phoenix',
      communities: [
        { id: 'desert-ridge', name: 'Desert Ridge' },
      ],
    },
  ];

  const propertyLinks = [
    { href: '/properties?status=active', label: 'All Active Listings' },
    { href: '/properties?type=luxury', label: 'Luxury Homes $3M+' },
    { href: '/properties?type=golf', label: 'Golf Course Properties' },
    { href: '/properties?status=new', label: 'New Listings' },
    { href: '/properties?status=price-reduced', label: 'Price Reductions' },
    { href: '/properties?status=sold', label: 'Recently Sold' },
  ];

  const resourceLinks = [
    { href: '/map', label: 'Interactive Market Map' },
    { href: '/market-report', label: 'Market Intelligence' },
    { href: '/blog', label: 'Blog & Insights' },
    { href: '/buyer-guide', label: 'Buyer\'s Guide' },
    { href: '/seller-guide', label: 'Seller\'s Guide' },
    { href: '/relocation', label: 'Relocation Resources' },
  ];

  const aboutLinks = [
    { href: '/about', label: 'About Yong Choi' },
    { href: '/testimonials', label: 'Client Testimonials' },
    { href: '/contact', label: 'Contact' },
    { href: '/schedule', label: 'Schedule Consultation' },
  ];

  return (
    <footer className="bg-[#0C1C2E] text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Brand & Contact Section */}
        <div className="grid lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <span className="text-2xl font-light tracking-wide">
                <span className="text-[#BFA67A]">YONG</span> CHOI
              </span>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              Arizona's trusted luxury real estate advisor specializing in
              Scottsdale, Paradise Valley, and North Phoenix's most prestigious communities.
            </p>
            <div className="space-y-3 text-sm">
              <a
                href="tel:+14805551234"
                className="flex items-center gap-3 text-white/70 hover:text-[#BFA67A] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                (480) 555-1234
              </a>
              <a
                href="mailto:yong@scottsdaleluxury.com"
                className="flex items-center gap-3 text-white/70 hover:text-[#BFA67A] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                yong@scottsdaleluxury.com
              </a>
              <div className="flex items-center gap-3 text-white/70">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Scottsdale, AZ
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#BFA67A] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#BFA67A] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#BFA67A] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#BFA67A] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Properties Column */}
          <div>
            <h3 className="text-[#BFA67A] font-medium mb-4 text-sm uppercase tracking-wider">
              Properties
            </h3>
            <ul className="space-y-2">
              {propertyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-white/70 hover:text-[#BFA67A] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="text-[#BFA67A] font-medium mb-4 text-sm uppercase tracking-wider">
              Resources
            </h3>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-white/70 hover:text-[#BFA67A] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About Column */}
          <div>
            <h3 className="text-[#BFA67A] font-medium mb-4 text-sm uppercase tracking-wider">
              About
            </h3>
            <ul className="space-y-2">
              {aboutLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-white/70 hover:text-[#BFA67A] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Communities Mega Sitemap - Full Width */}
        <div className="border-t border-white/10 pt-12">
          <div className="flex items-center gap-3 mb-8">
            <h3 className="text-[#BFA67A] font-medium text-sm uppercase tracking-wider">
              Explore Communities
            </h3>
            <Link
              to="/map"
              className="text-xs text-white/50 hover:text-[#BFA67A] transition-colors flex items-center gap-1"
            >
              View Market Map
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8">
            {regions.map((region) => (
              <div key={region.name}>
                {region.id ? (
                  <Link
                    to={`/region/${region.id}`}
                    className="text-white/90 hover:text-[#BFA67A] font-medium text-xs mb-3 uppercase tracking-wide block transition-colors"
                  >
                    {region.name}
                  </Link>
                ) : (
                  <h4 className="text-white/90 font-medium text-xs mb-3 uppercase tracking-wide">
                    {region.name}
                  </h4>
                )}
                <ul className="space-y-1.5">
                  {region.communities.map((community) => (
                    <li key={community.id}>
                      <Link
                        to={`/${region.id}/${community.id}`}
                        className="text-white/60 hover:text-[#BFA67A] transition-colors text-xs"
                      >
                        {community.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-white/50 text-xs">
              © {new Date().getFullYear()} Yong Choi | Russ Lyon Sotheby's International Realty. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-xs">
              <Link to="/privacy" className="text-white/50 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-white/50 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/accessibility" className="text-white/50 hover:text-white transition-colors">
                Accessibility
              </Link>
              <Link to="/sitemap" className="text-white/50 hover:text-white transition-colors">
                Sitemap
              </Link>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-white/40 text-xs leading-relaxed">
              Information herein deemed reliable but not guaranteed. Properties are subject to prior sale,
              price change, or withdrawal without notice. Equal Housing Opportunity.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
