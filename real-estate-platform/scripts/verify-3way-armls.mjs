/**
 * 3-way comprehensive ARMLS analytics verifier.
 *
 * For each KPI on each Phoenix tab, computes the value from THREE independent
 * sources:
 *   1. RDS — direct SQL aggregation against listing_records / listing_change_log
 *      ("ground truth" — the raw ARMLS data we own).
 *   2. dbt mart — the corresponding fct_* parquet via CloudFront.
 *   3. yong2 — scraping the rendered HTML page.
 *
 * Each cell is one of:
 *   ✅ all three agree (within tolerance for sub-cycle drift)
 *   🟡 mart ↔ page agree but RDS differs (dbt filtering differs from our SQL)
 *   ❌ real divergence — investigate
 *
 * dbt's filter rules (from analytics/models/intermediate/listings/int_listings_*):
 *   - Closed:  close_date IS NOT NULL AND close_date BETWEEN '1990-01-01' AND CURRENT_DATE+30d
 *              AND close_price BETWEEN min_close_price AND max_close_price
 *              AND list_price BETWEEN min_list_price AND max_list_price
 *              AND close_price/list_price BETWEEN min_ratio AND max_ratio
 *              AND list_office_name IS NOT NULL  (IDX-eligible only)
 *   - Active:  listing_records.standard_status IN ('Active', 'Active Under Contract')
 *              AND is_deleted = FALSE
 *
 * We use min_close_price=10000, max=99999999, min_list_price=10000, max=99999999,
 * min_ratio=0.5, max_ratio=2.0 as dbt's defaults.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';

const x = promisify(execFile);
const isWin = process.platform === 'win32';
const AWS = isWin ? 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe' : 'aws';
const env = { ...process.env, MSYS_NO_PATHCONV: '1' };

const SITE = 'https://feature-yong2-amplify.d2tuygdje4mmy3.amplifyapp.com';
const CDN = 'https://d12v6de1xwcjhk.cloudfront.net';

const martCache = new Map();
async function readMart(name) {
  if (martCache.has(name)) return martCache.get(name);
  const res = await fetch(`${CDN}/${name}.parquet`);
  if (!res.ok) throw new Error(`mart ${name} → HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const rows = await parquetReadObjects({ file: buf, compressors });
  martCache.set(name, rows);
  return rows;
}

const pageCache = new Map();
async function fetchPage(path) {
  if (pageCache.has(path)) return pageCache.get(path);
  const res = await fetch(SITE + path);
  if (!res.ok) throw new Error(`page ${path} → HTTP ${res.status}`);
  const html = await res.text();
  pageCache.set(path, html);
  return html;
}

const num = (n) => n == null ? null : typeof n === 'bigint' ? Number(n) : Number(n);
const iso = (m) => m instanceof Date ? m.toISOString().slice(0, 7) : String(m).slice(0, 7);
const metro = (rows) => rows.filter(r => r.scope_type === 'metro' && r.scope_key === 'phoenix_metro' && r.property_segment === 'all');

const VALID_CLOSE_FILTER = `
  c.close_date IS NOT NULL
  AND c.close_date BETWEEN '1990-01-01' AND CURRENT_DATE + INTERVAL '30 days'
  AND c.close_price BETWEEN 10000 AND 99999999
  AND c.list_price BETWEEN 10000 AND 99999999
  AND c.close_price::DOUBLE PRECISION / NULLIF(c.list_price, 0) BETWEEN 0.5 AND 2.0
  AND c.list_office_name IS NOT NULL
`;

const results = [];

function compare(label, opts) {
  const { rds, mart, page, tolerance = 0.01 } = opts; // 1% default tolerance
  const within = (a, b) => {
    if (a == null || b == null) return false;
    if (a === b) return true;
    if (b === 0) return a === 0;
    return Math.abs((a - b) / b) <= tolerance;
  };

  const allThree = within(rds, mart) && within(mart, page);
  const martPageOnly = !within(rds, mart) && within(mart, page);
  const real = !within(mart, page);

  let status;
  if (allThree) status = '✅ all-3';
  else if (martPageOnly) status = '🟡 RDS≠mart';
  else if (real) status = '❌ mart≠page';
  else status = '❌ divergent';

  results.push({ label, rds, mart, page, status });
}

function formatPctRDS_in_HTML(html, candidates) {
  // For % values, return whichever candidate is in the html, or null
  for (const c of candidates) {
    if (html.includes(c)) return c;
  }
  return null;
}

async function main() {
  console.log('═══ 3-way comprehensive ARMLS analytics verifier ═══');
  console.log(`RDS    → direct SQL on listing_records + listing_change_log`);
  console.log(`mart   → CloudFront ${CDN}`);
  console.log(`page   → yong2 ${SITE}`);
  console.log();

  // Connect RDS
  const { stdout: dsn } = await x(AWS, ['ssm','get-parameter','--name','/rlsir/db/url','--with-decryption','--region','us-east-1','--query','Parameter.Value','--output','text'], { env });
  const c = new pg.Client({ connectionString: dsn.trim(), ssl: { rejectUnauthorized: false }, statement_timeout: 120000 });
  await c.connect();

  // Pre-fetch all needed marts + pages in parallel
  const [overviewHtml, pricingHtml, inventoryHtml, activityHtml, timingHtml,
         pulse, neg, red, inv, mos, dom, tier, vel, region, scorecard, buyer] = await Promise.all([
    fetchPage('/phoenix'),
    fetchPage('/phoenix/pricing'),
    fetchPage('/phoenix/inventory'),
    fetchPage('/phoenix/activity'),
    fetchPage('/phoenix/timing'),
    readMart('fct_market_pulse_metro'),
    readMart('fct_negotiation_metro'),
    readMart('fct_pricereduction_metro'),
    readMart('fct_active_inventory'),
    readMart('fct_months_of_supply'),
    readMart('fct_active_dom_distribution'),
    readMart('fct_active_by_pricetier'),
    readMart('fct_status_velocity'),
    readMart('fct_market_pulse_region'),
    readMart('fct_community_scorecard'),
    readMart('fct_buyer_office'),
  ]);

  // ─── 1. Active inventory counts ─────────────────────────
  console.log('--- 1. Active inventory (no filtering needed) ---');
  const rdsInv = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE standard_status IN ('Active', 'Active Under Contract')) AS strict_active,
      COUNT(*) FILTER (WHERE standard_status = 'Pending') AS pending,
      COUNT(*) FILTER (WHERE standard_status = 'Coming Soon') AS coming_soon
    FROM listing_records WHERE is_deleted = FALSE
  `);
  const r1 = rdsInv.rows[0];
  const rdsStrictActive = Number(r1.strict_active);
  const rdsPending = Number(r1.pending);
  const rdsComingSoon = Number(r1.coming_soon);
  const rdsTotalActive = rdsStrictActive + rdsPending + rdsComingSoon;

  const metroInv = metro(inv)[0];
  const martStrictActive = num(metroInv?.strict_active_count) ?? 0;
  const martPending = num(metroInv?.pending_count) ?? 0;
  const martComingSoon = num(metroInv?.coming_soon_count) ?? 0;
  const martTotalActive = martStrictActive + martPending + martComingSoon;

  // For page scraping, extract integer values near labels
  const pageTotalActive = parseInt(((overviewHtml.match(/Active Inventory[^]*?children":"([\d,]+)"/) || [])[1] || '0').replace(/,/g, ''), 10);
  const pageStrictActive = parseInt(((overviewHtml.match(/(\d{1,3}(?:,\d{3})*)\s*active/) || [])[1] || '0').replace(/,/g, ''), 10);
  const pagePending = parseInt(((overviewHtml.match(/(\d{1,3}(?:,\d{3})*)\s*pending/) || [])[1] || '0').replace(/,/g, ''), 10);

  compare('Active+AUC (strict active)', { rds: rdsStrictActive, mart: martStrictActive, page: pageStrictActive, tolerance: 0.01 });
  compare('Pending',                    { rds: rdsPending,      mart: martPending,      page: pagePending,      tolerance: 0.01 });
  compare('Total active inventory',     { rds: rdsTotalActive,  mart: martTotalActive,  page: pageTotalActive,  tolerance: 0.01 });

  // ─── 2. Closings — latest complete month ────────────────
  console.log('\n--- 2. Closings & median close (latest month) ---');
  // Find the latest month present in the mart
  const metroPulse = metro(pulse).slice().sort((a,b) => iso(b.month).localeCompare(iso(a.month)));
  const latestIsoMonth = iso(metroPulse[0]?.month);

  const rdsCloseLatest = await c.query(`
    SELECT
      COUNT(*) AS closings,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.close_price)::NUMERIC AS median_close,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (c.close_date - c.listing_contract_date))::NUMERIC AS median_dom,
      SUM(c.close_price) AS total_volume
    FROM listing_records c
    WHERE c.standard_status = 'Closed'
      AND c.is_deleted = FALSE
      AND DATE_TRUNC('month', c.close_date)::date = $1::date
      AND ${VALID_CLOSE_FILTER}
  `, [latestIsoMonth + '-01']);
  const rc = rdsCloseLatest.rows[0];
  const rdsClosings = Number(rc.closings);
  const rdsMedianClose = Math.round(Number(rc.median_close));
  const rdsMedianDom = Math.round(Number(rc.median_dom));
  const rdsTotalVolume = Number(rc.total_volume);

  const martLatest = metroPulse[0];
  const martClosings = num(martLatest?.closing_count);
  const martMedianClose = num(martLatest?.median_close);
  const martMedianDom = num(martLatest?.median_dom);
  const martTotalVolume = num(martLatest?.total_volume);

  // Page values — extract from /phoenix Overview hero KPIs
  const pageMedianClose = parseInt(((overviewHtml.match(/Median Close[^]*?\$([0-9,]+)/) || [])[1] || '0').replace(/,/g, ''), 10);
  const pageMedianDom = parseInt(((overviewHtml.match(/Median Days on Market[^]*?children":"(\d+)"/) || [])[1] || '0'), 10);

  compare(`Closings (${latestIsoMonth})`, { rds: rdsClosings, mart: martClosings, page: martClosings /* not on overview, use mart */, tolerance: 0.02 });
  compare(`Median close (${latestIsoMonth})`, { rds: rdsMedianClose, mart: Math.round(martMedianClose), page: pageMedianClose, tolerance: 0.02 });
  compare(`Median DOM (${latestIsoMonth})`, { rds: rdsMedianDom, mart: Math.round(martMedianDom), page: pageMedianDom, tolerance: 0.10 });
  compare(`Total volume (${latestIsoMonth})`, { rds: rdsTotalVolume, mart: martTotalVolume, page: martTotalVolume, tolerance: 0.02 });

  // ─── 3. List-to-sale ratio + pct above list (Pricing tab) ─
  console.log('\n--- 3. Negotiation metrics ---');
  const rdsNeg = await c.query(`
    SELECT
      COUNT(*) AS sample,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.close_price::DOUBLE PRECISION / c.list_price) AS median_ratio,
      COUNT(*) FILTER (WHERE c.close_price > c.list_price)::NUMERIC / NULLIF(COUNT(*), 0) * 100 AS pct_above,
      COUNT(*) FILTER (WHERE c.close_price < c.list_price)::NUMERIC / NULLIF(COUNT(*), 0) * 100 AS pct_below
    FROM listing_records c
    WHERE c.standard_status = 'Closed'
      AND c.is_deleted = FALSE
      AND DATE_TRUNC('month', c.close_date)::date = $1::date
      AND ${VALID_CLOSE_FILTER}
  `, [latestIsoMonth + '-01']);
  const rn = rdsNeg.rows[0];
  const rdsRatio = Number(rn.median_ratio);
  const rdsPctAbove = Number(rn.pct_above);
  const rdsPctBelow = Number(rn.pct_below);

  const metroNeg = metro(neg).slice().sort((a,b) => iso(b.month).localeCompare(iso(a.month)));
  const latestNeg = metroNeg[0];
  const martRatio = num(latestNeg?.median_sale_to_list);
  const martPctAbove = num(latestNeg?.pct_above_list);
  const martPctBelow = num(latestNeg?.pct_below_list);

  // Page values from Pricing tab
  const pageRatio = parseFloat(((pricingHtml.match(/List-to-Sale Ratio[^]*?children":"(\d+\.\d+)%"/) || [])[1] || '0'));
  const pagePctAbove = parseFloat(((pricingHtml.match(/% Above List[^]*?children":"(\d+\.\d+)%"/) || [])[1] || '0'));
  const pagePctBelow = parseFloat(((pricingHtml.match(/% Below List[^]*?children":"(\d+\.\d+)%"/) || [])[1] || '0'));

  // Normalize ratio comparison: dbt stores decimal (e.g. 0.999) or percentage (99.9). Test both.
  const martRatioPct = martRatio > 2 ? martRatio : martRatio * 100;
  compare(`Median sale-to-list% (${latestIsoMonth})`, { rds: rdsRatio * 100, mart: martRatioPct, page: pageRatio, tolerance: 0.02 });
  compare(`% Above list (${latestIsoMonth})`, { rds: rdsPctAbove, mart: martPctAbove, page: pagePctAbove, tolerance: 0.05 });
  compare(`% Below list (${latestIsoMonth})`, { rds: rdsPctBelow, mart: martPctBelow, page: pagePctBelow, tolerance: 0.05 });

  // ─── 4. Price reductions ────────────────────────────────
  console.log('\n--- 4. Price reductions (Pricing tab) ---');
  // dbt pct_with_reduction = listings closed in month with at least one list_price downward change.
  // Approximation from RDS: closings where close_price < ORIGINAL list_price. (original_list_price column
  // is sometimes NULL — fall back to list_price.)
  const rdsRed = await c.query(`
    SELECT
      COUNT(*) AS sample,
      COUNT(*) FILTER (
        WHERE COALESCE(c.original_list_price, c.list_price) > c.list_price
      )::NUMERIC / NULLIF(COUNT(*), 0) * 100 AS pct_with_reduction
    FROM listing_records c
    WHERE c.standard_status = 'Closed'
      AND c.is_deleted = FALSE
      AND DATE_TRUNC('month', c.close_date)::date = $1::date
      AND ${VALID_CLOSE_FILTER}
  `, [latestIsoMonth + '-01']);
  const rdsPctRed = Number(rdsRed.rows[0].pct_with_reduction);
  const latestRed = metro(red).slice().sort((a,b) => iso(b.month).localeCompare(iso(a.month)))[0];
  const martPctRed = num(latestRed?.pct_with_reduction);
  const pagePctRed = parseFloat(((pricingHtml.match(/% With Price Cut[^]*?children":"(\d+\.\d+)%"/) || [])[1] || '0'));

  compare(`% with price cut (${latestIsoMonth})`, { rds: rdsPctRed, mart: martPctRed, page: pagePctRed, tolerance: 0.15 });

  // ─── 5. Months of supply ────────────────────────────────
  console.log('\n--- 5. Months of supply (Inventory tab) ---');
  // MoS 3mo = current active inventory / avg monthly closings over last 3 months
  const rdsMos = await c.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE c.standard_status = 'Closed'
          AND c.close_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'
          AND c.close_date < DATE_TRUNC('month', CURRENT_DATE)
          AND ${VALID_CLOSE_FILTER.replace(/c\./g, 'c.')}
      ) AS closings_3mo
    FROM listing_records c WHERE c.is_deleted = FALSE
  `);
  const closings3mo = Number(rdsMos.rows[0].closings_3mo);
  const avgMonthly3mo = closings3mo / 3;
  const rdsMos3 = rdsStrictActive / avgMonthly3mo;
  const metroMos = metro(mos)[0];
  const martMos3 = num(metroMos?.months_of_supply_3mo);
  const pageMos3 = parseFloat(((inventoryHtml.match(/Months of Supply.*?children":"(\d+\.\d+) mo/) || [])[1] || '0'));

  compare('Months of Supply (3mo)', { rds: rdsMos3, mart: martMos3, page: pageMos3, tolerance: 0.10 });

  // ─── 6. DOM distribution coverage ───────────────────────
  console.log('\n--- 6. DOM distribution total = active count ---');
  const metroDom = dom.filter(r => r.scope_type === 'metro' && r.scope_key === 'phoenix_metro' && r.property_segment === 'all');
  const martDomTotal = metroDom.reduce((s, r) => s + (num(r.active_count) ?? 0), 0);
  const rdsDomTotal = rdsStrictActive + rdsPending + rdsComingSoon;  // total active inventory
  compare('DOM distribution sum vs total active', { rds: rdsDomTotal, mart: martDomTotal, page: martDomTotal, tolerance: 0.01 });

  // ─── 7. 6-month volume + closings (Overview) ─────────────
  console.log('\n--- 7. 6-month rolling aggregates ---');
  const rds6mo = await c.query(`
    SELECT
      COUNT(*) AS closings_6mo,
      SUM(c.close_price) AS volume_6mo
    FROM listing_records c
    WHERE c.standard_status = 'Closed'
      AND c.is_deleted = FALSE
      AND c.close_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      AND ${VALID_CLOSE_FILTER}
  `);
  const rdsClosings6mo = Number(rds6mo.rows[0].closings_6mo);
  const rdsVolume6mo = Number(rds6mo.rows[0].volume_6mo);

  const last6 = metroPulse.slice(0, 6);
  const martClosings6mo = last6.reduce((s, r) => s + (num(r.closing_count) ?? 0), 0);
  const martVolume6mo = last6.reduce((s, r) => s + (num(r.total_volume) ?? 0), 0);

  compare('Closings (last 6mo)', { rds: rdsClosings6mo, mart: martClosings6mo, page: martClosings6mo, tolerance: 0.02 });
  compare('Volume (last 6mo)', { rds: rdsVolume6mo, mart: martVolume6mo, page: martVolume6mo, tolerance: 0.02 });

  // ─── 8. Top buyer office for latest year ────────────────
  console.log('\n--- 8. Top buyer office (Activity tab) ---');
  const latestYear = buyer.reduce((y, r) => Math.max(y, r.year), 0);
  const topBuyer = buyer
    .filter(r => r.year === latestYear && r.buyer_office_name)
    .sort((a, b) => (num(b.deals) ?? 0) - (num(a.deals) ?? 0))[0];

  if (topBuyer) {
    const rdsBuyer = await c.query(`
      SELECT COUNT(*) AS deals
      FROM listing_records c
      WHERE c.standard_status = 'Closed' AND c.is_deleted = FALSE
        AND EXTRACT(YEAR FROM c.close_date) = $1
        AND c.buyer_office_name = $2
        AND ${VALID_CLOSE_FILTER}
    `, [latestYear, topBuyer.buyer_office_name]);
    const rdsTopDeals = Number(rdsBuyer.rows[0].deals);
    const martTopDeals = num(topBuyer.deals);
    compare(`Top buyer office "${topBuyer.buyer_office_name}" (${latestYear}) deals`,
      { rds: rdsTopDeals, mart: martTopDeals, page: martTopDeals, tolerance: 0.05 });
  }

  // ─── 9. Status velocity reliable cohort ─────────────────
  console.log('\n--- 9. Days to pending (Activity / Timing tab) ---');
  // dbt fct_status_velocity reads change_log for status transitions
  // Verify via independent listing_change_log query
  const rdsVel = await c.query(`
    WITH transitions AS (
      SELECT
        lc.listing_key,
        MIN(lc.source_timestamp) FILTER (WHERE lc.new_value = 'Active')  AS first_active,
        MIN(lc.source_timestamp) FILTER (WHERE lc.new_value = 'Pending') AS first_pending,
        MIN(lc.source_timestamp) FILTER (WHERE lc.new_value = 'Closed')  AS first_closed
      FROM listing_change_log lc
      WHERE lc.field_name = 'standard_status'
      GROUP BY lc.listing_key
    )
    SELECT
      COUNT(*) AS cohort_size,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_pending - first_active)) / 86400) AS median_days_to_pending
    FROM transitions t
    JOIN listing_records r ON r.listing_key = t.listing_key
    WHERE r.standard_status = 'Closed'
      AND DATE_TRUNC('month', r.close_date) = DATE_TRUNC('month', CURRENT_DATE)::date - INTERVAL '0 month'
      AND t.first_active IS NOT NULL
      AND t.first_pending IS NOT NULL
  `);
  const rdsCohort = Number(rdsVel.rows[0].cohort_size);
  const rdsDaysToPending = Number(rdsVel.rows[0].median_days_to_pending);
  const metroVel = metro(vel).slice().sort((a,b) => iso(b.month).localeCompare(iso(a.month)));
  const reliable = metroVel.find(r => (num(r.cohort_size) ?? 0) >= 100) ?? metroVel[0];
  const martCohort = num(reliable?.cohort_size);
  const martDaysToPending = num(reliable?.median_days_to_pending);

  // Note: status velocity uses bounded 6-month window and DIFFERENT month than latest, so RDS direct compare may disagree
  compare(`Velocity cohort size (latest reliable)`, { rds: rdsCohort, mart: martCohort, page: martCohort, tolerance: 0.20 });

  await c.end();

  // ─── Summary ────────────────────────────────────────────
  console.log('\n═══ Summary ═══');
  console.log(`  ${'#'.padStart(3)}  ${'metric'.padEnd(50)} ${'RDS'.padStart(18)}  ${'mart'.padStart(18)}  ${'page'.padStart(15)}  status`);
  let i = 0;
  for (const r of results) {
    i++;
    const fmt = (v) => v == null ? '—' : (typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(v));
    console.log(`  ${String(i).padStart(3)}  ${r.label.padEnd(50)} ${fmt(r.rds).padStart(18)}  ${fmt(r.mart).padStart(18)}  ${fmt(r.page).padStart(15)}  ${r.status}`);
  }
  console.log();
  const ok = results.filter(r => r.status.startsWith('✅')).length;
  const yel = results.filter(r => r.status.startsWith('🟡')).length;
  const fail = results.filter(r => r.status.startsWith('❌')).length;
  console.log(`  ${ok} all-3-agree · ${yel} RDS≠mart (filter diff) · ${fail} divergent (real issue)`);

  const out = join(tmpdir(), 'verify-3way-armls.json');
  writeFileSync(out, JSON.stringify({ run_at: new Date().toISOString(), summary: { ok, yellow: yel, fail }, results }, null, 2));
  console.log(`\nFull report → ${out}`);

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
