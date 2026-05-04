#!/usr/bin/env node
/**
 * Pull the live Spark API access token from AWS Secrets Manager and
 * either print it (for manual paste) or write it directly into the
 * relevant local .env files.
 *
 * Why this exists:
 *   The token in apps/backend/.env.local goes stale because the production
 *   Lambda reads from SecretsManager (rlsir/armls/tokens) directly. Local
 *   dev needs a way to mirror the live token without copy-paste from the
 *   AWS console.
 *
 * Usage:
 *   node scripts/dev-refresh-spark-token.mjs              # print only
 *   node scripts/dev-refresh-spark-token.mjs --write      # write to .env files
 *   node scripts/dev-refresh-spark-token.mjs --json       # JSON for automation
 *
 * Requirements:
 *   - AWS CLI installed + credentials configured (~/.aws/credentials)
 *   - secretsmanager:GetSecretValue permission for arn:aws:secretsmanager:us-east-1:828301486081:secret:rlsir/armls/tokens-*
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const execFileP = promisify(execFile);
const isWin = process.platform === 'win32';
const AWS = isWin ? 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe' : 'aws';
const SECRET_ID = 'rlsir/armls/tokens';
const REGION = 'us-east-1';

const flags = {
  write: process.argv.includes('--write'),
  json: process.argv.includes('--json'),
};

const ENV_FILE_TARGETS = [
  { path: 'apps/backend/.env.local', varName: 'SPARK_ACCESS_TOKEN' },
  { path: 'apps/backend/.env',       varName: 'SPARK_ACCESS_TOKEN' },
  { path: 'apps/premium-site/.env.local', varName: 'SPARK_API_ACCESS_TOKEN' },
];

async function aws(args) {
  const { stdout } = await execFileP(AWS, args, {
    env: { ...process.env, MSYS_NO_PATHCONV: '1' },
    maxBuffer: 8 * 1024 * 1024,
  });
  return stdout.trim();
}

async function fetchToken() {
  const out = await aws([
    'secretsmanager', 'get-secret-value',
    '--secret-id', SECRET_ID,
    '--region', REGION,
    '--query', 'SecretString',
    '--output', 'text',
  ]);
  let parsed;
  try {
    parsed = JSON.parse(out);
  } catch (err) {
    throw new Error(`Secret payload is not valid JSON: ${err.message}`);
  }
  if (!parsed.access_token) {
    throw new Error('Secret payload missing access_token field');
  }
  return parsed.access_token;
}

function upsertEnvVar(filePath, varName, value) {
  if (!existsSync(filePath)) {
    return { updated: false, reason: 'file does not exist' };
  }
  const content = readFileSync(filePath, 'utf8');
  const re = new RegExp(`^${varName}=.*$`, 'm');
  let next;
  if (re.test(content)) {
    next = content.replace(re, `${varName}=${value}`);
  } else {
    const sep = content.endsWith('\n') ? '' : '\n';
    next = `${content}${sep}${varName}=${value}\n`;
  }
  writeFileSync(filePath, next, 'utf8');
  return { updated: true };
}

async function main() {
  const token = await fetchToken();

  if (flags.json) {
    console.log(JSON.stringify({ access_token: token, source: SECRET_ID }, null, 2));
    return;
  }

  console.log(`\n══ Spark API access token (from AWS Secrets Manager) ══\n`);
  console.log(`  Secret:  ${SECRET_ID}`);
  console.log(`  Region:  ${REGION}`);
  console.log(`  Token:   ${token.slice(0, 8)}...${token.slice(-6)} (${token.length} chars)\n`);

  if (!flags.write) {
    console.log('To write to local .env files: re-run with --write');
    console.log('To copy/paste manually:');
    console.log(`\n  SPARK_ACCESS_TOKEN=${token}\n`);
    return;
  }

  console.log('Writing to local env files:\n');
  for (const { path, varName } of ENV_FILE_TARGETS) {
    const result = upsertEnvVar(path, varName, token);
    if (result.updated) {
      console.log(`  ✓ ${path}  (${varName})`);
    } else {
      console.log(`  - ${path}  (skipped — ${result.reason})`);
    }
  }
  console.log('\nDone. Restart any dev servers picking up these env files.');
}

main().catch(err => {
  console.error('Failed to refresh Spark token:', err.message);
  if (err.message.includes('AccessDenied') || err.message.includes('not authorized')) {
    console.error('\nHint: ensure your AWS credentials have secretsmanager:GetSecretValue');
    console.error('      on arn:aws:secretsmanager:us-east-1:828301486081:secret:rlsir/armls/tokens-*');
  }
  process.exit(1);
});
