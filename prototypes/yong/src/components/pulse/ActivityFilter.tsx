import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

export type ActivityType = 'all' | 'sold' | 'new' | 'price-change' | 'expired';
export type SortOrder = 'recent' | 'price-high' | 'price-low';

interface ActivityFilterProps {
  activeType: ActivityType;
  sortOrder: SortOrder;
  onTypeChange: (type: ActivityType) => void;
  onSortChange: (sort: SortOrder) => void;
}

const FILTERS: { value: ActivityType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sold', label: 'Sold' },
  { value: 'new', label: 'New Listings' },
  { value: 'price-change', label: 'Price Changes' },
  { value: 'expired', label: 'Expired' },
];

const ActivityFilter: React.FC<ActivityFilterProps> = ({
  activeType, sortOrder, onTypeChange, onSortChange,
}) => {
  const [showSort, setShowSort] = useState(false);

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      {/* Tab-style filter (matching Insights tab pattern) */}
      <div className="inline-flex items-center">
        {FILTERS.map((f, index, arr) => (
          <div key={f.value} className="flex items-center">
            <button
              onClick={() => onTypeChange(f.value)}
              className={`px-3 py-1 transition-all relative ${
                activeType === f.value
                  ? 'text-[#0C1C2E]'
                  : 'text-[#0C1C2E]/40 hover:text-[#0C1C2E]/70'
              }`}
            >
              <span className={`font-serif text-sm tracking-wide ${activeType === f.value ? 'italic' : ''}`}>
                {f.label}
              </span>
              {activeType === f.value && (
                <span className="absolute bottom-0 left-3 right-3 h-[1px] bg-[#Bfa67a]" />
              )}
            </button>
            {index < arr.length - 1 && (
              <span className="text-[#0C1C2E]/20 text-xs mx-1 font-light">|</span>
            )}
          </div>
        ))}
      </div>

      {/* Sort dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowSort(!showSort)}
          className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.15em] font-bold text-gray-400 hover:text-[#0C1C2E] transition-colors"
        >
          <SlidersHorizontal size={12} />
          {sortOrder === 'recent' ? 'Recent' : sortOrder === 'price-high' ? 'Price High' : 'Price Low'}
        </button>
        {showSort && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-10">
            {[
              { value: 'recent' as const, label: 'Most Recent' },
              { value: 'price-high' as const, label: 'Price: High to Low' },
              { value: 'price-low' as const, label: 'Price: Low to High' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => { onSortChange(opt.value); setShowSort(false); }}
                className={`block w-full text-left px-3 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-gray-50 transition-colors ${
                  sortOrder === opt.value ? 'text-[#Bfa67a]' : 'text-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFilter;
