-- Migration 032: ModificationTimestamp-based CDC watermark for sync-active
--
-- Adds a `last_high_watermark` column to listing_sync_state. The new
-- sync-active path filters by `ModificationTimestamp ge watermark` instead
-- of `StandardStatus eq 'Active'`, so records that flip Active → Closed/etc.
-- are caught when ARMLS modifies them, not lost from the result set.
--
-- Initial watermark for Property-Active: 60 days ago. That covers the
-- ~46-day-stale records currently lingering with last_synced_at = 2026-03-12.
-- After the initial sweep completes, the watermark advances to MAX received
-- ModificationTimestamp on each cycle.
--
-- Compliance: side-table column on listing_sync_state. No mirror touched.

BEGIN;

ALTER TABLE listing_sync_state
  ADD COLUMN IF NOT EXISTS last_high_watermark TIMESTAMPTZ;

-- Seed Property-Active with 60-days-ago watermark so first run after deploy
-- catches the stale-record backlog.
UPDATE listing_sync_state
SET last_high_watermark = NOW() - INTERVAL '60 days'
WHERE entity_name = 'Property-Active' AND last_high_watermark IS NULL;

COMMIT;
