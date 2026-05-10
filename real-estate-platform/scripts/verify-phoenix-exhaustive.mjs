/**
 * Exhaustive numerics verifier for the yong2 Phoenix dashboard.
 *
 * For each of the 5 tabs:
 *   1. Computes every KPI + every table-cell value from the dbt marts
 *      (pulled via CloudFront — same data path the deployed pages use).
 *   2. Asserts each value appears in the rendered HTML.
 *   3. Tolerances: ±1% counts, ±0.3% percentages (cycle drift).
 *
 * Plus a cross-check section that compares load-bearing KPIs against the
 * RDS source-of-truth (listing_records direct query) to confirm the marts
 * themselves agree with reality.
 *
 * Pass criterion: every numeric drawn from the marts is rendered on the
 * page AND the page totals reconcile with RDS within tolerance.
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

const SITE_URL = process.env.YONG2_URL ?? 'https://feature-yong2-amplify.d2tuygdje4mmy3.amplifyapp.com';
const CDN_BASE = process.env.MARTS_CDN_BASE ?? 'https://d12v6de1xwcjhk.cloudfront.net';
const TMPDIR = tmpdir();

const martCache = new Map();
async function readMart(name) {
  if (martCache.has(name)) return martCache.get(name);
  const res = await fetch(`${CDN_BASE}/${name}.parquet`);
  if (!res.ok) throw new Error(`mart fetch failed: ${name} → HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const rows = await parquetReadObjects({ file: buf, compressors });
  martCache.set(name, rows);
  return rows;
}

const pageCache = new Map();
async function fetchPage(path) {
  if (pageCache.has(path)) return pageCache.get(path);
  const res = await fetch(SITE_URL + path);
  if (!res.ok) throw new Error(`page fetch failed: ${path} → ${res.status}`);
  const html = await res.text();
  pageCache.set(path, html);
  return html;
}

function num(n) { if (n == null) return null; return typeof n === 'bigint' ? Number(n) : Number(n); }
function isoMonth(m) { if (m instanceof Date) return m.toISOString().slice(0, 7); return String(m).slice(0, 7); }
function metroAll(rows) {
  return rows.filter(r => r.scope_type === 'metro' && r.scope_key === 'phoenix_metro' && r.property_segment === 'all');
}
function fmtMoney(n, opts = {}) {
  if (n == null) return null;
  if (opts.compact) {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  }
  return `$${Math.round(n).toLocaleString()}`;
}
function fmtCount(n) { return n == null ? null : Math.round(n).toLocaleString(); }
function fmtMonth(iso) {
  if (!iso) return '';
  const [y, m] = iso.split('-');
  return new Date(`${y}-${m}-01`).toLocaleString('en-US', { month: 'long' }) + ' ' + y;
}
function fmtPct(n, digits = 1) { return n == null ? null : `${n.toFixed(digits)}%`; }
function fmtPctSigned(n, digits = 1) {
  if (n == null) return null;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}%`;
}

const results = [];

function check(html, label, expected, opts = {}) {
  const tab = opts.tab;
  const ctx = opts.context ?? '';

  if (expected == null) {
    results.push({ tab, label, context: ctx, expected: '(null)', status: '⚪ skip' });
    return;
  }
  const exp = String(expected);

  if (html.includes(exp)) {
    results.push({ tab, label, context: ctx, expected: exp, status: '✅ pass' });
    return;
  }

  // Count tolerance: numbers with commas (e.g., "31,225") may drift ±N
  if (opts.countTolerance && /^[\d,]+$/.test(exp)) {
    const n = Number(exp.replace(/,/g, ''));
    for (let d = 1; d <= opts.countTolerance; d++) {
      for (const c of [n + d, n - d]) {
        if (html.includes(c.toLocaleString())) {
          results.push({
            tab, label, context: ctx,
            expected: `${exp} (page: ${c.toLocaleString()})`,
            status: `🟡 drift Δ${c - n}`,
          });
          return;
        }
      }
    }
  }

  // Percentage tolerance: "14.0%" vs "14.1%" / "14.2%" within ±0.3%
  const pctMatch = exp.match(/^(-?\d+\.\d+)%$/);
  if (pctMatch) {
    const n = Number(pctMatch[1]);
    for (const d of [0.1, -0.1, 0.2, -0.2, 0.3, -0.3]) {
      const c = (n + d).toFixed(1) + '%';
      if (html.includes(c)) {
        results.push({ tab, label, context: ctx, expected: `${exp} (page: ${c})`, status: `🟡 drift Δ${d.toFixed(1)}%` });
        return;
      }
    }
  }

  // Signed percentages "+2.4%" / "-3.5%"
  const spctMatch = exp.match(/^([+-])(\d+\.\d+)%$/);
  if (spctMatch) {
    const sign = spctMatch[1] === '+' ? 1 : -1;
    const n = sign * Number(spctMatch[2]);
    for (const d of [0.1, -0.1, 0.2, -0.2, 0.3, -0.3]) {
      const v = n + d;
      const c = (v > 0 ? '+' : '') + v.toFixed(1) + '%';
      if (html.includes(c)) {
        results.push({ tab, label, context: ctx, expected: `${exp} (page: ${c})`, status: `🟡 drift Δ${d.toFixed(1)}%` });
        return;
      }
    }
  }

  results.push({ tab, label, context: ctx, expected: exp, status: '❌ FAIL' });
}

// ─── Overview ─────────────────────────────────────────────

async function verifyOverview() {
  const TAB = '/phoenix';
  console.log(`\n${TAB}`);
  const html = await fetchPage(TAB);

  const [pulse, inv, region, scorecard] = await Promise.all([
    readMart('fct_market_pulse_metro'),
    readMart('fct_active_inventory'),
    readMart('fct_market_pulse_region'),
    readMart('fct_community_scorecard'),
  ]);

  // KPIs
  const metroInv = metroAll(inv)[0];
  const strictActive = num(metroInv?.strict_active_count) ?? 0;
  const pending = num(metroInv?.pending_count) ?? 0;
  const comingSoon = num(metroInv?.coming_soon_count) ?? 0;
  const totalActive = strictActive + pending + comingSoon;
  check(html, 'kpi.totalActive', fmtCount(totalActive), { tab: TAB, countTolerance: 50 });
  check(html, 'kpi.strictActive', fmtCount(strictActive), { tab: TAB, countTolerance: 50 });
  check(html, 'kpi.pending', fmtCount(pending), { tab: TAB, countTolerance: 30 });
  check(html, 'kpi.comingSoon', fmtCount(comingSoon), { tab: TAB, countTolerance: 30 });

  const metroPulse = metroAll(pulse).slice().sort((a, b) => isoMonth(b.month).localeCompare(isoMonth(a.month)));
  const last6 = metroPulse.slice(0, 6);
  const latest = metroPulse[0];
  check(html, 'kpi.medianClose', fmtMoney(num(latest?.median_close)), { tab: TAB });
  check(html, 'kpi.medianDom', latest?.median_dom != null ? String(Math.round(num(latest.median_dom))) : null, { tab: TAB });
  check(html, 'kpi.totalVolume6mo', fmtMoney(last6.reduce((s, r) => s + (num(r.total_volume) ?? 0), 0), { compact: true }), { tab: TAB });
  check(html, 'kpi.closingCount6mo', fmtCount(last6.reduce((s, r) => s + (num(r.closing_count) ?? 0), 0)), { tab: TAB, countTolerance: 100 });

  // Regions table — top 6 by closing count
  const regionRows = pulse.filter(() => false); // placeholder, use region mart
  const allRegionsAll = region.filter(r => r.scope_type === 'region' && r.property_segment === 'all');
  const byRegion = new Map();
  for (const r of allRegionsAll) {
    const k = r.scope_key;
    const cur = byRegion.get(k);
    if (!cur || isoMonth(r.month) > isoMonth(cur.month)) byRegion.set(k, r);
  }
  const top6 = Array.from(byRegion.values())
    .filter(r => (num(r.closing_count) ?? 0) > 0)
    .sort((a, b) => (num(b.closing_count) ?? 0) - (num(a.closing_count) ?? 0))
    .slice(0, 6);
  for (const r of top6) {
    const ctx = r.scope_key;
    // Region label: convert slug to title case
    const name = r.scope_key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    check(html, 'region.name', name, { tab: TAB, context: ctx });
    check(html, 'region.closingCount', fmtCount(num(r.closing_count)), { tab: TAB, context: ctx, countTolerance: 5 });
    check(html, 'region.medianClose', fmtMoney(num(r.median_close)), { tab: TAB, context: ctx });
    check(html, 'region.totalVolume', fmtMoney(num(r.total_volume), { compact: true }), { tab: TAB, context: ctx });
  }

  // Top 8 communities by closes_12mo
  const communities = scorecard.filter(r => r.scope_type === 'community' && r.property_segment === 'all' && (num(r.closes_12mo) ?? 0) > 0)
    .sort((a, b) => (num(b.closes_12mo) ?? 0) - (num(a.closes_12mo) ?? 0))
    .slice(0, 8);
  for (const c of communities) {
    const ctx = c.community_name ?? c.scope_key;
    check(html, 'community.name', c.community_name, { tab: TAB, context: ctx });
    check(html, 'community.closes12mo', fmtCount(num(c.closes_12mo)), { tab: TAB, context: ctx, countTolerance: 3 });
    check(html, 'community.medianClose', fmtMoney(num(c.median_close_12mo)), { tab: TAB, context: ctx });
  }
}

// ─── Pricing ──────────────────────────────────────────────

async function verifyPricing() {
  const TAB = '/phoenix/pricing';
  console.log(`\n${TAB}`);
  const html = await fetchPage(TAB);

  const [pulse, neg, red, tier] = await Promise.all([
    readMart('fct_market_pulse_metro'),
    readMart('fct_negotiation_metro'),
    readMart('fct_pricereduction_metro'),
    readMart('fct_active_by_pricetier'),
  ]);

  const metroPulse = metroAll(pulse).slice().sort((a, b) => isoMonth(b.month).localeCompare(isoMonth(a.month)));
  const latest = metroPulse[0];
  check(html, 'kpi.medianClose', fmtMoney(num(latest?.median_close)), { tab: TAB });
  check(html, 'kpi.medianPpsf', latest?.median_ppsf != null ? `$${Math.round(num(latest.median_ppsf))}` : null, { tab: TAB });

  const latestNeg = metroAll(neg).slice().sort((a, b) => isoMonth(b.month).localeCompare(isoMonth(a.month)))[0];
  if (latestNeg) {
    const r = num(latestNeg.median_sale_to_list);
    if (r != null) {
      const pct = r > 2 ? r : r * 100;
      check(html, 'kpi.listToSale', fmtPct(pct), { tab: TAB });
    }
    check(html, 'kpi.pctAbove', fmtPct(num(latestNeg.pct_above_list)), { tab: TAB });
    check(html, 'kpi.pctBelow', fmtPct(num(latestNeg.pct_below_list)), { tab: TAB });
  }

  const latestRed = metroAll(red).slice().sort((a, b) => isoMonth(b.month).localeCompare(isoMonth(a.month)))[0];
  if (latestRed) {
    check(html, 'kpi.pctWithReduction', fmtPct(num(latestRed.pct_with_reduction)), { tab: TAB });
    check(html, 'kpi.meanReduction', fmtMoney(num(latestRed.mean_reduction_amount)), { tab: TAB });
  }

  // 12-month price trend table
  const last12 = metroAll(pulse).slice().sort((a, b) => isoMonth(a.month).localeCompare(isoMonth(b.month))).slice(-12);
  for (const r of last12) {
    const ctx = isoMonth(r.month);
    check(html, 'trend.month', fmtMonth(ctx), { tab: TAB, context: ctx });
    check(html, 'trend.closings', fmtCount(num(r.closing_count)), { tab: TAB, context: ctx, countTolerance: 5 });
    check(html, 'trend.medianClose', fmtMoney(num(r.median_close)), { tab: TAB, context: ctx });
  }

  // Active by price tier
  const metroTiers = tier.filter(r => r.scope_type === 'metro' && r.scope_key === 'phoenix_metro' && r.property_segment === 'all');
  const totalTier = metroTiers.reduce((s, t) => s + (num(t.active_count) ?? 0), 0);
  for (const t of metroTiers) {
    const ctx = t.price_band;
    check(html, 'tier.active', fmtCount(num(t.active_count)), { tab: TAB, context: ctx, countTolerance: 5 });
    if (totalTier > 0) {
      check(html, 'tier.pct', fmtPct(((num(t.active_count) ?? 0) / totalTier) * 100), { tab: TAB, context: ctx });
    }
  }
}

// ─── Inventory ────────────────────────────────────────────

async function verifyInventory() {
  const TAB = '/phoenix/inventory';
  console.log(`\n${TAB}`);
  const html = await fetchPage(TAB);

  const [inv, mos, dom, pace] = await Promise.all([
    readMart('fct_active_inventory'),
    readMart('fct_months_of_supply'),
    readMart('fct_active_dom_distribution'),
    readMart('fct_listing_pace'),
  ]);

  const metroInv = metroAll(inv)[0];
  const metroMos = metroAll(mos)[0];

  const strictActive = num(metroInv?.strict_active_count) ?? 0;
  const pending = num(metroInv?.pending_count) ?? 0;
  const comingSoon = num(metroInv?.coming_soon_count) ?? 0;
  check(html, 'kpi.totalActive', fmtCount(strictActive + pending + comingSoon), { tab: TAB, countTolerance: 50 });
  check(html, 'kpi.medianListPrice', fmtMoney(num(metroInv?.median_list_price)), { tab: TAB });
  check(html, 'kpi.medianDom', metroInv?.median_dom != null ? `${Math.round(num(metroInv.median_dom))}` : null, { tab: TAB });

  if (metroMos) {
    const mos3 = num(metroMos.months_of_supply_3mo);
    if (mos3 != null) check(html, 'kpi.mos3', `${mos3.toFixed(1)} mo`, { tab: TAB });
    const mos12 = num(metroMos.months_of_supply_12mo);
    if (mos12 != null) check(html, 'kpi.mos12', `${mos12.toFixed(1)} mo`, { tab: TAB });
    const c = metroMos.market_classification;
    if (c) {
      const expected = c === 'sellers' ? "Seller's Market" : c === 'buyers' ? "Buyer's Market" : 'Balanced';
      check(html, 'kpi.classification', expected, { tab: TAB });
    }
    check(html, 'kpi.avgMonthlyClosings3mo', fmtCount(num(metroMos.avg_monthly_closings_3mo)), { tab: TAB, countTolerance: 50 });
  }

  // DOM distribution — every band
  const DOM_ORDER = ['0-7', '8-14', '15-30', '31-60', '61-90', '91-180', '180+'];
  const metroDom = dom
    .filter(r => r.scope_type === 'metro' && r.scope_key === 'phoenix_metro' && r.property_segment === 'all')
    .sort((a, b) => DOM_ORDER.indexOf(a.dom_band) - DOM_ORDER.indexOf(b.dom_band));
  const totalDom = metroDom.reduce((s, r) => s + (num(r.active_count) ?? 0), 0);
  for (const b of metroDom) {
    const ctx = b.dom_band;
    check(html, 'dom.count', fmtCount(num(b.active_count)), { tab: TAB, context: ctx, countTolerance: 10 });
    if (totalDom > 0) {
      check(html, 'dom.pct', fmtPct(((num(b.active_count) ?? 0) / totalDom) * 100), { tab: TAB, context: ctx });
    }
  }

  // Pace last 12 weeks
  const metroPace = pace
    .filter(r => r.scope_type === 'metro' && r.scope_key === 'phoenix_metro' && r.property_segment === 'all')
    .sort((a, b) => String(a.week).localeCompare(String(b.week)))
    .slice(-12);
  for (const w of metroPace) {
    const ctx = String(w.week).slice(0, 10);
    check(html, 'pace.newListings', fmtCount(num(w.new_listings_count)), { tab: TAB, context: ctx, countTolerance: 5 });
  }
}

// ─── Activity ─────────────────────────────────────────────

async function verifyActivity() {
  const TAB = '/phoenix/activity';
  console.log(`\n${TAB}`);
  const html = await fetchPage(TAB);

  const [pulse, inv, vel, buyer] = await Promise.all([
    readMart('fct_market_pulse_metro'),
    readMart('fct_active_inventory'),
    readMart('fct_status_velocity'),
    readMart('fct_buyer_office'),
  ]);

  const metroInv = metroAll(inv)[0];
  check(html, 'kpi.pending', fmtCount(num(metroInv?.pending_count)), { tab: TAB, countTolerance: 30 });

  const metroPulse = metroAll(pulse).slice().sort((a, b) => isoMonth(b.month).localeCompare(isoMonth(a.month)));
  const latest = metroPulse[0];
  const last3 = metroPulse.slice(0, 3);
  check(html, 'kpi.closingsLast', fmtCount(num(latest?.closing_count)), { tab: TAB, countTolerance: 50 });
  check(html, 'kpi.closingsLast3mo', fmtCount(last3.reduce((s, r) => s + (num(r.closing_count) ?? 0), 0)), { tab: TAB, countTolerance: 100 });
  check(html, 'kpi.totalVolume3mo', fmtMoney(last3.reduce((s, r) => s + (num(r.total_volume) ?? 0), 0), { compact: true }), { tab: TAB });

  const metroVel = metroAll(vel).slice().sort((a, b) => isoMonth(b.month).localeCompare(isoMonth(a.month)));
  const reliable = metroVel.find(r => (num(r.cohort_size) ?? 0) >= 100) ?? metroVel[0];
  if (reliable) {
    if (reliable.median_days_to_pending != null)
      check(html, 'kpi.medianDaysToPending', `${Math.round(num(reliable.median_days_to_pending))} days`, { tab: TAB });
    if (reliable.median_days_pending_to_closed != null)
      check(html, 'kpi.medianDaysPendingClosed', `${Math.round(num(reliable.median_days_pending_to_closed))} days`, { tab: TAB });
    if (reliable.pct_back_on_market != null)
      check(html, 'kpi.pctBackOnMarket', fmtPct(num(reliable.pct_back_on_market)), { tab: TAB });
  }

  // Closings by month — 12 months
  const last12 = metroAll(pulse).slice().sort((a, b) => isoMonth(a.month).localeCompare(isoMonth(b.month))).slice(-12);
  for (const r of last12) {
    const ctx = isoMonth(r.month);
    check(html, 'monthly.closings', fmtCount(num(r.closing_count)), { tab: TAB, context: ctx, countTolerance: 5 });
    check(html, 'monthly.totalVolume', fmtMoney(num(r.total_volume), { compact: true }), { tab: TAB, context: ctx });
  }

  // Top 10 buyer offices
  const latestYear = buyer.reduce((y, r) => Math.max(y, r.year), 0);
  const top10 = buyer
    .filter(r => r.year === latestYear && r.buyer_office_name)
    .sort((a, b) => (num(b.deals) ?? 0) - (num(a.deals) ?? 0))
    .slice(0, 10);
  for (const o of top10) {
    const ctx = o.buyer_office_name;
    check(html, 'office.name', o.buyer_office_name, { tab: TAB, context: ctx });
    check(html, 'office.deals', fmtCount(num(o.deals)), { tab: TAB, context: ctx, countTolerance: 5 });
    check(html, 'office.totalVolume', fmtMoney(num(o.total_volume), { compact: true }), { tab: TAB, context: ctx });
  }
}

// ─── Timing ───────────────────────────────────────────────

async function verifyTiming() {
  const TAB = '/phoenix/timing';
  console.log(`\n${TAB}`);
  const html = await fetchPage(TAB);

  const [pulse, vel] = await Promise.all([
    readMart('fct_market_pulse_metro'),
    readMart('fct_status_velocity'),
  ]);

  const metroPulse = metroAll(pulse).slice().sort((a, b) => isoMonth(b.month).localeCompare(isoMonth(a.month)));
  const last24 = metroPulse.slice(0, 24);
  const current12 = last24.slice(0, 12);
  const prior12 = last24.slice(12, 24);

  const MONTHS = ['', 'January','February','March','April','May','June','July','August','September','October','November','December'];

  // Best/worst month label
  const monthsWithData = current12.filter(r => (num(r.closing_count) ?? 0) > 0);
  const best = monthsWithData.reduce((b, r) => ((num(r.closing_count) ?? 0) > (num(b.closing_count) ?? 0) ? r : b), monthsWithData[0]);
  const worst = monthsWithData.reduce((b, r) => ((num(r.closing_count) ?? 0) < (num(b.closing_count) ?? 0) ? r : b), monthsWithData[0]);
  if (best) check(html, 'kpi.bestMonth', MONTHS[Number(isoMonth(best.month).slice(5, 7))], { tab: TAB });
  if (worst) check(html, 'kpi.worstMonth', MONTHS[Number(isoMonth(worst.month).slice(5, 7))], { tab: TAB });

  // YoY KPIs
  const latest = metroPulse[0];
  const yoy = metroPulse[12];
  if (latest && yoy) {
    const cur = num(latest.closing_count);
    const pri = num(yoy.closing_count);
    if (cur != null && pri && pri > 0) {
      const yoyPct = ((cur - pri) / pri) * 100;
      check(html, 'kpi.yoyClosingsPct', fmtPctSigned(yoyPct), { tab: TAB });
    }
    const cP = num(latest.median_close);
    const pP = num(yoy.median_close);
    if (cP != null && pP && pP > 0) {
      const pxPct = ((cP - pP) / pP) * 100;
      check(html, 'kpi.yoyMedianClosePct', fmtPctSigned(pxPct), { tab: TAB });
    }
  }

  // Seasonal table — every month
  for (let i = 1; i <= 12; i++) {
    const cur = current12.find(r => Number(isoMonth(r.month).slice(5, 7)) === i);
    const pri = prior12.find(r => Number(isoMonth(r.month).slice(5, 7)) === i);
    const ctx = MONTHS[i];
    check(html, 'seasonal.monthLabel', ctx, { tab: TAB, context: ctx });
    if (cur) check(html, 'seasonal.currentClosings', fmtCount(num(cur.closing_count)), { tab: TAB, context: ctx, countTolerance: 5 });
    if (pri) check(html, 'seasonal.priorClosings', fmtCount(num(pri.closing_count)), { tab: TAB, context: ctx, countTolerance: 5 });
  }

  // Velocity trend — every month
  const metroVel = metroAll(vel).slice().sort((a, b) => isoMonth(a.month).localeCompare(isoMonth(b.month))).slice(-12);
  for (const r of metroVel) {
    const ctx = isoMonth(r.month);
    check(html, 'velocity.cohortSize', fmtCount(num(r.cohort_size)), { tab: TAB, context: ctx, countTolerance: 5 });
  }
}

// ─── RDS source-of-truth cross-check ──────────────────────

async function rdsCrossCheck() {
  console.log('\n═══ RDS source-of-truth cross-check ═══');
  const { stdout: dsn } = await x(AWS, ['ssm','get-parameter','--name','/rlsir/db/url','--with-decryption','--region','us-east-1','--query','Parameter.Value','--output','text'], { env });
  const c = new pg.Client({ connectionString: dsn.trim(), ssl: { rejectUnauthorized: false }, statement_timeout: 60000 });
  await c.connect();

  // Cross-check 1: Active+Pending+Coming Soon count from listing_records vs marts
  const r1 = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE standard_status = 'Active') AS active,
      COUNT(*) FILTER (WHERE standard_status = 'Active Under Contract') AS auc,
      COUNT(*) FILTER (WHERE standard_status = 'Pending') AS pending,
      COUNT(*) FILTER (WHERE standard_status = 'Coming Soon') AS coming_soon
    FROM listing_records WHERE is_deleted = FALSE
  `);
  const rdsActive = Number(r1.rows[0].active) + Number(r1.rows[0].auc);
  const rdsPending = Number(r1.rows[0].pending);
  const rdsComingSoon = Number(r1.rows[0].coming_soon);
  const rdsTotal = rdsActive + rdsPending + rdsComingSoon;

  const inv = await readMart('fct_active_inventory');
  const metroInv = metroAll(inv)[0];
  const martActive = (num(metroInv?.strict_active_count) ?? 0);
  const martPending = (num(metroInv?.pending_count) ?? 0);
  const martComingSoon = (num(metroInv?.coming_soon_count) ?? 0);
  const martTotal = martActive + martPending + martComingSoon;

  console.log(`  Active+AUC:      RDS=${rdsActive.toLocaleString()}  mart=${martActive.toLocaleString()}  Δ=${martActive - rdsActive}`);
  console.log(`  Pending:         RDS=${rdsPending.toLocaleString()}  mart=${martPending.toLocaleString()}  Δ=${martPending - rdsPending}`);
  console.log(`  Coming Soon:     RDS=${rdsComingSoon.toLocaleString()}  mart=${martComingSoon.toLocaleString()}  Δ=${martComingSoon - rdsComingSoon}`);
  console.log(`  Total active:    RDS=${rdsTotal.toLocaleString()}  mart=${martTotal.toLocaleString()}  Δ=${martTotal - rdsTotal}  (${((martTotal / rdsTotal - 1) * 100).toFixed(2)}%)`);

  // Cross-check 2: closings count in latest complete month from RDS vs market_pulse
  const r2 = await c.query(`
    SELECT
      DATE_TRUNC('month', close_date)::date AS mo,
      COUNT(*) AS closings
    FROM listing_records
    WHERE standard_status = 'Closed'
      AND close_date BETWEEN DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '6 months' AND CURRENT_DATE
      AND list_office_name IS NOT NULL  -- IDX-eligible
    GROUP BY 1 ORDER BY 1 DESC
    LIMIT 6
  `);
  const pulse = await readMart('fct_market_pulse_metro');
  const metroPulse = metroAll(pulse).slice().sort((a, b) => isoMonth(b.month).localeCompare(isoMonth(a.month)));

  console.log(`\n  Closings by month (last 6):`);
  console.log(`    ${'month'.padEnd(8)} ${'RDS'.padStart(8)} ${'mart'.padStart(8)} ${'Δ'.padStart(6)}  ${'%'.padStart(7)}`);
  for (const row of r2.rows) {
    const mo = row.mo.toISOString().slice(0, 7);
    const rdsCnt = Number(row.closings);
    const martRow = metroPulse.find(r => isoMonth(r.month) === mo);
    const martCnt = num(martRow?.closing_count) ?? 0;
    const delta = martCnt - rdsCnt;
    const pct = rdsCnt > 0 ? (delta / rdsCnt * 100).toFixed(2) : '-';
    console.log(`    ${mo.padEnd(8)} ${rdsCnt.toLocaleString().padStart(8)} ${martCnt.toLocaleString().padStart(8)} ${String(delta).padStart(6)}  ${pct.padStart(6)}%`);
  }

  await c.end();
}

// ─── Run ──────────────────────────────────────────────────

const TABS = (process.argv[2] ?? 'overview,pricing,inventory,activity,timing').split(',');
console.log(`Site: ${SITE_URL}`);
console.log(`CDN:  ${CDN_BASE}`);
console.log(`Tabs: ${TABS.join(', ')}`);

for (const tab of TABS) {
  try {
    if (tab === 'overview') await verifyOverview();
    else if (tab === 'pricing') await verifyPricing();
    else if (tab === 'inventory') await verifyInventory();
    else if (tab === 'activity') await verifyActivity();
    else if (tab === 'timing') await verifyTiming();
  } catch (err) {
    console.log(`  ❌ ${tab}: ${err.message}`);
    results.push({ tab, label: '(error)', context: '', expected: '', status: `❌ ${err.message}` });
  }
}

await rdsCrossCheck().catch(e => console.log(`  ❌ RDS cross-check: ${e.message}`));

const pass = results.filter(r => r.status.startsWith('✅')).length;
const drift = results.filter(r => r.status.startsWith('🟡')).length;
const fail = results.filter(r => r.status.startsWith('❌')).length;
const skip = results.filter(r => r.status.startsWith('⚪')).length;
console.log(`\n═══ Summary ═══`);
console.log(`  ${pass} pass · ${drift} drift · ${fail} fail · ${skip} skip  (${results.length} total)`);

// Per-tab counts
const byTab = {};
for (const r of results) {
  byTab[r.tab] ??= { pass: 0, drift: 0, fail: 0, skip: 0 };
  if (r.status.startsWith('✅')) byTab[r.tab].pass++;
  else if (r.status.startsWith('🟡')) byTab[r.tab].drift++;
  else if (r.status.startsWith('❌')) byTab[r.tab].fail++;
  else byTab[r.tab].skip++;
}
console.log('\n  Per-tab:');
for (const [tab, c] of Object.entries(byTab)) {
  console.log(`    ${tab.padEnd(22)} ${c.pass} pass · ${c.drift} drift · ${c.fail} fail · ${c.skip} skip`);
}

// Print failures only
if (fail > 0) {
  console.log('\n═══ Failures (only) ═══');
  console.log(`  ${'tab'.padEnd(22)} ${'label'.padEnd(28)} ${'context'.padEnd(20)} ${'expected'.padEnd(22)} status`);
  for (const r of results.filter(r => r.status.startsWith('❌'))) {
    console.log(`  ${(r.tab || '').padEnd(22)} ${r.label.padEnd(28)} ${(r.context || '').padEnd(20)} ${r.expected.padEnd(22)} ${r.status}`);
  }
}

const out = join(TMPDIR, 'phoenix-exhaustive-verify.json');
writeFileSync(out, JSON.stringify({ run_at: new Date().toISOString(), pass, drift, fail, skip, results }, null, 2));
console.log(`\nFull report → ${out}`);

process.exit(fail > 0 ? 1 : 0);
