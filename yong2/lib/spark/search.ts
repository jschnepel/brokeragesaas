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

function sparkRecordToListing(r: SparkProperty): Listing {
  const { photos, cover } = extractPhotos(r);
  const listingId = asString(r['ListingId']) ?? asString(r['ListingKey']) ?? '';
  const listingKey = asString(r['ListingKey']) ?? listingId;
  const unparsed = asString(r['UnparsedAddress']) ?? '';
  const community =
    asString(r['SubdivisionName']) ?? asString(r['CityRegion']) ?? asString(r['City']) ?? '';

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
    hasGarage: asInt(r['GarageSpaces']) ? true : false,
    isLuxury: (asNumber(r['ListPrice']) ?? 0) >= 3_000_000,
    publicRemarks: asString(r['PublicRemarks']),
    coverPhotoUrl: cover,
    photos,
    photoUrls: photos.map((url) => ({ url, desc: null })),
    listAgentKey: asString(r['ListAgentMlsId']),
    listAgentName: asString(r['ListAgentFullName']),
    modificationTimestamp: asString(r['ModificationTimestamp']),
  };
}

// ── OData $filter builder ──

function escapeLiteral(s: string): string {
  return s.replace(/'/g, "''");
}

/** Add bbox spatial predicate as an OData WKT polygon. */
function bboxToFilterClause(b: BBox): string {
  // Counter-clockwise outer ring, closed.
  const wkt =
    `POLYGON((${b.minLng} ${b.minLat}, ${b.maxLng} ${b.minLat}, ` +
    `${b.maxLng} ${b.maxLat}, ${b.minLng} ${b.maxLat}, ${b.minLng} ${b.minLat}))`;
  return `geo.intersects(Coordinates, geography'${wkt}')`;
}

function polygonToFilterClause(p: PolygonGeoJSON): string {
  const ring = p.coordinates[0];
  if (!ring || ring.length < 4) return '';
  const wktPoints = ring.map(([lng, lat]) => `${lng} ${lat}`).join(', ');
  return `geo.intersects(Coordinates, geography'POLYGON((${wktPoints}))')`;
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
  const statuses =
    opts.status && opts.status.length > 0
      ? expandStatuses(opts.status)
      : ['Active', 'Pending', 'Active Under Contract'];
  const statusClause = statuses.map((s) => `StandardStatus eq '${escapeLiteral(s)}'`).join(' or ');
  clauses.push(`(${statusClause})`);

  // Spatial — polygon wins over bbox if both present.
  if (opts.polygonGeoJSON) {
    const c = polygonToFilterClause(opts.polygonGeoJSON);
    if (c) clauses.push(c);
  } else if (opts.bbox) {
    clauses.push(bboxToFilterClause(opts.bbox));
  }

  if (typeof opts.priceMin === 'number') {
    clauses.push(`ListPrice ge ${opts.priceMin}`);
  }
  if (typeof opts.priceMax === 'number') {
    clauses.push(`ListPrice le ${opts.priceMax}`);
  }
  if (typeof opts.bedsMin === 'number') {
    clauses.push(`BedroomsTotal ge ${opts.bedsMin}`);
  }

  // Text search — best-effort substring on UnparsedAddress + City + SubdivisionName.
  if (opts.q && opts.q.trim()) {
    const q = escapeLiteral(opts.q.trim());
    clauses.push(
      `(substringof('${q}', UnparsedAddress) ` +
        `or substringof('${q}', City) ` +
        `or substringof('${q}', SubdivisionName))`,
    );
  }

  return clauses.join(' and ');
}

// ── Public API — same shape as lib/listings-search.ts ──

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
  const limit = Math.min(Math.max(opts.limit ?? 60, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);
  const filter = buildSearchFilter(opts);

  // Two Spark calls in parallel. Both go through fetchAllProperties
  // (which uses the env-injected token from next.config.ts env block).
  // IDX opt-out (InternetEntireListingDisplayYN) is enforced via
  // isIdxDisplayable() post-fetch — Spark's OData rejects the field
  // in $filter, so the check has to happen on the response payload.
  const [listingsResult, pinsResult] = await Promise.allSettled([
    (async () => {
      // Over-fetch by 2x so the IDX opt-out drop doesn't shrink the
      // page below the requested size for typical opt-out rates.
      const records = await fetchAllProperties({
        filter,
        top: limit * 2,
        orderby: 'ListPrice desc',
        maxPages: 1,
      });
      return records
        .filter(isIdxDisplayable)
        .map(sparkRecordToListing)
        .slice(offset, offset + limit);
    })(),
    (async () => {
      const records = await fetchAllProperties({
        filter,
        top: 1000,
        orderby: 'ListPrice desc',
        select: PIN_SELECT,
        maxPages: 2,
      });
      const pins: PinPoint[] = [];
      for (const r of records) {
        if (!isIdxDisplayable(r)) continue;
        const p = pinFromRecord(r);
        if (p) pins.push(p);
      }
      return pins;
    })(),
  ]);

  const listings =
    listingsResult.status === 'fulfilled' ? listingsResult.value : [];
  const pins = pinsResult.status === 'fulfilled' ? pinsResult.value : [];

  // Total — best estimate: pin count if it didn't hit the 2000 cap,
  // otherwise we report "2000+" (treated as 2000).
  const total = pins.length;

  if (listingsResult.status === 'rejected') {
    // eslint-disable-next-line no-console
    console.error('[spark/search] listings call failed:', listingsResult.reason);
  }
  if (pinsResult.status === 'rejected') {
    // eslint-disable-next-line no-console
    console.error('[spark/search] pins call failed:', pinsResult.reason);
  }

  return { listings, pins, total };
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
    const pins: PinPoint[] = [];
    for (const r of records) {
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
