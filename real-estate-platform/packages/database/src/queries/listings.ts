/**
 * Listing Query Layer
 * All queries run against RDS (ARMLS mirror), not Neon.
 * Provides search, detail, and stats for IDX display.
 */

import type { QueryResultRow } from 'pg';
import { rdsQuery, rdsQueryOne } from '../rds-client';

// ============================================
// TYPES
// ============================================

export interface ListingSearchFilters {
  status?: string | string[];
  city?: string;
  postalCode?: string;
  subdivisionName?: string;
  propertyType?: string;
  listingType?: 'sale' | 'rent' | 'all';
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  minSqft?: number;
  maxSqft?: number;
  minLotAcres?: number;
  minYearBuilt?: number;
  maxDom?: number;
  maxHoa?: number;
  minStories?: number;
  minGarageSpaces?: number;
  hasPool?: boolean;
  hasGarage?: boolean;
  hasFireplace?: boolean;
  isHorseProperty?: boolean;
  keyword?: string;
  swLat?: number;
  swLng?: number;
  neLat?: number;
  neLng?: number;
  polygon?: [number, number][];
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'beds' | 'sqft' | 'dom' | 'price_sqft' | 'lot_size';
  limit?: number;
  offset?: number;
}

export interface ListingRecord extends QueryResultRow {
  id: number;
  listing_key: string;
  listing_id: string;
  standard_status: string;
  mls_status: string | null;
  unparsed_address: string | null;
  city: string | null;
  state_or_province: string | null;
  postal_code: string;
  subdivision_name: string | null;
  latitude: number | null;
  longitude: number | null;
  list_price: number | null;
  close_price: number | null;
  property_type: string | null;
  property_sub_type: string | null;
  bedrooms_total: number | null;
  bathrooms_total_integer: number | null;
  bathrooms_full: number | null;
  bathrooms_half: number | null;
  living_area: number | null;
  lot_size_acres: number | null;
  lot_size_square_feet: number | null;
  year_built: number | null;
  stories_total: number | null;
  pool_private_yn: boolean | null;
  garage_spaces: number | null;
  list_office_name: string;
  list_agent_full_name: string | null;
  list_agent_key: string | null;
  public_remarks: string | null;
  photos_count: number | null;
  days_on_market: number | null;
  modification_timestamp: string;
  listing_contract_date: string | null;
  primary_photo_url: string | null;
}

export interface ListingDetail extends ListingRecord {
  street_number: string | null;
  street_dir_prefix: string | null;
  street_name: string | null;
  street_suffix: string | null;
  unit_number: string | null;
  county_or_parish: string | null;
  interior_features: string[];
  exterior_features: string[];
  appliances: string[];
  cooling: string[];
  heating: string[];
  flooring: string[];
  pool_features: string[];
  parking_features: string[];
  community_features: string[];
  view_features: string[];
  architectural_style: string[];
  construction_materials: string[];
  roof: string[];
  fireplace_features: string[];
  lot_features: string[];
  patio_and_porch_features: string[];
  fencing: string[];
  sewer: string[];
  water_source: string[];
  fireplace_yn: boolean | null;
  association_yn: boolean | null;
  association_fee: number | null;
  association_fee_frequency: string | null;
  association_name: string | null;
  covered_spaces: number | null;
  carport_spaces: number | null;
  open_parking_spaces: number | null;
  list_agent_first_name: string | null;
  list_agent_last_name: string | null;
  list_agent_mls_id: string | null;
  list_office_mls_id: string | null;
  list_office_phone: string | null;
  directions: string | null;
  cross_street: string | null;
  close_date: string | null;
  tax_annual_amount: number | null;
  tax_year: number | null;
  parcel_number: string | null;
  elementary_school: string | null;
  elementary_school_district: string | null;
  high_school_district: string | null;
  middle_or_junior_school: string | null;
  agent_cell_phone: string | null;
  originating_system_name: string | null;
}

interface ListingStats extends QueryResultRow {
  total_active: number;
  avg_price: number;
  median_price: number;
  avg_dom: number;
  avg_sqft: number;
  avg_price_per_sqft: number;
  min_price: number;
  max_price: number;
}

// ============================================
// SEARCH
// ============================================

const ACTIVE_STATUSES = ['Active', 'Active Under Contract', 'Coming Soon', 'Pending'];

const SORT_MAP: Record<string, string> = {
  price_asc: 'list_price ASC NULLS LAST',
  price_desc: 'list_price DESC NULLS LAST',
  newest: 'modification_timestamp DESC',
  beds: 'bedrooms_total DESC NULLS LAST',
  sqft: 'living_area DESC NULLS LAST',
  dom: 'days_on_market ASC NULLS LAST',
  price_sqft: 'price_per_sqft ASC NULLS LAST',
  lot_size: 'lot_size_acres DESC NULLS LAST',
};

/**
 * Search active listings with filters.
 * Only returns IDX-displayable listings (internet_entire_listing_display_yn = true).
 */
export async function searchListings(
  filters: ListingSearchFilters = {}
): Promise<{ listings: ListingRecord[]; total: number }> {
  const conditions: string[] = [
    'is_deleted = FALSE',
    'internet_entire_listing_display_yn = TRUE',
  ];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Status filter
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    const placeholders = statuses.map(() => `$${paramIndex++}`);
    conditions.push(`standard_status IN (${placeholders.join(', ')})`);
    params.push(...statuses);
  } else {
    const placeholders = ACTIVE_STATUSES.map(() => `$${paramIndex++}`);
    conditions.push(`standard_status IN (${placeholders.join(', ')})`);
    params.push(...ACTIVE_STATUSES);
  }

  if (filters.city) {
    conditions.push(`city ILIKE $${paramIndex++}`);
    params.push(filters.city);
  }
  if (filters.postalCode) {
    conditions.push(`postal_code = $${paramIndex++}`);
    params.push(filters.postalCode);
  }
  if (filters.subdivisionName) {
    conditions.push(`subdivision_name ILIKE $${paramIndex++}`);
    params.push(`%${filters.subdivisionName}%`);
  }
  if (filters.listingType === 'rent') {
    conditions.push(`property_type = 'Residential Lease'`);
  } else if (filters.listingType === 'all') {
    // no filter
  } else if (filters.propertyType) {
    conditions.push(`property_type = $${paramIndex++}`);
    params.push(filters.propertyType);
  } else {
    conditions.push(`property_type != 'Residential Lease'`);
  }
  if (filters.minPrice !== undefined) {
    conditions.push(`list_price >= $${paramIndex++}`);
    params.push(filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(`list_price <= $${paramIndex++}`);
    params.push(filters.maxPrice);
  }
  if (filters.minBeds !== undefined) {
    conditions.push(`bedrooms_total >= $${paramIndex++}`);
    params.push(filters.minBeds);
  }
  if (filters.maxBeds !== undefined) {
    conditions.push(`bedrooms_total <= $${paramIndex++}`);
    params.push(filters.maxBeds);
  }
  if (filters.minBaths !== undefined) {
    conditions.push(`bathrooms_total_integer >= $${paramIndex++}`);
    params.push(filters.minBaths);
  }
  if (filters.minSqft !== undefined) {
    conditions.push(`living_area >= $${paramIndex++}`);
    params.push(filters.minSqft);
  }
  if (filters.maxSqft !== undefined) {
    conditions.push(`living_area <= $${paramIndex++}`);
    params.push(filters.maxSqft);
  }
  if (filters.minLotAcres !== undefined) {
    conditions.push(`lot_size_acres >= $${paramIndex++}`);
    params.push(filters.minLotAcres);
  }
  if (filters.minYearBuilt !== undefined) {
    conditions.push(`year_built >= $${paramIndex++}`);
    params.push(filters.minYearBuilt);
  }
  if (filters.maxDom !== undefined) {
    conditions.push(`days_on_market <= $${paramIndex++}`);
    params.push(filters.maxDom);
  }
  if (filters.maxHoa !== undefined) {
    conditions.push(`(association_fee IS NULL OR association_fee <= $${paramIndex++})`);
    params.push(filters.maxHoa);
  }
  if (filters.minStories !== undefined) {
    conditions.push(`stories_total >= $${paramIndex++}`);
    params.push(filters.minStories);
  }
  if (filters.minGarageSpaces !== undefined) {
    conditions.push(`garage_spaces >= $${paramIndex++}`);
    params.push(filters.minGarageSpaces);
  }
  if (filters.hasPool === true) {
    conditions.push('pool_private_yn = TRUE');
  }
  if (filters.hasGarage === true) {
    conditions.push('garage_spaces > 0');
  }
  if (filters.hasFireplace === true) {
    conditions.push('fireplace_yn = TRUE');
  }
  if (filters.isHorseProperty === true) {
    conditions.push('horse_yn = TRUE');
  }
  if (filters.keyword) {
    conditions.push(`public_remarks ILIKE $${paramIndex++}`);
    params.push(`%${filters.keyword}%`);
  }

  const whereClause = conditions.join(' AND ');
  const orderClause = SORT_MAP[filters.sortBy ?? 'newest'] ?? SORT_MAP.newest;
  const limit = Math.min(filters.limit ?? 25, 200);
  const offset = filters.offset ?? 0;

  // Count query
  const countResult = await rdsQuery<{ count: string }>(
    `SELECT COUNT(*) as count FROM listing_records WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Data query — cast numeric columns to float8 so pg returns JS numbers
  const dataResult = await rdsQuery<ListingRecord>(
    `SELECT id, listing_key, listing_id, standard_status, mls_status,
            unparsed_address, city, state_or_province, postal_code,
            subdivision_name,
            latitude::float8 AS latitude, longitude::float8 AS longitude,
            list_price::float8 AS list_price, close_price::float8 AS close_price,
            property_type, property_sub_type, bedrooms_total,
            bathrooms_total_integer, bathrooms_full, bathrooms_half,
            living_area::float8 AS living_area,
            lot_size_acres::float8 AS lot_size_acres,
            lot_size_square_feet::float8 AS lot_size_square_feet,
            year_built, stories_total, pool_private_yn, garage_spaces,
            list_office_name, list_agent_full_name, list_agent_key,
            public_remarks, photos_count, days_on_market,
            modification_timestamp, listing_contract_date
     FROM listing_records
     WHERE ${whereClause}
     ORDER BY ${orderClause}
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );

  return { listings: dataResult.rows, total };
}

/**
 * Search active listings with primary photo joined.
 * Avoids N+1 on the search page by LEFT JOINing the preferred photo.
 */
export async function searchListingsWithPhotos(
  filters: ListingSearchFilters = {}
): Promise<{ listings: ListingRecord[]; total: number }> {
  const conditions: string[] = [
    'lr.is_deleted = FALSE',
    'lr.internet_entire_listing_display_yn = TRUE',
  ];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Status filter
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    const placeholders = statuses.map(() => `$${paramIndex++}`);
    conditions.push(`lr.standard_status IN (${placeholders.join(', ')})`);
    params.push(...statuses);
  } else {
    const placeholders = ACTIVE_STATUSES.map(() => `$${paramIndex++}`);
    conditions.push(`lr.standard_status IN (${placeholders.join(', ')})`);
    params.push(...ACTIVE_STATUSES);
  }

  if (filters.city) {
    conditions.push(`lr.city ILIKE $${paramIndex++}`);
    params.push(filters.city);
  }
  if (filters.postalCode) {
    conditions.push(`lr.postal_code = $${paramIndex++}`);
    params.push(filters.postalCode);
  }
  if (filters.subdivisionName) {
    conditions.push(`lr.subdivision_name ILIKE $${paramIndex++}`);
    params.push(`%${filters.subdivisionName}%`);
  }
  // Listing type: sale vs rent vs all
  if (filters.listingType === 'rent') {
    conditions.push(`lr.property_type = 'Residential Lease'`);
  } else if (filters.listingType === 'all') {
    // no filter — show everything
  } else if (filters.propertyType) {
    conditions.push(`lr.property_type = $${paramIndex++}`);
    params.push(filters.propertyType);
  } else {
    // Default: exclude leases so search shows sales only
    conditions.push(`lr.property_type != 'Residential Lease'`);
  }
  if (filters.minPrice !== undefined) {
    conditions.push(`lr.list_price >= $${paramIndex++}`);
    params.push(filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(`lr.list_price <= $${paramIndex++}`);
    params.push(filters.maxPrice);
  }
  if (filters.minBeds !== undefined) {
    conditions.push(`lr.bedrooms_total >= $${paramIndex++}`);
    params.push(filters.minBeds);
  }
  if (filters.maxBeds !== undefined) {
    conditions.push(`lr.bedrooms_total <= $${paramIndex++}`);
    params.push(filters.maxBeds);
  }
  if (filters.minBaths !== undefined) {
    conditions.push(`lr.bathrooms_total_integer >= $${paramIndex++}`);
    params.push(filters.minBaths);
  }
  if (filters.minSqft !== undefined) {
    conditions.push(`lr.living_area >= $${paramIndex++}`);
    params.push(filters.minSqft);
  }
  if (filters.maxSqft !== undefined) {
    conditions.push(`lr.living_area <= $${paramIndex++}`);
    params.push(filters.maxSqft);
  }
  if (filters.minLotAcres !== undefined) {
    conditions.push(`lr.lot_size_acres >= $${paramIndex++}`);
    params.push(filters.minLotAcres);
  }
  if (filters.minYearBuilt !== undefined) {
    conditions.push(`lr.year_built >= $${paramIndex++}`);
    params.push(filters.minYearBuilt);
  }
  if (filters.maxDom !== undefined) {
    conditions.push(`lr.days_on_market <= $${paramIndex++}`);
    params.push(filters.maxDom);
  }
  if (filters.maxHoa !== undefined) {
    conditions.push(`(lr.association_fee IS NULL OR lr.association_fee <= $${paramIndex++})`);
    params.push(filters.maxHoa);
  }
  if (filters.minStories !== undefined) {
    conditions.push(`lr.stories_total >= $${paramIndex++}`);
    params.push(filters.minStories);
  }
  if (filters.minGarageSpaces !== undefined) {
    conditions.push(`lr.garage_spaces >= $${paramIndex++}`);
    params.push(filters.minGarageSpaces);
  }
  if (filters.hasPool === true) {
    conditions.push('lr.pool_private_yn = TRUE');
  }
  if (filters.hasGarage === true) {
    conditions.push('lr.garage_spaces > 0');
  }
  if (filters.hasFireplace === true) {
    conditions.push('lr.fireplace_yn = TRUE');
  }
  if (filters.isHorseProperty === true) {
    conditions.push('lr.horse_yn = TRUE');
  }
  if (filters.keyword) {
    conditions.push(`lr.public_remarks ILIKE $${paramIndex++}`);
    params.push(`%${filters.keyword}%`);
  }
  if (
    filters.swLat !== undefined &&
    filters.swLng !== undefined &&
    filters.neLat !== undefined &&
    filters.neLng !== undefined
  ) {
    conditions.push('lr.latitude IS NOT NULL');
    conditions.push('lr.longitude IS NOT NULL');
    conditions.push(`lr.latitude BETWEEN $${paramIndex++} AND $${paramIndex++}`);
    params.push(filters.swLat, filters.neLat);
    conditions.push(`lr.longitude BETWEEN $${paramIndex++} AND $${paramIndex++}`);
    params.push(filters.swLng, filters.neLng);
  }
  if (filters.polygon && filters.polygon.length >= 3) {
    conditions.push('lr.latitude IS NOT NULL');
    conditions.push('lr.longitude IS NOT NULL');
    const polyStr = filters.polygon
      .map(([lng, lat]) => `(${lng},${lat})`)
      .join(',');
    conditions.push(`polygon(path '(${polyStr})') @> point(lr.longitude, lr.latitude)`);
  }

  const whereClause = conditions.join(' AND ');
  const sortField = filters.sortBy ?? 'newest';
  const orderClause = (SORT_MAP[sortField] ?? SORT_MAP.newest).replace(
    /^(\w+)/,
    'lr.$1'
  );
  const limit = Math.min(filters.limit ?? 25, 200);
  const offset = filters.offset ?? 0;

  // Count query
  const countResult = await rdsQuery<{ count: string }>(
    `SELECT COUNT(*) as count FROM listing_records lr WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Data query with primary photo join
  const dataResult = await rdsQuery<ListingRecord>(
    `SELECT lr.id, lr.listing_key, lr.listing_id, lr.standard_status, lr.mls_status,
            lr.unparsed_address, lr.city, lr.state_or_province, lr.postal_code,
            lr.subdivision_name,
            lr.latitude::float8 AS latitude, lr.longitude::float8 AS longitude,
            lr.list_price::float8 AS list_price, lr.close_price::float8 AS close_price,
            lr.property_type, lr.property_sub_type, lr.bedrooms_total,
            lr.bathrooms_total_integer, lr.bathrooms_full, lr.bathrooms_half,
            lr.living_area::float8 AS living_area,
            lr.lot_size_acres::float8 AS lot_size_acres,
            lr.lot_size_square_feet::float8 AS lot_size_square_feet,
            lr.year_built, lr.stories_total, lr.pool_private_yn, lr.garage_spaces,
            lr.list_office_name, lr.list_agent_full_name, lr.list_agent_key,
            lr.public_remarks, lr.photos_count, lr.days_on_market,
            lr.modification_timestamp, lr.listing_contract_date,
            lp.media_url AS primary_photo_url
     FROM listing_records lr
     LEFT JOIN listing_photos lp ON lp.listing_key = lr.listing_key AND lp.is_preferred = true
     WHERE ${whereClause}
     ORDER BY ${orderClause}
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );

  return { listings: dataResult.rows, total };
}

// ============================================
// DETAIL
// ============================================

/**
 * Get full listing detail by listing_key.
 * Only returns if IDX-displayable.
 */
export async function getListingByKey(listingKey: string): Promise<ListingDetail | null> {
  return rdsQueryOne<ListingDetail>(
    `SELECT * FROM listing_records
     WHERE listing_key = $1
       AND is_deleted = FALSE
       AND internet_entire_listing_display_yn = TRUE`,
    [listingKey]
  );
}

/**
 * Get full listing detail by listing_id (MLS number).
 */
export async function getListingById(listingId: string): Promise<ListingDetail | null> {
  return rdsQueryOne<ListingDetail>(
    `SELECT * FROM listing_records
     WHERE listing_id = $1
       AND is_deleted = FALSE
       AND internet_entire_listing_display_yn = TRUE`,
    [listingId]
  );
}

// ============================================
// AGENT/OFFICE LOOKUP
// ============================================

/**
 * Get agent contact info by joining listing to member entity.
 * Required for IDX compliance — agent phone/email not on Property entity.
 */
export async function getListingAgent(listingKey: string) {
  return rdsQueryOne(
    `SELECT m.member_full_name, m.member_email, m.member_mobile_phone,
            m.member_preferred_phone, m.member_state_license,
            m.office_name, lr.agent_cell_phone
     FROM listing_records lr
     LEFT JOIN listing_members m ON lr.list_agent_key = m.member_key
     WHERE lr.listing_key = $1`,
    [listingKey]
  );
}

// ============================================
// STATS
// ============================================

/**
 * Get market stats for a geographic area.
 */
export async function getMarketStats(options: {
  city?: string;
  postalCode?: string;
  subdivisionName?: string;
}): Promise<ListingStats | null> {
  const conditions = [
    "standard_status = 'Active'",
    'is_deleted = FALSE',
    'internet_entire_listing_display_yn = TRUE',
    'list_price IS NOT NULL',
  ];
  const params: unknown[] = [];
  let idx = 1;

  if (options.city) {
    conditions.push(`city ILIKE $${idx++}`);
    params.push(options.city);
  }
  if (options.postalCode) {
    conditions.push(`postal_code = $${idx++}`);
    params.push(options.postalCode);
  }
  if (options.subdivisionName) {
    conditions.push(`subdivision_name ILIKE $${idx++}`);
    params.push(`%${options.subdivisionName}%`);
  }

  const where = conditions.join(' AND ');

  return rdsQueryOne<ListingStats>(
    `SELECT
       COUNT(*)::int as total_active,
       COALESCE(AVG(list_price), 0)::numeric(12,2) as avg_price,
       COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price), 0)::numeric(12,2) as median_price,
       COALESCE(AVG(days_on_market), 0)::int as avg_dom,
       COALESCE(AVG(living_area), 0)::numeric(10,2) as avg_sqft,
       COALESCE(AVG(CASE WHEN living_area > 0 THEN list_price / living_area END), 0)::numeric(10,2) as avg_price_per_sqft,
       COALESCE(MIN(list_price), 0)::numeric(12,2) as min_price,
       COALESCE(MAX(list_price), 0)::numeric(12,2) as max_price
     FROM listing_records
     WHERE ${where}`,
    params
  );
}

// ============================================
// PHOTOS
// ============================================

export interface ListingPhoto {
  id: number;
  listing_key: string;
  media_key: string;
  media_url: string;
  order: number;
  short_description: string | null;
  is_preferred: boolean;
}

/**
 * Get photos for a listing, ordered by preferred first, then order.
 */
export async function getListingPhotos(listingKey: string): Promise<ListingPhoto[]> {
  const result = await rdsQuery<ListingPhoto>(
    `SELECT id, listing_key, media_key, media_url, "order", short_description, is_preferred
     FROM listing_photos
     WHERE listing_key = $1
     ORDER BY is_preferred DESC, "order" ASC`,
    [listingKey]
  );
  return result.rows;
}

/**
 * Get count of listings by status.
 */
export async function getListingCounts(): Promise<Record<string, number>> {
  const result = await rdsQuery<{ standard_status: string; count: string }>(
    `SELECT standard_status, COUNT(*) as count
     FROM listing_records
     WHERE is_deleted = FALSE
     GROUP BY standard_status
     ORDER BY count DESC`
  );

  const counts: Record<string, number> = {};
  for (const row of result.rows) {
    counts[row.standard_status] = parseInt(row.count, 10);
  }
  return counts;
}
