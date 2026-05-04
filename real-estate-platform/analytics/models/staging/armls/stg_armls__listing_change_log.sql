{{ config(materialized='table') }}

-- 1:1 staging over the bronze Parquet export of armls.listing_change_log
-- (rlsir-armls-parquet-export Lambda, incremental mode).
--
-- Each Lambda run writes ONLY new change events (rows with id > last_max_id
-- from the watermark in bronze/parquet/listing_change_log/_state.json).
-- Globbing all per-run Parquets reconstructs the full 14-year history with
-- minimal scan cost — most files are <1MB after the first bootstrap run.
--
-- Source: s3://.../bronze/parquet/listing_change_log/sync_year=*/sync_month=*/sync_day=*/run_id=*/data.parquet
--
-- Dedup by `id` (the BIGSERIAL primary key) — should be unique across all
-- per-run snapshots, but DISTINCT ON guards against rare overlap (e.g., a
-- run that crashed mid-write and was retried).
--
-- Casts numeric/date values for known field_names so downstream models
-- don't need to cast repeatedly.

WITH bronze AS (
  SELECT * FROM read_parquet(
    's3://rlsir-platform-assets-us-east-1/bronze/parquet/listing_change_log/sync_year=*/sync_month=*/sync_day=*/run_id=*/data.parquet',
    hive_partitioning=true,
    union_by_name=true
  )
),

dedup AS (
  -- Should be unique by id, but guard against retry overlap.
  SELECT DISTINCT ON (id)
    id,
    listing_key,
    listing_id,
    changed_at,
    source_timestamp,
    field_name,
    old_value,
    new_value,
    sync_run_id,
    sync_observed_at
  FROM bronze
  ORDER BY id, sync_observed_at DESC
)

SELECT
  id,
  listing_key,
  listing_id,
  changed_at,
  source_timestamp,
  field_name,
  old_value,
  new_value,

  -- Casted numeric versions for the fields we aggregate on.
  CASE WHEN field_name IN ('list_price', 'close_price', 'original_list_price', 'previous_list_price')
       THEN TRY_CAST(NULLIF(old_value, '') AS NUMERIC) END AS old_value_numeric,
  CASE WHEN field_name IN ('list_price', 'close_price', 'original_list_price', 'previous_list_price')
       THEN TRY_CAST(NULLIF(new_value, '') AS NUMERIC) END AS new_value_numeric,

  -- Casted date versions for the date fields.
  CASE WHEN field_name IN ('close_date', 'off_market_date', 'on_market_date',
                           'listing_contract_date', 'pending_timestamp')
       THEN TRY_CAST(NULLIF(old_value, '') AS DATE) END AS old_value_date,
  CASE WHEN field_name IN ('close_date', 'off_market_date', 'on_market_date',
                           'listing_contract_date', 'pending_timestamp')
       THEN TRY_CAST(NULLIF(new_value, '') AS DATE) END AS new_value_date,

  -- Provenance from the parquet-export Lambda.
  sync_run_id,
  sync_observed_at

FROM dedup
