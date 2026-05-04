# Comprehensive Roadmap — From Today (2026-05-04) to Steady-State

**Date:** 2026-05-04
**Owner:** Joey Schnepel
**Status:** Plan locked. Phase A starts immediately.
**Supersedes:** Nothing — composes with the in-flight `2026-04-30-dbt-duckdb-production-cutover.md` plan and threads it with the un-stabilized git state and the Phoenix redesign in flight.
**Goal:** Take the platform from "lots of work shipped, lots not in git" to "every shipped change is in main, lakehouse cut over, dashboards on DuckDB-WASM, RDS shrunk."

---

## Section 0 — Why this plan exists

The 2026-04-30 plan defines Phases 0–7 of the lakehouse cutover. Since that plan was written, two things changed:

1. **ARMLS 12h compliance system was built and deployed** (Lambda tasks `refresh-actives` + `mark-stale-actives`, alarms, schedules) — drove staleness from 96.95% violation to 99.95% compliant. Protects Yong from a $21,000 ARMLS fine.
2. **Significant other work was deployed without commits**: the Parquet export Lambda, the active-snapshot Lambda, bronze reconcile, and the lakehouse architecture docs are all live in AWS but **not in git**. The Phoenix dashboard redesign is mid-stream on `feature/analytics-redesign` with 30+ modified files.

The 2026-04-30 plan can't start cleanly until the working tree is unwound. This plan unwinds it, ships the in-flight Phoenix redesign, then hands off to the existing Phase 1+ sequence.

---

## Section 1 — Reality audit (what's actually where)

### 1.1 — Deployed in AWS, NOT in git

| Artifact | AWS state | Git state |
|---|---|---|
| `infra/lambda/armls-sync-bundle.ts` (compliance code, +865 lines) | Deployed via `node infra/lambda/build.mjs` | M — uncommitted |
| `infra/lambda/armls-sync.ts` (+120 lines) | Deployed | M — uncommitted |
| `infra/lambda/build.mjs` (+34 lines) | In use | M — uncommitted |
| `infra/lambda/active-snapshot.ts` | Deployed as `rlsir-active-snapshot` Lambda | ?? — untracked |
| `infra/lambda/active-snapshot-build.mjs` | In use | ?? — untracked |
| `infra/lambda/armls-parquet-export.py` | Deployed as `rlsir-armls-parquet-export` Lambda | ?? — untracked |
| `infra/lambda/armls-parquet-export.Dockerfile` | Image in ECR | ?? — untracked |
| `infra/lambda/bronze-reconcile.ts` | Deployed | ?? — untracked |
| `infra/lambda/bronze-writer.ts` | Linked into sync Lambda | ?? — untracked |
| EventBridge rules: `rlsir-armls-refresh-actives-schedule`, `rlsir-armls-mark-stale-actives-schedule`, `rlsir-armls-parquet-export-schedule`, `rlsir-active-snapshot-schedule` | Active | — (no IaC repo) |
| CloudWatch alarms: `rlsir-actives-stale-12h`, `rlsir-armls-parquet-export-errors`, `rlsir-armls-parquet-export-table-failures` | Active | — |
| `packages/database/migrations/rds/030_silver_side_tables.sql` through `033_fix_dashboard_math.sql` | Applied to RDS | ?? — untracked |
| `packages/shared/src/analytics-confidence.ts` | Imported by phoenix-analytics queries | ?? — untracked |
| `analytics/` (dbt project, ~27 models) | Local dev only | ?? — untracked |
| `docs/architecture/lakehouse/` (8 architecture docs) | Reference only | ?? — untracked |
| `docs/db/` schema baselines, drift reports | Reference only | ?? — untracked |

**Risk:** Laptop loss = 6+ weeks of architectural work and the deployed ARMLS compliance fix gone. Re-creating from AWS is possible but lossy.

### 1.2 — In flight on `feature/analytics-redesign`

30+ modified files, mostly under `apps/premium-site/app/(routes)/phoenix/` — dashboard redesign per the 2026-05-02/03 yong2 redesign spec (commits `1b14b8e`, `281a92b`). State: visual changes underway, no demo-ready end yet.

Specifically modified:
- Phoenix client + 5 tabs + hero + KPI cards + price-trends chart + dashboard hero + secondary KPI bar
- Region/community page templates
- Listing detail components (commute map, description, OSRM client)
- DB query layer (analytics, listings, market-scoped, phoenix-analytics)
- Spark client + sync engine

### 1.3 — Listings cleanup deletions

5 components deleted from `apps/premium-site/app/(routes)/listings/` — leftover from the Spark cutover that finished on `cf6be73`. These are now dead code with no callers; safe to commit as a cleanup.

### 1.4 — In-flight commits (already on branch)

```
281a92b docs(plan): add yong2 redesign implementation plan
1b14b8e docs(spec): add yong2 redesign design spec
3311fcf chore(rds): migration to drop unused listings MVs (pending apply)
7039e35 chore(database): remove dead RDS listing queries post Spark cutover
cf6be73 refactor(premium-site): migrate remaining active-listing surfaces to @platform/spark
```

The branch has 5 commits ahead of `main` already. The plan + spec are committed — only the implementation isn't.

### 1.5 — What IS already done and stable

- ARMLS sync Lambda + Maricopa filter + 12h compliance (verified 99.95% in today's bi-weekly probe)
- Spark search cutover (live since 2026-04-20)
- ARMLS Parquet Export Lambda (deployed 2026-05-03, schedule live)
- Active-snapshot Lambda (deployed 2026-04-29, hourly schedule)
- Bronze writer / reconcile (paired with the sync Lambda)
- 9 RDS dashboard MVs + analytics_base + heatmap MVs (working)
- Migration 033 (dashboard math fixes — applied)
- 8 lakehouse architecture docs (drafted, not committed)

---

## Section 2 — Risk inventory

| Risk | Severity | Source | Mitigation |
|---|---|---|---|
| Laptop loss erases 6 weeks of deployed Lambda code | **HIGH** | Section 1.1 | Phase A — commit the deployed code |
| Phoenix redesign breaks production if accidentally pushed to main | Medium | Section 1.2 | Stay on `feature/analytics-redesign`; finish-then-merge |
| Stale `feature/analytics-redesign` rebase conflicts with new compliance/lakehouse work | Medium | Branch is now ~3 weeks old | Phase A commits land on a fresh branch off main, redesign rebases later |
| dbt project (`analytics/`) not in git → can't be deployed via CI | Medium | Section 1.1 | Phase A includes the dbt project commit |
| Migration drift: RDS has 030–033 applied, only some are in `migrations/` directory | Medium | Section 1.1 | Phase A registers each in the `migrations` table audit log |
| RDS shrink (Phase 6 of 04-30 plan) needs RDS snapshot before the MV drop | High (when we get there) | 04-30 plan §1, Phase 6 | Add snapshot step explicitly |
| Pending listings >12h stale (transient ~20 outliers) | Low | Today's probe | Auto-resolves via `mark-stale-actives` daily sweep |
| Lambda concurrency=4 with 8 EventBridge rules → throttling under burst | Low | Memory / today's audit | Currently 0 errors / 136 invocations / 24h. Monitor. |

---

## Section 3 — Prioritization

Per the recursive-improvement skill (P0–P3 tiers):

**P0 — ARMLS audit-blocking** — none currently open.

**P1 — Yong's data accuracy / business-impacting**
- **#1**: Lock in the deployed ARMLS compliance code into git (Phase A.1)
- **#2**: Lock in the deployed lakehouse infra code into git (Phase A.2)
- **#3**: Phoenix redesign completion (Phase B)

**P2 — Performance / structural**
- **#4**: Lakehouse Phase 1 — active branch unlock (Phase C)
- **#5**: Lakehouse Phase 2 — production dbt deployment (Phase D)
- **#6**: Lakehouse Phase 3 — parallel reconciliation (Phase E)
- **#7**: Lakehouse Phase 4 — DuckDB-WASM scaffold (Phase F)
- **#8**: Lakehouse Phase 5 — full dashboard cutover (Phase G)

**P3 — Tech debt / polish**
- **#9**: Lakehouse Phase 6 — RDS shrink (Phase H.1)
- **#10**: Lakehouse Phase 7 — operations + docs (Phase H.2)
- **#11**: Quick wins (parallel — Section 5)

---

## Section 4 — Phasing

Each phase has: goal, steps with approval gates, verification, rollback. Phases A–B are new. Phases C–H reference existing plan sections in `2026-04-30-dbt-duckdb-production-cutover.md`.

### Phase A — Stabilize git (Day 1, ~3 hrs)

**Goal:** Every deployed Lambda, every applied migration, every drafted doc is in `main` (via `dev` → `testing` → `main` flow). Zero drift.

Branch strategy: cut a NEW branch `feature/lakehouse-stabilize` off `main`, NOT off `feature/analytics-redesign`. The redesign branch is its own track and will rebase later.

#### A.1 — ARMLS 12h compliance commit (~30 min)

| Step | Approval needed |
|---|---|
| `git checkout -b feature/lakehouse-stabilize main` | — |
| Stage `infra/lambda/armls-sync-bundle.ts`, `armls-sync.ts`, `build.mjs` | — |
| Verify diff matches deployed Lambda (CodeSha256 check) | — |
| Commit: `feat(lambda): ARMLS 12h compliance — refresh-actives + mark-stale-actives` | — |

**Verification:** `aws lambda get-function-configuration` CodeSha256 matches `node infra/lambda/build.mjs && sha256sum infra/lambda/dist/armls-sync.zip`.

**Rollback:** `git reset HEAD~1` (commit-only; nothing pushed).

#### A.2 — Lakehouse infra commit (~45 min)

| Step | Approval needed |
|---|---|
| Stage `infra/lambda/active-snapshot.ts`, `active-snapshot-build.mjs` | — |
| Stage `infra/lambda/armls-parquet-export.py`, `.Dockerfile`, `iam-armls-parquet-export-policy.json` | — |
| Stage `infra/lambda/bronze-reconcile.ts`, `bronze-reconcile-build.mjs`, `iam-reconcile-policy.json` | — |
| Stage `infra/lambda/bronze-writer.ts`, `iam-bronze-write-policy.json`, `iam-trust-policy-lambda.json` | — |
| Stage `infra/lambda/PHASE1_DEPLOY_NOTES.md`, `PHASE2_DEPLOY_NOTES.md`, `alarms-snapshot.json` | — |
| Skip: `*-resp.json`, `*-payload.json`, `smoke-response*.json` (debug artifacts — add to `.gitignore`) | — |
| Commit: `feat(lambda): active-snapshot + parquet-export + bronze-reconcile infra` | — |

**Verification:** None of the deployed Lambda CodeSha256s change as a result of staging files.

**Rollback:** `git reset HEAD~1`.

#### A.3 — Migration registry commit (~30 min)

| Step | Approval needed |
|---|---|
| Stage `packages/database/migrations/rds/027_active_listings_mv.sql`, `027_property_segment.sql`, `029_sync_errors.sql`, `030_silver_side_tables.sql`, `031_dq_idempotency.sql`, `032_sync_watermark.sql`, `033_fix_dashboard_math.sql` | — |
| Audit each against `SELECT * FROM migrations` on RDS — confirm applied state | yes — RDS read |
| Commit: `chore(rds): register migrations 027–033 (already applied to prod)` | — |

**Verification:** `node scripts/db-inspect.mjs` shows applied state matches the file count.

**Rollback:** `git reset HEAD~1`.

#### A.4 — dbt project commit (~30 min)

| Step | Approval needed |
|---|---|
| Stage `analytics/` directory recursively | — |
| Run `pnpm dbt build --target dev` locally to confirm it still passes (last run Apr 29 in 64s) | — |
| Commit: `feat(analytics): dbt project (27 models, dev pipeline mature)` | — |

**Verification:** `dbt build --target dev` exit code 0; manifest.json present.

**Rollback:** `git reset HEAD~1`.

#### A.5 — Architecture + planning docs commit (~30 min)

| Step | Approval needed |
|---|---|
| Stage `docs/architecture/lakehouse/` (8 files) | — |
| Stage `docs/db/` (schema baselines, drift report) | — |
| Stage `docs/superpowers/plans/2026-04-12-analytics-data-quality.md`, `2026-04-20-listings-spark-cutover.md`, `2026-04-30-dbt-duckdb-production-cutover.md` | — |
| Stage `docs/superpowers/specs/2026-04-20-listings-spark-cutover-design.md` | — |
| Stage `docs/superpowers/plans/2026-05-04-comprehensive-roadmap.md` (this file) | — |
| Stage `docs/analytics-architecture-decision.md`, `analytics-comprehensive-plan.md`, `analytics-diagnostic.md`, `bronze-migration-build-path.md`, `closed-listings-etl-strategy.md`, `plan-review-best-practices.md` | — |
| Skip: `docs/bad-records*.csv` (debug artifacts) | — |
| Commit: `docs(architecture): lakehouse design + planning + drift audit` | — |

**Verification:** `git status` shows only the deliberately-excluded debug files remaining.

**Rollback:** `git reset HEAD~1`.

#### A.6 — Configurations commit (~15 min)

| Step | Approval needed |
|---|---|
| Stage `Dockerfile.dev`, `docker-compose.yml`, `.dockerignore` | — |
| Stage `packages/shared/src/analytics-confidence.ts` | — |
| Stage `apps/premium-site/app/(routes)/market/layout.tsx` (small new file) | — |
| Commit: `chore(infra): docker-dev compose + analytics-confidence shared utility` | — |

**Verification:** `pnpm type-check` passes.

**Rollback:** `git reset HEAD~1`.

#### A.7 — Push branch + PR (~15 min)

| Step | Approval needed |
|---|---|
| `git push -u origin feature/lakehouse-stabilize` | — |
| Open PR `feature/lakehouse-stabilize` → `dev` titled "Lock in deployed lakehouse + compliance work" | — |
| Wait for CI green | — |
| Merge to `dev` | — |
| Open PR `dev` → `testing` → `main` per branch flow | — |

**Verification:** CI workflow `.github/workflows/ci.yml` runs both `prototype` and `platform` jobs to green.

**Rollback:** Close PR, revert merge commit if already merged.

**Phase A total:** ~3 hrs.

---

### Phase B — Phoenix dashboard redesign completion (Days 1–4, ~16 hrs)

**Goal:** The yong2 redesign spec (`docs/superpowers/specs/2026-05-02-yong2-redesign-design-spec.md` + the 05-03 implementation plan) ships to Yong's site. Single demo-ready dashboard.

This phase runs on the existing `feature/analytics-redesign` branch, rebased onto `main` after Phase A merges.

#### B.1 — Rebase + audit (~1 hr)

| Step | Approval needed |
|---|---|
| `git rebase main` (after Phase A merges) | — |
| Resolve any conflicts from compliance/lakehouse work touching same files | — |
| Re-run `pnpm type-check` and `pnpm --filter @real-estate/premium-site build` | — |

#### B.2 — Audit redesign progress against the spec (~2 hrs)

| Step | Approval needed |
|---|---|
| Read `docs/superpowers/specs/2026-05-02-yong2-redesign-design-spec.md` (committed at `1b14b8e`) | — |
| Read `docs/superpowers/plans/2026-05-03-yong2-redesign-implementation-plan.md` (committed at `281a92b`) | — |
| Walk every modified file in `apps/premium-site/app/(routes)/phoenix/` against the plan checklist | — |
| Output: a punch list of "done / in-progress / not-started" tasks | — |

#### B.3 — Complete remaining redesign tasks (~10 hrs)

Determined per B.2 audit. Likely categories:
- Hero KPI card layout
- Tab content (Overview, Pricing, Inventory, Activity, Timing) data wiring
- Price-trends chart visual updates
- Secondary KPI bar polish
- Region/community page templates
- Methodology footer

**Verification (each PR):**
- `pnpm type-check` passes
- `pnpm --filter @real-estate/premium-site build` passes
- Visual smoke against staging in browser
- No regression in attribution rendering (ARMLS prime directive G1)
- Lighthouse mobile 4G score ≥ 90

**Rollback:** PR-level revert; redesign is on its own branch.

#### B.4 — Commit listings cleanup (~30 min)

The 5 deleted files in `apps/premium-site/app/(routes)/listings/` are leftover from the Spark cutover.

| Step | Approval needed |
|---|---|
| Confirm no callers via grep | — |
| Stage deletions | — |
| Commit: `chore(listings): remove dead Spark-cutover components` | — |

#### B.5 — Merge redesign to main (~30 min)

| Step | Approval needed |
|---|---|
| Open PR `feature/analytics-redesign` → `dev` | — |
| CI green + design review with Yong if requested | — |
| Merge through `dev` → `testing` → `main` | — |

**Phase B total:** ~14 hrs engineering, ~4 calendar days.

---

### Phase C — Lakehouse Phase 1: Active branch unlock (Day 5, ~2 hrs)

Per `2026-04-30-dbt-duckdb-production-cutover.md` §Phase 1.

**Single change of substance:** flip `enable_active: true` in `dbt_project.yml`. All 27 dbt models build (was 19/19). 8 active marts come online.

| Step | Approval needed |
|---|---|
| `dbt build --select +tag:active` — confirm 8 active marts populate | — |
| `dbt test` — confirm `months_of_supply_within_bounds`, `active_status_consistency` pass | — |
| Re-enable active marts in `_analytics__exposures.yml` | — |
| Commit: `feat(analytics): unlock active branch — 27 models build` | — |

**Verification:** `fct_active_inventory` row count ≈ 31K. `fct_months_of_supply` rows in [0,60]. Calendar coverage 184/184.

**Rollback:** `enable_active: false` — instant.

---

### Phase D — Lakehouse Phase 2: Production dbt deployment (Days 6–7, ~6 hrs)

Per `2026-04-30-dbt-duckdb-production-cutover.md` §Phase 2.

**Goal:** Hourly dbt Lambda writes Parquet marts to `s3://.../analytics/`.

Decisions locked:
- Runtime: Lambda container (matches existing AWS auth + alarm pipeline)
- Schedule: hourly aligned with active-snapshot
- Mart split: per-scope-tier (metro/regions/communities)
- Feature flag: `NEXT_PUBLIC_USE_DUCKDB_WASM` env var per Vercel environment

| Step | Approval needed |
|---|---|
| Build Docker image for dbt + DuckDB + httpfs/parquet/postgres extensions | — |
| Push image to ECR (`rlsir-analytics-dbt`) | **yes — AWS write** |
| Create Lambda `rlsir-analytics-dbt` (Container, 1024MB, 900s timeout) | **yes — AWS write** |
| IAM role: read S3 bronze, write S3 analytics/, read Secrets Manager (RDS DSN), CloudWatch Logs + PutMetricData | **yes — AWS write** |
| EventBridge `rate(1 hour)` schedule + put-targets | **yes — AWS write** |
| First manual invocation → verify `s3://.../analytics/` populates with all 27 marts | — |
| `reservedConcurrentExecutions=1` | **yes — AWS write** |
| 3 CloudWatch alarms: Errors>0, DurationAnomaly, custom `dbt_models_failed > 0` | **yes — AWS write** |

**Verification:** All 27 marts present at expected paths, sizes within ±10% of dev outputs. dbt's `run_results.json` shipped as a sidecar JSON for CloudWatch Insights.

**Rollback:** Disable EventBridge rule; existing dev pipeline + RDS MVs still serve dashboard.

---

### Phase E — Lakehouse Phase 3: Parallel reconciliation (Day 8 + 7-day soak, ~3 hrs)

Per `2026-04-30-dbt-duckdb-production-cutover.md` §Phase 3.

| Step | Approval needed |
|---|---|
| Extend `bronze-reconcile` Lambda for (mart, MV) pair comparison | — |
| 9 mart/MV pairs: market_pulse, community_scorecard, absorption, negotiation, supply_demand, community_yoy, inventory_age, dashboard, price_bands | — |
| Daily cron via existing reconcile EventBridge rule | — |
| Alarm if any pair > 1% delta for 3 consecutive days | **yes — AWS write** |
| Build `/admin/parity` dashboard (gated, internal) | — |

**Verification:** All 9 pairs <1% drift in a single run. Soak 7 days before Phase F.

**Rollback:** Disable the new alarm; reconcile is informational.

---

### Phase F — Lakehouse Phase 4: DuckDB-WASM browser scaffold (Days 9–11, ~8 hrs)

Per `2026-04-30-dbt-duckdb-production-cutover.md` §Phase 4. One pilot tab (Overview) renders client-side via DuckDB-WASM.

| Step | Approval needed |
|---|---|
| `pnpm add @duckdb/duckdb-wasm` in `apps/premium-site` | — |
| Build `lib/duckdb-wasm.ts` — bootstrap, Parquet fetch + register, query helpers | — |
| Webpack config for COEP/COOP headers | — |
| Wire `OverviewTab.tsx` to fetch `analytics/metro/market_pulse.parquet` | — |
| Add `NEXT_PUBLIC_USE_DUCKDB_WASM=1` feature flag | — |
| Vercel preview deploy → manual smoke against staging | — |
| Lighthouse delta check — initial paint shouldn't regress >100ms | — |

**Verification:** KPI values match RDS-served version within rounding. Bundle size delta < 1MB. Per-tab load time within ±10% of current.

**Rollback:** Feature flag off — instant revert.

---

### Phase G — Lakehouse Phase 5: Full dashboard cutover (Days 12–18 + 14-day soak, ~6 hrs)

Per `2026-04-30-dbt-duckdb-production-cutover.md` §Phase 5. Port remaining 4 tabs + region/community pages, roll feature flag 10% → 50% → 100%.

**Verification:** Zero parity drift > 1% across all 9 mart/MV pairs over 14 days. No client-side error spike on Sentry. Dashboard p95 paint < 2.5s on mobile 4G.

**Rollback:** Feature flag back to 0% — instant.

---

### Phase H — Lakehouse Phases 6 + 7: RDS shrink + ops (Day 32+, ~7 hrs)

Per `2026-04-30-dbt-duckdb-production-cutover.md` §Phase 6 + §Phase 7.

**Pre-flight (added to existing plan):**
- **`aws rds create-db-snapshot`** before any MV drop (the existing plan implies this; making it explicit)

#### H.1 — RDS shrink

| Step | Approval needed |
|---|---|
| Create RDS snapshot `rlsir-db-pre-mv-drop-2026-XX-XX` | **yes — AWS write** |
| Drop 9 dashboard MVs (`mv_dashboard`, `mv_market_pulse`, etc.) | **yes — DESTRUCTIVE GATE** |
| Remove their refresh from `armls-sync.ts` REFRESH_ORDER | — |
| Update `phoenix-analytics.ts` — remove RDS code paths | — |
| `VACUUM FULL` on freed tables | **yes — AWS write (RDS load)** |
| Modify RDS instance: t3.medium → t3.micro (planned ~5min downtime) | **yes — DESTRUCTIVE GATE, scheduled window** |
| Validate: AWS Cost Explorer shows new RDS line-item ≤ $20/mo | — |

**Verification:** Premium-site builds + serves with zero RDS-MV imports. Lighthouse + parity dashboard green for 7 days post-shrink.

**Rollback:** RDS instance modify is reversible (re-upsize). MV drops are NOT — recreate from migrations 002+024+033 if needed. The pre-snapshot is the safety net.

#### H.2 — Operations + docs

| Step | Approval needed |
|---|---|
| `docs/runbook-analytics.md` — common ops: rerun dbt, alarm response, rollback, full-refresh | — |
| Update `docs/PROJECT.md` — mark Phase 5 of comprehensive plan complete | — |
| Update `docs/ARCHITECTURE.md` — new dataflow diagram, deprecate RDS-MV section | — |
| ADRs in `docs/DECISIONS.md`: dbt-on-Lambda, DuckDB-WASM bundle path, parity-reconcile threshold, RDS shrink window | — |
| Final note in `docs/CHANGELOG.md` | — |

**Verification:** Future-Joey can find every operational answer in these docs without grep.

---

## Section 5 — Quick wins (parallel track, ~3 hrs total)

These don't block phases. Slot in any time CI is running or during context switches.

| # | Win | Effort | Source |
|---|---|---|---|
| Q1 | Emit `ActivesStaleOver12h` metric on every `refresh-actives` fire (every 6h vs daily today) — 4× more alarm datapoints | 30 min | Today's compliance probe |
| Q2 | Fix Spark `_getAllPinsImpl` $top=5000 → 1000 in `packages/spark/src/ListingService.ts:149` | 30 min | `analytics-architecture-decision.md` §1 Bug #1 |
| Q3 | Document SPARK_API_ACCESS_TOKEN refresh from Secrets Manager in dev script (current `.env.local` token 401s) | 30 min | `analytics-architecture-decision.md` §1 Bug #2 |
| Q4 | Fix the orphaned `tsconfig.tsbuildinfo` files in working tree (likely `.gitignore` miss) | 15 min | Current git status |
| Q5 | Move `infra/lambda/*-resp.json`, `*-payload.json`, `smoke-response*.json` to `.gitignore` | 15 min | Phase A.2 cleanup |
| Q6 | Add `.playwright-mcp/` and `_export_tmp/` to `.gitignore` | 15 min | Current git status |
| Q7 | Investigate Apr 19 sync-error spike (77 errors) — confirm closed root cause; document in DECISIONS.md if not | 1 hr | Today's 14-day metric breakdown |

---

## Section 6 — Calendar + effort

| Phase | Engineering hours | Calendar |
|---|---:|---|
| Phase A — Stabilize git | 3 | Day 1 |
| Phase B — Phoenix redesign completion | 14 | Days 1–4 |
| Phase C — Lakehouse Phase 1 (active branch) | 2 | Day 5 |
| Phase D — Lakehouse Phase 2 (prod dbt) | 6 | Days 6–7 |
| Phase E — Lakehouse Phase 3 (parity) | 3 | Day 8 + 7-day soak |
| Phase F — Lakehouse Phase 4 (WASM scaffold) | 8 | Days 9–11 |
| Phase G — Lakehouse Phase 5 (full cutover) | 6 | Days 12–18 + 14-day soak |
| Phase H — Lakehouse Phases 6+7 (shrink + docs) | 7 | Day 32+ |
| Quick wins (parallel) | 3 | Slotted |
| **Total** | **52 hrs** | **~32 days** |

Calendar bottlenecks are soak windows (E and G), not engineering. Real shipped state at Day 18 (full WASM cutover with RDS fallback). Cost savings unlock at Day 32+.

---

## Section 7 — Approval gates summary

In execution order:

1. **Phase A.3**: RDS read for migration audit (low risk)
2. **Phase D**: ECR repo create + image push; new Lambda `rlsir-analytics-dbt`; IAM role; EventBridge schedule; reservedConcurrency=1; 3 CloudWatch alarms
3. **Phase E**: 1 new alarm on parity drift
4. **Phase H.1** (DESTRUCTIVE — explicit gate): RDS snapshot creation; drop 9 MVs from RDS; modify RDS instance class

Phases A.1, A.2, A.4–A.7, B, C, F, G, H.2 are code-only or feature-flagged — no fresh AWS approvals beyond what's already in scope.

---

## Section 8 — Open questions to resolve before Phase D

(Inherited from `2026-04-30-dbt-duckdb-production-cutover.md` §5; carried forward unchanged)

- **Sentry integration**: client-side error reporting wired before Phase F cutover?
- **PostHog or similar**: dashboard load-time measurement pre/post cutover?
- **Active-snapshot CDC drift**: 12% gap between live Spark and RDS — acceptable or backfill the ~4K records?
- **Backup before Phase H.1**: confirm RDS automated snapshots are enabled and recoverable within 48h beyond the manual snapshot.

---

## Section 9 — Definition of done

The plan is complete when:

- [ ] `git status` on `main` shows zero uncommitted Lambda code, dbt project, migrations, or architecture docs
- [ ] `feature/analytics-redesign` is merged to `main`
- [ ] All 27 dbt models build hourly to `s3://.../analytics/`
- [ ] `/admin/parity` shows zero >1% drift across 9 mart/MV pairs for 14+ consecutive days
- [ ] All 5 Phoenix tabs + region + community pages render via DuckDB-WASM at 100% of traffic
- [ ] 9 RDS dashboard MVs are dropped, RDS is on `db.t3.micro`
- [ ] AWS Cost Explorer shows monthly spend ≤ $30
- [ ] Runbook + ADRs + ARCHITECTURE.md reflect the new dataflow

---

## Section 10 — References

- `docs/superpowers/plans/2026-04-30-dbt-duckdb-production-cutover.md` — Phases 0–7 detail (this plan extends, doesn't replace)
- `docs/superpowers/plans/2026-04-12-analytics-data-quality.md` — Tasks 1–9 still open under Phoenix redesign
- `docs/superpowers/plans/2026-04-20-listings-spark-cutover.md` — completed Spark cutover, source for B.4 cleanup
- `docs/architecture/lakehouse/00-system-overview.md` through `07-roadmap.md` — full target architecture
- `docs/analytics-architecture-decision.md` — DuckDB+Parquet investigation results (1000× speedup)
- `.claude/skills/rlsir-recursive-improvement/SKILL.md` — improvement loop and ARMLS prime directives
- `CLAUDE.md` (repo root) — engineering standards (TDD, layer hierarchy, tokens)
- `.claude/CLAUDE.md` — Gideon orchestrator + agent dispatch
- `MEMORY.md` — current project state (always loaded into Claude context)

---

**End of plan.**
