/**
 * Domain Types — yong2-local
 *
 * Aligned with the REAL RDS schema, verified via direct pg_attribute queries.
 *
 *   mv_active_listings          → listings (52,725 active rows)
 *   mv_community_scorecard      → community/region/metro KPIs
 *   mv_market_pulse             → monthly aggregates by scope
 *   mv_supply_demand            → new listings + closed sales by month
 *   mv_price_bands              → price-bucket counts and metrics
 *   mv_inventory_age            → DOM-bucketed counts
 *
 * camelCase consumer shape — db row shapes stay private to the query
 * modules (lib/listings.ts, lib/communities.ts, lib/analytics.ts).
 */

// ── Listings ────────────────────────────────────────

export type ListingStatus =
  | 'Active'
  | 'Active Under Contract'
  | 'Coming Soon'
  | 'Pending'
  | 'Closed'
  | 'Expired'
  | 'Withdrawn'
  | 'Canceled';

export interface ListingPhoto {
  url: string;
  desc: string | null;
}

/**
 * Domain Listing — the shape consumed by yong2 components.
 * Derived from mv_active_listings rows.
 */
export interface Listing {
  /** ARMLS unique key — the identifier for permalink lookups. */
  listingKey: string;
  /** Public MLS number shown to humans. */
  listingId: string;
  /** Slug derived from unparsed_address + listing_key tail. */
  slug: string;
  /** Standard ARMLS status. */
  status: ListingStatus | string;
  /** Single-line address as ARMLS provides it. */
  unparsedAddress: string;
  streetNumber: string | null;
  streetName: string | null;
  streetSuffix: string | null;
  city: string | null;
  postalCode: string | null;
  county: string | null;
  /** ARMLS subdivision_display (Title Case-ish), if present. */
  subdivisionDisplay: string | null;
  /** Derived community slug from the MV (e.g. "desert-mountain"). */
  communitySlug: string | null;
  /** Display-cased community name from the MV (e.g. "Desert Mountain"). */
  communityName: string | null;
  /** Region slug (e.g. "north-scottsdale"). */
  regionSlug: string | null;
  regionName: string | null;
  /** Best-effort community label for UI: communityName → subdivisionDisplay → city. */
  community: string;
  listPrice: number | null;
  pricePerSqft: number | null;
  bedrooms: number | null;
  bathroomsFull: number | null;
  bathroomsHalf: number | null;
  bathroomsTotal: number | null;
  livingArea: number | null;
  lotAcres: number | null;
  lotSqft: number | null;
  yearBuilt: number | null;
  daysOnMarket: number | null;
  latitude: number | null;
  longitude: number | null;
  propertyType: string | null;
  propertySubType: string | null;
  hasPool: boolean;
  hasFireplace: boolean;
  hasGarage: boolean;
  isLuxury: boolean;
  publicRemarks: string | null;
  /** Cover photo (primary_photo_url when present, else photos[0]). */
  coverPhotoUrl: string | null;
  /** Ordered string array of photo URLs. */
  photos: string[];
  /** Photo objects with descriptions. */
  photoUrls: ListingPhoto[];
  listAgentKey: string | null;
  listAgentName: string | null;
  modificationTimestamp: string | null;
}

// ── Communities ─────────────────────────────────────

/**
 * Community KPIs — derived from mv_community_scorecard.
 *
 * The MV is keyed by (scope_type, scope_key, property_segment). Yong2 always
 * filters property_segment = 'residential' unless explicitly told otherwise.
 *
 * scope_type ∈ { 'community', 'region', 'metro' }
 * property_segment ∈ { 'residential', 'land', 'all' }
 */
export interface CommunityKpis {
  /** mv scope_type — 'community' for our curated set, 'region' for paradise-valley. */
  scopeType: 'community' | 'region' | 'metro';
  /** mv scope_key — e.g. "desert-mountain". */
  scopeKey: string;
  /** Property segment — typically 'residential'. */
  propertySegment: 'residential' | 'land' | 'all';
  /** Median close price for the rolled-up window (USD). */
  medianPrice: number | null;
  /** Total closed (last rolling window). */
  totalClosed: number;
  /** Total active inventory right now. */
  totalActive: number;
  /** Total pending. */
  totalPending: number;
  /** Average days on market (closed). */
  avgDom: number | null;
  /**
   * Median days on market (closed, residential, last 12mo). Computed live
   * from `analytics_base` because `mv_community_scorecard` does not carry
   * a median_dom column. More resistant to long-tail outliers (e.g. new-
   * construction parcels listed years before close) than `avgDom`.
   */
  medianDom: number | null;
  /** Average price per square foot. */
  avgPpsf: number | null;
  /** Months of supply. */
  monthsOfSupply: number | null;
  /** YoY median-price change percentage. */
  yoyPriceChangePct: number | null;
}

// ── Analytics ───────────────────────────────────────

/**
 * Geographic filter for analytics queries — these MVs are pre-rolled-up by
 * (scope_type, scope_key, property_segment) so we filter on those dimensions
 * directly rather than city/postal/subdivision.
 */
export interface AnalyticsScope {
  scopeType: 'community' | 'region' | 'metro';
  scopeKey: string;
  propertySegment?: 'residential' | 'land' | 'all';
}

export interface MarketPulseRow {
  month: string;
  standardStatus: string;
  listingCount: number;
  closedCount: number;
  medianClosePrice: number | null;
  avgClosePrice: number | null;
  medianListPrice: number | null;
  avgDom: number | null;
  medianDom: number | null;
  avgPricePerSqft: number | null;
  totalVolume: number | null;
}

export interface SupplyDemandRow {
  month: string;
  newListings: number;
  closedSales: number;
}

export interface PriceBandRow {
  month: string;
  priceBand: string;
  standardStatus: string;
  listingCount: number;
  avgDom: number | null;
  medianPriceInBand: number | null;
}

export interface InventoryAgeRow {
  month: string;
  domBucket: string;
  listingCount: number;
  avgListPrice: number | null;
}

// NOTE: Heatmap MVs (mv_heatmap_active / mv_heatmap_sold) do NOT exist on the
// real RDS. The HeatmapPoint type and getHeatmapPoints() have been removed.
// If a heatmap is needed, source from mv_active_listings (latitude/longitude)
// and aggregate via H3 or the community scorecard centroid.
