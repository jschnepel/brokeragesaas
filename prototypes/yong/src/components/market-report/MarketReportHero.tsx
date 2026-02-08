import { useState, useEffect } from 'react';
import { Download, Share2 } from 'lucide-react';
import Navigation from '../Navigation';
import MarketBreadcrumbs from './MarketBreadcrumbs';
import type { Breadcrumb } from '../../models/types';

interface MarketReportHeroProps {
  title: string;
  subtitle?: string;
  image: string;
  breadcrumbs: Breadcrumb[];
  badge?: string;
}

const MarketReportHero: React.FC<MarketReportHeroProps> = ({ title, subtitle, image, breadcrumbs, badge }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Navigation variant="transparent" />
      <section className="relative h-[55vh] w-full overflow-hidden flex items-end">
        <div
          className="absolute inset-0 w-full h-[120%]"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          <img
            src={image}
            className="w-full h-full object-cover transition-all duration-700"
            alt={title}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E]/90 via-[#0C1C2E]/30 to-transparent" />

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 pb-20">
          <div className="flex flex-col md:flex-row items-end justify-between gap-12">
            <div className="text-white">
              <MarketBreadcrumbs breadcrumbs={breadcrumbs} variant="light" />
              <div className="flex items-center gap-3 mb-4 mt-4">
                <span className="text-[#Bfa67a] text-[11px] uppercase tracking-[0.4em] font-bold">Q4 2024 Market Intelligence</span>
                {badge && (
                  <span className="px-3 py-1 bg-[#Bfa67a] text-white text-[9px] uppercase tracking-widest font-bold">{badge}</span>
                )}
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[0.9] tracking-tight mb-4">
                {title.includes(':') ? (
                  <>
                    {title.split(':')[0]}: <br/>
                    <span className="italic font-light">{title.split(':')[1].trim()}</span>
                  </>
                ) : (
                  <>
                    Market <br/> <span className="italic font-light">Report</span>
                  </>
                )}
              </h1>
              {subtitle && (
                <p className="text-white/60 text-sm max-w-lg">{subtitle}</p>
              )}
            </div>

            <div className="hidden lg:flex flex-col sm:flex-row gap-3">
              <button className="bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2 shadow-xl">
                <Download size={14} />
                Download Report
              </button>
              <button className="bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2 shadow-xl">
                <Share2 size={14} />
                Share
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default MarketReportHero;
