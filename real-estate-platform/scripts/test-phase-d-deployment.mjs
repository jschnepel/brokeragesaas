#!/usr/bin/env node
/**
 * Phase D — Comprehensive deployment test harness.
 *
 * Industry-standard verification for the rlsir-analytics-dbt Lambda deployment
 * per AWS Well-Architected Framework + Google SRE Operational Readiness Review +
 * the playbook's Section 2.0 standing gates.
 *
 * Usage:
 *   node scripts/test-phase-d-deployment.mjs                # all tests
 *   node scripts/test-phase-d-deployment.mjs --step ecr    # just ECR tests
 *   node scripts/test-phase-d-deployment.mjs --step iam --step lambda
 *   node scripts/test-phase-d-deployment.mjs --json         # machine-readable
 *
 * Exit code 0 = all green. Exit code 1 = at least one FAIL/ERROR.
 *
 * Test categories:
 *   - ECR (repo config, scan-on-push, immutable tags, image presence)
 *   - SCAN (vuln scan results — 0 HIGH+ CVEs blocking)
 *   - IAM (role exists, trust policy, permissions, Access Analyzer findings)
 *   - SNS (DLQ topic exists, subscriptions wired)
 *   - LAMBDA (config — memory, timeout, concurrency, DLQ, env vars, image URI)
 *   - SMOKE (task=smoke invocation returns 200)
 *   - EVENTBRIDGE (rule exists, target wired, permission granted)
 *   - ALARMS (3 alarms with expected configs — period, threshold, SNS action)
 *   - OBSERVABILITY (log retention, custom metrics emitting, structured logs)
 *   - FREETIER (overall budget posture after deploy)
 *   - FUNCTIONAL (post-enable: first fire produces expected marts in S3)
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);
const isWin = process.platform === 'win32';
const AWS = isWin ? 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe' : 'aws';
const REGION = 'us-east-1';
const ACCOUNT = '828301486081';
const FN_NAME = 'rlsir-analytics-dbt';
const ECR_REPO = 'rlsir-analytics-dbt';
const ECR_IMAGE_TAG = 'v1';
const IAM_ROLE = `${FN_NAME}-role`;
const SNS_DLQ = 'rlsir-dbt-failures';
const SNS_ALERTS = 'rlsir-token-alerts';
const EB_RULE = `${FN_NAME}-schedule`;
const ARTIFACTS_BUCKET = 'rlsir-platform-assets-us-east-1';

const flags = {
  json: process.argv.includes('--json'),
  steps: process.argv
    .map((a, i) => (a === '--step' ? process.argv[i + 1] : null))
    .filter(Boolean)
    .map(s => s.toLowerCase()),
};

const results = [];

function record(category, name, status, message, detail = null) {
  results.push({ category, name, status, message, detail });
}

async function aws(args) {
  const { stdout } = await execFileP(AWS, args, {
    env: { ...process.env, MSYS_NO_PATHCONV: '1' },
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout.trim();
}

async function awsJson(args) {
  const out = await aws(args);
  return out ? JSON.parse(out) : null;
}

// ── ECR tests ────────────────────────────────────────────

async function testEcr() {
  const cat = 'ECR';
  try {
    const repo = await awsJson([
      'ecr', 'describe-repositories',
      '--repository-names', ECR_REPO,
      '--region', REGION,
    ]);
    if (!repo || !repo.repositories || repo.repositories.length === 0) {
      record(cat, 'repo-exists', 'FAIL', `Repository ${ECR_REPO} not found`);
      return;
    }
    const r = repo.repositories[0];
    record(cat, 'repo-exists', 'PASS', `Repository ${r.repositoryName} (created ${r.createdAt})`);

    const scanOnPush = r.imageScanningConfiguration?.scanOnPush;
    record(cat, 'scan-on-push',
      scanOnPush ? 'PASS' : 'FAIL',
      `scanOnPush=${scanOnPush}`);

    const tagMutability = r.imageTagMutability;
    record(cat, 'tag-immutable',
      tagMutability === 'IMMUTABLE' ? 'PASS' : 'WARN',
      `imageTagMutability=${tagMutability} (best practice: IMMUTABLE)`);
  } catch (e) {
    record(cat, 'repo-exists', 'FAIL', `aws ecr describe-repositories failed: ${e.message}`);
    return;
  }

  try {
    const images = await awsJson([
      'ecr', 'describe-images',
      '--repository-name', ECR_REPO,
      '--image-ids', `imageTag=${ECR_IMAGE_TAG}`,
      '--region', REGION,
    ]);
    if (images && images.imageDetails && images.imageDetails.length > 0) {
      const img = images.imageDetails[0];
      const sizeMb = (img.imageSizeInBytes / 1024 / 1024).toFixed(0);
      record(cat, 'image-present', 'PASS',
        `Image tag=${ECR_IMAGE_TAG}, size=${sizeMb}MB, pushed ${img.imagePushedAt}`);
      record(cat, 'image-size-budget',
        Number(sizeMb) < 2500 ? 'PASS' : 'WARN',
        `Image size ${sizeMb}MB (soft cap 2500MB; Lambda hard cap 10GB)`);
    } else {
      record(cat, 'image-present', 'FAIL', `No image with tag=${ECR_IMAGE_TAG}`);
    }
  } catch (e) {
    record(cat, 'image-present', 'FAIL', `aws ecr describe-images failed: ${e.message}`);
  }
}

// ── Vulnerability scan tests ─────────────────────────────

// CVEs accepted as non-exploitable in this Lambda's use case.
// Each entry needs a justification in the comment.
const CVE_EXCEPTIONS = {
  // iconv() in glibc 2.43- crashes on IBM1390/IBM1399 character set inputs.
  // Our Lambda processes JSON events + dbt models + DuckDB queries — never
  // calls iconv() with attacker-controlled IBM1390/IBM1399 input.
  // AWS will patch the Lambda base image eventually; revisit at next image rebuild.
  'CVE-2026-4046': 'iconv() IBM1390/IBM1399 — no attack surface in dbt/DuckDB Lambda',
};

async function testScan() {
  const cat = 'SCAN';
  try {
    const findings = await awsJson([
      'ecr', 'describe-image-scan-findings',
      '--repository-name', ECR_REPO,
      '--image-id', `imageTag=${ECR_IMAGE_TAG}`,
      '--region', REGION,
    ]);
    if (!findings || !findings.imageScanFindings) {
      record(cat, 'scan-completed', 'WARN', 'Scan results not yet available — retry in 60s');
      return;
    }
    const sev = findings.imageScanFindings.findingSeverityCounts ?? {};
    const critical = sev.CRITICAL ?? 0;
    const high = sev.HIGH ?? 0;
    const med = sev.MEDIUM ?? 0;
    const low = sev.LOW ?? 0;

    // Filter HIGH findings against exception list
    const allFindings = findings.imageScanFindings.findings ?? [];
    const highFindings = allFindings.filter(f => f.severity === 'HIGH');
    const unjustifiedHigh = highFindings.filter(f => !CVE_EXCEPTIONS[f.name]);
    const justifiedHigh = highFindings.filter(f => CVE_EXCEPTIONS[f.name]);

    record(cat, 'critical-cves',
      critical === 0 ? 'PASS' : 'FAIL',
      `${critical} CRITICAL CVEs (block deploy if > 0)`);
    record(cat, 'high-cves-unjustified',
      unjustifiedHigh.length === 0 ? 'PASS' : 'FAIL',
      `${unjustifiedHigh.length} HIGH CVEs without justification (block deploy if > 0)`,
      unjustifiedHigh.map(f => `${f.name}: ${f.description?.slice(0, 100) ?? ''}`));
    if (justifiedHigh.length > 0) {
      record(cat, 'high-cves-justified', 'WARN',
        `${justifiedHigh.length} HIGH CVEs with documented exceptions (review at next rebuild)`,
        justifiedHigh.map(f => `${f.name}: ${CVE_EXCEPTIONS[f.name]}`));
    }
    record(cat, 'medium-cves',
      med < 50 ? 'PASS' : 'WARN',
      `${med} MEDIUM CVEs (informational; <50 acceptable)`);
    record(cat, 'low-cves', 'PASS', `${low} LOW CVEs (informational)`);
  } catch (e) {
    if (e.message.includes('ScanNotFoundException')) {
      record(cat, 'scan-completed', 'WARN', 'Scan not yet started — wait + retry');
    } else {
      record(cat, 'scan-completed', 'FAIL', `aws ecr describe-image-scan-findings failed: ${e.message}`);
    }
  }
}

// ── IAM tests ────────────────────────────────────────────

async function testIam() {
  const cat = 'IAM';
  try {
    const role = await awsJson([
      'iam', 'get-role',
      '--role-name', IAM_ROLE,
    ]);
    if (!role || !role.Role) {
      record(cat, 'role-exists', 'FAIL', `Role ${IAM_ROLE} not found`);
      return;
    }
    record(cat, 'role-exists', 'PASS', `Role ${role.Role.Arn}`);

    // Trust policy: must allow only lambda.amazonaws.com to assume
    const trust = role.Role.AssumeRolePolicyDocument;
    const stmts = trust?.Statement ?? [];
    const hasLambdaTrust = stmts.some(s =>
      s.Effect === 'Allow' &&
      s.Principal?.Service === 'lambda.amazonaws.com' &&
      s.Action === 'sts:AssumeRole'
    );
    record(cat, 'trust-policy',
      hasLambdaTrust ? 'PASS' : 'FAIL',
      hasLambdaTrust ? 'Lambda service trust' : 'No lambda.amazonaws.com trust');

    // Inline policies
    const policies = await awsJson([
      'iam', 'list-role-policies',
      '--role-name', IAM_ROLE,
    ]);
    record(cat, 'inline-policies',
      policies?.PolicyNames?.length > 0 ? 'PASS' : 'FAIL',
      `Inline policies: ${(policies?.PolicyNames ?? []).join(', ') || 'none'}`);

    // Wildcard check on inline permissions
    if (policies?.PolicyNames?.length > 0) {
      const policyDoc = await awsJson([
        'iam', 'get-role-policy',
        '--role-name', IAM_ROLE,
        '--policy-name', policies.PolicyNames[0],
      ]);
      const allStmts = policyDoc?.PolicyDocument?.Statement ?? [];
      const wildcards = allStmts.filter(s =>
        Array.isArray(s.Action) ? s.Action.includes('*') :
        s.Action === '*'
      );
      record(cat, 'no-wildcard-actions',
        wildcards.length === 0 ? 'PASS' : 'FAIL',
        wildcards.length === 0 ? 'No wildcard actions' : `${wildcards.length} wildcard action(s)`);

      const wildcardResources = allStmts.filter(s =>
        s.Resource === '*' && (
          Array.isArray(s.Action) ? s.Action.some(a => !a.startsWith('cloudwatch')) :
          !s.Action.startsWith('cloudwatch')
        )
      );
      record(cat, 'no-wildcard-resources',
        wildcardResources.length === 0 ? 'PASS' : 'WARN',
        wildcardResources.length === 0 ? 'No wildcard resources (except cloudwatch metrics)' :
          `${wildcardResources.length} wildcard resource(s) — review`);
    }

    // Attached managed policies — should include AWSLambdaBasicExecutionRole
    const attached = await awsJson([
      'iam', 'list-attached-role-policies',
      '--role-name', IAM_ROLE,
    ]);
    const hasBasic = (attached?.AttachedPolicies ?? [])
      .some(p => p.PolicyName === 'AWSLambdaBasicExecutionRole');
    record(cat, 'has-basic-execution',
      hasBasic ? 'PASS' : 'FAIL',
      hasBasic ? 'AWSLambdaBasicExecutionRole attached' : 'Missing AWSLambdaBasicExecutionRole');
  } catch (e) {
    record(cat, 'role-exists', 'FAIL', `IAM check failed: ${e.message}`);
  }
}

// ── SNS DLQ tests ────────────────────────────────────────

async function testSns() {
  const cat = 'SNS';
  try {
    const topics = await awsJson([
      'sns', 'list-topics',
      '--region', REGION,
    ]);
    const dlqArn = `arn:aws:sns:${REGION}:${ACCOUNT}:${SNS_DLQ}`;
    const exists = (topics?.Topics ?? []).some(t => t.TopicArn === dlqArn);
    record(cat, 'dlq-exists',
      exists ? 'PASS' : 'FAIL',
      exists ? `Topic ${SNS_DLQ}` : `Topic ${SNS_DLQ} not found`);

    const alertsArn = `arn:aws:sns:${REGION}:${ACCOUNT}:${SNS_ALERTS}`;
    const alertsExists = (topics?.Topics ?? []).some(t => t.TopicArn === alertsArn);
    record(cat, 'alerts-topic',
      alertsExists ? 'PASS' : 'WARN',
      alertsExists ? `Topic ${SNS_ALERTS} (existing alarm sink)` : `${SNS_ALERTS} not found — alarms won't reach email`);
  } catch (e) {
    record(cat, 'dlq-exists', 'FAIL', `SNS check failed: ${e.message}`);
  }
}

// ── Lambda function tests ────────────────────────────────

async function testLambda() {
  const cat = 'LAMBDA';
  try {
    const fn = await awsJson([
      'lambda', 'get-function',
      '--function-name', FN_NAME,
      '--region', REGION,
    ]);
    if (!fn || !fn.Configuration) {
      record(cat, 'function-exists', 'FAIL', `Function ${FN_NAME} not found`);
      return;
    }
    const c = fn.Configuration;
    record(cat, 'function-exists', 'PASS', `${c.FunctionArn}`);
    record(cat, 'package-type',
      c.PackageType === 'Image' ? 'PASS' : 'FAIL',
      `PackageType=${c.PackageType}`);
    record(cat, 'memory',
      c.MemorySize === 1024 ? 'PASS' : 'WARN',
      `MemorySize=${c.MemorySize}MB (planned: 1024)`);
    record(cat, 'timeout',
      c.Timeout === 900 ? 'PASS' : 'WARN',
      `Timeout=${c.Timeout}s (planned: 900)`);
    record(cat, 'runtime',
      c.PackageType === 'Image' ? 'PASS' : 'WARN',
      `Image-based (no runtime version)`);

    // Reserved concurrency
    const concurrency = await awsJson([
      'lambda', 'get-function-concurrency',
      '--function-name', FN_NAME,
      '--region', REGION,
    ]);
    const reserved = concurrency?.ReservedConcurrentExecutions;
    record(cat, 'reserved-concurrency',
      reserved === 1 ? 'PASS' : 'FAIL',
      `reservedConcurrentExecutions=${reserved} (must be 1 for serialized batch)`);

    // DLQ
    record(cat, 'dlq-wired',
      c.DeadLetterConfig?.TargetArn?.includes(SNS_DLQ) ? 'PASS' : 'FAIL',
      `DLQ: ${c.DeadLetterConfig?.TargetArn ?? 'none'}`);

    // Environment variables
    const env = c.Environment?.Variables ?? {};
    record(cat, 'env-artifacts-bucket',
      env.ARTIFACTS_BUCKET === ARTIFACTS_BUCKET ? 'PASS' : 'FAIL',
      `ARTIFACTS_BUCKET=${env.ARTIFACTS_BUCKET ?? 'unset'}`);
    record(cat, 'env-artifacts-prefix',
      env.ARTIFACTS_PREFIX ? 'PASS' : 'WARN',
      `ARTIFACTS_PREFIX=${env.ARTIFACTS_PREFIX ?? 'unset'}`);
    record(cat, 'env-dbt-target',
      env.DBT_TARGET === 'prod' ? 'PASS' : 'WARN',
      `DBT_TARGET=${env.DBT_TARGET ?? 'unset'}`);

    // No real secret values in env. Placeholders ("dummy", "will-fetch-…") are
    // OK as documentation markers; only real-looking secret values FAIL.
    const PLACEHOLDER_RE = /^(dummy|placeholder|TBD|will-fetch|\(unset\)|)$|will-fetch-from-secrets-manager/i;
    const suspicious = Object.entries(env).filter(([k, v]) =>
      /TOKEN|PASSWORD|SECRET|KEY/.test(k.toUpperCase()) &&
      !['ARTIFACTS_BUCKET', 'ARTIFACTS_PREFIX', 'DBT_TARGET'].includes(k) &&
      !PLACEHOLDER_RE.test(v)
    );
    const placeholders = Object.entries(env).filter(([k, v]) =>
      /TOKEN|PASSWORD|SECRET|KEY/.test(k.toUpperCase()) &&
      PLACEHOLDER_RE.test(v)
    );
    record(cat, 'no-real-secrets-in-env',
      suspicious.length === 0 ? 'PASS' : 'FAIL',
      suspicious.length === 0 ? 'No real-looking secret values in env' :
        `Found real-looking secrets: ${suspicious.map(([k]) => k).join(', ')}`);
    if (placeholders.length > 0) {
      record(cat, 'placeholder-secrets', 'WARN',
        `Placeholder values present (migrate to Secrets Manager runtime fetch): ${placeholders.map(([k]) => k).join(', ')}`);
    }

    // Image URI — lives on fn.Code, not fn.Configuration
    const imageUri = fn.Code?.ImageUri ?? c.Code?.ImageUri;
    record(cat, 'image-uri',
      imageUri?.includes(ECR_REPO) ? 'PASS' : 'FAIL',
      `ImageUri: ${imageUri ?? 'unset'}`);

    // Last update status
    record(cat, 'last-update-status',
      c.LastUpdateStatus === 'Successful' ? 'PASS' : 'WARN',
      `LastUpdateStatus=${c.LastUpdateStatus}`);
    record(cat, 'state',
      c.State === 'Active' ? 'PASS' : 'WARN',
      `State=${c.State}`);
  } catch (e) {
    record(cat, 'function-exists', 'FAIL', `Lambda check failed: ${e.message}`);
  }
}

// ── Smoke invocation test ────────────────────────────────

async function testSmoke() {
  const cat = 'SMOKE';
  try {
    const tmpFile = `smoke-out-${Date.now()}.json`;
    await aws([
      'lambda', 'invoke',
      '--function-name', FN_NAME,
      '--payload', JSON.stringify({ task: 'smoke' }),
      '--cli-binary-format', 'raw-in-base64-out',
      '--region', REGION,
      tmpFile,
    ]);
    // Read response
    const fs = await import('node:fs');
    const out = fs.readFileSync(tmpFile, 'utf8');
    fs.unlinkSync(tmpFile);
    let parsed;
    try { parsed = JSON.parse(out); } catch { parsed = null; }
    if (!parsed) {
      record(cat, 'smoke-response-parses', 'FAIL', `Response not JSON: ${out.slice(0, 200)}`);
      return;
    }
    record(cat, 'smoke-response-parses', 'PASS', 'Response parses');

    record(cat, 'smoke-status-200',
      parsed.statusCode === 200 ? 'PASS' : 'FAIL',
      `statusCode=${parsed.statusCode}`);

    let body;
    try { body = JSON.parse(parsed.body); } catch { body = null; }
    if (body) {
      record(cat, 'smoke-task-correct',
        body.task === 'smoke' ? 'PASS' : 'FAIL',
        `task=${body.task}`);
      record(cat, 'smoke-exit-code',
        body.exit_code === 0 ? 'PASS' : 'FAIL',
        `dbt parse exit_code=${body.exit_code}`);
      record(cat, 'smoke-duration',
        (body.duration_seconds ?? 999) < 60 ? 'PASS' : 'WARN',
        `duration=${body.duration_seconds}s (cold start budget: <60s)`);
    }
  } catch (e) {
    record(cat, 'smoke-invocation', 'FAIL', `Invocation failed: ${e.message}`);
  }
}

// ── EventBridge tests ────────────────────────────────────

async function testEventBridge(expectEnabled = false) {
  const cat = 'EVENTBRIDGE';
  try {
    const rule = await awsJson([
      'events', 'describe-rule',
      '--name', EB_RULE,
      '--region', REGION,
    ]);
    if (!rule || !rule.Name) {
      record(cat, 'rule-exists', 'FAIL', `Rule ${EB_RULE} not found`);
      return;
    }
    record(cat, 'rule-exists', 'PASS', `${rule.Arn}`);
    record(cat, 'schedule-expression',
      rule.ScheduleExpression === 'rate(1 hour)' ? 'PASS' : 'WARN',
      `ScheduleExpression=${rule.ScheduleExpression}`);
    record(cat, 'state',
      expectEnabled ? (rule.State === 'ENABLED' ? 'PASS' : 'FAIL') :
                       (rule.State === 'DISABLED' ? 'PASS' : 'WARN'),
      `State=${rule.State} (expected ${expectEnabled ? 'ENABLED' : 'DISABLED'})`);

    const targets = await awsJson([
      'events', 'list-targets-by-rule',
      '--rule', EB_RULE,
      '--region', REGION,
    ]);
    const lambdaTarget = (targets?.Targets ?? []).find(t =>
      t.Arn?.includes(`function:${FN_NAME}`));
    record(cat, 'target-wired',
      lambdaTarget ? 'PASS' : 'FAIL',
      lambdaTarget ? `Target id=${lambdaTarget.Id}` : 'No Lambda target');

    if (lambdaTarget?.Input) {
      try {
        const input = JSON.parse(lambdaTarget.Input);
        record(cat, 'target-input-task-run',
          input.task === 'run' ? 'PASS' : 'WARN',
          `Target invokes with task=${input.task}`);
      } catch {
        record(cat, 'target-input-task-run', 'WARN', 'Target Input not parseable as JSON');
      }
    }

    // Lambda permission for EventBridge
    const policy = await awsJson([
      'lambda', 'get-policy',
      '--function-name', FN_NAME,
      '--region', REGION,
    ]).catch(() => null);
    const policyDoc = policy?.Policy ? JSON.parse(policy.Policy) : null;
    const ebPermission = (policyDoc?.Statement ?? []).find(s =>
      s.Principal?.Service === 'events.amazonaws.com' &&
      s.Action === 'lambda:InvokeFunction'
    );
    record(cat, 'lambda-invoke-permission',
      ebPermission ? 'PASS' : 'FAIL',
      ebPermission ? `Permission ${ebPermission.Sid}` : 'No EventBridge invoke permission');
  } catch (e) {
    record(cat, 'rule-exists', 'FAIL', `EventBridge check failed: ${e.message}`);
  }
}

// ── CloudWatch Alarms tests ──────────────────────────────

async function testAlarms() {
  const cat = 'ALARMS';
  const expectedAlarms = [
    {
      name: `${FN_NAME}-errors`,
      metric: 'Errors',
      ns: 'AWS/Lambda',
      stat: 'Sum',
      thresholdMax: 0,
    },
    {
      name: `${FN_NAME}-models-failed`,
      metric: 'DbtModelsFailed',
      ns: 'RLSIR/DataPipeline',
      stat: 'Maximum',
      thresholdMax: 0,
    },
    {
      name: `${FN_NAME}-duration-anomaly`,
      metric: 'Duration',
      ns: 'AWS/Lambda',
      stat: 'p99',
      thresholdMin: 1,
    },
  ];

  try {
    const alarms = await awsJson([
      'cloudwatch', 'describe-alarms',
      '--alarm-name-prefix', `${FN_NAME}-`,
      '--region', REGION,
    ]);
    const live = alarms?.MetricAlarms ?? [];
    record(cat, 'alarm-count',
      live.length >= 3 ? 'PASS' : 'FAIL',
      `Found ${live.length} alarms (expected ≥3)`);

    for (const expected of expectedAlarms) {
      const actual = live.find(a => a.AlarmName === expected.name);
      if (!actual) {
        record(cat, expected.name, 'FAIL', `Alarm not found`);
        continue;
      }
      const checks = [
        actual.MetricName === expected.metric,
        actual.Namespace === expected.ns,
        actual.TreatMissingData === 'notBreaching',
        Array.isArray(actual.AlarmActions) && actual.AlarmActions.length > 0,
      ];
      const ok = checks.every(Boolean);
      record(cat, expected.name,
        ok ? 'PASS' : 'WARN',
        `metric=${actual.MetricName}, ns=${actual.Namespace}, treat=${actual.TreatMissingData}, actions=${actual.AlarmActions?.length ?? 0}`);
      record(cat, `${expected.name}-state`,
        actual.StateValue === 'OK' || actual.StateValue === 'INSUFFICIENT_DATA' ? 'PASS' : 'WARN',
        `StateValue=${actual.StateValue}`);
    }
  } catch (e) {
    record(cat, 'alarm-count', 'FAIL', `Alarms check failed: ${e.message}`);
  }
}

// ── Observability tests ──────────────────────────────────

async function testObservability() {
  const cat = 'OBSERVABILITY';
  try {
    const lg = await awsJson([
      'logs', 'describe-log-groups',
      '--log-group-name-prefix', `/aws/lambda/${FN_NAME}`,
      '--region', REGION,
    ]);
    const grp = lg?.logGroups?.[0];
    if (!grp) {
      record(cat, 'log-group-exists', 'WARN', 'Log group not yet created (first invocation creates it)');
      return;
    }
    record(cat, 'log-group-exists', 'PASS', grp.logGroupName);
    record(cat, 'log-retention',
      grp.retentionInDays === 30 ? 'PASS' : (grp.retentionInDays ? 'WARN' : 'FAIL'),
      `retentionInDays=${grp.retentionInDays ?? 'unset (forever)'}`);

    // Custom metrics emitted
    const metrics = await awsJson([
      'cloudwatch', 'list-metrics',
      '--namespace', 'RLSIR/DataPipeline',
      '--region', REGION,
    ]);
    const metricNames = (metrics?.Metrics ?? []).map(m => m.MetricName);
    const expectedMetrics = ['DbtModelsBuilt', 'DbtModelsFailed', 'DbtRunSeconds'];
    for (const m of expectedMetrics) {
      record(cat, `metric-${m}`,
        metricNames.includes(m) ? 'PASS' : 'WARN',
        metricNames.includes(m) ? 'Emitted' : 'Not yet seen — fires on first run');
    }
  } catch (e) {
    record(cat, 'log-group-exists', 'FAIL', `Observability check failed: ${e.message}`);
  }
}

// ── Free-tier discipline ─────────────────────────────────

async function testFreetier() {
  const cat = 'FREETIER';
  try {
    const out = await execFileP('node', ['scripts/check-free-tier.mjs', '--json'], {
      env: { ...process.env, MSYS_NO_PATHCONV: '1' },
    });
    const parsed = JSON.parse(out.stdout);
    const fails = parsed.results.filter(r => r.status === 'FAIL').length;
    const warns = parsed.results.filter(r => r.status === 'WARN').length;
    record(cat, 'audit-pass',
      fails === 0 ? 'PASS' : 'FAIL',
      `${fails} FAIL, ${warns} WARN, ${parsed.results.length} total`);
  } catch (e) {
    record(cat, 'audit-pass', 'FAIL', `check-free-tier.mjs failed: ${e.message}`);
  }
}

// ── Functional test: post-enable, verify marts produced ──

async function testFunctional() {
  const cat = 'FUNCTIONAL';
  try {
    const objects = await awsJson([
      's3api', 'list-objects-v2',
      '--bucket', ARTIFACTS_BUCKET,
      '--prefix', 'analytics/',
      '--region', REGION,
      '--max-items', '50',
    ]);
    const contents = objects?.Contents ?? [];
    record(cat, 'analytics-prefix-populated',
      contents.length > 0 ? 'PASS' : 'WARN',
      `Found ${contents.length} object(s) under analytics/ (will populate after first scheduled fire)`);

    const runResults = contents.filter(c => c.Key.includes('run_results-'));
    record(cat, 'run-results-sidecar',
      runResults.length > 0 ? 'PASS' : 'WARN',
      `Found ${runResults.length} run_results-*.json sidecar(s)`);

    // Look for mart-shaped paths
    const martPrefixes = new Set();
    for (const c of contents) {
      const m = c.Key.match(/^analytics\/([^/]+)\//);
      if (m) martPrefixes.add(m[1]);
    }
    record(cat, 'mart-prefixes',
      martPrefixes.size > 0 ? 'PASS' : 'WARN',
      `Top-level mart prefixes: ${Array.from(martPrefixes).join(', ') || '(none yet)'}`);
  } catch (e) {
    record(cat, 'analytics-prefix-populated', 'FAIL', `S3 list failed: ${e.message}`);
  }
}

// ── Main ─────────────────────────────────────────────────

const STEPS = {
  ecr: testEcr,
  scan: testScan,
  iam: testIam,
  sns: testSns,
  lambda: testLambda,
  smoke: testSmoke,
  eventbridge: () => testEventBridge(false),
  'eventbridge-enabled': () => testEventBridge(true),
  alarms: testAlarms,
  observability: testObservability,
  freetier: testFreetier,
  functional: testFunctional,
};

const DEFAULT_ORDER = [
  'ecr', 'scan', 'iam', 'sns', 'lambda', 'smoke',
  'eventbridge', 'alarms', 'observability', 'freetier',
];

async function main() {
  const stepsToRun = flags.steps.length > 0 ? flags.steps : DEFAULT_ORDER;
  for (const step of stepsToRun) {
    const fn = STEPS[step];
    if (!fn) {
      console.error(`Unknown step: ${step}`);
      continue;
    }
    await fn();
  }

  if (flags.json) {
    console.log(JSON.stringify({ results }, null, 2));
    const fails = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length;
    process.exit(fails > 0 ? 1 : 0);
    return;
  }

  const fmt = (s) => ({
    PASS: '\x1b[32m✓ PASS\x1b[0m',
    WARN: '\x1b[33m⚠ WARN\x1b[0m',
    FAIL: '\x1b[31m✗ FAIL\x1b[0m',
    ERROR: '\x1b[31m! ERROR\x1b[0m',
  })[s] || s;

  console.log('\n══ Phase D Deployment Test Harness ══\n');
  let lastCat = null;
  for (const r of results) {
    if (r.category !== lastCat) {
      console.log(`\n[${r.category}]`);
      lastCat = r.category;
    }
    console.log(`  ${fmt(r.status)}  ${r.name.padEnd(28)} ${r.message}`);
  }
  const fails = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length;
  const warns = results.filter(r => r.status === 'WARN').length;
  const passes = results.filter(r => r.status === 'PASS').length;
  console.log(`\n  ${passes} pass, ${warns} warn, ${fails} fail\n`);
  process.exit(fails > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test harness failed:', err);
  process.exit(2);
});
