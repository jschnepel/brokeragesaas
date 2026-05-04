#!/usr/bin/env node
/**
 * Free-tier discipline auditor for RLSIR.
 * Runs read-only checks against AWS to verify usage stays within
 * the budget envelope documented in docs/superpowers/plans/2026-05-04-roadmap-best-practices.md.
 *
 * Exit code 0 = all green. Exit code 1 = at least one breach.
 *
 * Usage:
 *   node scripts/check-free-tier.mjs              # human-readable
 *   node scripts/check-free-tier.mjs --json       # machine-readable
 *   node scripts/check-free-tier.mjs --strict     # exit 1 on warnings too
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readFileSync } from 'node:fs';

const execFileP = promisify(execFile);
const isWin = process.platform === 'win32';
const AWS = isWin ? 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe' : 'aws';
const REGION = 'us-east-1';
const ACCOUNT = '828301486081';

const flags = {
  json: process.argv.includes('--json'),
  strict: process.argv.includes('--strict'),
};

// Thresholds from the best-practices doc, single source of truth.
const LIMITS = {
  cloudwatchMetrics: { soft: 30, hard: 40, costPerMetric: 0.30 },
  cloudwatchAlarms: { soft: 20, hard: 30, costPerAlarm: 0.10 },
  logRetentionDays: { max: 30 },
  lambdaCount: { soft: 12, hard: 20 },
  monthlySpendUsd: { soft: 30, hard: 50 },
};

const results = [];

function record(name, status, message, detail = null) {
  results.push({ name, status, message, detail });
}

async function aws(args) {
  const { stdout } = await execFileP(AWS, args, {
    env: { ...process.env, MSYS_NO_PATHCONV: '1' },
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout.trim();
}

async function checkLogRetention() {
  try {
    const out = await aws([
      'logs', 'describe-log-groups',
      '--log-group-name-prefix', '/aws/lambda/rlsir-',
      '--region', REGION,
      '--query', 'logGroups[*].[logGroupName,retentionInDays]',
      '--output', 'json',
    ]);
    const groups = JSON.parse(out);
    const noRetention = groups.filter(([, r]) => r === null);
    const overRetention = groups.filter(([, r]) => r !== null && r > LIMITS.logRetentionDays.max);

    if (noRetention.length === 0 && overRetention.length === 0) {
      record('log-retention', 'PASS',
        `${groups.length} log groups, all within ${LIMITS.logRetentionDays.max}-day limit`);
    } else if (noRetention.length > 0) {
      record('log-retention', 'FAIL',
        `${noRetention.length} log groups have NO retention set (would keep logs forever)`,
        noRetention.map(([n]) => n));
    } else {
      record('log-retention', 'WARN',
        `${overRetention.length} log groups exceed ${LIMITS.logRetentionDays.max}-day retention`,
        overRetention.map(([n, r]) => `${n}: ${r}d`));
    }
  } catch (e) {
    record('log-retention', 'ERROR', `AWS call failed: ${e.message}`);
  }
}

async function checkCustomMetrics() {
  try {
    const out = await aws([
      'cloudwatch', 'list-metrics',
      '--namespace', 'RLSIR/DataPipeline',
      '--region', REGION,
      '--query', 'Metrics[*].MetricName',
      '--output', 'json',
    ]);
    const all = JSON.parse(out);
    const unique = new Set(all);
    const count = unique.size;
    const monthlyCost = count * LIMITS.cloudwatchMetrics.costPerMetric;

    if (count > LIMITS.cloudwatchMetrics.hard) {
      record('custom-metrics', 'FAIL',
        `${count} unique metrics exceeds hard cap of ${LIMITS.cloudwatchMetrics.hard} (~$${monthlyCost.toFixed(2)}/mo)`,
        Array.from(unique).sort());
    } else if (count > LIMITS.cloudwatchMetrics.soft) {
      record('custom-metrics', 'WARN',
        `${count} unique metrics exceeds soft cap of ${LIMITS.cloudwatchMetrics.soft} (~$${monthlyCost.toFixed(2)}/mo)`,
        Array.from(unique).sort());
    } else {
      record('custom-metrics', 'PASS',
        `${count} unique metrics, ~$${monthlyCost.toFixed(2)}/mo (under ${LIMITS.cloudwatchMetrics.soft} soft cap)`);
    }
  } catch (e) {
    record('custom-metrics', 'ERROR', `AWS call failed: ${e.message}`);
  }
}

async function checkAlarms() {
  try {
    const out = await aws([
      'cloudwatch', 'describe-alarms',
      '--alarm-name-prefix', 'rlsir-',
      '--region', REGION,
      '--query', 'MetricAlarms[*].AlarmName',
      '--output', 'json',
    ]);
    const alarms = JSON.parse(out);
    const count = alarms.length;
    const monthlyCost = count * LIMITS.cloudwatchAlarms.costPerAlarm;

    if (count > LIMITS.cloudwatchAlarms.hard) {
      record('alarms', 'FAIL',
        `${count} alarms exceeds hard cap of ${LIMITS.cloudwatchAlarms.hard} (~$${monthlyCost.toFixed(2)}/mo)`);
    } else if (count > LIMITS.cloudwatchAlarms.soft) {
      record('alarms', 'WARN',
        `${count} alarms exceeds soft cap of ${LIMITS.cloudwatchAlarms.soft} (~$${monthlyCost.toFixed(2)}/mo)`);
    } else {
      record('alarms', 'PASS',
        `${count} alarms, ~$${monthlyCost.toFixed(2)}/mo`);
    }
  } catch (e) {
    record('alarms', 'ERROR', `AWS call failed: ${e.message}`);
  }
}

async function checkLambdaCount() {
  try {
    const out = await aws([
      'lambda', 'list-functions',
      '--region', REGION,
      '--query', 'Functions[?starts_with(FunctionName, `rlsir-`)].FunctionName',
      '--output', 'json',
    ]);
    const fns = JSON.parse(out);
    const count = fns.length;

    if (count > LIMITS.lambdaCount.hard) {
      record('lambda-count', 'FAIL',
        `${count} Lambdas exceeds hard cap of ${LIMITS.lambdaCount.hard}`);
    } else if (count > LIMITS.lambdaCount.soft) {
      record('lambda-count', 'WARN',
        `${count} Lambdas exceeds soft cap of ${LIMITS.lambdaCount.soft}`);
    } else {
      record('lambda-count', 'PASS', `${count} Lambdas`);
    }
  } catch (e) {
    record('lambda-count', 'ERROR', `AWS call failed: ${e.message}`);
  }
}

async function checkBudget() {
  try {
    const out = await aws([
      'budgets', 'describe-budgets',
      '--account-id', ACCOUNT,
      '--query', 'Budgets[*].[BudgetName,BudgetLimit.Amount,BudgetLimit.Unit]',
      '--output', 'json',
    ]);
    const budgets = JSON.parse(out) ?? [];
    if (budgets.length === 0) {
      record('aws-budget', 'WARN',
        'No AWS Budget configured — surprises won\'t be caught until next bill');
    } else {
      const matchingBudget = budgets.find(([name]) => name.toLowerCase().includes('rlsir'));
      if (matchingBudget) {
        const [name, amount, unit] = matchingBudget;
        record('aws-budget', 'PASS', `Budget '${name}' at ${amount} ${unit}`);
      } else {
        record('aws-budget', 'WARN',
          `${budgets.length} budgets exist but none for RLSIR`);
      }
    }
  } catch (e) {
    record('aws-budget', 'ERROR', `AWS call failed: ${e.message}`);
  }
}

async function checkSentryConfig() {
  const candidates = [
    'apps/premium-site/package.json',
    'apps/backend/package.json',
    'package.json',
  ];
  let installed = false;
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    const pkg = JSON.parse(readFileSync(p, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (Object.keys(deps).some(k => k.startsWith('@sentry/'))) {
      installed = true;
      break;
    }
  }

  if (!installed) {
    record('sentry-config', 'PASS', 'Sentry not installed yet — no events to budget');
    return;
  }

  // When Sentry is installed, verify sampling config exists.
  const sentryConfigCandidates = [
    'apps/premium-site/sentry.client.config.ts',
    'apps/premium-site/sentry.client.config.js',
  ];
  let configFound = null;
  for (const p of sentryConfigCandidates) {
    if (existsSync(p)) { configFound = p; break; }
  }

  if (!configFound) {
    record('sentry-config', 'FAIL',
      'Sentry installed but no client config file — sampling discipline not enforced');
    return;
  }

  const cfg = readFileSync(configFound, 'utf8');
  const hasSampling = /tracesSampleRate\s*[:=]\s*0\.[01]/.test(cfg);
  const hasFilters = /beforeSend|inboundFilters|denyUrls/.test(cfg);

  if (hasSampling && hasFilters) {
    record('sentry-config', 'PASS',
      'Sentry sampling + filters present in client config');
  } else if (!hasSampling) {
    record('sentry-config', 'FAIL',
      `Sentry config at ${configFound} missing tracesSampleRate ≤ 0.1`);
  } else {
    record('sentry-config', 'WARN',
      `Sentry config at ${configFound} missing beforeSend/inboundFilters`);
  }
}

async function main() {
  await Promise.all([
    checkLogRetention(),
    checkCustomMetrics(),
    checkAlarms(),
    checkLambdaCount(),
    checkBudget(),
    checkSentryConfig(),
  ]);

  if (flags.json) {
    console.log(JSON.stringify({ results, limits: LIMITS }, null, 2));
  } else {
    const fmt = (s) => ({
      PASS: '\x1b[32m✓ PASS\x1b[0m',
      WARN: '\x1b[33m⚠ WARN\x1b[0m',
      FAIL: '\x1b[31m✗ FAIL\x1b[0m',
      ERROR: '\x1b[31m! ERROR\x1b[0m',
    })[s] || s;

    console.log('\n══ RLSIR Free-Tier Discipline Audit ══\n');
    for (const r of results) {
      console.log(`${fmt(r.status)}  ${r.name.padEnd(20)} ${r.message}`);
      if (r.detail) {
        const lines = Array.isArray(r.detail) ? r.detail : [r.detail];
        for (const line of lines.slice(0, 10)) {
          console.log(`         ${line}`);
        }
        if (lines.length > 10) console.log(`         ... +${lines.length - 10} more`);
      }
    }

    const fails = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length;
    const warns = results.filter(r => r.status === 'WARN').length;
    const passes = results.filter(r => r.status === 'PASS').length;

    console.log(`\n  ${passes} pass, ${warns} warn, ${fails} fail\n`);

    if (fails > 0 || (flags.strict && warns > 0)) {
      process.exit(1);
    }
  }
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(2);
});
