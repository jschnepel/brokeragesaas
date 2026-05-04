-- Migration 027: Active Listings Materialized View
--
-- Creates a small (~42K row, ~200MB) MV of only active listings for search queries.
-- Replaces querying the bloated clean_listings table (1.78M rows, 8.6GB).
-- REFRESH MATERIALIZED VIEW CONCURRENTLY runs every 15 min via Lambda sync-active.
--
-- Why: clean_listings is a full copy of all historical data. Search only needs active listings.
-- The MV fits entirely in PostgreSQL shared_buffers on a 4GB instance → sub-50ms queries.

-- ═══════════════════════════════════════════════════════════════
-- 1. Create the Materialized View
-- ═══════════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_active_listings AS
SELECT
  lr.listing_key,
  lr.listing_id,
  lr.standard_status,
  lr.mls_status,
  lr.latitude,
  lr.longitude,
  CASE WHEN lr.latitude IS NOT NULL AND lr.longitude IS NOT NULL
    THEN ST_SetSRID(ST_MakePoint(lr.longitude, lr.latitude), 4326)
    ELSE NULL END AS geometry,
  -- Address
  lr.city,
  lr.postal_code,
  lr.county_or_parish AS county,
  lr.unparsed_address,
  lr.street_number,
  lr.street_name,
  lr.street_suffix,
  lr.street_dir_prefix,
  lr.unit_number,
  lr.subdivision_name AS subdivision_display,
  -- Price
  lr.list_price,
  lr.close_price,
  CASE WHEN lr.living_area > 0 AND lr.list_price > 0
    THEN ROUND(lr.list_price / lr.living_area, 2) ELSE NULL END AS price_per_sqft,
  -- Dates
  lr.listing_contract_date,
  lr.close_date,
  lr.modification_timestamp,
  lr.status_change_timestamp,
  lr.original_entry_timestamp,
  -- Time metrics
  lr.days_on_market,
  -- Property
  lr.property_type,
  lr.property_sub_type,
  lr.bedrooms_total AS bedrooms,
  lr.bathrooms_full,
  lr.bathrooms_half,
  lr.bathrooms_total_integer AS bathrooms_total,
  lr.living_area,
  lr.lot_size_square_feet AS lot_sqft,
  lr.lot_size_acres AS lot_acres,
  lr.year_built,
  lr.stories_total AS stories,
  -- Feature booleans
  lr.pool_private_yn AS has_pool,
  lr.fireplace_yn AS has_fireplace,
  (lr.garage_spaces > 0) AS has_garage,
  (lr.association_fee IS NOT NULL AND lr.association_fee > 0) AS has_hoa,
  lr.horse_yn AS is_horse_property,
  -- Feature arrays
  lr.interior_features,
  lr.exterior_features,
  lr.appliances,
  lr.cooling,
  lr.heating,
  lr.flooring,
  lr.pool_features,
  lr.community_features,
  lr.view_features,
  lr.architectural_style,
  lr.construction_materials,
  lr.roof,
  lr.fireplace_features,
  lr.lot_features,
  lr.patio_and_porch_features,
  lr.fencing,
  lr.sewer,
  lr.water_source,
  -- Parking
  lr.garage_spaces,
  lr.covered_spaces,
  lr.carport_spaces,
  -- Financial
  lr.association_fee AS hoa_fee,
  lr.association_fee_frequency AS hoa_frequency,
  lr.tax_annual_amount AS tax_annual,
  lr.tax_year,
  -- Agent/Office
  lr.list_agent_key,
  lr.list_agent_full_name AS list_agent_name,
  lr.list_office_key,
  lr.list_office_name,
  lr.list_office_phone,
  lr.buyer_agent_key,
  lr.buyer_agent_full_name AS buyer_agent_name,
  lr.buyer_office_key,
  lr.buyer_office_name,
  -- Content
  lr.public_remarks,
  lr.photos_count,
  lr.photo_urls,
  lr.photo_urls->0->>'url' AS primary_photo_url,
  lr.virtual_tour_url,
  lr.parcel_number,
  -- Search
  to_tsvector('english',
    COALESCE(lr.unparsed_address, '') || ' ' ||
    COALESCE(lr.city, '') || ' ' ||
    COALESCE(lr.subdivision_name, '') || ' ' ||
    COALESCE(lr.public_remarks, '')
  ) AS search_vector,
  -- Schools
  lr.elementary_school,
  lr.elementary_school_district,
  lr.middle_or_junior_school AS middle_school,
  lr.high_school_district,
  -- Compliance
  lr.internet_entire_listing_display_yn AS internet_display_yn,
  lr.internet_address_display_yn,
  lr.is_deleted,
  -- Flags
  (lr.list_price >= 1000000) AS is_luxury,
  -- Price reduction
  (lr.price_change_timestamp IS NOT NULL) AS has_price_reduction,
  -- Geo (from listing_geography if available)
  lg.community_id,
  lg.community_name,
  lg.community_slug,
  lg.region_id,
  lg.region_name,
  lg.region_slug,
  lg.is_in_region,
  -- Metadata
  lr.last_synced_at
FROM listing_records lr
LEFT JOIN listing_geography lg ON lr.listing_key = lg.listing_key
WHERE lr.standard_status IN ('Active', 'Active Under Contract', 'Coming Soon', 'Pending')
  AND lr.is_deleted = FALSE
  AND lr.internet_entire_listing_display_yn = TRUE
WITH NO DATA;

-- ═══════════════════════════════════════════════════════════════
-- 2. Indexes (on just ~42K rows — all tiny and fast)
-- ═══════════════════════════════════════════════════════════════

-- Required for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_active_pk ON mv_active_listings(listing_key);

-- Search indexes
CREATE INDEX IF NOT EXISTS idx_mv_active_price ON mv_active_listings(list_price DESC);
CREATE INDEX IF NOT EXISTS idx_mv_active_city_price ON mv_active_listings(city, list_price DESC);
CREATE INDEX IF NOT EXISTS idx_mv_active_community ON mv_active_listings(community_slug, list_price DESC);
CREATE INDEX IF NOT EXISTS idx_mv_active_region ON mv_active_listings(region_slug, list_price DESC);
CREATE INDEX IF NOT EXISTS idx_mv_active_zip ON mv_active_listings(postal_code, list_price DESC);
CREATE INDEX IF NOT EXISTS idx_mv_active_filters ON mv_active_listings(bedrooms, bathrooms_total, living_area, list_price);
CREATE INDEX IF NOT EXISTS idx_mv_active_spatial ON mv_active_listings USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_mv_active_search ON mv_active_listings USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_mv_active_newest ON mv_active_listings(status_change_timestamp DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_mv_active_subdivision ON mv_active_listings USING GIN(subdivision_display gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_mv_active_type ON mv_active_listings(property_type);
CREATE INDEX IF NOT EXISTS idx_mv_active_office ON mv_active_listings(list_office_name);

-- ═══════════════════════════════════════════════════════════════
-- 3. Initial population
-- ═══════════════════════════════════════════════════════════════

REFRESH MATERIALIZED VIEW mv_active_listings;
