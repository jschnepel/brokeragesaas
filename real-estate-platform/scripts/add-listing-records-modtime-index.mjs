// One-time DDL: add index on listing_records(modification_timestamp DESC, standard_status)
// to make the parquet-export Lambda's filtered COPY use index scan instead of
// sequential scan over 1.91M rows. Built CONCURRENTLY so ARMLS sync upserts
// continue uninterrupted during the build.
//
// Also cancels any stuck pg_stat_activity queries with age > 60s on
// listing_records (cleanup from the timeout cycle).

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import pg from 'pg';

const execFileP = promisify(execFile);
const isWin = process.platform === 'win32';
const AWS = isWin ? 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe' : 'aws';

const { stdout } = await execFileP(AWS, [
  'ssm', 'get-parameter', '--name', '/rlsir/db/url',
  '--with-decryption', '--region', 'us-east-1',
  '--query', 'Parameter.Value', '--output', 'text',
], { env: { ...process.env, MSYS_NO_PATHCONV: '1' } });
const masterUrl = stdout.trim();

const client = new pg.Client({ connectionString: masterUrl, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  // Step 1 — cancel stuck queries hitting listing_records
  console.log('— canceling stuck listing_records queries —');
  const stuck = await client.query(`
    SELECT pid, usename, EXTRACT(EPOCH FROM (now() - query_start))::INT AS age_s,
           LEFT(query, 100) AS q
    FROM pg_stat_activity
    WHERE state = 'active'
      AND pid <> pg_backend_pid()
      AND query ILIKE '%listing_records%'
      AND EXTRACT(EPOCH FROM (now() - query_start)) > 60
  `);
  for (const r of stuck.rows) {
    console.log(`  cancel pid=${r.pid} user=${r.usename} age=${r.age_s}s q=${r.q.replace(/\s+/g, ' ')}`);
    await client.query('SELECT pg_cancel_backend($1)', [r.pid]);
  }
  if (stuck.rows.length === 0) console.log('  (none)');

  // Step 2 — create the index CONCURRENTLY
  console.log('\n— creating index (CONCURRENTLY, ~2-5min on db.t3.medium) —');
  const t0 = Date.now();
  // CREATE INDEX CONCURRENTLY cannot run inside a transaction; node-postgres
  // sends statements outside of explicit BEGIN/COMMIT, so this works.
  await client.query(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS listing_records_modtime_status_idx
    ON listing_records (modification_timestamp DESC, standard_status)
  `);
  console.log(`  built in ${((Date.now()-t0)/1000).toFixed(1)}s`);

  // Step 3 — verify + show size
  console.log('\n— verify index —');
  const verify = await client.query(`
    SELECT
      indexrelname AS indexname,
      pg_size_pretty(pg_relation_size(indexrelid)) AS size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      AND relname = 'listing_records'
      AND indexrelname = 'listing_records_modtime_status_idx'
  `);
  for (const r of verify.rows) console.log(`  ${r.indexname}: ${r.size}`);

  // Step 4 — confirm the planner picks up the new index
  console.log('\n— EXPLAIN the Lambda query —');
  const explain = await client.query(`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
    SELECT COUNT(*) FROM listing_records
    WHERE standard_status IN ('Closed', 'Expired', 'Withdrawn', 'Cancelled')
      AND modification_timestamp >= NOW() - INTERVAL '14 days'
  `);
  for (const row of explain.rows) console.log('  ' + row['QUERY PLAN']);
} finally {
  await client.end();
}
