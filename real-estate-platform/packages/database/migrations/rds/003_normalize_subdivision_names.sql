-- Migration 003: Normalize subdivision_name casing in materialized views
-- Problem: ARMLS data has mixed casing ("Desert Mountain" vs "DESERT MOUNTAIN")
--          causing 32+ duplicate communities in analytics views.
-- Fix: Use INITCAP(LOWER(subdivision_name)) in all GROUP BY and SELECT clauses.
-- Raw listing_records data is NOT modified.
-- After running this migration, call refresh_analytics_views() to rebuild all views.

BEGIN;

-- ============================================
-- MV 1: MARKET PULSE — Monthly aggregates per geo tier
-- ============================================
DROP MATERIALIZED VIEW IF EXISTS mv_market_pulse_monthly CASCADE;
CREATE MATERIALIZED VIEW mv_market_pulse_monthly AS
SELECT
  date_trunc('month', COALESCE(close_date, listing_contract_date, original_entry_timestamp::date)) AS month,
  city, postal_code,
  INITCAP(LOWER(subdivision_name)) AS subdivision_name,
  standard_status,
  COUNT(*) AS listing_count,
  COALESCE(AVG(list_price), 0)::numeric(14,2) AS avg_list_price,
  COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price)::numeric, 0)::numeric(14,2) AS median_list_price,
  COALESCE(AVG(close_price), 0)::numeric(14,2) AS avg_close_price,
  COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price)::numeric, 0)::numeric(14,2) AS median_close_price,
  COALESCE(AVG(CASE WHEN living_area > 0 THEN list_price / living_area END), 0)::numeric(14,2) AS avg_price_per_sqft,
  COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CASE WHEN living_area > 0 THEN list_price / living_area END)::numeric, 0)::numeric(14,2) AS median_price_per_sqft,
  COALESCE(AVG(CASE WHEN living_area > 0 THEN close_price / living_area END), 0)::numeric(14,2) AS avg_close_price_per_sqft,
  COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CASE WHEN living_area > 0 THEN close_price / living_area END)::numeric, 0)::numeric(14,2) AS median_close_price_per_sqft,
  COALESCE(AVG(days_on_market), 0)::int AS avg_dom,
  COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market)::numeric, 0)::int AS median_dom,
  COALESCE(AVG(living_area), 0)::numeric(14,2) AS avg_sqft,
  COALESCE(MIN(list_price), 0)::numeric(14,2) AS min_price,
  COALESCE(MAX(list_price), 0)::numeric(14,2) AS max_price
FROM listing_records
WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE AND list_price IS NOT NULL
  AND COALESCE(close_date, listing_contract_date, original_entry_timestamp::date) IS NOT NULL
GROUP BY month, city, postal_code, INITCAP(LOWER(subdivision_name)), standard_status;

-- ============================================
-- MV 2: PRICE BAND DISTRIBUTION
-- ============================================
DROP MATERIALIZED VIEW IF EXISTS mv_price_band_distribution CASCADE;
CREATE MATERIALIZED VIEW mv_price_band_distribution AS
SELECT city, postal_code,
  INITCAP(LOWER(subdivision_name)) AS subdivision_name,
  standard_status,
  CASE WHEN list_price < 500000 THEN 'Under $500K' WHEN list_price < 750000 THEN '$500K-$750K' WHEN list_price < 1000000 THEN '$750K-$1M' WHEN list_price < 1500000 THEN '$1M-$1.5M' WHEN list_price < 2000000 THEN '$1.5M-$2M' WHEN list_price < 3000000 THEN '$2M-$3M' WHEN list_price < 5000000 THEN '$3M-$5M' ELSE '$5M+' END AS price_band,
  CASE WHEN list_price < 500000 THEN 1 WHEN list_price < 750000 THEN 2 WHEN list_price < 1000000 THEN 3 WHEN list_price < 1500000 THEN 4 WHEN list_price < 2000000 THEN 5 WHEN list_price < 3000000 THEN 6 WHEN list_price < 5000000 THEN 7 ELSE 8 END AS band_order,
  COUNT(*) AS listing_count,
  COALESCE(AVG(days_on_market), 0)::int AS avg_dom,
  COALESCE(AVG(CASE WHEN living_area > 0 THEN list_price / living_area END), 0)::numeric(14,2) AS avg_price_per_sqft
FROM listing_records WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE AND list_price IS NOT NULL
GROUP BY city, postal_code, INITCAP(LOWER(subdivision_name)), standard_status, price_band, band_order;

-- ============================================
-- MV 3: SUPPLY & DEMAND — New listings vs closings per month
-- ============================================
DROP MATERIALIZED VIEW IF EXISTS mv_supply_demand_monthly CASCADE;
CREATE MATERIALIZED VIEW mv_supply_demand_monthly AS
SELECT month, city, postal_code,
  INITCAP(LOWER(subdivision_name)) AS subdivision_name,
  COALESCE(SUM(CASE WHEN event_type = 'new_listing' THEN 1 ELSE 0 END), 0) AS new_listings,
  COALESCE(SUM(CASE WHEN event_type = 'pending' THEN 1 ELSE 0 END), 0) AS new_pendings,
  COALESCE(SUM(CASE WHEN event_type = 'closed' THEN 1 ELSE 0 END), 0) AS new_closings,
  COALESCE(SUM(CASE WHEN event_type = 'expired' THEN 1 ELSE 0 END), 0) AS expired,
  COALESCE(SUM(CASE WHEN event_type = 'withdrawn' THEN 1 ELSE 0 END), 0) AS withdrawn
FROM (
  SELECT date_trunc('month', original_entry_timestamp) AS month, city, postal_code, subdivision_name, 'new_listing' AS event_type FROM listing_records WHERE is_deleted = FALSE AND original_entry_timestamp IS NOT NULL
  UNION ALL
  SELECT date_trunc('month', status_change_timestamp), city, postal_code, subdivision_name, 'pending' FROM listing_records WHERE is_deleted = FALSE AND standard_status IN ('Pending', 'Active Under Contract') AND status_change_timestamp IS NOT NULL
  UNION ALL
  SELECT date_trunc('month', close_date), city, postal_code, subdivision_name, 'closed' FROM listing_records WHERE is_deleted = FALSE AND standard_status = 'Closed' AND close_date IS NOT NULL
  UNION ALL
  SELECT date_trunc('month', status_change_timestamp), city, postal_code, subdivision_name, 'expired' FROM listing_records WHERE is_deleted = FALSE AND standard_status = 'Expired' AND status_change_timestamp IS NOT NULL
  UNION ALL
  SELECT date_trunc('month', status_change_timestamp), city, postal_code, subdivision_name, 'withdrawn' FROM listing_records WHERE is_deleted = FALSE AND standard_status = 'Withdrawn' AND status_change_timestamp IS NOT NULL
) events WHERE month IS NOT NULL
GROUP BY month, city, postal_code, INITCAP(LOWER(subdivision_name));

-- ============================================
-- MV 4: INVENTORY AGE — Active listings by DOM bands
-- ============================================
DROP MATERIALIZED VIEW IF EXISTS mv_inventory_age CASCADE;
CREATE MATERIALIZED VIEW mv_inventory_age AS
SELECT city, postal_code,
  INITCAP(LOWER(subdivision_name)) AS subdivision_name,
  CASE WHEN days_on_market IS NULL THEN 'Unknown' WHEN days_on_market <= 30 THEN 'Fresh (0-30)' WHEN days_on_market <= 90 THEN 'Aging (31-90)' ELSE 'Stale (90+)' END AS dom_band,
  CASE WHEN days_on_market IS NULL THEN 0 WHEN days_on_market <= 30 THEN 1 WHEN days_on_market <= 90 THEN 2 ELSE 3 END AS band_order,
  COUNT(*) AS listing_count,
  COALESCE(AVG(list_price), 0)::numeric(14,2) AS avg_price,
  COALESCE(AVG(CASE WHEN living_area > 0 THEN list_price / living_area END), 0)::numeric(14,2) AS avg_price_per_sqft
FROM listing_records WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE AND standard_status IN ('Active', 'Active Under Contract') AND list_price IS NOT NULL
GROUP BY city, postal_code, INITCAP(LOWER(subdivision_name)), dom_band, band_order;

-- ============================================
-- MV 5: COMMUNITY SCORECARD — One row per subdivision
-- ============================================
DROP MATERIALIZED VIEW IF EXISTS mv_community_scorecard CASCADE;
CREATE MATERIALIZED VIEW mv_community_scorecard AS
SELECT city, postal_code,
  INITCAP(LOWER(subdivision_name)) AS subdivision_name,
  COUNT(*) FILTER (WHERE standard_status IN ('Active', 'Active Under Contract')) AS active_count,
  COUNT(*) FILTER (WHERE standard_status = 'Closed') AS closed_count,
  COUNT(*) FILTER (WHERE standard_status IN ('Pending', 'Active Under Contract')) AS pending_count,
  COALESCE(AVG(list_price) FILTER (WHERE standard_status IN ('Active', 'Active Under Contract')), 0)::numeric(14,2) AS avg_active_price,
  COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price) FILTER (WHERE standard_status IN ('Active', 'Active Under Contract'))::numeric, 0)::numeric(14,2) AS median_active_price,
  COALESCE(AVG(close_price) FILTER (WHERE standard_status = 'Closed'), 0)::numeric(14,2) AS avg_close_price,
  COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price) FILTER (WHERE standard_status = 'Closed')::numeric, 0)::numeric(14,2) AS median_close_price,
  COALESCE(AVG(CASE WHEN living_area > 0 AND standard_status IN ('Active', 'Active Under Contract') THEN list_price / living_area END), 0)::numeric(14,2) AS avg_price_per_sqft,
  COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CASE WHEN living_area > 0 THEN list_price / living_area END) FILTER (WHERE standard_status IN ('Active', 'Active Under Contract'))::numeric, 0)::numeric(14,2) AS median_price_per_sqft,
  COALESCE(AVG(days_on_market) FILTER (WHERE standard_status IN ('Active', 'Active Under Contract')), 0)::int AS avg_dom,
  COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market) FILTER (WHERE standard_status IN ('Active', 'Active Under Contract'))::numeric, 0)::int AS median_dom,
  COALESCE(AVG(living_area), 0)::numeric(14,2) AS avg_sqft,
  COALESCE(AVG(lot_size_acres), 0)::numeric(10,4) AS avg_lot_acres,
  COALESCE(AVG(year_built), 0)::int AS avg_year_built,
  COALESCE(AVG(CASE WHEN close_price > 0 AND list_price > 0 AND close_price / list_price < 5 THEN close_price / list_price END), 0)::numeric(8,4) AS avg_close_to_list_ratio,
  COALESCE(AVG(tax_annual_amount), 0)::numeric(14,2) AS avg_annual_tax,
  COALESCE(AVG(association_fee), 0)::numeric(14,2) AS avg_hoa_fee,
  COALESCE(AVG(CASE WHEN pool_private_yn = TRUE THEN 1 ELSE 0 END), 0)::numeric(5,4) AS pool_pct,
  COALESCE(AVG(CASE WHEN fireplace_yn = TRUE THEN 1 ELSE 0 END), 0)::numeric(5,4) AS fireplace_pct,
  COALESCE(AVG(CASE WHEN horse_yn = TRUE THEN 1 ELSE 0 END), 0)::numeric(5,4) AS horse_pct,
  COALESCE(AVG(CASE WHEN garage_spaces > 0 THEN garage_spaces END), 0)::numeric(4,1) AS avg_garage_spaces,
  AVG(latitude)::numeric(10,7) AS centroid_lat,
  AVG(longitude)::numeric(10,7) AS centroid_lng
FROM listing_records WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE AND list_price IS NOT NULL AND subdivision_name IS NOT NULL AND subdivision_name != ''
GROUP BY city, postal_code, INITCAP(LOWER(subdivision_name)) HAVING COUNT(*) >= 3;

-- ============================================
-- MV 6: HEATMAP POINTS — Lat/lng with metrics for H3 aggregation
-- ============================================
DROP MATERIALIZED VIEW IF EXISTS mv_heatmap_points CASCADE;
CREATE MATERIALIZED VIEW mv_heatmap_points AS
SELECT listing_key, latitude, longitude,
  INITCAP(LOWER(subdivision_name)) AS subdivision_name,
  city, postal_code, list_price, close_price,
  CASE WHEN living_area > 0 THEN (COALESCE(close_price, list_price) / living_area)::numeric(14,2) ELSE NULL END AS price_per_sqft,
  days_on_market,
  CASE WHEN close_price > 0 AND list_price > 0 AND close_price / list_price < 5 THEN (close_price / list_price * 100)::numeric(8,2) ELSE NULL END AS sale_to_list_pct,
  standard_status
FROM listing_records WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE AND latitude IS NOT NULL AND longitude IS NOT NULL AND list_price IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mv_heatmap_geo ON mv_heatmap_points (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_mv_heatmap_status ON mv_heatmap_points (standard_status);

-- ============================================
-- REFRESH FUNCTION — unchanged, still refreshes all 6 views
-- ============================================
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_market_pulse_monthly;
  REFRESH MATERIALIZED VIEW mv_price_band_distribution;
  REFRESH MATERIALIZED VIEW mv_supply_demand_monthly;
  REFRESH MATERIALIZED VIEW mv_inventory_age;
  REFRESH MATERIALIZED VIEW mv_community_scorecard;
  REFRESH MATERIALIZED VIEW mv_heatmap_points;
END;
$$ LANGUAGE plpgsql;

COMMIT;
