'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { FilterState } from './useListingsSearch';

interface FilterBarProps {
  filterState: FilterState;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onClearFilters: () => void;
}

// ---------------------------------------------------------------------------
// Popover — click-to-open dropdown panel anchored to a trigger button
// ---------------------------------------------------------------------------

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return { open, setOpen, ref };
}

// Trigger button that shows label + active value summary
function FilterButton({
  label,
  active,
  activeLabel,
  isOpen,
  onClick,
}: {
  label: string;
  active: boolean;
  activeLabel?: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 border px-3 py-2 text-sm transition-colors duration-200 whitespace-nowrap ${
        active
          ? 'border-gold bg-gold/5 text-navy font-semibold'
          : isOpen
          ? 'border-navy/30 bg-white text-navy'
          : 'border-navy/15 bg-white text-navy/70 hover:border-navy/30 hover:text-navy'
      }`}
    >
      <span>{active && activeLabel ? activeLabel : label}</span>
      <svg
        className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${active ? 'text-gold' : 'text-navy/30'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

// Dropdown panel that appears below the trigger
function DropdownPanel({
  open,
  children,
  width = 'w-72',
}: {
  open: boolean;
  children: React.ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return (
    <div className={`absolute top-full left-0 mt-1 ${width} bg-white border border-navy/15 shadow-xl z-[60] py-4 px-4`}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Button group — Zillow-style pill selector (beds, baths, stories)
// ---------------------------------------------------------------------------

function ButtonGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">{label}</div>
      <div className="flex">
        {options.map((opt, i) => (
          <button
            key={opt.value}
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
            className={`flex-1 py-2 text-xs font-bold border transition-colors duration-150 ${
              i > 0 ? '-ml-px' : ''
            } ${
              value === opt.value
                ? 'bg-navy text-white border-navy z-10 relative'
                : 'bg-white text-navy/50 border-navy/15 hover:text-navy hover:border-navy/30'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checkbox pill
// ---------------------------------------------------------------------------

function CheckboxPill({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`px-3 py-1.5 text-xs font-semibold border transition-colors duration-150 ${
        checked
          ? 'bg-navy text-white border-navy'
          : 'bg-white text-navy/50 border-navy/15 hover:text-navy hover:border-navy/30'
      }`}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Price helpers
// ---------------------------------------------------------------------------

function formatPriceLabel(val: string): string {
  if (!val) return '';
  const n = parseInt(val, 10);
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  return `$${Math.round(n / 1000)}K`;
}

function getPriceSummary(min: string, max: string): string | undefined {
  if (min && max) return `${formatPriceLabel(min)} – ${formatPriceLabel(max)}`;
  if (min) return `${formatPriceLabel(min)}+`;
  if (max) return `Up to ${formatPriceLabel(max)}`;
  return undefined;
}

// ---------------------------------------------------------------------------
// Desktop FilterBar
// ---------------------------------------------------------------------------

const BED_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '1+', value: '1' },
  { label: '2+', value: '2' },
  { label: '3+', value: '3' },
  { label: '4+', value: '4' },
  { label: '5+', value: '5' },
  { label: '6+', value: '6' },
];

const BATH_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '1+', value: '1' },
  { label: '2+', value: '2' },
  { label: '3+', value: '3' },
  { label: '4+', value: '4' },
  { label: '5+', value: '5' },
];

const MIN_PRICE_OPTIONS = ['200000', '300000', '400000', '500000', '750000', '1000000', '1500000', '2000000', '3000000', '5000000', '10000000'];
const MAX_PRICE_OPTIONS = ['500000', '750000', '1000000', '1500000', '2000000', '3000000', '5000000', '10000000', '25000000'];

const HOME_TYPES = [
  { label: 'Houses', value: 'Residential' },
  { label: 'Condos / Townhouses', value: 'Condo/Townhouse' },
  { label: 'Land', value: 'Land' },
  { label: 'Multi-Family', value: 'Multi-Family' },
];

const CITIES = [
  'Scottsdale', 'Paradise Valley', 'Phoenix', 'Cave Creek', 'Carefree',
  'Fountain Hills', 'Mesa', 'Tempe', 'Chandler', 'Gilbert',
];

export function FilterBar({
  filterState,
  activeFilterCount,
  hasActiveFilters,
  onFilterChange,
  onClearFilters,
}: FilterBarProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedChange = useCallback(
    (updates: Partial<FilterState>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onFilterChange(updates), 150);
    },
    [onFilterChange],
  );

  const pricePopover = usePopover();
  const bedsPopover = usePopover();
  const typePopover = usePopover();
  const morePopover = usePopover();

  const priceSummary = getPriceSummary(filterState.minPrice, filterState.maxPrice);
  const bedsSummary = filterState.minBeds ? `${filterState.minBeds}+ bd` : '';
  const bathsSummary = filterState.minBaths ? `${filterState.minBaths}+ ba` : '';
  const bedBathSummary = [bedsSummary, bathsSummary].filter(Boolean).join(', ') || undefined;

  const moreCount = [
    filterState.minSqft, filterState.minLotAcres, filterState.minYearBuilt,
    filterState.maxDom, filterState.maxHoa, filterState.minGarageSpaces,
    filterState.minStories, filterState.hasPool === 'true' ? 'x' : '',
    filterState.hasFireplace === 'true' ? 'x' : '',
    filterState.isHorseProperty === 'true' ? 'x' : '',
    filterState.keyword, filterState.subdivisionName,
  ].filter(Boolean).length;

  return (
    <div className="bg-white border-b border-navy/10 shadow-sm relative z-20">
      <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap">
        {/* Buy / Rent toggle */}
        <div className="flex border border-navy/15 overflow-hidden mr-1">
          {(['sale', 'rent'] as const).map((type) => (
            <button
              key={type}
              onClick={() => debouncedChange({ listingType: filterState.listingType === type ? '' : type })}
              className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                (filterState.listingType || 'sale') === type
                  ? 'bg-navy text-white'
                  : 'bg-white text-navy/40 hover:text-navy/70'
              }`}
            >
              {type === 'sale' ? 'Buy' : 'Rent'}
            </button>
          ))}
        </div>

        {/* City */}
        <select
          value={filterState.city}
          onChange={(e) => debouncedChange({ city: e.target.value })}
          className={`border ${filterState.city ? 'border-gold bg-gold/5 font-semibold' : 'border-navy/15'} bg-white px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none transition-colors duration-200`}
        >
          <option value="">All Cities</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Price — popover with min/max selects */}
        <div ref={pricePopover.ref} className="relative">
          <FilterButton
            label="Price"
            active={!!(filterState.minPrice || filterState.maxPrice)}
            activeLabel={priceSummary}
            isOpen={pricePopover.open}
            onClick={() => pricePopover.setOpen(!pricePopover.open)}
          />
          <DropdownPanel open={pricePopover.open} width="w-80">
            <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-3">Price Range</div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <select
                  value={filterState.minPrice}
                  onChange={(e) => debouncedChange({ minPrice: e.target.value })}
                  className="w-full border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none"
                >
                  <option value="">No Min</option>
                  {MIN_PRICE_OPTIONS.map((v) => (
                    <option key={v} value={v}>{formatPriceLabel(v)}</option>
                  ))}
                </select>
              </div>
              <span className="text-navy/30 text-sm">–</span>
              <div className="flex-1">
                <select
                  value={filterState.maxPrice}
                  onChange={(e) => debouncedChange({ maxPrice: e.target.value })}
                  className="w-full border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none"
                >
                  <option value="">No Max</option>
                  {MAX_PRICE_OPTIONS.map((v) => (
                    <option key={v} value={v}>{formatPriceLabel(v)}</option>
                  ))}
                </select>
              </div>
            </div>
            {(filterState.minPrice || filterState.maxPrice) && (
              <button
                onClick={() => debouncedChange({ minPrice: '', maxPrice: '' })}
                className="text-xs text-navy/40 hover:text-gold mt-3 transition-colors"
              >
                Reset price
              </button>
            )}
          </DropdownPanel>
        </div>

        {/* Beds & Baths — popover with button groups */}
        <div ref={bedsPopover.ref} className="relative">
          <FilterButton
            label="Beds & Baths"
            active={!!(filterState.minBeds || filterState.minBaths)}
            activeLabel={bedBathSummary}
            isOpen={bedsPopover.open}
            onClick={() => bedsPopover.setOpen(!bedsPopover.open)}
          />
          <DropdownPanel open={bedsPopover.open} width="w-72">
            <ButtonGroup
              label="Bedrooms"
              options={BED_OPTIONS}
              value={filterState.minBeds}
              onChange={(v) => debouncedChange({ minBeds: v })}
            />
            <div className="mt-4">
              <ButtonGroup
                label="Bathrooms"
                options={BATH_OPTIONS}
                value={filterState.minBaths}
                onChange={(v) => debouncedChange({ minBaths: v })}
              />
            </div>
            {(filterState.minBeds || filterState.minBaths) && (
              <button
                onClick={() => debouncedChange({ minBeds: '', minBaths: '' })}
                className="text-xs text-navy/40 hover:text-gold mt-3 transition-colors"
              >
                Reset
              </button>
            )}
          </DropdownPanel>
        </div>

        {/* Home Type — popover with checkbox pills */}
        <div ref={typePopover.ref} className="relative">
          <FilterButton
            label="Home Type"
            active={!!filterState.propertyType}
            activeLabel={filterState.propertyType === 'Residential' ? 'Houses' : filterState.propertyType === 'Condo/Townhouse' ? 'Condo' : filterState.propertyType || undefined}
            isOpen={typePopover.open}
            onClick={() => typePopover.setOpen(!typePopover.open)}
          />
          <DropdownPanel open={typePopover.open} width="w-64">
            <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-3">Property Type</div>
            <div className="flex flex-col gap-2">
              {HOME_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => debouncedChange({ propertyType: filterState.propertyType === t.value ? '' : t.value })}
                  className={`w-full text-left px-3 py-2 text-sm border transition-colors duration-150 ${
                    filterState.propertyType === t.value
                      ? 'bg-navy text-white border-navy'
                      : 'bg-white text-navy/60 border-navy/15 hover:border-navy/30 hover:text-navy'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {filterState.propertyType && (
              <button
                onClick={() => debouncedChange({ propertyType: '' })}
                className="text-xs text-navy/40 hover:text-gold mt-3 transition-colors"
              >
                Reset
              </button>
            )}
          </DropdownPanel>
        </div>

        {/* More Filters — large popover panel */}
        <div ref={morePopover.ref} className="relative">
          <FilterButton
            label={moreCount > 0 ? `More (${moreCount})` : 'More'}
            active={moreCount > 0}
            isOpen={morePopover.open}
            onClick={() => morePopover.setOpen(!morePopover.open)}
          />
          <DropdownPanel open={morePopover.open} width="w-[420px]">
            <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
              {/* Square Footage */}
              <div>
                <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">Square Feet</div>
                <select
                  value={filterState.minSqft}
                  onChange={(e) => debouncedChange({ minSqft: e.target.value })}
                  className="w-full border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none"
                >
                  <option value="">No Minimum</option>
                  <option value="1000">1,000+ sq ft</option>
                  <option value="1500">1,500+ sq ft</option>
                  <option value="2000">2,000+ sq ft</option>
                  <option value="2500">2,500+ sq ft</option>
                  <option value="3000">3,000+ sq ft</option>
                  <option value="4000">4,000+ sq ft</option>
                  <option value="5000">5,000+ sq ft</option>
                  <option value="7500">7,500+ sq ft</option>
                  <option value="10000">10,000+ sq ft</option>
                </select>
              </div>

              {/* Lot Size */}
              <div>
                <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">Lot Size</div>
                <select
                  value={filterState.minLotAcres}
                  onChange={(e) => debouncedChange({ minLotAcres: e.target.value })}
                  className="w-full border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none"
                >
                  <option value="">Any</option>
                  <option value="0.25">1/4 Acre+</option>
                  <option value="0.5">1/2 Acre+</option>
                  <option value="1">1 Acre+</option>
                  <option value="2">2 Acres+</option>
                  <option value="5">5 Acres+</option>
                  <option value="10">10 Acres+</option>
                  <option value="35">35 Acres+</option>
                </select>
              </div>

              {/* Year Built & Days on Market side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">Year Built</div>
                  <select
                    value={filterState.minYearBuilt}
                    onChange={(e) => debouncedChange({ minYearBuilt: e.target.value })}
                    className="w-full border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none"
                  >
                    <option value="">Any</option>
                    <option value="2024">2024+</option>
                    <option value="2020">2020+</option>
                    <option value="2015">2015+</option>
                    <option value="2010">2010+</option>
                    <option value="2000">2000+</option>
                    <option value="1990">1990+</option>
                    <option value="1980">1980+</option>
                  </select>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">Days on Market</div>
                  <select
                    value={filterState.maxDom}
                    onChange={(e) => debouncedChange({ maxDom: e.target.value })}
                    className="w-full border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none"
                  >
                    <option value="">Any</option>
                    <option value="1">1 Day</option>
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="180">6 Months</option>
                    <option value="365">1 Year</option>
                  </select>
                </div>
              </div>

              {/* HOA & Garage side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">Max HOA</div>
                  <select
                    value={filterState.maxHoa}
                    onChange={(e) => debouncedChange({ maxHoa: e.target.value })}
                    className="w-full border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none"
                  >
                    <option value="">Any</option>
                    <option value="0">No HOA</option>
                    <option value="100">$100/mo</option>
                    <option value="250">$250/mo</option>
                    <option value="500">$500/mo</option>
                    <option value="1000">$1,000/mo</option>
                    <option value="2500">$2,500/mo</option>
                  </select>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">Garage</div>
                  <ButtonGroup
                    label=""
                    options={[
                      { label: 'Any', value: '' },
                      { label: '1+', value: '1' },
                      { label: '2+', value: '2' },
                      { label: '3+', value: '3' },
                      { label: '4+', value: '4' },
                    ]}
                    value={filterState.minGarageSpaces}
                    onChange={(v) => debouncedChange({ minGarageSpaces: v })}
                  />
                </div>
              </div>

              {/* Stories */}
              <div>
                <ButtonGroup
                  label="Stories"
                  options={[
                    { label: 'Any', value: '' },
                    { label: '1', value: '1' },
                    { label: '2+', value: '2' },
                    { label: '3+', value: '3' },
                  ]}
                  value={filterState.minStories}
                  onChange={(v) => debouncedChange({ minStories: v })}
                />
              </div>

              {/* Feature toggles */}
              <div>
                <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">Features</div>
                <div className="flex flex-wrap gap-2">
                  <CheckboxPill label="Pool" checked={filterState.hasPool === 'true'} onChange={(v) => debouncedChange({ hasPool: v ? 'true' : '' })} />
                  <CheckboxPill label="Fireplace" checked={filterState.hasFireplace === 'true'} onChange={(v) => debouncedChange({ hasFireplace: v ? 'true' : '' })} />
                  <CheckboxPill label="Horse Property" checked={filterState.isHorseProperty === 'true'} onChange={(v) => debouncedChange({ isHorseProperty: v ? 'true' : '' })} />
                  <CheckboxPill label="Garage" checked={filterState.hasGarage === 'true'} onChange={(v) => debouncedChange({ hasGarage: v ? 'true' : '' })} />
                </div>
              </div>

              {/* Keyword & Subdivision */}
              <div>
                <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">Keyword Search</div>
                <input
                  type="text"
                  placeholder="e.g. mountain views, guest house, wine cellar..."
                  value={filterState.keyword}
                  onChange={(e) => debouncedChange({ keyword: e.target.value })}
                  className={`w-full border ${filterState.keyword ? 'border-gold' : 'border-navy/15'} bg-white px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none transition-colors`}
                />
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">Subdivision</div>
                <input
                  type="text"
                  placeholder="e.g. Desert Mountain, Silverleaf..."
                  value={filterState.subdivisionName}
                  onChange={(e) => debouncedChange({ subdivisionName: e.target.value })}
                  className={`w-full border ${filterState.subdivisionName ? 'border-gold' : 'border-navy/15'} bg-white px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none transition-colors`}
                />
              </div>
            </div>

            {moreCount > 0 && (
              <button
                onClick={() => {
                  debouncedChange({
                    minSqft: '', minLotAcres: '', minYearBuilt: '', maxDom: '',
                    maxHoa: '', minGarageSpaces: '', minStories: '', hasPool: '',
                    hasFireplace: '', isHorseProperty: '', hasGarage: '',
                    keyword: '', subdivisionName: '',
                  });
                }}
                className="text-xs text-navy/40 hover:text-gold mt-4 transition-colors"
              >
                Reset all filters
              </button>
            )}
          </DropdownPanel>
        </div>

        {/* Sort */}
        <select
          value={filterState.sortBy || 'price_desc'}
          onChange={(e) => debouncedChange({ sortBy: e.target.value })}
          className="border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none transition-colors duration-200 ml-auto"
        >
          <option value="price_desc">Price: High to Low</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="newest">Newest</option>
          <option value="dom">Days on Market</option>
          <option value="beds">Most Bedrooms</option>
          <option value="sqft">Largest</option>
          <option value="lot_size">Lot Size</option>
          <option value="price_sqft">Price per Sq Ft</option>
        </select>

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-navy/40 hover:text-gold transition-colors duration-200 whitespace-nowrap"
          >
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile — trigger button + full-screen drawer
// ---------------------------------------------------------------------------

export function MobileFilterButton({
  activeFilterCount,
  onClick,
}: {
  activeFilterCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-white border border-navy/15 px-4 py-2 text-sm text-navy shadow-sm"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
      Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
    </button>
  );
}

export function MobileFilterDrawer({
  filterState,
  activeFilterCount,
  hasActiveFilters,
  onFilterChange,
  onClearFilters,
  onClose,
}: FilterBarProps & { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white max-h-[85vh] overflow-y-auto rounded-t-xl shadow-xl pb-[env(safe-area-inset-bottom)]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-5 py-4 border-b border-navy/10">
          <h3 className="font-serif text-lg text-navy">Filters</h3>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button onClick={onClearFilters} className="text-xs text-navy/40 hover:text-gold">
                Clear All ({activeFilterCount})
              </button>
            )}
            <button onClick={onClose} className="text-navy/40 hover:text-navy">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Buy / Rent */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">Listing Type</div>
            <div className="flex border border-navy/15 overflow-hidden">
              {(['sale', 'rent'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onFilterChange({ listingType: filterState.listingType === type ? '' : type })}
                  className={`flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                    (filterState.listingType || 'sale') === type
                      ? 'bg-navy text-white'
                      : 'bg-white text-navy/40'
                  }`}
                >
                  {type === 'sale' ? 'Buy' : 'Rent'}
                </button>
              ))}
            </div>
          </div>

          {/* City */}
          <MobileFilterSelect label="City" value={filterState.city} onChange={(v) => onFilterChange({ city: v })}>
            <option value="">All Cities</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </MobileFilterSelect>

          {/* Price */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">Price Range</div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={filterState.minPrice}
                onChange={(e) => onFilterChange({ minPrice: e.target.value })}
                className="w-full border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none"
              >
                <option value="">No Min</option>
                {MIN_PRICE_OPTIONS.map((v) => <option key={v} value={v}>{formatPriceLabel(v)}</option>)}
              </select>
              <select
                value={filterState.maxPrice}
                onChange={(e) => onFilterChange({ maxPrice: e.target.value })}
                className="w-full border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none"
              >
                <option value="">No Max</option>
                {MAX_PRICE_OPTIONS.map((v) => <option key={v} value={v}>{formatPriceLabel(v)}</option>)}
              </select>
            </div>
          </div>

          {/* Beds & Baths — button groups */}
          <ButtonGroup
            label="Bedrooms"
            options={BED_OPTIONS}
            value={filterState.minBeds}
            onChange={(v) => onFilterChange({ minBeds: v })}
          />
          <ButtonGroup
            label="Bathrooms"
            options={BATH_OPTIONS}
            value={filterState.minBaths}
            onChange={(v) => onFilterChange({ minBaths: v })}
          />

          {/* Home Type */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">Home Type</div>
            <div className="grid grid-cols-2 gap-2">
              {HOME_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => onFilterChange({ propertyType: filterState.propertyType === t.value ? '' : t.value })}
                  className={`px-3 py-2.5 text-sm border transition-colors duration-150 ${
                    filterState.propertyType === t.value
                      ? 'bg-navy text-white border-navy'
                      : 'bg-white text-navy/60 border-navy/15'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sq Ft & Lot Size */}
          <div className="grid grid-cols-2 gap-3">
            <MobileFilterSelect label="Min Sq Ft" value={filterState.minSqft} onChange={(v) => onFilterChange({ minSqft: v })}>
              <option value="">Any</option>
              <option value="1000">1,000+</option>
              <option value="2000">2,000+</option>
              <option value="3000">3,000+</option>
              <option value="5000">5,000+</option>
              <option value="10000">10,000+</option>
            </MobileFilterSelect>
            <MobileFilterSelect label="Lot Size" value={filterState.minLotAcres} onChange={(v) => onFilterChange({ minLotAcres: v })}>
              <option value="">Any</option>
              <option value="0.25">1/4 Acre+</option>
              <option value="0.5">1/2 Acre+</option>
              <option value="1">1 Acre+</option>
              <option value="5">5 Acres+</option>
              <option value="10">10 Acres+</option>
            </MobileFilterSelect>
          </div>

          {/* Year Built & DOM */}
          <div className="grid grid-cols-2 gap-3">
            <MobileFilterSelect label="Year Built" value={filterState.minYearBuilt} onChange={(v) => onFilterChange({ minYearBuilt: v })}>
              <option value="">Any</option>
              <option value="2020">2020+</option>
              <option value="2010">2010+</option>
              <option value="2000">2000+</option>
              <option value="1990">1990+</option>
            </MobileFilterSelect>
            <MobileFilterSelect label="Days on Market" value={filterState.maxDom} onChange={(v) => onFilterChange({ maxDom: v })}>
              <option value="">Any</option>
              <option value="1">1 Day</option>
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
            </MobileFilterSelect>
          </div>

          {/* HOA & Garage */}
          <div className="grid grid-cols-2 gap-3">
            <MobileFilterSelect label="Max HOA" value={filterState.maxHoa} onChange={(v) => onFilterChange({ maxHoa: v })}>
              <option value="">Any</option>
              <option value="0">No HOA</option>
              <option value="100">$100/mo</option>
              <option value="250">$250/mo</option>
              <option value="500">$500/mo</option>
              <option value="1000">$1,000/mo</option>
            </MobileFilterSelect>
            <div>
              <ButtonGroup
                label="Garage"
                options={[
                  { label: 'Any', value: '' },
                  { label: '1+', value: '1' },
                  { label: '2+', value: '2' },
                  { label: '3+', value: '3' },
                ]}
                value={filterState.minGarageSpaces}
                onChange={(v) => onFilterChange({ minGarageSpaces: v })}
              />
            </div>
          </div>

          {/* Stories */}
          <ButtonGroup
            label="Stories"
            options={[
              { label: 'Any', value: '' },
              { label: '1', value: '1' },
              { label: '2+', value: '2' },
              { label: '3+', value: '3' },
            ]}
            value={filterState.minStories}
            onChange={(v) => onFilterChange({ minStories: v })}
          />

          {/* Feature pills */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">Features</div>
            <div className="flex flex-wrap gap-2">
              <CheckboxPill label="Pool" checked={filterState.hasPool === 'true'} onChange={(v) => onFilterChange({ hasPool: v ? 'true' : '' })} />
              <CheckboxPill label="Fireplace" checked={filterState.hasFireplace === 'true'} onChange={(v) => onFilterChange({ hasFireplace: v ? 'true' : '' })} />
              <CheckboxPill label="Horse Property" checked={filterState.isHorseProperty === 'true'} onChange={(v) => onFilterChange({ isHorseProperty: v ? 'true' : '' })} />
              <CheckboxPill label="Garage" checked={filterState.hasGarage === 'true'} onChange={(v) => onFilterChange({ hasGarage: v ? 'true' : '' })} />
            </div>
          </div>

          {/* Keyword & Subdivision */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">Keyword Search</div>
            <input
              type="text"
              placeholder="e.g. mountain views, guest house, wine cellar..."
              value={filterState.keyword}
              onChange={(e) => onFilterChange({ keyword: e.target.value })}
              className={`w-full border ${filterState.keyword ? 'border-gold' : 'border-navy/15'} bg-white px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none transition-colors`}
            />
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">Subdivision</div>
            <input
              type="text"
              placeholder="e.g. Desert Mountain, Silverleaf..."
              value={filterState.subdivisionName}
              onChange={(e) => onFilterChange({ subdivisionName: e.target.value })}
              className={`w-full border ${filterState.subdivisionName ? 'border-gold' : 'border-navy/15'} bg-white px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none transition-colors`}
            />
          </div>

          {/* Sort */}
          <MobileFilterSelect label="Sort By" value={filterState.sortBy || 'price_desc'} onChange={(v) => onFilterChange({ sortBy: v })}>
            <option value="price_desc">Price: High to Low</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="newest">Newest</option>
            <option value="dom">Days on Market</option>
            <option value="beds">Most Bedrooms</option>
            <option value="sqft">Largest</option>
            <option value="lot_size">Lot Size</option>
            <option value="price_sqft">Price per Sq Ft</option>
          </MobileFilterSelect>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-navy/10">
          <button
            onClick={onClose}
            className="w-full bg-navy text-white py-3 text-label uppercase tracking-md font-bold hover:bg-gold transition-colors"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile helper
// ---------------------------------------------------------------------------

function MobileFilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border ${value ? 'border-gold' : 'border-navy/15'} bg-white px-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none transition-colors`}
      >
        {children}
      </select>
    </div>
  );
}
