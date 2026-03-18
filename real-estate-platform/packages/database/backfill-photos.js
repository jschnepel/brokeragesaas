/**
 * Photo Backfill — Two-Phase Approach
 *
 * Phase 1 (--fast): Single API call per listing, no pagination. Gets first 10 photos.
 *   Fast: ~5 listings/sec, completes all listings in ~1.5 hours.
 *
 * Phase 2 (--paginate): Only for listings with truncated photos (have 10 but need more).
 *   Paginates to get full photo sets. Slower but smaller dataset.
 *
 * Usage:
 *   RDS_DATABASE_URL=... SPARK_TOKEN=... node backfill-photos.js --all --fast
 *   RDS_DATABASE_URL=... SPARK_TOKEN=... node backfill-photos.js --all --paginate
 *   RDS_DATABASE_URL=... SPARK_TOKEN=... node backfill-photos.js --all  (does both phases)
 *
 * Default: Service area only. Add --all for statewide.
 */

const { Pool } = require('pg');
const fs = require('fs');

const SPARK_BASE = 'https://replication.sparkapi.com/Reso/OData';
const FAST_CONCURRENCY = 5;
const PAGINATE_CONCURRENCY = 2;
const BATCH_SIZE = 200;
const MAX_RETRIES = 3;

const SERVICE_AREA_CITIES = ['Scottsdale', 'Paradise Valley', 'Cave Creek', 'Carefree'];
const ERROR_LOG = __dirname + '/backfill-errors.log';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const allMode = process.argv.includes('--all');
  const fastOnly = process.argv.includes('--fast');
  const paginateOnly = process.argv.includes('--paginate');
  const token = process.env.SPARK_TOKEN;
  if (!token) { console.error('SPARK_TOKEN env var required'); process.exit(1); }

  const pool = new Pool({
    connectionString: process.env.RDS_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: Math.max(FAST_CONCURRENCY, PAGINATE_CONCURRENCY) + 2,
  });

  fs.writeFileSync(ERROR_LOG, `Photo backfill — ${new Date().toISOString()}\n\n`);

  if (!paginateOnly) {
    console.log('\n========== PHASE 1: Fast pass (first 10 photos per listing) ==========\n');
    await runPhase(pool, token, allMode, 'fast');
  }

  if (!fastOnly) {
    console.log('\n========== PHASE 2: Pagination pass (full photo sets) ==========\n');
    await runPhase(pool, token, allMode, 'paginate');
  }

  await pool.end();
}

async function runPhase(pool, token, allMode, phase) {
  const cityFilter = allMode ? '' : `AND city = ANY($1::text[])`;
  const countParams = allMode ? [] : [SERVICE_AREA_CITIES];
  const statusFilter = `AND standard_status IN ('Active', 'Active Under Contract', 'Coming Soon')`;
  const concurrency = phase === 'fast' ? FAST_CONCURRENCY : PAGINATE_CONCURRENCY;

  let whereExtra;
  if (phase === 'fast') {
    // Listings that haven't been fetched at all
    whereExtra = `AND photos_fetched_at IS NULL`;
  } else {
    // Listings with truncated photo sets (exactly 10 but should have more)
    whereExtra = `AND photos_fetched_at IS NOT NULL AND jsonb_array_length(COALESCE(photo_urls, '[]'::jsonb)) <= 10 AND photos_count > 10`;
  }

  const countResult = await pool.query(
    `SELECT count(*) as cnt FROM listing_records
     WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE
       ${statusFilter} AND property_type != 'Residential Lease'
       AND photos_count > 0 ${whereExtra} ${cityFilter}`,
    countParams
  );
  const totalNeeded = parseInt(countResult.rows[0].cnt, 10);
  console.log(`[${phase}] Listings to process: ${totalNeeded}`);
  if (totalNeeded === 0) { console.log('Nothing to do.'); return; }

  let processed = 0, photosStored = 0, errors = 0, empty = 0;
  const startTime = Date.now();

  while (true) {
    const paramIdx = allMode ? 1 : 2;

    // For paginate phase, reset photos_fetched_at so we re-fetch
    let selectExtra = whereExtra;
    if (phase === 'paginate') {
      // Reset a batch for re-fetch
      await pool.query(
        `UPDATE listing_records SET photos_fetched_at = NULL
         WHERE listing_key IN (
           SELECT listing_key FROM listing_records
           WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE
             ${statusFilter} AND property_type != 'Residential Lease'
             AND photos_count > 10
             AND photos_fetched_at IS NOT NULL
             AND jsonb_array_length(COALESCE(photo_urls, '[]'::jsonb)) <= 10
             ${cityFilter}
           LIMIT ${BATCH_SIZE}
         )`,
        countParams
      );
      selectExtra = `AND photos_fetched_at IS NULL`;
    }

    const batch = await pool.query(
      `SELECT listing_key, listing_id, photos_count FROM listing_records
       WHERE is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE
         ${statusFilter} AND property_type != 'Residential Lease'
         AND photos_count > 0 ${selectExtra} ${cityFilter}
       ORDER BY modification_timestamp DESC NULLS LAST
       LIMIT $${paramIdx}`,
      allMode ? [BATCH_SIZE] : [SERVICE_AREA_CITIES, BATCH_SIZE]
    );
    if (batch.rows.length === 0) break;

    for (let i = 0; i < batch.rows.length; i += concurrency) {
      const chunk = batch.rows.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        chunk.map(row =>
          phase === 'fast'
            ? fetchFirstPage(pool, token, row.listing_key, row.listing_id)
            : fetchAllPages(pool, token, row.listing_key, row.listing_id, row.photos_count)
        )
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

      if (phase === 'fast') await sleep(100); // light throttle
      else await sleep(300); // heavier throttle for pagination

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = (processed / (Date.now() - startTime) * 1000).toFixed(1);
      const pct = ((processed / totalNeeded) * 100).toFixed(1);
      process.stdout.write(
        `\r[${phase}] ${processed}/${totalNeeded} (${pct}%) | ${photosStored} photos | ${empty} empty | ${errors} err | ${rate}/s | ${elapsed}s   `
      );
    }
  }

  console.log(`\n[${phase}] Done. Processed: ${processed} | Photos: ${photosStored} | Empty: ${empty} | Errors: ${errors}`);
}

/**
 * Phase 1: Single API call — get first page (up to 10 photos).
 * No pagination. Fast.
 */
async function fetchFirstPage(pool, token, listingKey, listingId) {
  const url = `${SPARK_BASE}/Property('${listingKey}')/Media`;
  let res;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (res.status === 429) {
        await sleep(3000 + attempt * 3000);
        continue;
      }
      if (res.status >= 500) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      break;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        logError(listingId, listingKey, `Network: ${err.message}`);
        throw err;
      }
      await sleep(1000 * (attempt + 1));
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
    throw new Error(`HTTP ${res?.status}`);
  }

  const data = await res.json();
  const photos = data.value ?? [];
  return storePhotos(pool, listingKey, photos);
}

/**
 * Phase 2: Full pagination — follows @odata.nextLink.
 */
async function fetchAllPages(pool, token, listingKey, listingId, photosCount) {
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  let pageUrl = `${SPARK_BASE}/Property('${listingKey}')/Media`;
  const allPhotos = [];

  while (pageUrl) {
    let res;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        res = await fetch(pageUrl, { headers });
        if (res.status === 429) { await sleep(5000 + attempt * 5000); continue; }
        if (res.status >= 500) { await sleep(2000 * (attempt + 1)); continue; }
        break;
      } catch (err) {
        if (attempt === MAX_RETRIES) { logError(listingId, listingKey, `Network: ${err.message}`); throw err; }
        await sleep(2000 * (attempt + 1));
      }
    }

    if (!res || !res.ok) {
      if (res && res.status === 404) {
        await pool.query(`UPDATE listing_records SET photo_urls = '[]'::jsonb, photos_fetched_at = NOW() WHERE listing_key = $1`, [listingKey]);
        return 0;
      }
      logError(listingId, listingKey, `HTTP ${res?.status ?? 'unknown'}`);
      throw new Error(`HTTP ${res?.status}`);
    }

    const data = await res.json();
    allPhotos.push(...(data.value ?? []));
    pageUrl = data['@odata.nextLink'] ?? null;

    // Small delay between pages
    if (pageUrl) await sleep(100);
  }

  return storePhotos(pool, listingKey, allPhotos);
}

function storePhotos(pool, listingKey, photos) {
  // Sort: preferred first, then by order
  photos.sort((a, b) => {
    const aPref = a.PreferredPhotoYN === true || a.PreferredPhotoYN === 'true' ? 0 : 1;
    const bPref = b.PreferredPhotoYN === true || b.PreferredPhotoYN === 'true' ? 0 : 1;
    if (aPref !== bPref) return aPref - bPref;
    return (typeof a.Order === 'number' ? a.Order : 999) - (typeof b.Order === 'number' ? b.Order : 999);
  });

  // Deduplicate
  const seen = new Set();
  const unique = photos.filter(p => {
    const key = p.MediaKey ?? p.MediaURL;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const photoUrls = unique.map(p => ({
    url: String(p.MediaURL ?? ''),
    desc: p.ShortDescription ? String(p.ShortDescription) : null,
  }));

  return pool.query(
    `UPDATE listing_records SET photo_urls = $1, photos_fetched_at = NOW() WHERE listing_key = $2`,
    [JSON.stringify(photoUrls), listingKey]
  ).then(() => photoUrls.length);
}

function logError(listingId, listingKey, message) {
  fs.appendFileSync(ERROR_LOG, `${new Date().toISOString()} | MLS# ${listingId} | ${listingKey} | ${message}\n`);
}

main().catch(err => {
  console.error('\n[backfill] Fatal:', err.message);
  process.exit(1);
});
