{{
  config(
    materialized='incremental',
    incremental_strategy='merge',
    unique_key='listing_key',
    on_schema_change='append_new_columns',
    tags=['intermediate']
  )
}}

-- Silver fact: one row per CLOSED listing, validated and dimensionally enriched.
-- Microbatch incremental on close_date with 3-month lookback handles late-arriving data.
-- A weekly full refresh catches any retroactive corrections (run via dbt build --full-refresh).
--
-- Cleaning rules from docs/closed-listings-etl-strategy.md §"Silver — cleaning rules":
--   - Hard rejects: invalid close_date, close_price, list_price, ratio, living_area
--   - Soft fixes: TRIM city/subdivision, ZIP+4 strip, derived ppsf, decade buckets
--   - Provenance: silver_built_at, source_run_id, data_quality_flags

WITH source AS (
  SELECT * FROM {{ ref('stg_armls__listing_records') }}
  WHERE standard_status = 'Closed'
  {% if is_incremental() %}
    AND modification_timestamp > (SELECT COALESCE(MAX(source_modification_ts), '1970-01-01'::TIMESTAMP) FROM {{ this }})
  {% endif %}
),

valid AS (
  SELECT *
  FROM source
  WHERE {{ is_valid_close('close_date', 'close_price', 'list_price') }}
    AND (living_area IS NULL OR living_area BETWEEN {{ var('min_living_area') }} AND {{ var('max_living_area') }})
    AND (days_on_market IS NULL OR days_on_market BETWEEN 0 AND 5000)
)

SELECT
  -- Identifiers
  listing_key,
  listing_id,

  -- Status (always 'Closed' here, but kept for downstream uniformity)
  standard_status,
  property_type,
  property_sub_type,
  CASE
    WHEN property_type = 'Residential' THEN 'residential'
    WHEN property_type = 'Land'        THEN 'land'
    ELSE 'other'
  END AS property_segment,

  -- Prices
  list_price,
  close_price,
  CASE
    WHEN living_area > 0 THEN ROUND(close_price::DOUBLE / living_area, 2)
  END AS close_price_per_sqft,
  CASE
    WHEN living_area > 0 THEN ROUND(list_price::DOUBLE / living_area, 2)
  END AS list_price_per_sqft,
  close_price::DOUBLE / list_price AS sale_to_list_ratio,

  -- Time
  listing_contract_date,
  on_market_date,
  off_market_date,
  -- pending_timestamp not in Spark replication; recover from listing_change_log
  -- via int_listings_status_history downstream
  NULL::TIMESTAMP AS pending_timestamp,
  close_date,
  DATE_TRUNC('month',   close_date)::DATE        AS close_month,
  DATE_TRUNC('quarter', close_date)::DATE        AS close_quarter,
  EXTRACT(YEAR  FROM close_date)::INT             AS close_year,
  status_change_timestamp,
  modification_timestamp,

  -- Velocity / DOM (days_on_market is NULL from Spark; compute from dates)
  (close_date - listing_contract_date)::INT AS days_on_market,
  CASE
    WHEN listing_contract_date IS NOT NULL THEN (close_date - listing_contract_date)::INT
  END AS contract_to_close_days,

  -- Property core
  bedrooms,
  bathrooms_full,
  bathrooms_half,
  bathrooms_total,
  living_area,
  CASE
    WHEN living_area BETWEEN     1 AND  1499 THEN '<1500'
    WHEN living_area BETWEEN  1500 AND  1999 THEN '1500-1999'
    WHEN living_area BETWEEN  2000 AND  2499 THEN '2000-2499'
    WHEN living_area BETWEEN  2500 AND  2999 THEN '2500-2999'
    WHEN living_area BETWEEN  3000 AND  3999 THEN '3000-3999'
    WHEN living_area BETWEEN  4000 AND  4999 THEN '4000-4999'
    WHEN living_area >= 5000 THEN '5000+'
  END AS sqft_band,
  lot_size_acres,
  year_built,
  CASE
    WHEN year_built BETWEEN 1900 AND 1949 THEN 'pre-1950'
    WHEN year_built BETWEEN 1950 AND 1959 THEN '1950s'
    WHEN year_built BETWEEN 1960 AND 1969 THEN '1960s'
    WHEN year_built BETWEEN 1970 AND 1979 THEN '1970s'
    WHEN year_built BETWEEN 1980 AND 1989 THEN '1980s'
    WHEN year_built BETWEEN 1990 AND 1999 THEN '1990s'
    WHEN year_built BETWEEN 2000 AND 2009 THEN '2000s'
    WHEN year_built BETWEEN 2010 AND 2019 THEN '2010s'
    WHEN year_built >= 2020 THEN '2020s'
  END AS year_built_decade,
  EXTRACT(YEAR FROM close_date)::INT - year_built AS age_at_close,
  stories,

  -- Features (kept set per user direction)
  has_pool,
  is_horse_property,
  garage_spaces,
  association_fee,
  tax_annual_amount,

  -- List + buyer side
  list_office_name,
  list_office_key,
  list_agent_full_name,
  list_agent_key,
  -- Normalize ARMLS placeholders to NULL so they don't pollute leaderboards
  CASE WHEN buyer_office_name IN ('Non-MLS Office', 'Unknown', '') THEN NULL ELSE buyer_office_name END AS buyer_office_name,
  CASE WHEN buyer_office_name IN ('Non-MLS Office', 'Unknown', '') THEN NULL ELSE buyer_office_key  END AS buyer_office_key,
  CASE WHEN buyer_agent_full_name IN ('Non-MLS Agent', 'Unknown', '') THEN NULL ELSE buyer_agent_full_name END AS buyer_agent_full_name,
  CASE WHEN buyer_agent_full_name IN ('Non-MLS Agent', 'Unknown', '') THEN NULL ELSE buyer_agent_key       END AS buyer_agent_key,

  -- Community features (text array)
  community_features,
  COALESCE('Gated' = ANY(community_features), FALSE)        AS is_gated,
  COALESCE('Golf Course' = ANY(community_features), FALSE)  AS is_golf_community,
  COALESCE(
    'Adult Community' = ANY(community_features) OR 'Adult Living' = ANY(community_features) OR 'Age Restricted' = ANY(community_features),
    FALSE
  ) AS is_age_restricted,
  COALESCE('Community Pool' = ANY(community_features) OR 'Pool' = ANY(community_features), FALSE) AS has_community_pool,
  -- DuckDB: len() for arrays, cardinality() is MAP-only
  COALESCE(len(community_features), 0) AS community_amenity_count,

  -- Address / geography (raw — joined to dim_communities downstream)
  unparsed_address,
  city,
  postal_code,
  county,
  {{ clean_subdivision('subdivision_name') }} AS subdivision_name,
  latitude,
  longitude,

  -- Schools
  elementary_school,
  elementary_school_district,
  middle_or_junior_school,
  high_school,
  high_school_district,

  -- Compliance flags
  idx_display,
  address_display,

  -- Photos
  photos_count,
  parcel_number,

  -- Public remarks (kept; UI-time clipping)
  public_remarks,

  -- Provenance
  CURRENT_TIMESTAMP                AS silver_built_at,
  '{{ invocation_id }}'::TEXT      AS silver_run_id,
  modification_timestamp           AS source_modification_ts

FROM valid
