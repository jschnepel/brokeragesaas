-- ARMLS Mirror Schema
-- Target: RDS (rlsir_platform)
-- Purpose: Store replicated ARMLS listing data from Spark Platform RESO Replication API

BEGIN;

-- ============================================
-- LISTING RECORDS
-- Primary table for all ARMLS property listings
-- ============================================
CREATE TABLE listing_records (
  id                        BIGSERIAL PRIMARY KEY,
  listing_key               VARCHAR(50) UNIQUE NOT NULL,
  listing_id                VARCHAR(30) NOT NULL,

  -- Status
  standard_status           VARCHAR(30) NOT NULL,
  mls_status                VARCHAR(50),

  -- Location
  unparsed_address          TEXT,
  street_number             VARCHAR(20),
  street_dir_prefix         VARCHAR(10),
  street_name               VARCHAR(100),
  street_suffix             VARCHAR(20),
  unit_number               VARCHAR(20),
  city                      VARCHAR(50),
  state_or_province         VARCHAR(5),
  postal_code               VARCHAR(10) NOT NULL,
  county_or_parish          VARCHAR(50),
  subdivision_name          VARCHAR(100),
  latitude                  DECIMAL(10, 7),
  longitude                 DECIMAL(10, 7),

  -- Price
  list_price                DECIMAL(12, 2),
  close_price               DECIMAL(12, 2),

  -- Characteristics
  property_type             VARCHAR(50),
  property_sub_type         VARCHAR(50),
  bedrooms_total            SMALLINT,
  bathrooms_total_integer   SMALLINT,
  bathrooms_full            SMALLINT,
  bathrooms_half            SMALLINT,
  living_area               DECIMAL(10, 2),
  lot_size_acres            DECIMAL(10, 4),
  lot_size_square_feet      DECIMAL(12, 2),
  year_built                SMALLINT,
  stories_total             SMALLINT,

  -- Features (JSONB arrays)
  interior_features         JSONB DEFAULT '[]',
  exterior_features         JSONB DEFAULT '[]',
  appliances                JSONB DEFAULT '[]',
  cooling                   JSONB DEFAULT '[]',
  heating                   JSONB DEFAULT '[]',
  flooring                  JSONB DEFAULT '[]',
  fencing                   JSONB DEFAULT '[]',
  roof                      JSONB DEFAULT '[]',
  construction_materials    JSONB DEFAULT '[]',
  pool_features             JSONB DEFAULT '[]',
  parking_features          JSONB DEFAULT '[]',
  community_features        JSONB DEFAULT '[]',
  view_features             JSONB DEFAULT '[]',
  architectural_style       JSONB DEFAULT '[]',
  fireplace_features        JSONB DEFAULT '[]',
  lot_features              JSONB DEFAULT '[]',
  patio_and_porch_features  JSONB DEFAULT '[]',
  sewer                     JSONB DEFAULT '[]',
  water_source              JSONB DEFAULT '[]',

  -- Booleans
  pool_private_yn           BOOLEAN,
  fireplace_yn              BOOLEAN,
  association_yn            BOOLEAN,
  horse_yn                  BOOLEAN,
  attached_garage_yn        BOOLEAN,
  cooling_yn                BOOLEAN,
  heating_yn                BOOLEAN,

  -- HOA
  association_fee           DECIMAL(10, 2),
  association_fee_frequency VARCHAR(30),
  association_fee_includes  JSONB DEFAULT '[]',
  association_name          VARCHAR(100),

  -- Parking
  garage_spaces             DECIMAL(4, 1),
  covered_spaces            DECIMAL(4, 1),
  carport_spaces            DECIMAL(4, 1),
  open_parking_spaces       DECIMAL(4, 1),

  -- Attribution (IDX REQUIRED)
  list_agent_full_name      VARCHAR(100),
  list_agent_first_name     VARCHAR(50),
  list_agent_last_name      VARCHAR(50),
  list_agent_mls_id         VARCHAR(30),
  list_agent_key            VARCHAR(50),
  list_office_name          VARCHAR(150) NOT NULL,
  list_office_mls_id        VARCHAR(30),
  list_office_key           VARCHAR(50),
  list_office_phone         VARCHAR(20),

  -- Content
  public_remarks            TEXT,
  directions                TEXT,
  cross_street              VARCHAR(100),

  -- Dates
  listing_contract_date     DATE,
  close_date                DATE,
  off_market_date           DATE,
  modification_timestamp    TIMESTAMPTZ NOT NULL,
  original_entry_timestamp  TIMESTAMPTZ,
  price_change_timestamp    TIMESTAMPTZ,
  status_change_timestamp   TIMESTAMPTZ,
  photos_change_timestamp   TIMESTAMPTZ,

  -- Photos
  photos_count              SMALLINT DEFAULT 0,

  -- Tax
  tax_annual_amount         DECIMAL(10, 2),
  tax_year                  SMALLINT,
  parcel_number             VARCHAR(30),

  -- Schools
  elementary_school         VARCHAR(100),
  elementary_school_district VARCHAR(100),
  high_school_district      VARCHAR(100),
  middle_or_junior_school   VARCHAR(100),

  -- Display flags
  internet_entire_listing_display_yn  BOOLEAN DEFAULT TRUE,
  internet_address_display_yn         BOOLEAN DEFAULT TRUE,

  -- ARMLS custom fields
  agent_cell_phone          VARCHAR(20),
  price_per_sqft            DECIMAL(10, 2),
  planned_community_name    VARCHAR(100),

  -- Raw data (all fields not in dedicated columns)
  raw_data                  JSONB,

  -- Metadata
  originating_system_name   VARCHAR(100),
  first_synced_at           TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at            TIMESTAMPTZ DEFAULT NOW(),
  is_deleted                BOOLEAN DEFAULT FALSE,

  -- Computed
  days_on_market            SMALLINT
);

CREATE INDEX idx_lr_status ON listing_records(standard_status);
CREATE INDEX idx_lr_postal ON listing_records(postal_code);
CREATE INDEX idx_lr_city ON listing_records(city);
CREATE INDEX idx_lr_price ON listing_records(list_price);
CREATE INDEX idx_lr_type ON listing_records(property_type);
CREATE INDEX idx_lr_beds ON listing_records(bedrooms_total);
CREATE INDEX idx_lr_modified ON listing_records(modification_timestamp);
CREATE INDEX idx_lr_listing_id ON listing_records(listing_id);
CREATE INDEX idx_lr_agent_key ON listing_records(list_agent_key);
CREATE INDEX idx_lr_subdivision ON listing_records(subdivision_name);
CREATE INDEX idx_lr_geo ON listing_records(latitude, longitude);
CREATE INDEX idx_lr_synced ON listing_records(last_synced_at);
CREATE INDEX idx_lr_active ON listing_records(standard_status, is_deleted)
  WHERE standard_status IN ('Active', 'Active Under Contract', 'Coming Soon', 'Pending')
  AND is_deleted = FALSE
  AND internet_entire_listing_display_yn = TRUE;

-- ============================================
-- LISTING MEMBERS
-- ARMLS agent/member directory
-- ============================================
CREATE TABLE listing_members (
  id                      BIGSERIAL PRIMARY KEY,
  member_key              VARCHAR(50) UNIQUE NOT NULL,
  member_mls_id           VARCHAR(30),
  member_full_name        VARCHAR(100),
  member_first_name       VARCHAR(50),
  member_last_name        VARCHAR(50),
  member_email            VARCHAR(150),
  member_mobile_phone     VARCHAR(20),
  member_preferred_phone  VARCHAR(20),
  member_state_license    VARCHAR(30),
  member_status           VARCHAR(20),
  office_key              VARCHAR(50),
  office_name             VARCHAR(150),
  modification_timestamp  TIMESTAMPTZ,
  raw_data                JSONB,
  last_synced_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lm_mls_id ON listing_members(member_mls_id);
CREATE INDEX idx_lm_office ON listing_members(office_key);
CREATE INDEX idx_lm_name ON listing_members(member_last_name, member_first_name);

-- ============================================
-- LISTING OFFICES
-- ARMLS brokerage directory
-- ============================================
CREATE TABLE listing_offices (
  id                      BIGSERIAL PRIMARY KEY,
  office_key              VARCHAR(50) UNIQUE NOT NULL,
  office_mls_id           VARCHAR(30),
  office_name             VARCHAR(150),
  office_phone            VARCHAR(20),
  office_address          VARCHAR(200),
  office_city             VARCHAR(50),
  office_state            VARCHAR(5),
  office_postal_code      VARCHAR(10),
  office_status           VARCHAR(20),
  office_type             VARCHAR(50),
  modification_timestamp  TIMESTAMPTZ,
  raw_data                JSONB,
  last_synced_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lo_mls_id ON listing_offices(office_mls_id);
CREATE INDEX idx_lo_name ON listing_offices(office_name);

-- ============================================
-- LISTING OPEN HOUSES
-- ============================================
CREATE TABLE listing_open_houses (
  id                      BIGSERIAL PRIMARY KEY,
  open_house_key          VARCHAR(50) UNIQUE NOT NULL,
  listing_key             VARCHAR(50) NOT NULL,
  open_house_start_time   TIMESTAMPTZ,
  open_house_end_time     TIMESTAMPTZ,
  open_house_type         VARCHAR(30),
  modification_timestamp  TIMESTAMPTZ,
  last_synced_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loh_listing ON listing_open_houses(listing_key);
CREATE INDEX idx_loh_start ON listing_open_houses(open_house_start_time);

-- ============================================
-- LISTING GEOGRAPHY LINKS
-- Maps listings to neighborhoods (IDs from Neon)
-- ============================================
CREATE TABLE listing_geography_links (
  listing_key             VARCHAR(50) NOT NULL,
  neighborhood_id         UUID NOT NULL,
  region_id               UUID,
  linked_by               VARCHAR(20) DEFAULT 'zip_code',
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (listing_key, neighborhood_id)
);

CREATE INDEX idx_lgl_neighborhood ON listing_geography_links(neighborhood_id);
CREATE INDEX idx_lgl_region ON listing_geography_links(region_id);

-- ============================================
-- LISTING SYNC STATE
-- Tracks replication cursor per entity
-- ============================================
CREATE TABLE listing_sync_state (
  entity_name               VARCHAR(30) PRIMARY KEY,
  last_skip_token           TEXT,
  last_sync_started         TIMESTAMPTZ,
  last_sync_completed       TIMESTAMPTZ,
  last_sync_record_count    INTEGER DEFAULT 0,
  last_sync_status          VARCHAR(20) DEFAULT 'idle',
  last_sync_error           TEXT,
  total_records_synced      BIGINT DEFAULT 0,
  initial_pull_complete     BOOLEAN DEFAULT FALSE
);

INSERT INTO listing_sync_state (entity_name) VALUES
  ('Property'), ('Member'), ('Office'), ('OpenHouse');

COMMIT;
