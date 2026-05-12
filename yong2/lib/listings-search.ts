/**
 * Listings search — fuzzy text + geofence + viewport queries against
 * mv_active_listings. Powers /listings (the full active IDX inventory
 * scoped to Yong's service area).
 *
 * Schema verified 2026-04-24 via pg_attribute:
 *   search_vector  tsvector   (FTS over address/city/community/remarks)
 *   geometry       geometry   SRID 4326 (Point)
 *
 * IDX-compliance and the Yong-market filter (region_slug + city allowlist)
 * are enforced on every query, identical to lib/listings.ts. PostgreSQL FTS
 * uses plainto_tsquery('english') so users can paste plain phrases like
 * "silverleaf 5 bedroom" without worrying about boolean operators.
 *
 * Two surfaces:
 *   searchListings()      — full Listing rows (capped, paginated). Drives the
 *                           results panel.
 *   searchListingPins()   — lat/lng + listing_key/id/price/status only. Drives
 *                           the map's clustered GeoJSON source. ~1/10th the
 *                           payload of full rows so we can stream up to 2000
 *                           pins to the map without blowing the wire.
 */

import { query } from './db';
import { listingRowToListing } from './listings';
import type { Listing } from './types';
import { YONG_REGION_SLUGS, YONG_CITIES } from './yong-markets';

const YONG_REGION_ARR = YONG_REGION_SLUGS as readonly string[];
const YONG_CITY_ARR = YONG_CITIES as readonly string[];

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

const IDX_ACTIVE_WHERE = `
  is_deleted = FALSE
  AND internet_display_yn = TRUE
  AND standard_status NOT IN ('Closed', 'Expired', 'Withdrawn', 'Canceled')
`;

// ── Public types ────────────────────────────────────

export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

/** Subset of GeoJSON.Polygon — keeps the lib zero-dep on @types/geojson. */
export interface PolygonGeoJSON {
  type: 'Polygon';
  coordinates: number[][][];
}

export type StatusFilter = 'Active' | 'Coming Soon' | 'Pending';

/**
 * Home Type — the visitor-facing "kind of property" filter.
 *
 * Zillow's home-type taxonomy collapsed to four buckets that map
 * cleanly to ARMLS's RESO PropertyType + PropertySubType. Land is
 * intentionally a peer to Houses/Condos so vacant lots don't merge
 * into residential search results.
 */
export type HomeType = 'house' | 'condo' | 'multi' | 'land';

/**
 * Sort key for the search result set. Drives the OData `$orderby` so
 * the entire matching pool is ordered — not just the 60 listings
 * currently rendered. Without server-side sort, "Price · Low → High"
 * means "cheapest of the first 60 by ListPrice desc" which is the
 * wrong mental model.
 *
 * Keep aligned with `SortKey` in components/listings/SearchBar.tsx.
 */
export type SortKey =
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'sqft-desc'
  | 'lot-desc'
  | 'year-desc'
  | 'dom-asc';

export interface SearchOpts {
  q?: string;
  bbox?: BBox;
  polygonGeoJSON?: PolygonGeoJSON;
  status?: StatusFilter[];
  /**
   * Selected home types. Empty/undefined = no home-type filter applied
   * (returns the full pool). The /listings UI defaults to
   * ['house', 'condo'] so the canonical search page no longer mixes
   * vacant land into residential results.
   */
  homeTypes?: HomeType[];
  priceMin?: number;
  priceMax?: number;
  bedsMin?: number;
  bathsMin?: number;
  /** Living area (interior heated sqft) min/max. */
  sqftMin?: number;
  sqftMax?: number;
  /** Lot size in acres. */
  lotAcresMin?: number;
  lotAcresMax?: number;
  /** Year built range. */
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  /** Minimum garage spaces (covered or attached). */
  garageMin?: number;
  /** Boolean amenity filters. True = require, undefined = don't filter. */
  hasPool?: boolean;
  hasSpa?: boolean;
  hasWaterfront?: boolean;
  /** Horse property — narrows to listings with HorseAmenities recorded. */
  hasHorse?: boolean;
  /** Single-story homes only (no upstairs / multi-level). */
  singleStory?: boolean;
  /** New construction — NewConstructionYN eq true. */
  newConstruction?: boolean;
  /** "Price reduced" — original list price > current. */
  priceReduced?: boolean;
  /** Hard-capped at 200 internally to keep response payloads bounded. */
  limit?: number;
  offset?: number;
  /**
   * Sort order applied to the entire matching pool. Pushed into the
   * upstream `$orderby` so the offset/cursor paginate a stably-ordered
   * set. Defaults to 'price-desc' when omitted — preserves the prior
   * luxury-first behavior for callers that don't specify sort.
   */
  sort?: SortKey;
  /**
   * Cursor for keyset pagination — opaque token returned in the
   * previous response's `nextCursor`. When present, supersedes
   * `offset`; the underlying pool is filtered to records strictly
   * after the cursor. Stable across pool reorderings because the
   * cursor encodes the sort-key value + listingKey tiebreaker.
   */
  cursor?: string;
}

export interface PinPoint {
  listingKey: string;
  listingId: string;
  slug: string;
  latitude: number;
  longitude: number;
  listPrice: number | null;
  status: string;
  /** Light surface for the map hover popup — without these, pins outside the
   *  currently-loaded listings window fall back to a minimal price-only popup. */
  unparsedAddress?: string | null;
  community?: string | null;
  bedrooms?: number | null;
  bathroomsTotal?: number | null;
  livingArea?: number | null;
  coverPhotoUrl?: string | null;
}

export interface SearchResult {
  listings: Listing[];
  pins: PinPoint[];
  total: number;
  /**
   * True when there are more listings beyond `listings.length + offset`
   * in the matching pool. Drives the Load More affordance on the
   * results panel.
   */
  hasMore: boolean;
  /**
   * ISO timestamp of when this result was fetched from the upstream
   * data source. Drives the IDX freshness label — needs to reflect
   * data-source recency, not the newest modificationTimestamp in the
   * result set (which can be hours/days old for slow-churn luxury
   * inventory). Fields below e.g. 'fetchedAt' should be set on every
   * successful fetch; cached re-reads should keep their original value.
   */
  fetchedAt: string;
  /**
   * Opaque pagination cursor — the client passes this back as
   * `cursor` on the next request to fetch the page after this one.
   * Null when `hasMore` is false. Stable across pool reorderings:
   * encodes the sort-key value + listingKey tiebreaker of the LAST
   * record in this response.
   */
  nextCursor?: string | null;
}

// ── Internal: shared WHERE builder ──────────────────

interface BuiltWhere {
  conds: string[];
  values: unknown[];
  /** Next available `$N` placeholder index. */
  nextIdx: number;
}

/**
 * Build the shared filter clauses (IDX, Yong market, search opts). Both
 * `searchListings` and `searchListingPins` apply the same predicate so the
 * pins set always corresponds to the result rows the user is browsing.
 */
function buildWhere(opts: SearchOpts): BuiltWhere {
  const conds: string[] = [IDX_ACTIVE_WHERE];
  const values: unknown[] = [];
  let i = 1;

  // Fuzzy text — Postgres FTS via the precomputed tsvector column.
  if (opts.q && opts.q.trim().length > 0) {
    conds.push(`search_vector @@ plainto_tsquery('english', $${i++})`);
    values.push(opts.q.trim());
  }

  // Bounding-box viewport sync. ST_MakeEnvelope arg order is
  // (minLng, minLat, maxLng, maxLat, srid). The geometry column is SRID 4326.
  if (opts.bbox && !opts.polygonGeoJSON) {
    conds.push(`geometry && ST_MakeEnvelope($${i}, $${i + 1}, $${i + 2}, $${i + 3}, 4326)`);
    values.push(opts.bbox.minLng, opts.bbox.minLat, opts.bbox.maxLng, opts.bbox.maxLat);
    i += 4;
  }

  // Polygon geofence — wins over bbox if both are provided. Send as text
  // so we don't need a jsonb column in the query plan; ST_GeomFromGeoJSON
  // accepts a JSON-encoded string.
  if (opts.polygonGeoJSON) {
    conds.push(`geometry IS NOT NULL AND ST_Intersects(geometry, ST_SetSRID(ST_GeomFromGeoJSON($${i++}), 4326))`);
    values.push(JSON.stringify(opts.polygonGeoJSON));
  }

  // Status filter. Treat "Pending" as { Pending OR Active Under Contract }
  // to match how /portfolio's filter pills group those statuses.
  if (opts.status && opts.status.length > 0) {
    const expanded: string[] = [];
    for (const s of opts.status) {
      if (s === 'Pending') {
        expanded.push('Pending', 'Active Under Contract');
      } else {
        expanded.push(s);
      }
    }
    conds.push(`standard_status = ANY($${i++}::text[])`);
    values.push(expanded);
  }

  if (typeof opts.priceMin === 'number') {
    conds.push(`list_price >= $${i++}`);
    values.push(opts.priceMin);
  }
  if (typeof opts.priceMax === 'number') {
    conds.push(`list_price <= $${i++}`);
    values.push(opts.priceMax);
  }
  if (typeof opts.bedsMin === 'number') {
    conds.push(`bedrooms >= $${i++}`);
    values.push(opts.bedsMin);
  }

  // Yong market filter — last so any earlier opt-driven indices are stable.
  conds.push(`(region_slug = ANY($${i}::text[]) OR city = ANY($${i + 1}::text[]))`);
  values.push(YONG_REGION_ARR, YONG_CITY_ARR);
  i += 2;

  return { conds, values, nextIdx: i };
}

// ── Public API ──────────────────────────────────────

/**
 * Search active listings. Returns full Listing rows + pins + total count.
 *
 * @param opts.limit  Hard-capped at 200 to keep payload bounded.
 * @param opts.offset Honored for paginating the result list.
 */
export async function searchListings(opts: SearchOpts = {}): Promise<SearchResult> {
  const limit = Math.min(Math.max(opts.limit ?? 60, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);

  const { conds, values, nextIdx } = buildWhere(opts);
  const limitIdx = nextIdx;
  const offsetIdx = nextIdx + 1;

  const sql = `
    SELECT ${SELECT_COLUMNS},
           COUNT(*) OVER() AS total_count
    FROM mv_active_listings
    WHERE ${conds.join(' AND ')}
    ORDER BY list_price DESC NULLS LAST, listing_id ASC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;
  const allValues = [...values, limit, offset];

  // Listings + total via a window function.
  type Row = Parameters<typeof listingRowToListing>[0] & { total_count: string | number };
  const { rows } = await query<Row>(sql, allValues);

  const listings = rows.map((r) => listingRowToListing(r));
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

  // Pins query runs in parallel-ish — separate call, but we await it here so
  // the shape returned is one consistent SearchResult.
  const pins = await searchListingPins(opts);

  const hasMore = offset + listings.length < total;
  return {
    listings,
    pins,
    total,
    hasMore,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Lighter parallel function — returns lat/lng + minimal context for every
 * listing matching `opts`, capped at 2000. Drives the map's GeoJSON pin
 * source. Skips offset (pin set is the universe of matches).
 */
export async function searchListingPins(opts: SearchOpts = {}): Promise<PinPoint[]> {
  const PIN_CAP = 2000;
  const { conds, values, nextIdx } = buildWhere(opts);

  const sql = `
    SELECT listing_key, listing_id, unparsed_address,
           latitude, longitude, list_price, standard_status
    FROM mv_active_listings
    WHERE ${conds.join(' AND ')}
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
    ORDER BY list_price DESC NULLS LAST
    LIMIT $${nextIdx}
  `;
  const allValues = [...values, PIN_CAP];

  interface PinRow {
    listing_key: string;
    listing_id: string;
    unparsed_address: string | null;
    latitude: string | number | null;
    longitude: string | number | null;
    list_price: string | number | null;
    standard_status: string;
  }
  const { rows } = await query<PinRow>(sql, allValues);

  return rows.map((r): PinPoint => {
    const lat = typeof r.latitude === 'string' ? parseFloat(r.latitude) : (r.latitude ?? 0);
    const lng = typeof r.longitude === 'string' ? parseFloat(r.longitude) : (r.longitude ?? 0);
    const price = r.list_price == null
      ? null
      : typeof r.list_price === 'string' ? parseFloat(r.list_price) : r.list_price;
    return {
      listingKey: r.listing_key,
      listingId: r.listing_id,
      // Slug derived inline via the same rule lib/listings.ts uses, to avoid
      // a circular import. Keep this in sync if listingSlug() ever changes.
      slug: derivePinSlug(r.unparsed_address, r.listing_id),
      latitude: lat,
      longitude: lng,
      listPrice: price,
      status: r.standard_status,
    };
  });
}

function derivePinSlug(unparsedAddress: string | null, listingId: string): string {
  const base = (unparsedAddress ?? '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const tail = listingId.toLowerCase().replace(/[^a-z0-9]/g, '');
  return base ? `${base}-${tail}` : `listing-${tail}`;
}
