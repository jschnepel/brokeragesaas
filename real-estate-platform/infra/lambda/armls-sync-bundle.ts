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
import { Pool } from "pg";
import type { PoolClient } from "pg";

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
let cachedTokens: { accessToken: string; refreshToken: string; oauthKey: string; oauthSecret: string } | null = null;

async function getTokens() {
  if (cachedTokens) return cachedTokens;

  const res = await smClient.send(
    new GetSecretValueCommand({ SecretId: "rlsir/armls/tokens" })
  );
  const secret = JSON.parse(res.SecretString!);
  cachedTokens = {
    accessToken: secret.access_token,
    refreshToken: secret.refresh_token,
    oauthKey: secret.client_id,
    oauthSecret: secret.client_secret,
  };
  return cachedTokens;
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
type EntityName = "Property" | "Member" | "Office" | "OpenHouse";

async function fetchPage(
  entity: EntityName,
  skipToken: string | null
): Promise<{ records: Record<string, unknown>[]; nextSkipToken: string | null }> {
  const tokens = await getTokens();
  const url = skipToken
    ? `${BASE_URL}/${entity}?$skiptoken=${skipToken}`
    : `${BASE_URL}/${entity}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      Accept: "application/json",
    },
  });

  if (res.status === 401) {
    // Clear cached tokens and re-read from Secrets Manager (the token-refresh Lambda may have updated them)
    cachedTokens = null;
    const freshTokens = await getTokens();
    const retryRes = await fetch(url, {
      headers: { Authorization: `Bearer ${freshTokens.accessToken}`, Accept: "application/json" },
    });
    if (!retryRes.ok) {
      const text = await retryRes.text();
      throw new Error(`Auth failed after SM re-read (${retryRes.status}): ${text.substring(0, 200)}`);
    }
    const retryData: ODataResponse = await retryRes.json();
    const retrySkipToken = retryData["@odata.nextLink"]
      ? extractSkipToken(retryData["@odata.nextLink"])
      : null;
    return { records: retryData.value ?? [], nextSkipToken: retrySkipToken };
  }

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

// Token refresh is handled EXCLUSIVELY by the token-refresh Lambda.
// This sync Lambda only reads tokens from Secrets Manager — never calls Spark's OAuth endpoint.

function extractSkipToken(nextLink: string): string | null {
  try {
    const url = new URL(nextLink);
    return url.searchParams.get("$skiptoken");
  } catch {
    const match = nextLink.match(/\$skiptoken=([^&]+)/);
    return match ? match[1] : null;
  }
}

// ─── Field Mapper (inline) ──────────────────────────────────

const PROPERTY_FIELD_MAP: Record<string, string> = {
  ListingKey: "listing_key", ListingId: "listing_id", StandardStatus: "standard_status",
  MlsStatus: "mls_status", UnparsedAddress: "unparsed_address", StreetNumber: "street_number",
  StreetDirPrefix: "street_dir_prefix", StreetName: "street_name", StreetSuffix: "street_suffix",
  UnitNumber: "unit_number", City: "city", StateOrProvince: "state_or_province",
  PostalCode: "postal_code", CountyOrParish: "county_or_parish", SubdivisionName: "subdivision_name",
  Latitude: "latitude", Longitude: "longitude", ListPrice: "list_price", ClosePrice: "close_price",
  PropertyType: "property_type", PropertySubType: "property_sub_type",
  BedroomsTotal: "bedrooms_total", BathroomsTotalInteger: "bathrooms_total_integer",
  BathroomsFull: "bathrooms_full", BathroomsHalf: "bathrooms_half",
  LivingArea: "living_area", LotSizeAcres: "lot_size_acres", LotSizeSquareFeet: "lot_size_square_feet",
  YearBuilt: "year_built", StoriesTotal: "stories_total",
  InteriorFeatures: "interior_features", ExteriorFeatures: "exterior_features",
  Appliances: "appliances", Cooling: "cooling", Heating: "heating", Flooring: "flooring",
  Fencing: "fencing", Roof: "roof", ConstructionMaterials: "construction_materials",
  PoolFeatures: "pool_features", ParkingFeatures: "parking_features",
  CommunityFeatures: "community_features", View: "view_features",
  ArchitecturalStyle: "architectural_style", FireplaceFeatures: "fireplace_features",
  LotFeatures: "lot_features", PatioAndPorchFeatures: "patio_and_porch_features",
  Sewer: "sewer", WaterSource: "water_source", SecurityFeatures: "security_features",
  SpaFeatures: "spa_features",
  PoolPrivateYN: "pool_private_yn", FireplaceYN: "fireplace_yn", AssociationYN: "association_yn",
  HorseYN: "horse_yn", AttachedGarageYN: "attached_garage_yn",
  CoolingYN: "cooling_yn", HeatingYN: "heating_yn",
  AssociationFee: "association_fee", AssociationFeeFrequency: "association_fee_frequency",
  AssociationFeeIncludes: "association_fee_includes", AssociationName: "association_name",
  GarageSpaces: "garage_spaces", CoveredSpaces: "covered_spaces",
  CarportSpaces: "carport_spaces", OpenParkingSpaces: "open_parking_spaces",
  ListAgentFullName: "list_agent_full_name", ListAgentFirstName: "list_agent_first_name",
  ListAgentLastName: "list_agent_last_name", ListAgentMlsId: "list_agent_mls_id",
  ListAgentKey: "list_agent_key", ListOfficeName: "list_office_name",
  ListOfficeMlsId: "list_office_mls_id", ListOfficeKey: "list_office_key",
  ListOfficePhone: "list_office_phone",
  PublicRemarks: "public_remarks", Directions: "directions", CrossStreet: "cross_street",
  ListingContractDate: "listing_contract_date", CloseDate: "close_date",
  OffMarketDate: "off_market_date", ModificationTimestamp: "modification_timestamp",
  OriginalEntryTimestamp: "original_entry_timestamp",
  PriceChangeTimestamp: "price_change_timestamp", StatusChangeTimestamp: "status_change_timestamp",
  PhotosChangeTimestamp: "photos_change_timestamp", PhotosCount: "photos_count",
  TaxAnnualAmount: "tax_annual_amount", TaxYear: "tax_year", ParcelNumber: "parcel_number",
  ElementarySchool: "elementary_school", ElementarySchoolDistrict: "elementary_school_district",
  HighSchoolDistrict: "high_school_district", MiddleOrJuniorSchool: "middle_or_junior_school",
  InternetEntireListingDisplayYN: "internet_entire_listing_display_yn",
  InternetAddressDisplayYN: "internet_address_display_yn",
  OriginatingSystemName: "originating_system_name",
  FireplacesTotal: "fireplaces_total",
};

const ARMLS_CUSTOM_MAP: Record<string, string> = {
  "Contact_sp_Info_co_List_sp_Agent_sp_Cell_sp_Phn2": "agent_cell_phone",
  "Price_sp_per_sp_Sq_sp_Ft": "price_per_sqft",
  "Planned_sp_Community_sp_Name": "planned_community_name",
};

const JSONB_COLS = new Set([
  "interior_features", "exterior_features", "appliances", "cooling", "heating",
  "flooring", "fencing", "roof", "construction_materials", "pool_features",
  "parking_features", "community_features", "view_features", "architectural_style",
  "fireplace_features", "lot_features", "patio_and_porch_features", "sewer",
  "water_source", "association_fee_includes", "security_features", "spa_features",
]);

const BOOL_COLS = new Set([
  "pool_private_yn", "fireplace_yn", "association_yn", "horse_yn",
  "attached_garage_yn", "cooling_yn", "heating_yn",
  "internet_entire_listing_display_yn", "internet_address_display_yn",
]);

const NUM_COLS = new Set([
  "list_price", "close_price", "living_area", "lot_size_acres",
  "lot_size_square_feet", "latitude", "longitude", "association_fee",
  "garage_spaces", "covered_spaces", "carport_spaces", "open_parking_spaces",
  "tax_annual_amount", "price_per_sqft",
]);

const INT_COLS = new Set([
  "bedrooms_total", "bathrooms_total_integer", "bathrooms_full", "bathrooms_half",
  "year_built", "stories_total", "photos_count", "tax_year", "fireplaces_total",
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
  if (cols.listing_contract_date && cols.standard_status === "Active") {
    const diffMs = Date.now() - new Date(cols.listing_contract_date as string).getTime();
    cols.days_on_market = Math.max(0, Math.floor(diffMs / 86400000));
  }

  cols.raw_data = JSON.stringify(raw);
  cols.last_synced_at = new Date().toISOString();
  return cols;
}

// ─── Sync Engine ────────────────────────────────────────────

const CHECKPOINT_INTERVAL = 100;

async function upsertPage(records: Record<string, unknown>[]): Promise<number> {
  if (records.length === 0) return 0;
  const client = await getRdsClient();
  let count = 0;
  try {
    for (const raw of records) {
      const mapped = mapRecord(raw);
      if (!mapped) continue;
      try {
        await client.query("BEGIN");
        const columns = Object.keys(mapped);
        const values = Object.values(mapped);
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
        await client.query("COMMIT");
        count++;
      } catch (err) {
        await client.query("ROLLBACK");
        const msg = err instanceof Error ? err.message : String(err);
        if (count === 0) console.warn(`Upsert error: ${msg.substring(0, 100)}`);
      }
    }
  } finally {
    client.release();
  }
  return count;
}

async function syncProperty(deadlineMs: number): Promise<SyncResult> {
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
        console.log(`[sync] Checkpoint: page ${pagesProcessed}, ${recordsUpserted} records, skiptoken ${lastValidSkipToken?.substring(0, 20)}...`);
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
    return { entity: "Property", pagesProcessed, recordsUpserted, completed: false, error: errorMsg, lastSkipToken: lastValidSkipToken };
  }

  return { entity: "Property", pagesProcessed, recordsUpserted, completed, lastSkipToken: lastValidSkipToken };
}

// ─── Photo URL Sync ─────────────────────────────────────────

async function syncPhotoUrls(deadlineMs: number): Promise<{ listingsProcessed: number; photosInserted: number }> {
  const result = await rdsQuery(
    `SELECT listing_key, photos_count FROM listing_records
     WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE
       AND photos_count > 0 AND photos_fetched_at IS NULL
     ORDER BY list_price DESC NULLS LAST LIMIT 50`
  );

  let listingsProcessed = 0;
  let photosInserted = 0;
  const tokens = await getTokens();

  for (const row of result.rows) {
    if (Date.now() >= deadlineMs - 60000) break;

    try {
      const url = `${BASE_URL}/Property('${row.listing_key}')/Media`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${tokens.accessToken}`, Accept: "application/json" },
      });
      if (!res.ok) continue;

      const data: ODataResponse = await res.json();
      const photos = data.value ?? [];

      if (photos.length > 0) {
        const client = await getRdsClient();
        try {
          await client.query("BEGIN");
          for (const photo of photos) {
            await client.query(
              `INSERT INTO listing_photos (listing_key, media_key, media_url, "order", short_description, is_preferred, raw_data)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (listing_key, media_key) DO UPDATE SET
                 media_url = EXCLUDED.media_url, "order" = EXCLUDED."order",
                 short_description = EXCLUDED.short_description, is_preferred = EXCLUDED.is_preferred`,
              [
                row.listing_key, String(photo.MediaKey ?? ""), String(photo.MediaURL ?? ""),
                typeof photo.Order === "number" ? photo.Order : 0,
                photo.ShortDescription ? String(photo.ShortDescription) : null,
                photo.PreferredPhotoYN === true || photo.PreferredPhotoYN === "true",
                JSON.stringify(photo),
              ]
            );
          }
          await client.query(`UPDATE listing_records SET photos_fetched_at = NOW() WHERE listing_key = $1`, [row.listing_key]);
          await client.query("COMMIT");
          photosInserted += photos.length;
        } catch {
          await client.query("ROLLBACK");
        } finally {
          client.release();
        }
      } else {
        await rdsQuery(`UPDATE listing_records SET photos_fetched_at = NOW() WHERE listing_key = $1`, [row.listing_key]);
      }
      listingsProcessed++;
    } catch {
      // Skip this listing, continue
    }
  }

  return { listingsProcessed, photosInserted };
}

// ─── Lambda Handler ─────────────────────────────────────────

export async function handler(_event: unknown, context: LambdaContext) {
  const startTime = Date.now();
  const deadlineMs = startTime + context.getRemainingTimeInMillis();

  console.log(`[armls-sync] Starting. Time budget: ${context.getRemainingTimeInMillis()}ms`);

  // Check if last sync failed on auth — if so, skip to avoid hammering Spark
  try {
    const stateCheck = await rdsQuery(
      `SELECT last_sync_error, last_sync_completed FROM listing_sync_state WHERE entity_name = $1`,
      ["Property"]
    );
    const lastError = stateCheck.rows[0]?.last_sync_error;
    if (lastError && (lastError.includes("Auth failed") || lastError.includes("invalid_grant") || lastError.includes("403"))) {
      const lastCompleted = stateCheck.rows[0]?.last_sync_completed;
      console.log(`[armls-sync] Skipping — last sync failed on auth: ${lastError}. Waiting for token refresh Lambda to fix tokens. Last success: ${lastCompleted}`);
      return { statusCode: 200, body: "Skipped — auth error backoff. Waiting for valid tokens." };
    }
  } catch (err) {
    console.warn(`[armls-sync] Could not check sync state, proceeding anyway:`, err instanceof Error ? err.message : err);
  }

  // Ensure tokens are loaded (read-only from Secrets Manager)
  await getTokens();

  // Sync Property entity (the big one)
  const result = await syncProperty(deadlineMs);
  console.log(
    `[armls-sync] Property: ${result.pagesProcessed} pages, ${result.recordsUpserted} records, ` +
    `completed: ${result.completed}${result.error ? `, error: ${result.error}` : ""}`
  );

  // If time permits, sync photo URLs
  let photoResult = { listingsProcessed: 0, photosInserted: 0 };
  if (Date.now() < deadlineMs - 120000) {
    photoResult = await syncPhotoUrls(deadlineMs);
    console.log(`[armls-sync] Photos: ${photoResult.listingsProcessed} listings, ${photoResult.photosInserted} photos`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[armls-sync] Done in ${duration}s`);

  return {
    statusCode: result.error ? 500 : result.completed ? 200 : 207,
    body: JSON.stringify({
      duration: `${duration}s`,
      property: result,
      photos: photoResult,
    }),
  };
}
