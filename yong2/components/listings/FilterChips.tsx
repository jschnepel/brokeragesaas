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

export type AdvancedFilters = {
  /** All numeric values are stored as strings so partial input ("5", "5_") doesn't trip
   *  parseInt mid-keystroke. Resolved to numbers when sent to the API. */
  sqftMin: string;
  sqftMax: string;
  lotAcresMin: string;
  lotAcresMax: string;
  yearBuiltMin: string;
  yearBuiltMax: string;
  garageMin: string;
  hasPool: boolean;
  hasSpa: boolean;
  hasWaterfront: boolean;
  hasHorse: boolean;
  singleStory: boolean;
  newConstruction: boolean;
  priceReduced: boolean;
};

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilters = {
  sqftMin: '',
  sqftMax: '',
  lotAcresMin: '',
  lotAcresMax: '',
  yearBuiltMin: '',
  yearBuiltMax: '',
  garageMin: '',
  hasPool: false,
  hasSpa: false,
  hasWaterfront: false,
  hasHorse: false,
  singleStory: false,
  newConstruction: false,
  priceReduced: false,
};

/**
 * Count of advanced filters currently engaged. Drives the "More
 * filters · 3" badge so the visitor can see at a glance whether
 * something they enabled is hidden behind the disclosure.
 */
export function countActiveAdvanced(adv: AdvancedFilters): number {
  let n = 0;
  if (adv.sqftMin) n += 1;
  if (adv.sqftMax) n += 1;
  if (adv.lotAcresMin) n += 1;
  if (adv.lotAcresMax) n += 1;
  if (adv.yearBuiltMin) n += 1;
  if (adv.yearBuiltMax) n += 1;
  if (adv.garageMin) n += 1;
  if (adv.hasPool) n += 1;
  if (adv.hasSpa) n += 1;
  if (adv.hasWaterfront) n += 1;
  if (adv.hasHorse) n += 1;
  if (adv.singleStory) n += 1;
  if (adv.newConstruction) n += 1;
  if (adv.priceReduced) n += 1;
  return n;
}

export type FilterState = {
  status: StatusFilter[];
  homeTypes: HomeType[];
  priceRange: [number, number];
  bedsMin: BedsFilter;
  bathsMin: BathsFilter;
  advanced: AdvancedFilters;
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
  const [moreOpen, setMoreOpen] = useState(false);

  function patchAdvanced(patch: Partial<AdvancedFilters>) {
    const next = { ...value.advanced, ...patch };
    onChange({ ...value, advanced: next });
    for (const [k, v] of Object.entries(patch)) {
      track('filter_chip_toggle', { chip: `more:${k}`, on: Boolean(v) });
    }
  }

  function toggleAdvancedBool(key: keyof AdvancedFilters) {
    if (typeof value.advanced[key] !== 'boolean') return;
    patchAdvanced({ [key]: !value.advanced[key] } as Partial<AdvancedFilters>);
  }

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
  const advancedCount = countActiveAdvanced(value.advanced);

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
        <span aria-hidden="true" className="hidden md:inline-block w-px h-4 bg-white/10" />
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-controls="listings-more-panel"
          className={`caps px-2.5 py-1 border transition-colors ${
            moreOpen || advancedCount > 0
              ? 'border-gold text-gold bg-gold/10'
              : 'border-white/10 text-stone/70 hover:border-gold/50 hover:text-stone'
          }`}
        >
          More filters{advancedCount > 0 ? ` · ${advancedCount}` : ''}
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

      <div
        id="listings-more-panel"
        className={`grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
          moreOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 md:px-6 pt-4 pb-6 space-y-6">
            {/* Home features — boolean toggles. */}
            <div>
              <p className="caps text-[10px] tracking-widest text-stone/45 mb-3">
                Home features
              </p>
              <ChipGroup>
                <Chip
                  active={value.advanced.hasPool}
                  onClick={() => toggleAdvancedBool('hasPool')}
                >
                  Pool
                </Chip>
                <Chip
                  active={value.advanced.hasSpa}
                  onClick={() => toggleAdvancedBool('hasSpa')}
                >
                  Spa
                </Chip>
                <Chip
                  active={value.advanced.hasWaterfront}
                  onClick={() => toggleAdvancedBool('hasWaterfront')}
                >
                  Waterfront
                </Chip>
                <Chip
                  active={value.advanced.hasHorse}
                  onClick={() => toggleAdvancedBool('hasHorse')}
                >
                  Horse property
                </Chip>
                <Chip
                  active={value.advanced.singleStory}
                  onClick={() => toggleAdvancedBool('singleStory')}
                >
                  Single-story
                </Chip>
                <Chip
                  active={value.advanced.newConstruction}
                  onClick={() => toggleAdvancedBool('newConstruction')}
                >
                  New construction
                </Chip>
                <Chip
                  active={value.advanced.priceReduced}
                  onClick={() => toggleAdvancedBool('priceReduced')}
                >
                  Price reduced
                </Chip>
              </ChipGroup>
            </div>

            <RangeRow
              label="Square feet"
              minValue={value.advanced.sqftMin}
              maxValue={value.advanced.sqftMax}
              minPlaceholder="Min"
              maxPlaceholder="Max"
              onMinChange={(v) => patchAdvanced({ sqftMin: v })}
              onMaxChange={(v) => patchAdvanced({ sqftMax: v })}
            />

            <RangeRow
              label="Lot size (acres)"
              minValue={value.advanced.lotAcresMin}
              maxValue={value.advanced.lotAcresMax}
              minPlaceholder="Min"
              maxPlaceholder="Max"
              onMinChange={(v) => patchAdvanced({ lotAcresMin: v })}
              onMaxChange={(v) => patchAdvanced({ lotAcresMax: v })}
            />

            <RangeRow
              label="Year built"
              minValue={value.advanced.yearBuiltMin}
              maxValue={value.advanced.yearBuiltMax}
              minPlaceholder="Earliest"
              maxPlaceholder="Latest"
              onMinChange={(v) => patchAdvanced({ yearBuiltMin: v })}
              onMaxChange={(v) => patchAdvanced({ yearBuiltMax: v })}
            />

            <div>
              <p className="caps text-[10px] tracking-widest text-stone/45 mb-3">
                Garage spaces
              </p>
              <ChipGroup>
                {[0, 2, 3, 4, 5].map((n) => {
                  const cur = parseInt(value.advanced.garageMin || '0', 10);
                  const id = String(n);
                  return (
                    <Chip
                      key={n}
                      active={n > 0 && cur === n}
                      onClick={() => patchAdvanced({ garageMin: n === 0 ? '' : id })}
                    >
                      {n === 0 ? 'Any' : `${n}+`}
                    </Chip>
                  );
                })}
              </ChipGroup>
            </div>

            {advancedCount > 0 ? (
              <div>
                <button
                  type="button"
                  onClick={() => onChange({ ...value, advanced: DEFAULT_ADVANCED_FILTERS })}
                  className="caps text-[10px] tracking-widest text-stone/55 hover:text-gold transition-colors"
                >
                  Clear advanced filters
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Two-input numeric range. Stored as strings so partial input doesn't
 * trip parseInt mid-keystroke; the parent translates empties to
 * undefined when sending to the API.
 */
function RangeRow({
  label,
  minValue,
  maxValue,
  minPlaceholder,
  maxPlaceholder,
  onMinChange,
  onMaxChange,
}: {
  label: string;
  minValue: string;
  maxValue: string;
  minPlaceholder: string;
  maxPlaceholder: string;
  onMinChange: (next: string) => void;
  onMaxChange: (next: string) => void;
}) {
  const inputClass =
    'w-28 bg-ink-elevated border border-white/10 px-3 py-1.5 text-sm text-stone placeholder:text-stone/30 focus:border-gold focus:outline-none tabular-nums';
  return (
    <div>
      <p className="caps text-[10px] tracking-widest text-stone/45 mb-2">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={minValue}
          placeholder={minPlaceholder}
          onChange={(e) => onMinChange(e.target.value.replace(/[^0-9.]/g, ''))}
          className={inputClass}
          aria-label={`${label} minimum`}
        />
        <span className="text-stone/35 text-sm">–</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={maxValue}
          placeholder={maxPlaceholder}
          onChange={(e) => onMaxChange(e.target.value.replace(/[^0-9.]/g, ''))}
          className={inputClass}
          aria-label={`${label} maximum`}
        />
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
