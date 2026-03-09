/**
 * RESO Field Mapper
 * Maps raw RESO/OData Property fields to listing_records columns.
 * Handles type coercion, JSONB array normalization, and computed fields.
 */

/** RESO field name → listing_records column */
const PROPERTY_FIELD_MAP: Record<string, string> = {
  // Identification
  ListingKey: 'listing_key',
  ListingId: 'listing_id',
  StandardStatus: 'standard_status',
  MlsStatus: 'mls_status',

  // Location
  UnparsedAddress: 'unparsed_address',
  StreetNumber: 'street_number',
  StreetDirPrefix: 'street_dir_prefix',
  StreetName: 'street_name',
  StreetSuffix: 'street_suffix',
  UnitNumber: 'unit_number',
  City: 'city',
  StateOrProvince: 'state_or_province',
  PostalCode: 'postal_code',
  CountyOrParish: 'county_or_parish',
  SubdivisionName: 'subdivision_name',
  Latitude: 'latitude',
  Longitude: 'longitude',

  // Price
  ListPrice: 'list_price',
  ClosePrice: 'close_price',

  // Characteristics
  PropertyType: 'property_type',
  PropertySubType: 'property_sub_type',
  BedroomsTotal: 'bedrooms_total',
  BathroomsTotalInteger: 'bathrooms_total_integer',
  BathroomsFull: 'bathrooms_full',
  BathroomsHalf: 'bathrooms_half',
  LivingArea: 'living_area',
  LotSizeAcres: 'lot_size_acres',
  LotSizeSquareFeet: 'lot_size_square_feet',
  YearBuilt: 'year_built',
  StoriesTotal: 'stories_total',

  // Features (JSONB arrays — values come as comma-separated strings)
  InteriorFeatures: 'interior_features',
  ExteriorFeatures: 'exterior_features',
  Appliances: 'appliances',
  Cooling: 'cooling',
  Heating: 'heating',
  Flooring: 'flooring',
  Fencing: 'fencing',
  Roof: 'roof',
  ConstructionMaterials: 'construction_materials',
  PoolFeatures: 'pool_features',
  ParkingFeatures: 'parking_features',
  CommunityFeatures: 'community_features',
  View: 'view_features',
  ArchitecturalStyle: 'architectural_style',
  FireplaceFeatures: 'fireplace_features',
  LotFeatures: 'lot_features',
  PatioAndPorchFeatures: 'patio_and_porch_features',
  Sewer: 'sewer',
  WaterSource: 'water_source',

  // Booleans
  PoolPrivateYN: 'pool_private_yn',
  FireplaceYN: 'fireplace_yn',
  AssociationYN: 'association_yn',
  HorseYN: 'horse_yn',
  AttachedGarageYN: 'attached_garage_yn',
  CoolingYN: 'cooling_yn',
  HeatingYN: 'heating_yn',

  // HOA
  AssociationFee: 'association_fee',
  AssociationFeeFrequency: 'association_fee_frequency',
  AssociationFeeIncludes: 'association_fee_includes',
  AssociationName: 'association_name',

  // Parking
  GarageSpaces: 'garage_spaces',
  CoveredSpaces: 'covered_spaces',
  CarportSpaces: 'carport_spaces',
  OpenParkingSpaces: 'open_parking_spaces',

  // Attribution (IDX required)
  ListAgentFullName: 'list_agent_full_name',
  ListAgentFirstName: 'list_agent_first_name',
  ListAgentLastName: 'list_agent_last_name',
  ListAgentMlsId: 'list_agent_mls_id',
  ListAgentKey: 'list_agent_key',
  ListOfficeName: 'list_office_name',
  ListOfficeMlsId: 'list_office_mls_id',
  ListOfficeKey: 'list_office_key',
  ListOfficePhone: 'list_office_phone',

  // Content
  PublicRemarks: 'public_remarks',
  Directions: 'directions',
  CrossStreet: 'cross_street',

  // Dates
  ListingContractDate: 'listing_contract_date',
  CloseDate: 'close_date',
  OffMarketDate: 'off_market_date',
  ModificationTimestamp: 'modification_timestamp',
  OriginalEntryTimestamp: 'original_entry_timestamp',
  PriceChangeTimestamp: 'price_change_timestamp',
  StatusChangeTimestamp: 'status_change_timestamp',
  PhotosChangeTimestamp: 'photos_change_timestamp',

  // Photos
  PhotosCount: 'photos_count',

  // Tax
  TaxAnnualAmount: 'tax_annual_amount',
  TaxYear: 'tax_year',
  ParcelNumber: 'parcel_number',

  // Schools
  ElementarySchool: 'elementary_school',
  ElementarySchoolDistrict: 'elementary_school_district',
  HighSchoolDistrict: 'high_school_district',
  MiddleOrJuniorSchool: 'middle_or_junior_school',

  // Display flags
  InternetEntireListingDisplayYN: 'internet_entire_listing_display_yn',
  InternetAddressDisplayYN: 'internet_address_display_yn',

  // Originating system
  OriginatingSystemName: 'originating_system_name',
};

/** ARMLS custom field → listing_records column */
const ARMLS_CUSTOM_FIELD_MAP: Record<string, string> = {
  'Contact_sp_Info_co_List_sp_Agent_sp_Cell_sp_Phn2': 'agent_cell_phone',
  'Price_sp_per_sp_Sq_sp_Ft': 'price_per_sqft',
  'Planned_sp_Community_sp_Name': 'planned_community_name',
};

/** Columns that store JSONB arrays */
const JSONB_COLUMNS = new Set([
  'interior_features', 'exterior_features', 'appliances', 'cooling',
  'heating', 'flooring', 'fencing', 'roof', 'construction_materials',
  'pool_features', 'parking_features', 'community_features', 'view_features',
  'architectural_style', 'fireplace_features', 'lot_features',
  'patio_and_porch_features', 'sewer', 'water_source',
  'association_fee_includes',
]);

/** Columns that store boolean values */
const BOOLEAN_COLUMNS = new Set([
  'pool_private_yn', 'fireplace_yn', 'association_yn', 'horse_yn',
  'attached_garage_yn', 'cooling_yn', 'heating_yn',
  'internet_entire_listing_display_yn', 'internet_address_display_yn',
]);

/** Columns that store numeric (decimal/integer) values */
const NUMERIC_COLUMNS = new Set([
  'list_price', 'close_price', 'living_area', 'lot_size_acres',
  'lot_size_square_feet', 'latitude', 'longitude', 'association_fee',
  'garage_spaces', 'covered_spaces', 'carport_spaces', 'open_parking_spaces',
  'tax_annual_amount', 'price_per_sqft',
]);

const INTEGER_COLUMNS = new Set([
  'bedrooms_total', 'bathrooms_total_integer', 'bathrooms_full',
  'bathrooms_half', 'year_built', 'stories_total', 'photos_count', 'tax_year',
]);

export interface MappedListing {
  /** Mapped columns with coerced values */
  columns: Record<string, unknown>;
  /** Full raw record for the raw_data JSONB column */
  rawData: Record<string, unknown>;
}

/**
 * Map a raw RESO Property record to listing_records columns.
 */
export function mapPropertyRecord(raw: Record<string, unknown>): MappedListing {
  const columns: Record<string, unknown> = {};

  // Map known RESO fields
  for (const [resoField, column] of Object.entries(PROPERTY_FIELD_MAP)) {
    if (raw[resoField] !== undefined && raw[resoField] !== null) {
      columns[column] = coerceValue(column, raw[resoField]);
    }
  }

  // Map ARMLS custom fields
  for (const [customField, column] of Object.entries(ARMLS_CUSTOM_FIELD_MAP)) {
    if (raw[customField] !== undefined && raw[customField] !== null) {
      columns[column] = coerceValue(column, raw[customField]);
    }
  }

  // Compute days_on_market from ListingContractDate
  if (columns.listing_contract_date && columns.standard_status === 'Active') {
    const contractDate = new Date(columns.listing_contract_date as string);
    const now = new Date();
    const diffMs = now.getTime() - contractDate.getTime();
    columns.days_on_market = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  return {
    columns,
    rawData: raw,
  };
}

/** RESO Member entity → listing_members columns */
const MEMBER_FIELD_MAP: Record<string, string> = {
  MemberKey: 'member_key',
  MemberMlsId: 'member_mls_id',
  MemberFullName: 'member_full_name',
  MemberFirstName: 'member_first_name',
  MemberLastName: 'member_last_name',
  MemberEmail: 'member_email',
  MemberMobilePhone: 'member_mobile_phone',
  MemberPreferredPhone: 'member_preferred_phone',
  MemberStateLicense: 'member_state_license',
  MemberStatus: 'member_status',
  OfficeKey: 'office_key',
  OfficeName: 'office_name',
  ModificationTimestamp: 'modification_timestamp',
};

/** RESO Office entity → listing_offices columns */
const OFFICE_FIELD_MAP: Record<string, string> = {
  OfficeKey: 'office_key',
  OfficeMlsId: 'office_mls_id',
  OfficeName: 'office_name',
  OfficePhone: 'office_phone',
  OfficeAddress1: 'office_address',
  OfficeCity: 'office_city',
  OfficeStateOrProvince: 'office_state',
  OfficePostalCode: 'office_postal_code',
  OfficeStatus: 'office_status',
  OfficeType: 'office_type',
  ModificationTimestamp: 'modification_timestamp',
};

/** RESO OpenHouse entity → listing_open_houses columns */
const OPEN_HOUSE_FIELD_MAP: Record<string, string> = {
  OpenHouseKey: 'open_house_key',
  ListingKey: 'listing_key',
  OpenHouseStartTime: 'open_house_start_time',
  OpenHouseEndTime: 'open_house_end_time',
  OpenHouseType: 'open_house_type',
  ModificationTimestamp: 'modification_timestamp',
};

export function mapMemberRecord(raw: Record<string, unknown>): MappedListing {
  const columns: Record<string, unknown> = {};
  for (const [resoField, column] of Object.entries(MEMBER_FIELD_MAP)) {
    if (raw[resoField] !== undefined && raw[resoField] !== null) {
      columns[column] = raw[resoField];
    }
  }
  return { columns, rawData: raw };
}

export function mapOfficeRecord(raw: Record<string, unknown>): MappedListing {
  const columns: Record<string, unknown> = {};
  for (const [resoField, column] of Object.entries(OFFICE_FIELD_MAP)) {
    if (raw[resoField] !== undefined && raw[resoField] !== null) {
      columns[column] = raw[resoField];
    }
  }
  return { columns, rawData: raw };
}

export function mapOpenHouseRecord(raw: Record<string, unknown>): MappedListing {
  const columns: Record<string, unknown> = {};
  for (const [resoField, column] of Object.entries(OPEN_HOUSE_FIELD_MAP)) {
    if (raw[resoField] !== undefined && raw[resoField] !== null) {
      columns[column] = raw[resoField];
    }
  }
  return { columns, rawData: raw };
}

/**
 * Coerce a raw API value to the correct type for its column.
 */
function coerceValue(column: string, value: unknown): unknown {
  if (value === null || value === undefined) return null;

  if (JSONB_COLUMNS.has(column)) {
    return toJsonbArray(value);
  }

  if (BOOLEAN_COLUMNS.has(column)) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
    return Boolean(value);
  }

  if (NUMERIC_COLUMNS.has(column)) {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  if (INTEGER_COLUMNS.has(column)) {
    const num = parseInt(String(value), 10);
    return isNaN(num) ? null : num;
  }

  return value;
}

/**
 * Convert a RESO value to a JSON array.
 * RESO sends comma-separated strings like "Pool,Spa,Waterfall"
 */
function toJsonbArray(value: unknown): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    const items = value.split(',').map(s => s.trim()).filter(Boolean);
    return JSON.stringify(items);
  }
  return '[]';
}
