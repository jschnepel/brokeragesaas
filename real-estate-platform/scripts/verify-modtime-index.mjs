// Verify the modtime+status index is built and used by the parquet-export query.
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
  console.log('— index size —');
  const verify = await client.query(`
    SELECT indexrelname AS name, pg_size_pretty(pg_relation_size(indexrelid)) AS size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      AND relname = 'listing_records'
      AND indexrelname = 'listing_records_modtime_status_idx'
  `);
  for (const r of verify.rows) console.log(`  ${r.name}: ${r.size}`);
  if (verify.rows.length === 0) console.log('  NOT FOUND');

  console.log('\n— filtered count timing (the Lambda query) —');
  const t = Date.now();
  const r = await client.query(`
    SELECT COUNT(*) FROM listing_records
    WHERE standard_status IN ('Closed', 'Expired', 'Withdrawn', 'Cancelled')
      AND modification_timestamp >= NOW() - INTERVAL '14 days'
  `);
  console.log(`  ${r.rows[0].count} rows in ${Date.now()-t}ms`);

  console.log('\n— EXPLAIN ANALYZE —');
  const explain = await client.query(`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT COUNT(*) FROM listing_records
    WHERE standard_status IN ('Closed', 'Expired', 'Withdrawn', 'Cancelled')
      AND modification_timestamp >= NOW() - INTERVAL '14 days'
  `);
  for (const row of explain.rows) console.log('  ' + row['QUERY PLAN']);
} finally {
  await client.end();
}
