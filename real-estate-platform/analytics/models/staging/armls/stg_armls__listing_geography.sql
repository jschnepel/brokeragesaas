{{ config(materialized='table') }}

-- 1:1 staging over the bronze Parquet snapshot of armls.listing_geography
-- (rlsir-armls-parquet-export Lambda, snapshot mode, EXCLUDE point).
--
-- The PostGIS `point` geometry column is dropped at export time (DuckDB's
-- postgres extension can't decode WKB). The classification slugs
-- (region_slug, community_slug) are preserved — those are what downstream
-- analytics actually uses.
--
-- Source: s3://.../bronze/parquet/listing_geography/sync_year=*/sync_month=*/sync_day=*/run_id=*/data.parquet
--
-- Dedup by listing_key keeping the latest sync_observed_at — the table is
-- slow-changing (PostGIS classification only re-runs when boundaries update)
-- but per-run snapshots could surface stale rows; pick the freshest.

WITH bronze AS (
  SELECT * FROM read_parquet(
    's3://rlsir-platform-assets-us-east-1/bronze/parquet/listing_geography/sync_year=*/sync_month=*/sync_day=*/run_id=*/data.parquet',
    hive_partitioning=true,
    union_by_name=true
  )
),

dedup AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY listing_key
      ORDER BY classified_at    DESC NULLS LAST,
               sync_observed_at DESC NULLS LAST
    ) AS rn
  FROM bronze
)

SELECT
  listing_key,
  region_id,
  region_slug,
  region_name,
  community_id,
  community_slug,
  community_name,
  -- section_slug / section_name don't exist in the source table; carry NULL stubs
  -- to keep downstream model interfaces stable.
  NULL::TEXT  AS section_slug,
  NULL::TEXT  AS section_name,
  is_in_region,
  classified_at,
  sync_run_id,
  sync_observed_at
FROM dedup
WHERE rn = 1
