{{ config(materialized='table', enabled=(var('enable_active', false))) }}

-- Active-side models depend on the rlsir-active-snapshot Lambda having
-- written per-page NDJSON.gz files under bronze/active_snapshot/current/.
-- In dev (without the Lambda deployed yet), enable=false skips the entire
-- active branch of the DAG.
-- Re-enable via: dbt build --vars 'enable_active: true'
-- or set enable_active: true in dbt_project.yml after the Lambda goes live.

-- Reads the hourly active snapshot from S3 — Lambda atomically swaps the
-- whole `current/` directory each run. No dedup needed (unlike bronze
-- listings) because this IS the dedup: one row per active listing as of
-- the latest sync.
--
-- Source glob: s3://rlsir-platform-assets-us-east-1/bronze/active_snapshot/current/page_*.ndjson.gz
-- Cadence: rate(1 hour)

WITH source AS (
  SELECT * FROM read_json_auto(
    's3://rlsir-platform-assets-us-east-1/bronze/active_snapshot/current/page_*.ndjson.gz',
    union_by_name=true
  )
)

SELECT
  -- Identifiers
  ListingKey                                AS listing_key,
  ListingId                                 AS listing_id,

  -- Status (always one of Active/AUC/Pending/Coming Soon at this point)
  StandardStatus                            AS standard_status,
  MlsStatus                                 AS mls_status,
  PropertyType                              AS property_type,
  PropertySubType                           AS property_sub_type,

  -- Prices
  NULLIF(ListPrice,  0)::NUMERIC            AS list_price,
  NULLIF(OriginalListPrice, 0)::NUMERIC     AS original_list_price_source,  -- 0% populated; recovered via change_log

  -- Time / dates
  ListingContractDate                       AS listing_contract_date,
  OnMarketDate                              AS on_market_date,
  PendingTimestamp                          AS pending_timestamp,
  StatusChangeTimestamp                     AS status_change_timestamp,
  PriceChangeTimestamp                      AS price_change_timestamp,
  ModificationTimestamp                     AS modification_timestamp,
  OriginalEntryTimestamp                    AS original_entry_timestamp,
  DaysOnMarket                              AS days_on_market,

  -- Property core
  BedroomsTotal                             AS bedrooms,
  BathroomsFull                             AS bathrooms_full,
  BathroomsHalf                             AS bathrooms_half,
  BathroomsTotalInteger                     AS bathrooms_total,
  LivingArea                                AS living_area,
  LotSizeAcres                              AS lot_size_acres,
  LotSizeSquareFeet                         AS lot_size_square_feet,
  YearBuilt                                 AS year_built,
  StoriesTotal                              AS stories,

  -- Features
  PoolPrivateYN                             AS has_pool,
  HorseYN                                   AS is_horse_property,
  GarageSpaces                              AS garage_spaces,
  AssociationFee                            AS association_fee,
  AssociationFeeFrequency                   AS association_fee_frequency,
  TaxAnnualAmount                           AS tax_annual_amount,
  TaxYear                                   AS tax_year,

  -- List-side
  ListOfficeName                            AS list_office_name,
  ListOfficeKey                             AS list_office_key,
  ListAgentFullName                         AS list_agent_full_name,
  ListAgentKey                              AS list_agent_key,

  -- Community features
  CommunityFeatures                         AS community_features,

  -- Photos / media
  PhotosCount                               AS photos_count,
  ParcelNumber                              AS parcel_number,

  -- Address
  UnparsedAddress                           AS unparsed_address,
  StreetNumber                              AS street_number,
  StreetName                                AS street_name,
  StreetSuffix                              AS street_suffix,
  UnitNumber                                AS unit_number,

  -- Geography (raw — joined to dim_communities downstream)
  NULLIF(TRIM(City), '')                    AS city,
  LEFT(NULLIF(TRIM(PostalCode), ''), 5)     AS postal_code,
  CountyOrParish                            AS county,
  NULLIF(TRIM(SubdivisionName), '')         AS subdivision_name,
  CASE
    WHEN Latitude  BETWEEN {{ var('az_lat_min') }} AND {{ var('az_lat_max') }}
     AND Longitude BETWEEN {{ var('az_lng_min') }} AND {{ var('az_lng_max') }}
    THEN Latitude  END AS latitude,
  CASE
    WHEN Latitude  BETWEEN {{ var('az_lat_min') }} AND {{ var('az_lat_max') }}
     AND Longitude BETWEEN {{ var('az_lng_min') }} AND {{ var('az_lng_max') }}
    THEN Longitude END AS longitude,

  -- Schools
  NULLIF(TRIM(ElementarySchool),         '') AS elementary_school,
  NULLIF(TRIM(ElementarySchoolDistrict), '') AS elementary_school_district,
  NULLIF(TRIM(MiddleOrJuniorSchool),     '') AS middle_or_junior_school,
  NULLIF(TRIM(HighSchool),               '') AS high_school,
  NULLIF(TRIM(HighSchoolDistrict),       '') AS high_school_district,

  -- IDX flags
  InternetEntireListingDisplayYN            AS idx_display,
  InternetAddressDisplayYN                  AS address_display,

  PublicRemarks                             AS public_remarks,

  -- Provenance — what active-snapshot run produced this row
  sync_run_id,
  sync_observed_at

FROM source
