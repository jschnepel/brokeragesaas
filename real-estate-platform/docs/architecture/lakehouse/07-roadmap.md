# Implementation Roadmap

**Date:** 2026-04-30
**Status:** Execution plan from current state to full lakehouse production.
**Supersedes:** `2026-04-30-dbt-duckdb-production-cutover.md` (incorporates the revisions surfaced in chat).

---

## 1. Where we are today

| Layer | State |
|---|---|
| Bronze listings | Built — but **stale**. `rlsir-armls-sync-schedule` DISABLED since 2026-04-26 (58% error rate Apr 19–20, root cause TBD) |
| Bronze active_snapshot | Live — Lambda hardened today: deadline fix, $orderby, throttle, reservedConcurrency=1, Maricopa filter, custom metrics, alarms |
| Bronze change_log | One-shot 14-year export complete (3.5M events on S3); ongoing sync paused with armls-sync |
| Bronze yong2 events / leads | Not built yet (Phase P2 / P6 of yong2 plan) |
| dbt project | 27 models in `analytics/`. Last clean dev run Apr 29 (64s, 19 successful, active branch gated) |
| dbt prod runtime | Not built yet (no `rlsir-analytics-dbt` Lambda; `s3://.../analytics/` is empty) |
| Dagster | Not deployed |
| Browser DuckDB-WASM | Not deployed (premium-site reads RDS PG MVs) |
| RDS PG MVs | Live — fixed today via migration 033 |
| Reconciliation | bronze-listings + active-snapshot covered; parity reconcile (dbt vs MV) not built |

## 2. Phasing

8 phases. Calendar order is sequential where dependencies require it; effort is engineering-hours.

### Phase 0 — Foundation stabilization (Day 1, ~1 hr)

**Goal:** bronze is fresh, dev dbt is current, sync error mystery is investigated (not necessarily solved).

| Step | Approval needed |
|---|---|
| Investigate Apr 19–20 sync error rate (CloudWatch logs) | — |
| Re-enable `rlsir-armls-sync-schedule` EventBridge rule | yes — AWS write |
| Manually invoke `rlsir-armls-sync` once → confirm `_freshness.json` advances | — |
| Re-run `dbt build --target dev` against fresh bronze → confirm 19/19 pass | — |

**Validation:** `rlsir-bronze-reconcile` Lambda's listings delta < 5%; dbt run_results.json all success.
**Rollback:** `aws events disable-rule --name rlsir-armls-sync-schedule`.

### Phase 1 — Active branch unlock (Day 1, ~1 hr)

**Goal:** all 27 dbt models build with `enable_active=true`.

| Step | Approval needed |
|---|---|
| Flip `enable_active: true` in `dbt_project.yml` | — |
| Single full `dbt build --target dev` (covers run + test) | — |
| Re-enable active marts in `_analytics__exposures.yml` | — |

**Validation:** `fct_active_inventory` row count ≈ 31K (Spark Maricopa Active+AUC); `fct_months_of_supply` rows in [0,60].
**Rollback:** `enable_active: false` — instant.

### Phase 2 — Production dbt runtime (Days 2–3, ~5 hrs)

**Goal:** dbt runs on a Lambda container; first prod run populates `s3://.../analytics/`.

**Decisions locked in `04-duckdb-runtime.md`:** Lambda container (1024MB, 900s, reservedConcurrency=1).

| Step | Approval needed |
|---|---|
| Build Docker image: dbt-core 1.8 + dbt-duckdb 1.8 + duckdb 1.3 + extensions | — |
| Push to ECR (`rlsir-analytics-dbt`) | yes — AWS write (ECR repo + image push) |
| Create Lambda `rlsir-analytics-dbt` (container image) | yes — AWS write |
| IAM role `rlsir-analytics-dbt`: read S3 bronze, write analytics/, secretsmanager (RDS DSN), CloudWatch | yes — AWS write |
| reservedConcurrentExecutions=1 | yes — AWS write |
| First manual invocation → verify all 27 marts on S3 | — |
| 3 CloudWatch alarms: Errors>0, ModelsFailed>0, Duration anomaly | yes — AWS write |

**Cadence decision:** ~~hourly~~ → **two distinct schedules**: `rate(4 hours)` for `tag:closed`, `rate(1 hour)` for `tag:active`. Closed marts only need refresh after armls-sync writes new bronze.

**Validation:** all 27 marts at expected paths; sizes within ±10% of dev outputs; run_results.json shipped to `s3://.../analytics/_run_results/{ts}/`.
**Rollback:** disable EventBridge rules; existing dev pipeline + RDS MVs still serve dashboard.

### Phase 3 — Dagster orchestration (Days 4–5, ~6 hrs)

**Goal:** Dagster Cloud Hobby observes bronze writes and orchestrates dbt runs. EventBridge schedules become belt-and-suspenders.

| Step | Approval needed |
|---|---|
| Create Dagster Cloud Hobby workspace `rlsir.dagster.cloud` | — |
| Create code repo/dir `rlsir-orchestration/` with assets, sensors, schedules | — |
| Build Docker image for Dagster code location → push to ECR | yes — AWS write (ECR) |
| Configure Dagster Cloud Hybrid agent or use serverless mode | — |
| Wire `dagster-dbt` to load `analytics/target/manifest.json` as assets | — |
| Implement `freshness_poller` sensor (5-min interval) | — |
| Implement asset_sensors for active and closed | — |
| Implement schedules (hourly_active, four_hourly_closed, nightly_full_refresh) | — |
| Run for 7 days alongside EventBridge schedules; verify Dagster fires + dbt runs succeed | — |

**Validation:** Dagster UI shows green for all top-level mart assets after 24h; run frequency matches schedule; no missed sensor ticks.
**Rollback:** EventBridge schedules continue running; turn off Dagster sensors. Pipeline keeps working.

### Phase 4 — Audit + parity reconciliation (Days 6–8, ~4 hrs)

**Goal:** prove dbt marts produce the SAME numbers as the migrated RDS MVs before cutover.

| Step | Approval needed |
|---|---|
| **Code audit**: read each `fct_*` model SQL vs corresponding `mv_*`; flag divergent grain or filter | — |
| Fix any divergence (most likely place: dbt models written before migration 033's close_month fix) | — |
| Build `rlsir-parity-reconcile` Lambda (compares 9 pairs daily) | — |
| Schedule via EventBridge cron(0 14 * * ? *) — 07:00 PHX, after both sources are fresh | yes — AWS write |
| 1 alarm: `ParityDriftPct > 1%` for 3 days, per pair | yes — AWS write |
| 7-day soak — verify parity stays green | — |

**Validation:** all 9 pairs <1% drift for 7 consecutive days. If any pair fails, fix the dbt model and re-soak.
**Rollback:** none needed — informational alarm only.

### Phase 5 — DuckDB-WASM browser scaffold (Days 9–11, ~6 hrs)

**Goal:** one pilot tab (Overview) renders client-side via DuckDB-WASM reading Parquet from S3/CloudFront.

| Step | Approval needed |
|---|---|
| `pnpm add @duckdb/duckdb-wasm` in `apps/premium-site` | — |
| Build `lib/duckdb-wasm.ts` — bootstrap + Parquet fetch + register + query helpers (EH bundle, NOT COI) | — |
| Build `useParquet(martName)` hook with cache (in-memory + IndexedDB) | — |
| Wire OverviewTab.tsx to fetch `analytics/armls/metro/market_pulse.parquet` and drive KPIs | — |
| Feature flag `NEXT_PUBLIC_USE_DUCKDB_WASM` (env var per Vercel environment) | — |
| Vercel preview deploy → manual smoke against staging | — |
| Lighthouse delta check — initial paint regression < 100ms | — |

**Validation:** KPI values match RDS-served Overview within rounding; bundle delta < 1MB (lazy-loaded, not affecting other routes); per-tab paint within ±10% of current.
**Rollback:** flag off — instant.

### Phase 6 — Full dashboard cutover (Days 12–18, ~4 hrs + 7-day soak)

**Goal:** all 5 Phoenix tabs read from DuckDB-WASM. RDS path stays as fallback for 7 days.

| Step | Approval needed |
|---|---|
| Port Pricing tab (~30 min, reuses useParquet hook) | — |
| Port Inventory tab | — |
| Port Activity tab | — |
| Port Timing tab | — |
| Port `/phoenix/[region]` and `/phoenix/[region]/[community]` (community-scope Parquet) | — |
| Roll feature flag: preview → staging (1 day) → prod 100% | — |
| 7-day soak — parity reconcile green, no Sentry error spike, p95 paint < 2.5s mobile 4G | — |

**Validation:** zero parity drift > 1% across all 9 pairs over 7 days; no client-side error spike; dashboard p95 paint within budget.
**Rollback:** flag back to 0% — instant.

### Phase 7 — RDS shrink + decommission (Day 25+, ~4 hrs)

**Goal:** reclaim the $46/mo RDS savings.

**Order matters — code updates BEFORE MV drops:**

| Step | Approval needed |
|---|---|
| 1. Update `phoenix-analytics.ts` — remove RDS-MV imports, all paths use Parquet | — |
| 2. Deploy premium-site → verify dashboard still works | — |
| 3. Update `armls-sync.ts` REFRESH_ORDER — remove the 9 dashboard MVs | — |
| 4. Deploy `rlsir-armls-sync` Lambda | yes — AWS write |
| 5. RDS automated snapshot (manual confirmation) | yes — AWS write |
| 6. Drop the 9 dashboard MVs from RDS | yes — DESTRUCTIVE |
| 7. `VACUUM FULL` reclaimed space | — |
| 8. Modify RDS instance class t3.medium → t3.micro (5min downtime, scheduled window) | yes — DESTRUCTIVE |
| 9. Validate AWS Cost Explorer: RDS line ≤ $20/mo | — |

**Validation:** premium-site builds + serves with zero RDS-MV imports; Lighthouse + parity dashboard green for 7 days post-shrink.
**Rollback:**
- Steps 1–4 reversible via redeploy from previous artifacts
- Step 5 (snapshot) is the safety net for steps 6–8
- Step 8 (instance modify) is reversible (re-upsize)
- Step 6 (MV drops) requires running `024_rebuild_core_mvs.sql + 033_fix_dashboard_math.sql` to restore — slow but possible

### Phase 8 — yong2 lakehouse onboarding (Days 30–60, ~36 hrs)

**Goal:** bring the yong2 leads + behavioral analytics into the same lakehouse.

Per `2026-04-29-yong2-leads-analytics-data-architecture.md` (the lakehouse-aligned version), 8 sub-phases (P1–P8). Highlights:

- P1 (~6 hrs): operational `leads.*` PG schema + `/api/contact` writes
- P2 (~8 hrs): `/api/track` edge function → bronze events
- P3 (~7 hrs): dbt staging + intermediate yong2 models
- P4 (~7 hrs): dbt yong2 marts + `/admin/metrics` page using DuckDB-WASM
- P5 (~4 hrs): `marketing.{campaigns, campaign_spend}` + CSV upload
- P6 (~3 hrs): leads CDC nightly Lambda
- P7 (~5 hrs): Follow Up Boss CRM sync (deferred)
- P8 (~3 hrs): geo + device enrichment

Phase 8 unblocks `/admin/metrics` dashboard and lead-attribution reporting.

### Phase 9 — Operations + docs (Days 30+, ~3 hrs)

**Goal:** future-Joey can debug and extend without reading a transcript.

| Step | Approval needed |
|---|---|
| `docs/runbook-analytics.md` — common ops, rollback procedures | — |
| Update `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/CHANGELOG.md` | — |
| Add to `docs/DECISIONS.md` — one consolidated ADR for the cutover | — |
| Bookmark Dagster UI + Elementary report URLs in team docs | — |

## 3. Total effort + calendar

| Phase | Engineering hrs | Calendar |
|---|---:|---|
| 0 — Foundation stabilization | 1 | Day 1 |
| 1 — Active branch unlock | 1 | Day 1 |
| 2 — Production dbt runtime | 5 | Days 2–3 |
| 3 — Dagster orchestration | 6 | Days 4–5 + 7-day soak |
| 4 — Audit + parity reconcile | 4 | Days 6–8 + 7-day soak |
| 5 — DuckDB-WASM scaffold | 6 | Days 9–11 |
| 6 — Full cutover | 4 | Days 12–18 + 7-day soak |
| 7 — RDS shrink | 4 | Day 25+ |
| 8 — Yong2 lakehouse | 36 | Days 30–60 |
| 9 — Docs | 3 | Days 30+ |
| **MLS-only total (P0–P7 + P9)** | **34** | **~25 days** |
| **Full system total (incl. P8)** | **70** | **~60 days** |

## 4. Approval gates summary

In execution order:

1. **Phase 0**: re-enable `rlsir-armls-sync-schedule`
2. **Phase 2**: ECR repo + image push; new Lambda `rlsir-analytics-dbt`; IAM role; reservedConcurrency=1; 3 CloudWatch alarms
3. **Phase 3**: ECR push for Dagster code location
4. **Phase 4**: 1 EventBridge schedule + 1 alarm for parity reconcile
5. **Phase 7** (DESTRUCTIVE — explicit gates per step): RDS snapshot; drop 9 MVs; modify instance class
6. **Phase 8** (yong2): leads CDC Lambda + EventBridge schedule + edge function deploy

Phases 1, 5, 6, 9 are code-only or feature-flagged — no fresh AWS approvals.

## 5. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Apr 19–20 sync errors recur after re-enable (Phase 0) | Medium | Medium | Investigate first; bronze-reconcile alarm catches drift; fallback is keep schedule disabled and rely on manual invokes |
| dbt mart and MV produce different numbers (Phase 4) | High | High | Code audit before parity reconcile; dual-run window; 7-day soak before cutover |
| DuckDB-WASM bundle bloats premium-site (Phase 5) | Medium | Medium | Use EH bundle (5MB), lazy-load on tab switch, measure pre/post Lighthouse |
| Dagster Hobby credit limit hit | Low | Medium | Reduce sensor cadence to 15 min; alarm at 80% credit usage; fallback to ECS Fargate self-host |
| Bronze writer regression silently writes empty files | Medium | High | bronze-reconcile + smoke harness already shipped; `_freshness.json` mtime monitoring |
| RDS shrink corrupts MVs (Phase 7) | Low | High | Snapshot before drop; instance modify reversible; phased: code-update → MV drop → instance modify (in that order) |
| Spark API rate limit / dedup re-emerges | Medium | Medium | $orderby + 2.5s throttle + reservedConcurrency=1 (already shipped); per-Lambda alarm catches early |
| Dagster sensor "stuck" (S3 read failures, missed ticks) | Low | Medium | EventBridge schedules are belt-and-suspenders; alarm on sensor failure rate |
| Lambda cold start makes Dagster runs flaky | Low | Low | Dagster retries failed runs; cold start ~10s on warm Lambda is fine |

## 6. Decisions captured

- **dbt runtime**: Lambda container (Phase 2). $0 idle, reuses IAM/alarm patterns.
- **dbt cadence**: split — `rate(4 hours)` for closed marts, `rate(1 hour)` for active marts. Hourly was overkill for closed.
- **Mart split**: per-scope-tier Parquet (metro/regions/communities). Browser lazy-loads only what tile shows.
- **Browser bundle**: DuckDB-WASM **EH bundle** (single-threaded, no COEP/COOP needed). Avoids breaking other site features.
- **Feature flag**: `NEXT_PUBLIC_USE_DUCKDB_WASM` env var per Vercel environment. Per-user gradient is overkill at solo-agent scale.
- **Soak window**: 7 days (was 14). Single user; if it works for a week, it works.
- **Phase 7 ordering**: code updates BEFORE MV drops, NOT after. Original plan would've taken the dashboard down.
- **Dagster tier**: Hobby for v1. Pro ($30/mo) is the upgrade path; ECS self-host is the fallback.
- **dagster-dbt integration**: yes — register dbt manifest as Dagster assets, get lineage UI for free.
- **Sensor cadence**: 5 min (Hobby tier accommodates this; if not, 15 min).

## 7. Open questions

- **Apr 19–20 root cause** (Phase 0 prerequisite). May affect re-enable timing.
- **Sentry integration** before Phase 5 cutover for client-side error reporting?
- **PostHog** for measuring dashboard load times pre/post cutover? Optional.
- **Active-snapshot ~12% drift** between live Spark and RDS — investigate / accept / backfill?
- **RDS automated snapshots enabled** before Phase 7? Confirm and document RTO.
- **Dagster Cloud SSO** — Google or email/password? Affects access management.

---

**Total to-MVP-cutover (Phase 0–7): ~25 days, ~$31/mo final cost ($46/mo savings).**
**Full lakehouse (incl. yong2 P8): ~60 days, same cost.**

---

**End of plan.**
