{{ config(
    materialized=('external' if target.name == 'prod' else 'table')
) }}

-- The atomic fact: one row per closed listing, with every dimension joined.
-- Partitioned by close_year for incremental rebuilds and downstream pruning.
-- All other gold marts aggregate from this; never re-derive from intermediate.

SELECT
  -- Surrogate key (per amendment 2026-04-28 §4.4)
  {{ dbt_utils.generate_surrogate_key(['c.listing_key']) }} AS closing_id,

  c.listing_key,
  c.listing_id,

  -- Time
  c.close_date,
  c.close_year,
  c.close_quarter,
  c.close_month,
  c.listing_contract_date,
  c.on_market_date,
  c.contract_to_close_days,
  c.days_on_market,

  -- Money
  c.list_price,
  c.close_price,
  c.close_price_per_sqft,
  c.list_price_per_sqft,
  c.sale_to_list_ratio,

  -- Price history (joined from int_listings_price_history)
  ph.original_list_price,
  ph.original_list_price_source,
  ph.had_price_reduction,
  ph.reduction_count,
  ph.total_reduction_amount,
  ph.net_price_change_pct,
  ph.close_to_original_ratio,
  ph.days_to_first_change,

  -- Property
  c.property_type,
  c.property_segment,
  c.bedrooms,
  c.bathrooms_total,
  c.living_area,
  c.sqft_band,
  c.lot_size_acres,
  c.year_built,
  c.year_built_decade,
  c.age_at_close,
  c.stories,
  c.has_pool,
  c.is_horse_property,
  c.garage_spaces,

  -- Community features
  c.is_gated,
  c.is_golf_community,
  c.is_age_restricted,
  c.has_community_pool,
  c.community_amenity_count,

  -- Geography (raw + classified)
  c.city,
  c.postal_code,
  c.county,
  c.subdivision_name,
  c.region_slug,
  c.region_name,
  c.community_slug,
  c.community_name,
  c.community_unified_slug,
  c.subdivision_slug,
  c.section_slug,
  c.price_band,
  c.latitude,
  c.longitude,

  -- Schools
  c.elementary_school_district,
  c.high_school_district,

  -- Sides
  c.list_office_name,
  c.list_office_key,
  c.list_agent_full_name,
  c.list_agent_key,
  c.buyer_office_name,
  c.buyer_office_key,
  c.buyer_agent_full_name,
  c.buyer_agent_key,
  CASE WHEN c.list_office_key IS NOT NULL AND c.list_office_key = c.buyer_office_key THEN TRUE ELSE FALSE END AS is_dual_representation,

  c.unparsed_address,
  c.photos_count,

  -- Provenance
  c.silver_built_at,
  c.silver_run_id,
  CURRENT_TIMESTAMP AS gold_built_at

FROM {{ ref('int_listings_geographic_enriched') }} c
LEFT JOIN {{ ref('int_listings_price_history') }} ph USING (listing_key)
