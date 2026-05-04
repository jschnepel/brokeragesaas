{{
  config(
    materialized='incremental',
    incremental_strategy='merge',
    unique_key='listing_key',
    on_schema_change='append_new_columns',
    tags=['intermediate']
  )
}}

-- Joins int_listings_closed_cleaned to listing_geography to resolve
-- region/community/section slugs from the PostGIS classification.

SELECT
  c.*,
  lg.region_slug,
  lg.region_name,
  lg.community_slug,
  lg.community_name,
  lg.section_slug,
  lg.section_name,
  COALESCE(lg.is_in_region, FALSE) AS is_in_region,

  -- Price band as a derived dimension (used by fct_pulse_pricetier and others)
  CASE
    WHEN c.close_price <  400000 THEN '200K-400K'
    WHEN c.close_price <  600000 THEN '400K-600K'
    WHEN c.close_price <  800000 THEN '600K-800K'
    WHEN c.close_price < 1000000 THEN '800K-1M'
    WHEN c.close_price < 2000000 THEN '1M-2M'
    WHEN c.close_price < 5000000 THEN '2M-5M'
    ELSE '5M+'
  END AS price_band

FROM {{ ref('int_listings_closed_cleaned') }} c
LEFT JOIN {{ ref('stg_armls__listing_geography') }} lg USING (listing_key)
