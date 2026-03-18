/**
 * Photo Backfill Script — Optimized with parallel pagination
 *
 * Fetches ALL photos from ARMLS Spark RESO API.
 * Parallelizes both across listings AND within listings (page fetches).
 * Failed listings are NOT marked as fetched — they'll be retried.
 * Errors logged to backfill-errors.log.
 *
 * Usage: RDS_DATABASE_URL=... SPARK_TOKEN=... node backfill-photos.js [--all]
 *
 * Default: Service area (Scottsdale, PV, Cave Creek, Carefree)
 * --all:   All active listings statewide
 */

const { Pool } = require('pg');
const fs = require('fs');

const SPARK_BASE = 'https://replication.sparkapi.com/Reso/OData';
const CONCURRENCY = 8; // parallel listings — higher gets 429 throttled
const BATCH_SIZE = 200;
const PAGE_SIZE = 10; // RESO returns 10 per page
const MAX_RETRIES = 3;

const SERVICE_AREA_CITIES = ['Scottsdale', 'Paradise Valley', 'Cave Creek', 'Carefree'];
const ERROR_LOG = __dirname + '/backfill-errors.log';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const allMode = process.argv.includes('--all');
  const token = process.env.SPARK_TOKEN;
  if (!token) { console.error('SPARK_TOKEN env var required'); process.exit(1); }

  const pool = new Pool({
    connectionString: process.env.RDS_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: CONCURRENCY + 2,
  });

  fs.writeFileSync(ERROR_LOG, `Photo backfill — ${new Date().toISOString()}\n\n`);

  const cityFilter = allMode ? '' : `AND city = ANY($1::text[])`;
  const countParams = allMode ? [] : [SERVICE_AREA_CITIES];
  const statusFilter = `AND standard_status IN ('Active', 'Active Under Contract', 'Coming Soon')`;

  const countResult = await pool.query(
    `SELECT count(*) as cnt FROM listing_records
     WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE
       ${statusFilter} AND property_type != 'Residential Lease'
       AND photos_count > 0 AND photos_fetched_at IS NULL ${cityFilter}`,
    countParams
  );
  const totalNeeded = parseInt(countResult.rows[0].cnt, 10);
  console.log(`[backfill] ${allMode ? 'All' : 'Service area'} listings needing photos: ${totalNeeded}`);
  if (totalNeeded === 0) { console.log('Nothing to do.'); await pool.end(); return; }

  let processed = 0, photosStored = 0, errors = 0, empty = 0;
  const startTime = Date.now();

  while (true) {
    const paramIdx = allMode ? 1 : 2;
    const batch = await pool.query(
      `SELECT listing_key, listing_id, photos_count FROM listing_records
       WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE
         ${statusFilter} AND property_type != 'Residential Lease'
         AND photos_count > 0 AND photos_fetched_at IS NULL ${cityFilter}
       ORDER BY list_price DESC NULLS LAST LIMIT $${paramIdx}`,
      allMode ? [BATCH_SIZE] : [SERVICE_AREA_CITIES, BATCH_SIZE]
    );
    if (batch.rows.length === 0) break;

    // Process CONCURRENCY listings in parallel
    for (let i = 0; i < batch.rows.length; i += CONCURRENCY) {
      const chunk = batch.rows.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        chunk.map(row => fetchAllPhotosParallel(pool, token, row.listing_key, row.listing_id, row.photos_count))
      );

      for (const r of results) {
        processed++;
        if (r.status === 'fulfilled') {
          if (r.value > 0) photosStored += r.value;
          else empty++;
        } else {
          errors++;
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = (processed / (Date.now() - startTime) * 1000).toFixed(1);
      const pct = ((processed / totalNeeded) * 100).toFixed(1);
      process.stdout.write(
        `\r[backfill] ${processed}/${totalNeeded} (${pct}%) | ${photosStored} photos | ${empty} empty | ${errors} err | ${rate}/s | ${elapsed}s   `
      );
    }
  }

  console.log('\n[backfill] Done.');
  console.log(`  Processed: ${processed} | Photos: ${photosStored} | Empty: ${empty} | Errors: ${errors}`);
  console.log(`  Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  if (errors > 0) console.log(`  Error log: ${ERROR_LOG}`);
  await pool.end();
}

/**
 * Fetch ALL photos with parallel page fetching.
 * 1. Fetch page 1 to get total via photos_count
 * 2. Calculate how many pages we need
 * 3. Fetch all remaining pages in parallel
 */
async function fetchAllPhotosParallel(pool, token, listingKey, listingId, photosCount) {
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  const baseUrl = `${SPARK_BASE}/Property('${listingKey}')/Media`;

  // Page 1 with retry
  let res;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      res = await fetch(baseUrl, { headers });
      if (res.status === 429) {
        const wait = 5000 + attempt * 5000; // 5s, 10s, 15s
        await sleep(wait);
        continue;
      }
      if (res.status >= 500) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      break;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        logError(listingId, listingKey, `Network error: ${err.message}`);
        throw err;
      }
      await sleep(2000 * (attempt + 1));
    }
  }

  if (!res || !res.ok) {
    if (res && res.status === 404) {
      await pool.query(
        `UPDATE listing_records SET photo_urls = '[]'::jsonb, photos_fetched_at = NOW() WHERE listing_key = $1`,
        [listingKey]
      );
      return 0;
    }
    logError(listingId, listingKey, `HTTP ${res?.status ?? 'unknown'}`);
    throw new Error(`HTTP ${res?.status ?? 'unknown'}`);
  }

  const data = await res.json();
  const page1Photos = data.value ?? [];

  // If no nextLink, we got everything
  if (!data['@odata.nextLink']) {
    return await storePhotos(pool, listingKey, page1Photos);
  }

  // Calculate remaining pages and fetch in parallel
  const estimatedTotal = Math.max(photosCount || 50, page1Photos.length + PAGE_SIZE);
  const totalPages = Math.ceil(estimatedTotal / PAGE_SIZE);
  const remainingPages = [];
  for (let skip = PAGE_SIZE; skip < totalPages * PAGE_SIZE; skip += PAGE_SIZE) {
    remainingPages.push(skip);
  }

  // Fetch all remaining pages in parallel (batched to avoid overwhelming API)
  const PAGE_CONCURRENCY = 5;
  const allPhotos = [...page1Photos];

  for (let i = 0; i < remainingPages.length; i += PAGE_CONCURRENCY) {
    const pageChunk = remainingPages.slice(i, i + PAGE_CONCURRENCY);
    const pageResults = await Promise.allSettled(
      pageChunk.map(async (skip) => {
        const url = `${baseUrl}?$skip=${skip}`;
        const r = await fetch(url, { headers });
        if (!r.ok) return [];
        const d = await r.json();
        return d.value ?? [];
      })
    );

    let gotEmpty = false;
    for (const pr of pageResults) {
      if (pr.status === 'fulfilled' && pr.value.length > 0) {
        allPhotos.push(...pr.value);
      } else if (pr.status === 'fulfilled' && pr.value.length === 0) {
        gotEmpty = true;
      }
    }
    // If any page returned empty, we've reached the end
    if (gotEmpty) break;
  }

  return await storePhotos(pool, listingKey, allPhotos);
}

async function storePhotos(pool, listingKey, allPhotos) {
  // Sort: preferred first, then by order
  allPhotos.sort((a, b) => {
    const aPref = a.PreferredPhotoYN === true || a.PreferredPhotoYN === 'true' ? 0 : 1;
    const bPref = b.PreferredPhotoYN === true || b.PreferredPhotoYN === 'true' ? 0 : 1;
    if (aPref !== bPref) return aPref - bPref;
    return (typeof a.Order === 'number' ? a.Order : 999) - (typeof b.Order === 'number' ? b.Order : 999);
  });

  // Deduplicate by MediaKey
  const seen = new Set();
  const unique = allPhotos.filter(p => {
    const key = p.MediaKey ?? p.MediaURL;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const photoUrls = unique.map(p => ({
    url: String(p.MediaURL ?? ''),
    desc: p.ShortDescription ? String(p.ShortDescription) : null,
  }));

  await pool.query(
    `UPDATE listing_records SET photo_urls = $1, photos_fetched_at = NOW() WHERE listing_key = $2`,
    [JSON.stringify(photoUrls), listingKey]
  );

  return photoUrls.length;
}

function logError(listingId, listingKey, message) {
  fs.appendFileSync(ERROR_LOG, `${new Date().toISOString()} | MLS# ${listingId} | ${listingKey} | ${message}\n`);
}

main().catch(err => {
  console.error('\n[backfill] Fatal:', err.message);
  process.exit(1);
});
