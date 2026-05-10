/**
 * Spark-backed search for the /listings page (Home Search).
 *
 * Scope: ENTIRE ARMLS Active + Pending inventory (no agent or city
 * filter). The dataset is too large to load into memory (~35-40K
 * records), so all filters are translated to OData $filter and pushed
 * to Spark — same pattern Spark itself recommends for IDX search.
 *
 * Two Spark calls per request:
 *   1. Listings page  — $top=limit, $skip=offset, $count=true (returns total)
 *   2. Pins universe  — $top=2000, $select trimmed to lat/lng/price/status
 *
 * Same return shape as lib/listings-search.ts so the existing
 * /listings page + ListingsClient work unchanged.
 *
 * Text search caveat: OData has no FTS. We approximate with a
 * substring match on UnparsedAddress (handles "10293 Chiricahua"-
 * style address queries; weaker for "silverleaf 5 bedroom" prose).
 * If text-search precision becomes a real ask, we'd add a separate
 * lite-index over UnparsedAddress + SubdivisionName + City.
 */

import { fetchAllProperties, type SparkProperty } from './client';
import type { Listing } from '@/lib/types';
import { listingSlug } from '@/lib/listings';
import type {
  BBox,
  PinPoint,
  PolygonGeoJSON,
  SearchOpts,
  SearchResult,
  StatusFilter,
} from '@/lib/listings-search';

// ── Spark → Listing mapper (small footprint) ──

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}
function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
function asInt(v: unknown): number | null {
  const n = asNumber(v);
  return n != null ? Math.round(n) : null;
}
function asBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
  return false;
}

function extractPhotos(record: SparkProperty): { photos: string[]; cover: string | null } {
  const media = record['Media'];
  if (!Array.isArray(media)) return { photos: [], cover: null };
  const sorted = [...media].sort((a, b) => {
    const ao = (a as { Order?: number })?.Order ?? 0;
    const bo = (b as { Order?: number })?.Order ?? 0;
    return ao - bo;
  });
  const photos: string[] = [];
  for (const item of sorted) {
    if (!item || typeof item !== 'object') continue;
    const m = item as { MediaURL?: unknown; MediaType?: unknown };
    const isImage =
      typeof m.MediaType !== 'string' || m.MediaType.toLowerCase().startsWith('image');
    const url = asString(m.MediaURL);
    if (url && isImage) photos.push(url);
  }
  return { photos, cover: photos[0] ?? null };
}

function derivePricePerSqft(r: SparkProperty): number | null {
  const explicit = asNumber(r['PricePerSquareFoot']);
  if (explicit != null && explicit > 0) return explicit;
  const price = asNumber(r['ListPrice']);
  const area = asNumber(r['LivingArea']);
  if (price != null && area != null && area > 0) return Math.round(price / area);
  return null;
}

/** Best-effort string-array extractor for RESO multi-value fields. */
function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === 'string' && x.length > 0);
  }
  if (typeof v === 'string' && v.length > 0) {
    // RESO sometimes returns comma-separated single-strings.
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function sparkRecordToListing(r: SparkProperty): Listing {
  const { photos, cover } = extractPhotos(r);
  const listingId = asString(r['ListingId']) ?? asString(r['ListingKey']) ?? '';
  const listingKey = asString(r['ListingKey']) ?? listingId;
  const unparsed = asString(r['UnparsedAddress']) ?? '';
  const community =
    asString(r['SubdivisionName']) ?? asString(r['CityRegion']) ?? asString(r['City']) ?? '';
  const garageSpaces = asInt(r['GarageSpaces']);

  return {
    listingKey,
    listingId,
    slug: listingSlug(unparsed, listingId),
    status: asString(r['StandardStatus']) ?? 'Active',
    unparsedAddress: unparsed,
    streetNumber: asString(r['StreetNumber']),
    streetName: asString(r['StreetName']),
    streetSuffix: asString(r['StreetSuffix']),
    city: asString(r['City']),
    postalCode: asString(r['PostalCode']),
    county: asString(r['CountyOrParish']),
    subdivisionDisplay: asString(r['SubdivisionName']),
    communitySlug: null,
    communityName: asString(r['SubdivisionName']),
    regionSlug: null,
    regionName: asString(r['MLSAreaMajor']),
    community,
    listPrice: asNumber(r['ListPrice']),
    pricePerSqft: derivePricePerSqft(r),
    bedrooms: asInt(r['BedroomsTotal']),
    bathroomsFull: asInt(r['BathroomsFull']),
    bathroomsHalf: asInt(r['BathroomsHalf']),
    bathroomsTotal: asNumber(r['BathroomsTotalInteger']) ?? asNumber(r['BathroomsTotalDecimal']),
    livingArea: asNumber(r['LivingArea']),
    lotAcres: asNumber(r['LotSizeAcres']),
    lotSqft: asNumber(r['LotSizeSquareFeet']),
    yearBuilt: asInt(r['YearBuilt']),
    daysOnMarket: asInt(r['DaysOnMarket']) ?? asInt(r['CumulativeDaysOnMarket']),
    latitude: asNumber(r['Latitude']),
    longitude: asNumber(r['Longitude']),
    propertyType: asString(r['PropertyType']),
    propertySubType: asString(r['PropertySubType']),
    hasPool: asBool(r['PoolPrivateYN']),
    hasFireplace: asBool(r['FireplaceYN']),
    hasGarage: garageSpaces ? true : false,
    isLuxury: (asNumber(r['ListPrice']) ?? 0) >= 3_000_000,
    publicRemarks: asString(r['PublicRemarks']),
    coverPhotoUrl: cover,
    photos,
    photoUrls: photos.map((url) => ({ url, desc: null })),
    listAgentKey: asString(r['ListAgentMlsId']),
    listAgentName: asString(r['ListAgentFullName']),
    modificationTimestamp: asString(r['ModificationTimestamp']),

    // ── Rich detail-page fields ─────────────────────────
    originalListPrice: asNumber(r['OriginalListPrice']),
    cumulativeDaysOnMarket: asInt(r['CumulativeDaysOnMarket']),
    storiesTotal: asInt(r['StoriesTotal']),
    fireplacesTotal: asInt(r['FireplacesTotal']),
    garageSpaces,

    architecturalStyle: asStringArray(r['ArchitecturalStyle']),
    constructionMaterials: asStringArray(r['ConstructionMaterials']),
    flooring: asStringArray(r['Flooring']),
    appliances: asStringArray(r['Appliances']),
    interiorFeatures: asStringArray(r['InteriorFeatures']),
    exteriorFeatures: asStringArray(r['ExteriorFeatures']),
    poolFeatures: asStringArray(r['PoolFeatures']),
    spaFeatures: asStringArray(r['SpaFeatures']),
    fireplaceFeatures: asStringArray(r['FireplaceFeatures']),
    parkingFeatures: asStringArray(r['ParkingFeatures']),
    view: asStringArray(r['View']),
    heating: asStringArray(r['Heating']),
    cooling: asStringArray(r['Cooling']),
    windowFeatures: asStringArray(r['WindowFeatures']),
    laundryFeatures: asStringArray(r['LaundryFeatures']),
    lotFeatures: asStringArray(r['LotFeatures']),
    fencing: asStringArray(r['Fencing']),
    vegetation: asStringArray(r['Vegetation']),
    associationAmenities: asStringArray(r['AssociationAmenities']),

    associationName: asString(r['AssociationName']),
    associationFee: asNumber(r['AssociationFee']),
    associationFeeFrequency: asString(r['AssociationFeeFrequency']),
    associationYn: asBool(r['AssociationYN']),

    taxAnnualAmount: asNumber(r['TaxAnnualAmount']),
    taxYear: asInt(r['TaxYear']),
    parcelNumber: asString(r['ParcelNumber']),

    elementarySchool: asString(r['ElementarySchool']),
    middleOrJuniorSchool: asString(r['MiddleOrJuniorSchool']),
    highSchool: asString(r['HighSchool']),
    highSchoolDistrict: asString(r['HighSchoolDistrict']),

    listOfficeName: asString(r['ListOfficeName']),
    listOfficePhone: asString(r['ListOfficePhone']),
    listAgentDirectPhone: asString(r['ListAgentDirectPhone']),

    hasSpa: asBool(r['SpaYN']),
    hasWaterfront: asBool(r['WaterfrontYN']),
  };
}

// ── OData $filter builder ──

function escapeLiteral(s: string): string {
  return s.replace(/'/g, "''");
}

function expandStatuses(filter: StatusFilter[]): string[] {
  const out = new Set<string>();
  for (const s of filter) {
    out.add(s);
    if (s === 'Pending') out.add('Active Under Contract');
  }
  return Array.from(out);
}

/**
 * Build the OData $filter for a search request. Defaults to
 * Active+Pending+ActiveUnderContract when no status is provided,
 * matching the IDX-active baseline.
 *
 * @compliance IDX (ARMLS): The InternetEntireListingDisplayYN field
 *   is required by ARMLS rules to be respected (sellers can opt out
 *   of IDX display; surfacing an opted-out listing is a violation
 *   ~$21K/occurrence). Spark's OData API rejects this field in
 *   $filter (verified build #61: 400 "field does not exist"), same
 *   reason platform's rlsir-active-snapshot Lambda doesn't filter it
 *   server-side either. The check happens post-fetch in
 *   sparkRecordToListing — records where InternetEntireListingDisplayYN
 *   is false are dropped from the result set.
 */
function buildSearchFilter(opts: SearchOpts): string {
  const clauses: string[] = [];

  // Status filter — defaults to all IDX-active variants if unset.
  // Status, price, beds are confirmed Spark-queryable.
  const statuses =
    opts.status && opts.status.length > 0
      ? expandStatuses(opts.status)
      : ['Active', 'Pending', 'Active Under Contract'];
  const statusClause = statuses.map((s) => `StandardStatus eq '${escapeLiteral(s)}'`).join(' or ');
  clauses.push(`(${statusClause})`);

  if (typeof opts.priceMin === 'number') {
    clauses.push(`ListPrice ge ${opts.priceMin}`);
  }
  if (typeof opts.priceMax === 'number') {
    clauses.push(`ListPrice le ${opts.priceMax}`);
  }
  if (typeof opts.bedsMin === 'number') {
    clauses.push(`BedroomsTotal ge ${opts.bedsMin}`);
  }

  if (typeof opts.bathsMin === 'number') {
    clauses.push(`BathroomsTotalInteger ge ${opts.bathsMin}`);
  }

  // Home Type — translates the visitor's Zillow-style buckets to
  // ARMLS PropertyType + PropertySubType clauses.
  //
  // The IMPORTANT subtle bit: ARMLS uses PropertyType='Residential'
  // for FOR-SALE residential and PropertyType='Residential Lease' for
  // rentals. Filtering on PropertySubType alone returns both, so we
  // anchor 'house'/'condo' to PropertyType='Residential' to exclude
  // rentals from a for-sale search.
  //
  // Spark's OData parser caps parenthesis nesting at 2 levels deep, so
  // we distribute the PropertyType anchor through each PropertySubType
  // branch rather than nesting one level deeper. Builds:
  //   (PropertyType eq 'Residential' and PropertySubType eq 'X')
  //     or (PropertyType eq 'Residential' and PropertySubType eq 'Y')
  //     or PropertyType eq 'Land'
  if (opts.homeTypes && opts.homeTypes.length > 0) {
    const residentialSubTypes: string[] = [];
    const standalonePropTypes: string[] = [];
    for (const t of opts.homeTypes) {
      if (t === 'house') {
        residentialSubTypes.push('Single Family Residence');
      } else if (t === 'condo') {
        residentialSubTypes.push('Condominium', 'Townhouse', 'Apartment');
      } else if (t === 'multi') {
        standalonePropTypes.push('Residential Income');
      } else if (t === 'land') {
        standalonePropTypes.push('Land');
      }
    }
    const branches: string[] = [];
    for (const s of residentialSubTypes) {
      branches.push(
        `(PropertyType eq 'Residential' and PropertySubType eq '${escapeLiteral(s)}')`,
      );
    }
    for (const p of standalonePropTypes) {
      branches.push(`PropertyType eq '${escapeLiteral(p)}'`);
    }
    if (branches.length > 0) {
      clauses.push(`(${branches.join(' or ')})`);
    }
  }

  // Spatial filtering (bbox/polygon) and text search (substringof) are
  // applied post-fetch in applyClientFilters() — Spark's OData rejects
  // `geo.intersects` and `substringof` (verified build #62 → 400 'field
  // does not exist'). The platform's rlsir-active-snapshot Lambda hits
  // the same constraint, which is why it doesn't filter spatially in
  // OData either. We over-fetch, then narrow client-side.

  return clauses.join(' and ');
}

/**
 * Post-fetch narrow: bbox/polygon spatial check + text-search substring
 * match. Equivalent semantics to the OData clauses we used to send,
 * but applied to the response payload because Spark's $filter rejects
 * spatial + substring functions.
 */
function applyClientFilters(records: SparkProperty[], opts: SearchOpts): SparkProperty[] {
  let out = records;

  if (opts.polygonGeoJSON) {
    const ring = opts.polygonGeoJSON.coordinates[0];
    if (ring && ring.length >= 4) {
      out = out.filter((r) => {
        const lat = asNumber(r['Latitude']);
        const lng = asNumber(r['Longitude']);
        if (lat == null || lng == null) return false;
        return pointInPolygon(lng, lat, ring);
      });
    }
  } else if (opts.bbox) {
    const b = opts.bbox;
    out = out.filter((r) => {
      const lat = asNumber(r['Latitude']);
      const lng = asNumber(r['Longitude']);
      if (lat == null || lng == null) return false;
      return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
    });
  }

  if (opts.q && opts.q.trim()) {
    const q = opts.q.trim().toLowerCase();
    out = out.filter((r) => {
      const ua = asString(r['UnparsedAddress']) ?? '';
      const city = asString(r['City']) ?? '';
      const sub = asString(r['SubdivisionName']) ?? '';
      return (
        ua.toLowerCase().includes(q) ||
        city.toLowerCase().includes(q) ||
        sub.toLowerCase().includes(q)
      );
    });
  }

  return out;
}

function pointInPolygon(x: number, y: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ── Public API — same shape as lib/listings-search.ts ──

/**
 * Per-Lambda-instance result cache. 60s TTL — Spark hourly refresh
 * gives plenty of headroom, and this absorbs traffic spikes without
 * tripping Spark's per-token rate limit (429 "exceeds performance
 * threshold"). Keyed on full SearchOpts JSON.
 */
const SEARCH_CACHE_TTL_MS = 60_000;
const searchCache = new Map<string, { at: number; promise: Promise<SearchResult> }>();

function searchCacheKey(opts: SearchOpts): string {
  // Stable key: omits identity-irrelevant fields, sorts keys.
  return JSON.stringify(opts, Object.keys(opts).sort());
}

/**
 * Pin record fields — minimal $select for the map's GeoJSON source.
 * Excludes Media (huge per record) and remarks/details.
 */
const PIN_SELECT = [
  'ListingKey',
  'ListingId',
  'UnparsedAddress',
  'Latitude',
  'Longitude',
  'ListPrice',
  'StandardStatus',
];

function pinFromRecord(r: SparkProperty): PinPoint | null {
  const lat = asNumber(r['Latitude']);
  const lng = asNumber(r['Longitude']);
  if (lat == null || lng == null) return null;
  const listingId = asString(r['ListingId']) ?? asString(r['ListingKey']) ?? '';
  const listingKey = asString(r['ListingKey']) ?? listingId;
  return {
    listingKey,
    listingId,
    slug: listingSlug(asString(r['UnparsedAddress']) ?? '', listingId),
    latitude: lat,
    longitude: lng,
    listPrice: asNumber(r['ListPrice']),
    status: asString(r['StandardStatus']) ?? 'Active',
  };
}

export async function searchListings(opts: SearchOpts = {}): Promise<SearchResult> {
  // Cache check first — every visitor for the same query in a 60s
  // window shares one Spark round-trip. Critical for cold-start UX
  // (cold Lambda + cold Spark = 2-4s; warm cache = <100ms).
  const cacheKey = searchCacheKey(opts);
  const now = Date.now();
  const cached = searchCache.get(cacheKey);
  if (cached && now - cached.at < SEARCH_CACHE_TTL_MS) {
    return cached.promise;
  }

  const promise = doSearchListings(opts);
  searchCache.set(cacheKey, { at: now, promise });
  // Evict the cache entry on rejection so next call can retry fresh.
  promise.catch(() => searchCache.delete(cacheKey));
  return promise;
}

async function doSearchListings(opts: SearchOpts): Promise<SearchResult> {
  const limit = Math.min(Math.max(opts.limit ?? 60, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);
  const filter = buildSearchFilter(opts);

  // Pagination strategy: fetch exactly enough Spark pages to cover the
  // requested offset+limit window, plus one extra record so we can tell
  // whether more results exist beyond the slice (drives hasMore). No
  // upper cap — the auditor scrolling /listings should be able to walk
  // the entire active inventory via Load More. Spark's nextLink chain
  // is followed by fetchAllProperties; cost scales linearly with the
  // depth a visitor actually scrolls.
  const PAGE_SIZE = 250;
  const pagesNeeded = Math.max(
    Math.ceil((offset + limit + 1) / PAGE_SIZE),
    1,
  );

  // Two Spark calls in parallel. Both go through fetchAllProperties
  // (which uses the env-injected token from next.config.ts env block).
  // IDX opt-out (InternetEntireListingDisplayYN) is enforced via
  // isIdxDisplayable() post-fetch — Spark's OData rejects the field
  // in $filter, so the check has to happen on the response payload.
  const [listingsResult, pinsResult] = await Promise.allSettled([
    (async () => {
      // Fetch enough Spark pages to cover offset+limit+1 records.
      //
      // \$expand=Media inflates ~30x when unbounded — past attempts
      // tripped Spark's per-token rate limit (429 "exceeds performance
      // threshold"). The nested OData option `Media(\$top=1;\$orderby=Order)`
      // limits the expansion to just the primary cover photo, bringing
      // payload back to ~1.05x while still giving the cards an image.
      // The detail page (getListingBySlug) keeps the unbounded expand
      // since it needs the full gallery for one record.
      const records = await fetchAllProperties({
        filter,
        top: PAGE_SIZE,
        orderby: 'ListPrice desc',
        expand: ['Media($top=1;$orderby=Order)'],
        maxPages: pagesNeeded,
      });
      const pool = applyClientFilters(records, opts)
        .filter(isIdxDisplayable);
      // hasMore is true when the filtered pool extends beyond the
      // requested slice — i.e., another Load More click would return
      // additional listings. Derived here (not from `pins.length`) so
      // pagination is decoupled from the pin-universe cap and scales
      // with whatever Spark's nextLink chain returns.
      const sliceHasMore = pool.length > offset + limit;
      const sliced = pool.slice(offset, offset + limit).map(sparkRecordToListing);
      return { listings: sliced, sliceHasMore };
    })(),
    (async () => {
      const records = await fetchAllProperties({
        filter,
        top: 1000,
        orderby: 'ListPrice desc',
        select: PIN_SELECT,
        maxPages: 1,
      });
      const filtered = applyClientFilters(records, opts);
      const pins: PinPoint[] = [];
      for (const r of filtered) {
        if (!isIdxDisplayable(r)) continue;
        const p = pinFromRecord(r);
        if (p) pins.push(p);
      }
      return pins;
    })(),
  ]);

  const listingsPayload =
    listingsResult.status === 'fulfilled'
      ? listingsResult.value
      : { listings: [] as Listing[], sliceHasMore: false };
  const listings = listingsPayload.listings;
  const pins = pinsResult.status === 'fulfilled' ? pinsResult.value : [];

  // Total reflects the pin universe (capped at the pins call's
  // `top: 1000`). When the auditor walks past 1000 listings via Load
  // More, total may underestimate but the Load More affordance keeps
  // working because hasMore is derived from the listings pool, not
  // total.
  const total = pins.length;
  const fetchedAt = new Date().toISOString();

  if (listingsResult.status === 'rejected') {
    // eslint-disable-next-line no-console
    console.error('[spark/search] listings call failed:', listingsResult.reason);
  }
  if (pinsResult.status === 'rejected') {
    // eslint-disable-next-line no-console
    console.error('[spark/search] pins call failed:', pinsResult.reason);
  }

  return {
    listings,
    pins,
    total,
    hasMore: listingsPayload.sliceHasMore,
    fetchedAt,
  };
}

/**
 * Resolve a slug → single Listing via direct ListingId lookup.
 * The slug ends in the ARMLS listing_id (digits); we match exactly,
 * then fall through to a substring scan if not found.
 *
 * @compliance IDX: respects InternetEntireListingDisplayYN — Spark's
 *   OData rejects this field in $filter, so we check the response
 *   field after fetch and return null if the seller has opted out.
 */
export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const match = slug.match(/-(\d+)$/);
  const listingId = match ? match[1] : null;
  if (!listingId) return null;

  try {
    const records = await fetchAllProperties({
      filter: `ListingId eq '${escapeLiteral(listingId)}'`,
      top: 1,
      expand: ['Media'],
      maxPages: 1,
    });
    if (records.length === 0) return null;
    if (!isIdxDisplayable(records[0])) return null;
    return sparkRecordToListing(records[0]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[spark/search] getListingBySlug failed:', err);
    return null;
  }
}

/**
 * IDX opt-out check. ARMLS sellers can flag a listing with
 * InternetEntireListingDisplayYN=false to suppress public IDX display.
 * We must drop those records before rendering.
 *
 * @compliance IDX (ARMLS): mandatory respect of seller opt-out.
 */
function isIdxDisplayable(r: SparkProperty): boolean {
  const v = r['InternetEntireListingDisplayYN'];
  // Default-allow only when the field is absent — Spark sometimes omits
  // it from the response payload. When present it must be truthy.
  if (v === undefined || v === null) return true;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'y' || v.toLowerCase() === 'true';
  return Boolean(v);
}

export async function searchListingPins(opts: SearchOpts = {}): Promise<PinPoint[]> {
  const filter = buildSearchFilter(opts);
  try {
    const records = await fetchAllProperties({
      filter,
      top: 1000,
      orderby: 'ListPrice desc',
      select: PIN_SELECT,
      maxPages: 2,
    });
    const filtered = applyClientFilters(records, opts);
    const pins: PinPoint[] = [];
    for (const r of filtered) {
      if (!isIdxDisplayable(r)) continue;
      const p = pinFromRecord(r);
      if (p) pins.push(p);
    }
    return pins;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[spark/search] searchListingPins failed:', err);
    return [];
  }
}
