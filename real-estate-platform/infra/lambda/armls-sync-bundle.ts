/**
 * ARMLS Sync Lambda — Self-contained bundle
 *
 * Reads tokens from Secrets Manager, syncs ARMLS replication feed into RDS.
 * Triggered by EventBridge every 15 minutes (initial pull) or 4 hours (ongoing).
 * Uses checkpoint pattern — saves skiptoken every 100 pages for resume.
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import { Pool } from "pg";
import type { PoolClient } from "pg";
import { writeBronzePage, newRunId } from "./bronze-writer";

const cwClient = new CloudWatchClient({ region: "us-east-1" });

async function emitMetric(
  name: string,
  value: number,
  unit: "Count" | "Seconds" = "Count",
  dimensions?: Record<string, string>
): Promise<void> {
  try {
    await cwClient.send(
      new PutMetricDataCommand({
        Namespace: "RLSIR/DataPipeline",
        MetricData: [{
          MetricName: name,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
          Dimensions: dimensions
            ? Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value }))
            : undefined,
        }],
      })
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[metric] ${name} publish failed: ${msg}`);
  }
}

// ─── Types ──────────────────────────────────────────────────

interface LambdaContext {
  getRemainingTimeInMillis(): number;
  functionName: string;
  awsRequestId: string;
}

interface SyncResult {
  entity: string;
  pagesProcessed: number;
  recordsUpserted: number;
  completed: boolean;
  error?: string;
  lastSkipToken: string | null;
}

interface ODataResponse {
  "@odata.nextLink"?: string;
  value: Record<string, unknown>[];
}

interface SyncState {
  entity_name: string;
  last_skip_token: string | null;
  initial_pull_complete: boolean;
}

// ─── Secrets Manager (cached across warm invocations) ───────

const smClient = new SecretsManagerClient({ region: "us-east-1" });
let cachedAccessToken: string | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken) return cachedAccessToken;

  const res = await smClient.send(
    new GetSecretValueCommand({ SecretId: "rlsir/armls/tokens" })
  );
  const secret = JSON.parse(res.SecretString!);
  cachedAccessToken = secret.access_token;
  return cachedAccessToken;
}

// ─── RDS Connection ─────────────────────────────────────────

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.RDS_DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false },
    });
    pool.on("error", (err) => {
      console.error("[pool] Unexpected error:", err.message);
      pool = null;
    });
  }
  return pool;
}

async function rdsQuery(text: string, params?: unknown[]) {
  return getPool().query(text, params);
}

async function getRdsClient(): Promise<PoolClient> {
  return getPool().connect();
}

// ─── Spark Replication Client ───────────────────────────────

const BASE_URL = "https://replication.sparkapi.com/Reso/OData";
const STANDARD_API_URL = "https://replication.sparkapi.com/Reso/OData";
type EntityName = "Property" | "Member" | "Office" | "OpenHouse";

async function fetchPage(
  entity: EntityName,
  skipToken: string | null
): Promise<{ records: Record<string, unknown>[]; nextSkipToken: string | null }> {
  const accessToken = await getAccessToken();
  const url = skipToken
    ? `${BASE_URL}/${entity}?$skiptoken=${skipToken}`
    : `${BASE_URL}/${entity}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spark API ${res.status}: ${text.substring(0, 200)}`);
  }

  const data: ODataResponse = await res.json();
  const nextSkipToken = data["@odata.nextLink"]
    ? extractSkipToken(data["@odata.nextLink"])
    : null;

  return { records: data.value ?? [], nextSkipToken };
}

function extractSkipToken(nextLink: string): string | null {
  try {
    const url = new URL(nextLink);
    return url.searchParams.get("$skiptoken");
  } catch {
    const match = nextLink.match(/\$skiptoken=([^&]+)/);
    return match ? match[1] : null;
  }
}

// ─── Field Mapper (inline — must stay in sync with packages/shared/src/field-mapper.ts) ──

const PROPERTY_FIELD_MAP: Record<string, string> = {
  // Identification
  ListingKey: "listing_key", ListingId: "listing_id", StandardStatus: "standard_status",
  MlsStatus: "mls_status",
  // Location
  UnparsedAddress: "unparsed_address", StreetNumber: "street_number",
  StreetDirPrefix: "street_dir_prefix", StreetName: "street_name", StreetSuffix: "street_suffix",
  UnitNumber: "unit_number", City: "city", StateOrProvince: "state_or_province",
  PostalCode: "postal_code", CountyOrParish: "county_or_parish", SubdivisionName: "subdivision_name",
  Latitude: "latitude", Longitude: "longitude",
  // Price
  ListPrice: "list_price", ClosePrice: "close_price",
  OriginalListPrice: "original_list_price",       // ARMLS: permission denied as of 2026-04
  PreviousListPrice: "previous_list_price",        // ARMLS: permission denied as of 2026-04
  ConcessionsAmount: "concession_amount",           // Note: RESO key is ConcessionsAmount (plural)
  // Characteristics
  PropertyType: "property_type", PropertySubType: "property_sub_type",
  BedroomsTotal: "bedrooms_total", BathroomsTotalInteger: "bathrooms_total_integer",
  BathroomsFull: "bathrooms_full", BathroomsHalf: "bathrooms_half",
  LivingArea: "living_area", LotSizeAcres: "lot_size_acres", LotSizeSquareFeet: "lot_size_square_feet",
  YearBuilt: "year_built", StoriesTotal: "stories_total",
  // Features (JSONB arrays)
  InteriorFeatures: "interior_features", ExteriorFeatures: "exterior_features",
  Appliances: "appliances", Cooling: "cooling", Heating: "heating", Flooring: "flooring",
  Fencing: "fencing", Roof: "roof", ConstructionMaterials: "construction_materials",
  PoolFeatures: "pool_features", ParkingFeatures: "parking_features",
  CommunityFeatures: "community_features", View: "view_features",
  ArchitecturalStyle: "architectural_style", FireplaceFeatures: "fireplace_features",
  LotFeatures: "lot_features", PatioAndPorchFeatures: "patio_and_porch_features",
  Sewer: "sewer", WaterSource: "water_source", SecurityFeatures: "security_features",
  SpaFeatures: "spa_features", Utilities: "utilities", LaundryFeatures: "laundry_features",
  StructureType: "structure_type", Vegetation: "vegetation",
  // Booleans
  PoolPrivateYN: "pool_private_yn", FireplaceYN: "fireplace_yn", AssociationYN: "association_yn",
  HorseYN: "horse_yn", AttachedGarageYN: "attached_garage_yn",
  CoolingYN: "cooling_yn", HeatingYN: "heating_yn",
  InternetEntireListingDisplayYN: "internet_entire_listing_display_yn",
  InternetAddressDisplayYN: "internet_address_display_yn",
  LandLeaseYN: "land_lease_yn", DelayedMarketingYN: "delayed_marketing_yn",
  PropertyAttachedYN: "property_attached_yn",
  // HOA
  AssociationFee: "association_fee", AssociationFeeFrequency: "association_fee_frequency",
  AssociationFeeIncludes: "association_fee_includes", AssociationName: "association_name",
  AssociationPhone: "association_phone",
  // Parking
  GarageSpaces: "garage_spaces", CoveredSpaces: "covered_spaces",
  CarportSpaces: "carport_spaces", OpenParkingSpaces: "open_parking_spaces",
  // Listing agent attribution (IDX required)
  ListAgentFullName: "list_agent_full_name", ListAgentFirstName: "list_agent_first_name",
  ListAgentLastName: "list_agent_last_name", ListAgentMlsId: "list_agent_mls_id",
  ListAgentKey: "list_agent_key", ListAgentPreferredPhone: "list_agent_preferred_phone",
  ListOfficeName: "list_office_name", ListOfficeMlsId: "list_office_mls_id",
  ListOfficeKey: "list_office_key", ListOfficePhone: "list_office_phone",
  ListOfficeEmail: "list_office_email", AttributionContact: "attribution_contact",
  // Buyer agent/office
  BuyerAgentKey: "buyer_agent_key", BuyerAgentFullName: "buyer_agent_full_name",
  BuyerAgentFirstName: "buyer_agent_first_name", BuyerAgentLastName: "buyer_agent_last_name",
  BuyerAgentMlsId: "buyer_agent_mls_id", BuyerOfficeKey: "buyer_office_key",
  BuyerOfficeName: "buyer_office_name", BuyerOfficeMlsId: "buyer_office_mls_id",
  // Financing & Transaction
  BuyerFinancing: "buyer_financing",               // ARMLS: permission denied as of 2026-04
  SpecialListingConditions: "special_listing_conditions", // ARMLS: permission denied as of 2026-04
  ListingTerms: "listing_terms", Contingency: "contingency",
  Ownership: "ownership", Disclosures: "disclosures",
  // Content
  PublicRemarks: "public_remarks", Directions: "directions", CrossStreet: "cross_street",
  VirtualTourURLUnbranded: "virtual_tour_url",
  // Dates
  ListingContractDate: "listing_contract_date", CloseDate: "close_date",
  OffMarketDate: "off_market_date", OnMarketDate: "on_market_date",
  PendingTimestamp: "pending_timestamp",            // ARMLS: permission denied as of 2026-04
  ModificationTimestamp: "modification_timestamp",
  OriginalEntryTimestamp: "original_entry_timestamp",
  PriceChangeTimestamp: "price_change_timestamp", StatusChangeTimestamp: "status_change_timestamp",
  PhotosChangeTimestamp: "photos_change_timestamp", MajorChangeTimestamp: "major_change_timestamp",
  // Photos
  PhotosCount: "photos_count",
  // Tax
  TaxAnnualAmount: "tax_annual_amount", TaxYear: "tax_year", ParcelNumber: "parcel_number",
  TaxLegalDescription: "tax_legal_description",
  // Schools
  ElementarySchool: "elementary_school", ElementarySchoolDistrict: "elementary_school_district",
  HighSchoolDistrict: "high_school_district", MiddleOrJuniorSchool: "middle_or_junior_school",
  HighSchool: "high_school",
  // Misc
  OriginatingSystemName: "originating_system_name", FireplacesTotal: "fireplaces_total",
  BuilderName: "builder_name", MajorChangeType: "major_change_type",
  PostalCodePlus4: "postal_code_plus4", Zoning: "zoning",
  RoomsTotal: "rooms_total", BedroomsPossible: "bedrooms_possible",
  BathroomsTotalDecimal: "bathrooms_total_decimal",
};

const ARMLS_CUSTOM_MAP: Record<string, string> = {
  "Contact_sp_Info_co_List_sp_Agent_sp_Cell_sp_Phn2": "agent_cell_phone",
  "Price_sp_per_sp_Sq_sp_Ft": "price_per_sqft",
  "Planned_sp_Community_sp_Name": "planned_community_name",
  "Association_sp_Fees_co_Ttl_sp_Mthly_sp_Fee_sp_Equiv": "total_monthly_fee",
  "Association_sp_Fees_co_HOA_sp_Transfer_sp_Fee2": "hoa_transfer_fee",
  "General_sp_Property_sp_Description_co_Dwelling_sp_Styles": "dwelling_style",
  "General_sp_Property_sp_Description_co__pound__sp_of_sp_Interior_sp_Levels": "interior_levels",
};

const JSONB_COLS = new Set([
  "interior_features", "exterior_features", "appliances", "cooling", "heating",
  "flooring", "fencing", "roof", "construction_materials", "pool_features",
  "parking_features", "community_features", "view_features", "architectural_style",
  "fireplace_features", "lot_features", "patio_and_porch_features", "sewer",
  "water_source", "association_fee_includes", "security_features", "spa_features",
  "listing_terms", "disclosures", "utilities", "laundry_features", "structure_type", "vegetation",
  "buyer_financing", "special_listing_conditions",
]);

const BOOL_COLS = new Set([
  "pool_private_yn", "fireplace_yn", "association_yn", "horse_yn",
  "attached_garage_yn", "cooling_yn", "heating_yn",
  "internet_entire_listing_display_yn", "internet_address_display_yn",
  "land_lease_yn", "delayed_marketing_yn", "property_attached_yn",
]);

const NUM_COLS = new Set([
  "list_price", "close_price", "original_list_price", "previous_list_price",
  "concession_amount", "living_area", "lot_size_acres",
  "lot_size_square_feet", "latitude", "longitude", "association_fee",
  "garage_spaces", "covered_spaces", "carport_spaces", "open_parking_spaces",
  "tax_annual_amount", "price_per_sqft", "total_monthly_fee", "hoa_transfer_fee",
  "bathrooms_total_decimal",
]);

const INT_COLS = new Set([
  "bedrooms_total", "bathrooms_total_integer", "bathrooms_full", "bathrooms_half",
  "year_built", "stories_total", "photos_count", "tax_year", "fireplaces_total",
  "rooms_total", "bedrooms_possible", "interior_levels",
]);

function coerce(col: string, val: unknown): unknown {
  if (val === null || val === undefined) return null;
  if (JSONB_COLS.has(col)) {
    if (Array.isArray(val)) return JSON.stringify(val);
    if (typeof val === "string" && val.length > 0)
      return JSON.stringify(val.split(",").map((s) => s.trim()).filter(Boolean));
    return "[]";
  }
  if (BOOL_COLS.has(col)) {
    if (typeof val === "boolean") return val;
    return String(val).toLowerCase() === "true";
  }
  if (NUM_COLS.has(col)) { const n = Number(val); return isNaN(n) ? null : n; }
  if (INT_COLS.has(col)) { const n = parseInt(String(val), 10); return isNaN(n) ? null : n; }
  return val;
}

// ─── Validation & Computed Fields ──────────────────────────────

/**
 * Validate a mapped record and null out values that fail bounds checks.
 * Runs AFTER field mapping, BEFORE upsert. Only affects newly synced records.
 */
function validateRecord(record: Record<string, unknown>): Record<string, unknown> {
  // Coordinate bounds (greater Arizona area)
  if (record.latitude != null && (Number(record.latitude) < 31 || Number(record.latitude) > 37 || Number(record.latitude) === 0)) {
    record.latitude = null;
    record.longitude = null;
  }
  if (record.longitude != null && (Number(record.longitude) < -115 || Number(record.longitude) > -108 || Number(record.longitude) === 0)) {
    record.latitude = null;
    record.longitude = null;
  }

  // Living area: reject > 50,000 sqft
  if (record.living_area != null && Number(record.living_area) > 50000) record.living_area = null;

  // Bedrooms: reject > 20
  if (record.bedrooms_total != null && Number(record.bedrooms_total) > 20) record.bedrooms_total = null;

  // Bathrooms: reject > 20
  if (record.bathrooms_total_integer != null && Number(record.bathrooms_total_integer) > 20) record.bathrooms_total_integer = null;

  // Garage spaces: reject > 20 (residential business rule)
  if (record.garage_spaces != null && Number(record.garage_spaces) > 20) record.garage_spaces = null;

  // Parking columns are NUMERIC(4,1) — column max is 999.9. ARMLS routinely
  // sends bad data here (e.g. 85,895 — likely a misplaced sqft value). Null
  // anything above column bound to avoid 22003 overflow on insert.
  if (record.covered_spaces != null && Number(record.covered_spaces) > 999) record.covered_spaces = null;
  if (record.carport_spaces != null && Number(record.carport_spaces) > 999) record.carport_spaces = null;
  if (record.open_parking_spaces != null && Number(record.open_parking_spaces) > 999) record.open_parking_spaces = null;

  // Lot size: NUMERIC(10,4) on acres, NUMERIC(12,2) on sqft. Defensive bounds.
  if (record.lot_size_acres != null && Number(record.lot_size_acres) > 999999) record.lot_size_acres = null;
  if (record.lot_size_square_feet != null && Number(record.lot_size_square_feet) > 9999999999) record.lot_size_square_feet = null;

  // Year built: reject < 1800 or > current year + 2
  if (record.year_built != null) {
    const maxYear = new Date().getFullYear() + 2;
    if (Number(record.year_built) < 1800 || Number(record.year_built) > maxYear) record.year_built = null;
  }

  // Association fee: reject > $50,000/month
  if (record.association_fee != null && Number(record.association_fee) > 50000) record.association_fee = null;

  // Tax amount: reject > $1,000,000/year
  if (record.tax_annual_amount != null && Number(record.tax_annual_amount) > 1000000) record.tax_annual_amount = null;

  // Close date: reject dates more than 1 year in the future
  if (record.close_date != null) {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    if (new Date(record.close_date as string) > maxDate) record.close_date = null;
  }

  // Days on market: reject > 5000
  if (record.days_on_market != null && Number(record.days_on_market) > 5000) record.days_on_market = null;

  return record;
}

/**
 * Compute price per square foot for a record.
 * Uses close_price for closed listings, list_price otherwise.
 */
function computePricePerSqft(record: Record<string, unknown>): number | null {
  const area = Number(record.living_area);
  if (!area || area <= 0 || area > 50000) return null;

  const price = (record.standard_status === "Closed" && Number(record.close_price) > 0)
    ? Number(record.close_price)
    : Number(record.list_price);
  if (!price || price <= 0) return null;

  const ppsf = Math.round((price / area) * 100) / 100;
  return (ppsf >= 5 && ppsf <= 10000) ? ppsf : null;
}

function mapRecord(raw: Record<string, unknown>) {
  const cols: Record<string, unknown> = {};
  for (const [reso, db] of Object.entries(PROPERTY_FIELD_MAP)) {
    if (raw[reso] !== undefined && raw[reso] !== null) {
      cols[db] = coerce(db, raw[reso]);
    }
  }
  for (const [custom, db] of Object.entries(ARMLS_CUSTOM_MAP)) {
    if (raw[custom] !== undefined && raw[custom] !== null) {
      cols[db] = coerce(db, raw[custom]);
    }
  }
  if (!cols.listing_key) return null;
  if (!cols.standard_status) cols.standard_status = "Unknown";
  if (!cols.postal_code) cols.postal_code = "00000";
  if (!cols.list_office_name) cols.list_office_name = "Unknown";
  if (!cols.modification_timestamp) cols.modification_timestamp = new Date().toISOString();

  // Compute days_on_market
  if (cols.listing_contract_date) {
    const listDate = new Date(cols.listing_contract_date as string).getTime();
    if (cols.standard_status === "Closed" && cols.close_date) {
      // Closed: DOM = close_date - listing_contract_date
      const closeDate = new Date(cols.close_date as string).getTime();
      cols.days_on_market = Math.max(0, Math.floor((closeDate - listDate) / 86400000));
    } else if (cols.standard_status === "Active" || cols.standard_status === "Active Under Contract") {
      // Active: DOM = now - listing_contract_date
      cols.days_on_market = Math.max(0, Math.floor((Date.now() - listDate) / 86400000));
    }
  }

  // Validate bounds and null out garbage values
  validateRecord(cols);

  // Compute price_per_sqft (overrides ARMLS-provided value with our own calculation)
  const ppsf = computePricePerSqft(cols);
  if (ppsf !== null) cols.price_per_sqft = ppsf;

  cols.raw_data = JSON.stringify(raw);
  cols.last_synced_at = new Date().toISOString();
  return cols;
}

// ─── Change Tracking ───────────────────────────────────────

/** Fields we track changes on. Any change to these fields gets logged. */
const TRACKED_FIELDS = [
  "list_price",
  "close_price",
  "standard_status",
  "mls_status",
  "close_date",
  "on_market_date",
  "off_market_date",
  "photos_count",
] as const;

// Fields that should be compared numerically (avoids "1495.00" vs "1495" false positives)
const NUMERIC_FIELDS = new Set(["list_price", "close_price", "photos_count"]);

/**
 * Detect changes between incoming record and stored record.
 * Returns an array of {field, oldValue, newValue} for each tracked field that differs.
 */
function detectChanges(
  incoming: Record<string, unknown>,
  existing: Record<string, unknown>
): { field: string; oldValue: string | null; newValue: string | null }[] {
  const changes: { field: string; oldValue: string | null; newValue: string | null }[] = [];

  for (const field of TRACKED_FIELDS) {
    const oldVal = existing[field];
    const newVal = incoming[field];

    // Skip if both null/undefined
    if (oldVal == null && newVal == null) continue;

    // Numeric fields: compare as numbers to avoid formatting false positives
    if (NUMERIC_FIELDS.has(field)) {
      const oldNum = oldVal != null ? Number(oldVal) : null;
      const newNum = newVal != null ? Number(newVal) : null;
      if (oldNum === newNum) continue;
      // Only log if it's a real numeric difference (not NaN weirdness)
      if (oldNum != null && newNum != null && isNaN(oldNum) && isNaN(newNum)) continue;
      changes.push({
        field,
        oldValue: oldNum != null ? String(oldNum) : null,
        newValue: newNum != null ? String(newNum) : null,
      });
      continue;
    }

    // String/date fields: direct string comparison
    const oldStr = oldVal != null ? String(oldVal) : null;
    const newStr = newVal != null ? String(newVal) : null;

    if (oldStr !== newStr) {
      changes.push({ field, oldValue: oldStr, newValue: newStr });
    }
  }

  return changes;
}

// ─── Sync Engine ────────────────────────────────────────────

const CHECKPOINT_INTERVAL = 100;

async function recordSyncError(
  client: PoolClient,
  raw: Record<string, unknown>,
  err: unknown
): Promise<void> {
  const e = err as { code?: string; message?: string };
  const listingKey =
    (raw.listing_key as string | undefined) ??
    (raw.ListingKey as string | undefined) ??
    null;
  try {
    await client.query(
      `INSERT INTO sync_errors (entity_name, listing_key, error_code, error_message, raw_payload)
       VALUES ($1, $2, $3, $4, $5)`,
      ["Property", listingKey, e.code ?? null, e.message ?? "unknown error", JSON.stringify(raw)]
    );
  } catch (logErr) {
    const m = logErr instanceof Error ? logErr.message : String(logErr);
    console.error(`[sync-errors] Failed to log row failure: ${m}`);
  }
}

async function upsertPage(records: Record<string, unknown>[]): Promise<number> {
  if (records.length === 0) return 0;

  const mapped = records.map(mapRecord).filter((r): r is Record<string, unknown> => r !== null);
  if (mapped.length === 0) return 0;

  const client = await getRdsClient();
  let succeeded = 0;
  try {
    await client.query("BEGIN");

    // Batch-fetch current values for tracked fields (one query for the whole page)
    const listingKeys = mapped
      .map((cols) => cols.listing_key as string)
      .filter(Boolean);

    const existingRes = await client.query(
      `SELECT listing_key, listing_id, list_price, close_price, standard_status, mls_status,
              close_date, on_market_date, off_market_date, photos_count, modification_timestamp
       FROM listing_records WHERE listing_key = ANY($1::text[])`,
      [listingKeys]
    );
    const existingMap = new Map<string, Record<string, unknown>>();
    for (const row of existingRes.rows) {
      existingMap.set(row.listing_key as string, row);
    }

    // Track all changes for batch insert
    const allChanges: {
      listing_key: string;
      listing_id: number | null;
      source_timestamp: string | null;
      field: string;
      oldValue: string | null;
      newValue: string | null;
    }[] = [];

    for (const cols of mapped) {
      const key = cols.listing_key as string;
      const existing = existingMap.get(key);

      // Per-record SAVEPOINT — single bad row no longer rolls back its peers.
      // Failures land in sync_errors (migration 029) for triage.
      await client.query("SAVEPOINT row_save");
      try {
        // Detect changes (only for existing records — new inserts don't have a "before")
        const rowChanges: typeof allChanges = [];
        if (existing) {
          const changes = detectChanges(cols, existing);
          for (const change of changes) {
            rowChanges.push({
              listing_key: key,
              listing_id: (cols.listing_id as number) ?? (existing.listing_id as number) ?? null,
              source_timestamp: (cols.modification_timestamp as string) ?? null,
              field: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue,
            });
          }
        }

        // Upsert the record
        const columns = Object.keys(cols);
        const values = Object.values(cols);
        const placeholders = columns.map((_, i) => `$${i + 1}`);
        const updateCols = columns
          .filter((c) => c !== "listing_key" && c !== "id" && c !== "first_synced_at")
          .map((c) => `${c} = EXCLUDED.${c}`)
          .join(", ");
        await client.query(
          `INSERT INTO listing_records (${columns.join(", ")})
           VALUES (${placeholders.join(", ")})
           ON CONFLICT (listing_key) DO UPDATE SET ${updateCols}`,
          values
        );

        await client.query("RELEASE SAVEPOINT row_save");
        // Only commit row's change-log entries if the upsert succeeded.
        allChanges.push(...rowChanges);
        succeeded++;
      } catch (rowErr) {
        await client.query("ROLLBACK TO SAVEPOINT row_save");
        await recordSyncError(client, cols, rowErr);
      }
    }

    // Batch-insert all detected changes into the change log
    // Wrapped in its own savepoint so a change-log failure doesn't kill the page.
    if (allChanges.length > 0) {
      await client.query("SAVEPOINT changelog_save");
      try {
        const changePlaceholders: string[] = [];
        const changeValues: unknown[] = [];
        let idx = 1;
        for (const c of allChanges) {
          changePlaceholders.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5})`);
          changeValues.push(c.listing_key, c.listing_id, c.source_timestamp, c.field, c.oldValue, c.newValue);
          idx += 6;
        }
        await client.query(
          `INSERT INTO listing_change_log (listing_key, listing_id, source_timestamp, field_name, old_value, new_value)
           VALUES ${changePlaceholders.join(", ")}`,
          changeValues
        );
        await client.query("RELEASE SAVEPOINT changelog_save");
      } catch (logErr) {
        await client.query("ROLLBACK TO SAVEPOINT changelog_save");
        const msg = logErr instanceof Error ? logErr.message : String(logErr);
        console.error(`[change-log] Batch failed (${allChanges.length} entries): ${msg.substring(0, 200)}`);
      }
    }

    await client.query("COMMIT");
    return succeeded;
  } catch (err) {
    await client.query("ROLLBACK");
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[upsert] Page-level failure (${mapped.length} records): ${msg.substring(0, 200)}`);
    return 0;
  } finally {
    client.release();
  }
}

async function syncProperty(deadlineMs: number): Promise<SyncResult & { newListingKeys: string[] }> {
  const stateRes = await rdsQuery(
    "SELECT last_skip_token, initial_pull_complete FROM listing_sync_state WHERE entity_name = 'Property'"
  );
  const state: SyncState = stateRes.rows[0];
  let skipToken = state.last_skip_token;

  // Mark as running
  await rdsQuery(
    `UPDATE listing_sync_state SET last_sync_status = 'running', last_sync_started = NOW(), last_sync_error = NULL WHERE entity_name = 'Property'`
  );

  let pagesProcessed = 0;
  let recordsUpserted = 0;
  let lastValidSkipToken = skipToken;
  let completed = false;
  const newListingKeys: string[] = [];

  // Bronze dual-write: each Spark response page also lands in S3 NDJSON.gz.
  // One run_id per syncProperty() invocation, paginated as page_0000.ndjson.gz, page_0001…
  const bronzeRunId = newRunId();
  let bronzePagesWritten = 0;
  let bronzeBytesWritten = 0;

  try {
    while (true) {
      // Check deadline (60s safety margin)
      if (Date.now() >= deadlineMs - 60000) {
        console.log(`[sync] Near deadline after ${pagesProcessed} pages, checkpointing...`);
        break;
      }

      const { records, nextSkipToken } = await fetchPage("Property", skipToken);

      if (records.length === 0) {
        completed = true;
        break;
      }

      // Track new/modified active listings that need photos
      for (const raw of records) {
        const status = String(raw.StandardStatus ?? "");
        const photosCount = parseInt(String(raw.PhotosCount ?? "0"), 10);
        const listingKey = String(raw.ListingKey ?? "");
        if (
          listingKey &&
          photosCount > 0 &&
          ["Active", "Active Under Contract", "Coming Soon"].includes(status)
        ) {
          newListingKeys.push(listingKey);
        }
      }

      // BRONZE: fire-and-forget write to S3. Failures logged but do NOT break
      // the legacy Postgres path during Phase 1 dual-write.
      const bronze = await writeBronzePage(records, bronzeRunId, pagesProcessed);
      if (bronze.ok) {
        bronzePagesWritten++;
        bronzeBytesWritten += bronze.bytes ?? 0;
      }

      const count = await upsertPage(records);
      recordsUpserted += count;
      pagesProcessed++;

      if (nextSkipToken) lastValidSkipToken = nextSkipToken;
      skipToken = nextSkipToken;

      // Checkpoint every N pages
      if (pagesProcessed % CHECKPOINT_INTERVAL === 0) {
        await rdsQuery(
          `UPDATE listing_sync_state SET last_skip_token = $1, last_sync_record_count = $2 WHERE entity_name = 'Property'`,
          [lastValidSkipToken, recordsUpserted]
        );
        console.log(`[sync] Checkpoint: page ${pagesProcessed}, ${recordsUpserted} records, skiptoken ${lastValidSkipToken?.substring(0, 20)}... | bronze ${bronzePagesWritten} pages, ${(bronzeBytesWritten/1024/1024).toFixed(2)} MB`);
      }

      if (!nextSkipToken) {
        completed = true;
        break;
      }
    }

    // Final checkpoint
    await rdsQuery(
      `UPDATE listing_sync_state SET
        last_skip_token = $1, last_sync_status = $2, last_sync_completed = NOW(),
        last_sync_record_count = $3::integer, total_records_synced = total_records_synced + $3::integer,
        initial_pull_complete = CASE WHEN $4::boolean THEN TRUE ELSE initial_pull_complete END
       WHERE entity_name = 'Property'`,
      [lastValidSkipToken, completed ? "completed" : "running", recordsUpserted, completed]
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[sync] Error: ${errorMsg}`);
    await rdsQuery(
      `UPDATE listing_sync_state SET last_sync_status = 'error', last_sync_error = $1, last_skip_token = $2 WHERE entity_name = 'Property'`,
      [errorMsg.substring(0, 500), lastValidSkipToken]
    );
    return { entity: "Property", pagesProcessed, recordsUpserted, completed: false, error: errorMsg, lastSkipToken: lastValidSkipToken, newListingKeys };
  }

  return { entity: "Property", pagesProcessed, recordsUpserted, completed, lastSkipToken: lastValidSkipToken, newListingKeys };
}

// ─── Active-Only Sync (Track 2: Fast lane) ─────────────────

/**
 * Fetch a page from the Spark API with $filter support.
 * Uses the same replication endpoint, appending $filter on every request.
 *
 * Empirical note (2026-04-26): Spark $skiptoken does NOT carry filter context
 * across requests on this endpoint. Resuming with $skiptoken alone returns
 * unfiltered results. Always pass $filter alongside $skiptoken when both are
 * available so pagination stays scoped.
 */
async function fetchFilteredPage(
  entity: EntityName,
  filter: string,
  skipToken: string | null
): Promise<{ records: Record<string, unknown>[]; nextSkipToken: string | null }> {
  const accessToken = await getAccessToken();
  const params: string[] = [];
  if (filter) params.push(`$filter=${encodeURIComponent(filter)}`);
  if (skipToken) params.push(`$skiptoken=${skipToken}`);
  const url = `${STANDARD_API_URL}/${entity}${params.length ? "?" + params.join("&") : ""}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spark API ${res.status}: ${text.substring(0, 200)}`);
  }

  const data: ODataResponse = await res.json();
  const nextSkipToken = data["@odata.nextLink"]
    ? extractSkipToken(data["@odata.nextLink"])
    : null;

  return { records: data.value ?? [], nextSkipToken };
}

/**
 * Bulk UPSERT optimized for refresh-actives.
 *
 * Skips the per-row SAVEPOINT pattern + change-log generation — those exist
 * in upsertPage() to capture field-level changes during the delta sync.
 * refresh-actives doesn't need them: the delta sync still catches every
 * modification; this path's job is purely to bump last_synced_at on
 * unchanged rows for ARMLS 12h compliance.
 *
 * Performance: ~5ms per page vs upsertPage's ~25s per page. 5000x faster.
 *
 * Trade-off: if a row in the batch has a constraint/cast error, the WHOLE
 * batch fails. Acceptable here because refresh-actives is touching live
 * Spark data that just passed delta sync — schema correctness is already
 * proven.
 */
async function bulkUpsertActives(records: Record<string, unknown>[]): Promise<number> {
  if (records.length === 0) return 0;

  const mapped = records
    .map(mapRecord)
    .filter((r): r is Record<string, unknown> => r !== null);
  if (mapped.length === 0) return 0;

  // Use the union of all keys across mapped rows. mapRecord() yields a
  // stable shape, but defensively union in case of late-arriving fields.
  const columnSet = new Set<string>();
  for (const cols of mapped) {
    for (const k of Object.keys(cols)) columnSet.add(k);
  }
  const columns = Array.from(columnSet);

  // PG protocol caps at 65535 parameters per query. Chunk if needed.
  // 1000 rows × ~85 cols = 85k > limit, so chunk by 500.
  const CHUNK = 500;
  const client = await getRdsClient();
  let upserted = 0;

  try {
    await client.query("BEGIN");

    for (let i = 0; i < mapped.length; i += CHUNK) {
      const chunk = mapped.slice(i, i + CHUNK);
      const valuesPlaceholders: string[] = [];
      const params: unknown[] = [];
      let p = 1;

      for (const cols of chunk) {
        const rowPlaceholders = columns.map((c) => {
          if (c in cols) {
            params.push(cols[c]);
            return `$${p++}`;
          } else {
            return "NULL";
          }
        });
        valuesPlaceholders.push(`(${rowPlaceholders.join(", ")})`);
      }

      const updateCols = columns
        .filter((c) => c !== "listing_key" && c !== "id" && c !== "first_synced_at")
        .map((c) => `${c} = EXCLUDED.${c}`)
        .join(", ");

      const sql = `
        INSERT INTO listing_records (${columns.join(", ")})
        VALUES ${valuesPlaceholders.join(", ")}
        ON CONFLICT (listing_key) DO UPDATE SET ${updateCols}
      `;
      await client.query(sql, params);
      upserted += chunk.length;
    }

    await client.query("COMMIT");
    return upserted;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * ARMLS 12h compliance refresh — re-fetches EVERY Active+AUC listing from
 * Spark and UPSERTs to bump last_synced_at, even if ModificationTimestamp
 * hasn't moved.
 *
 * Why this is separate from syncActiveListings():
 *   syncActiveListings() uses ModificationTimestamp watermark — only finds
 *   rows ARMLS reports as modified. Unchanged Active listings keep stale
 *   last_synced_at indefinitely, breaking ARMLS 12h compliance.
 *
 * This function ignores the watermark, walks all Active+AUC end-to-end:
 *   - $orderby=ModificationTimestamp desc to defeat Spark's response-cache
 *     dedupe (same trick we learned in active-snapshot)
 *   - 2.5s throttle between pages — under Spark's per-token rate cap
 *   - Follows @odata.nextLink directly (Spark uses $skip when sorted, not
 *     $skiptoken — also lessons from active-snapshot)
 *   - Reuses upsertPage() for the UPSERT — same field-mapper, same SAVEPOINT
 *     pattern
 *   - Does NOT touch listing_sync_state — delta sync's checkpoint is preserved
 *
 * Schedule via EventBridge rate(6h) → max stale = 6h, ARMLS 12h SLA satisfied
 * with 6h buffer for missed runs.
 */
async function refreshAllActives(
  deadlineMs: number,
  orderDirection: 'asc' | 'desc' = 'desc'
): Promise<{
  pagesProcessed: number;
  recordsUpserted: number;
  completed: boolean;
  error?: string;
}> {
  const accessToken = await getAccessToken();
  // Cover all four "active inventory" statuses ARMLS displays via IDX:
  // Active, AUC (under contract w/ backup offers), Pending (no backups), Coming Soon (pre-list).
  // ARMLS audit guidelines apply to any of these on the IDX display.
  const filter =
    "(StandardStatus eq 'Active' or StandardStatus eq 'Active Under Contract'" +
    " or StandardStatus eq 'Pending' or StandardStatus eq 'Coming Soon')";
  const params = new URLSearchParams();
  params.set("$filter", filter);
  params.set("$top", "1000");
  // Direction is chosen per-invocation to defeat Spark's per-token response
  // cache: alternating ASC/DESC across consecutive runs guarantees a different
  // URL hash and forces fresh data. ASC also surfaces the stalest rows first
  // (oldest ModificationTimestamp = oldest last_synced_at).
  params.set("$orderby", `ModificationTimestamp ${orderDirection}`);

  let pageUrl: string | null = `${STANDARD_API_URL}/Property?${params.toString()}`;
  let pagesProcessed = 0;
  let recordsUpserted = 0;
  const maxPages = 100; // 50K records ≈ 50 pages; cap protects against runaway

  try {
    while (pageUrl && pagesProcessed < maxPages) {
      // Stop 60s before deadline
      if (Date.now() >= deadlineMs - 60_000) {
        console.warn(`[refresh-actives] near deadline after ${pagesProcessed} pages, stopping early`);
        return { pagesProcessed, recordsUpserted, completed: false };
      }

      // 429/503 retry with backoff
      let res!: Response;
      for (let attempt = 0; attempt < 3; attempt++) {
        res = await fetch(pageUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });
        if (res.ok) break;
        if ((res.status === 429 || res.status === 503) && attempt < 2) {
          const backoffMs = (attempt + 1) * 15_000;
          console.warn(`[refresh-actives] Spark ${res.status}, retry in ${backoffMs / 1000}s`);
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }
        const text = await res.text();
        throw new Error(`Spark error ${res.status}: ${text.substring(0, 200)}`);
      }

      const data = await res.json() as ODataResponse;
      const records = data.value ?? [];

      if (records.length === 0) {
        // empty page = end of feed
        return { pagesProcessed, recordsUpserted, completed: true };
      }

      // Bulk UPSERT — see bulkUpsertActives docstring. ~5000x faster than
      // the per-row SAVEPOINT path; necessary to fit a full 50-page walk
      // (50K listings) in Lambda's 900s timeout.
      const count = await bulkUpsertActives(records);
      recordsUpserted += count;
      pagesProcessed++;

      pageUrl = data["@odata.nextLink"] ?? null;

      // Throttle between pages — under Spark's ~24 req/min rate cap
      if (pageUrl) {
        await new Promise((r) => setTimeout(r, 2_500));
      }
    }

    return { pagesProcessed, recordsUpserted, completed: !pageUrl };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { pagesProcessed, recordsUpserted, completed: false, error: errorMsg };
  }
}

/**
 * Mark Active+AUC listings as Withdrawn if their last_synced_at is older
 * than `staleHours`. Closes the ARMLS 12h compliance gap for "orphaned"
 * listings — rows our mirror still shows as Active but ARMLS has stopped
 * returning (typically because the listing went off-market and ARMLS
 * dropped it from the active replication feed).
 *
 * Why we trust this signal: refresh-actives walks the entire Spark Active+AUC
 * feed every 6 hours. Any row not touched by that walk for `staleHours` is
 * confidently NOT in ARMLS's active set.
 *
 * Default staleHours = 48 — well past two refresh-actives cycles.
 */
async function markStaleActives(staleHours = 48): Promise<{ marked: number }> {
  const result = await rdsQuery(
    `UPDATE listing_records
     SET is_deleted = TRUE,
         standard_status = 'Withdrawn'
     WHERE is_deleted = FALSE
       AND standard_status IN ('Active', 'Active Under Contract', 'Pending', 'Coming Soon')
       AND last_synced_at < NOW() - INTERVAL '1 hour' * $1
     RETURNING listing_key`,
    [staleHours]
  );
  return { marked: result.rowCount ?? 0 };
}

/**
 * Count Active+AUC listings whose last_synced_at is older than `staleHours`.
 * The compliance signal — emitted as `ActivesStaleOver12h` metric.
 */
async function countStaleActives(staleHours = 12): Promise<number> {
  const result = await rdsQuery<{ n: string }>(
    `SELECT COUNT(*)::TEXT AS n
     FROM listing_records
     WHERE standard_status IN ('Active','Active Under Contract','Pending','Coming Soon')
       AND is_deleted = FALSE
       AND last_synced_at < NOW() - INTERVAL '1 hour' * $1`,
    [staleHours]
  );
  return parseInt(result.rows[0]?.n ?? "0", 10);
}

/**
 * Sync recently-modified listings using ModificationTimestamp-based CDC.
 *
 * Filter: `$filter=ModificationTimestamp ge {last_high_watermark}` (industry-
 * standard RESO replication pattern). Catches records that flip status
 * (Active → Pending → Closed) — the previous StandardStatus filter missed
 * those transitions because ARMLS removed them from its result set, leaving
 * our local copies frozen at "Active" forever.
 *
 * Watermark is stored in listing_sync_state.last_high_watermark.
 *   - First run after migration 032: watermark = 60 days ago → catches the
 *     ~7,800 stale records that haven't been touched since 2026-03-12.
 *   - Subsequent runs: watermark = MAX(ModificationTimestamp) of last batch
 *     minus 1 hour overlap (idempotent upserts make the overlap safe).
 *   - If interrupted (Lambda timeout): skip-token preserved, watermark
 *     unchanged — next run resumes mid-page from same window.
 *   - If completed (nextSkipToken=null): skip-token cleared, watermark
 *     advances to MAX received ModificationTimestamp.
 *
 * Result set is status-agnostic — sync now updates local copies for
 * Active/Pending/AUC/Closed/Withdrawn/etc. as ARMLS modifies them.
 */
async function syncActiveListings(deadlineMs: number): Promise<SyncResult & { newListingKeys: string[] }> {
  const SYNC_KEY = "Property-Active";
  const WATERMARK_OVERLAP_MS = 60 * 60 * 1000; // 1-hour overlap guard

  // Ensure sync state row exists
  await rdsQuery(
    `INSERT INTO listing_sync_state (entity_name, last_skip_token, initial_pull_complete, last_sync_status, total_records_synced, last_high_watermark)
     VALUES ($1, NULL, FALSE, 'idle', 0, NOW() - INTERVAL '60 days')
     ON CONFLICT (entity_name) DO NOTHING`,
    [SYNC_KEY]
  );

  const stateRes = await rdsQuery<{ last_skip_token: string | null; last_high_watermark: string | null }>(
    "SELECT last_skip_token, last_high_watermark FROM listing_sync_state WHERE entity_name = $1",
    [SYNC_KEY]
  );
  const state = stateRes.rows[0];

  // Watermark for this cycle — overlap by 1h to avoid edge-case misses.
  const watermarkRaw = state.last_high_watermark
    ? new Date(new Date(state.last_high_watermark).getTime() - WATERMARK_OVERLAP_MS)
    : new Date(Date.now() - 60 * 24 * 3600 * 1000);
  const watermarkISO = watermarkRaw.toISOString();
  const filter = `ModificationTimestamp ge ${watermarkISO}`;

  let skipToken = state.last_skip_token;
  let highWatermark = watermarkRaw.getTime();

  await rdsQuery(
    `UPDATE listing_sync_state SET last_sync_status = 'running', last_sync_started = NOW(), last_sync_error = NULL WHERE entity_name = $1`,
    [SYNC_KEY]
  );

  console.log(`[sync-active] CDC pull from watermark ${watermarkISO}${skipToken ? ' (resuming mid-page)' : ''}`);

  let pagesProcessed = 0;
  let recordsUpserted = 0;
  let lastValidSkipToken = skipToken;
  let completed = false;
  const newListingKeys: string[] = [];

  // Bronze dual-write — same pattern as syncProperty(). One run_id per invocation.
  const bronzeRunId = newRunId();
  let bronzePagesWritten = 0;
  let bronzeBytesWritten = 0;

  try {
    while (true) {
      // Reserve 3 min for clean layer upsert after sync completes
      if (Date.now() >= deadlineMs - 180000) {
        console.log(`[sync-active] Near deadline after ${pagesProcessed} pages, checkpointing...`);
        break;
      }

      const { records, nextSkipToken } = await fetchFilteredPage("Property", filter, skipToken);

      if (records.length === 0) {
        completed = true;
        break;
      }

      // Track max ModificationTimestamp seen so we can advance the watermark.
      for (const raw of records) {
        const tsRaw = raw.ModificationTimestamp;
        if (typeof tsRaw === 'string') {
          const t = new Date(tsRaw).getTime();
          if (Number.isFinite(t) && t > highWatermark) highWatermark = t;
        }
        // Photo backfill: only for currently-active records with photos
        const status = String(raw.StandardStatus ?? "");
        const photosCount = parseInt(String(raw.PhotosCount ?? "0"), 10);
        const listingKey = String(raw.ListingKey ?? "");
        if (listingKey && photosCount > 0 && ["Active", "Active Under Contract", "Coming Soon"].includes(status)) {
          newListingKeys.push(listingKey);
        }
      }

      // BRONZE: fire-and-forget S3 write. Phase 1 dual-write.
      const bronze = await writeBronzePage(records, bronzeRunId, pagesProcessed);
      if (bronze.ok) {
        bronzePagesWritten++;
        bronzeBytesWritten += bronze.bytes ?? 0;
      }

      const count = await upsertPage(records);
      recordsUpserted += count;
      pagesProcessed++;

      if (nextSkipToken) lastValidSkipToken = nextSkipToken;
      skipToken = nextSkipToken;

      if (pagesProcessed % CHECKPOINT_INTERVAL === 0) {
        await rdsQuery(
          `UPDATE listing_sync_state SET last_skip_token = $1, last_sync_record_count = $2 WHERE entity_name = $3`,
          [lastValidSkipToken, recordsUpserted, SYNC_KEY]
        );
        console.log(`[sync-active] Checkpoint: page ${pagesProcessed}, ${recordsUpserted} records, max ts ${new Date(highWatermark).toISOString()} | bronze ${bronzePagesWritten} pages, ${(bronzeBytesWritten/1024/1024).toFixed(2)} MB`);
      }

      if (!nextSkipToken) {
        completed = true;
        break;
      }
    }

    // On completion, advance watermark and clear skip-token.
    // On pause, keep watermark + skip-token unchanged — next run resumes mid-page.
    const newWatermarkISO = new Date(highWatermark).toISOString();
    await rdsQuery(
      `UPDATE listing_sync_state SET
        last_skip_token = $1,
        last_sync_status = $2,
        last_sync_completed = NOW(),
        last_sync_record_count = $3::integer,
        total_records_synced = total_records_synced + $3::integer,
        last_high_watermark = CASE WHEN $4::boolean THEN $5::timestamptz ELSE last_high_watermark END,
        initial_pull_complete = CASE WHEN $4::boolean THEN TRUE ELSE initial_pull_complete END
       WHERE entity_name = $6`,
      [
        completed ? null : lastValidSkipToken,
        completed ? "completed" : "running",
        recordsUpserted,
        completed,
        newWatermarkISO,
        SYNC_KEY
      ]
    );

    console.log(`[sync-active] ${completed ? 'Completed' : 'Paused'}: ${pagesProcessed} pages, ${recordsUpserted} records${completed ? `, watermark advanced to ${newWatermarkISO}` : ''}`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[sync-active] Error: ${errorMsg}`);
    await rdsQuery(
      `UPDATE listing_sync_state SET last_sync_status = 'error', last_sync_error = $1, last_skip_token = $2 WHERE entity_name = $3`,
      [errorMsg.substring(0, 500), lastValidSkipToken, SYNC_KEY]
    );
    return { entity: "Property-Active", pagesProcessed, recordsUpserted, completed: false, error: errorMsg, lastSkipToken: lastValidSkipToken, newListingKeys };
  }

  return { entity: "Property-Active", pagesProcessed, recordsUpserted, completed, lastSkipToken: lastValidSkipToken, newListingKeys };
}

// ─── Photo URL Sync ─────────────────────────────────────────

const PHOTO_CONCURRENCY = 8;

/**
 * Fetch all photos for a single listing (paginates through all pages).
 * Returns number of photos stored, or -1 on error.
 */
async function fetchAllPhotosForListing(
  accessToken: string,
  listingKey: string,
  deadlineMs: number
): Promise<number> {
  let pageUrl: string | null = `${BASE_URL}/Property('${listingKey}')/Media`;
  const allPhotos: Record<string, unknown>[] = [];

  while (pageUrl && Date.now() < deadlineMs - 30000) {
    const res = await fetch(pageUrl, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });
    if (!res.ok) {
      if (res.status === 404 || res.status === 403) {
        // Not in RESO or restricted — mark as fetched with empty array
        await rdsQuery(
          `UPDATE listing_records SET photo_urls = '[]'::jsonb, photos_fetched_at = NOW() WHERE listing_key = $1`,
          [listingKey]
        );
        return 0;
      }
      // Transient error — increment error counter so we skip after 3 failures
      await rdsQuery(
        `UPDATE listing_records SET photos_fetch_errors = COALESCE(photos_fetch_errors, 0) + 1 WHERE listing_key = $1`,
        [listingKey]
      );
      return -1;
    }
    const data: ODataResponse = await res.json();
    allPhotos.push(...(data.value ?? []));
    pageUrl = (data as Record<string, unknown>)["@odata.nextLink"] as string | null ?? null;
  }

  if (allPhotos.length > 0) {
    // Sort: preferred first, then by order
    allPhotos.sort((a, b) => {
      const aPref = a.PreferredPhotoYN === true || a.PreferredPhotoYN === "true" ? 0 : 1;
      const bPref = b.PreferredPhotoYN === true || b.PreferredPhotoYN === "true" ? 0 : 1;
      if (aPref !== bPref) return aPref - bPref;
      return (typeof a.Order === "number" ? a.Order : 999) - (typeof b.Order === "number" ? b.Order : 999);
    });

    // Deduplicate by MediaKey
    const seen = new Set<string>();
    const unique = allPhotos.filter(p => {
      const key = String(p.MediaKey ?? p.MediaURL ?? "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const photoUrls = unique.map((p) => ({
      url: String(p.MediaURL ?? ""),
      desc: p.ShortDescription ? String(p.ShortDescription) : null,
    }));

    await rdsQuery(
      `UPDATE listing_records SET photo_urls = $1, photos_fetched_at = NOW() WHERE listing_key = $2`,
      [JSON.stringify(photoUrls), listingKey]
    );

    return photoUrls.length;
  }

  // Pagination completed but 0 photos — mark as fetched
  await rdsQuery(
    `UPDATE listing_records SET photo_urls = '[]'::jsonb, photos_fetched_at = NOW() WHERE listing_key = $1`,
    [listingKey]
  );
  return 0;
}

/**
 * Sync photos for listings that need them. Runs concurrently (8 at a time).
 * Used by both regular sync and backfill-photos task.
 */
async function syncPhotoUrls(
  deadlineMs: number,
  limit = 500
): Promise<{ listingsProcessed: number; photosInserted: number; errors: number }> {
  const result = await rdsQuery(
    `SELECT listing_key, photos_count FROM listing_records
     WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE
       AND standard_status IN ('Active', 'Active Under Contract', 'Coming Soon')
       AND photos_count > 0 AND photos_fetched_at IS NULL
       AND COALESCE(photos_fetch_errors, 0) < 6
     ORDER BY list_price DESC NULLS LAST LIMIT $1`,
    [limit]
  );

  // Log how many listings are permanently skipped due to repeated fetch errors
  const skipped = await rdsQuery(
    `SELECT count(*) as c FROM listing_records
     WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE
       AND standard_status IN ('Active', 'Active Under Contract', 'Coming Soon')
       AND photos_count > 0 AND photos_fetched_at IS NULL
       AND COALESCE(photos_fetch_errors, 0) >= 6`
  );
  if (parseInt((skipped.rows[0] as { c: string }).c, 10) > 0) {
    console.log(`[backfill-photos] Skipped ${skipped.rows[0].c} listings with 3+ fetch errors`);
  }

  let listingsProcessed = 0;
  let photosInserted = 0;
  let errors = 0;
  const accessToken = await getAccessToken();
  const rows = result.rows as { listing_key: string; photos_count: number }[];

  // Process in concurrent chunks
  for (let i = 0; i < rows.length; i += PHOTO_CONCURRENCY) {
    if (Date.now() >= deadlineMs - 60000) break;

    const chunk = rows.slice(i, i + PHOTO_CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map(row => fetchAllPhotosForListing(accessToken, row.listing_key, deadlineMs))
    );

    for (const r of results) {
      listingsProcessed++;
      if (r.status === "fulfilled" && r.value >= 0) {
        photosInserted += r.value;
      } else {
        errors++;
      }
    }
  }

  return { listingsProcessed, photosInserted, errors };
}

/**
 * Fetch photos for a list of specific listing keys (used after property upsert).
 * Fire-and-forget style — errors logged but don't block sync.
 */
async function fetchPhotosForNewListings(
  listingKeys: string[],
  deadlineMs: number
): Promise<{ fetched: number; photos: number }> {
  if (listingKeys.length === 0) return { fetched: 0, photos: 0 };

  const accessToken = await getAccessToken();
  let fetched = 0;
  let photos = 0;

  for (let i = 0; i < listingKeys.length; i += PHOTO_CONCURRENCY) {
    if (Date.now() >= deadlineMs - 60000) break;

    const chunk = listingKeys.slice(i, i + PHOTO_CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map(key => fetchAllPhotosForListing(accessToken, key, deadlineMs))
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value >= 0) {
        fetched++;
        photos += r.value;
      }
    }
  }

  return { fetched, photos };
}

// ─── Maintenance Tasks ──────────────────────────────────────

async function taskBackfillDom(deadlineMs: number): Promise<{ updated: number; remaining: number }> {
  let totalUpdated = 0;
  const BATCH = 50000;

  while (Date.now() < deadlineMs - 60000) {
    const res = await rdsQuery(
      `UPDATE listing_records
       SET days_on_market = LEAST(GREATEST(0, (close_date::date - listing_contract_date::date)), 9999)
       WHERE id IN (
         SELECT id FROM listing_records
         WHERE standard_status = 'Closed'
           AND close_date IS NOT NULL AND listing_contract_date IS NOT NULL
           AND (days_on_market IS NULL OR days_on_market = 0)
           AND (close_date::date - listing_contract_date::date) BETWEEN 0 AND 9999
         LIMIT $1
       )`,
      [BATCH]
    );
    totalUpdated += res.rowCount ?? 0;
    console.log(`[backfill-dom] Batch: ${res.rowCount} rows (total: ${totalUpdated})`);
    if ((res.rowCount ?? 0) < BATCH) break;
  }

  const remaining = await rdsQuery(
    `SELECT count(*) as c FROM listing_records WHERE standard_status = 'Closed' AND close_date IS NOT NULL AND listing_contract_date IS NOT NULL AND (days_on_market IS NULL OR days_on_market = 0)`
  );

  return { updated: totalUpdated, remaining: parseInt(remaining.rows[0].c, 10) };
}

async function taskPurgeRawData(deadlineMs: number): Promise<{ purged: number; remaining: number }> {
  let totalPurged = 0;
  const BATCH = 50000;

  while (Date.now() < deadlineMs - 60000) {
    const res = await rdsQuery(
      `UPDATE listing_records SET raw_data = NULL
       WHERE id IN (
         SELECT id FROM listing_records
         WHERE standard_status IN ('Closed', 'Expired', 'Withdrawn', 'Canceled')
           AND raw_data IS NOT NULL
         LIMIT $1
       )`,
      [BATCH]
    );
    totalPurged += res.rowCount ?? 0;
    console.log(`[purge-raw] Batch: ${res.rowCount} rows (total: ${totalPurged})`);
    if ((res.rowCount ?? 0) < BATCH) break;
  }

  const remaining = await rdsQuery(
    `SELECT count(*) as c FROM listing_records WHERE standard_status IN ('Closed', 'Expired', 'Withdrawn', 'Canceled') AND raw_data IS NOT NULL`
  );

  return { purged: totalPurged, remaining: parseInt((remaining.rows[0] as { c: string }).c, 10) };
}

async function taskRefreshViews(): Promise<{ refreshed: boolean; normalizedRefreshed: boolean }> {
  // Refresh the new clean-layer analytics pipeline (analytics_base + 9 MVs)
  const pipelineStart = Date.now();
  const result = await rdsQuery('SELECT * FROM refresh_analytics_pipeline()');
  for (const row of result.rows) {
    console.log(`[refresh] ${row.step}: ${row.duration_ms}ms, ${row.row_count} rows`);
  }
  console.log(`[refresh] Pipeline complete in ${Date.now() - pipelineStart}ms`);

  // Also refresh legacy views if they exist (backward compat)
  let normalizedRefreshed = false;
  try {
    await rdsQuery('SELECT refresh_analytics_views()');
    normalizedRefreshed = true;
  } catch {
    // Legacy function may not exist — that's fine
  }

  return { refreshed: true, normalizedRefreshed };
}

// ─── DQ Assertions (Phase 3 — scheduled side-table writes) ──
//
// Same rules as scripts/dq-assert.mjs, embedded for Lambda task=run-dq.
// Idempotent via run_id (YYYY-MM-DD) — each (listing_key, rule_name, run_id)
// is unique per migration 031, so daily reruns ON CONFLICT DO NOTHING.
// Compliance: writes only to listing_records_exceptions (side table). The
// ARMLS mirror is read-only.

const DQ_RULES = [
  { name: 'lat_outside_arizona',          severity: 'error', predicate: `latitude IS NOT NULL AND (latitude < 31 OR latitude > 37)`,                         valueExpr: `latitude::text` },
  { name: 'lon_outside_arizona',          severity: 'error', predicate: `longitude IS NOT NULL AND (longitude > -108 OR longitude < -115)`,                  valueExpr: `longitude::text` },
  { name: 'living_area_over_50000_sqft',  severity: 'error', predicate: `living_area > 50000`,                                                               valueExpr: `living_area::text` },
  { name: 'future_close_date',            severity: 'error', predicate: `close_date > CURRENT_DATE + INTERVAL '30 days'`,                                    valueExpr: `close_date::text` },
  { name: 'nonpositive_list_price',       severity: 'error', predicate: `list_price IS NOT NULL AND list_price <= 0`,                                        valueExpr: `list_price::text` },
  { name: 'nonpositive_close_price',      severity: 'error', predicate: `close_price IS NOT NULL AND close_price <= 0`,                                      valueExpr: `close_price::text` },
  { name: 'missing_city',                 severity: 'warn',  predicate: `(city IS NULL OR length(city) = 0)`,                                                valueExpr: `'(empty)'` },
  { name: 'null_subdivision',             severity: 'info',  predicate: `subdivision_name IS NULL`,                                                          valueExpr: `'(null)'` },
  { name: 'bad_postal_code',              severity: 'warn',  predicate: `(postal_code IS NULL OR length(postal_code) < 5)`,                                  valueExpr: `COALESCE(postal_code, '(null)')` },
] as const;

async function taskRunDq(): Promise<{ run_id: string; rules: { name: string; severity: string; inserted: number; ms: number }[]; totalInserted: number }> {
  const runId = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const results: { name: string; severity: string; inserted: number; ms: number }[] = [];

  for (const rule of DQ_RULES) {
    const t0 = Date.now();
    try {
      const r = await rdsQuery(
        `INSERT INTO listing_records_exceptions (listing_key, rule_name, severity, violation_value, run_id)
         SELECT listing_key, $1, $2, ${rule.valueExpr}, $3
         FROM listing_records
         WHERE COALESCE(is_deleted, false) = false AND (${rule.predicate})
         ON CONFLICT (listing_key, rule_name, run_id) DO NOTHING`,
        [rule.name, rule.severity, runId]
      );
      results.push({ name: rule.name, severity: rule.severity, inserted: r.rowCount ?? 0, ms: Date.now() - t0 });
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      console.error(`[run-dq] rule '${rule.name}' failed: ${m}`);
      results.push({ name: rule.name, severity: rule.severity, inserted: -1, ms: Date.now() - t0 });
    }
  }

  const totalInserted = results.reduce((sum, r) => sum + Math.max(r.inserted, 0), 0);
  return { run_id: runId, rules: results, totalInserted };
}

// ─── Lambda Handler ─────────────────────────────────────────

interface LambdaEvent {
  task?:
    | "backfill-dom"
    | "purge-raw-data"
    | "refresh-views"
    | "run-dq"
    | "backfill-photos"
    | "sync-active"
    /** Re-fetch every Active+AUC listing (ARMLS 12h compliance). Schedule via cron-style EventBridge rate(6 hours) or cron-window. */
    | "refresh-actives"
    /** Mark Active+AUC listings as Withdrawn if last_synced_at older than staleHours (default 48h). */
    | "mark-stale-actives";
  /** Walk direction for refresh-actives. Default: alternates ASC/DESC by hour-of-day to defeat Spark's per-token response cache. */
  orderDirection?: "asc" | "desc";
  /** Hours threshold for mark-stale-actives task (default 48). */
  staleHours?: number;
}

export async function handler(event: LambdaEvent, context: LambdaContext) {
  const startTime = Date.now();
  const deadlineMs = startTime + context.getRemainingTimeInMillis();

  console.log(`[armls-sync] Starting. Task: ${event.task ?? 'sync'}. Time budget: ${context.getRemainingTimeInMillis()}ms`);

  // ── Maintenance tasks (invoked manually) ──
  if (event.task === "backfill-dom") {
    const result = await taskBackfillDom(deadlineMs);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[backfill-dom] Done in ${duration}s. Updated: ${result.updated}, Remaining: ${result.remaining}`);
    return { statusCode: result.remaining > 0 ? 207 : 200, body: JSON.stringify({ task: "backfill-dom", duration: `${duration}s`, ...result }) };
  }

  if (event.task === "backfill-photos") {
    await getAccessToken();
    const result = await syncPhotoUrls(deadlineMs, 500);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[backfill-photos] Done in ${duration}s. Listings: ${result.listingsProcessed}, Photos: ${result.photosInserted}, Errors: ${result.errors}`);

    // Check remaining work (exclude listings that have failed 3+ times)
    const remaining = await rdsQuery(
      `SELECT count(*) as c FROM listing_records
       WHERE photos_count > 0 AND photos_fetched_at IS NULL AND is_deleted = FALSE
         AND internet_entire_listing_display_yn = TRUE
         AND standard_status IN ('Active', 'Active Under Contract', 'Coming Soon')
         AND COALESCE(photos_fetch_errors, 0) < 6`
    );
    const rem = parseInt((remaining.rows[0] as { c: string }).c, 10);
    console.log(`[backfill-photos] Remaining: ${rem} listings`);

    // EventBridge triggers next run on schedule — no self-invocation needed
    return { statusCode: rem > 0 ? 207 : 200, body: JSON.stringify({ task: "backfill-photos", duration: `${duration}s`, ...result, remaining: rem }) };
  }

  if (event.task === "purge-raw-data") {
    const result = await taskPurgeRawData(deadlineMs);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[purge-raw] Done in ${duration}s. Purged: ${result.purged}, Remaining: ${result.remaining}`);
    return { statusCode: result.remaining > 0 ? 207 : 200, body: JSON.stringify({ task: "purge-raw-data", duration: `${duration}s`, ...result }) };
  }

  if (event.task === "refresh-views") {
    const result = await taskRefreshViews();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[refresh-views] Done in ${duration}s`);
    return { statusCode: 200, body: JSON.stringify({ task: "refresh-views", duration: `${duration}s`, ...result }) };
  }

  if (event.task === "run-dq") {
    const result = await taskRunDq();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[run-dq] Done in ${duration}s. Rules: ${result.rules.length}, Inserted: ${result.totalInserted}`);
    return { statusCode: 200, body: JSON.stringify({ task: "run-dq", duration: `${duration}s`, ...result }) };
  }

  // ── ARMLS 12h compliance: mark orphaned listings as Withdrawn ──
  // Closes the compliance gap for listings ARMLS has removed from the active
  // feed but our mirror still shows as Active. Driven by last_synced_at age.
  if (event.task === "mark-stale-actives") {
    const staleHours = event.staleHours ?? 48;
    const result = await markStaleActives(staleHours);
    const stale12h = await countStaleActives(12);
    await emitMetric("ActivesStaleOver12h", stale12h);
    await emitMetric("ActivesMarkedWithdrawn", result.marked);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const summary = {
      task: "mark-stale-actives",
      duration: `${duration}s`,
      staleHours,
      marked: result.marked,
      activesStaleOver12h: stale12h,
    };
    console.log(`[mark-stale-actives] ${JSON.stringify(summary)}`);
    return { statusCode: 200, body: JSON.stringify(summary) };
  }

  // ── ARMLS 12h compliance: full Active+AUC re-fetch (Track 3) ──
  // Walks the entire active inventory, UPSERTs to bump last_synced_at on every
  // row even when ModificationTimestamp didn't move. Doesn't touch the delta
  // sync's checkpoint. Schedule rate(6h) keeps every active row < 6h stale.
  if (event.task === "refresh-actives") {
    await getAccessToken();
    // Default orderDirection: alternate ASC/DESC by hour to defeat Spark's
    // per-token response cache. Even hours = DESC, odd hours = ASC.
    const direction =
      event.orderDirection ??
      (new Date(startTime).getUTCHours() % 2 === 0 ? "desc" : "asc");
    const result = await refreshAllActives(deadlineMs, direction);
    const stale12h = await countStaleActives(12);
    const stale24h = await countStaleActives(24);

    await Promise.all([
      emitMetric("ActivesRefreshPagesProcessed", result.pagesProcessed),
      emitMetric("ActivesRefreshRecordsUpserted", result.recordsUpserted),
      emitMetric("ActivesStaleOver12h", stale12h),
      emitMetric("ActivesStaleOver24h", stale24h),
    ]);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const summary = {
      task: "refresh-actives",
      duration: `${duration}s`,
      pagesProcessed: result.pagesProcessed,
      recordsUpserted: result.recordsUpserted,
      completed: result.completed,
      activesStaleOver12h: stale12h,
      activesStaleOver24h: stale24h,
      error: result.error,
    };
    console.log(`[refresh-actives] ${JSON.stringify(summary)}`);

    return {
      statusCode: result.error ? 500 : 200,
      body: JSON.stringify(summary),
    };
  }

  // ── Active-only fast sync (Track 2) ──
  if (event.task === "sync-active") {
    await getAccessToken();
    const result = await syncActiveListings(deadlineMs);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[sync-active] Done in ${duration}s. Pages: ${result.pagesProcessed}, Records: ${result.recordsUpserted}, Completed: ${result.completed}`);

    // mv_active_listings was dropped in migration 028 — Yong's site reads
    // listing_records directly via @platform/spark + getMarketStats/getListingCounts.
    // No active-listing MV to refresh here. Use task=refresh-views for the
    // 9 analytics MVs (analytics_base + market_pulse + dashboard + …).

    return {
      statusCode: result.completed ? 200 : 207,
      body: JSON.stringify({
        task: "sync-active",
        duration: `${duration}s`,
        pages: result.pagesProcessed,
        records: result.recordsUpserted,
        completed: result.completed,
      }),
    };
  }

  // ── Default: ARMLS chronological sync (Track 1: backlog) ──
  await getAccessToken();

  const result = await syncProperty(deadlineMs);
  console.log(
    `[armls-sync] Property: ${result.pagesProcessed} pages, ${result.recordsUpserted} records, ` +
    `completed: ${result.completed}${result.error ? `, error: ${result.error}` : ""}`
  );

  // Fetch photos for NEW/MODIFIED active listings that were just upserted.
  // Only fetch for listings that don't already have photos (photos_fetched_at IS NULL).
  let inlinePhotoResult = { fetched: 0, photos: 0 };
  if (result.newListingKeys.length > 0 && Date.now() < deadlineMs - 120000) {
    // Filter to only listings that actually need photos (haven't been fetched yet)
    const needPhotos = await rdsQuery(
      `SELECT listing_key FROM listing_records
       WHERE listing_key = ANY($1::text[])
         AND photos_fetched_at IS NULL
         AND photos_count > 0
         AND is_deleted = FALSE`,
      [result.newListingKeys]
    );
    const keysNeedingPhotos = (needPhotos.rows as { listing_key: string }[]).map(r => r.listing_key);

    if (keysNeedingPhotos.length > 0) {
      console.log(`[armls-sync] Fetching photos for ${keysNeedingPhotos.length} new/modified listings...`);
      inlinePhotoResult = await fetchPhotosForNewListings(keysNeedingPhotos, deadlineMs);
      console.log(`[armls-sync] Inline photos: ${inlinePhotoResult.fetched} listings, ${inlinePhotoResult.photos} photos`);
    }
  }

  // If time remains, also process backlog (listings that were missed or failed previously)
  let backlogPhotoResult = { listingsProcessed: 0, photosInserted: 0, errors: 0 };
  if (Date.now() < deadlineMs - 120000) {
    backlogPhotoResult = await syncPhotoUrls(deadlineMs, 200);
    if (backlogPhotoResult.listingsProcessed > 0) {
      console.log(`[armls-sync] Backlog photos: ${backlogPhotoResult.listingsProcessed} listings, ${backlogPhotoResult.photosInserted} photos`);
    }
  }

  // Refresh analytics pipeline after successful sync
  let viewsRefreshed = false;
  if (!result.error && Date.now() < deadlineMs - 120000) {
    try {
      console.log('[armls-sync] Refreshing analytics pipeline...');
      const refreshStart = Date.now();
      const refreshResult = await rdsQuery('SELECT * FROM refresh_analytics_pipeline()');
      for (const row of refreshResult.rows) {
        console.log(`[armls-sync] ${row.step}: ${row.duration_ms}ms, ${row.row_count} rows`);
      }
      console.log(`[armls-sync] Analytics pipeline refreshed in ${((Date.now() - refreshStart) / 1000).toFixed(1)}s`);
      viewsRefreshed = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[armls-sync] Analytics refresh failed (non-fatal): ${msg}`);
    }
  } else if (result.error) {
    console.log('[armls-sync] Skipping analytics refresh due to sync error');
  } else {
    console.log('[armls-sync] Skipping analytics refresh — insufficient time remaining');
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[armls-sync] Done in ${duration}s`);

  return {
    statusCode: result.error ? 500 : result.completed ? 200 : 207,
    body: JSON.stringify({
      duration: `${duration}s`,
      property: { ...result, newListingKeys: undefined },
      inlinePhotos: inlinePhotoResult,
      backlogPhotos: backlogPhotoResult,
      viewsRefreshed,
    }),
  };
}
