import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { CommunitySummaryRow } from '@platform/database/src/queries/communities';

interface CommunitySimilarProps {
  communities: CommunitySummaryRow[];
  regionId: string;
  regionName: string;
}

export function CommunitySimilar({ communities, regionId, regionName }: CommunitySimilarProps) {
  if (communities.length === 0) return null;

  return (
    <section className="py-16 max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20">
      <div className="mb-10">
        <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">
          Explore More
        </span>
        <h2 className="text-3xl font-serif text-navy">
          More Communities in {regionName}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communities.slice(0, 6).map((community) => (
          <Link
            key={community.id}
            href={`/phoenix/${regionId}/${community.id}`}
            className="group bg-white shadow-lg shadow-black/5 overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="aspect-[16/9] overflow-hidden relative">
              {community.hero_image ? (
                <img
                  src={community.hero_image}
                  alt={community.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full bg-cream-alt flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                    No Image
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-serif group-hover:text-gold transition-colors">
                  {community.name}
                </h3>
                {community.price_range && (
                  <span className="text-[10px] uppercase tracking-widest text-white/70">
                    {community.price_range}
                  </span>
                )}
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight size={20} className="text-white" />
              </div>
            </div>

            {community.tags && community.tags.length > 0 && (
              <div className="p-4 flex flex-wrap gap-2">
                {community.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="bg-cream-alt text-navy px-3 py-1 text-[9px] uppercase tracking-widest font-bold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
