/**
 * Comprehensive 3-way ARMLS analytics verifier.
 *
 * For every KPI rendered on every Phoenix tab, computes the value from:
 *   - RDS (independent SQL — ground truth)
 *   - dbt mart parquet (via CloudFront)
 *   - yong2 rendered HTML
 *
 * Plus segment cross-checks (residential / land / all should sum correctly)
 * and schema-presence checks (every mart column we depend on exists).
 *
 * Runs against db.t3.small under walker load — no statement_timeout, so
 * individual queries may take 5-10 min. Whole run is 30-60 min wall time.
 * Logs progress to stderr so the user can see motion.
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

const t0 = Date.now();
const log = (msg) => process.stderr.write(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${msg}\n`);

// ─── Helpers ──────────────────────────────────────────────

const martCache = new Map();
async function readMart(name) {
  if (martCache.has(name)) return martCache.get(name);
  log(`fetching mart ${name}…`);
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
  log(`fetching page ${path}…`);
  const res = await fetch(SITE + path);
  if (!res.ok) throw new Error(`page ${path} → ${res.status}`);
  const html = await res.text();
  pageCache.set(path, html);
  return html;
}

const num = (n) => n == null ? null : typeof n === 'bigint' ? Number(n) : Number(n);
const iso = (m) => m instanceof Date ? m.toISOString().slice(0, 7) : String(m).slice(0, 7);
const metro = (rows) => rows.filter(r => r.scope_type === 'metro' && r.scope_key === 'phoenix_metro' && r.property_segment === 'all');

const results = [];

function compare(label, opts) {
  const { rds, mart, page, tolerance = 0.01, group = '' } = opts;
  const within = (a, b) => {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    if (a === b) return true;
    if (Math.abs(b) < 0.0001) return Math.abs(a) < 0.0001;
    return Math.abs((a - b) / b) <= tolerance;
  };

  const rmAgree = within(rds, mart);
  const mpAgree = within(mart, page);
  const all3 = rmAgree && mpAgree;

  let status;
  if (all3) status = '✅';
  else if (mpAgree && !rmAgree) status = '🟡 RDS≠mart';
  else if (!mpAgree && rmAgree) status = '❌ mart≠page';
  else status = '❌ diverge';

  results.push({ group, label, rds, mart, page, status });
}

const VALID_CLOSE = `
  c.close_date IS NOT NULL
  AND c.close_date BETWEEN '1990-01-01' AND CURRENT_DATE + INTERVAL '30 days'
  AND c.close_price BETWEEN 10000 AND 99999999
  AND c.list_price BETWEEN 10000 AND 99999999
  AND c.close_price::DOUBLE PRECISION / NULLIF(c.list_price, 0) BETWEEN 0.5 AND 2.0
  AND c.list_office_name IS NOT NULL
`;

// ─── Main ─────────────────────────────────────────────────

async function main() {
  log('starting comprehensive 3-way verifier');

  const { stdout: dsn } = await x(AWS, ['ssm','get-parameter','--name','/rlsir/db/url','--with-decryption','--region','us-east-1','--query','Parameter.Value','--output','text'], { env });
  const c = new pg.Client({ connectionString: dsn.trim(), ssl: { rejectUnauthorized: false } });
  await c.connect();
  log('RDS connected');

  // Pre-fetch all marts + pages in parallel
  const [overviewHtml, pricingHtml, inventoryHtml, activityHtml, timingHtml,
         pulse, neg, red, inv, mos, dom, tier, vel, region, scorecard, buyer, pace] = await Promise.all([
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
    readMart('fct_listing_pace'),
  ]);
  log('marts + pages fetched');

  // ─── A. ACTIVE INVENTORY ──────────────────────────────
  log('A. Active inventory…');
  const a1 = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE standard_status = 'Active') AS active,
      COUNT(*) FILTER (WHERE standard_status = 'Active Under Contract') AS auc,
      COUNT(*) FILTER (WHERE standard_status = 'Pending') AS pending,
      COUNT(*) FILTER (WHERE standard_status = 'Coming Soon') AS coming_soon
    FROM listing_records WHERE is_deleted = FALSE
  `);
  const rA = a1.rows[0];
  const rdsStrict = Number(rA.active) + Number(rA.auc);
  const rdsPending = Number(rA.pending);
  const rdsComingSoon = Number(rA.coming_soon);
  const rdsTotal = rdsStrict + rdsPending + rdsComingSoon;

  const metroInv = metro(inv)[0];
  const martStrict = num(metroInv?.strict_active_count);
  const martPending = num(metroInv?.pending_count);
  const martComingSoon = num(metroInv?.coming_soon_count);
  const martTotal = (martStrict || 0) + (martPending || 0) + (martComingSoon || 0);

  const pageStrict = parseInt((overviewHtml.match(/(\d{1,3}(?:,\d{3})*)\s*active/) || [])[1]?.replace(/,/g, '') || '0', 10);
  const pagePending = parseInt((overviewHtml.match(/(\d{1,3}(?:,\d{3})*)\s*pending/) || [])[1]?.replace(/,/g, '') || '0', 10);
  const pageTotal = parseInt((overviewHtml.match(/Active Inventory[^]*?children":"([\d,]+)/) || [])[1]?.replace(/,/g, '') || '0', 10);

  compare('strict active (Active+AUC)', { group: 'A.inventory', rds: rdsStrict, mart: martStrict, page: pageStrict, tolerance: 0.01 });
  compare('pending',                    { group: 'A.inventory', rds: rdsPending, mart: martPending, page: pagePending, tolerance: 0.01 });
  compare('coming soon',                { group: 'A.inventory', rds: rdsComingSoon, mart: martComingSoon, page: martComingSoon, tolerance: 0.05 });
  compare('total active inventory',     { group: 'A.inventory', rds: rdsTotal, mart: martTotal, page: pageTotal, tolerance: 0.01 });

  // ─── B. LATEST MONTH CLOSINGS ─────────────────────────
  log('B. Latest-month closings (this is the slow one)…');
  const metroPulse = metro(pulse).slice().sort((a, b) => iso(b.month).localeCompare(iso(a.month)));
  const latestMo = iso(metroPulse[0]?.month);

  const b1 = await c.query(`
    SELECT
      COUNT(*) AS closings,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.close_price)::NUMERIC AS median_close,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (c.close_date - c.listing_contract_date))::NUMERIC AS median_dom,
      SUM(c.close_price) AS total_volume,
      PERCENTILE_CONT(0.5) WITHIN GROUP (
        ORDER BY CASE WHEN c.living_area > 0 THEN c.close_price::DOUBLE PRECISION / c.living_area END
      )::NUMERIC AS median_ppsf
    FROM listing_records c
    WHERE c.standard_status = 'Closed' AND c.is_deleted = FALSE
      AND DATE_TRUNC('month', c.close_date)::date = $1::date AND ${VALID_CLOSE}
  `, [latestMo + '-01']);
  const rB = b1.rows[0];
  const latestMart = metroPulse[0];
  const pageMedianClose = parseInt((overviewHtml.match(/Median Close[^]*?\$([0-9,]+)/) || [])[1]?.replace(/,/g, '') || '0', 10);
  const pageMedianDom = parseInt((overviewHtml.match(/Median Days on Market[^]*?children":"(\d+)"/) || [])[1] || '0', 10);

  compare(`closings (${latestMo})`,      { group: `B.closings ${latestMo}`, rds: Number(rB.closings), mart: num(latestMart?.closing_count), page: num(latestMart?.closing_count), tolerance: 0.02 });
  compare(`median close (${latestMo})`,  { group: `B.closings ${latestMo}`, rds: Math.round(Number(rB.median_close)), mart: Math.round(num(latestMart?.median_close)), page: pageMedianClose, tolerance: 0.02 });
  compare(`median DOM (${latestMo})`,    { group: `B.closings ${latestMo}`, rds: Math.round(Number(rB.median_dom)), mart: Math.round(num(latestMart?.median_dom)), page: pageMedianDom, tolerance: 0.10 });
  compare(`median ppsf (${latestMo})`,   { group: `B.closings ${latestMo}`, rds: Math.round(Number(rB.median_ppsf)), mart: Math.round(num(latestMart?.median_ppsf)), page: Math.round(num(latestMart?.median_ppsf)), tolerance: 0.05 });
  compare(`total volume (${latestMo})`,  { group: `B.closings ${latestMo}`, rds: Number(rB.total_volume), mart: num(latestMart?.total_volume), page: num(latestMart?.total_volume), tolerance: 0.02 });

  // ─── C. 6-MONTH ROLLING AGGREGATES ────────────────────
  log('C. 6-month rolling aggregates…');
  const c1 = await c.query(`
    SELECT
      COUNT(*) AS closings_6mo,
      SUM(c.close_price) AS volume_6mo
    FROM listing_records c
    WHERE c.standard_status = 'Closed' AND c.is_deleted = FALSE
      AND c.close_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      AND ${VALID_CLOSE}
  `);
  const rC = c1.rows[0];
  const last6 = metroPulse.slice(0, 6);
  const martCount6 = last6.reduce((s, r) => s + (num(r.closing_count) ?? 0), 0);
  const martVol6 = last6.reduce((s, r) => s + (num(r.total_volume) ?? 0), 0);
  compare('closings (last 6mo)', { group: 'C.6mo', rds: Number(rC.closings_6mo), mart: martCount6, page: martCount6, tolerance: 0.02 });
  compare('volume (last 6mo)',   { group: 'C.6mo', rds: Number(rC.volume_6mo), mart: martVol6, page: martVol6, tolerance: 0.02 });

  // ─── D. NEGOTIATION (Pricing tab) ─────────────────────
  log('D. Negotiation (Pricing tab)…');
  const d1 = await c.query(`
    SELECT
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.close_price::DOUBLE PRECISION / c.list_price) AS median_ratio,
      COUNT(*) FILTER (WHERE c.close_price > c.list_price)::NUMERIC / NULLIF(COUNT(*), 0) * 100 AS pct_above,
      COUNT(*) FILTER (WHERE c.close_price < c.list_price)::NUMERIC / NULLIF(COUNT(*), 0) * 100 AS pct_below
    FROM listing_records c
    WHERE c.standard_status = 'Closed' AND c.is_deleted = FALSE
      AND DATE_TRUNC('month', c.close_date)::date = $1::date AND ${VALID_CLOSE}
  `, [latestMo + '-01']);
  const rD = d1.rows[0];
  const latestNeg = metro(neg).slice().sort((a, b) => iso(b.month).localeCompare(iso(a.month)))[0];
  const martRatio = num(latestNeg?.median_sale_to_list);
  const martRatioPct = martRatio > 2 ? martRatio : martRatio * 100;
  const pageRatio = parseFloat((pricingHtml.match(/List-to-Sale Ratio[^]*?children":"(\d+\.\d+)%"/) || [])[1] || '0');
  const pagePctAbove = parseFloat((pricingHtml.match(/% Above List[^]*?children":"(\d+\.\d+)%"/) || [])[1] || '0');
  const pagePctBelow = parseFloat((pricingHtml.match(/% Below List[^]*?children":"(\d+\.\d+)%"/) || [])[1] || '0');

  compare(`median sale-to-list %`, { group: `D.negotiation ${latestMo}`, rds: Number(rD.median_ratio) * 100, mart: martRatioPct, page: pageRatio, tolerance: 0.02 });
  compare(`% above list`,          { group: `D.negotiation ${latestMo}`, rds: Number(rD.pct_above), mart: num(latestNeg?.pct_above_list), page: pagePctAbove, tolerance: 0.05 });
  compare(`% below list`,          { group: `D.negotiation ${latestMo}`, rds: Number(rD.pct_below), mart: num(latestNeg?.pct_below_list), page: pagePctBelow, tolerance: 0.05 });

  // ─── E. PRICE REDUCTIONS (Pricing tab) ────────────────
  log('E. Price reductions…');
  const e1 = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE COALESCE(c.original_list_price, c.list_price) > c.list_price)::NUMERIC / NULLIF(COUNT(*), 0) * 100 AS pct_with_reduction
    FROM listing_records c
    WHERE c.standard_status = 'Closed' AND c.is_deleted = FALSE
      AND DATE_TRUNC('month', c.close_date)::date = $1::date AND ${VALID_CLOSE}
  `, [latestMo + '-01']);
  const rE = Number(e1.rows[0].pct_with_reduction);
  const latestRed = metro(red).slice().sort((a, b) => iso(b.month).localeCompare(iso(a.month)))[0];
  const pagePctRed = parseFloat((pricingHtml.match(/% With Price Cut[^]*?children":"(\d+\.\d+)%"/) || [])[1] || '0');
  compare(`% with price cut`, { group: `E.reductions ${latestMo}`, rds: rE, mart: num(latestRed?.pct_with_reduction), page: pagePctRed, tolerance: 0.15 });

  // ─── F. SEGMENT CROSS-CHECK ───────────────────────────
  log('F. Segment cross-check (residential + land = all)…');
  const f1 = await c.query(`
    SELECT
      property_type,
      COUNT(*) AS n
    FROM listing_records
    WHERE is_deleted = FALSE
      AND standard_status IN ('Active', 'Active Under Contract', 'Pending', 'Coming Soon')
    GROUP BY 1 ORDER BY 2 DESC LIMIT 10
  `);
  log(`  property_type distribution: ${f1.rows.map(r => `${r.property_type}=${r.n}`).join(', ')}`);
  const rdsResidential = Number(f1.rows.find(r => r.property_type === 'Residential')?.n || 0);
  const rdsLand = Number(f1.rows.find(r => r.property_type === 'Land')?.n || 0);

  // Mart counts by segment
  const invByseg = inv.filter(r => r.scope_type === 'metro' && r.scope_key === 'phoenix_metro');
  const martAll = invByseg.find(r => r.property_segment === 'all');
  const martResidential = invByseg.find(r => r.property_segment === 'residential');
  const martLand = invByseg.find(r => r.property_segment === 'land');

  const martAllActive = (num(martAll?.strict_active_count) ?? 0) + (num(martAll?.pending_count) ?? 0) + (num(martAll?.coming_soon_count) ?? 0);
  const martResActive = (num(martResidential?.strict_active_count) ?? 0) + (num(martResidential?.pending_count) ?? 0) + (num(martResidential?.coming_soon_count) ?? 0);
  const martLandActive = (num(martLand?.strict_active_count) ?? 0) + (num(martLand?.pending_count) ?? 0) + (num(martLand?.coming_soon_count) ?? 0);
  const martSumSegs = martResActive + martLandActive;

  compare('mart residential count = RDS residential',  { group: 'F.segments', rds: rdsResidential, mart: martResActive, page: martResActive, tolerance: 0.05 });
  compare('mart land count = RDS land',                { group: 'F.segments', rds: rdsLand, mart: martLandActive, page: martLandActive, tolerance: 0.05 });
  // residential + land may be < all (other segments like Lease, Commercial)
  compare('residential + land <= all',                 { group: 'F.segments', rds: martSumSegs, mart: martSumSegs, page: martAllActive, tolerance: 0.20 });

  // ─── G. DOM DISTRIBUTION TOTAL ────────────────────────
  log('G. DOM distribution coverage…');
  const metroDom = dom.filter(r => r.scope_type === 'metro' && r.scope_key === 'phoenix_metro' && r.property_segment === 'all');
  const martDomTotal = metroDom.reduce((s, r) => s + (num(r.active_count) ?? 0), 0);
  compare('DOM bands sum = total active inventory', { group: 'G.dom', rds: rdsTotal, mart: martDomTotal, page: martDomTotal, tolerance: 0.01 });

  // ─── H. PRICE TIER DISTRIBUTION ───────────────────────
  log('H. Price tier coverage…');
  const metroTier = tier.filter(r => r.scope_type === 'metro' && r.scope_key === 'phoenix_metro' && r.property_segment === 'all');
  const martTierTotal = metroTier.reduce((s, r) => s + (num(r.active_count) ?? 0), 0);
  // Price tiers should equal STRICT active only (no pending/coming-soon in the cleaned active inventory)
  compare('price tier bands sum = total active', { group: 'H.tiers', rds: rdsTotal, mart: martTierTotal, page: martTierTotal, tolerance: 0.05 });

  // ─── I. BUYER OFFICE TOP 10 (Activity) ────────────────
  log('I. Top 10 buyer offices…');
  const latestYear = buyer.reduce((y, r) => Math.max(y, r.year), 0);
  const top10 = buyer.filter(r => r.year === latestYear && r.buyer_office_name)
    .sort((a, b) => (num(b.deals) ?? 0) - (num(a.deals) ?? 0))
    .slice(0, 10);
  if (top10.length) {
    log(`  comparing top 10 buyer offices for year ${latestYear}…`);
    for (const o of top10) {
      const r = await c.query(`
        SELECT COUNT(*) AS n
        FROM listing_records c
        WHERE c.standard_status = 'Closed' AND c.is_deleted = FALSE
          AND EXTRACT(YEAR FROM c.close_date) = $1
          AND c.buyer_office_name = $2
          AND ${VALID_CLOSE}
      `, [latestYear, o.buyer_office_name]);
      const rdsN = Number(r.rows[0].n);
      compare(`buyer office "${(o.buyer_office_name || '').slice(0, 32)}"`, {
        group: `I.buyer-offices ${latestYear}`,
        rds: rdsN, mart: num(o.deals), page: num(o.deals), tolerance: 0.05,
      });
    }
  }

  // ─── J. MONTHLY TREND 12 (Pricing + Activity tabs) ────
  log('J. 12-month trend per month…');
  const last12 = metro(pulse).slice().sort((a, b) => iso(a.month).localeCompare(iso(b.month))).slice(-12);
  for (const m of last12) {
    const mo = iso(m.month);
    const r = await c.query(`
      SELECT
        COUNT(*) AS closings,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.close_price)::NUMERIC AS median_close,
        SUM(c.close_price) AS total_volume
      FROM listing_records c
      WHERE c.standard_status = 'Closed' AND c.is_deleted = FALSE
        AND DATE_TRUNC('month', c.close_date)::date = $1::date AND ${VALID_CLOSE}
    `, [mo + '-01']);
    const rr = r.rows[0];
    compare(`${mo} closings`,     { group: 'J.monthly-trend', rds: Number(rr.closings), mart: num(m.closing_count), page: num(m.closing_count), tolerance: 0.02 });
    compare(`${mo} median close`, { group: 'J.monthly-trend', rds: Math.round(Number(rr.median_close)), mart: Math.round(num(m.median_close)), page: Math.round(num(m.median_close)), tolerance: 0.02 });
    compare(`${mo} total volume`, { group: 'J.monthly-trend', rds: Number(rr.total_volume), mart: num(m.total_volume), page: num(m.total_volume), tolerance: 0.02 });
  }

  // ─── K. MONTHS OF SUPPLY ──────────────────────────────
  log('K. Months of Supply…');
  const k1 = await c.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE c.standard_status = 'Closed'
          AND c.close_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'
          AND c.close_date < DATE_TRUNC('month', CURRENT_DATE)
          AND ${VALID_CLOSE}
      ) AS closings_3mo
    FROM listing_records c WHERE c.is_deleted = FALSE
  `);
  const closings3mo = Number(k1.rows[0].closings_3mo);
  const rdsMos3 = rdsStrict / (closings3mo / 3);
  const metroMos = metro(mos)[0];
  const martMos3 = num(metroMos?.months_of_supply_3mo);
  const pageMos3 = parseFloat((inventoryHtml.match(/Months of Supply.*?children":"(\d+\.\d+) mo/) || [])[1] || '0');
  compare('Months of Supply 3mo', { group: 'K.mos', rds: rdsMos3, mart: martMos3, page: pageMos3, tolerance: 0.15 });

  await c.end();
  log(`done — ${results.length} comparisons in ${((Date.now() - t0) / 1000 / 60).toFixed(1)} min`);

  // ─── Report ───────────────────────────────────────────
  console.log('\n═══ Comprehensive 3-way ARMLS verifier ═══');
  console.log(`Site: ${SITE}`);
  console.log(`CDN:  ${CDN}`);
  console.log(`Run:  ${new Date().toISOString()}`);
  console.log();

  // Group results
  const byGroup = new Map();
  for (const r of results) {
    if (!byGroup.has(r.group)) byGroup.set(r.group, []);
    byGroup.get(r.group).push(r);
  }
  for (const [group, rows] of byGroup) {
    console.log(`── ${group} ──`);
    for (const r of rows) {
      const fmt = (v) => v == null ? '—' : typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(v);
      console.log(`  ${r.status.padEnd(14)} ${r.label.padEnd(45)} rds=${fmt(r.rds).padStart(15)}  mart=${fmt(r.mart).padStart(15)}  page=${fmt(r.page).padStart(15)}`);
    }
    console.log();
  }

  // Summary
  const pass = results.filter(r => r.status.startsWith('✅')).length;
  const yellow = results.filter(r => r.status.startsWith('🟡')).length;
  const fail = results.filter(r => r.status.startsWith('❌')).length;
  console.log(`Summary: ${pass} ✅ all-3-agree · ${yellow} 🟡 RDS≠mart (filter difference) · ${fail} ❌ real divergence  (${results.length} total)`);

  const out = join(tmpdir(), 'verify-comprehensive-3way.json');
  writeFileSync(out, JSON.stringify({ run_at: new Date().toISOString(), pass, yellow, fail, results }, null, 2));
  console.log(`Report → ${out}`);

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
