// pg_cancel_backend any listing_records query > 60s old. Lambda kill cycles
// disconnect Lambda but PG keeps the query running until it finishes or PG
// detects client disconnect — which is slow. Force-cancel to free disk IO.

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
  // Skip: ARMLS sync INSERT/UPDATE (legitimate writers); autovacuum (legitimate maintenance).
  // Cancel: any other read on listing_records older than 60s — these are orphaned consumers.
  const r = await client.query(`
    SELECT pid, usename, client_addr,
           EXTRACT(EPOCH FROM (now() - query_start))::INT AS age_s,
           LEFT(query, 100) AS q
    FROM pg_stat_activity
    WHERE state = 'active'
      AND pid <> pg_backend_pid()
      AND query ILIKE '%listing_records%'
      AND query NOT ILIKE 'INSERT INTO%'
      AND query NOT ILIKE 'UPDATE %'
      AND query NOT ILIKE 'autovacuum:%'
      AND EXTRACT(EPOCH FROM (now() - query_start)) > 60
  `);
  if (r.rows.length === 0) {
    console.log('No stale read queries found.');
  } else {
    for (const row of r.rows) {
      console.log(`cancel pid=${row.pid} ${row.usename}@${row.client_addr} age=${row.age_s}s q=${row.q.replace(/\s+/g, ' ').slice(0, 80)}`);
      await client.query('SELECT pg_cancel_backend($1)', [row.pid]);
    }
  }
} finally {
  await client.end();
}
