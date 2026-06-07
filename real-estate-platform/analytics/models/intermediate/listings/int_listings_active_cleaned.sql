{{
  config(
    materialized='table',
    enabled=(var('enable_active', false)),
    tags=['intermediate', 'active']
  )
}}

-- Silver fact for currently-active listings. One row per active listing.
-- Materialized as TABLE (not incremental) — actives churn fast and the
-- snapshot is always a full overwrite, so incremental adds nothing here.
--
-- Refresh cadence: every 1 hour, immediately after active-snapshot Lambda runs.
-- Validated + dimensionally enriched the same way as int_listings_closed_cleaned.

WITH source AS (
  SELECT * FROM {{ ref('stg_armls__active_listings') }}
  WHERE list_price BETWEEN {{ var('min_list_price') }} AND {{ var('max_list_price') }}
    AND (living_area IS NULL OR living_area BETWEEN {{ var('min_living_area') }} AND {{ var('max_living_area') }})
    AND (days_on_market IS NULL OR days_on_market BETWEEN 0 AND 5000)
    AND (association_fee IS NULL OR association_fee <= 50000)
    AND (lot_size_acres IS NULL OR lot_size_acres < 10000)
    AND NOT (list_price <= 99)  -- placeholder $1 listings
),

geo AS (
  SELECT * FROM {{ ref('stg_armls__listing_geography') }}
),

-- Canonical-map fallback for community/subdivision identification when
-- the listing_geography polygon doesn't cover the listing. See
-- int_listings_geographic_enriched for the same pattern on closed listings.
canonical_map AS (
  SELECT
    UPPER(TRIM(raw_subdivision_name)) AS raw_key,
    canonical_community,
    ROW_NUMBER() OVER (
      PARTITION BY UPPER(TRIM(raw_subdivision_name))
      ORDER BY confidence DESC NULLS LAST, mapping_method
    ) AS rn
  FROM rlsir_platform.public.subdivision_canonical_map
  WHERE NOT COALESCE(is_garbage, FALSE)
    AND canonical_community IS NOT NULL
    AND TRIM(canonical_community) NOT IN ('', 'NONE', 'N/A', 'METES AND BOUNDS')
),
dedup_canonical AS (
  SELECT raw_key, canonical_community
  FROM canonical_map
  WHERE rn = 1
)

SELECT
  -- Identifiers
  s.listing_key,
  s.listing_id,

  -- Status (always one of Active/AUC/Pending/Coming Soon)
  s.standard_status,
  s.property_type,
  s.property_sub_type,
  -- 7-bucket RESO-aligned segment (single source of truth in macros/calendar_spine.sql).
  -- Aligned to int_listings_closed_cleaned.property_segment so both sides of
  -- the lifecycle use identical vocabulary.
  {{ property_type_to_segment('s.property_type') }} AS property_segment,
  -- Price tier — universal luxury overlay (Compass/Coldwell/Christie's).
  {{ price_tier('s.list_price') }} AS price_tier,

  -- Prices
  s.list_price,
  CASE
    WHEN s.living_area > 0 THEN ROUND(s.list_price::DOUBLE / s.living_area, 2)
  END AS list_price_per_sqft,

  -- Time / status semantics
  s.listing_contract_date,
  s.on_market_date,
  -- Exposed so downstream pace model can fall back to the canonical
  -- ARMLS receipt timestamp when on_market_date is missing.
  s.original_entry_timestamp,
  s.pending_timestamp,
  s.status_change_timestamp,
  s.modification_timestamp,
  -- Effective DOM for currently-active listings.
  --
  -- Spark hides days_on_market on actives via Core.Permissions (staging
  -- hard-codes NULL — verified 100% NULL across all 31,332 actives in the
  -- 2026-05-23 snapshot), and on_market_date is only populated on ~30.5%
  -- of actives. The honest derivation has to terminate somewhere
  -- meaningful — using listing_contract_date as a fallback overestimates
  -- DOM by the prep window (signed → photos → go-live, typically 3-14
  -- days), which violates the literal definition of "days on market."
  --
  -- status_change_timestamp is the right fallback for currently-active
  -- inventory: it's 100% populated AND it captures "when did this listing
  -- enter its current status." For an Active listing that's the moment
  -- it went Active. Cross-tab verification across the same snapshot: of
  -- the 9,563 actives where both fields exist, 74.1% are on the exact
  -- same day and 78.6% are within 3 days. The remaining ~21% are
  -- listings that came back from Pending — for those, status_change_ts
  -- correctly reflects the current Active spell rather than the original
  -- listing date (industry convention: DOM resets on re-list).
  COALESCE(
    s.days_on_market,
    (CURRENT_DATE - s.on_market_date)::INT,
    (CURRENT_DATE - s.status_change_timestamp::DATE)::INT
  ) AS days_on_market,
  -- Pipeline-stage flags
  CASE WHEN s.standard_status = 'Active' THEN TRUE ELSE FALSE END AS is_active,
  CASE WHEN s.standard_status = 'Pending' THEN TRUE ELSE FALSE END AS is_pending,
  CASE WHEN s.standard_status = 'Active Under Contract' THEN TRUE ELSE FALSE END AS is_aux,
  CASE WHEN s.standard_status = 'Coming Soon' THEN TRUE ELSE FALSE END AS is_coming_soon,
  -- Days since last status change (e.g., days in current Pending state)
  CASE
    WHEN s.status_change_timestamp IS NOT NULL
    THEN (CURRENT_DATE - s.status_change_timestamp::DATE)::INT
  END AS days_in_current_status,

  -- Property core
  s.bedrooms,
  s.bathrooms_total,
  s.living_area,
  CASE
    WHEN s.living_area BETWEEN     1 AND  1499 THEN '<1500'
    WHEN s.living_area BETWEEN  1500 AND  1999 THEN '1500-1999'
    WHEN s.living_area BETWEEN  2000 AND  2499 THEN '2000-2499'
    WHEN s.living_area BETWEEN  2500 AND  2999 THEN '2500-2999'
    WHEN s.living_area BETWEEN  3000 AND  3999 THEN '3000-3999'
    WHEN s.living_area BETWEEN  4000 AND  4999 THEN '4000-4999'
    WHEN s.living_area >= 5000 THEN '5000+'
  END AS sqft_band,
  s.lot_size_acres,
  s.year_built,
  CASE
    WHEN s.year_built BETWEEN 1900 AND 1949 THEN 'pre-1950'
    WHEN s.year_built BETWEEN 1950 AND 1959 THEN '1950s'
    WHEN s.year_built BETWEEN 1960 AND 1969 THEN '1960s'
    WHEN s.year_built BETWEEN 1970 AND 1979 THEN '1970s'
    WHEN s.year_built BETWEEN 1980 AND 1989 THEN '1980s'
    WHEN s.year_built BETWEEN 1990 AND 1999 THEN '1990s'
    WHEN s.year_built BETWEEN 2000 AND 2009 THEN '2000s'
    WHEN s.year_built BETWEEN 2010 AND 2019 THEN '2010s'
    WHEN s.year_built >= 2020 THEN '2020s'
  END AS year_built_decade,

  s.stories,

  -- Price band (derived for histogram marts). Brackets per yong2 chart spec.
  CASE
    WHEN s.list_price <   400000 THEN '200K-400K'
    WHEN s.list_price <   600000 THEN '400K-600K'
    WHEN s.list_price <   800000 THEN '600K-800K'
    WHEN s.list_price <  1000000 THEN '800K-1M'
    WHEN s.list_price <  2000000 THEN '1M-2M'
    WHEN s.list_price <  5000000 THEN '2M-5M'
    WHEN s.list_price < 10000000 THEN '5M-10M'
    ELSE '10M+'
  END AS price_band,

  -- DOM band (derived for histogram marts) — mirrors the effective DOM
  -- COALESCE chain above so a future column drift can't desync these two.
  {{ dom_band('COALESCE(s.days_on_market, (CURRENT_DATE - s.on_market_date)::INT, (CURRENT_DATE - s.status_change_timestamp::DATE)::INT)') }} AS dom_band,

  -- Features
  s.has_pool,
  s.is_horse_property,
  s.garage_spaces,
  s.association_fee,
  s.tax_annual_amount,

  -- Office / agent
  s.list_office_name,
  s.list_office_key,
  s.list_agent_full_name,
  s.list_agent_key,

  -- Community features. Stored as JSON-text VARCHAR in parquet (PG JSONB
  -- doesn't round-trip as DuckDB array). LIKE-pattern boolean flags;
  -- '= ANY(col)' triggers correlated UNNEST (unsupported).
  s.community_features,
  COALESCE(s.community_features LIKE '%"Gated"%',       FALSE) AS is_gated,
  COALESCE(s.community_features LIKE '%"Golf Course"%', FALSE) AS is_golf_community,
  COALESCE(
    s.community_features LIKE '%"Adult Community"%'
    OR s.community_features LIKE '%"Adult Living"%'
    OR s.community_features LIKE '%"Age Restricted"%',
    FALSE
  ) AS is_age_restricted,
  COALESCE(
    s.community_features LIKE '%"Community Pool"%'
    OR s.community_features LIKE '%"Pool"%',
    FALSE
  ) AS has_community_pool,

  -- Address / geography
  s.unparsed_address,
  s.city,
  s.postal_code,
  s.county,
  {{ clean_subdivision('s.subdivision_name') }} AS subdivision_name,
  s.latitude,
  s.longitude,

  -- Geographic enrichment
  geo.region_slug,
  geo.region_name,
  geo.community_slug,
  geo.community_name,
  geo.section_slug,

  -- Community via fresh point-in-polygon (authoritative), canonical-map slug as
  -- the gap-filler. See macros/pip_community.sql. EPSG:4326; ST_Covers; smallest
  -- polygon wins; NULL when no polygon covers the point.
  {{ pip_community_slug('s.latitude', 's.longitude') }} AS community_pip_slug,
  {{ pip_region_slug('s.latitude', 's.longitude') }}    AS region_pip_slug,
  {{ community_unified_slug(
       pip_community_slug('s.latitude', 's.longitude'),
       "NULLIF(LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(dc.canonical_community), '[^A-Za-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')), '')"
  ) }} AS community_unified_slug,
  COALESCE(
    NULLIF(LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(dc.canonical_community), '[^A-Za-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')), ''),
    NULLIF(LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(s.subdivision_name),     '[^A-Za-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')), '')
  ) AS subdivision_slug,

  -- Schools
  s.elementary_school,
  s.elementary_school_district,
  s.middle_or_junior_school,
  s.high_school,
  s.high_school_district,

  -- Compliance
  s.idx_display,
  s.address_display,
  s.photos_count,

  -- Provenance
  s.sync_run_id   AS source_sync_run_id,
  s.sync_observed_at AS source_observed_at,
  CURRENT_TIMESTAMP AS silver_built_at

FROM source s
LEFT JOIN geo USING (listing_key)
LEFT JOIN dedup_canonical dc ON UPPER(TRIM(s.subdivision_name)) = dc.raw_key
