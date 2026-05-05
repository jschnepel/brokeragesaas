import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import pg from 'pg';

const execFileP = promisify(execFile);
const isWin = process.platform === 'win32';
const AWS = isWin ? 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe' : 'aws';

const { stdout } = await execFileP(AWS, [
  'ssm', 'get-parameter', '--name', '/rlsir/db/url', '--with-decryption',
  '--region', 'us-east-1', '--query', 'Parameter.Value', '--output', 'text',
], { env: { ...process.env, MSYS_NO_PATHCONV: '1' } });
const url = stdout.trim();

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  console.log('— subdivision_canonical_map exists? —');
  let r = await client.query(`
    SELECT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_name = 'subdivision_canonical_map' AND table_schema = 'public') AS exists
  `);
  console.log(`  ${r.rows[0].exists}`);
  if (r.rows[0].exists) {
    r = await client.query('SELECT COUNT(*) AS n FROM subdivision_canonical_map');
    console.log(`  rows: ${r.rows[0].n}`);
    r = await client.query('SELECT * FROM subdivision_canonical_map LIMIT 5');
    console.log('  sample:'); for (const row of r.rows) console.log('    ', row);
  }

  console.log('\n— communities seeded —');
  r = await client.query('SELECT COUNT(*) AS n FROM communities');
  console.log(`  total: ${r.rows[0].n}`);

  console.log('\n— listing_geography coverage among 2024+ closed listings —');
  r = await client.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(lg.community_slug) AS with_community,
      COUNT(lg.region_slug) AS with_region,
      COUNT(*) FILTER (WHERE lg.community_slug IS NULL) AS no_community
    FROM listing_records r
    LEFT JOIN listing_geography lg ON lg.listing_key = r.listing_key
    WHERE r.standard_status = 'Closed' AND r.close_date >= '2024-01-01'
  `);
  console.log('  ', r.rows[0]);

  console.log('\n— top 20 raw subdivision_name where community_slug IS NULL (closed 2024+) —');
  r = await client.query(`
    SELECT TRIM(r.subdivision_name) AS sub, COUNT(*) AS n
    FROM listing_records r
    LEFT JOIN listing_geography lg ON lg.listing_key = r.listing_key
    WHERE r.standard_status = 'Closed' AND r.close_date >= '2024-01-01'
      AND lg.community_slug IS NULL
      AND r.subdivision_name IS NOT NULL AND TRIM(r.subdivision_name) NOT IN ('', 'Metes and Bounds', 'No Subdivision', 'NONE', 'N/A')
    GROUP BY 1 ORDER BY 2 DESC LIMIT 20
  `);
  for (const row of r.rows) console.log(`  ${row.n.toString().padStart(5)}  ${row.sub}`);
} finally {
  await client.end();
}
