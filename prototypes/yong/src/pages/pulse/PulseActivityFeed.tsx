import { useState, useMemo } from 'react';
import type { MarketScope } from '../../models/MarketScope';
import type { ScopeLevel } from '../../models/types';
import ActivityFilter from '../../components/pulse/ActivityFilter';
import type { ActivityType, SortOrder } from '../../components/pulse/ActivityFilter';

interface PulseActivityFeedProps {
  scope: MarketScope;
  level: ScopeLevel;
}

interface ActivityItem {
  id: string;
  type: 'sold' | 'new' | 'price-change' | 'expired';
  address: string;
  community: string;
  price: string;
  priceRaw: number;
  detail: string;
  date: string;
  daysAgo: number;
  dom: number;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  sold: { label: 'SOLD', color: 'text-emerald-600' },
  new: { label: 'NEW LISTING', color: 'text-blue-600' },
  'price-change': { label: 'PRICE CHANGE', color: 'text-amber-600' },
  expired: { label: 'EXPIRED', color: 'text-rose-600' },
};

function generateActivityFeed(scope: MarketScope, level: ScopeLevel): ActivityItem[] {
  const priceSegments = scope.getPriceSegments();
  const items: ActivityItem[] = [];
  const communities = level === 'community'
    ? [scope.name]
    : scope.getChildren().map(c => c.name).slice(0, 8);
  const communityFallback = communities.length > 0 ? communities : [scope.name];

  const addresses = [
    '10242 E Pinnacle Peak Rd', '23015 N Desert Mountain Dr', '9876 E Troon North Dr',
    '34501 N Scottsdale Rd', '8855 E Mountain View Rd', '15620 N 74th St',
    '12445 E Cactus Rd', '7890 E Camelback Rd', '29100 N 108th Pl',
    '16205 E Palisades Blvd', '5544 E Lincoln Dr', '20100 N 76th St',
  ];

  const basePrices = priceSegments.map(s => {
    const match = s.range.match(/\$([0-9.]+)([KM])/);
    if (!match) return 1000000;
    const num = parseFloat(match[1]);
    return match[2] === 'M' ? num * 1000000 : num * 1000;
  });

  for (let i = 0; i < 12; i++) {
    const type = (['sold', 'new', 'price-change', 'expired'] as const)[i % 4];
    const comm = communityFallback[i % communityFallback.length];
    const basePrice = basePrices[i % basePrices.length] ?? 1500000;
    const jitter = 0.8 + Math.random() * 0.6;
    const price = Math.round(basePrice * jitter);
    const daysAgo = Math.round(i * 1.5);
    const dom = 12 + Math.round(Math.random() * 50);

    items.push({
      id: `${i}`,
      type,
      address: addresses[i % addresses.length],
      community: comm,
      price: price >= 1000000 ? `$${(price / 1000000).toFixed(2)}M` : `$${(price / 1000).toFixed(0)}K`,
      priceRaw: price,
      detail: type === 'sold' ? `Sold after ${dom} days`
        : type === 'new' ? `${2200 + Math.round(Math.random() * 2000)} sqft`
        : type === 'price-change' ? `Reduced ${(2 + Math.round(Math.random() * 5)).toFixed(0)}%`
        : `Listed ${60 + Math.round(Math.random() * 60)} days`,
      date: new Date(Date.now() - daysAgo * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      daysAgo,
      dom,
    });
  }

  return items;
}

const PulseActivityFeed: React.FC<PulseActivityFeedProps> = ({ scope, level }) => {
  const [activeType, setActiveType] = useState<ActivityType>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');

  const allItems = useMemo(() => generateActivityFeed(scope, level), [scope, level]);

  const filteredItems = useMemo(() => {
    let items = activeType === 'all' ? allItems : allItems.filter(i => i.type === activeType);
    if (sortOrder === 'price-high') items = [...items].sort((a, b) => b.priceRaw - a.priceRaw);
    if (sortOrder === 'price-low') items = [...items].sort((a, b) => a.priceRaw - b.priceRaw);
    return items;
  }, [allItems, activeType, sortOrder]);

  return (
    <div>
      <div className="mb-6">
        <ActivityFilter
          activeType={activeType}
          sortOrder={sortOrder}
          onTypeChange={setActiveType}
          onSortChange={setSortOrder}
        />
      </div>

      {/* Card Grid (like Notable Sales) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredItems.slice(0, 8).map(item => {
          const typeInfo = TYPE_LABELS[item.type];
          return (
            <div key={item.id} className="bg-white p-5 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[9px] uppercase tracking-[0.15em] font-bold ${typeInfo.color}`}>
                  {item.community}
                </span>
                <span className="text-[9px] text-gray-400">{item.date}</span>
              </div>

              <span className="text-2xl font-serif text-[#0C1C2E] block mb-1 group-hover:text-[#Bfa67a] transition-colors">
                {item.price}
              </span>
              <span className="text-xs text-gray-500 block mb-3">{item.address}</span>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-[9px] text-gray-400">{item.detail}</span>
                <span className={`text-[7px] uppercase tracking-[0.12em] font-bold px-2 py-0.5 ${
                  item.type === 'sold' ? 'bg-emerald-50 text-emerald-600' :
                  item.type === 'new' ? 'bg-blue-50 text-blue-600' :
                  item.type === 'price-change' ? 'bg-amber-50 text-amber-600' :
                  'bg-rose-50 text-rose-600'
                }`}>
                  {typeInfo.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <span className="text-sm text-gray-400">No activity matching this filter.</span>
        </div>
      )}
    </div>
  );
};

export default PulseActivityFeed;
