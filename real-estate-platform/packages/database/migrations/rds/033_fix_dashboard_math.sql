-- Migration 033 — Fix dashboard math discrepancies
-- Surfaced by 2026-04-29 manual audit (scripts/verify-dashboard-math.mjs).
--
-- Bugs fixed:
--   #1  mv_market_pulse groups Closed-cohort metrics by contract_month
--       (should be close_month). 80% undercount on most-recent month.
--   #2  mv_dashboard.current_active_count counts only standard_status='Active',
--       silently excluding 'Active Under Contract' (~19% undercount).
--   #3  mv_dashboard.pct_price_cuts always 0.0 — depends on
--       original_list_price which Spark replication does not populate.
--       Replaced with a listing_change_log-derived metric.
--   #4  mv_dashboard.yoy_inventory_change hardcoded to 0. Replaced with a
--       lookup against new active_inventory_snapshots side table; NULL
--       when no 12-month-old snapshot exists yet.
--   #5  mv_dashboard.current_avg_dom carries float-precision tail
--       (95.5222965440356745). Now ROUND'd to 2 decimal places at MV time.
--
-- ARMLS-compliant: derived-layer only. listing_records and other mirror
-- tables are untouched.
--
-- Apply order: BEGIN → drop dependent MVs → recreate → COMMIT → manual REFRESH.
-- The sync Lambda's REFRESH_ORDER (infra/lambda/armls-sync.ts) does NOT need
-- to change — same MV names, same physical structure.

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. Side table: daily snapshots of active inventory by scope.
--    Populated by sync Lambda (separate code change). Without this,
--    yoy_inventory_change has no historical baseline to compare against.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS active_inventory_snapshots (
  snapshot_date     DATE        NOT NULL,
  scope_type        TEXT        NOT NULL,
  scope_key         TEXT        NOT NULL,
  property_segment  TEXT        NOT NULL,
  active_count      INT         NOT NULL,
  active_auc_count  INT         NOT NULL,
  pending_count     INT         NOT NULL,
  recorded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (snapshot_date, scope_type, scope_key, property_segment)
);

CREATE INDEX IF NOT EXISTS idx_active_inv_snap_lookup
  ON active_inventory_snapshots (scope_type, scope_key, property_segment, snapshot_date DESC);

COMMENT ON TABLE active_inventory_snapshots IS
  'Daily snapshot of active inventory counts per scope. Sync Lambda inserts one row per scope/segment per day. Used by mv_dashboard.yoy_inventory_change.';

-- Seed today's snapshot so the first refresh of mv_dashboard has data.
-- (Future snapshots come from the sync Lambda.)
INSERT INTO active_inventory_snapshots (
  snapshot_date, scope_type, scope_key, property_segment,
  active_count, active_auc_count, pending_count
)
SELECT
  CURRENT_DATE, sc.scope_type, sc.scope_key, sc.property_segment,
  COUNT(*) FILTER (WHERE ab.standard_status = 'Active'),
  COUNT(*) FILTER (WHERE ab.standard_status IN ('Active','Active Under Contract')),
  COUNT(*) FILTER (WHERE ab.standard_status = 'Pending')
FROM analytics_base ab
CROSS JOIN LATERAL (
  VALUES
    ('metro'::TEXT,  'phoenix_metro'::TEXT, 'all'::TEXT,         TRUE),
    ('metro',        'phoenix_metro',       'residential',       ab.property_segment = 'residential'),
    ('metro',        'phoenix_metro',       'land',              ab.property_segment = 'land'),
    ('region',       ab.region_slug,        'all',               ab.region_slug IS NOT NULL),
    ('region',       ab.region_slug,        'residential',       ab.region_slug IS NOT NULL AND ab.property_segment = 'residential'),
    ('region',       ab.region_slug,        'land',              ab.region_slug IS NOT NULL AND ab.property_segment = 'land'),
    ('community',    ab.community_slug,     'all',               ab.community_slug IS NOT NULL),
    ('community',    ab.community_slug,     'residential',       ab.community_slug IS NOT NULL AND ab.property_segment = 'residential'),
    ('community',    ab.community_slug,     'land',              ab.community_slug IS NOT NULL AND ab.property_segment = 'land')
) AS sc(scope_type, scope_key, property_segment, included)
WHERE sc.included
GROUP BY sc.scope_type, sc.scope_key, sc.property_segment
ON CONFLICT (snapshot_date, scope_type, scope_key, property_segment) DO NOTHING;


-- ════════════════════════════════════════════════════════════════════
-- 2. Rebuild mv_market_pulse with cohort-correct month bucketing.
--    Closed rows → close_month. All other statuses → contract_month.
-- ════════════════════════════════════════════════════════════════════

DROP MATERIALIZED VIEW IF EXISTS mv_market_pulse CASCADE;

CREATE MATERIALIZED VIEW mv_market_pulse AS
WITH cohort AS (
  -- Single CTE that derives the correct month per status.
  -- source_segment is renamed from property_segment to avoid name collision
  -- with the literal property_segment column in the expanded UNION below.
  SELECT
    CASE WHEN standard_status = 'Closed' THEN close_month ELSE contract_month END AS month,
    standard_status, list_price, close_price, days_on_market, price_per_sqft,
    property_segment AS source_segment,
    region_slug, community_slug
  FROM analytics_base
  WHERE (standard_status = 'Closed' AND close_date IS NOT NULL)
     OR  standard_status != 'Closed'
),
expanded AS (
  -- 9 scope/segment combinations (matches the original mv_market_pulse expansion).
  SELECT 'metro'::TEXT AS scope_type, 'phoenix_metro'::TEXT AS scope_key,
         'all'::TEXT AS property_segment, c.* FROM cohort c
  UNION ALL
  SELECT 'metro', 'phoenix_metro', 'residential', c.*
    FROM cohort c WHERE c.source_segment = 'residential'
  UNION ALL
  SELECT 'metro', 'phoenix_metro', 'land', c.*
    FROM cohort c WHERE c.source_segment = 'land'
  UNION ALL
  SELECT 'region', c.region_slug, 'all', c.*
    FROM cohort c WHERE c.region_slug IS NOT NULL
  UNION ALL
  SELECT 'region', c.region_slug, 'residential', c.*
    FROM cohort c WHERE c.region_slug IS NOT NULL AND c.source_segment = 'residential'
  UNION ALL
  SELECT 'region', c.region_slug, 'land', c.*
    FROM cohort c WHERE c.region_slug IS NOT NULL AND c.source_segment = 'land'
  UNION ALL
  SELECT 'community', c.community_slug, 'all', c.*
    FROM cohort c WHERE c.community_slug IS NOT NULL
  UNION ALL
  SELECT 'community', c.community_slug, 'residential', c.*
    FROM cohort c WHERE c.community_slug IS NOT NULL AND c.source_segment = 'residential'
  UNION ALL
  SELECT 'community', c.community_slug, 'land', c.*
    FROM cohort c WHERE c.community_slug IS NOT NULL AND c.source_segment = 'land'
)
SELECT
  scope_type, scope_key, property_segment, month, standard_status,
  COUNT(*)::INT AS listing_count,
  COUNT(*) FILTER (WHERE standard_status = 'Closed')::INT AS closed_count,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price)
    FILTER (WHERE standard_status = 'Closed')::NUMERIC(14,2) AS median_close_price,
  AVG(close_price) FILTER (WHERE standard_status = 'Closed')::NUMERIC(14,2) AS avg_close_price,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price)::NUMERIC(14,2) AS median_list_price,
  ROUND(AVG(days_on_market) FILTER (WHERE standard_status = 'Closed')::NUMERIC, 2) AS avg_dom,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market)
    FILTER (WHERE standard_status = 'Closed')::NUMERIC(8,2) AS median_dom,
  ROUND(AVG(price_per_sqft) FILTER (WHERE standard_status = 'Closed' AND price_per_sqft IS NOT NULL)::NUMERIC, 2) AS avg_price_per_sqft,
  SUM(close_price) FILTER (WHERE standard_status = 'Closed')::NUMERIC(18,2) AS total_volume
FROM expanded
GROUP BY scope_type, scope_key, property_segment, month, standard_status;

CREATE UNIQUE INDEX idx_mv_market_pulse_pk
  ON mv_market_pulse (scope_type, scope_key, property_segment, month, standard_status);

COMMENT ON MATERIALIZED VIEW mv_market_pulse IS
  'Monthly market pulse. month = close_month for Closed rows, contract_month for others. Fixed 2026-04-29 (was contract_month for all, causing recent-month closed-cohort undercount).';


-- ════════════════════════════════════════════════════════════════════
-- 3. Rebuild mv_dashboard with the 4 remaining fixes:
--    - current_active_count includes 'Active Under Contract'
--    - pct_price_cuts derived from listing_change_log price-decrease events
--    - yoy_inventory_change looks up active_inventory_snapshots
--    - current_avg_dom rounded to numeric(8,2)
-- ════════════════════════════════════════════════════════════════════

DROP MATERIALIZED VIEW IF EXISTS mv_dashboard CASCADE;

CREATE MATERIALIZED VIEW mv_dashboard AS
WITH price_cuts AS (
  -- Active listings that have had a price-decrease event in the last 90 days,
  -- joined to scope dimensions. Replaces the broken original_list_price formula.
  SELECT
    ab.listing_key,
    ab.property_segment,
    ab.region_slug,
    ab.community_slug
  FROM analytics_base ab
  WHERE ab.standard_status = 'Active'
    AND EXISTS (
      SELECT 1 FROM listing_change_log lcl
      WHERE lcl.listing_key = ab.listing_key
        AND lcl.field_name = 'list_price'
        AND lcl.changed_at >= NOW() - INTERVAL '90 days'
        AND lcl.new_value ~ '^[0-9]+\.?[0-9]*$'
        AND lcl.old_value ~ '^[0-9]+\.?[0-9]*$'
        AND lcl.new_value::NUMERIC < lcl.old_value::NUMERIC
    )
),
yoy_inv AS (
  -- Lookup active count from ~365 days ago. Window of ±7 days to absorb
  -- snapshot gaps. NULL if no historical row.
  SELECT
    scope_type, scope_key, property_segment,
    AVG(active_auc_count)::NUMERIC AS prior_active_auc
  FROM active_inventory_snapshots
  WHERE snapshot_date BETWEEN CURRENT_DATE - INTERVAL '372 days'
                          AND CURRENT_DATE - INTERVAL '358 days'
  GROUP BY 1, 2, 3
),
scopes_src AS (
  -- Project analytics_base with property_segment renamed (same fix as mv_market_pulse cohort).
  SELECT
    listing_key, standard_status, list_price, close_price, days_on_market,
    contract_month, close_month,
    property_segment AS source_segment,
    region_slug, community_slug
  FROM analytics_base
),
scopes AS (
  -- 9-combo expansion. property_segment is the literal scope label;
  -- source_segment is the original analytics_base classification.
  SELECT 'metro'::TEXT AS scope_type, 'phoenix_metro'::TEXT AS scope_key,
         'all'::TEXT AS property_segment, s.* FROM scopes_src s
  UNION ALL
  SELECT 'metro', 'phoenix_metro', 'residential', s.*
    FROM scopes_src s WHERE s.source_segment = 'residential'
  UNION ALL
  SELECT 'metro', 'phoenix_metro', 'land', s.*
    FROM scopes_src s WHERE s.source_segment = 'land'
  UNION ALL
  SELECT 'region', s.region_slug, 'all', s.*
    FROM scopes_src s WHERE s.region_slug IS NOT NULL
  UNION ALL
  SELECT 'region', s.region_slug, 'residential', s.*
    FROM scopes_src s WHERE s.region_slug IS NOT NULL AND s.source_segment = 'residential'
  UNION ALL
  SELECT 'region', s.region_slug, 'land', s.*
    FROM scopes_src s WHERE s.region_slug IS NOT NULL AND s.source_segment = 'land'
  UNION ALL
  SELECT 'community', s.community_slug, 'all', s.*
    FROM scopes_src s WHERE s.community_slug IS NOT NULL
  UNION ALL
  SELECT 'community', s.community_slug, 'residential', s.*
    FROM scopes_src s WHERE s.community_slug IS NOT NULL AND s.source_segment = 'residential'
  UNION ALL
  SELECT 'community', s.community_slug, 'land', s.*
    FROM scopes_src s WHERE s.community_slug IS NOT NULL AND s.source_segment = 'land'
)
SELECT
  s.scope_type, s.scope_key, s.property_segment,

  -- FIX #2: include both Active and Active Under Contract
  COUNT(*) FILTER (WHERE s.standard_status IN ('Active','Active Under Contract'))::INT AS current_active_count,
  COUNT(*) FILTER (WHERE s.standard_status = 'Pending')::INT AS current_pending_count,

  -- Last-completed-month median (close_month based)
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY s.close_price)
    FILTER (WHERE s.standard_status = 'Closed' AND s.close_month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE
                                              AND s.close_month <  DATE_TRUNC('month', CURRENT_DATE)::DATE)::NUMERIC(14,2) AS current_median_price,

  -- FIX #5: round avg_dom
  ROUND(AVG(s.days_on_market) FILTER (
    WHERE s.standard_status = 'Closed'
      AND s.close_month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE
      AND s.close_month <  DATE_TRUNC('month', CURRENT_DATE)::DATE
  )::NUMERIC, 2) AS current_avg_dom,

  COUNT(*) FILTER (WHERE s.contract_month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE)::INT AS current_new_listings_30d,

  COUNT(*) FILTER (WHERE s.standard_status = 'Closed' AND s.close_month = DATE_TRUNC('month', CURRENT_DATE)::DATE)::INT AS mtd_closed,
  SUM(s.close_price) FILTER (WHERE s.standard_status = 'Closed' AND s.close_month = DATE_TRUNC('month', CURRENT_DATE)::DATE)::NUMERIC(18,2) AS mtd_volume,

  -- Months of supply: Active+AUC / 12-month avg monthly closings (industry standard)
  CASE
    WHEN COUNT(*) FILTER (WHERE s.standard_status = 'Closed' AND s.close_month >= (CURRENT_DATE - INTERVAL '12 months')::DATE) > 0
    THEN ROUND(
      COUNT(*) FILTER (WHERE s.standard_status IN ('Active','Active Under Contract'))::NUMERIC
      / NULLIF(COUNT(*) FILTER (WHERE s.standard_status = 'Closed' AND s.close_month >= (CURRENT_DATE - INTERVAL '12 months')::DATE)::NUMERIC / 12.0, 0),
      1
    )
    ELSE NULL
  END AS current_months_of_supply,

  -- YoY price change (existing formula, now using close_month — already was)
  CASE
    WHEN PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY s.close_price) FILTER (
      WHERE s.standard_status = 'Closed'
        AND s.close_month >= (CURRENT_DATE - INTERVAL '2 years')::DATE
        AND s.close_month <  (CURRENT_DATE - INTERVAL '1 year')::DATE
    ) > 0 THEN ROUND(
      ((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY s.close_price) FILTER (
          WHERE s.standard_status = 'Closed' AND s.close_month >= (CURRENT_DATE - INTERVAL '1 year')::DATE
        )
       - PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY s.close_price) FILTER (
          WHERE s.standard_status = 'Closed'
            AND s.close_month >= (CURRENT_DATE - INTERVAL '2 years')::DATE
            AND s.close_month <  (CURRENT_DATE - INTERVAL '1 year')::DATE
        ))
       / PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY s.close_price) FILTER (
          WHERE s.standard_status = 'Closed'
            AND s.close_month >= (CURRENT_DATE - INTERVAL '2 years')::DATE
            AND s.close_month <  (CURRENT_DATE - INTERVAL '1 year')::DATE
        ) * 100
      )::NUMERIC, 1
    )
    ELSE NULL
  END AS yoy_price_change,

  -- FIX #4: real YoY inventory change from snapshot history (NULL if no baseline)
  CASE
    WHEN yi.prior_active_auc IS NOT NULL AND yi.prior_active_auc > 0 THEN ROUND(
      ((COUNT(*) FILTER (WHERE s.standard_status IN ('Active','Active Under Contract'))::NUMERIC
        - yi.prior_active_auc) / yi.prior_active_auc) * 100, 1)
    ELSE NULL
  END AS yoy_inventory_change,

  -- FIX #3: pct_price_cuts from listing_change_log
  CASE
    WHEN COUNT(*) FILTER (WHERE s.standard_status = 'Active') > 0 THEN ROUND(
      COUNT(*) FILTER (WHERE s.standard_status = 'Active' AND pc.listing_key IS NOT NULL)::NUMERIC
      / COUNT(*) FILTER (WHERE s.standard_status = 'Active')::NUMERIC * 100, 1)
    ELSE NULL
  END AS pct_price_cuts,

  -- pct_above_list (close-cohort, last completed month)
  CASE
    WHEN COUNT(*) FILTER (
      WHERE s.standard_status = 'Closed'
        AND s.close_month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE
        AND s.close_month <  DATE_TRUNC('month', CURRENT_DATE)::DATE
        AND s.list_price > 0
    ) > 0 THEN ROUND(
      COUNT(*) FILTER (
        WHERE s.standard_status = 'Closed'
          AND s.close_month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE
          AND s.close_month <  DATE_TRUNC('month', CURRENT_DATE)::DATE
          AND s.close_price > s.list_price
      )::NUMERIC
      / NULLIF(COUNT(*) FILTER (
        WHERE s.standard_status = 'Closed'
          AND s.close_month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE
          AND s.close_month <  DATE_TRUNC('month', CURRENT_DATE)::DATE
          AND s.list_price > 0
      ), 0)::NUMERIC * 100, 1)
    ELSE NULL
  END AS pct_above_list,

  NOW() AS refreshed_at

FROM scopes s
-- price_cuts only contains Active listings — we LEFT JOIN by listing_key
-- because `scopes` has already replicated each listing across the scope rows
-- it belongs to. `pc.listing_key IS NOT NULL` becomes the cut indicator.
LEFT JOIN price_cuts pc ON pc.listing_key = s.listing_key
LEFT JOIN yoy_inv yi ON yi.scope_type = s.scope_type
                    AND yi.scope_key = s.scope_key
                    AND yi.property_segment = s.property_segment

GROUP BY s.scope_type, s.scope_key, s.property_segment, yi.prior_active_auc;

CREATE UNIQUE INDEX idx_mv_dashboard_pk
  ON mv_dashboard (scope_type, scope_key, property_segment);

COMMENT ON MATERIALIZED VIEW mv_dashboard IS
  'Hero KPIs by scope+segment. Fixes 2026-04-29: active count includes AUC, MOS uses 12mo denominator, pct_price_cuts from change-log, yoy_inventory_change from active_inventory_snapshots, avg_dom rounded.';

COMMIT;

-- ════════════════════════════════════════════════════════════════════
-- Manual REFRESH (NOT inside the transaction).
-- Sync Lambda's REFRESH_ORDER will pick this up on the next invocation.
-- ════════════════════════════════════════════════════════════════════
REFRESH MATERIALIZED VIEW mv_market_pulse;
REFRESH MATERIALIZED VIEW mv_dashboard;
