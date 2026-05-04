/**
 * Listings query layer — reads against the real ARMLS-mirror RDS schema.
 *
 * Source: mv_active_listings (the materialized view derived from listing_records,
 * carrying community/region rollups, IDX-display flags, the is_luxury boolean,
 * and a precomputed primary_photo_url + jsonb photo_urls).
 *
 * IDX compliance is enforced on every active query:
 *   is_deleted = FALSE
 *   internet_display_yn = TRUE
 *   standard_status NOT IN ('Closed', 'Expired', 'Withdrawn', 'Canceled')
 *
 * Slug strategy: the MV has no slug column. We derive a URL-safe slug from
 * unparsed_address and append the ARMLS short numeric `listing_id` (e.g.
 * "6934738") as a unique tail. listing_id is unique across mv_active_listings
 * (verified via DB query — listing_key would also work but is a 26-char
 * zero-padded timestamp where every active row ends in "000000", so the
 * trailing-6-chars approach used previously was non-unique). getListingBySlug
 * extracts the trailing all-digits segment and matches WHERE listing_id = $1.
 */

import { query } from './db';
import type { Listing, ListingPhoto } from './types';
import { YONG_REGION_SLUGS, YONG_CITIES } from './yong-markets';

// ── Internal row shape (mv_active_listings columns we read) ──

interface ListingRow {
  listing_key: string;
  listing_id: string;
  standard_status: string;
  unparsed_address: string | null;
  street_number: string | null;
  street_name: string | null;
  street_suffix: string | null;
  city: string | null;
  postal_code: string | null;
  county: string | null;
  subdivision_display: string | null;
  community_slug: string | null;
  community_name: string | null;
  region_slug: string | null;
  region_name: string | null;
  list_price: string | number | null;
  price_per_sqft: string | number | null;
  bedrooms: number | null;
  bathrooms_full: number | null;
  bathrooms_half: number | null;
  bathrooms_total: string | number | null;
  living_area: string | number | null;
  lot_acres: string | number | null;
  lot_sqft: string | number | null;
  year_built: number | null;
  days_on_market: number | null;
  latitude: string | number | null;
  longitude: string | number | null;
  property_type: string | null;
  property_sub_type: string | null;
  has_pool: boolean | null;
  has_fireplace: boolean | null;
  has_garage: boolean | null;
  is_luxury: boolean | null;
  public_remarks: string | null;
  primary_photo_url: string | null;
  photo_urls: unknown;
  list_agent_key: string | null;
  list_agent_name: string | null;
  modification_timestamp: string | null;
}

// ── Helpers ─────────────────────────────────────────

function toNum(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

/**
 * Derive a URL-safe slug from an address. The trailing token is the ARMLS
 * `listing_id` (a short numeric ID that is unique across the active MV) so
 * the slug round-trips: parseListingIdFromSlug(listingSlug(addr, id)) === id.
 */
export function listingSlug(unparsedAddress: string | null, listingId: string): string {
  const base = (unparsedAddress ?? '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const tail = listingId.toLowerCase().replace(/[^a-z0-9]/g, '');
  return base ? `${base}-${tail}` : `listing-${tail}`;
}

/**
 * Extract the trailing all-digits token from a slug — the `listing_id` we
 * appended in `listingSlug`. Returns null if the slug has no numeric tail
 * (e.g. a malformed URL).
 */
export function parseListingIdFromSlug(slug: string): string | null {
  const match = slug.match(/-(\d+)$/);
  return match ? match[1] : null;
}

/**
 * mv_active_listings.photo_urls is jsonb of [{url, desc?, ...}] (verified via
 * direct DB inspection: `[{"url":"https://cdn.photos.sparkplatform.com/az/...-o.jpg","desc":"Front Circle Drive"}]`).
 * pg returns it pre-parsed; we still defensively handle string fallback and
 * the alternative {MediaURL} shape.
 */
function normalizePhotos(raw: unknown): {
  photos: string[];
  photoUrls: ListingPhoto[];
} {
  if (!raw) return { photos: [], photoUrls: [] };
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { photos: [], photoUrls: [] };
    }
  }
  if (!Array.isArray(parsed)) return { photos: [], photoUrls: [] };

  const photoUrls: ListingPhoto[] = [];
  for (const item of parsed) {
    if (typeof item === 'string') {
      photoUrls.push({ url: item, desc: null });
      continue;
    }
    if (item && typeof item === 'object') {
      const o = item as { url?: unknown; MediaURL?: unknown; desc?: unknown };
      const url = typeof o.url === 'string' ? o.url
        : typeof o.MediaURL === 'string' ? o.MediaURL
        : null;
      if (url) {
        photoUrls.push({ url, desc: typeof o.desc === 'string' ? o.desc : null });
      }
    }
  }
  return { photos: photoUrls.map(p => p.url), photoUrls };
}

// ── Mapper ──────────────────────────────────────────

export function listingRowToListing(r: ListingRow): Listing {
  const { photos, photoUrls } = normalizePhotos(r.photo_urls);
  const cover = r.primary_photo_url ?? photos[0] ?? null;
  const community = r.community_name ?? r.subdivision_display ?? r.city ?? '';
  const unparsed = r.unparsed_address ?? '';
  return {
    listingKey: r.listing_key,
    listingId: r.listing_id,
    slug: listingSlug(r.unparsed_address, r.listing_id),
    status: r.standard_status,
    unparsedAddress: unparsed,
    streetNumber: r.street_number,
    streetName: r.street_name,
    streetSuffix: r.street_suffix,
    city: r.city,
    postalCode: r.postal_code,
    county: r.county,
    subdivisionDisplay: r.subdivision_display,
    communitySlug: r.community_slug,
    communityName: r.community_name,
    regionSlug: r.region_slug,
    regionName: r.region_name,
    community,
    listPrice: toNum(r.list_price),
    pricePerSqft: toNum(r.price_per_sqft),
    bedrooms: r.bedrooms ?? null,
    bathroomsFull: r.bathrooms_full ?? null,
    bathroomsHalf: r.bathrooms_half ?? null,
    bathroomsTotal: toNum(r.bathrooms_total),
    livingArea: toNum(r.living_area),
    lotAcres: toNum(r.lot_acres),
    lotSqft: toNum(r.lot_sqft),
    yearBuilt: r.year_built ?? null,
    daysOnMarket: r.days_on_market ?? null,
    latitude: toNum(r.latitude),
    longitude: toNum(r.longitude),
    propertyType: r.property_type,
    propertySubType: r.property_sub_type,
    hasPool: r.has_pool === true,
    hasFireplace: r.has_fireplace === true,
    hasGarage: r.has_garage === true,
    isLuxury: r.is_luxury === true,
    publicRemarks: r.public_remarks,
    coverPhotoUrl: cover,
    photos,
    photoUrls,
    listAgentKey: r.list_agent_key,
    listAgentName: r.list_agent_name,
    modificationTimestamp: r.modification_timestamp,
  };
}

// ── SQL fragments ───────────────────────────────────

const SELECT_COLUMNS = `
  listing_key, listing_id, standard_status,
  unparsed_address, street_number, street_name, street_suffix,
  city, postal_code, county,
  subdivision_display,
  community_slug, community_name, region_slug, region_name,
  list_price, price_per_sqft,
  bedrooms, bathrooms_full, bathrooms_half, bathrooms_total,
  living_area, lot_acres, lot_sqft, year_built, days_on_market,
  latitude, longitude,
  property_type, property_sub_type,
  has_pool, has_fireplace, has_garage, is_luxury,
  public_remarks,
  primary_photo_url, photo_urls,
  list_agent_key, list_agent_name, modification_timestamp
`;

/**
 * IDX-compliance clauses applied to every active surface.
 * Note: mv_active_listings does NOT carry internet_entire_listing_display_yn.
 * The MV's own definition pre-filters on internet_display_yn, but we re-assert
 * for safety.
 */
const IDX_ACTIVE_WHERE = `
  is_deleted = FALSE
  AND internet_display_yn = TRUE
  AND standard_status NOT IN ('Closed', 'Expired', 'Withdrawn', 'Canceled')
`;

/**
 * Yong's market filter — applied to every public listings surface so we never
 * surface rural/out-of-area inventory (Tonopah, Buckeye, etc.) on his website.
 * Matches by region_slug OR city to catch listings with NULL region_slug that
 * are still inside a Yong city. The two array params occupy positions
 * [$startIdx, $startIdx + 1].
 */
function yongMarketWhere(startIdx: number): string {
  return `(region_slug = ANY($${startIdx}::text[]) OR city = ANY($${startIdx + 1}::text[]))`;
}

const YONG_REGION_ARR = YONG_REGION_SLUGS as readonly string[];
const YONG_CITY_ARR = YONG_CITIES as readonly string[];

// ── Query API ───────────────────────────────────────

export interface ActiveListingsParams {
  limit?: number;
  city?: string;
  postalCode?: string;
  /** Match by community_slug (normalized lowercase, e.g. "desert-mountain"). */
  communitySlug?: string;
  isLuxury?: boolean;
}

/**
 * Get active listings, IDX-compliant, filterable, sorted by list_price desc.
 */
export async function getActiveListings(
  params: ActiveListingsParams = {},
): Promise<Listing[]> {
  const { limit = 60, city, postalCode, communitySlug, isLuxury } = params;
  const conds: string[] = [IDX_ACTIVE_WHERE];
  const values: unknown[] = [];
  let i = 1;

  if (city) {
    conds.push(`city ILIKE $${i++}`);
    values.push(city);
  }
  if (postalCode) {
    conds.push(`postal_code = $${i++}`);
    values.push(postalCode);
  }
  if (communitySlug) {
    conds.push(`community_slug = $${i++}`);
    values.push(communitySlug);
  }
  if (isLuxury) {
    conds.push(`is_luxury = TRUE`);
  }

  // Constrain to Yong's actual service area on every public surface.
  conds.push(yongMarketWhere(i));
  values.push(YONG_REGION_ARR, YONG_CITY_ARR);
  i += 2;

  values.push(limit);
  const sql = `
    SELECT ${SELECT_COLUMNS}
    FROM mv_active_listings
    WHERE ${conds.join(' AND ')}
    ORDER BY list_price DESC NULLS LAST
    LIMIT $${i}
  `;
  const { rows } = await query<ListingRow>(sql, values);
  return rows.map(listingRowToListing);
}

/**
 * Featured listings for the homepage strip — top N luxury actives by price.
 *
 * Strategy: filter `is_luxury = TRUE` (a real precomputed column on the MV)
 * and `standard_status = 'Active'`, ORDER BY list_price DESC, LIMIT N.
 * Falls back to the IDX-active set if the luxury query is undersupplied.
 */
export async function getFeaturedListings(limit = 6): Promise<Listing[]> {
  const sql = `
    SELECT ${SELECT_COLUMNS}
    FROM mv_active_listings
    WHERE ${IDX_ACTIVE_WHERE}
      AND is_luxury = TRUE
      AND standard_status = 'Active'
      AND ${yongMarketWhere(2)}
    ORDER BY list_price DESC NULLS LAST
    LIMIT $1
  `;
  const { rows } = await query<ListingRow>(sql, [limit, YONG_REGION_ARR, YONG_CITY_ARR]);
  if (rows.length >= limit) return rows.map(listingRowToListing);

  // Fallback — not luxury-restricted, but still IDX-active and in Yong's market.
  const fbSql = `
    SELECT ${SELECT_COLUMNS}
    FROM mv_active_listings
    WHERE ${IDX_ACTIVE_WHERE}
      AND ${yongMarketWhere(2)}
    ORDER BY list_price DESC NULLS LAST
    LIMIT $1
  `;
  const fb = await query<ListingRow>(fbSql, [limit, YONG_REGION_ARR, YONG_CITY_ARR]);
  return fb.rows.map(listingRowToListing);
}

/** Look up a single listing by ARMLS listing_key. */
export async function getListingByKey(listingKey: string): Promise<Listing | null> {
  const sql = `
    SELECT ${SELECT_COLUMNS}
    FROM mv_active_listings
    WHERE listing_key = $1
      AND ${IDX_ACTIVE_WHERE}
    LIMIT 1
  `;
  const { rows } = await query<ListingRow>(sql, [listingKey]);
  return rows[0] ? listingRowToListing(rows[0]) : null;
}

/**
 * Look up by derived slug. Extracts the trailing numeric `listing_id` token
 * we appended in listingSlug() and matches `WHERE listing_id = $1` (unique
 * across mv_active_listings). Returns null if the slug has no numeric tail
 * or no matching listing exists.
 */
export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const listingId = parseListingIdFromSlug(slug);
  if (!listingId) return null;
  const sql = `
    SELECT ${SELECT_COLUMNS}
    FROM mv_active_listings
    WHERE listing_id = $1
      AND ${IDX_ACTIVE_WHERE}
    LIMIT 1
  `;
  const { rows } = await query<ListingRow>(sql, [listingId]);
  return rows[0] ? listingRowToListing(rows[0]) : null;
}

/**
 * Property-segment SQL fragment. Mirrors mv_community_scorecard's
 * property_segment dimension so the strip count and the scorecard KPI agree.
 *   residential → property_type = 'Residential' (excludes Lease, Land, Comm, etc.)
 *   land        → property_type = 'Land'
 *   all         → no property_type filter
 */
export type PropertySegment = 'residential' | 'land' | 'all';

function propertySegmentWhere(segment: PropertySegment): string {
  switch (segment) {
    case 'residential': return `property_type = 'Residential'`;
    case 'land':        return `property_type = 'Land'`;
    case 'all':         return `TRUE`;
  }
}

/**
 * Active listings within a community — exact match on community_slug.
 * Applies the Yong-market filter for consistency with the other public surfaces
 * and a property_type filter so the rendered tile count matches the scorecard
 * KPI for the same property_segment (default: residential).
 */
export async function getListingsByCommunity(
  communitySlug: string,
  limit = 60,
  segment: PropertySegment = 'residential',
): Promise<Listing[]> {
  const sql = `
    SELECT ${SELECT_COLUMNS}
    FROM mv_active_listings
    WHERE ${IDX_ACTIVE_WHERE}
      AND community_slug = $1
      AND ${propertySegmentWhere(segment)}
      AND ${yongMarketWhere(3)}
    ORDER BY list_price DESC NULLS LAST
    LIMIT $2
  `;
  const { rows } = await query<ListingRow>(sql, [communitySlug, limit, YONG_REGION_ARR, YONG_CITY_ARR]);
  return rows.map(listingRowToListing);
}

/**
 * Active listings within a region — exact match on region_slug. Used for
 * region-scoped community detail pages (e.g. Paradise Valley) where the
 * curated entry has scopeType === 'region' and there is no community_slug
 * value to filter on. Defaults to the residential segment to match the
 * scorecard KPI shown above the strip.
 */
export async function getListingsByRegionSlug(
  regionSlug: string,
  limit = 12,
  segment: PropertySegment = 'residential',
): Promise<Listing[]> {
  const sql = `
    SELECT ${SELECT_COLUMNS}
    FROM mv_active_listings
    WHERE ${IDX_ACTIVE_WHERE}
      AND region_slug = $1
      AND ${propertySegmentWhere(segment)}
      AND ${yongMarketWhere(3)}
    ORDER BY list_price DESC NULLS LAST
    LIMIT $2
  `;
  const { rows } = await query<ListingRow>(sql, [regionSlug, limit, YONG_REGION_ARR, YONG_CITY_ARR]);
  return rows.map(listingRowToListing);
}
