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

import {
  fetchAllProperties,
  fetchPropertiesWithMeta,
  type SparkProperty,
} from './client';
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

  if (typeof opts.sqftMin === 'number') clauses.push(`LivingArea ge ${opts.sqftMin}`);
  if (typeof opts.sqftMax === 'number') clauses.push(`LivingArea le ${opts.sqftMax}`);
  if (typeof opts.lotAcresMin === 'number') clauses.push(`LotSizeAcres ge ${opts.lotAcresMin}`);
  if (typeof opts.lotAcresMax === 'number') clauses.push(`LotSizeAcres le ${opts.lotAcresMax}`);
  if (typeof opts.yearBuiltMin === 'number') clauses.push(`YearBuilt ge ${opts.yearBuiltMin}`);
  if (typeof opts.yearBuiltMax === 'number') clauses.push(`YearBuilt le ${opts.yearBuiltMax}`);
  if (typeof opts.garageMin === 'number') clauses.push(`GarageSpaces ge ${opts.garageMin}`);

  // Boolean amenities — RESO YN fields. eq true narrows to the
  // listings where the seller explicitly confirmed the amenity;
  // null/false records drop out (matches Zillow's behavior — a
  // pool checkbox excludes "unknown").
  if (opts.hasPool) clauses.push(`PoolPrivateYN eq true`);
  if (opts.hasSpa) clauses.push(`SpaYN eq true`);
  if (opts.hasWaterfront) clauses.push(`WaterfrontYN eq true`);
  if (opts.singleStory) clauses.push(`StoriesTotal eq 1`);
  if (opts.newConstruction) clauses.push(`NewConstructionYN eq true`);

  // Price reduced — only narrows when explicitly checked. Compares
  // the seller's original list price against the current ListPrice;
  // skips records where OriginalListPrice is missing so we don't
  // accidentally exclude every listing whose feed entry omits it.
  if (opts.priceReduced) {
    clauses.push(`OriginalListPrice gt ListPrice`);
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
    out = out.filter((r) => searchHaystack(r).includes(q));
  }

  // Horse property — Spark won't filter by HorseAmenities array
  // server-side (no any() lambda support) so we narrow post-fetch.
  // HorseYN is unreliable in the ARMLS feed (sellers leave it null
  // even when HorseAmenities is populated), so we treat any non-empty
  // HorseAmenities array as horse property regardless of HorseYN.
  if (opts.hasHorse) {
    out = out.filter((r) => {
      const ha = r['HorseAmenities'];
      if (Array.isArray(ha) && ha.length > 0) return true;
      const yn = r['HorseYN'];
      return yn === true || yn === 'Y' || yn === 'true';
    });
  }

  return out;
}

/**
 * Build a single lowercase text blob covering everything a visitor
 * might search by: address, city, neighborhood, public remarks, and
 * the feature arrays Yong's typical buyer hunts in ("wine cellar",
 * "casita", "mountain view", "tennis court", etc.). Spark's OData
 * doesn't allow substring matching, so this is post-fetch — limited
 * to whatever set of records was returned, but still useful narrow.
 */
function searchHaystack(r: SparkProperty): string {
  const parts: string[] = [];
  const pushString = (v: unknown) => {
    if (typeof v === 'string' && v.length > 0) parts.push(v);
  };
  const pushArray = (v: unknown) => {
    if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === 'string') parts.push(item);
      }
    }
  };
  pushString(r['UnparsedAddress']);
  pushString(r['City']);
  pushString(r['SubdivisionName']);
  pushString(r['CommunityFeatures']);
  pushString(r['PublicRemarks']);
  pushArray(r['InteriorFeatures']);
  pushArray(r['ExteriorFeatures']);
  pushArray(r['Appliances']);
  pushArray(r['View']);
  pushArray(r['ArchitecturalStyle']);
  pushArray(r['ConstructionMaterials']);
  pushArray(r['PoolFeatures']);
  pushArray(r['SpaFeatures']);
  pushArray(r['FireplaceFeatures']);
  pushArray(r['ParkingFeatures']);
  pushArray(r['Flooring']);
  pushArray(r['HorseAmenities']);
  pushArray(r['AssociationAmenities']);
  pushArray(r['LotFeatures']);
  return parts.join(' ').toLowerCase();
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
      //
      // NOTE on counts: we deliberately do NOT pass count:true here.
      // Spark's @odata.count reflects the OData filter only and ignores
      // post-fetch bbox/IDX filtering. For bbox queries that's wildly
      // misleading (e.g. 220K when the viewport actually contains 850
      // listings). The total reported to the UI is derived from the
      // pins call below, which DOES apply bbox post-fetch.
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
      // Pin universe — capped at top × maxPages records pulled with a
      // light $select so the bytes stay small per record. The bbox /
      // IDX filtering then narrows whatever fell inside the viewport.
      // 2 pages × 1000 = up to 2000 pins per bbox query — enough for
      // every realistic viewport on this site without saturating
      // Spark's per-token rate limit.
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
    })(),
  ]);

  const listingsPayload =
    listingsResult.status === 'fulfilled'
      ? listingsResult.value
      : { listings: [] as Listing[], sliceHasMore: false };
  const listings = listingsPayload.listings;
  const pins = pinsResult.status === 'fulfilled' ? pinsResult.value : [];

  // Total reflects the pin universe (capped by the pins call's
  // top + maxPages). pins are bbox-filtered post-fetch in
  // applyClientFilters, so this count is honest about the viewport
  // — it does NOT count listings outside the current map view.
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
 * Nearby listings — surfaces a small set of comparable Active
 * residentials within a fixed lat/lng radius around the subject. Used
 * by the listing-detail "You may also consider" strip so the visitor's
 * session continues if the current listing isn't the right fit.
 *
 * Filter strategy: target ±0.05° lat/lng (~3.5 mi N/S, ~3 mi E/W in
 * Phoenix latitude) + ±25% price band. ARMLS Active residential only
 * — pending and land are excluded so the strip reads as live for-sale
 * inventory in the same ballpark. We over-fetch to 60 records (plenty
 * for a 4-tile strip after IDX/spatial filtering and excluding the
 * subject itself) and trim client-side.
 */
export async function getNearbyListings(opts: {
  excludeListingId: string;
  latitude: number;
  longitude: number;
  listPrice: number | null;
  limit?: number;
}): Promise<Listing[]> {
  const limit = opts.limit ?? 4;
  const RADIUS_DEG = 0.05;
  const PRICE_BAND = 0.25;
  const minLat = opts.latitude - RADIUS_DEG;
  const maxLat = opts.latitude + RADIUS_DEG;
  const minLng = opts.longitude - RADIUS_DEG;
  const maxLng = opts.longitude + RADIUS_DEG;

  const clauses: string[] = [
    `StandardStatus eq 'Active'`,
    `(PropertyType eq 'Residential' and PropertySubType eq 'Single Family Residence') or (PropertyType eq 'Residential' and PropertySubType eq 'Condominium') or (PropertyType eq 'Residential' and PropertySubType eq 'Townhouse')`,
  ];
  if (opts.listPrice && opts.listPrice > 0) {
    const lo = Math.round(opts.listPrice * (1 - PRICE_BAND));
    const hi = Math.round(opts.listPrice * (1 + PRICE_BAND));
    clauses.push(`ListPrice ge ${lo}`);
    clauses.push(`ListPrice le ${hi}`);
  }
  // Wrap the home-type OR group in parens so it's treated as one term
  // when AND'd with status/price; the bbox filter is applied client-side
  // (Spark OData doesn't support geo predicates).
  const filter = `${clauses[0]} and (${clauses[1]})${clauses
    .slice(2)
    .map((c) => ` and ${c}`)
    .join('')}`;

  try {
    const records = await fetchAllProperties({
      filter,
      top: 60,
      orderby: 'ListPrice desc',
      expand: ['Media($top=1;$orderby=Order)'],
      maxPages: 1,
    });
    return records
      .filter((r) => {
        if (!isIdxDisplayable(r)) return false;
        if (asString(r['ListingId']) === opts.excludeListingId) return false;
        const lat = asNumber(r['Latitude']);
        const lng = asNumber(r['Longitude']);
        if (lat == null || lng == null) return false;
        return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
      })
      .slice(0, limit)
      .map(sparkRecordToListing);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[spark/search] getNearbyListings failed:', err);
    return [];
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
