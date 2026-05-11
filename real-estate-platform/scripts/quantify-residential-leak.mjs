/**
 * Quantifies the "fake residential" leak in dbt's property_segment dimension.
 * Splits queries to avoid statement_timeout on the slower percentile ops.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import pg from 'pg';

const x = promisify(execFile);
const isWin = process.platform === 'win32';
const AWS = isWin ? 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe' : 'aws';
const env = { ...process.env, MSYS_NO_PATHCONV: '1' };

const { stdout: dsn } = await x(AWS, ['ssm','get-parameter','--name','/rlsir/db/url','--with-decryption','--region','us-east-1','--query','Parameter.Value','--output','text'], { env });
const c = new pg.Client({ connectionString: dsn.trim(), ssl: { rejectUnauthorized: false }, statement_timeout: 240000 });
await c.connect();

const fmt = (n) => Number(n).toLocaleString();
const money = (n) => n == null ? '—' : `$${Math.round(Number(n)).toLocaleString()}`;
const pctOf = (p, t) => t > 0 ? ((p / t) * 100).toFixed(1) + '%' : '—';

// ─── Active inventory counts (small, fast) ──────────────
console.log('═══ Active inventory — residential segment leak ═══\n');
const a1 = await c.query(`
  SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE bedrooms_total = 0 OR bedrooms_total IS NULL) AS no_bed,
    COUNT(*) FILTER (WHERE bathrooms_total_integer = 0 OR bathrooms_total_integer IS NULL) AS no_bath,
    COUNT(*) FILTER (WHERE living_area = 0 OR living_area IS NULL) AS no_sqft,
    COUNT(*) FILTER (
      WHERE bedrooms_total = 0 OR bedrooms_total IS NULL
         OR bathrooms_total_integer = 0 OR bathrooms_total_integer IS NULL
         OR living_area = 0 OR living_area IS NULL
    ) AS any_garbage
  FROM listing_records
  WHERE property_type = 'Residential'
    AND standard_status IN ('Active', 'Active Under Contract', 'Pending', 'Coming Soon')
    AND is_deleted = FALSE
`);
const a = a1.rows[0];
console.log(`  Total dbt-residential active:     ${fmt(a.total)}`);
console.log(`  └─ 0 / NULL bedrooms:             ${fmt(a.no_bed)}  (${pctOf(a.no_bed, a.total)})`);
console.log(`  └─ 0 / NULL bathrooms:            ${fmt(a.no_bath)}  (${pctOf(a.no_bath, a.total)})`);
console.log(`  └─ 0 / NULL living_area:          ${fmt(a.no_sqft)}  (${pctOf(a.no_sqft, a.total)})`);
console.log(`  └─ Any garbage condition:         ${fmt(a.any_garbage)}  (${pctOf(a.any_garbage, a.total)})`);

// Median list — fast since it's only 30K rows
const a2 = await c.query(`
  SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price)::NUMERIC AS m
  FROM listing_records
  WHERE property_type='Residential' AND standard_status IN ('Active','Active Under Contract','Pending','Coming Soon') AND is_deleted=FALSE
`);
const a3 = await c.query(`
  SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price)::NUMERIC AS m
  FROM listing_records
  WHERE property_type='Residential' AND standard_status IN ('Active','Active Under Contract','Pending','Coming Soon') AND is_deleted=FALSE
    AND bedrooms_total > 0 AND bathrooms_total_integer > 0 AND living_area > 0
`);
const a4 = await c.query(`
  SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price)::NUMERIC AS m
  FROM listing_records
  WHERE property_type='Residential' AND standard_status IN ('Active','Active Under Contract','Pending','Coming Soon') AND is_deleted=FALSE
    AND (bedrooms_total = 0 OR bedrooms_total IS NULL
         OR bathrooms_total_integer = 0 OR bathrooms_total_integer IS NULL
         OR living_area = 0 OR living_area IS NULL)
`);
console.log();
console.log(`  Median list — all dbt-residential:           ${money(a2.rows[0].m)}`);
console.log(`  Median list — clean (bed>0, bath>0, sqft>0): ${money(a3.rows[0].m)}`);
console.log(`  Median list — garbage rows only:             ${money(a4.rows[0].m)}`);

// ─── Closed — latest complete month ────────────────────
console.log('\n═══ Closed — latest complete month ═══\n');
const mo = await c.query(`SELECT DATE_TRUNC('month', MAX(close_date))::date AS mo FROM listing_records WHERE standard_status='Closed' AND close_date < DATE_TRUNC('month', CURRENT_DATE)`);
const latestMo = mo.rows[0].mo.toISOString().slice(0,10);

const c1 = await c.query(`
  SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE bedrooms_total > 0 AND bathrooms_total_integer > 0 AND living_area > 0) AS clean,
    COUNT(*) FILTER (
      WHERE bedrooms_total = 0 OR bedrooms_total IS NULL
         OR bathrooms_total_integer = 0 OR bathrooms_total_integer IS NULL
         OR living_area = 0 OR living_area IS NULL
    ) AS garbage
  FROM listing_records
  WHERE property_type='Residential' AND standard_status='Closed' AND is_deleted=FALSE
    AND DATE_TRUNC('month', close_date)::date = $1::date
    AND close_price BETWEEN 10000 AND 99999999
    AND list_price BETWEEN 10000 AND 99999999
    AND list_office_name IS NOT NULL
`, [latestMo]);

const c2 = await c.query(`
  SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price)::NUMERIC AS m
  FROM listing_records
  WHERE property_type='Residential' AND standard_status='Closed' AND is_deleted=FALSE
    AND DATE_TRUNC('month', close_date)::date = $1::date
    AND close_price BETWEEN 10000 AND 99999999
    AND list_price BETWEEN 10000 AND 99999999
    AND list_office_name IS NOT NULL
`, [latestMo]);

const c3 = await c.query(`
  SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price)::NUMERIC AS m
  FROM listing_records
  WHERE property_type='Residential' AND standard_status='Closed' AND is_deleted=FALSE
    AND DATE_TRUNC('month', close_date)::date = $1::date
    AND close_price BETWEEN 10000 AND 99999999
    AND list_price BETWEEN 10000 AND 99999999
    AND list_office_name IS NOT NULL
    AND bedrooms_total > 0 AND bathrooms_total_integer > 0 AND living_area > 0
`, [latestMo]);

const c4 = await c.query(`
  SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price)::NUMERIC AS m
  FROM listing_records
  WHERE property_type='Residential' AND standard_status='Closed' AND is_deleted=FALSE
    AND DATE_TRUNC('month', close_date)::date = $1::date
    AND close_price BETWEEN 10000 AND 99999999
    AND list_price BETWEEN 10000 AND 99999999
    AND list_office_name IS NOT NULL
    AND (bedrooms_total = 0 OR bedrooms_total IS NULL
         OR bathrooms_total_integer = 0 OR bathrooms_total_integer IS NULL
         OR living_area = 0 OR living_area IS NULL)
`, [latestMo]);

const cc = c1.rows[0];
const total = Number(cc.total);
const clean = Number(cc.clean);
const garbage = Number(cc.garbage);

console.log(`  Month: ${latestMo.slice(0,7)}`);
console.log(`  Total dbt-residential closings: ${fmt(total)}`);
console.log(`  └─ Clean (bed>0, bath>0, sqft>0): ${fmt(clean)} (${pctOf(clean, total)})`);
console.log(`  └─ Garbage (any 0/NULL):          ${fmt(garbage)} (${pctOf(garbage, total)})`);
console.log();
console.log(`  Median close — all dbt-residential: ${money(c2.rows[0].m)}`);
console.log(`  Median close — clean only:           ${money(c3.rows[0].m)}`);
console.log(`  Median close — garbage only:         ${money(c4.rows[0].m)}`);
const delta = Number(c3.rows[0].m) - Number(c2.rows[0].m);
console.log(`\n  Median Δ if we apply strict filter: ${delta > 0 ? '+' : ''}${money(delta)} (${(delta / Number(c2.rows[0].m) * 100).toFixed(2)}%)`);

// ─── Sample 5 worst offenders ──────────────────────────
console.log('\n═══ Sample: 5 lowest-priced "garbage residential" closed in latest month ═══');
const sample = await c.query(`
  SELECT listing_key, unparsed_address, close_price, list_price,
    bedrooms_total, bathrooms_total_integer, living_area, property_sub_type
  FROM listing_records
  WHERE property_type='Residential' AND standard_status='Closed' AND is_deleted=FALSE
    AND DATE_TRUNC('month', close_date)::date = $1::date
    AND close_price BETWEEN 10000 AND 99999999
    AND list_price BETWEEN 10000 AND 99999999
    AND list_office_name IS NOT NULL
    AND (bedrooms_total = 0 OR bedrooms_total IS NULL
         OR bathrooms_total_integer = 0 OR bathrooms_total_integer IS NULL
         OR living_area = 0 OR living_area IS NULL)
  ORDER BY close_price ASC LIMIT 5
`, [latestMo]);
for (const r of sample.rows) {
  console.log(`  ${r.listing_key.slice(0,20)} ${(r.unparsed_address || '').slice(0,38).padEnd(40)}  close=${money(r.close_price)} bd=${r.bedrooms_total ?? 'NULL'} ba=${r.bathrooms_total_integer ?? 'NULL'} sqft=${r.living_area ?? 'NULL'} subtype="${r.property_sub_type ?? ''}"`);
}

await c.end();
