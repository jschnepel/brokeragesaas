-- 006_photo_urls_column.sql
-- Store photo URLs + descriptions as a JSONB array on listing_records.
-- Format: [{"url": "https://...", "desc": "Front of home"}, ...]
-- Ordered by preferred first, then order index.
-- Eliminates the need for JOIN to listing_photos on detail page loads.

ALTER TABLE listing_records
  ADD COLUMN IF NOT EXISTS photo_urls JSONB DEFAULT '[]'::jsonb;

-- Reset photos_fetched_at so the sync re-fetches into the new column
-- Only for listings that have photos_count > 0 but no photo_urls yet
UPDATE listing_records
  SET photos_fetched_at = NULL
  WHERE photos_count > 0
    AND (photo_urls IS NULL OR photo_urls = '[]'::jsonb);

COMMENT ON COLUMN listing_records.photo_urls IS 'Ordered array of {url, desc} objects from ARMLS Spark API. Preferred photo first.';
