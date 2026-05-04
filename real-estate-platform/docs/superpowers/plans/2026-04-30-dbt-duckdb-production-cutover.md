# dbt + DuckDB Production Cutover

**Date:** 2026-04-30
**Owner:** Joey Schnepel
**Status:** Plan locked. Phase 0 ready to start.
**Supersedes nothing:** complements `docs/analytics-comprehensive-plan.md` (master strategy) — this is the execution roadmap from where we are today.

---

## 0. Where we actually are right now

| Layer | State |
|---|---|
| Bronze listings (`bronze/listings/`) | Built — but **stale**. `rlsir-armls-sync-schedule` EventBridge rule is DISABLED since 2026-04-26. Dual-write code is in place; just no fires. |
| Bronze active snapshot (`bronze/active_snapshot/current/page_*.ndjson.gz`) | **Live** — Lambda hardened today (deadline fix, reservedConcurrency=1, Maricopa filter, custom metrics, alarms). Per-page writes ~32 pages/run, hourly schedule. |
| Bronze change_log (`bronze/change_log/`) | One-shot 14-year export complete (3.5M events, 48MB Parquet). Ongoing sync paused with the listings sync. |
| dbt project (`analytics/`) | 27 models, 19 building (active branch's 8 marts gated). Last clean dev run Apr 29 in 64s. dbt-bouncer + Elementary scaffold + dbt_expectations all wired. |
| Prod marts (`s3://.../analytics/`) | **EMPTY** — prod dbt has never run. Profile is configured; nothing has executed it. |
| Premium-site dashboard | Reads RDS PG MVs (mv_dashboard, mv_market_pulse, etc.). Just fixed via migration 033 today. |
| DuckDB-WASM browser | **Not started.** No client-side query layer yet. |
| Reconciliation | Daily bronze-listings reconcile + new active-snapshot reconcile. No dbt-mart vs RDS-MV reconcile yet. |

**Single-line summary:** dev pipeline is mature, prod still runs on RDS PG. The cutover is what this plan executes.

---

## 1. Phasing

Calendar order is sequential where dependencies require it; effort is engineering-hours.

### Phase 0 — Stabilize foundation (Day 1, ~2 hrs)

**Goal:** Bronze is fresh, dev dbt is current, no stale artifacts.

| Step | Approval needed |
|---|---|
| Re-enable `rlsir-armls-sync-schedule` EventBridge rule (rate(4 hours)) | yes — AWS write |
| Wait for one successful sync cycle (4h max) → confirm bronze listings + change_log advance | — |
| Delete legacy `bronze/active_snapshot.ndjson.gz` (single file, superseded by `current/page_*`) | yes — AWS delete |
| Re-run local `dbt build --target dev` — confirm 19/19 pass post migration-033 + path updates | — |
| Smoke active-snapshot Lambda once more — confirm 24h-old fix is still solid | — |

**Validation:** `bronze-reconcile` Lambda's listings delta < 5%; active-snapshot reconcile staleness < 2h; dbt run_results.json = 19 success.
**Rollback:** disabled-state for the EventBridge rule is the original state; restoring it is `aws events disable-rule`.

---

### Phase 1 — Active branch unlock (Day 1, ~2 hrs)

**Goal:** All 27 dbt models build from real bronze active-snapshot data.

| Step | Approval needed |
|---|---|
| Flip `enable_active: true` in `dbt_project.yml` (or vars) | — |
| `dbt build --select +tag:active` — confirm 8 active marts populate | — |
| `dbt test` — confirm `months_of_supply_within_bounds`, `active_status_consistency` pass | — |
| Re-enable the active marts in `_analytics__exposures.yml` (currently commented out) | — |

**Validation:** `fct_active_inventory` row count ≈ 31K (matches Spark Maricopa Active+AUC). `fct_months_of_supply` rows in [0,60]. Calendar coverage 184/184 months.
**Rollback:** `enable_active: false` in dbt_project.yml — instant revert.

---

### Phase 2 — Production dbt deployment (Days 2–3, ~6 hrs)

**Goal:** Hourly dbt run on a schedule writes Parquet marts to `s3://.../analytics/`.

**Decision required:** runtime — Lambda (cold start cost, 15-min cap) vs GitHub Actions (free for OSS, requires GitHub Action) vs ECS Fargate (always-on $5/mo).
**Recommendation:** Lambda packaged via Docker image (10GB image limit, dbt + DuckDB + extensions fit comfortably). Reuses existing AWS auth + alarm pipeline.

| Step | Approval needed |
|---|---|
| Build Docker image for dbt + DuckDB + httpfs/parquet/postgres extensions | — |
| Push image to ECR (`rlsir-analytics-dbt`) | yes — AWS write (ECR repo create + push) |
| Create Lambda `rlsir-analytics-dbt` (Container image, 1024MB, 900s timeout) | yes — AWS write |
| IAM role: read S3 bronze, write S3 analytics/, read Secrets Manager (RDS DSN), CloudWatch Logs + PutMetricData | yes — AWS write |
| EventBridge `rate(1 hour)` schedule + put-targets | yes — AWS write |
| First manual invocation → verify `s3://.../analytics/` populates with all 27 marts | — |
| `reservedConcurrentExecutions=1` (same pattern as active-snapshot) | yes — AWS write |
| CloudWatch alarms: Errors>0, DurationAnomaly, custom `dbt_models_failed > 0` | yes — AWS write |

**Validation:** All 27 marts present at expected paths, sizes within ±10% of dev outputs. dbt's run_results.json shipped as a sidecar JSON next to the marts so CloudWatch Insights can query it.
**Rollback:** Disable EventBridge rule; existing dev pipeline + RDS MVs still serve the dashboard.

---

### Phase 3 — Parallel-run reconciliation (Day 4, ~3 hrs)

**Goal:** Daily proof that dbt marts agree with RDS MVs. Catches drift before cutover.

| Step | Approval needed |
|---|---|
| Extend `bronze-reconcile` (or new `dbt-reconcile`) Lambda: for each (mart, MV) pair, compare row counts + a checksum of summary metrics | — |
| Pairs to compare: `fct_market_pulse` ↔ `mv_market_pulse`, `fct_community_scorecard` ↔ `mv_community_scorecard`, etc. (9 pairs) | — |
| Daily cron via existing reconcile EventBridge rule | — |
| Alarm if any pair > 1% delta for 3 consecutive days | yes — AWS write |
| Build dashboard at `/admin/parity` (gated, internal) showing the daily deltas | — |

**Validation:** All 9 pairs <1% drift in a single run. Soak for 7 days before Phase 4.
**Rollback:** disable the new alarm, the reconcile is informational and doesn't affect serving.

---

### Phase 4 — DuckDB-WASM browser scaffold (Days 5–7, ~8 hrs)

**Goal:** One pilot tab (Overview) renders client-side via DuckDB-WASM reading Parquet.

| Step | Approval needed |
|---|---|
| `pnpm add @duckdb/duckdb-wasm` in `apps/premium-site` | — |
| Build `lib/duckdb-wasm.ts` — bootstrap, Parquet fetch + register, query helpers | — |
| Webpack config for COEP/COOP headers (required for WASM SharedArrayBuffer) | — |
| Wire `OverviewTab.tsx` to fetch `analytics/metro/market_pulse.parquet` + drive KPIs from in-browser queries | — |
| Add a feature flag `NEXT_PUBLIC_USE_DUCKDB_WASM=1` so we can toggle per-environment | — |
| Vercel preview deploy → manual smoke against staging | — |
| Lighthouse delta check — initial paint shouldn't regress >100ms | — |

**Validation:** KPI values match RDS-served version within rounding. Bundle size delta < 1MB (DuckDB-WASM is ~5MB but lazy-loaded). Per-tab load time within ±10% of current.
**Rollback:** Feature flag off — instant revert to RDS path.

---

### Phase 5 — Full dashboard cutover (Days 8–14, ~6 hrs)

**Goal:** All 5 Phoenix tabs read from DuckDB-WASM. RDS path stays as fallback for 14 days.

| Step | Approval needed |
|---|---|
| Port Pricing tab (Day 8) | — |
| Port Inventory tab (Day 9) | — |
| Port Activity tab (Day 10) | — |
| Port Timing tab (Day 11) | — |
| Port `/phoenix/[region]` and `/phoenix/[region]/[community]` (Day 12) | — |
| Roll feature flag: 10% → 50% → 100% over Days 12–14 | — |
| Daily check: parity reconcile green, no error spikes | — |
| 14-day soak (Days 14–28) — feature flag at 100%, RDS fallback off | — |

**Validation:** Zero parity drift > 1% across all 9 mart/MV pairs over 14 days. No client-side error spike on Sentry. Dashboard p95 paint < 2.5s on mobile 4G.
**Rollback:** Feature flag back to 0% — instant.

---

### Phase 6 — RDS shrink + decommission (Day 28+, ~4 hrs)

**Goal:** Reclaim the $46/mo RDS savings by dropping unused MVs and downsizing.

| Step | Approval needed |
|---|---|
| Drop the 9 dashboard MVs that the cutover replaced (`mv_dashboard`, `mv_market_pulse`, etc.) | yes — DESTRUCTIVE, explicit gate |
| Remove their refresh from `armls-sync.ts` REFRESH_ORDER | — |
| Update `phoenix-analytics.ts` — remove the RDS code paths entirely | — |
| Run `VACUUM FULL` on freed tables (or `pg_repack` if available) | yes — AWS write (RDS load) |
| Modify RDS instance: t3.medium → t3.micro (planned downtime ~5min) | yes — DESTRUCTIVE, explicit gate, scheduled window |
| Validate cost: AWS Cost Explorer shows new RDS line-item ≤ $20/mo | — |

**Validation:** Premium-site builds + serves with zero RDS-MV imports. Lighthouse + parity dashboard still green for 7 days post-shrink.
**Rollback:** RDS instance modify is reversible (re-upsize); MV drops are NOT (need to re-create from migrations 002+024+033). Snapshot RDS before the drop.

---

### Phase 7 — Operations + docs (Days 28+, ~3 hrs)

**Goal:** Future-Joey can debug and extend without reading a transcript.

| Step | Approval needed |
|---|---|
| `docs/runbook-analytics.md` — common ops: rerun dbt, alarm response, rollback, full-refresh | — |
| Update `docs/PROJECT.md` — mark Phase 5 of the comprehensive plan complete | — |
| Update `docs/ARCHITECTURE.md` — new dataflow diagram, deprecate the RDS-MV section | — |
| Add to `docs/DECISIONS.md` — ADRs for: dbt-on-Lambda, DuckDB-WASM bundle path, parity-reconcile threshold, RDS shrink window | — |
| Final note in `docs/CHANGELOG.md` | — |

**Validation:** New engineer (or future-Joey) can find every operational answer in one of these docs without grep.
**Rollback:** None — docs are append-only.

---

## 2. Total effort + calendar

| | Engineering hours | Calendar |
|---|---:|---|
| Phase 0 | 2 | Day 1 |
| Phase 1 | 2 | Day 1 |
| Phase 2 | 6 | Days 2–3 |
| Phase 3 | 3 | Day 4 + 7-day soak |
| Phase 4 | 8 | Days 5–7 |
| Phase 5 | 6 | Days 8–14 + 14-day soak |
| Phase 6 | 4 | Day 28+ |
| Phase 7 | 3 | Days 28–30 |
| **Total** | **34 hrs** | **~30 days** |

The calendar bottlenecks are the soak windows, not the engineering. Real shipped state at Day 14 (full cutover with RDS fallback). Cost savings unlock at Day 28+.

---

## 3. Approval gates summary

Specifically the AWS-writes that need your explicit go-ahead, in execution order:

1. **Phase 0**: re-enable `rlsir-armls-sync-schedule`; delete legacy `bronze/active_snapshot.ndjson.gz`
2. **Phase 2**: ECR repo create + image push; new Lambda `rlsir-analytics-dbt`; IAM role; EventBridge schedule; reservedConcurrency=1; 3 CloudWatch alarms
3. **Phase 3**: 1 new alarm on parity drift
4. **Phase 6** (DESTRUCTIVE — explicit gate at this point): drop 9 MVs from RDS; modify RDS instance class

Phases 1, 4, 5, 7 are code-only or feature-flagged — no fresh AWS approvals beyond what's already in scope.

---

## 4. Decisions to lock in before Phase 2

1. **dbt runtime**: Lambda container vs GitHub Actions vs ECS Fargate. **Recommend Lambda container** (reuses existing IAM/alarm pipeline, $0 idle, 15-min runs fit easily under 900s).
2. **dbt schedule cadence**: hourly aligned with active-snapshot, or 4-hourly aligned with armls-sync? **Recommend hourly** — incremental models are cheap.
3. **Mart split for browser**: per-scope-tier Parquet (metro/regions/communities) vs single Parquet glob? **Recommend per-scope-tier** (matches §4.5 of the comprehensive plan; lazy-loads dashboard tiles).
4. **Feature-flag gating**: `NEXT_PUBLIC_USE_DUCKDB_WASM` env var (build-time) or runtime cookie? **Recommend env var per Vercel environment** — simpler to roll forward via preview branches.

---

## 5. Open questions

- **Sentry integration**: do we want client-side error reporting wired before Phase 4 cutover? Right now there's no error sink for browser-side query failures.
- **PostHog or similar**: for measuring dashboard load times pre/post cutover. Could add or skip.
- **Active-snapshot CDC**: today's smoke shows ~12% drift between live Spark and RDS. Is this acceptable for the bronze pipeline, or do we want to backfill the missing ~4K records?
- **Backup before Phase 6**: confirm RDS automated snapshots are enabled and we can recover within 48h if the MV drop turns out wrong.

---

**Net:** 34 hours of engineering, 30 calendar days, 4 approval gates. Phase 0 starts now, Phase 6 ends with a $46/mo RDS savings + a fully self-serve client-side analytics dashboard.

---

**End of plan.**
