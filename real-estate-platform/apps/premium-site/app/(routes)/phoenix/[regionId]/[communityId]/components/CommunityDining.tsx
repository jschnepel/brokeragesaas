import { Utensils, Star } from 'lucide-react';
import type { Restaurant } from '../lib/types';

interface CommunityDiningProps {
  restaurants: Restaurant[];
}

export function CommunityDining({ restaurants }: CommunityDiningProps) {
  if (restaurants.length === 0) return null;

  return (
    <div className="col-span-12 lg:col-span-6 bg-white p-6 shadow-lg shadow-black/5">
      <div className="flex items-center gap-2 mb-4">
        <Utensils size={16} className="text-gold" />
        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
          Fine Dining
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {restaurants.slice(0, 4).map((restaurant, i) => (
          <div key={i} className="flex gap-3 group">
            {restaurant.image && (
              <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-navy text-sm truncate group-hover:text-gold transition-colors">
                {restaurant.name}
              </p>
              <p className="text-[9px] text-gray-400 truncate">{restaurant.cuisine}</p>
              <div className="flex items-center gap-2 mt-1">
                {restaurant.rating > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Star size={10} className="text-gold fill-gold" />
                    <span className="text-[10px] font-bold text-navy">
                      {restaurant.rating}
                    </span>
                  </div>
                )}
                <span className="text-[9px] text-gray-400">{restaurant.distance}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
