-- 002_listing_photos.sql
-- Photo storage for ARMLS listing images fetched via Property('key')/Media endpoint.

CREATE TABLE IF NOT EXISTS listing_photos (
  id            BIGSERIAL PRIMARY KEY,
  listing_key   TEXT NOT NULL REFERENCES listing_records(listing_key) ON DELETE CASCADE,
  media_key     TEXT NOT NULL,
  media_url     TEXT NOT NULL,
  "order"       INT NOT NULL DEFAULT 0,
  short_description TEXT,
  is_preferred  BOOLEAN NOT NULL DEFAULT FALSE,
  media_type    TEXT DEFAULT 'image/jpeg',
  width         INT,
  height        INT,
  raw_data      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_key, media_key)
);

-- Fast lookups by listing
CREATE INDEX IF NOT EXISTS idx_listing_photos_listing_key ON listing_photos(listing_key);
CREATE INDEX IF NOT EXISTS idx_listing_photos_order ON listing_photos(listing_key, "order");

-- Track which listings have had their photos fetched
ALTER TABLE listing_records
  ADD COLUMN IF NOT EXISTS photos_fetched_at TIMESTAMPTZ;
