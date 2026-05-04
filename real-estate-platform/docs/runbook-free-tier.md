# Free-Tier Discipline Runbook

**Last verified:** 2026-05-04
**Owner:** Joey
**Goal:** Keep RLSIR's monthly AWS + SaaS spend predictable and minimized.

This runbook is the operator-facing companion to the *Free Tier Discipline* section of `docs/superpowers/plans/2026-05-04-roadmap-best-practices.md`. The plan documents the *why*; this runbook is the *how*.

---

## Quick start

Run the audit any time:

```bash
node scripts/check-free-tier.mjs
```

Exit code 0 = green. Exit code 1 = at least one failure.

The audit also runs automatically every Monday morning via `.github/workflows/free-tier-audit.yml`.

---

## Current spend snapshot (2026-05-04)

| Service | Monthly cost | Notes |
|---|---:|---|
| RDS db.t3.medium | $66.00 | Drops to ~$20 after Phase H shrink |
| CloudWatch Custom Metrics | $6.90 | 23 metrics × $0.30 |
| CloudWatch Alarms | $1.50 | 15 alarms × $0.10 |
| CloudWatch Logs | $0.10 | Minimal ingest |
| S3 | $0.03 | 500 MB |
| Lambda | $0.00 | Within free quota |
| Sentry / Vercel / GitHub Actions | $0.00 | Free tiers |
| **Total** | **$68.53/mo** | |
| **Post-Phase-H target** | **<$25/mo** | |

---

## Hard limits (audit fails if breached)

| Resource | Soft cap | Hard cap | Action on breach |
|---|---:|---:|---|
| CloudWatch custom metric names | 30 | 40 | Consolidate via dimensions, not new names |
| CloudWatch alarms | 20 | 30 | Drop redundant alarms; consolidate to RED metrics |
| Log retention days per group | 30 | 30 | Always set retention on new log groups |
| Lambda count | 12 | 20 | Combine related Lambdas where coupling is acceptable |
| Monthly forecasted spend | $30 | $50 | Investigate via Cost Explorer + the audit script |

---

## Adding a new alarm — checklist

1. Run `node scripts/check-free-tier.mjs` — confirm alarms count <20
2. Use existing metric where possible (alarm on existing metric is free; new metric is +$0.30)
3. Set `--treat-missing-data notBreaching` (avoids false fires during gaps)
4. Add to `infra/lambda/alarms-snapshot.json` for recovery reference

## Adding a new metric — checklist

1. Run `node scripts/check-free-tier.mjs` — confirm metric count <30
2. **First ask: can this be a dimension on an existing metric?** (e.g., `MartName` dimension on `ParityDelta` instead of 9 separate metrics)
3. Use the `RLSIR/DataPipeline` namespace
4. Document it in this runbook's "Active metrics" section below
5. If you cross 30, justify in an ADR and bump the soft cap deliberately

## Creating a new Lambda — checklist

1. Set log retention immediately on creation:
   ```bash
   MSYS_NO_PATHCONV=1 aws logs put-retention-policy \
     --log-group-name /aws/lambda/<name> \
     --retention-in-days 30 \
     --region us-east-1
   ```
2. Use Power Tools for Python (or pino for Node) — structured logs only
3. Set `--reserved-concurrent-executions 1` for batch jobs
4. Configure DLQ for async invocations
5. Tag with `Project: rlsir`, `Phase: <current phase>` for cost attribution

## Installing Sentry (when Phase G arrives)

The audit checks for these patterns in `apps/premium-site/sentry.client.config.{ts,js}`:

```ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,        // 10% performance sampling — required
  replaysOnErrorSampleRate: 0,  // 0% — paid feature
  replaysSessionSampleRate: 0,  // 0% — paid feature
  beforeSend(event) {
    // Drop browser noise
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver loop')) return null;
    if (event.request?.url?.startsWith('chrome-extension://')) return null;
    if (event.request?.url?.startsWith('moz-extension://')) return null;
    return event;
  },
});
```

If the file exists but is missing `tracesSampleRate ≤ 0.1`, the audit FAILS.

---

## Monthly review (15 min)

1. AWS Cost Explorer → filter to last 30 days → confirm against the snapshot above
2. Run `node scripts/check-free-tier.mjs` — fix any FAIL
3. Open Sentry dashboard (if installed) — confirm event count <4K (under 5K limit)
4. Open GitHub Actions billing — confirm <1.5K minutes (under 2K free)
5. Update the *Current spend snapshot* table in this file with the latest numbers

---

## When the audit catches something

### `log-retention FAIL`

Some Lambda created without a retention policy. Fix:

```bash
MSYS_NO_PATHCONV=1 "C:/Program Files/Amazon/AWSCLIV2/aws.exe" logs put-retention-policy \
  --log-group-name <name> \
  --retention-in-days 30 \
  --region us-east-1
```

This is a one-time AWS write. Logs auto-prune after 30 days going forward.

### `custom-metrics WARN` or `FAIL`

Either consolidate metrics that are duplicates (e.g., `ArmlsParquetRows` appears in multiple dimensions but counts as one metric in pricing — verify that's still true), or accept the increased cost in an ADR.

To find duplicates:
```bash
MSYS_NO_PATHCONV=1 aws cloudwatch list-metrics --namespace RLSIR/DataPipeline \
  --output json | jq '.Metrics | group_by(.MetricName) | map({name: .[0].MetricName, count: length}) | sort_by(.count) | reverse'
```

### `alarms WARN` or `FAIL`

List + decide which to drop:
```bash
MSYS_NO_PATHCONV=1 aws cloudwatch describe-alarms --alarm-name-prefix rlsir- \
  --query 'MetricAlarms[*].[AlarmName,StateValue,StateUpdatedTimestamp]' --output table
```

Drop alarms that haven't fired in 90+ days unless they protect a known-recurring failure mode.

### `aws-budget WARN`

No AWS Budget configured. Create one:
```bash
MSYS_NO_PATHCONV=1 aws budgets create-budget \
  --account-id 828301486081 \
  --budget '{"BudgetName":"rlsir-monthly","BudgetLimit":{"Amount":"30","Unit":"USD"},"TimeUnit":"MONTHLY","BudgetType":"COST"}' \
  --notifications-with-subscribers '[{"Notification":{"NotificationType":"FORECASTED","ComparisonOperator":"GREATER_THAN","Threshold":80,"ThresholdType":"PERCENTAGE"},"Subscribers":[{"SubscriptionType":"EMAIL","Address":"jschnepel@gmail.com"}]}]'
```

The first 2 AWS Budgets are free; this one fits under that ceiling.

### `sentry-config FAIL`

Sentry installed but client config missing sampling. Edit `apps/premium-site/sentry.client.config.ts` per the snippet above.

---

## Active metrics (RLSIR/DataPipeline namespace)

Keep this list in sync with reality. Run the audit script and update on changes.

**Current count: 23 (verified 2026-05-04, ~$6.90/mo)**

ARMLS sync + compliance:
1. `ActivesStaleOver12h` — count of stale Active+AUC listings
2. `ActivesStaleOver24h` — same, 24h threshold
3. `ActivesRefreshRecordsUpserted` — refresh-actives upserts per run
4. `ActivesRefreshPagesProcessed` — refresh-actives pages per run
5. `ActivesMarkedWithdrawn` — mark-stale-actives output

Active snapshot:
6. `ActiveSnapshotBronzeRecords`
7. `ActiveSnapshotPgRecords`
8. `ActiveSnapshotGzippedBytes`
9. `ActiveSnapshotDurationSeconds`
10. `ActiveSnapshotPagesFetched`
11. `ActiveSnapshotRecords`
12. `ActiveSnapshotStalenessHours`
13. `ActiveSnapshotDeltaPct`

Bronze reconcile:
14. `BronzeReconciliationAbsDelta`
15. `PgRowCount`
16. `BronzeRowCount`
17. `BronzeReconciliationDelta`
18. `BronzePageCount`

Parquet export:
19. `ArmlsParquetExportFailures`
20. `ArmlsParquetExportSecondsTotal`
21. `ArmlsParquetRows`
22. `ArmlsParquetBytes`
23. `ArmlsParquetExportSeconds`

**Phase D additions (planned, +5 max):** `dbt_models_failed`, `dbt_run_seconds`, `dbt_freshness_seconds`, `parity_max_drift_pct` (single metric with `MartName` dimension covers all 9 marts), `parity_drift_count_over_threshold`. New total: 28 — under soft cap of 30.

---

## When to escalate (raise costs deliberately)

Some of these limits exist to prevent drift, not to block legitimate growth. Bumping a cap is OK if:

1. There's an ADR in `docs/DECISIONS.md` explaining why
2. The new monthly spend is forecast in this runbook's snapshot
3. The hard cap moves with the soft cap (no widening of the FAIL→PASS gap)

Example legitimate bumps:
- Sentry error volume crosses 5K → upgrade to Team tier ($26/mo) or tighten sampling further
- Custom metrics cross 40 → likely means we've earned more telemetry; document and proceed
- Lambda count crosses 12 → likely means a new architectural concern; ADR documents the boundary

---

## References

- `scripts/check-free-tier.mjs` — the audit script
- `.github/workflows/free-tier-audit.yml` — weekly cron
- `docs/superpowers/plans/2026-05-04-roadmap-best-practices.md` §Free Tier Discipline — research basis
- AWS Pricing Calculator — calculator.aws — model new costs before deploy
- AWS Free Tier — aws.amazon.com/free — current free-tier rules
