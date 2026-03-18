import type { NearbyAmenity, NearbyData } from '../lib/types';

interface NearbyResultsProps {
  data: NearbyData;
}

const CATEGORY_LABELS: Record<string, string> = {
  dining: 'Dining', golf: 'Golf', grocery: 'Grocery', shopping: 'Shopping', medical: 'Medical',
};

export function NearbyResults({ data }: NearbyResultsProps) {
  const categories = (Object.entries(data) as [string, NearbyAmenity[]][]).filter(([, items]) => items.length > 0);
  if (categories.length === 0) return null;

  // Matches CommunityDining pattern — white card in the grid
  return (
    <div className="col-span-12 lg:col-span-6 bg-white p-6 shadow-lg shadow-black/5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Nearby Amenities</span>
      </div>
      <div className="space-y-5">
        {categories.map(([key, items]) => (
          <div key={key}>
            <span className="text-[9px] uppercase tracking-widest text-gold font-bold block mb-2">{CATEGORY_LABELS[key] ?? key}</span>
            <div className="space-y-1">
              {items.map((item) => (
                <div key={item.name} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-600 text-sm">{item.name}</span>
                  <span className="text-[9px] text-gray-400">{item.distanceMiles} mi</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
