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

  return (
    <div className="mb-16 lg:mb-20">
      <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">Nearby</span>
      <div className="w-12 h-0.5 bg-gold mb-8" />
      <div className="space-y-4">
        {categories.map(([key, items]) => (
          <div key={key}>
            <h3 className="text-label uppercase tracking-lg text-gold font-bold mb-2">{CATEGORY_LABELS[key] ?? key}</h3>
            <div className="border-t border-navy/8">
              {items.map((item) => (
                <div key={item.name} className="flex justify-between py-2 border-b border-navy/5">
                  <span className="text-sm text-navy">{item.name}</span>
                  <span className="text-sm text-navy/50">{item.distanceMiles} mi</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
