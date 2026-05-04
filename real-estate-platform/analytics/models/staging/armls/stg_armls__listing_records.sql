{{ config(materialized='table') }}

-- 1:1 staging over the bronze Parquet snapshot (rlsir-armls-parquet-export Lambda).
-- Globs every per-run snapshot under bronze/parquet/listing_records/, dedupes by
-- listing_key keeping the row with the latest modification_timestamp (and latest
-- sync_observed_at as the tiebreaker — newer runs win on ties).
--
-- Source: s3://.../bronze/parquet/listing_records/sync_year=*/sync_month=*/sync_day=*/run_id=*/data.parquet
-- One Parquet per Lambda run, partitioned by sync_year/sync_month/sync_day/run_id.
-- Cadence: rate(4 hours).
--
-- Materialized as table (NOT view) so the multi-hundred-Parquet glob scan only
-- runs once per dbt build, not per downstream reference.
--
-- The old NDJSON.gz path (bronze/listings/) is being deprecated; this staging
-- model now exclusively reads bronze/parquet/. RDS direct reads via the
-- postgres extension are also retired here (snake_case columns come straight
-- from the PG mirror via the export Lambda's COPY).
--
-- Renames, type casts, NULLIFs only. NO business logic.

WITH bronze AS (
  SELECT * FROM read_parquet(
    's3://rlsir-platform-assets-us-east-1/bronze/parquet/listing_records/sync_year=*/sync_month=*/sync_day=*/run_id=*/data.parquet',
    hive_partitioning=true,
    union_by_name=true
  )
),

dedup AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY listing_key
      ORDER BY modification_timestamp DESC NULLS LAST,
               sync_observed_at         DESC NULLS LAST
    ) AS rn
  FROM bronze
),

source AS (
  SELECT * FROM dedup WHERE rn = 1
)

SELECT
  -- Identifiers
  listing_key,
  listing_id,

  -- Status
  standard_status,
  mls_status,
  property_type,
  property_sub_type,

  -- Prices (clean obvious zeros to NULL; outlier filtering happens in intermediate)
  NULLIF(list_price,           0)::NUMERIC AS list_price,
  NULLIF(close_price,          0)::NUMERIC AS close_price,
  NULLIF(original_list_price,  0)::NUMERIC AS original_list_price,
  NULLIF(previous_list_price,  0)::NUMERIC AS previous_list_price,
  NULLIF(price_per_sqft,       0)::NUMERIC AS price_per_sqft_source,

  -- Time / dates — all available from PG mirror (Spark API was missing some of these,
  -- but the existing armls-sync Lambda derives + persists them in the mirror).
  listing_contract_date,
  close_date,
  off_market_date,
  on_market_date,
  modification_timestamp,
  status_change_timestamp,
  price_change_timestamp,
  pending_timestamp,
  original_entry_timestamp,
  major_change_timestamp,
  major_change_type,
  days_on_market,

  -- Property core
  bedrooms_total                            AS bedrooms,
  bathrooms_full,
  bathrooms_half,
  bathrooms_total_integer                   AS bathrooms_total,
  bathrooms_total_decimal,
  living_area,
  lot_size_acres,
  lot_size_square_feet,
  year_built,
  stories_total                             AS stories,
  rooms_total,
  bedrooms_possible,

  -- Features (snake_case booleans; JSONB arrays passed through)
  pool_private_yn                           AS has_pool,
  horse_yn                                  AS is_horse_property,
  fireplace_yn                              AS has_fireplace,
  attached_garage_yn,
  association_yn,
  senior_community_yn,
  property_attached_yn,
  garage_spaces,
  covered_spaces,
  carport_spaces,
  open_parking_spaces,
  association_fee,
  association_fee_frequency,
  total_monthly_fee,
  hoa_transfer_fee,
  tax_annual_amount,
  tax_year,
  fireplaces_total,

  -- JSONB arrays (downstream models can DuckDB-parse via jsonb_*)
  community_features,
  interior_features,
  exterior_features,
  appliances,
  cooling,
  heating,
  flooring,
  fencing,
  roof,
  construction_materials,
  pool_features,
  parking_features,
  view_features,
  architectural_style,
  fireplace_features,
  lot_features,
  patio_and_porch_features,
  sewer,
  water_source,
  utilities,
  laundry_features,
  security_features,
  spa_features,
  listing_terms,
  disclosures,
  vegetation,
  structure_type,
  buyer_financing,
  special_listing_conditions,

  -- List-side
  list_office_name,
  list_office_key,
  list_office_mls_id,
  list_office_phone,
  list_office_email,
  list_agent_full_name,
  list_agent_first_name,
  list_agent_last_name,
  list_agent_key,
  list_agent_mls_id,
  list_agent_preferred_phone,
  attribution_contact,

  -- Buyer-side
  buyer_office_name,
  buyer_office_key,
  buyer_office_mls_id,
  buyer_agent_full_name,
  buyer_agent_first_name,
  buyer_agent_last_name,
  buyer_agent_key,
  buyer_agent_mls_id,
  concession_amount,
  contingency,

  -- Photos / media / docs
  photos_count,
  photos_change_timestamp,
  photo_urls,
  virtual_tour_url,

  -- Address (raw)
  unparsed_address,
  street_number,
  street_dir_prefix,
  street_name,
  street_suffix,
  unit_number,
  cross_street,
  directions,

  -- Geography
  NULLIF(TRIM(city),       '')              AS city,
  state_or_province,
  LEFT(NULLIF(TRIM(postal_code), ''), 5)    AS postal_code,
  postal_code_plus4,
  county_or_parish                          AS county,
  NULLIF(TRIM(subdivision_name), '')        AS subdivision_name,
  planned_community_name,
  zoning,
  CASE
    WHEN latitude  BETWEEN {{ var('az_lat_min') }} AND {{ var('az_lat_max') }}
     AND longitude BETWEEN {{ var('az_lng_min') }} AND {{ var('az_lng_max') }}
    THEN latitude  END                      AS latitude,
  CASE
    WHEN latitude  BETWEEN {{ var('az_lat_min') }} AND {{ var('az_lat_max') }}
     AND longitude BETWEEN {{ var('az_lng_min') }} AND {{ var('az_lng_max') }}
    THEN longitude END                      AS longitude,

  -- Schools
  NULLIF(TRIM(elementary_school),         '') AS elementary_school,
  NULLIF(TRIM(elementary_school_district), '') AS elementary_school_district,
  NULLIF(TRIM(middle_or_junior_school),   '') AS middle_or_junior_school,
  NULLIF(TRIM(high_school),               '') AS high_school,
  NULLIF(TRIM(high_school_district),      '') AS high_school_district,

  -- IDX flags (compliance baseline)
  internet_entire_listing_display_yn        AS idx_display,
  internet_address_display_yn               AS address_display,
  delayed_marketing_yn,
  land_lease_yn,
  is_deleted,

  -- Misc
  parcel_number,
  ownership,
  builder_name,
  dwelling_style,
  interior_levels,
  tax_legal_description,
  originating_system_name,
  public_remarks,

  -- Sync provenance
  first_synced_at,
  last_synced_at,
  major_change_timestamp                    AS armls_major_change_timestamp,

  -- Bronze provenance (added by rlsir-armls-parquet-export at Parquet write time)
  sync_run_id,
  sync_observed_at

FROM source
