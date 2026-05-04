-- Migration 030: Silver-layer side tables (medallion architecture, additive only)
--
-- Creates three derived-layer tables that allow data quality cleanup WITHOUT
-- mutating the ARMLS mirror (per license, listing_records is read-only):
--
--   1. subdivision_canonical_map — collapses 154K raw subdivision names
--      → ~117K canonicals, then assigns each to a region. Powers the
--      Desert Mountain / SUN CITY / RANCHO EL DORADO casing dedup.
--
--   2. listing_records_exceptions — DQ rule violations captured per row,
--      severity-tagged. Populated by scripts/dq-assert.mjs.
--
--   3. listing_records_excluded — manual do-not-display override list.
--      Joined as LEFT ANTI in Gold queries; never deletes from mirror.
--
-- See docs/db/phase-0-summary-2026-04-26.md for context.
-- ARMLS rule: NEVER mutate listing_records, listing_members, listing_offices,
-- listing_open_houses, listing_geography_links, listing_photos, listing_change_log.

BEGIN;

-- =====================================================
-- 1. SUBDIVISION CANONICAL MAP
-- =====================================================
-- Subset of migration 022_normalization_tables.sql, extracted because that
-- migration partially applied (scope_profiles + region_definitions exist;
-- subdivision_canonical_map was never created in production).

CREATE TABLE IF NOT EXISTS subdivision_canonical_map (
  id                    SERIAL PRIMARY KEY,
  raw_subdivision_name  TEXT NOT NULL UNIQUE,
  canonical_community   TEXT,
  region_id             UUID REFERENCES region_definitions(id),
  confidence            DECIMAL(3,2),
  mapping_method        TEXT,
  is_garbage            BOOLEAN DEFAULT FALSE,
  reviewed              BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scm_canonical ON subdivision_canonical_map(canonical_community);
CREATE INDEX IF NOT EXISTS idx_scm_region    ON subdivision_canonical_map(region_id);
CREATE INDEX IF NOT EXISTS idx_scm_raw       ON subdivision_canonical_map(raw_subdivision_name);

CREATE OR REPLACE FUNCTION normalize_subdivision(raw TEXT) RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  result := UPPER(TRIM(raw));
  -- Strip legal suffixes with numbers
  result := REGEXP_REPLACE(result, '\s+(PHASE|PH)\s*\d+.*$', '', 'i');
  result := REGEXP_REPLACE(result, '\s+UNIT\s+[\w-]+.*$', '', 'i');
  result := REGEXP_REPLACE(result, '\s+LOT\s+[\w-]+.*$', '', 'i');
  result := REGEXP_REPLACE(result, '\s+TRACT\s+[\w-]+.*$', '', 'i');
  result := REGEXP_REPLACE(result, '\s+BLOCK\s+[\w-]+.*$', '', 'i');
  result := REGEXP_REPLACE(result, '\s+PARCEL\s+[\w.-]+.*$', '', 'i');
  result := REGEXP_REPLACE(result, '\s+MCR\s+[\d/-]+.*$', '', 'i');
  result := REGEXP_REPLACE(result, '\s+(REPLAT|AMD|AMENDED|AMENDMENT).*$', '', 'i');
  -- Strip corporate suffixes
  result := REGEXP_REPLACE(result, '\s+(CONDOMINIUM|CONDOMINIUMS|CONDO|CONDOS|TOWNHOMES|TOWNHOUSE|SUBDIVISION|SUB)$', '', 'i');
  -- Strip trailing numbers and number-letter combos
  result := REGEXP_REPLACE(result, '\s+\d+[-]?\w*$', '');
  result := REGEXP_REPLACE(result, '\s+(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY|TWENTY-\w+).*$', '', 'i');
  -- Strip special characters except hyphens and apostrophes
  result := REGEXP_REPLACE(result, '[^A-Z0-9\s\-'']', '', 'g');
  -- Collapse multiple spaces
  result := REGEXP_REPLACE(result, '\s+', ' ', 'g');
  result := TRIM(result);
  -- Strip trailing numbers again after cleanup
  result := REGEXP_REPLACE(result, '\s+\d+$', '');
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Populate from listing_records — last 5 years, Maricopa, non-deleted.
INSERT INTO subdivision_canonical_map (raw_subdivision_name, mapping_method)
SELECT DISTINCT subdivision_name, 'pending'
FROM listing_records
WHERE subdivision_name IS NOT NULL
  AND subdivision_name != ''
  AND county_or_parish = 'Maricopa'
  AND listing_contract_date >= '2021-01-01'
  AND COALESCE(is_deleted, FALSE) = FALSE
ON CONFLICT (raw_subdivision_name) DO NOTHING;

-- Mark known-garbage values
UPDATE subdivision_canonical_map
SET is_garbage = TRUE, mapping_method = 'garbage_filter', confidence = 1.0
WHERE raw_subdivision_name IN (
  'None','N/A','Unknown','Metes and Bounds','Under 5 Acres',
  'Metes & Bounds','M&B','NONE','n/a','unknown','UNKNOWN'
)
   OR raw_subdivision_name ~ '^\d+$'
   OR raw_subdivision_name ~ '[!*]{2,}'
   OR LENGTH(raw_subdivision_name) > 200
   OR raw_subdivision_name ~* '(beautiful|stunning|gorgeous|fantastic|amazing|incredible|breathtaking|magnificent)\s'
   OR raw_subdivision_name ~* '^(MCR|LOT|TRACT)\s*\d'
   OR raw_subdivision_name = '';

-- Rules-based normalization
UPDATE subdivision_canonical_map
SET canonical_community = normalize_subdivision(raw_subdivision_name),
    mapping_method = 'normalized',
    confidence = 0.9
WHERE NOT is_garbage AND canonical_community IS NULL;

-- Mark too-short normalizations as garbage
UPDATE subdivision_canonical_map
SET is_garbage = TRUE, mapping_method = 'normalized_empty'
WHERE canonical_community IS NOT NULL AND LENGTH(canonical_community) < 3;

-- Region assignment based on primary (mode) region_slug from listing_geography.
-- listing_geography has already classified each listing into a region via
-- point-in-polygon (PostGIS) — more accurate than zip-code overlap for areas
-- like Arcadia / Biltmore that span multiple zips.
WITH sub_regions AS (
  SELECT lr.subdivision_name,
         MODE() WITHIN GROUP (ORDER BY lg.region_slug) AS primary_region
  FROM listing_records lr
  LEFT JOIN listing_geography lg ON lg.listing_key = lr.listing_key
  WHERE lr.county_or_parish = 'Maricopa'
    AND COALESCE(lr.is_deleted, FALSE) = FALSE
    AND lr.listing_contract_date >= '2021-01-01'
    AND lr.subdivision_name IS NOT NULL
    AND lg.region_slug IS NOT NULL
  GROUP BY lr.subdivision_name
)
UPDATE subdivision_canonical_map scm
SET region_id = rd.id
FROM sub_regions sr
JOIN region_definitions rd ON rd.region_slug = sr.primary_region
WHERE scm.raw_subdivision_name = sr.subdivision_name
  AND scm.region_id IS NULL;

COMMENT ON TABLE subdivision_canonical_map IS
  'Silver-layer normalization map: raw subdivision_name → canonical_community + region. Joined LEFT in analytics_base. See migration 030.';

-- =====================================================
-- 2. LISTING_RECORDS_EXCEPTIONS  (DQ rule findings)
-- =====================================================

CREATE TABLE IF NOT EXISTS listing_records_exceptions (
  id              BIGSERIAL PRIMARY KEY,
  listing_key     VARCHAR(50) NOT NULL,
  rule_name       TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('error','warn','info')),
  violation_value TEXT,
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A given (listing_key, rule_name) can repeat across runs — track all detections.
CREATE INDEX IF NOT EXISTS idx_lre_listing_key ON listing_records_exceptions (listing_key);
CREATE INDEX IF NOT EXISTS idx_lre_rule_severity_recent
  ON listing_records_exceptions (rule_name, severity, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_lre_recent_errors
  ON listing_records_exceptions (detected_at DESC)
  WHERE severity = 'error';

COMMENT ON TABLE listing_records_exceptions IS
  'DQ rule violations against listing_records. Populated by scripts/dq-assert.mjs. Filtered out in Gold queries by severity. See migration 030.';

-- =====================================================
-- 3. LISTING_RECORDS_EXCLUDED  (manual do-not-display override)
-- =====================================================

CREATE TABLE IF NOT EXISTS listing_records_excluded (
  listing_key  VARCHAR(50) PRIMARY KEY,
  reason       TEXT NOT NULL,
  excluded_by  TEXT,
  excluded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE listing_records_excluded IS
  'Manual do-not-display override for specific listings. LEFT ANTI joined in Gold queries. Never modifies listing_records itself. See migration 030.';

COMMIT;
