-- 034_drop_dashboard_mvs.sql
--
-- Phase 6 of dbt-cutover plan (2026-04-30) — drop the 9 dashboard MVs
-- now that yong2 reads dbt parquet marts via CloudFront, no RDS MV reads.
--
-- DESTRUCTIVE: requires explicit operator approval. Reversible only by
-- recreating from migrations 002 + 027 + 030 + 033. Take an RDS snapshot
-- before applying.
--
-- Prerequisites verified 2026-05-10:
--   - yong2 /phoenix, /pricing, /inventory, /activity, /timing all serve
--     from S3 parquet (218/232 numerics asserted, 0 fail).
--   - rlsir-mv-refresh-schedule EventBridge rule DISABLED so refresh task
--     no longer runs (no live readers will see staleness during the gap).
--   - packages/database/src/queries/analytics.ts already references
--     non-existent mv_market_pulse_monthly (queries throw at runtime, so
--     no production caller is silently broken by the drops).
--
-- After applying:
--   - VACUUM FULL on the freed disk space (separate transaction)
--   - Modify RDS instance class t3.medium → t3.small (~$19/mo savings)
--   - Update infra/lambda/armls-sync-bundle.ts taskRefreshViews to no-op
--     (or drop the task from the Lambda entirely)

BEGIN;

-- Drop in dependency order: dashboard depends on others, others depend on
-- analytics_base (the foundation). CASCADE for safety in case of view
-- dependencies we haven't catalogued.

DROP MATERIALIZED VIEW IF EXISTS mv_dashboard CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_market_pulse CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_supply_demand CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_absorption CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_negotiation CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_inventory_age CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_community_yoy CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_community_scorecard CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_price_bands CASCADE;

-- analytics_base feeds the 9 above. Once they're gone, it's also unused
-- — but dbt source models read from listing_records directly, NOT from
-- analytics_base, so dropping it is safe.
DROP MATERIALIZED VIEW IF EXISTS analytics_base CASCADE;

-- Refresh helpers — drop the stored procs that referenced these MVs.
-- The Lambda's taskRefreshViews calls refresh_analytics_pipeline() which
-- will no-op if missing once we update the Lambda; for now leave the
-- function but it'll just have nothing to refresh.
DROP FUNCTION IF EXISTS refresh_analytics_pipeline();
DROP FUNCTION IF EXISTS refresh_analytics_views();

COMMIT;

-- Post-apply manual steps (NOT in this migration):
--   1. VACUUM FULL  (or `vacuumdb --analyze --full -d ...`) — reclaims
--      the ~85 MB analytics_base + several hundred MB of derived MV
--      tablespaces. Takes RDS lock during execution; schedule a window.
--   2. AWS console: Modify rlsir-db instance class db.t3.medium → db.t3.small.
--      Apply during a maintenance window (~5 min downtime).
--   3. Update infra/lambda/armls-sync-bundle.ts: taskRefreshViews can
--      become a no-op (or drop the task entirely from the dispatch).
--      Then `node infra/lambda/build.mjs && aws lambda update-function-code`.
