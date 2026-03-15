-- 006_community_schema.sql
-- Community data tables for the community detail page.
-- Seeded from prototype's communities-enriched.json.

-- Regions (12 regions: North Scottsdale, Paradise Valley, etc.)
CREATE TABLE IF NOT EXISTS community_regions (
  id              VARCHAR(100) PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  tagline         TEXT,
  description     TEXT,
  hero_image      TEXT,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  display_order   INTEGER NOT NULL DEFAULT 0,
  demographics    JSONB,
  climate         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lifestyle sections (9 sections: guard-gated, golf, family, etc.)
CREATE TABLE IF NOT EXISTS community_sections (
  id              VARCHAR(100) PRIMARY KEY,
  label           VARCHAR(200) NOT NULL,
  description     TEXT,
  hero_image      TEXT,
  display_order   INTEGER NOT NULL DEFAULT 0
);

-- Communities (130 communities)
CREATE TABLE IF NOT EXISTS communities (
  id              VARCHAR(100) PRIMARY KEY,
  region_id       VARCHAR(100) NOT NULL REFERENCES community_regions(id),
  section_id      VARCHAR(100) REFERENCES community_sections(id),
  name            VARCHAR(200) NOT NULL,
  city            VARCHAR(100) NOT NULL,
  zip_code        VARCHAR(10),
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  price_range     VARCHAR(100),
  gating          VARCHAR(50),
  hero_image      TEXT,
  website         TEXT,
  elevation       VARCHAR(50),
  display_order   INTEGER NOT NULL DEFAULT 0,
  armls_subdivision_name VARCHAR(200),
  narrative       JSONB,
  location_data   JSONB,
  residential     JSONB,
  golf_info       JSONB,
  recognition     TEXT,
  gallery         JSONB,
  quality_of_life JSONB,
  economy         JSONB,
  tags            TEXT[],
  demographics    JSONB,
  pois            JSONB,
  boundary_geojson JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communities_region ON communities (region_id);
CREATE INDEX IF NOT EXISTS idx_communities_section ON communities (section_id);
CREATE INDEX IF NOT EXISTS idx_communities_city ON communities (city);

-- Amenities (258 amenities shared across communities)
CREATE TABLE IF NOT EXISTS community_amenities (
  id              VARCHAR(100) PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  type            VARCHAR(50) NOT NULL,
  description     TEXT,
  tags            TEXT[],
  access_level    VARCHAR(50),
  website         TEXT,
  address         TEXT,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  image           TEXT,
  stats           JSONB
);

-- Junction table (many-to-many: communities <-> amenities)
CREATE TABLE IF NOT EXISTS community_amenity_links (
  community_id    VARCHAR(100) REFERENCES communities(id) ON DELETE CASCADE,
  amenity_id      VARCHAR(100) REFERENCES community_amenities(id) ON DELETE CASCADE,
  is_signature    BOOLEAN NOT NULL DEFAULT FALSE,
  is_nearest_trail BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (community_id, amenity_id)
);
