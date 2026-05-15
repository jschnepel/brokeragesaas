/**
 * Listings search — shared types + the RDS-backed city aggregation
 * query for the /listings autocomplete.
 *
 * The actual search execution path moved to `lib/spark/search.ts` (Spark
 * OData) — this file used to host an RDS query against `mv_active_listings`
 * but that MV was dropped in the dbt cutover. The search engine has lived
 * exclusively in lib/spark/search.ts since then. Keeping the type
 * surface here so the rest of the codebase imports
 * `BBox`, `PinPoint`, `SearchOpts`, etc. from one canonical place
 * regardless of which engine is consuming them.
 *
 * The one live RDS query that remains: `getDistinctActiveCities()`.
 * Powers the city autocomplete in the results panel. Uses the partial
 * index `idx_listing_records_active_city` so the aggregation runs in
 * ~30ms warm.
 */

import { unstable_cache } from 'next/cache';
import { query } from './db';

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

/**
 * Field the text query targets. Defaults to 'any' which OR-unions
 * UnparsedAddress, SubdivisionName, City, and PostalCode — the widest
 * casting net for a visitor who isn't sure where their search term
 * lives. Specific values narrow the OData `contains()`:
 *   - 'address'   → UnparsedAddress only ("10293 Chiricahua")
 *   - 'community' → SubdivisionName only ("Silverleaf")
 *   - 'city'      → City only ("Scottsdale")
 *   - 'zip'       → PostalCode only ("85262")
 *   - 'mls'       → ListingId exact contains ("6712940")
 *
 * Keep aligned with `QField` in components/listings/SearchBar.tsx
 * and the `qField` enum in app/api/listings/search/route.ts.
 */
export type QField = 'any' | 'address' | 'community' | 'city' | 'zip' | 'mls';

export interface SearchOpts {
  q?: string;
  /** Field that the text query is matched against. Defaults to 'any'. */
  qField?: QField;
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
  /**
   * Case-insensitive city allowlist. Empty / omitted = no city narrowing
   * — every IDX-active listing in the Spark feed is searchable. Used by
   * the city autocomplete in the search panel.
   */
  cities?: string[];
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
  /** Light surface for the map hover popup — without these, pins outside
   *  the currently-loaded listings window fall back to a minimal
   *  price-only popup. */
  unparsedAddress?: string | null;
  community?: string | null;
  bedrooms?: number | null;
  bathroomsTotal?: number | null;
  livingArea?: number | null;
  coverPhotoUrl?: string | null;
  /**
   * Listing brokerage name. Required per ARMLS IDX rules on every
   * listing display surface — including map hover popups.
   */
  listOfficeName?: string | null;
}

export interface SearchResult {
  // `Listing` lives in lib/types — declared inline as `unknown[]` here
  // would create a worse type than the import does. The downstream
  // consumer (lib/spark/search.ts) re-imports `Listing` directly.
  listings: import('./types').Listing[];
  pins: PinPoint[];
  total: number;
  hasMore: boolean;
  fetchedAt: string;
  nextCursor?: string | null;
}

export interface CityOption {
  city: string;
  count: number;
}

// ── Cities query (the one live RDS path) ────────────

/**
 * Distinct cities currently in the active IDX universe with per-city
 * counts. Queried against `listing_records` (NOT the dropped
 * `mv_active_listings`). The partial index
 * `idx_listing_records_active_city` makes this an indexed scan in
 * ~30ms warm.
 *
 * Wrapped in `unstable_cache` so the /listings SSR prerender doesn't
 * re-hit RDS on every revalidation; 5-minute TTL plays nicely with
 * the page's `revalidate=300`. Tag `listings:cities` lets a future
 * admin / cron handler invalidate the cache on demand via
 * `revalidateTag('listings:cities')`.
 */
async function getDistinctActiveCitiesUncached(): Promise<CityOption[]> {
  const sql = `
    SELECT city, COUNT(*)::int AS count
    FROM listing_records
    WHERE is_deleted = FALSE
      AND internet_entire_listing_display_yn = TRUE
      AND standard_status IN ('Active', 'Active Under Contract', 'Coming Soon', 'Pending')
      AND property_type <> 'Residential Lease'
      AND city IS NOT NULL
      AND city <> ''
    GROUP BY city
    ORDER BY COUNT(*) DESC, city ASC
  `;
  const { rows } = await query<{ city: string; count: number | string }>(sql);
  return rows.map((r) => ({
    city: r.city,
    count: typeof r.count === 'string' ? parseInt(r.count, 10) : r.count,
  }));
}

export const getDistinctActiveCities = unstable_cache(
  getDistinctActiveCitiesUncached,
  ['listings-cities-v1'],
  { revalidate: 300, tags: ['listings:cities'] },
);
