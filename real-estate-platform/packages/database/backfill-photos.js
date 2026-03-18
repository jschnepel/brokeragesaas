/**
 * Photo Backfill Script — Full Pagination + Retry
 *
 * Fetches ALL photos from ARMLS Spark RESO API with pagination (follows @odata.nextLink).
 * Stores as JSONB array on listing_records.photo_urls [{url, desc}, ...]
 * Failed listings are NOT marked as fetched — they'll be retried on next run.
 * Errors logged to backfill-errors.log for investigation.
 *
 * Usage: RDS_DATABASE_URL=... SPARK_TOKEN=... node backfill-photos.js [--all] [--retry]
 *
 * Default: Yong's service area (Scottsdale, PV, Cave Creek, Carefree) Residential
 * --all:   All active listings statewide
 * --retry: Only retry previously failed listings (photos_count > 0, fetched, but photo_urls empty)
 */

const { Pool } = require('pg');
const fs = require('fs');

const SPARK_BASE = 'https://replication.sparkapi.com/Reso/OData';
const CONCURRENCY = 5;
const BATCH_SIZE = 100;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

const SERVICE_AREA_CITIES = ['Scottsdale', 'Paradise Valley', 'Cave Creek', 'Carefree'];
const ERROR_LOG = __dirname + '/backfill-errors.log';

function log(msg) {
  process.stdout.write(msg);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const allMode = process.argv.includes('--all');
  const retryMode = process.argv.includes('--retry');
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

  // Clear error log
  fs.writeFileSync(ERROR_LOG, `Photo backfill errors — ${new Date().toISOString()}\n\n`);

  const cityFilter = allMode ? '' : `AND city = ANY($1::text[])`;
  const countParams = allMode ? [] : [SERVICE_AREA_CITIES];
  const statusFilter = `AND standard_status IN ('Active', 'Active Under Contract', 'Coming Soon')`;

  // For retry mode: find listings that were fetched but got 0 photos
  const fetchFilter = retryMode
    ? `AND photos_fetched_at IS NOT NULL AND (photo_urls IS NULL OR photo_urls = '[]'::jsonb)`
    : `AND photos_fetched_at IS NULL`;

  const countResult = await pool.query(
    `SELECT count(*) as cnt FROM listing_records
     WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE
       ${statusFilter}
       AND property_type != 'Residential Lease'
       AND photos_count > 0 ${fetchFilter}
       ${cityFilter}`,
    countParams
  );
  const totalNeeded = parseInt(countResult.rows[0].cnt, 10);
  const mode = retryMode ? 'Retry' : allMode ? 'All active' : 'Service area';
  console.log(`[backfill] ${mode} listings needing photos: ${totalNeeded}`);

  if (totalNeeded === 0) {
    console.log('[backfill] Nothing to do.');
    await pool.end();
    return;
  }

  let processed = 0;
  let photosStored = 0;
  let errors = 0;
  let skipped = 0; // API returned 0 photos (legit empty)
  const startTime = Date.now();

  while (true) {
    const paramIdx = allMode ? 1 : 2;

    // For retry mode, reset photos_fetched_at so we can re-fetch
    if (retryMode) {
      await pool.query(
        `UPDATE listing_records SET photos_fetched_at = NULL
         WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE
           ${statusFilter}
           AND property_type != 'Residential Lease'
           AND photos_count > 0
           AND photos_fetched_at IS NOT NULL
           AND (photo_urls IS NULL OR photo_urls = '[]'::jsonb)
           ${cityFilter}
         LIMIT 500`,
        countParams
      ).catch(() => {}); // OK if LIMIT not supported, we'll still find them
    }

    const batch = await pool.query(
      `SELECT listing_key, listing_id, photos_count FROM listing_records
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

    for (let i = 0; i < batch.rows.length; i += CONCURRENCY) {
      const chunk = batch.rows.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        chunk.map(row => fetchAllPhotos(pool, token, row.listing_key, row.listing_id, row.photos_count))
      );

      for (const r of results) {
        processed++;
        if (r.status === 'fulfilled') {
          if (r.value > 0) {
            photosStored += r.value;
          } else {
            skipped++;
          }
        } else {
          errors++;
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = (processed / (Date.now() - startTime) * 1000).toFixed(1);
      const pct = ((processed / totalNeeded) * 100).toFixed(1);
      log(
        `\r[backfill] ${processed}/${totalNeeded} (${pct}%) | ${photosStored} photos | ${skipped} empty | ${errors} errors | ${rate}/s | ${elapsed}s`
      );
    }
  }

  console.log('\n[backfill] Done.');
  console.log(`  Listings processed: ${processed}`);
  console.log(`  Photos stored: ${photosStored}`);
  console.log(`  Empty (0 from API): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  if (errors > 0) {
    console.log(`  Error log: ${ERROR_LOG}`);
  }

  await pool.end();
}

/**
 * Fetch ALL photos for a listing with pagination.
 * Follows @odata.nextLink to get past the 10-per-page limit.
 * Retries on transient failures.
 * Does NOT mark as fetched on error — allows retry on next run.
 */
async function fetchAllPhotos(pool, token, listingKey, listingId, expectedCount) {
  let url = `${SPARK_BASE}/Property('${listingKey}')/Media`;
  const allPhotos = [];
  let pageNum = 0;
  let retries = 0;

  while (url) {
    let res;
    try {
      res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
    } catch (err) {
      // Network error — retry
      if (retries < MAX_RETRIES) {
        retries++;
        await sleep(RETRY_DELAY_MS * retries);
        continue;
      }
      logError(listingId, listingKey, `Network error after ${MAX_RETRIES} retries: ${err.message}`);
      throw err;
    }

    if (!res.ok) {
      if (res.status === 429) {
        // Rate limited — wait and retry
        await sleep(5000);
        continue;
      }
      if (res.status >= 500 && retries < MAX_RETRIES) {
        retries++;
        await sleep(RETRY_DELAY_MS * retries);
        continue;
      }
      // 404 = listing doesn't exist in RESO, mark as fetched (legit empty)
      if (res.status === 404) {
        await pool.query(
          `UPDATE listing_records SET photo_urls = '[]'::jsonb, photos_fetched_at = NOW() WHERE listing_key = $1`,
          [listingKey]
        );
        return 0;
      }
      logError(listingId, listingKey, `HTTP ${res.status}`);
      throw new Error(`API ${res.status} for MLS# ${listingId}`);
    }

    const data = await res.json();
    const photos = data.value ?? [];
    allPhotos.push(...photos);
    pageNum++;
    retries = 0; // Reset retries on success

    // Follow pagination
    url = data['@odata.nextLink'] ?? null;
  }

  // Sort: preferred first, then by order
  allPhotos.sort((a, b) => {
    const aPref = a.PreferredPhotoYN === true || a.PreferredPhotoYN === 'true' ? 0 : 1;
    const bPref = b.PreferredPhotoYN === true || b.PreferredPhotoYN === 'true' ? 0 : 1;
    if (aPref !== bPref) return aPref - bPref;
    return (typeof a.Order === 'number' ? a.Order : 999) - (typeof b.Order === 'number' ? b.Order : 999);
  });

  // Build compact array
  const photoUrls = allPhotos.map(p => ({
    url: String(p.MediaURL ?? ''),
    desc: p.ShortDescription ? String(p.ShortDescription) : null,
  }));

  // Store
  await pool.query(
    `UPDATE listing_records SET photo_urls = $1, photos_fetched_at = NOW() WHERE listing_key = $2`,
    [JSON.stringify(photoUrls), listingKey]
  );

  return photoUrls.length;
}

function logError(listingId, listingKey, message) {
  const line = `${new Date().toISOString()} | MLS# ${listingId} | ${listingKey} | ${message}\n`;
  fs.appendFileSync(ERROR_LOG, line);
}

main().catch(err => {
  console.error('\n[backfill] Fatal error:', err.message);
  process.exit(1);
});
