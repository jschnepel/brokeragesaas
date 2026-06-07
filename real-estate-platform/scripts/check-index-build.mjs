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
    SELECT
      pid,
      phase,
      blocks_done,
      blocks_total,
      tuples_done,
      tuples_total,
      EXTRACT(EPOCH FROM (now() - query_start))::INT AS age_s,
      LEFT(query, 80) AS query_short
    FROM pg_stat_progress_create_index
    LEFT JOIN pg_stat_activity USING (pid)
  `);
  if (r.rows.length === 0) {
    console.log('No index build in progress.');
  } else {
    for (const row of r.rows) {
      const pct = row.blocks_total > 0 ? ((row.blocks_done / row.blocks_total) * 100).toFixed(1) : 'n/a';
      console.log(`pid=${row.pid} phase=${row.phase} blocks=${row.blocks_done}/${row.blocks_total} (${pct}%) tuples=${row.tuples_done}/${row.tuples_total} age=${row.age_s}s`);
      console.log(`  q=${row.query_short}`);
    }
  }
} finally {
  await client.end();
}
