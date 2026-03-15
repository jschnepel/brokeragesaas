import Link from 'next/link';
import { TrendingUp, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { GalleryImage, DemographicsData, MarketStats } from '../lib/types';
import { CommunityDemographics } from './CommunityDemographics';

interface CommunitySidebarProps {
  gallery: GalleryImage[];
  demographics: DemographicsData | null;
  stats: MarketStats | null;
  communityId: string;
  communityName: string;
  inventory: number;
}

export function CommunitySidebar({
  gallery,
  demographics,
  stats,
  communityId,
  communityName: _communityName,
  inventory,
}: CommunitySidebarProps) {
  return (
    <div className="col-span-12 lg:col-span-4">
      <div className="lg:sticky lg:top-24 space-y-4">
        {/* Gallery placeholder — client component will replace */}
        {gallery.length > 0 && gallery[0]?.url && (
          <div className="relative h-[320px] overflow-hidden bg-cream-alt">
            <img
              src={gallery[0].url}
              alt={gallery[0].caption}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white z-10">
              <span className="text-[9px] uppercase tracking-widest text-gold font-bold block">
                {gallery[0].category}
              </span>
              <h3 className="text-lg font-serif">{gallery[0].caption}</h3>
            </div>
          </div>
        )}

        {/* Demographics */}
        <CommunityDemographics demographics={demographics} />

        {/* Quick Stats */}
        {stats && (
          <div className="bg-navy px-6 pb-6">
            <div className="grid grid-cols-2 gap-3 pt-5 border-t border-white/10">
              <div className="text-center p-3 bg-white/5 rounded">
                <span className="text-2xl font-serif text-gold block">{stats.avgPrice}</span>
                <span className="text-[8px] uppercase tracking-widest text-gray-500">Avg Price</span>
              </div>
              <div className="text-center p-3 bg-white/5 rounded">
                <span className="text-2xl font-serif text-emerald-400 block">{stats.trend}</span>
                <span className="text-[8px] uppercase tracking-widest text-gray-500">YoY Growth</span>
              </div>
            </div>

            {/* Market Intel Link */}
            <Link
              href={`/market/community/${communityId}`}
              className="flex items-center justify-between mt-5 p-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-gold/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <TrendingUp size={18} className="text-gold" />
                <div>
                  <span className="text-white text-sm font-medium block group-hover:text-gold transition-colors">
                    Market Intelligence
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-gray-500">
                    Full Analytics Report
                  </span>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-500 group-hover:text-gold group-hover:translate-x-1 transition-all" />
            </Link>

            {/* CTA Buttons */}
            <div className="mt-5 space-y-3">
              <Link
                href="/contact"
                className="w-full bg-gold text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-navy transition-all flex items-center justify-center gap-2 group"
              >
                Contact Yong Choi
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href={`/listings?community=${communityId}`}
                className="w-full border border-white/20 text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-navy transition-all flex items-center justify-center gap-2"
              >
                Browse {inventory} Listings
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
