-- Migration 031: idempotency for listing_records_exceptions
--
-- Adds a `run_id` column (YYYY-MM-DD by convention) and a unique index on
-- (listing_key, rule_name, run_id). Lets the scheduled DQ runner use
-- ON CONFLICT DO NOTHING so daily reruns don't multiply rows for the same
-- violation. Historical findings (one per day per violation) accumulate as
-- a time-series.
--
-- Compliance: side-table only (listing_records_exceptions). No mirror touched.

BEGIN;

ALTER TABLE listing_records_exceptions
  ADD COLUMN IF NOT EXISTS run_id TEXT;

-- Backfill existing rows with the date portion of detected_at.
UPDATE listing_records_exceptions
SET run_id = TO_CHAR(detected_at, 'YYYY-MM-DD')
WHERE run_id IS NULL;

ALTER TABLE listing_records_exceptions
  ALTER COLUMN run_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_lre_per_day
  ON listing_records_exceptions (listing_key, rule_name, run_id);

COMMIT;
