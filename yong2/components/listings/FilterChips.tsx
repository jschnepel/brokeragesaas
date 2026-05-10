'use client';

import { useState } from 'react';
import type { HomeType, StatusFilter } from '@/lib/listings-search';
import { track } from '@/lib/analytics/events';
import { recordPriceFilter } from '@/lib/analytics/contact-payload';
import { PriceRangeSlider } from '@/components/listings/PriceRangeSlider';

export type BedsFilter = 0 | 3 | 4 | 5;
export type BathsFilter = 0 | 2 | 3 | 4 | 5;

/**
 * Continuous price filter — covers Yong's market comfortably (Scottsdale luxury
 * topping out around $20–25M; we leave headroom). The cap doubles as an
 * "open-ended max" — see priceRangeToBounds().
 */
export const PRICE_MIN = 0;
export const PRICE_MAX = 30_000_000;
export const DEFAULT_PRICE_RANGE: [number, number] = [PRICE_MIN, PRICE_MAX];

export type FilterState = {
  status: StatusFilter[];
  homeTypes: HomeType[];
  priceRange: [number, number];
  bedsMin: BedsFilter;
  bathsMin: BathsFilter;
};

const STATUS_OPTIONS: StatusFilter[] = ['Active', 'Coming Soon', 'Pending'];
const BEDS_OPTIONS: { id: BedsFilter; label: string }[] = [
  { id: 0, label: 'Any beds' },
  { id: 3, label: '3+' },
  { id: 4, label: '4+' },
  { id: 5, label: '5+' },
];
const BATHS_OPTIONS: { id: BathsFilter; label: string }[] = [
  { id: 0, label: 'Any baths' },
  { id: 2, label: '2+' },
  { id: 3, label: '3+' },
  { id: 4, label: '4+' },
  { id: 5, label: '5+' },
];
const HOME_TYPE_OPTIONS: { id: HomeType; label: string }[] = [
  { id: 'house', label: 'Houses' },
  { id: 'condo', label: 'Condos / Townhomes' },
  { id: 'multi', label: 'Multi-Family' },
  { id: 'land', label: 'Land / Lots' },
];

/**
 * Default home-type selection on a fresh /listings load. Mirrors
 * Zillow's default — Houses checked, plus Condos because the
 * Scottsdale luxury market has substantial condo inventory in
 * Silverleaf, Camelback, and Paradise Valley. Land / Multi-Family
 * are off by default so vacant lots don't merge into residential
 * results.
 */
export const DEFAULT_HOME_TYPES: HomeType[] = ['house', 'condo'];

/**
 * Translate the slider tuple into the `priceMin`/`priceMax` shape the search
 * API expects. Bottom of range stays open (no priceMin when min === 0); top
 * of range opens out at the cap so "$30M+" doesn't truncate Yong's highest
 * inventory.
 */
export function priceRangeToBounds(range: [number, number]): {
  priceMin?: number;
  priceMax?: number;
} {
  const [min, max] = range;
  const out: { priceMin?: number; priceMax?: number } = {};
  if (min > PRICE_MIN) out.priceMin = min;
  if (max < PRICE_MAX) out.priceMax = max;
  return out;
}

export function isDefaultPriceRange(range: [number, number]): boolean {
  return range[0] === PRICE_MIN && range[1] === PRICE_MAX;
}

type FilterChipsProps = {
  value: FilterState;
  onChange: (next: FilterState) => void;
};

export function FilterChips({ value, onChange }: FilterChipsProps) {
  const [refineOpen, setRefineOpen] = useState(false);

  function toggleStatus(s: StatusFilter) {
    const has = value.status.includes(s);
    track('filter_chip_toggle', { chip: `status:${s}`, on: !has });
    onChange({
      ...value,
      status: has ? value.status.filter((x) => x !== s) : [...value.status, s],
    });
  }

  function selectBeds(b: BedsFilter) {
    if (value.bedsMin === b) return;
    track('filter_chip_toggle', { chip: `beds:${b}`, on: true });
    onChange({ ...value, bedsMin: b });
  }

  function selectBaths(b: BathsFilter) {
    if (value.bathsMin === b) return;
    track('filter_chip_toggle', { chip: `baths:${b}`, on: true });
    onChange({ ...value, bathsMin: b });
  }

  function toggleHomeType(t: HomeType) {
    const has = value.homeTypes.includes(t);
    track('filter_chip_toggle', { chip: `home:${t}`, on: !has });
    onChange({
      ...value,
      homeTypes: has
        ? value.homeTypes.filter((x) => x !== t)
        : [...value.homeTypes, t],
    });
  }

  function handlePriceChange(next: [number, number]) {
    onChange({ ...value, priceRange: next });
    // Lead-score signal: the *minimum* the visitor anchored at is the
    // strongest predictor — buyers shopping above $2M rarely drop the
    // floor. Feed it into the persistent behavior store so the contact
    // form's lead score sees the strongest min the visitor ever held.
    if (next[0] > PRICE_MIN) {
      recordPriceFilter(next[0]);
    }
    // Analytics — single chip-level event on each change so PostHog sees
    // the filter activity. We tag with the bound that moved when knowable;
    // when both moved, label as 'range'.
    track('filter_chip_toggle', {
      chip: `price:${formatRangeChipLabel(next)}`,
      on: !isDefaultPriceRange(next),
    });
  }

  const priceFiltered = !isDefaultPriceRange(value.priceRange);

  return (
    <div className="border-b border-white/10">
      <div className="px-4 md:px-6 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <ChipGroup>
          {STATUS_OPTIONS.map((s) => (
            <Chip key={s} active={value.status.includes(s)} onClick={() => toggleStatus(s)}>
              {s}
            </Chip>
          ))}
        </ChipGroup>
        <span aria-hidden="true" className="hidden md:inline-block w-px h-4 bg-white/10" />
        <ChipGroup>
          {HOME_TYPE_OPTIONS.map((t) => (
            <Chip
              key={t.id}
              active={value.homeTypes.includes(t.id)}
              onClick={() => toggleHomeType(t.id)}
            >
              {t.label}
            </Chip>
          ))}
        </ChipGroup>
        <span aria-hidden="true" className="hidden md:inline-block w-px h-4 bg-white/10" />
        <ChipGroup>
          {BEDS_OPTIONS.map((b) => (
            <Chip
              key={b.id}
              // 0 = "Any beds" (default state). Show as active visually
              // ONLY when a non-default bed minimum is selected — matches
              // the price chip's "Any price" semantics.
              active={value.bedsMin > 0 && value.bedsMin === b.id}
              onClick={() => selectBeds(b.id)}
            >
              {b.label}
            </Chip>
          ))}
        </ChipGroup>
        <span aria-hidden="true" className="hidden md:inline-block w-px h-4 bg-white/10" />
        <ChipGroup>
          {BATHS_OPTIONS.map((b) => (
            <Chip
              key={b.id}
              active={value.bathsMin > 0 && value.bathsMin === b.id}
              onClick={() => selectBaths(b.id)}
            >
              {b.label}
            </Chip>
          ))}
        </ChipGroup>
        <span aria-hidden="true" className="hidden md:inline-block w-px h-4 bg-white/10" />
        <button
          type="button"
          onClick={() => setRefineOpen((v) => !v)}
          aria-expanded={refineOpen}
          aria-controls="listings-price-panel"
          className={`caps px-2.5 py-1 border transition-colors ${
            refineOpen || priceFiltered
              ? 'border-gold text-gold bg-gold/10'
              : 'border-white/10 text-stone/70 hover:border-gold/50 hover:text-stone'
          }`}
        >
          {priceFiltered ? formatRangeChipLabel(value.priceRange) : 'Any price'}
        </button>
      </div>

      <div
        id="listings-price-panel"
        className={`grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
          refineOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 md:px-6 pt-3 pb-5">
            <PriceRangeSlider
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={250_000}
              value={value.priceRange}
              onChange={handlePriceChange}
              minGap={500_000}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatRangeChipLabel(range: [number, number]): string {
  const [lo, hi] = range;
  const loLabel = lo === PRICE_MIN ? 'Any' : compactPrice(lo);
  const hiLabel = hi >= PRICE_MAX ? `${compactPrice(PRICE_MAX)}+` : compactPrice(hi);
  return `${loLabel} – ${hiLabel}`;
}

function compactPrice(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function ChipGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`caps px-2.5 py-1 border transition-colors ${
        active
          ? 'border-gold text-gold bg-gold/10'
          : 'border-white/10 text-stone/70 hover:border-gold/50 hover:text-stone'
      }`}
    >
      {children}
    </button>
  );
}
