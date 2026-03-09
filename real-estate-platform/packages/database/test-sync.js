/**
 * Test sync script — pulls pages from Spark and inserts into RDS.
 * Run: cd packages/database && node test-sync.js
 */

const { Pool } = require('pg');

const ACCESS_TOKEN = 'ewsltss0h3vw23qb05bnd96ap';
const BASE_URL = 'https://replication.sparkapi.com/Reso/OData';
const RDS_URL = 'postgresql://rlsir_admin:vvXOYkpIviXxKLWlzF7f5FHC@rlsir-db.ck5i8kmcu0jw.us-east-1.rds.amazonaws.com:5432/rlsir_platform';

const pool = new Pool({ connectionString: RDS_URL, ssl: { rejectUnauthorized: false } });

// Field map: RESO name → DB column
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
  GarageSpaces: 'garage_spaces', ListAgentFullName: 'list_agent_full_name',
  ListAgentKey: 'list_agent_key', ListOfficeName: 'list_office_name',
  ListOfficeMlsId: 'list_office_mls_id', PublicRemarks: 'public_remarks',
  PhotosCount: 'photos_count', ModificationTimestamp: 'modification_timestamp',
  OriginalEntryTimestamp: 'original_entry_timestamp', ListingContractDate: 'listing_contract_date',
  InteriorFeatures: 'interior_features', ExteriorFeatures: 'exterior_features',
  Appliances: 'appliances', Cooling: 'cooling', Heating: 'heating',
  ParkingFeatures: 'parking_features', PoolFeatures: 'pool_features',
  ArchitecturalStyle: 'architectural_style', Roof: 'roof',
  ConstructionMaterials: 'construction_materials', Flooring: 'flooring',
  InternetEntireListingDisplayYN: 'internet_entire_listing_display_yn',
  InternetAddressDisplayYN: 'internet_address_display_yn',
  OriginatingSystemName: 'originating_system_name',
  TaxAnnualAmount: 'tax_annual_amount', TaxYear: 'tax_year', ParcelNumber: 'parcel_number',
};

const JSONB_COLS = new Set([
  'interior_features', 'exterior_features', 'appliances', 'cooling', 'heating',
  'flooring', 'roof', 'construction_materials', 'pool_features', 'parking_features',
  'architectural_style',
]);
const BOOL_COLS = new Set([
  'pool_private_yn', 'fireplace_yn', 'association_yn',
  'internet_entire_listing_display_yn', 'internet_address_display_yn',
]);
const NUM_COLS = new Set([
  'list_price', 'close_price', 'living_area', 'lot_size_acres', 'lot_size_square_feet',
  'latitude', 'longitude', 'association_fee', 'garage_spaces', 'tax_annual_amount',
]);
const INT_COLS = new Set([
  'bedrooms_total', 'bathrooms_total_integer', 'bathrooms_full', 'bathrooms_half',
  'year_built', 'stories_total', 'photos_count', 'tax_year',
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
  // Ensure required fields have defaults
  if (!cols.listing_key) return null;
  if (!cols.standard_status) cols.standard_status = 'Unknown';
  if (!cols.postal_code) cols.postal_code = '00000';
  if (!cols.list_office_name) cols.list_office_name = 'Unknown';
  if (!cols.modification_timestamp) cols.modification_timestamp = new Date().toISOString();

  cols.raw_data = JSON.stringify(raw);
  cols.last_synced_at = new Date().toISOString();
  return cols;
}

async function fetchPage(skipToken) {
  const url = skipToken
    ? `${BASE_URL}/Property?$skiptoken=${skipToken}`
    : `${BASE_URL}/Property`;
  console.log(`  Fetching: ${url.substring(0, 80)}...`);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, Accept: 'application/json' }
  });
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
  const PAGES_TO_PULL = 500;
  let totalRecords = 0;
  let errors = 0;

  // Resume from last skiptoken
  const stateRes = await pool.query("SELECT last_skip_token FROM listing_sync_state WHERE entity_name = 'Property'");
  let skipToken = stateRes.rows[0]?.last_skip_token || null;

  console.log(`=== ARMLS Sync ===`);
  console.log(`Pulling up to ${PAGES_TO_PULL} pages (${PAGES_TO_PULL * 10} records)...`);
  console.log(`Resuming from skiptoken: ${skipToken ? skipToken.substring(0, 20) + '...' : 'beginning'}`);
  console.log('');

  for (let page = 1; page <= PAGES_TO_PULL; page++) {
    const data = await fetchPage(skipToken);
    const records = data.value || [];
    const nextLink = data['@odata.nextLink'] || null;

    if (records.length === 0) {
      console.log(`Page ${page}: empty — end of feed`);
      break;
    }

    // Upsert one record at a time to avoid type mismatch across batch
    const client = await pool.connect();
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
        } catch (err) {
          await client.query('ROLLBACK');
          errors++;
          if (errors <= 3) console.log(`  UPSERT ERROR (${raw.ListingKey}): ${err.message.substring(0, 100)}`);
        }
      }
    } finally {
      client.release();
    }

    totalRecords += pageInserted;
    if (page % 50 === 0 || page <= 2) {
      const sample = records[0];
      console.log(`Page ${page}: ${totalRecords} total | ${sample.City || 'N/A'} | $${sample.ListPrice || 'N/A'} | ${sample.StandardStatus} | errors: ${errors}`);
    }

    skipToken = extractSkipToken(nextLink);
    if (!skipToken) {
      console.log(`  No nextLink — ${nextLink === null ? 'end of feed or single page' : nextLink}`);
      break;
    }
  }

  // Save progress
  if (skipToken) {
    await pool.query(
      `UPDATE listing_sync_state SET last_skip_token = $1, last_sync_status = 'completed',
       last_sync_completed = NOW(), last_sync_record_count = $2, total_records_synced = $2
       WHERE entity_name = 'Property'`,
      [skipToken, totalRecords]
    );
  }

  console.log('');
  console.log(`=== Results ===`);
  console.log(`Records inserted: ${totalRecords}`);
  console.log(`Errors: ${errors}`);
  if (skipToken) console.log(`Skiptoken saved: ${skipToken.substring(0, 40)}...`);

  // Verify
  const counts = await pool.query(`
    SELECT standard_status, COUNT(*) as count
    FROM listing_records WHERE is_deleted = FALSE
    GROUP BY standard_status ORDER BY count DESC
  `);
  console.log('');
  console.log('Records by status:');
  for (const row of counts.rows) {
    console.log(`  ${row.standard_status}: ${row.count}`);
  }

  const sample = await pool.query(`
    SELECT listing_key, listing_id, unparsed_address, city, list_price,
           bedrooms_total, bathrooms_total_integer, living_area, standard_status,
           list_office_name, photos_count
    FROM listing_records
    WHERE list_price IS NOT NULL
    ORDER BY list_price DESC LIMIT 5
  `);
  console.log('');
  console.log('Top 5 by price:');
  for (const r of sample.rows) {
    const price = r.list_price ? `$${Number(r.list_price).toLocaleString()}` : 'N/A';
    const sqft = r.living_area ? `${Number(r.living_area).toLocaleString()}sqft` : 'N/A';
    console.log(`  ${price} | ${r.bedrooms_total || '?'}bd/${r.bathrooms_total_integer || '?'}ba | ${sqft} | ${r.city} | ${r.standard_status} | ${r.list_office_name}`);
  }

  await pool.end();
}

run().catch(async (err) => {
  console.error('SYNC ERROR:', err.message);
  await pool.end();
  process.exit(1);
});
