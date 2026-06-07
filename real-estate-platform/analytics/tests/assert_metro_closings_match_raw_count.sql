{{ config(materialized='test') }}

-- Custom singular test: the headline metro closing_count must equal the raw
-- count of closed listings per month. fct_market_pulse counts one CLOSED
-- listing = one sale (COUNT(*), NAR convention). If anyone reverts it to
-- COUNT(DISTINCT dedup_signature) — which keys on parcel_number||close_year and
-- silently collapses distinct sales sharing an APN (mobile-home/RV/golf
-- resorts, multi-unit) and drops NULL-APN rows — the metro total will fall
-- below the raw count and this test fails loudly.
--
-- Scope = metro / property_segment='all' = every closed row, so the mart total
-- must reconcile exactly to fct_closings per month. The current (in-progress)
-- month is excluded from the mart, so it naturally drops out of the join.
--
-- A singular test passes when it returns ZERO rows.

WITH mart AS (
  SELECT month, SUM(closing_count) AS mart_count
  FROM {{ ref('fct_market_pulse') }}
  WHERE scope_type = 'metro' AND property_segment = 'all'
  GROUP BY month
),

raw_closings AS (
  SELECT close_month AS month, COUNT(*) AS raw_count
  FROM {{ ref('fct_closings') }}
  GROUP BY close_month
)

SELECT
  m.month,
  m.mart_count,
  r.raw_count
FROM mart m
JOIN raw_closings r USING (month)
WHERE m.mart_count <> r.raw_count
