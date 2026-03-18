/**
 * Photo Backfill Script — Lean Version
 *
 * Fetches photo URLs from ARMLS Spark API and stores them as a JSONB array
 * on listing_records.photo_urls. Format: [{url, desc}, ...]
 * No separate listing_photos table needed.
 *
 * Usage: RDS_DATABASE_URL=... SPARK_TOKEN=... node backfill-photos.js [--all]
 *
 * Default: Yong's service area (Scottsdale, PV, Cave Creek, Carefree) Residential
 * --all:   All active listings statewide
 */

const { Pool } = require('pg');

const SPARK_BASE = 'https://replication.sparkapi.com/Reso/OData';
const CONCURRENCY = 5; // parallel API calls
const BATCH_SIZE = 100; // listings per DB query batch

const SERVICE_AREA_CITIES = ['Scottsdale', 'Paradise Valley', 'Cave Creek', 'Carefree'];

async function main() {
  const allMode = process.argv.includes('--all');
  const token = process.env.SPARK_TOKEN;
  if (!token) {
    console.error('SPARK_TOKEN env var required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.RDS_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: CONCURRENCY + 1,
  });

  // Count total work
  const cityFilter = allMode ? '' : `AND city = ANY($1::text[])`;
  const countParams = allMode ? [] : [SERVICE_AREA_CITIES];
  const statusFilter = `AND standard_status IN ('Active', 'Active Under Contract', 'Coming Soon')`;

  const countResult = await pool.query(
    `SELECT count(*) as cnt FROM listing_records
     WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE
       ${statusFilter}
       AND property_type != 'Residential Lease'
       AND photos_count > 0 AND photos_fetched_at IS NULL
       ${cityFilter}`,
    countParams
  );
  const totalNeeded = parseInt(countResult.rows[0].cnt, 10);
  console.log(`[backfill] ${allMode ? 'All active' : 'Service area'} listings needing photos: ${totalNeeded}`);

  if (totalNeeded === 0) {
    console.log('[backfill] Nothing to do.');
    await pool.end();
    return;
  }

  let processed = 0;
  let photosInserted = 0;
  let errors = 0;
  const startTime = Date.now();

  while (true) {
    // Fetch next batch of listings needing photos
    const paramIdx = allMode ? 1 : 2;
    const batch = await pool.query(
      `SELECT listing_key, photos_count FROM listing_records
       WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE
         ${statusFilter}
         AND property_type != 'Residential Lease'
         AND photos_count > 0 AND photos_fetched_at IS NULL
         ${cityFilter}
       ORDER BY list_price DESC NULLS LAST
       LIMIT $${paramIdx}`,
      allMode ? [BATCH_SIZE] : [SERVICE_AREA_CITIES, BATCH_SIZE]
    );

    if (batch.rows.length === 0) break;

    // Process in parallel chunks
    for (let i = 0; i < batch.rows.length; i += CONCURRENCY) {
      const chunk = batch.rows.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        chunk.map(row => fetchAndStorePhotoUrls(pool, token, row.listing_key))
      );

      for (const r of results) {
        processed++;
        if (r.status === 'fulfilled') {
          photosInserted += r.value;
        } else {
          errors++;
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = (processed / (Date.now() - startTime) * 1000).toFixed(1);
      const pct = ((processed / totalNeeded) * 100).toFixed(1);
      process.stdout.write(
        `\r[backfill] ${processed}/${totalNeeded} (${pct}%) | ${photosInserted} photos | ${errors} errors | ${rate}/s | ${elapsed}s`
      );
    }
  }

  console.log('\n[backfill] Done.');
  console.log(`  Listings processed: ${processed}`);
  console.log(`  Photos stored: ${photosInserted}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  await pool.end();
}

async function fetchAndStorePhotoUrls(pool, token, listingKey) {
  const url = `${SPARK_BASE}/Property('${listingKey}')/Media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  if (!res.ok) {
    await pool.query(
      `UPDATE listing_records SET photos_fetched_at = NOW() WHERE listing_key = $1`,
      [listingKey]
    );
    throw new Error(`API ${res.status} for ${listingKey}`);
  }

  const data = await res.json();
  const photos = data.value ?? [];

  // Sort: preferred first, then by order
  photos.sort((a, b) => {
    const aPref = a.PreferredPhotoYN === true || a.PreferredPhotoYN === 'true' ? 0 : 1;
    const bPref = b.PreferredPhotoYN === true || b.PreferredPhotoYN === 'true' ? 0 : 1;
    if (aPref !== bPref) return aPref - bPref;
    return (typeof a.Order === 'number' ? a.Order : 999) - (typeof b.Order === 'number' ? b.Order : 999);
  });

  // Build compact array: [{url, desc}, ...]
  const photoUrls = photos.map(p => ({
    url: String(p.MediaURL ?? ''),
    desc: p.ShortDescription ? String(p.ShortDescription) : null,
  }));

  // Single UPDATE — no listing_photos table
  await pool.query(
    `UPDATE listing_records SET photo_urls = $1, photos_fetched_at = NOW() WHERE listing_key = $2`,
    [JSON.stringify(photoUrls), listingKey]
  );

  return photoUrls.length;
}

main().catch(err => {
  console.error('\n[backfill] Fatal error:', err.message);
  process.exit(1);
});
