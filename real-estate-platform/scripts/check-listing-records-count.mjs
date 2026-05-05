import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import pg from 'pg';

const execFileP = promisify(execFile);
const isWin = process.platform === 'win32';
const AWS = isWin ? 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe' : 'aws';

const { stdout } = await execFileP(AWS, [
  'secretsmanager', 'get-secret-value',
  '--secret-id', 'rlsir/rds/dbt-readonly',
  '--region', 'us-east-1',
  '--query', 'SecretString',
  '--output', 'text',
], { env: { ...process.env, MSYS_NO_PATHCONV: '1' } });
const s = JSON.parse(stdout.trim());

const client = new pg.Client({
  host: s.host, port: s.port, user: s.username, password: s.password, database: s.dbname,
  ssl: { rejectUnauthorized: false },
});
await client.connect();
try {
  console.log('\n— total count —');
  let t = Date.now();
  let r = await client.query('SELECT COUNT(*) FROM listing_records');
  console.log(`  ${r.rows[0].count} rows in ${Date.now()-t}ms`);

  console.log('\n— filtered count (the Lambda query) —');
  t = Date.now();
  r = await client.query(`
    SELECT COUNT(*) FROM listing_records
    WHERE standard_status IN ('Closed', 'Expired', 'Withdrawn', 'Cancelled')
      AND modification_timestamp >= NOW() - INTERVAL '14 days'
  `);
  console.log(`  ${r.rows[0].count} rows in ${Date.now()-t}ms`);

  console.log('\n— indexes on listing_records —');
  r = await client.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'listing_records'
    ORDER BY indexname
  `);
  for (const row of r.rows) console.log(`  ${row.indexname}`);
} finally {
  await client.end();
}
