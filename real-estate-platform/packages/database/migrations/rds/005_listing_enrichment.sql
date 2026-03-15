-- 005_listing_enrichment.sql
-- Caches enrichment data (commute distances, lifestyle metrics, nearby amenities)
-- for listing detail pages. Populated lazily on first visitor, refreshed every 30 days.

CREATE TABLE IF NOT EXISTS listing_enrichment (
  listing_key    VARCHAR(50) PRIMARY KEY REFERENCES listing_records(listing_key) ON DELETE CASCADE,
  commute_data   JSONB,
  lifestyle_data JSONB,
  nearby_data    JSONB,
  grocery_data   JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_enrichment_updated_at ON listing_enrichment (updated_at);

COMMENT ON TABLE listing_enrichment IS 'Cached enrichment data for listing detail pages. Lazy-populated, 30-day TTL.';
