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
      pid, usename, application_name, client_addr, state,
      EXTRACT(EPOCH FROM (now() - state_change))::INT AS state_age_s,
      EXTRACT(EPOCH FROM (now() - query_start))::INT AS query_age_s,
      wait_event_type, wait_event,
      LEFT(query, 200) AS q
    FROM pg_stat_activity
    WHERE pid <> pg_backend_pid()
    ORDER BY query_start DESC NULLS LAST
  `);
  for (const row of r.rows) {
    const summary = `${row.usename}@${row.client_addr || 'local'} state=${row.state} state_age=${row.state_age_s}s wait=${row.wait_event_type || '-'}/${row.wait_event || '-'}`;
    const q = row.q ? row.q.replace(/\s+/g, ' ').slice(0, 180) : '(no query)';
    console.log(`pid=${row.pid} ${summary}`);
    console.log(`  q=${q}`);
  }
} finally {
  await client.end();
}
