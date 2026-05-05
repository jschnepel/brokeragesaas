// Cancel chunked seq-scan COPYs from the previous (pre-postgres_query) Lambda
// invocation that's still hammering listing_records via ctid ranges. They're
// IO-saturating the disk and starving the new postgres_query path that uses
// the index. Leaves ARMLS sync INSERTs, autovacuum, and the new
// postgres_query COUNT alone.

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
  const r = await client.query(`
    SELECT pid, EXTRACT(EPOCH FROM (now() - query_start))::INT AS age_s,
           LEFT(query, 100) AS q
    FROM pg_stat_activity
    WHERE state = 'active'
      AND pid <> pg_backend_pid()
      AND query LIKE '%ctid BETWEEN%'
      AND query LIKE '%listing_records%'
  `);
  if (r.rows.length === 0) {
    console.log('No stale ctid-range scans found.');
  } else {
    for (const row of r.rows) {
      console.log(`cancel pid=${row.pid} age=${row.age_s}s q=${row.q.replace(/\s+/g, ' ').slice(0, 80)}`);
      await client.query('SELECT pg_cancel_backend($1)', [row.pid]);
    }
  }
} finally {
  await client.end();
}
