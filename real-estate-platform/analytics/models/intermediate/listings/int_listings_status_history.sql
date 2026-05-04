{{
  config(
    materialized='incremental',
    incremental_strategy='merge',
    unique_key='listing_key',
    on_schema_change='append_new_columns',
    tags=['intermediate', 'shared']
  )
}}

-- Per-listing status transition timeline derived from listing_change_log.
-- Used by BOTH active and closed marts:
--   Active: "median days from list to pending for current pendings"
--   Closed: "median days from active to pending to closed for last quarter"
--
-- Grain: listing_key. Incremental merge — touched only when a new status_change
-- event arrives.

WITH status_events AS (
  SELECT
    listing_key,
    source_timestamp,
    old_value AS old_status,
    new_value AS new_status
  FROM {{ ref('stg_armls__listing_change_log') }}
  WHERE field_name = 'standard_status'
    AND new_value IS NOT NULL

  {% if is_incremental() %}
    AND source_timestamp > (SELECT COALESCE(MAX(latest_event_at), '1970-01-01'::TIMESTAMP) FROM {{ this }})
  {% endif %}
),

-- Pending-window calculation: compute LAG in a separate CTE because DuckDB
-- (and most engines) disallow window functions inside aggregate expressions.
events_with_lag AS (
  SELECT
    listing_key,
    source_timestamp,
    old_status,
    new_status,
    LAG(source_timestamp) OVER (PARTITION BY listing_key ORDER BY source_timestamp) AS prev_event_at
  FROM status_events
),

per_listing AS (
  SELECT
    listing_key,
    MIN(source_timestamp) FILTER (WHERE new_status = 'Active')                  AS first_active_at,
    MAX(source_timestamp) FILTER (WHERE new_status = 'Active')                  AS last_active_at,
    MIN(source_timestamp) FILTER (WHERE new_status = 'Pending')                 AS first_pending_at,
    MIN(source_timestamp) FILTER (WHERE new_status = 'Closed')                  AS closed_at,
    COUNT(*) FILTER (WHERE new_status = 'Active')                               AS active_transitions,
    COUNT(*) FILTER (WHERE old_status = 'Pending' AND new_status = 'Active')    AS back_on_market_count,
    COUNT(*) FILTER (WHERE old_status = 'Active' AND new_status = 'Pending')    AS active_to_pending_transitions,
    -- Total time in Pending state across all transitions
    SUM(
      CASE
        WHEN old_status = 'Pending'
         AND new_status IN ('Closed','Active','Cancelled','Withdrawn')
         AND prev_event_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (source_timestamp - prev_event_at)) / 86400
      END
    ) AS total_days_pending,
    MAX(source_timestamp)                                                       AS latest_event_at
  FROM events_with_lag
  GROUP BY listing_key
)

SELECT
  listing_key,
  first_active_at,
  last_active_at,
  first_pending_at,
  closed_at,
  active_transitions,
  back_on_market_count,
  active_to_pending_transitions,
  -- Derived intervals
  CASE
    WHEN first_active_at IS NOT NULL AND first_pending_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (first_pending_at - first_active_at)) / 86400
  END AS days_to_first_pending,
  CASE
    WHEN first_pending_at IS NOT NULL AND closed_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (closed_at - first_pending_at)) / 86400
  END AS days_pending_to_closed,
  CASE
    WHEN first_active_at IS NOT NULL AND closed_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (closed_at - first_active_at)) / 86400
  END AS days_active_to_closed,
  COALESCE(total_days_pending, 0) AS total_days_pending,
  CASE WHEN back_on_market_count > 0 THEN TRUE ELSE FALSE END AS went_back_on_market,

  latest_event_at,
  CURRENT_TIMESTAMP AS silver_built_at

FROM per_listing
