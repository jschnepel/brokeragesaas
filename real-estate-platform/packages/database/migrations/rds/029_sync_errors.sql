-- Migration 029: sync_errors side table
--
-- Quarantine table for individual row failures during ARMLS sync upsert.
-- Captures the offending row + error code so a single bad record never
-- rolls back its whole batch and so we can audit/triage repeat offenders.
--
-- Compliance note: this is a NEW side table. listing_records and other ARMLS
-- mirror tables remain untouched. ARMLS license requires the mirror to
-- faithfully reflect the source feed; quarantine of UNINGESTED rows
-- (rows that never made it INTO the mirror because they violated a
-- column constraint) does not violate that contract.
--
-- Apply with: psql $RDS_DATABASE_URL -f 029_sync_errors.sql
--   or: node packages/database/scripts/apply-029.mjs

CREATE TABLE IF NOT EXISTS sync_errors (
  id            BIGSERIAL PRIMARY KEY,
  entity_name   TEXT        NOT NULL,
  listing_key   TEXT,
  error_code    TEXT,
  error_message TEXT        NOT NULL,
  raw_payload   JSONB,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_errors_listing_key
  ON sync_errors (listing_key);

CREATE INDEX IF NOT EXISTS idx_sync_errors_occurred_at
  ON sync_errors (occurred_at DESC);

-- Optional partial index — recent unique error_codes for triage dashboards.
CREATE INDEX IF NOT EXISTS idx_sync_errors_recent_codes
  ON sync_errors (error_code, occurred_at DESC)
  WHERE occurred_at > '2026-01-01';

COMMENT ON TABLE sync_errors IS
  'Quarantine for ARMLS sync rows that failed upsert. Side table, additive only. See migration 029.';
