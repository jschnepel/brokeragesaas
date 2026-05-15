/**
 * URL state serialization for /listings.
 *
 * Mirrors the search/filter/sort/view state into URLSearchParams so
 * refresh, back/forward, and shared links all preserve user intent.
 *
 * Encoding choices:
 *   - Arrays  : comma-joined  (status=active,pending)
 *   - Booleans: present-or-absent  (pool=1, omitted when off)
 *   - Ranges  : "min-max"  (price=500000-3000000)
 *   - Polygon : "lng,lat,lng,lat,..." flattened ring
 *   - BBox    : "minLng,minLat,maxLng,maxLat"
 *
 * The URL is the source of truth on page load; ListingsClient seeds
 * its initial state from parsed params. Subsequent state changes
 * call `serializeListingsState` and push to the URL via
 * router.replace, which is a no-op render in Next 16 App Router.
 */

import type {
  BBox,
  HomeType,
  PolygonGeoJSON,
  QField,
  SortKey,
  StatusFilter,
} from './listings-search';
import {
  DEFAULT_ADVANCED_FILTERS,
  DEFAULT_HOME_TYPES,
  DEFAULT_PRICE_RANGE,
  PRICE_MAX,
  PRICE_MIN,
  type AdvancedFilters,
  type BathsFilter,
  type BedsFilter,
  type FilterState,
} from '@/components/listings/FilterChips';

export interface ListingsUrlState {
  q: string;
  qField: QField;
  filters: FilterState;
  sort: SortKey;
  bbox: BBox | null;
  polygon: PolygonGeoJSON | null;
  /** User-selected cities from the autocomplete dropdown. */
  cities: string[];
}

const VALID_QFIELD: QField[] = ['any', 'address', 'community', 'city', 'zip', 'mls'];

// Hard cap on cities the URL will encode — the API zod schema caps at 40,
// so anything higher would just be dropped server-side anyway.
const MAX_URL_CITIES = 40;

const VALID_STATUS: StatusFilter[] = ['Active', 'Coming Soon', 'Pending'];
const VALID_HOME: HomeType[] = ['house', 'condo', 'multi', 'land'];
const VALID_SORT: SortKey[] = [
  'newest',
  'price-asc',
  'price-desc',
  'sqft-desc',
  'lot-desc',
  'year-desc',
  'dom-asc',
];

const STATUS_TO_PARAM: Record<StatusFilter, string> = {
  Active: 'active',
  'Coming Soon': 'coming',
  Pending: 'pending',
};
const PARAM_TO_STATUS: Record<string, StatusFilter> = {
  active: 'Active',
  coming: 'Coming Soon',
  pending: 'Pending',
};

/** Format the price range as "min-max" when non-default, else null. */
function serializePriceRange(range: [number, number]): string | null {
  if (range[0] === PRICE_MIN && range[1] === PRICE_MAX) return null;
  return `${range[0]}-${range[1]}`;
}

function parsePriceRange(s: string | null): [number, number] | null {
  if (!s) return null;
  const m = s.match(/^(\d+)-(\d+)$/);
  if (!m) return null;
  const lo = Math.max(parseInt(m[1], 10), PRICE_MIN);
  const hi = Math.min(parseInt(m[2], 10), PRICE_MAX);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo > hi) return null;
  return [lo, hi];
}

function parseBeds(s: string | null): BedsFilter | null {
  if (!s) return null;
  const n = parseInt(s, 10);
  return n === 3 || n === 4 || n === 5 ? n : null;
}

function parseBaths(s: string | null): BathsFilter | null {
  if (!s) return null;
  const n = parseInt(s, 10);
  return n === 2 || n === 3 || n === 4 || n === 5 ? n : null;
}

function parseBbox(s: string | null): BBox | null {
  if (!s) return null;
  const parts = s.split(',').map((p) => parseFloat(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [minLng, minLat, maxLng, maxLat] = parts;
  if (minLng >= maxLng || minLat >= maxLat) return null;
  return { minLng, minLat, maxLng, maxLat };
}

function serializeBbox(b: BBox | null): string | null {
  if (!b) return null;
  // Round to 5 decimals (~1m precision) so the URL stays short and
  // doesn't churn on sub-meter map pan jitter.
  const fix = (n: number) => Math.round(n * 100000) / 100000;
  return `${fix(b.minLng)},${fix(b.minLat)},${fix(b.maxLng)},${fix(b.maxLat)}`;
}

function parsePolygon(s: string | null): PolygonGeoJSON | null {
  if (!s) return null;
  const nums = s.split(',').map((p) => parseFloat(p));
  if (nums.length < 8 || nums.length % 2 !== 0) return null;
  if (nums.some((n) => !Number.isFinite(n))) return null;
  const ring: number[][] = [];
  for (let i = 0; i < nums.length; i += 2) ring.push([nums[i], nums[i + 1]]);
  // Close the ring if the client didn't already.
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([first[0], first[1]]);
  return { type: 'Polygon', coordinates: [ring] };
}

function serializePolygon(p: PolygonGeoJSON | null): string | null {
  if (!p) return null;
  const ring = p.coordinates[0];
  if (!ring || ring.length < 4) return null;
  // Round to 5 decimals for URL compactness — adequate for ~1m
  // accuracy at Phoenix's latitude.
  const fix = (n: number) => Math.round(n * 100000) / 100000;
  // Drop the closing point — parsePolygon re-closes on read.
  return ring
    .slice(0, ring.length - 1)
    .flatMap(([lng, lat]) => [fix(lng), fix(lat)])
    .join(',');
}

/**
 * Serialize the current ListingsClient state into a URLSearchParams.
 * Default values are OMITTED so a fresh page load with no filters
 * has a clean URL (just `/listings`).
 */
export function serializeListingsState(state: ListingsUrlState): URLSearchParams {
  const sp = new URLSearchParams();

  if (state.q.trim()) sp.set('q', state.q.trim());
  // qField — omit when default 'any' so clean URLs stay clean.
  // Without a `q` we don't bother serializing it either; the field
  // selector only matters in the presence of a text query.
  if (state.q.trim() && state.qField && state.qField !== 'any') {
    sp.set('qf', state.qField);
  }

  if (state.filters.status.length > 0) {
    sp.set('status', state.filters.status.map((s) => STATUS_TO_PARAM[s]).join(','));
  }

  // Only serialize homeTypes when it differs from the default selection.
  const homeTypesNonDefault =
    state.filters.homeTypes.length !== DEFAULT_HOME_TYPES.length ||
    !state.filters.homeTypes.every((t) => DEFAULT_HOME_TYPES.includes(t));
  if (homeTypesNonDefault) {
    sp.set('home', state.filters.homeTypes.join(','));
  }

  const price = serializePriceRange(state.filters.priceRange);
  if (price) sp.set('price', price);

  if (state.filters.bedsMin > 0) sp.set('beds', String(state.filters.bedsMin));
  if (state.filters.bathsMin > 0) sp.set('baths', String(state.filters.bathsMin));

  const adv = state.filters.advanced;
  if (adv.sqftMin || adv.sqftMax) sp.set('sqft', `${adv.sqftMin || 0}-${adv.sqftMax || 0}`);
  if (adv.lotAcresMin || adv.lotAcresMax) sp.set('lot', `${adv.lotAcresMin || 0}-${adv.lotAcresMax || 0}`);
  if (adv.yearBuiltMin || adv.yearBuiltMax) sp.set('year', `${adv.yearBuiltMin || 0}-${adv.yearBuiltMax || 0}`);
  if (adv.garageMin) sp.set('garage', adv.garageMin);

  // Booleans: present-when-true. Compact param names so the URL stays
  // readable for power users sharing links.
  if (adv.hasPool) sp.set('pool', '1');
  if (adv.hasSpa) sp.set('spa', '1');
  if (adv.hasWaterfront) sp.set('water', '1');
  if (adv.hasHorse) sp.set('horse', '1');
  if (adv.singleStory) sp.set('story1', '1');
  if (adv.newConstruction) sp.set('new', '1');
  if (adv.priceReduced) sp.set('reduced', '1');

  // Sort — omit when default ('price-desc').
  if (state.sort && state.sort !== 'price-desc') sp.set('sort', state.sort);

  // Cities — comma-joined. Each city is URL-encoded by URLSearchParams,
  // so spaces in names like "Paradise Valley" survive the round-trip.
  if (state.cities && state.cities.length > 0) {
    const trimmed = state.cities
      .map((c) => c.trim())
      .filter((c) => c.length > 0 && c.length <= 80)
      .slice(0, MAX_URL_CITIES);
    if (trimmed.length > 0) sp.set('cities', trimmed.join(','));
  }

  const bbox = serializeBbox(state.bbox);
  if (bbox) sp.set('bbox', bbox);
  const poly = serializePolygon(state.polygon);
  if (poly) sp.set('poly', poly);

  return sp;
}

/**
 * Parse a URLSearchParams (typically from useSearchParams) into a
 * partial ListingsUrlState. Returns null fields when no params apply
 * so the caller can merge with its own defaults.
 */
export function parseListingsUrl(sp: URLSearchParams): Partial<ListingsUrlState> {
  const out: Partial<ListingsUrlState> = {};

  const q = sp.get('q');
  if (q) out.q = q.slice(0, 200);

  const qfRaw = sp.get('qf');
  if (qfRaw && VALID_QFIELD.includes(qfRaw as QField)) {
    out.qField = qfRaw as QField;
  }

  const statusParam = sp.get('status');
  const homeParam = sp.get('home');
  const price = parsePriceRange(sp.get('price'));
  const beds = parseBeds(sp.get('beds'));
  const baths = parseBaths(sp.get('baths'));
  const sortRaw = sp.get('sort');
  const sort = sortRaw && VALID_SORT.includes(sortRaw as SortKey) ? (sortRaw as SortKey) : null;

  // Parse advanced filters from individual params.
  const adv: AdvancedFilters = { ...DEFAULT_ADVANCED_FILTERS };
  const sqftRange = sp.get('sqft');
  const lotRange = sp.get('lot');
  const yearRange = sp.get('year');
  if (sqftRange) {
    const [lo, hi] = sqftRange.split('-');
    adv.sqftMin = lo && lo !== '0' ? lo : '';
    adv.sqftMax = hi && hi !== '0' ? hi : '';
  }
  if (lotRange) {
    const [lo, hi] = lotRange.split('-');
    adv.lotAcresMin = lo && lo !== '0' ? lo : '';
    adv.lotAcresMax = hi && hi !== '0' ? hi : '';
  }
  if (yearRange) {
    const [lo, hi] = yearRange.split('-');
    adv.yearBuiltMin = lo && lo !== '0' ? lo : '';
    adv.yearBuiltMax = hi && hi !== '0' ? hi : '';
  }
  const garage = sp.get('garage');
  if (garage) adv.garageMin = garage;
  if (sp.get('pool')) adv.hasPool = true;
  if (sp.get('spa')) adv.hasSpa = true;
  if (sp.get('water')) adv.hasWaterfront = true;
  if (sp.get('horse')) adv.hasHorse = true;
  if (sp.get('story1')) adv.singleStory = true;
  if (sp.get('new')) adv.newConstruction = true;
  if (sp.get('reduced')) adv.priceReduced = true;

  // Build filters only if anything URL-driven differs from defaults.
  const status = statusParam
    ? statusParam
        .split(',')
        .map((p) => PARAM_TO_STATUS[p])
        .filter((s): s is StatusFilter => VALID_STATUS.includes(s))
    : null;
  const homeTypes = homeParam
    ? homeParam
        .split(',')
        .filter((t): t is HomeType => VALID_HOME.includes(t as HomeType))
    : null;

  const anyFilterSet =
    status !== null ||
    homeTypes !== null ||
    price !== null ||
    beds !== null ||
    baths !== null ||
    adv.sqftMin !== '' ||
    adv.sqftMax !== '' ||
    adv.lotAcresMin !== '' ||
    adv.lotAcresMax !== '' ||
    adv.yearBuiltMin !== '' ||
    adv.yearBuiltMax !== '' ||
    adv.garageMin !== '' ||
    adv.hasPool ||
    adv.hasSpa ||
    adv.hasWaterfront ||
    adv.hasHorse ||
    adv.singleStory ||
    adv.newConstruction ||
    adv.priceReduced;

  if (anyFilterSet) {
    out.filters = {
      status: status ?? [],
      homeTypes: homeTypes ?? DEFAULT_HOME_TYPES,
      priceRange: price ?? DEFAULT_PRICE_RANGE,
      bedsMin: beds ?? 0,
      bathsMin: baths ?? 0,
      advanced: adv,
    };
  }

  if (sort) out.sort = sort;

  const citiesRaw = sp.get('cities');
  if (citiesRaw) {
    const parsed = citiesRaw
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0 && c.length <= 80)
      .slice(0, MAX_URL_CITIES);
    if (parsed.length > 0) out.cities = parsed;
  }

  const bbox = parseBbox(sp.get('bbox'));
  if (bbox) out.bbox = bbox;
  const poly = parsePolygon(sp.get('poly'));
  if (poly) out.polygon = poly;

  return out;
}

/**
 * Detect whether the parsed state changes any filter/search input
 * (vs the SSR defaults) — used to decide whether to skip the
 * post-hydration re-fetch in ListingsClient. When the URL is bare,
 * we trust the SSR'd payload and avoid a redundant network round-trip.
 */
export function urlHasUserState(sp: URLSearchParams): boolean {
  for (const key of [
    'q', 'qf', 'status', 'home', 'price', 'beds', 'baths',
    'sqft', 'lot', 'year', 'garage',
    'pool', 'spa', 'water', 'horse', 'story1', 'new', 'reduced',
    'cities', 'sort', 'bbox', 'poly',
  ]) {
    if (sp.has(key)) return true;
  }
  return false;
}
