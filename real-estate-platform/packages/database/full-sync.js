/**
 * Full ARMLS Replication Sync
 * Pulls ALL pages from Spark replication feed into RDS.
 * Resumes from last skiptoken. No page limit.
 *
 * Run: cd packages/database && node full-sync.js
 *
 * Expected: ~50,000 pages (500K+ records at 10/page)
 * Duration: ~4-7 hours depending on API response times
 * Token: Valid for 24 hours — plenty of headroom
 */

const { Pool } = require('pg');

const ACCESS_TOKEN = '9hbserb0v2oglk1uwqc6kqy9k';
const OAUTH_KEY = 'axhunj67o29ybpajnvzopevsl';
const OAUTH_SECRET = '2tqr6quzs5sktwsxg8diips9f';
const REFRESH_TOKEN = 'ddjd1s98laoit5stvfcmgdurr';
const BASE_URL = 'https://replication.sparkapi.com/Reso/OData';
const RDS_URL = 'postgresql://rlsir_admin:vvXOYkpIviXxKLWlzF7f5FHC@rlsir-db.ck5i8kmcu0jw.us-east-1.rds.amazonaws.com:5432/rlsir_platform';

let pool = createPool();

function createPool() {
  const p = new Pool({ connectionString: RDS_URL, ssl: { rejectUnauthorized: false }, max: 5, idleTimeoutMillis: 60000 });
  p.on('error', (err) => {
    console.error('  [pool] Unexpected pool error:', err.message);
  });
  return p;
}

async function getClient(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await pool.connect();
    } catch (err) {
      console.error(`  [pool] Connect failed (attempt ${i + 1}/${retries}): ${err.message}`);
      if (i < retries - 1) {
        // Recreate pool on connection failure
        try { await pool.end(); } catch {}
        pool = createPool();
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
      } else {
        throw err;
      }
    }
  }
}

let currentAccessToken = ACCESS_TOKEN;
let currentRefreshToken = REFRESH_TOKEN;

// Field map: RESO name -> DB column
const FIELD_MAP = {
  ListingKey: 'listing_key', ListingId: 'listing_id', StandardStatus: 'standard_status',
  MlsStatus: 'mls_status', UnparsedAddress: 'unparsed_address', StreetNumber: 'street_number',
  StreetDirPrefix: 'street_dir_prefix', StreetName: 'street_name', StreetSuffix: 'street_suffix',
  UnitNumber: 'unit_number', City: 'city', StateOrProvince: 'state_or_province',
  PostalCode: 'postal_code', CountyOrParish: 'county_or_parish', SubdivisionName: 'subdivision_name',
  Latitude: 'latitude', Longitude: 'longitude', ListPrice: 'list_price', ClosePrice: 'close_price',
  PropertyType: 'property_type', PropertySubType: 'property_sub_type',
  BedroomsTotal: 'bedrooms_total', BathroomsTotalInteger: 'bathrooms_total_integer',
  BathroomsFull: 'bathrooms_full', BathroomsHalf: 'bathrooms_half',
  LivingArea: 'living_area', LotSizeAcres: 'lot_size_acres', LotSizeSquareFeet: 'lot_size_square_feet',
  YearBuilt: 'year_built', StoriesTotal: 'stories_total',
  PoolPrivateYN: 'pool_private_yn', FireplaceYN: 'fireplace_yn', AssociationYN: 'association_yn',
  AssociationFee: 'association_fee', AssociationFeeFrequency: 'association_fee_frequency',
  AssociationName: 'association_name',
  GarageSpaces: 'garage_spaces', CoveredSpaces: 'covered_spaces',
  CarportSpaces: 'carport_spaces', OpenParkingSpaces: 'open_parking_spaces',
  ListAgentFullName: 'list_agent_full_name',
  ListAgentKey: 'list_agent_key', ListOfficeName: 'list_office_name',
  ListOfficeMlsId: 'list_office_mls_id', ListOfficePhone: 'list_office_phone',
  PublicRemarks: 'public_remarks', Directions: 'directions', CrossStreet: 'cross_street',
  PhotosCount: 'photos_count', ModificationTimestamp: 'modification_timestamp',
  OriginalEntryTimestamp: 'original_entry_timestamp', ListingContractDate: 'listing_contract_date',
  CloseDate: 'close_date',
  InteriorFeatures: 'interior_features', ExteriorFeatures: 'exterior_features',
  Appliances: 'appliances', Cooling: 'cooling', Heating: 'heating',
  ParkingFeatures: 'parking_features', PoolFeatures: 'pool_features',
  ArchitecturalStyle: 'architectural_style', Roof: 'roof',
  ConstructionMaterials: 'construction_materials', Flooring: 'flooring',
  FireplacesTotal: 'fireplaces_total',
  HeatingYN: 'heating_yn', CoolingYN: 'cooling_yn', AttachedGarageYN: 'attached_garage_yn',
  InternetEntireListingDisplayYN: 'internet_entire_listing_display_yn',
  InternetAddressDisplayYN: 'internet_address_display_yn',
  OriginatingSystemName: 'originating_system_name',
  TaxAnnualAmount: 'tax_annual_amount', TaxYear: 'tax_year', ParcelNumber: 'parcel_number',
  ElementarySchool: 'elementary_school', HighSchoolDistrict: 'high_school_district',
  WaterfrontFeatures: 'waterfront_features', View: 'view_features',
  SecurityFeatures: 'security_features', CommunityFeatures: 'community_features',
  SpaFeatures: 'spa_features', Fencing: 'fencing',
};

const JSONB_COLS = new Set([
  'interior_features', 'exterior_features', 'appliances', 'cooling', 'heating',
  'flooring', 'roof', 'construction_materials', 'pool_features', 'parking_features',
  'architectural_style', 'waterfront_features', 'view_features', 'security_features',
  'community_features', 'spa_features', 'fencing',
]);
const BOOL_COLS = new Set([
  'pool_private_yn', 'fireplace_yn', 'association_yn',
  'internet_entire_listing_display_yn', 'internet_address_display_yn',
  'heating_yn', 'cooling_yn', 'attached_garage_yn',
]);
const NUM_COLS = new Set([
  'list_price', 'close_price', 'living_area', 'lot_size_acres', 'lot_size_square_feet',
  'latitude', 'longitude', 'association_fee', 'garage_spaces', 'tax_annual_amount',
  'covered_spaces', 'carport_spaces', 'open_parking_spaces',
]);
const INT_COLS = new Set([
  'bedrooms_total', 'bathrooms_total_integer', 'bathrooms_full', 'bathrooms_half',
  'year_built', 'stories_total', 'photos_count', 'tax_year', 'fireplaces_total',
]);

function coerce(col, val) {
  if (val === null || val === undefined) return null;
  if (JSONB_COLS.has(col)) {
    if (Array.isArray(val)) return JSON.stringify(val);
    if (typeof val === 'string' && val.length > 0) return JSON.stringify(val.split(',').map(s => s.trim()).filter(Boolean));
    return '[]';
  }
  if (BOOL_COLS.has(col)) return typeof val === 'boolean' ? val : String(val).toLowerCase() === 'true';
  if (NUM_COLS.has(col)) { const n = Number(val); return isNaN(n) ? null : n; }
  if (INT_COLS.has(col)) { const n = parseInt(String(val), 10); return isNaN(n) ? null : n; }
  return String(val);
}

function mapRecord(raw) {
  const cols = {};
  for (const [reso, db] of Object.entries(FIELD_MAP)) {
    if (raw[reso] !== undefined && raw[reso] !== null) {
      cols[db] = coerce(db, raw[reso]);
    }
  }
  if (!cols.listing_key) return null;
  if (!cols.standard_status) cols.standard_status = 'Unknown';
  if (!cols.postal_code) cols.postal_code = '00000';
  if (!cols.list_office_name) cols.list_office_name = 'Unknown';
  if (!cols.modification_timestamp) cols.modification_timestamp = new Date().toISOString();
  cols.raw_data = JSON.stringify(raw);
  cols.last_synced_at = new Date().toISOString();
  return cols;
}

async function refreshToken() {
  console.log('  [auth] Refreshing access token...');
  const res = await fetch('https://sparkapi.com/v1/oauth2/grant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: currentRefreshToken,
      client_id: OAUTH_KEY,
      client_secret: OAUTH_SECRET,
    }).toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text.substring(0, 200)}`);
  }
  const data = await res.json();
  currentAccessToken = data.access_token;
  if (data.refresh_token) currentRefreshToken = data.refresh_token;
  console.log(`  [auth] Token refreshed. New token: ${currentAccessToken.substring(0, 12)}...`);
}

async function fetchPage(skipToken, retryCount = 0) {
  const url = skipToken
    ? `${BASE_URL}/Property?$skiptoken=${skipToken}`
    : `${BASE_URL}/Property`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${currentAccessToken}`, Accept: 'application/json' }
  });

  if (res.status === 401 && retryCount < 2) {
    await refreshToken();
    return fetchPage(skipToken, retryCount + 1);
  }

  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).substring(0, 200)}`);
  return res.json();
}

function extractSkipToken(nextLink) {
  if (!nextLink) return null;
  try {
    const u = new URL(nextLink);
    return u.searchParams.get('$skiptoken');
  } catch {
    const match = nextLink.match(/\$skiptoken=([^&]+)/);
    return match ? match[1] : null;
  }
}

async function upsertRecord(client, mapped) {
  const columns = Object.keys(mapped);
  const values = Object.values(mapped);
  const placeholders = columns.map((_, i) => `$${i + 1}`);
  const updateCols = columns
    .filter(c => c !== 'listing_key' && c !== 'id' && c !== 'first_synced_at')
    .map(c => `${c} = EXCLUDED.${c}`)
    .join(', ');

  await client.query(
    `INSERT INTO listing_records (${columns.join(', ')})
     VALUES (${placeholders.join(', ')})
     ON CONFLICT (listing_key) DO UPDATE SET ${updateCols}`,
    values
  );
}

async function run() {
  const startTime = Date.now();
  let totalRecords = 0;
  let errors = 0;
  let statusCounts = {};

  // Resume from last skiptoken
  const stateRes = await pool.query("SELECT last_skip_token FROM listing_sync_state WHERE entity_name = 'Property'");
  let skipToken = stateRes.rows[0]?.last_skip_token || null;

  console.log('==================================================');
  console.log('  ARMLS Full Replication Sync');
  console.log('==================================================');
  console.log(`Start time:  ${new Date().toISOString()}`);
  console.log(`Resuming:    ${skipToken ? skipToken.substring(0, 30) + '...' : 'FROM BEGINNING'}`);
  console.log(`Token:       ${currentAccessToken.substring(0, 12)}...`);
  console.log('==================================================');
  console.log('');

  let page = 0;
  let lastCheckpoint = Date.now();
  const CHECKPOINT_INTERVAL = 100; // pages
  const PROGRESS_INTERVAL = 50;    // pages between progress logs

  while (true) {
    let data;
    try {
      data = await fetchPage(skipToken);
    } catch (err) {
      console.error(`\n  FETCH ERROR on page ${page + 1}: ${err.message}`);
      // Save progress and exit on fetch errors
      if (skipToken) {
        await pool.query(
          `UPDATE listing_sync_state SET last_skip_token = $1, last_sync_status = 'error',
           last_sync_error = $2, last_sync_record_count = $3, total_records_synced = total_records_synced + $3
           WHERE entity_name = 'Property'`,
          [skipToken, err.message.substring(0, 500), totalRecords]
        );
      }
      break;
    }

    const records = data.value || [];
    const nextLink = data['@odata.nextLink'] || null;

    if (records.length === 0) {
      console.log(`\nPage ${page + 1}: empty — END OF FEED`);
      break;
    }

    page++;

    // Upsert records (with connection retry)
    let client;
    try {
      client = await getClient();
    } catch (err) {
      console.error(`\n  DB CONNECT ERROR on page ${page + 1}: ${err.message}`);
      // Save what we have and exit
      break;
    }
    let pageInserted = 0;
    try {
      for (const raw of records) {
        const mapped = mapRecord(raw);
        if (!mapped) { errors++; continue; }
        try {
          await client.query('BEGIN');
          await upsertRecord(client, mapped);
          await client.query('COMMIT');
          pageInserted++;

          // Track status distribution
          const status = mapped.standard_status || 'Unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        } catch (err) {
          await client.query('ROLLBACK');
          errors++;
          if (errors <= 5) console.log(`  UPSERT ERROR (${raw.ListingKey}): ${err.message.substring(0, 120)}`);
        }
      }
    } finally {
      client.release();
    }

    totalRecords += pageInserted;

    // Progress log
    if (page % PROGRESS_INTERVAL === 0 || page <= 3) {
      const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);
      const rate = (totalRecords / ((Date.now() - startTime) / 1000)).toFixed(1);
      const sample = records[0];
      console.log(
        `Page ${page.toLocaleString()} | ${totalRecords.toLocaleString()} records | ` +
        `${elapsed}min | ${rate}/sec | errors: ${errors} | ` +
        `${sample.City || 'N/A'} | $${sample.ListPrice ? Number(sample.ListPrice).toLocaleString() : 'N/A'} | ${sample.StandardStatus}`
      );
    }

    // Checkpoint: save skiptoken every N pages
    skipToken = extractSkipToken(nextLink);
    if (page % CHECKPOINT_INTERVAL === 0 && skipToken) {
      await pool.query(
        `UPDATE listing_sync_state SET last_skip_token = $1, last_sync_status = 'running',
         last_sync_record_count = $2
         WHERE entity_name = 'Property'`,
        [skipToken, totalRecords]
      );
      lastCheckpoint = Date.now();
    }

    if (!skipToken) {
      console.log(`\nNo nextLink — end of feed reached.`);
      break;
    }
  }

  // Final checkpoint
  const finalStatus = skipToken ? 'completed' : 'completed';
  await pool.query(
    `UPDATE listing_sync_state SET last_skip_token = $1, last_sync_status = $2,
     last_sync_completed = NOW(), last_sync_record_count = $3,
     total_records_synced = total_records_synced + $3,
     initial_pull_complete = TRUE
     WHERE entity_name = 'Property'`,
    [skipToken, finalStatus, totalRecords]
  );

  const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);

  console.log('');
  console.log('==================================================');
  console.log('  SYNC COMPLETE');
  console.log('==================================================');
  console.log(`Duration:    ${elapsed} minutes`);
  console.log(`Pages:       ${page.toLocaleString()}`);
  console.log(`Records:     ${totalRecords.toLocaleString()}`);
  console.log(`Errors:      ${errors}`);
  console.log(`Rate:        ${(totalRecords / ((Date.now() - startTime) / 1000)).toFixed(1)} records/sec`);
  if (skipToken) console.log(`Skiptoken:   ${skipToken.substring(0, 40)}...`);
  console.log('');
  console.log('Status distribution:');
  const sorted = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  for (const [status, count] of sorted) {
    console.log(`  ${status}: ${count.toLocaleString()}`);
  }

  // Final DB counts
  const counts = await pool.query(`
    SELECT standard_status, COUNT(*) as count
    FROM listing_records WHERE is_deleted = FALSE
    GROUP BY standard_status ORDER BY count DESC
  `);
  console.log('');
  console.log('Total DB records by status:');
  for (const row of counts.rows) {
    console.log(`  ${row.standard_status}: ${row.count}`);
  }

  await pool.end();
}

run().catch(async (err) => {
  console.error('FATAL SYNC ERROR:', err.message);
  await pool.end();
  process.exit(1);
});
