{{
  config(
    materialized='incremental',
    incremental_strategy='merge',
    unique_key='listing_key',
    on_schema_change='append_new_columns',
    tags=['intermediate']
  )
}}

-- One row per closed listing, with price-trajectory metrics derived from
-- listing_change_log. ARMLS strips OriginalListPrice from the Property entity,
-- but every change is recorded in listing_change_log going back to 2011-10-01.
--
-- The earliest list_price event for a listing has old_value = original list price
-- (the price BEFORE the first recorded change).

WITH list_price_events AS (
  SELECT
    listing_key,
    source_timestamp,
    old_value_numeric AS old_price,
    new_value_numeric AS new_price
  FROM {{ ref('stg_armls__listing_change_log') }}
  WHERE field_name = 'list_price'
    AND old_value_numeric IS NOT NULL
    AND new_value_numeric IS NOT NULL
),

first_event AS (
  SELECT DISTINCT ON (listing_key)
    listing_key,
    old_price            AS original_list_price,
    source_timestamp     AS first_change_at
  FROM list_price_events
  ORDER BY listing_key, source_timestamp ASC
),

agg_events AS (
  SELECT
    listing_key,
    COUNT(*)                                                      AS price_change_count,
    COUNT(*) FILTER (WHERE new_price < old_price)                 AS reduction_count,
    COUNT(*) FILTER (WHERE new_price > old_price)                 AS increase_count,
    SUM(GREATEST(old_price - new_price, 0))                       AS total_reduction_amount,
    SUM(GREATEST(new_price - old_price, 0))                       AS total_increase_amount,
    MIN(source_timestamp)                                         AS first_change_at,
    MAX(source_timestamp)                                         AS last_change_at
  FROM list_price_events
  GROUP BY listing_key
),

closed AS (
  SELECT
    listing_key,
    list_price        AS final_list_price,
    close_price,
    listing_contract_date,
    on_market_date,
    close_date
  FROM {{ ref('int_listings_closed_cleaned') }}
)

SELECT
  c.listing_key,

  -- Original / final / close
  COALESCE(fe.original_list_price, c.final_list_price) AS original_list_price,
  CASE
    WHEN fe.original_list_price IS NOT NULL THEN 'change_log'
    ELSE 'final_list_assumed'
  END AS original_list_price_source,
  c.final_list_price,
  c.close_price,

  -- Reduction signals
  COALESCE(ae.reduction_count, 0) > 0 AS had_price_reduction,
  COALESCE(ae.price_change_count, 0)  AS price_change_count,
  COALESCE(ae.reduction_count, 0)     AS reduction_count,
  COALESCE(ae.increase_count, 0)      AS increase_count,
  COALESCE(ae.total_reduction_amount, 0) AS total_reduction_amount,
  COALESCE(ae.total_increase_amount, 0)  AS total_increase_amount,

  -- Net change from original to final list (negative = reduced)
  c.final_list_price - COALESCE(fe.original_list_price, c.final_list_price) AS net_price_change,
  CASE
    WHEN COALESCE(fe.original_list_price, 0) > 0
    THEN (c.final_list_price - fe.original_list_price) / fe.original_list_price * 100
  END AS net_price_change_pct,

  -- Velocity-of-change signals
  fe.first_change_at,
  ae.last_change_at,
  CASE
    WHEN fe.first_change_at IS NOT NULL AND c.on_market_date IS NOT NULL
    THEN (fe.first_change_at::DATE - c.on_market_date)
  END AS days_to_first_change,

  -- True negotiation strength (close vs ORIGINAL list, not just final list)
  CASE
    WHEN COALESCE(fe.original_list_price, 0) > 0
    THEN c.close_price::DOUBLE / fe.original_list_price
  END AS close_to_original_ratio,

  CURRENT_TIMESTAMP AS silver_built_at

FROM closed c
LEFT JOIN first_event fe USING (listing_key)
LEFT JOIN agg_events  ae USING (listing_key)
