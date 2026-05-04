#!/usr/bin/env node
/**
 * One-shot: create dbt_readonly RDS user + store password in Secrets Manager.
 *
 * Reads master DB URL from /tmp/db-url.txt (you put it there with
 * `aws ssm get-parameter --name /rlsir/db/url --with-decryption ... > /tmp/db-url.txt`).
 *
 * Generates a 32-byte random password, runs CREATE USER + GRANT against RDS
 * over the existing ssl-enabled pool, stores the new credential in Secrets
 * Manager as rlsir/rds/dbt-readonly. Master URL never appears in stdout.
 *
 * Idempotent: if dbt_readonly already exists, ALTER USER … WITH PASSWORD
 * rotates instead of CREATE.
 *
 * Usage:
 *   node scripts/bootstrap-dbt-readonly-user.mjs
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import pg from 'pg';

const execFileP = promisify(execFile);
const isWin = process.platform === 'win32';
const AWS = isWin ? 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe' : 'aws';
const REGION = 'us-east-1';
const SECRET_ID = 'rlsir/rds/dbt-readonly';
// MSYS bash mounts /tmp at the user's AppData\Local\Temp on Windows.
// Node.js sees Windows paths, so we resolve to that absolute path.
const URL_FILE = process.platform === 'win32'
  ? `${process.env.LOCALAPPDATA || `${process.env.USERPROFILE}\\AppData\\Local`}\\Temp\\db-url.txt`
  : '/tmp/db-url.txt';

function genPassword() {
  // 32 bytes → 43 chars base64; strip slash/plus to keep URL-safe
  return randomBytes(32).toString('base64')
    .replace(/[/+=]/g, '')
    .slice(0, 32);
}

function urlToConfig(url) {
  // Parse postgres://user:pass@host:port/db?... and return pg config object,
  // never returning the URL itself.
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 5432,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, '') || 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  };
}

async function aws(args) {
  const { stdout } = await execFileP(AWS, args, {
    env: { ...process.env, MSYS_NO_PATHCONV: '1' },
    maxBuffer: 8 * 1024 * 1024,
  });
  return stdout.trim();
}

async function main() {
  if (!existsSync(URL_FILE)) {
    console.error(`Missing ${URL_FILE} — populate via:`);
    console.error(`  aws ssm get-parameter --name /rlsir/db/url --with-decryption --region ${REGION} --query Parameter.Value --output text > ${URL_FILE}`);
    process.exit(1);
  }
  const url = readFileSync(URL_FILE, 'utf8').trim();
  if (!url.startsWith('postgres')) {
    console.error('URL file did not contain a postgres:// URL.');
    process.exit(1);
  }
  const cfg = urlToConfig(url);
  const password = genPassword();
  const dbHost = cfg.host;
  const dbName = cfg.database;
  const dbPort = cfg.port;

  // 1. Connect with master creds.
  console.log('Connecting to RDS…');
  const client = new pg.Client(cfg);
  await client.connect();

  try {
    // 2. Check if user exists; CREATE or ALTER accordingly.
    const r = await client.query(`SELECT 1 FROM pg_roles WHERE rolname = 'dbt_readonly'`);
    // CREATE/ALTER USER doesn't accept parameterized $1 for the password.
    // Interpolate as a single-quoted literal. genPassword() returns
    // base64-alphanumeric only (no quotes), so direct substitution is safe.
    if (!/^[A-Za-z0-9]+$/.test(password)) {
      throw new Error('Generated password contains unexpected characters; aborting.');
    }
    if (r.rowCount === 0) {
      console.log('Creating dbt_readonly user…');
      await client.query(`CREATE USER dbt_readonly WITH PASSWORD '${password}'`);
    } else {
      console.log('dbt_readonly user exists — rotating password…');
      await client.query(`ALTER USER dbt_readonly WITH PASSWORD '${password}'`);
    }

    // 3. Grants (idempotent).
    console.log('Applying read-only grants…');
    // dbName comes from a postgres URL we just parsed; it's an identifier
    // not user input. Quote with double quotes per PostgreSQL spec.
    const safeDbName = '"' + dbName.replace(/"/g, '""') + '"';
    const grants = [
      `GRANT CONNECT ON DATABASE ${safeDbName} TO dbt_readonly`,
      `GRANT USAGE ON SCHEMA public TO dbt_readonly`,
      `GRANT SELECT ON ALL TABLES IN SCHEMA public TO dbt_readonly`,
      `GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO dbt_readonly`,
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO dbt_readonly`,
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO dbt_readonly`,
    ];
    for (const sql of grants) {
      await client.query(sql);
    }

    // 4. Smoke-test the new user can SELECT.
    const testCfg = { ...cfg, user: 'dbt_readonly', password };
    const testClient = new pg.Client(testCfg);
    await testClient.connect();
    const sample = await testClient.query(`SELECT count(*) AS c FROM listing_records WHERE is_deleted = FALSE LIMIT 1`);
    console.log(`  ✓ dbt_readonly can SELECT listing_records (count snippet: ${sample.rows[0].c})`);
    await testClient.end();
  } finally {
    await client.end();
  }

  // 5. Store secret. Use a temp file so the password never enters argv.
  const secretPayload = JSON.stringify({
    host: dbHost,
    port: dbPort,
    username: 'dbt_readonly',
    password,
    dbname: dbName,
  });
  const tmpSecret = process.platform === 'win32'
    ? `${process.env.LOCALAPPDATA || `${process.env.USERPROFILE}\\AppData\\Local`}\\Temp\\dbt-readonly-secret.json`
    : '/tmp/dbt-readonly-secret.json';
  writeFileSyncSafe(tmpSecret, secretPayload);

  // Try to create; if already exists, update instead.
  let action = 'created';
  try {
    await aws([
      'secretsmanager', 'create-secret',
      '--name', SECRET_ID,
      '--region', REGION,
      '--secret-string', `file://${tmpSecret}`,
    ]);
  } catch (e) {
    if (String(e).includes('ResourceExists')) {
      action = 'updated';
      await aws([
        'secretsmanager', 'put-secret-value',
        '--secret-id', SECRET_ID,
        '--region', REGION,
        '--secret-string', `file://${tmpSecret}`,
      ]);
    } else {
      throw e;
    }
  } finally {
    try { unlinkSync(tmpSecret); } catch {}
  }

  console.log(`\n✓ Secret ${SECRET_ID} ${action} (region ${REGION})`);
  console.log(`✓ dbt_readonly user provisioned + tested in RDS`);
  console.log(`Cleanup: rm ${URL_FILE}\n`);
}

function writeFileSyncSafe(path, content) {
  writeFileSync(path, content, { encoding: 'utf8', mode: 0o600 });
}

main().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
