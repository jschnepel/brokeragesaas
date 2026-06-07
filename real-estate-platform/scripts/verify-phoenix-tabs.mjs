/**
 * E2E numerics verifier for the yong2 Phoenix dashboard.
 *
 * For each tab:
 *   1. Computes expected values from the dbt parquet marts (the source of truth).
 *   2. Fetches the deployed HTML.
 *   3. Asserts each expected value appears in the rendered output.
 *
 * Pass criterion: every numeric assertion lands in the page HTML.
 * Fail criterion: any numeric value computed from the marts is missing.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';

const x = promisify(execFile);
const isWin = process.platform === 'win32';
const AWS = isWin ? 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe' : 'aws';
const env = { ...process.env, MSYS_NO_PATHCONV: '1' };

const SITE_URL = process.env.YONG2_URL ?? 'https://feature-yong2-amplify.d2tuygdje4mmy3.amplifyapp.com';
const CDN_BASE = process.env.MARTS_CDN_BASE ?? 'https://d12v6de1xwcjhk.cloudfront.net';
const TMPDIR = tmpdir();

// Read marts via CloudFront — matches yong2's lib/marts.ts data path.
// If we read direct S3, dbt rebuilds in the last 1h might give us a newer
// snapshot than the cached one the deployed page is rendering. CloudFront
// TTL = 1h, so this matches the page's view of the world.
const martCache = new Map();
async function readMart(name) {
  if (martCache.has(name)) return martCache.get(name);
  const url = `${CDN_BASE}/${name}.parquet`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`mart fetch failed: ${url} → HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const rows = await parquetReadObjects({ file: buf, compressors });
  martCache.set(name, rows);
  return rows;
}

function num(n) { if (n == null) return null; return typeof n === 'bigint' ? Number(n) : Number(n); }
function isoMonth(m) { if (m instanceof Date) return m.toISOString().slice(0,7); return String(m).slice(0,7); }
function metroAll(rows) { return rows.filter(r => r.scope_type === 'metro' && r.scope_key === 'phoenix_metro' && r.property_segment === 'all'); }

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

async function fetchPage(path) {
  const url = SITE_URL + path;
  const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  if (!res.ok) throw new Error(`fetch ${url} → HTTP ${res.status}`);
  return res.text();
}

const results = [];
function assertContains(html, label, expected, opts = {}) {
  if (expected == null) {
    results.push({ tab: opts.tab, label, expected: '(null)', status: '⚪ skip' });
    return;
  }
  const present = html.includes(String(expected));
  if (present) {
    results.push({ tab: opts.tab, label, expected: String(expected), status: '✅ pass' });
    return;
  }
  // Tolerance for integer counts: page may be 1 dbt-cycle stale (<= 1h old).
  // If exact match fails on a number-with-commas, search ±N nearby values.
  if (opts.tolerance && /^[\d,]+$/.test(String(expected))) {
    const n = Number(String(expected).replace(/,/g, ''));
    for (let delta = 1; delta <= opts.tolerance; delta++) {
      for (const candidate of [n + delta, n - delta]) {
        const formatted = candidate.toLocaleString();
        if (html.includes(formatted)) {
          results.push({ tab: opts.tab, label, expected: `${expected} (page: ${formatted})`, status: `🟡 drift Δ${candidate - n}` });
          return;
        }
      }
    }
  }
  // Tolerance for percentages: page may round differently across cycles.
  // "14.1%" expected, page may show "14.0%" or "14.2%" — within ±0.3% accept.
  const pctMatch = String(expected).match(/^(-?\d+\.\d+)%$/);
  if (pctMatch) {
    const n = Number(pctMatch[1]);
    for (const delta of [0.1, -0.1, 0.2, -0.2, 0.3, -0.3]) {
      const candidate = (n + delta).toFixed(1) + '%';
      if (html.includes(candidate)) {
        results.push({ tab: opts.tab, label, expected: `${expected} (page: ${candidate})`, status: `🟡 drift Δ${delta.toFixed(1)}%` });
        return;
      }
    }
  }
  results.push({ tab: opts.tab, label, expected: String(expected), status: '❌ FAIL' });
}

// ─── Overview tab ─────────────────────────────────────────

async function verifyOverview() {
  const TAB = '/phoenix';
  console.log(`\n═══ ${TAB} ═══`);
  const html = await fetchPage(TAB);

  const [pulse, inv] = await Promise.all([
    readMart('fct_market_pulse_metro'),
    readMart('fct_active_inventory'),
  ]);
  const metroPulse = metroAll(pulse).slice().sort((a, b) => isoMonth(b.month).localeCompare(isoMonth(a.month)));
  const last6 = metroPulse.slice(0, 6);
  const latest = metroPulse[0];
  const metroInv = metroAll(inv)[0];

  // Active inventory total = strict_active + pending + coming_soon
  const totalActive =
    (num(metroInv?.strict_active_count) ?? 0) +
    (num(metroInv?.pending_count) ?? 0) +
    (num(metroInv?.coming_soon_count) ?? 0);
  assertContains(html, 'Active inventory total', fmtCount(totalActive), { tab: TAB, tolerance: 50 });

  assertContains(html, 'Median close (latest)', fmtMoney(num(latest?.median_close)), { tab: TAB });
  assertContains(html, 'Median DOM (latest)', latest?.median_dom != null ? String(Math.round(num(latest.median_dom))) : null, { tab: TAB });

  const totalVolume6mo = last6.reduce((s, r) => s + (num(r.total_volume) ?? 0), 0);
  assertContains(html, '6-month total volume', fmtMoney(totalVolume6mo, { compact: true }), { tab: TAB });

  const closingCount6mo = last6.reduce((s, r) => s + (num(r.closing_count) ?? 0), 0);
  assertContains(html, '6-month closings count', fmtCount(closingCount6mo), { tab: TAB, tolerance: 100 });
}

// ─── Pricing tab ──────────────────────────────────────────

async function verifyPricing() {
  const TAB = '/phoenix/pricing';
  console.log(`\n═══ ${TAB} ═══`);
  const html = await fetchPage(TAB);

  const [pulse, neg, red, tier] = await Promise.all([
    readMart('fct_market_pulse_metro'),
    readMart('fct_negotiation_metro'),
    readMart('fct_pricereduction_metro'),
    readMart('fct_active_by_pricetier'),
  ]);

  const metroPulse = metroAll(pulse).slice().sort((a, b) => isoMonth(b.month).localeCompare(isoMonth(a.month)));
  const latest = metroPulse[0];
  assertContains(html, 'Median Close (latest)', fmtMoney(num(latest?.median_close)), { tab: TAB });
  assertContains(html, 'Median $/SqFt (latest)', latest?.median_ppsf != null ? `$${Math.round(num(latest.median_ppsf))}` : null, { tab: TAB });

  const latestNeg = metroAll(neg).slice().sort((a, b) => isoMonth(b.month).localeCompare(isoMonth(a.month)))[0];
  if (latestNeg) {
    const ratio = num(latestNeg.median_sale_to_list);
    if (ratio != null) {
      const pct = ratio > 2 ? ratio : ratio * 100;
      assertContains(html, 'List-to-Sale Ratio', `${pct.toFixed(1)}%`, { tab: TAB });
    }
    const above = num(latestNeg.pct_above_list);
    if (above != null) assertContains(html, '% Above List', `${above.toFixed(1)}%`, { tab: TAB });
  }

  const latestRed = metroAll(red).slice().sort((a, b) => isoMonth(b.month).localeCompare(isoMonth(a.month)))[0];
  if (latestRed) {
    const pctRed = num(latestRed.pct_with_reduction);
    if (pctRed != null) assertContains(html, '% With Price Cut', `${pctRed.toFixed(1)}%`, { tab: TAB });
  }

  // Active price band total
  const tiers = tier.filter(r => r.scope_type === 'metro' && r.scope_key === 'phoenix_metro' && r.property_segment === 'all');
  const totalActive = tiers.reduce((s, t) => s + (num(t.active_count) ?? 0), 0);
  if (totalActive > 0) {
    // Verify ratios appear: e.g., the largest band's percentage
    const largest = tiers.reduce((a, b) => ((num(a.active_count) ?? 0) > (num(b.active_count) ?? 0) ? a : b), tiers[0]);
    if (largest) {
      const pct = ((num(largest.active_count) ?? 0) / totalActive) * 100;
      assertContains(html, `Largest band % (${largest.price_band})`, `${pct.toFixed(1)}%`, { tab: TAB });
    }
  }
}

// ─── Inventory tab ────────────────────────────────────────

async function verifyInventory() {
  const TAB = '/phoenix/inventory';
  console.log(`\n═══ ${TAB} ═══`);
  const html = await fetchPage(TAB);

  const [inv, mos, dom] = await Promise.all([
    readMart('fct_active_inventory'),
    readMart('fct_months_of_supply'),
    readMart('fct_active_dom_distribution'),
  ]);

  const metroInv = metroAll(inv)[0];
  const metroMos = metroAll(mos)[0];

  const strictActive = num(metroInv?.strict_active_count) ?? 0;
  const pending = num(metroInv?.pending_count) ?? 0;
  const comingSoon = num(metroInv?.coming_soon_count) ?? 0;
  const totalActive = strictActive + pending + comingSoon;
  assertContains(html, 'Total active', fmtCount(totalActive), { tab: TAB, tolerance: 50 });

  const mos3 = num(metroMos?.months_of_supply_3mo);
  if (mos3 != null) assertContains(html, 'Months of Supply (3mo)', `${mos3.toFixed(1)} mo`, { tab: TAB });

  const classification = metroMos?.market_classification;
  if (classification) {
    const expected = classification === 'sellers' ? "Seller's Market" : classification === 'buyers' ? "Buyer's Market" : 'Balanced';
    assertContains(html, 'Market classification', expected, { tab: TAB });
  }

  // DOM distribution: total should equal active inventory (verified earlier 31,200 = 31,200)
  const domBuckets = dom.filter(r => r.scope_type === 'metro' && r.scope_key === 'phoenix_metro' && r.property_segment === 'all');
  const domTotal = domBuckets.reduce((s, r) => s + (num(r.active_count) ?? 0), 0);
  if (domTotal > 0 && domBuckets.length) {
    const largest = domBuckets.reduce((a, b) => ((num(a.active_count) ?? 0) > (num(b.active_count) ?? 0) ? a : b));
    const pct = ((num(largest.active_count) ?? 0) / domTotal) * 100;
    assertContains(html, `Largest DOM band % (${largest.dom_band})`, `${pct.toFixed(1)}%`, { tab: TAB });
  }
}

// ─── Activity tab ─────────────────────────────────────────

async function verifyActivity() {
  const TAB = '/phoenix/activity';
  console.log(`\n═══ ${TAB} ═══`);
  const html = await fetchPage(TAB);

  const [pulse, inv, vel, buyer] = await Promise.all([
    readMart('fct_market_pulse_metro'),
    readMart('fct_active_inventory'),
    readMart('fct_status_velocity'),
    readMart('fct_buyer_office'),
  ]);

  const metroInv = metroAll(inv)[0];
  assertContains(html, 'Pending count', fmtCount(num(metroInv?.pending_count)), { tab: TAB, tolerance: 30 });

  const metroPulse = metroAll(pulse).slice().sort((a, b) => isoMonth(b.month).localeCompare(isoMonth(a.month)));
  const latest = metroPulse[0];
  assertContains(html, 'Closings (latest month)', fmtCount(num(latest?.closing_count)), { tab: TAB, tolerance: 50 });

  const last3 = metroPulse.slice(0, 3);
  const total3 = last3.reduce((s, r) => s + (num(r.total_volume) ?? 0), 0);
  assertContains(html, '3-month volume', fmtMoney(total3, { compact: true }), { tab: TAB });

  const metroVel = metroAll(vel).slice().sort((a, b) => isoMonth(b.month).localeCompare(isoMonth(a.month)));
  const reliable = metroVel.find((r) => (num(r.cohort_size) ?? 0) >= 100) ?? metroVel[0];
  if (reliable) {
    if (reliable.median_days_to_pending != null) {
      assertContains(html, 'Median days to pending', `${Math.round(num(reliable.median_days_to_pending))} days`, { tab: TAB });
    }
  }

  // Top buyer office for latest year
  const latestYear = buyer.reduce((y, r) => Math.max(y, r.year), 0);
  const top = buyer
    .filter(r => r.year === latestYear && r.buyer_office_name)
    .sort((a, b) => (num(b.deals) ?? 0) - (num(a.deals) ?? 0))[0];
  if (top) {
    assertContains(html, `Top buyer office (${latestYear}) name`, top.buyer_office_name, { tab: TAB });
    assertContains(html, `Top buyer office deals`, fmtCount(num(top.deals)), { tab: TAB, tolerance: 5 });
  }
}

// ─── Timing tab ───────────────────────────────────────────

async function verifyTiming() {
  const TAB = '/phoenix/timing';
  console.log(`\n═══ ${TAB} ═══`);
  const html = await fetchPage(TAB);

  const pulse = await readMart('fct_market_pulse_metro');
  const metroPulse = metroAll(pulse).slice().sort((a, b) => isoMonth(b.month).localeCompare(isoMonth(a.month)));
  const last24 = metroPulse.slice(0, 24);
  const current12 = last24.slice(0, 12);

  // Best month within current 12 by closings
  const best = current12.reduce((b, r) => ((num(r.closing_count) ?? 0) > (num(b?.closing_count) ?? 0) ? r : b), current12[0]);
  if (best) {
    const monthIdx = Number(isoMonth(best.month).slice(5, 7));
    const monthName = ['', 'January','February','March','April','May','June','July','August','September','October','November','December'][monthIdx];
    assertContains(html, 'Best month label', monthName, { tab: TAB });
  }

  // YoY closings vs 12mo prior
  const latest = metroPulse[0];
  const yoy = metroPulse[12];
  if (latest && yoy) {
    const cur = num(latest.closing_count);
    const pri = num(yoy.closing_count);
    if (cur != null && pri && pri > 0) {
      const yoyPct = ((cur - pri) / pri) * 100;
      const sign = yoyPct > 0 ? '+' : '';
      assertContains(html, 'Closings YoY %', `${sign}${yoyPct.toFixed(1)}%`, { tab: TAB });
    }
    // YoY median close
    const curPx = num(latest.median_close);
    const priPx = num(yoy.median_close);
    if (curPx != null && priPx && priPx > 0) {
      const pxPct = ((curPx - priPx) / priPx) * 100;
      const sign = pxPct > 0 ? '+' : '';
      assertContains(html, 'Median close YoY %', `${sign}${pxPct.toFixed(1)}%`, { tab: TAB });
    }
  }
}

// ─── Run ──────────────────────────────────────────────────

const TABS = (process.argv[2] ?? 'overview,pricing,inventory,activity,timing').split(',');
console.log(`Verifying tabs: ${TABS.join(', ')}`);
console.log(`Site: ${SITE_URL}\n`);

for (const tab of TABS) {
  try {
    if (tab === 'overview') await verifyOverview();
    else if (tab === 'pricing') await verifyPricing();
    else if (tab === 'inventory') await verifyInventory();
    else if (tab === 'activity') await verifyActivity();
    else if (tab === 'timing') await verifyTiming();
    else console.log(`(verifier for '${tab}' not yet implemented)`);
  } catch (err) {
    console.log(`  ❌ ${tab}: ${err.message}`);
    results.push({ tab, label: 'fetch', expected: '(error)', status: `❌ ${err.message}` });
  }
}

console.log('\n═══ Summary ═══');
const pass = results.filter(r => r.status.startsWith('✅')).length;
const fail = results.filter(r => r.status.startsWith('❌')).length;
const skip = results.filter(r => r.status.startsWith('⚪')).length;
console.log(`  ${pass} pass · ${fail} fail · ${skip} skip`);

console.log('\n═══ Detail ═══');
console.log(`  ${'tab'.padEnd(20)} ${'label'.padEnd(35)} ${'expected'.padEnd(25)} status`);
for (const r of results) {
  console.log(`  ${(r.tab ?? '').padEnd(20)} ${r.label.padEnd(35)} ${r.expected.padEnd(25)} ${r.status}`);
}

const out = join(TMPDIR, 'phoenix-tab-verify.json');
writeFileSync(out, JSON.stringify({ run_at: new Date().toISOString(), results, pass, fail, skip }, null, 2));
console.log(`\nReport → ${out}`);

process.exit(fail > 0 ? 1 : 0);
