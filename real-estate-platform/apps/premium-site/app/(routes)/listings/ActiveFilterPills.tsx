'use client';

import type { FilterState } from './useListingsSearch';
import { DEFAULT_CITIES, DEFAULT_PROPERTY_TYPE, PROPERTY_TYPE_LABELS } from './listing-defaults';

interface ActiveFilterPillsProps {
  filterState: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onClearAll: () => void;
}

function formatPriceLabel(val: string): string {
  if (!val) return '';
  const n = parseInt(val, 10);
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  return `$${Math.round(n / 1000)}K`;
}

function Pill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-navy/5 border border-navy/15 px-2.5 py-1.5 min-h-[36px] text-xs text-navy font-semibold whitespace-nowrap shrink-0">
      {label}
      <button
        onClick={(e) => {
          e.preventDefault();
          onRemove();
        }}
        className="text-navy/30 hover:text-navy transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

export function ActiveFilterPills({
  filterState,
  onFilterChange,
  onClearAll,
}: ActiveFilterPillsProps) {
  const pills: { label: string; onRemove: () => void }[] = [];

  // Cities — only show pills when city set differs from defaults
  const currentCities = filterState.cities
    ? filterState.cities === 'all'
      ? []
      : filterState.cities.split(',').map((c) => c.trim()).filter(Boolean)
    : [...DEFAULT_CITIES];
  const defaultSet = new Set(DEFAULT_CITIES.map((c) => c.toLowerCase()));
  const currentSet = new Set(currentCities.map((c) => c.toLowerCase()));
  const citiesMatchDefault =
    defaultSet.size === currentSet.size &&
    [...defaultSet].every((c) => currentSet.has(c));

  if (!citiesMatchDefault) {
    if (filterState.cities === 'all') {
      pills.push({
        label: 'All Cities',
        onRemove: () => onFilterChange({ cities: '' }),
      });
    } else {
      for (const city of currentCities) {
        pills.push({
          label: city,
          onRemove: () => {
            const remaining = currentCities.filter(
              (c) => c.toLowerCase() !== city.toLowerCase()
            );
            onFilterChange({
              cities: remaining.length === 0 ? 'all' : remaining.join(','),
            });
          },
        });
      }
    }
  }

  // Property type
  const currentType = filterState.propertyType || DEFAULT_PROPERTY_TYPE;
  if (currentType !== DEFAULT_PROPERTY_TYPE) {
    pills.push({
      label: currentType === 'all' ? 'All Types' : (PROPERTY_TYPE_LABELS[currentType] ?? currentType),
      onRemove: () => onFilterChange({ propertyType: '' }),
    });
  }

  // Price
  if (filterState.minPrice && filterState.maxPrice) {
    pills.push({
      label: `${formatPriceLabel(filterState.minPrice)} – ${formatPriceLabel(filterState.maxPrice)}`,
      onRemove: () => onFilterChange({ minPrice: '', maxPrice: '' }),
    });
  } else if (filterState.minPrice) {
    pills.push({
      label: `${formatPriceLabel(filterState.minPrice)}+`,
      onRemove: () => onFilterChange({ minPrice: '' }),
    });
  } else if (filterState.maxPrice) {
    pills.push({
      label: `Under ${formatPriceLabel(filterState.maxPrice)}`,
      onRemove: () => onFilterChange({ maxPrice: '' }),
    });
  }

  // Beds & Baths
  if (filterState.minBeds) {
    pills.push({
      label: `${filterState.minBeds}+ Beds`,
      onRemove: () => onFilterChange({ minBeds: '' }),
    });
  }
  if (filterState.minBaths) {
    pills.push({
      label: `${filterState.minBaths}+ Baths`,
      onRemove: () => onFilterChange({ minBaths: '' }),
    });
  }

  // Sq ft
  if (filterState.minSqft) {
    pills.push({
      label: `${parseInt(filterState.minSqft, 10).toLocaleString()}+ SF`,
      onRemove: () => onFilterChange({ minSqft: '' }),
    });
  }

  // Lot size
  if (filterState.minLotAcres) {
    const acres = parseFloat(filterState.minLotAcres);
    pills.push({
      label: acres < 1 ? `${Math.round(acres * 4)}/4 Acre+` : `${acres} Acre${acres > 1 ? 's' : ''}+`,
      onRemove: () => onFilterChange({ minLotAcres: '' }),
    });
  }

  // Year built
  if (filterState.minYearBuilt) {
    pills.push({
      label: `${filterState.minYearBuilt}+`,
      onRemove: () => onFilterChange({ minYearBuilt: '' }),
    });
  }

  // Days on market
  if (filterState.maxDom) {
    pills.push({
      label: `Under ${filterState.maxDom} days`,
      onRemove: () => onFilterChange({ maxDom: '' }),
    });
  }

  // HOA
  if (filterState.maxHoa) {
    pills.push({
      label: filterState.maxHoa === '0' ? 'No HOA' : `HOA under $${parseInt(filterState.maxHoa, 10).toLocaleString()}/mo`,
      onRemove: () => onFilterChange({ maxHoa: '' }),
    });
  }

  // Feature toggles
  if (filterState.hasPool === 'true') {
    pills.push({ label: 'Pool', onRemove: () => onFilterChange({ hasPool: '' }) });
  }
  if (filterState.hasFireplace === 'true') {
    pills.push({ label: 'Fireplace', onRemove: () => onFilterChange({ hasFireplace: '' }) });
  }
  if (filterState.isHorseProperty === 'true') {
    pills.push({ label: 'Horse Property', onRemove: () => onFilterChange({ isHorseProperty: '' }) });
  }
  if (filterState.hasGarage === 'true') {
    pills.push({ label: 'Garage', onRemove: () => onFilterChange({ hasGarage: '' }) });
  }

  // Garage spaces
  if (filterState.minGarageSpaces) {
    pills.push({
      label: `${filterState.minGarageSpaces}+ Garage`,
      onRemove: () => onFilterChange({ minGarageSpaces: '' }),
    });
  }

  // Stories
  if (filterState.minStories) {
    pills.push({
      label: filterState.minStories === '1' ? '1 Story' : `${filterState.minStories}+ Stories`,
      onRemove: () => onFilterChange({ minStories: '' }),
    });
  }

  // Keyword
  if (filterState.keyword) {
    pills.push({
      label: `"${filterState.keyword}"`,
      onRemove: () => onFilterChange({ keyword: '' }),
    });
  }

  // Subdivision
  if (filterState.subdivisionName) {
    pills.push({
      label: filterState.subdivisionName,
      onRemove: () => onFilterChange({ subdivisionName: '' }),
    });
  }

  if (pills.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-navy/10 overflow-x-auto scrollbar-hide shrink-0">
      {pills.map((pill, i) => (
        <Pill key={`${pill.label}-${i}`} label={pill.label} onRemove={pill.onRemove} />
      ))}
      <button
        onClick={onClearAll}
        className="text-[10px] uppercase tracking-widest font-bold text-navy/30 hover:text-gold transition-colors whitespace-nowrap shrink-0 ml-1"
      >
        Clear all
      </button>
    </div>
  );
}
