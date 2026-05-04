# Execution Playbook — Now Through Steady-State

**Date:** 2026-05-04
**Owner:** Joey Schnepel
**Status:** Active
**Companion to:**
- `2026-05-04-comprehensive-roadmap.md` — phases & dependencies (the WHAT)
- `2026-05-04-roadmap-best-practices.md` — methodology (the HOW)
- `docs/runbook-free-tier.md` — cost discipline

This playbook is the operational layer. Every session, every gate, every monitoring cadence — from today through full completion, then into pure monitoring mode.

---

## Section 1 — End-state definition (when do we stop?)

You're done with active development when **all** of these hold for 14+ consecutive days:

- [ ] `git status` on `main` shows zero uncommitted production code
- [ ] `feature/analytics-redesign` merged; redesign deployed to production
- [ ] All 27 dbt models build hourly to `s3://rlsir-platform-assets-us-east-1/analytics/`
- [ ] `/admin/parity` shows zero >1% drift across 9 mart/MV pairs for 14+ days
- [ ] All 5 Phoenix tabs + region + community pages render via DuckDB-WASM at 100% traffic
- [ ] 9 RDS dashboard MVs dropped, RDS on `db.t3.micro`
- [ ] AWS Budget shows actual <$25/mo for 30 days
- [ ] `node scripts/check-free-tier.mjs` exits 0
- [ ] `node scripts/check-armls-compliance.mjs` shows 99.9%+ within 12h SLA
- [ ] All runbooks exist and were used during a real or rehearsed incident
- [ ] DR drill completed within 30 days

When all green: shift to **Section 4 monitoring cadence** and stop active development.

---

## Section 2 — Sessions (ordered)

Each session is a 2–5 hour work unit. Sessions are atomic — start at exit criteria of N-1, end at exit criteria of N. Use TaskCreate / TodoWrite to track per-session work.

If you have <2 hrs in a day, don't start a session — knock out a Quick Win instead (Section 2.5).

### 2.0 — Standing gates (apply to EVERY session)

Run before each commit:
- [ ] `pnpm type-check` — 0 errors across all packages
- [ ] `pnpm lint` — 0 errors
- [ ] No `console.log` in committed code (per `CLAUDE.md §6.1`)
- [ ] No `any` types (per `CLAUDE.md §1.7`)
- [ ] No hardcoded values that should be tokens/constants (per `CLAUDE.md §1.4–1.5, §2`)
- [ ] Commit message in Conventional Commits format (`feat(scope):` / `fix(scope):` / `chore(scope):` / `docs(scope):` / `refactor(scope):`)
- [ ] **No AI attribution** — author is Joey Schnepel only; no `Co-Authored-By`, `Signed-off-by`, "Claude", "Anthropic", or "AI-generated" in commits, code, comments, or PR bodies (per `MEMORY.md` Git Rules)

If the diff includes ANY new/modified AWS resource (Lambda, EventBridge, IAM, alarm, metric, log group):
- [ ] `node scripts/check-free-tier.mjs` — exits 0 (all PASS or transient WARN only)
- [ ] No new custom-metric NAME if a dimension on an existing metric covers the dimension (free-tier discipline)

If the diff includes any `package.json` change:
- [ ] `pnpm audit --audit-level=high` — 0 high/critical CVEs
- [ ] Bundle-size delta ≤ +5% on `apps/premium-site` main chunk if frontend dep (run `pnpm --filter @real-estate/premium-site analyze`)

If the diff makes an architecturally significant choice:
- [ ] ADR added to `docs/DECISIONS.md` in the same PR (Michael Nygard format: Context → Decision → Status → Consequences). Significant = "future engineer will need to know why we did it this way"

Before merging any PR:
- [ ] Anti-patterns from Section 2.99 (relevant phase) absent from diff
- [ ] Per-phase quality gates in this session's "Exit criteria" green
- [ ] CI workflow `free-tier-audit.yml` ran successfully on the PR (or scheduled)

After merge:
- [ ] Prepend one-line entry to `docs/CHANGELOG.md` (newest at top): `YYYY-MM-DD | [type] description — key files`
- [ ] Update `docs/PROJECT.md` if a tracked task moved to done
- [ ] Update `docs/runbook-free-tier.md` "Active metrics" section if any metric was added/removed
- [ ] If a migration was applied, refresh `docs/db/schema-baseline-YYYY-MM-DD.{md,json}` via `node scripts/schema-baseline.mjs`

### Session 1 — Phase A.1 + A.2: Lock in deployed code (2 hrs)

**Prereqs:** None — start any time.
**Branch:** Cut `feature/lakehouse-stabilize` off `main`.

**Pre-flight tooling install (~20 min, one-time, was Quick Wins Q5–Q7):**
1. `pnpm add -Dw husky lint-staged @commitlint/cli @commitlint/config-conventional`
2. `pnpm exec husky init` — creates `.husky/`
3. Add `.husky/pre-commit`: `pnpm lint-staged && node scripts/check-free-tier.mjs --json > /dev/null || true`
4. Add `.husky/commit-msg`: `npx --no-install commitlint --edit "$1"`
5. Create `commitlint.config.cjs` extending `@commitlint/config-conventional`
6. Install gitleaks (Windows): `winget install gitleaks` or `scoop install gitleaks`
7. Add `.husky/pre-commit` line: `gitleaks protect --staged --no-banner` (warn-only initially; promote to error in S22)

**Work:**
1. Verify deployed Lambda matches local: `node infra/lambda/build.mjs`; compare `aws lambda get-function-configuration --function-name rlsir-armls-sync --query CodeSha256` (base64) to local zip's base64-encoded SHA-256
2. Stage compliance code: `infra/lambda/armls-sync-bundle.ts`, `armls-sync.ts`, `build.mjs`
3. Commit: `feat(lambda): ARMLS 12h compliance — refresh-actives + mark-stale-actives tasks`
4. Stage lakehouse infra: `active-snapshot.ts`, `active-snapshot-build.mjs`, `armls-parquet-export.py`, `.Dockerfile`, `bronze-reconcile.ts`, `bronze-reconcile-build.mjs`, `bronze-writer.ts`, IAM JSONs, `PHASE*_DEPLOY_NOTES.md`, `alarms-snapshot.json`
5. Commit: `feat(lambda): active-snapshot + parquet-export + bronze-reconcile infra`
6. Update `.gitignore`: add `infra/lambda/*-resp.json`, `*-payload.json`, `smoke-response*.json`, `_export_tmp/`, `apps/*/tsconfig.tsbuildinfo`, `packages/*/tsconfig.tsbuildinfo`
7. `git rm --cached <each tsbuildinfo>` to untrack files now in gitignore
8. Commit: `chore(repo): gitignore Lambda debug artifacts + untrack tsbuildinfo`

**Anti-patterns to verify absent (Phase A):**
- `--no-verify` flag on commits
- Mixed concerns in one commit (compliance + infra in single commit)
- Commits with AI/Anthropic attribution
- Force-pushed shared branch
- Committed secrets (gitleaks should catch)

**Exit criteria:**
- 3 commits on `feature/lakehouse-stabilize`
- `git status` no longer shows the staged Lambda files or tsbuildinfo
- `pnpm type-check` exits 0
- Husky hooks fire on commit (verify by attempting a deliberately-bad commit on a throwaway branch)

### Session 2 — Phase A.3–A.7: Migrations, dbt, docs, push (1.5 hrs)

**Prereqs:** Session 1 complete.

**Work:**
1. A.3: Verify migrations 027–033 applied on RDS (`SELECT * FROM migrations`); stage all 7 SQL files; commit `chore(rds): register migrations 027–033 (already applied)`
2. A.4: Stage `analytics/` recursively; run `dbt build --target dev` exit 0; commit `feat(analytics): dbt project (27 models, dev mature)`
3. A.5: Stage docs — `architecture/lakehouse/` (8 files), `db/` (schema baselines), all `superpowers/plans/` and `superpowers/specs/` dated 2026-04-12 onward, this playbook, the roadmap, best-practices, free-tier runbook; commit `docs(architecture): lakehouse design + planning + drift audit`
4. A.6: Stage `Dockerfile.dev`, `docker-compose.yml`, `.dockerignore`, `packages/shared/src/analytics-confidence.ts`, `apps/premium-site/app/(routes)/market/layout.tsx`; commit `chore(infra): docker-dev compose + analytics-confidence shared utility`
5. A.7: Stage `scripts/check-free-tier.mjs`, `.github/workflows/free-tier-audit.yml`, `docs/runbook-free-tier.md`; commit `feat(ops): free-tier discipline auditor + weekly CI gate + runbook`
6. Push: `git push -u origin feature/lakehouse-stabilize`
7. Open PR → `dev`, wait for CI green, merge
8. Open PR `dev` → `testing` → `main`, merge through

**Exit criteria:**
- `feature/lakehouse-stabilize` merged to `main`
- `git status` on `main` shows zero deployed-but-uncommitted code
- CI workflow `free-tier-audit.yml` ran successfully on PR

### Session 3 — Phase B.1 + B.2: Rebase + redesign audit (3 hrs)

**Prereqs:** Session 2 complete (main has the lakehouse-stabilize work).

**Work:**
1. `git checkout feature/analytics-redesign`
2. `git rebase main` — resolve conflicts (likely in CLAUDE.md, sync-engine.ts, queries)
3. `pnpm type-check`, `pnpm --filter @real-estate/premium-site build` — both pass
4. Read `docs/superpowers/specs/2026-05-02-yong2-redesign-design-spec.md`
5. Read `docs/superpowers/plans/2026-05-03-yong2-redesign-implementation-plan.md`
6. Walk every modified file in `apps/premium-site/app/(routes)/phoenix/` against the plan checklist
7. Output: a `docs/superpowers/plans/2026-05-04-redesign-punch-list.md` — done / in-progress / not-started per the plan checklist

**Exit criteria:**
- Branch builds clean post-rebase
- Punch list checked into the redesign branch

### Sessions 4–7 — Phase B.3 redesign work (10 hrs across 4 sessions)

Per punch list from Session 3. Likely groupings (verify after Session 3 audit):

- **S4 (3 hrs):** Hero KPI card + Dashboard Hero + Secondary KPI bar layout
- **S5 (3 hrs):** Overview/Pricing/Inventory/Activity/Timing tab content + Price Trends chart
- **S6 (3 hrs):** Region (`/phoenix/[region]`) + community (`/phoenix/[region]/[community]`) templates
- **S7 (1 hr):** Methodology footer + listings cleanup commit (delete the 5 dead Spark-cutover files)

**Per-session quality gates (each PR):**
- Section 2.0 standing gates pass
- `pnpm --filter @real-estate/premium-site build` green
- **Lighthouse mobile 4G** — all 4 categories ≥ 90 (run `npx lighthouse https://<preview-url>/phoenix --form-factor=mobile --throttling-method=devtools`)
- **WCAG 2.2 AA gates:**
  - Color contrast: text 4.5:1 minimum (3:1 for large text ≥18pt) — verify in browser DevTools accessibility pane
  - Keyboard navigation: every interactive element reachable via Tab; visible focus indicator
  - ARIA: `<button>` for actions (not `<div onClick>`); `aria-label` on icon-only buttons
  - Heading hierarchy: no skipped levels (h1 → h2 → h3, never h1 → h3)
- **Browser DevTools axe scan** — 0 violations
- **Bundle size:** `pnpm --filter @real-estate/premium-site analyze` — main chunk delta ≤ +5%
- **Playwright visual snapshot** — `apps/premium-site/__tests__/e2e/<route>.snap.spec.ts` includes `expect(page).toHaveScreenshot()` for the changed route at 375px and 1280px viewports
- **Visual smoke** at 375px (mobile-first) and 1280px in browser
- **ARMLS prime directives:**
  - Attribution preserved on every IDX surface (G1 — verify with grep for `list_agent_full_name`)
  - No deletions of MLS data; only `display_block` flag on Silver views (G3)
  - No KPIs from `sample_count < 20` — use `getConfidence()` from `@platform/shared/src/analytics-confidence.ts` (G5)

**Anti-patterns to verify absent (Phase B):**
- Hardcoded colors / spacing (no `[#hex]` in Tailwind classes)
- `<img>` instead of `next/image`
- Inline JSX > 150 lines in a route page
- Loading spinners instead of skeletons (per `CLAUDE.md §6.5`)
- Mocking the database in tests
- `framer-motion` import (CSS-only transitions per project rule)
- Component without `data-testid` on interactive elements (per `CLAUDE.md §7.2`)

**Per-session exit criteria:**
- One PR merged to `dev`
- Punch list updated (move task from in-progress → done)
- `docs/CHANGELOG.md` updated (one-line entry prepended)

### Session 8 — Phase B.5 final merge + Phase C: Active branch unlock (3 hrs)

**Phase B.5 final merge (~30 min):**
1. Confirm punch list 100% done
2. PR `feature/analytics-redesign` → `dev` → `testing` → `main`
3. Verify Yong's site shows the new design

**Phase C (~2.5 hrs):**
1. `git checkout -b feature/dbt-active-unlock main`
2. Edit `analytics/dbt_project.yml`: `enable_active: true`
3. `dbt build --select +tag:active` exit 0
4. `dbt test` exit 0 — verify `months_of_supply_within_bounds`, `active_status_consistency`
5. Verify every model has `description:` in YAML; verify every PK has `unique` + `not_null`
6. `dbt source freshness` — all bronze sources <12h
7. Re-enable active marts in `_analytics__exposures.yml`
8. Commit: `feat(analytics): unlock active branch — 27 models build`
9. PR through dev/testing/main

**Exit criteria:**
- Phoenix redesign live in production
- 27 dbt models build green locally
- `fct_active_inventory` row count ≈ 31K (within ±5% of Spark live)

### Session 9 — Phase D part 1: Build container + Lambda (4 hrs)

**Prereqs:** Session 8 complete; need approval gates ready (see Section 3).

**ADR to land in this PR:**
- `docs/DECISIONS.md` ADR-001 — "dbt runtime: Lambda Container vs ECS vs GitHub Actions." Decision: Lambda Container. Consequences: 15-min runtime cap, $0 idle cost, reuses existing IAM/alarm pipeline.

**Work:**
1. Build `infra/dbt/Dockerfile` — Python 3.12 slim + dbt-core + dbt-duckdb + httpfs/parquet/postgres extensions + AWS Lambda Power Tools (Python)
2. Local build: `docker buildx build --platform linux/amd64 --provenance=false -f infra/dbt/Dockerfile -t rlsir-analytics-dbt:local .`
3. **Container size check:** `docker images rlsir-analytics-dbt:local` — compressed size <250MB (Lambda zip soft limit; container can go higher but discipline says keep small). Hard cap: 10GB (Lambda container limit).
4. **CycloneDX SBOM:** `cyclonedx-py environment > sbom.json` from inside container; commit alongside Dockerfile
5. Local smoke: `docker run --rm rlsir-analytics-dbt:local --target dev --models +tag:smoke`
6. **GATE: AWS write approval** — ECR repo + image push + new Lambda + IAM role + EventBridge schedule
7. Push image to ECR
8. **ECR scan check:** `aws ecr describe-image-scan-findings --repository-name rlsir-analytics-dbt --image-id imageTag=latest` — 0 HIGH+ CVEs (block deploy if any)
9. Create Lambda `rlsir-analytics-dbt` (Container, 1024MB, 900s, `--reserved-concurrent-executions 1`)
10. **IAM least-privilege:** role has only:
    - `s3:GetObject` on `s3://rlsir-platform-assets-us-east-1/bronze/*`
    - `s3:PutObject` + `s3:DeleteObject` on `s3://rlsir-platform-assets-us-east-1/analytics/*`
    - `secretsmanager:GetSecretValue` on the RDS DSN secret ARN only
    - `cloudwatch:PutMetricData` on `RLSIR/DataPipeline` namespace only
    - Standard Lambda CloudWatch Logs perms
11. **IAM Access Analyzer:** `aws accessanalyzer create-analyzer --analyzer-name rlsir-default --type ACCOUNT` (if not exists); review findings on the new role
12. Add `task: "smoke"` mode that runs dbt with `--target dev` and exits without S3 writes
13. Manual invocation with `task: "smoke"` — confirm exit 0
14. `node scripts/check-free-tier.mjs` — confirm no breach (will be at 5/12 Lambdas, ~25/30 metrics if 5 added — under cap)

**Anti-patterns to verify absent (Phase D):**
- Wildcard IAM (`s3:*` on `*`)
- RDS DSN in env vars (must use Secrets Manager)
- `print()` instead of structured logger (Power Tools required)
- ECR image with `latest` tag in production (use immutable digest)
- 900s timeout always (justified by dbt run time)
- No DLQ on async invocation (S10 adds it)

**Exit criteria:**
- Lambda deployed, smoke invocation green
- IAM Access Analyzer shows 0 findings on new role
- ECR image scan shows 0 HIGH+ CVEs
- ADR-001 committed in same PR
- Container size <500MB compressed
- Free-tier audit green

### Session 10 — Phase D part 2: ORR + alarms + DLQ (5 hrs)

**Work:**
1. Configure DLQ: SNS topic `rlsir-dbt-failures` + Lambda `--dead-letter-config`
2. Three CloudWatch alarms:
   - Latency p99 > 600s
   - Errors > 0 (5min eval)
   - Freshness — `run_results.json` age > 90min
3. Wire all 3 alarms to existing `rlsir-token-alerts` SNS
4. EventBridge schedule `rate(1 hour)` — but **do not enable yet**
5. Walk Operational Readiness Review checklist (per best-practices doc Phase D):
   - Image scanned, no HIGH+ CVEs
   - SBOM generated via cyclonedx
   - `task: "smoke"` exits 0
   - Manual cold-invoke produces all 27 marts <300s
   - Logs structured JSON, correlation IDs present
   - All 3 alarms reach SNS on simulated breach
6. After ORR green: enable EventBridge schedule
7. First scheduled fire watched live — verify all 27 marts in `s3://.../analytics/`
8. Run `node scripts/check-free-tier.mjs` — confirm metrics + alarms still under cap (will be at 19/20 alarms — at the edge)

**Anti-patterns to verify absent (Phase D part 2):**
- Single alarm "Lambda Errors > 0" (need RED triad: latency p99, errors, freshness)
- `reservedConcurrentExecutions > 1` on a batch Lambda (deadlock risk per memory)
- New custom-metric NAME if a dimension covers the case (free-tier discipline)
- Alarm without `--treat-missing-data notBreaching` (false fires)

**Exit criteria:**
- Production dbt running hourly
- ORR checklist all green
- 27 marts present in S3 at expected paths
- Free-tier audit still passes (will be at 19/20 alarms — at edge, plan accordingly)

### Session 11 — Phase E: Reconciliation + parity dashboard (5 hrs)

**Prereqs:** Session 10 complete; production dbt running for at least 2 hours.

**ADR to land in this PR:**
- `docs/DECISIONS.md` ADR-002 — "Parity reconcile threshold: 1% drift, 3-day consecutive alarm, KS-test secondary check." Decision rationale: Stripe online-migration playbook + statistical robustness; thresholds tightened during 7-day soak if needed.

**Work:**
1. Extend `infra/lambda/bronze-reconcile.ts` — for each (mart, MV) pair, compute:
   - Row count delta
   - Sum-of-numeric-cols checksum
   - KS test p-value via `simple-statistics` npm
   - Sampled 100-row deep comparison for 3 high-stakes pairs
2. Use single CloudWatch metric `ParityDelta` with `MartName` dimension (not 9 separate metric names — would push past the cap)
3. Build `/admin/parity` route (Next.js, gated by NEXTAUTH role check, internal only)
4. Add CloudWatch alarm: `ParityDelta` >1% on any dimension for 3 consecutive days
5. Run reconcile manually first, then enable daily cron via existing reconcile EventBridge rule
6. Run `node scripts/check-free-tier.mjs` — confirm still under caps

**Anti-patterns to verify absent (Phase E):**
- Reconciliation that compares only row counts (need sums + KS + samples)
- Reconciliation alarm threshold too low (<0.1%) — floods false positives
- Reconciliation alarm threshold too high (>5%) — real drift hides
- Same SQL in both compared systems (proves nothing)
- 9 separate metric NAMES (must be one metric with `MartName` dimension — free-tier)

**Exit criteria:**
- All 9 pairs reconciled with KS test + sample
- Parity dashboard live, gated, accurate
- Alarm armed
- ADR-002 committed in same PR
- 7-day soak begins (Session 12)

### Session 12 — 7-day parity soak (passive monitoring)

**No active work.** Daily 5-min check:
- Open `/admin/parity` — confirm all 9 pairs <1% drift
- Check email inbox for any alarm fires
- Run `node scripts/check-free-tier.mjs` once mid-soak

**Exit criteria:**
- 7 consecutive green days on parity dashboard
- Zero alarm fires
- If any day red: investigate, fix, restart soak from day 0

### Session 13 — Phase F part 1: WASM scaffold (5 hrs)

**Prereqs:** Session 12 exits clean.

**ADR to land in this PR:**
- `docs/DECISIONS.md` ADR-003 — "DuckDB-WASM bundle path: separate chunk + service worker + Web Worker isolation." Decision rationale: 5MB bundle would tank LCP if loaded eagerly; service worker amortizes over navigations; Web Worker prevents main-thread jank.

**Work:**
1. `pnpm add @duckdb/duckdb-wasm workbox-window @next/bundle-analyzer` in `apps/premium-site`
2. Build `apps/premium-site/lib/duckdb-wasm.ts` — bootstrap, lazy load, register Parquet
3. Configure COEP / COOP / CORP headers in `next.config.ts`
4. Build Service Worker with workbox — caches WASM bundle + Parquet files for 30 days
5. Run `pnpm --filter @real-estate/premium-site analyze` — verify DuckDB-WASM is in a separate chunk that lazy-loads on Phoenix routes only
6. Wire `OverviewTab.tsx` behind `NEXT_PUBLIC_USE_DUCKDB_WASM=1` env var
7. Verify HTTP range requests in DevTools Network panel (Parquet partial reads, not whole-file fetch)

**Anti-patterns to verify absent (Phase F part 1):**
- Loading DuckDB-WASM on every page (incl /listings) — must be lazy-loaded only on /phoenix
- Fetching whole Parquet file (no range support) — verify range requests in Network panel
- Server returning Parquet as `text/plain` — must be `application/octet-stream` or `application/vnd.apache.parquet`
- `Cache-Control: no-cache` on versioned (hashed) Parquet files

**Exit criteria:**
- DuckDB-WASM chunk separate, lazy-loaded (verified via `@next/bundle-analyzer`)
- Service worker caches WASM + Parquet (verify in DevTools Application tab)
- Overview tab renders identical KPIs via WASM as RDS path
- ADR-003 committed in same PR
- Bundle size delta on `/phoenix` chunk ≤ +5.5MB (the WASM payload itself)

### Session 14 — Phase F part 2: Web Worker + ramp prep (6 hrs)

**ADR to land in this PR:**
- `docs/DECISIONS.md` ADR-004 — "Sentry free-tier discipline: 10% sampling + inbound filters." Decision rationale: Free tier 5K events/mo; without sampling a single render-loop bug exhausts the cap. Trade-off: 90% of perf data is lost; we accept that for pre-Pro stage.

**Work:**
1. Move DuckDB query execution into a Web Worker (off main thread)
2. Verify in DevTools Performance panel: queries don't jank scroll
3. Vercel preview deploy with `NEXT_PUBLIC_USE_DUCKDB_WASM=1`
4. Manual smoke against staging — Lighthouse mobile 4G ≥ 90, no LCP regression
5. Versioned Parquet filenames with content hash (`market_pulse-{hash}.parquet`) for long-TTL CDN caching
6. Document halt-and-revert criteria in `docs/runbook-cutover.md`:
   - Error rate >2σ above baseline → halt
   - Parity drift >2% on any pair → halt + rollback
   - Sentry browser errors >50% above baseline → halt
   - LCP regression >300ms → halt
7. Add `@sentry/nextjs` with full free-tier discipline config (per best-practices doc)
8. Run `node scripts/check-free-tier.mjs` — confirm Sentry config present + valid

**Anti-patterns to verify absent (Phase F part 2 / G prep):**
- Running queries on main thread (must be in Web Worker)
- Sentry without `tracesSampleRate ≤ 0.1` (free-tier breach)
- Halt criteria as "we'll know it when we see it" (must be specific thresholds)

**Exit criteria:**
- Web Worker pattern in place
- Halt-and-revert criteria documented in `docs/runbook-cutover.md`
- Sentry installed with sampling — `node scripts/check-free-tier.mjs` verifies sentry-config = PASS
- Free-tier audit green
- ADR-004 committed in same PR

### Session 15 — Phase G part 1: Port remaining 4 tabs (4 hrs)

**Work:**
1. Pricing tab → DuckDB-WASM behind same flag
2. Inventory tab → DuckDB-WASM
3. Activity tab → DuckDB-WASM
4. Timing tab → DuckDB-WASM
5. Each tab: per-tab Lighthouse + axe + visual smoke
6. Region/community pages: extend the same pattern to dynamic routes

**Exit criteria:**
- All 5 tabs functional via WASM at 100% in Vercel preview
- All Lighthouse mobile ≥ 90

### Session 16 — Phase G part 2: Rehearsal + 1% ramp (4 hrs)

**Work:**
1. Rollback rehearsal in staging:
   - Set `NEXT_PUBLIC_USE_DUCKDB_WASM=1` → 100%, confirm pages render
   - Set to 0%, confirm pages fall back to RDS path cleanly
   - No stale state, no console errors
2. Postmortem template at `docs/incident/postmortem-template.md`
3. Email Yong: "Tomorrow morning we begin a gradual rollout. You won't see anything different. If something looks wrong, screenshot + email me."
4. Vercel Edge Config for percentage rollout (free):
   - 1% of traffic → DuckDB-WASM path, sticky bucketed by cookie hash
5. Watch for 24 hrs:
   - Sentry errors at <2σ above baseline
   - Parity dashboard green
   - No Yong escalation
6. If green at 24 hrs → Session 17 ramp; if red → halt + postmortem

**Exit criteria:**
- 1% ramp soaked 24h with no breach of halt criteria
- Rollback rehearsed and confirmed clean

### Session 17 — Phase G part 3: Ramp 10/50/100 (active monitoring across 7 days)

**Day-by-day:**
- **Day 1:** Ramp to 10%; watch for 48h
- **Day 3:** If green → ramp to 50%; watch for 48h
- **Day 5:** If green → ramp to 100%; watch for 48h
- **Day 7:** If still green → 14-day soak begins (Session 18)

**Daily 10-min check during ramp:**
- Sentry dashboard event count
- `/admin/parity` — drift <1% on all pairs
- CloudWatch alarms — none firing
- Yong's email — no complaints
- `node scripts/check-armls-compliance.mjs` once mid-ramp

**Exit criteria:**
- 100% traffic on DuckDB-WASM
- 14-day soak begins

### Session 18 — 14-day production soak (passive monitoring)

**No active work.** Daily 5-min check:
- Sentry, /admin/parity, alarms, free-tier audit

**Exit criteria:**
- 14 consecutive green days
- If any day red: investigate, decide rollback or fix-forward

### Session 19 — Phase H.1 part 1: Snapshot + restore rehearsal (3 hrs)

**Prereqs:** Session 18 exits clean. **AWS write approval gate** — destructive ops ahead.

**ADR to land in this PR:**
- `docs/DECISIONS.md` ADR-005 — "RDS shrink window timing + restore rehearsal protocol." Decision rationale: planned ~5 min downtime during low-traffic window (early Sunday); restore rehearsal mandatory before any DROP MV; snapshot retention bumped to 14 days for the rollout window.

**Work:**
1. Create RDS snapshot: `rlsir-db-pre-mv-drop-2026-XX-XX`
2. Wait for snapshot status `available`
3. **Snapshot restore rehearsal:**
   - Restore snapshot to a new instance `rlsir-db-restore-test` (db.t3.micro)
   - Connect via psql, verify `mv_dashboard` populated, query a few rows
   - Confirm restore works
   - Delete the test instance
4. Document the rehearsal result in `docs/incident/snapshot-2026-XX-XX-rehearsal.md`

**Anti-patterns to verify absent (Phase H.1):**
- Skipping the snapshot "because we're confident"
- Snapshot created but never restored (untested = unverified)
- DROP MV outside a transaction
- DROP without communication to Yong + scheduled window

**Exit criteria:**
- Snapshot exists, status `available`
- Restore tested in separate instance, works
- Rehearsal log committed at `docs/incident/snapshot-2026-XX-XX-rehearsal.md`
- ADR-005 committed in same PR

### Session 20 — Phase H.1 part 2: Drop MVs + shrink (4 hrs)

**Prereqs:** Session 19 — snapshot rehearsal green.

**Work:**
1. Schedule low-traffic window with Yong (early Sunday morning ideal)
2. **GATE: explicit approval** to drop MVs + modify RDS instance
3. Begin transaction:
   - `DROP MATERIALIZED VIEW mv_dashboard, mv_market_pulse, mv_supply_demand, mv_absorption, mv_negotiation, mv_inventory_age, mv_community_scorecard, mv_community_yoy, mv_price_bands;`
   - Verify all dashboards still render (DuckDB-WASM path is now sole)
   - Commit
4. Update `infra/lambda/armls-sync.ts` REFRESH_ORDER — remove the 9 dropped MVs
5. Update `packages/database/src/queries/phoenix-analytics.ts` — remove RDS code paths
6. `VACUUM FULL` on freed tables
7. Modify RDS instance: t3.medium → t3.micro (planned ~5min downtime, communicated to Yong)
8. Wait for instance status `available`
9. Re-run `node scripts/check-armls-compliance.mjs` — confirm 99.9%+ within 12h still
10. **Schema baseline refresh:** `node scripts/schema-baseline.mjs > docs/db/schema-baseline-2026-XX-XX.{md,json}`
11. Verify AWS Cost Explorer shows new RDS line-item ≤ $25/mo (within 7 days)
12. Re-run `node scripts/check-free-tier.mjs` — confirm overall audit still green

**Exit criteria:**
- 9 MVs dropped, premium-site still renders via DuckDB-WASM only
- RDS on t3.micro, sync still working
- Schema baseline refreshed and committed
- Cost trajectory dropping (verified within 7 days post-shrink)
- Free-tier audit green

### Session 21 — Phase H.2: Runbooks + ADRs + diagrams (4 hrs)

**Work:**
1. `docs/runbook-analytics.md` — common ops:
   - Rerun dbt manually (dev + prod)
   - Roll back to RDS path (revert flag, re-create MVs from migrations)
   - Refresh active branch
   - Investigate parity drift
   - Investigate Sentry error spike
   - Restore from snapshot (with the rehearsal log linked)
2. `docs/DECISIONS.md` ADRs (most landed in earlier sessions; this is the audit + supplementals):
   - **ADR-001 dbt runtime** — landed in S9
   - **ADR-002 parity threshold** — landed in S11
   - **ADR-003 DuckDB-WASM bundle path** — landed in S13
   - **ADR-004 Sentry free-tier discipline** — landed in S14
   - **ADR-005 RDS shrink window** — landed in S19
   - **ADR-006 Free-tier discipline as policy** — write here, references the runbook
   - **ADR-007 Vercel Hobby tier vs Pro** — commercial use TBD with Yong; capture pros/cons
   - Verify all 7 ADRs present; supersede any that became stale during rollout
3. C4-PlantUML diagrams in `docs/architecture/`:
   - C1 (Context): Yong's site, Spark API, RDS, S3, Vercel, browsers
   - C2 (Container): Premium-site, Backend API, Lambdas, RDS, S3, dbt
   - C3 (Component) for the most-touched container
4. Update `docs/ARCHITECTURE.md` with new diagrams; mark RDS-MV section deprecated (don't delete)
5. Update `docs/PROJECT.md` — mark roadmap complete
6. Update `docs/CHANGELOG.md` with all shipped phases
7. Optional: Storybook scaffold (deferred from Phase B) — future-redesign infrastructure

**Exit criteria:**
- 6+ runbook entries
- 6+ ADRs
- 3 C4 diagrams
- Future-Joey acceptance test: open `docs/runbook-analytics.md`, find an answer to "rerun yesterday's dbt run" without grep

### Session 22 — Final hand-off (1 hr)

**Work:**
1. Run all 3 audits in sequence:
   - `node scripts/check-free-tier.mjs`
   - `node scripts/check-armls-compliance.mjs`
   - `node scripts/db-inspect.mjs`
2. All exit 0
3. Verify Section 1 end-state checklist — all green
4. Schedule first DR drill within 30 days (calendar event)
5. Close out tasks #30–#36 (Phase 1–7 of original task list) — all completed
6. Update `MEMORY.md`:
   - Mark roadmap complete
   - Move to monitoring cadence section
   - Note any unresolved ADRs (e.g., Vercel Pro decision)

**Exit criteria:**
- All audits green
- Section 1 checklist 100%
- DR drill on calendar
- Project moves from "active development" to "monitoring only"

---

## Section 2.5 — Quick wins (do any time, slot in <2 hr windows)

These don't block phases. Do whenever convenient between sessions.

| ID | Win | Effort |
|---|---|---|
| Q1 | Emit `ActivesStaleOver12h` metric on every refresh-actives fire (4× more datapoints) | 30 min |
| Q2 | Fix Spark `_getAllPinsImpl` $top=5000 → 1000 in `packages/spark/src/ListingService.ts:149` | 30 min |
| Q3 | Document SPARK_API_ACCESS_TOKEN refresh from Secrets Manager in dev script | 30 min |
| Q4 | Investigate Apr 19 sync-error spike (77 errors), document RCA in DECISIONS.md if not | 1 hr |
| Q5 | Set up gitleaks pre-commit hook | 15 min |
| Q6 | Set up commitlint with @commitlint/config-conventional | 10 min |
| Q7 | Verify husky + lint-staged actually installed (CLAUDE.md prescribes but may not be) | 15 min |

---

## Section 3 — Approval gates summary

In execution order. Each is a moment to STOP and explicitly confirm before proceeding.

| # | Session | Gate | Risk |
|---|---|---|---|
| G1 | S1 | Cut new branch off main | Low |
| G2 | S2 | Force-push `feature/lakehouse-stabilize` if rebase needed | Medium — coordinate if shared |
| G3 | S2 | Merge PR to main via dev → testing | Low (CI guards) |
| G4 | S8 | Merge redesign branch to main | Medium — visible to Yong |
| G5 | S9 | **AWS write** — ECR repo create + image push + new Lambda + IAM role + EventBridge rule + 3 alarms | Medium |
| G6 | S10 | Enable EventBridge schedule (production dbt starts running hourly) | Medium |
| G7 | S11 | **AWS write** — 1 new alarm on parity drift | Low |
| G8 | S14 | Install Sentry → produces external traffic | Low |
| G9 | S16 | Begin 1% production rollout | Medium — visible to users |
| G10 | S17 | Each ramp step (10%, 50%, 100%) | Medium each |
| G11 | S19 | **AWS write** — RDS snapshot creation | Low (just creates a backup) |
| G12 | S20 | **DESTRUCTIVE** — drop 9 MVs from RDS | High — has snapshot fallback |
| G13 | S20 | **DESTRUCTIVE** — modify RDS instance class (t3.medium → t3.micro) | Medium — reversible |

---

## Section 4 — Steady-state monitoring cadence (post-completion)

Once Section 1 end-state is met, you exit active development. The system runs itself with this cadence:

### Daily — 0 minutes
- **Nothing required.** Email inbox is the only watch — alarms fire to `jschnepel@gmail.com`.

### Weekly — 5 minutes
- One glance: AWS Budget email, Sentry dashboard, `/admin/parity` (eyeball)
- If anything looks off → run `node scripts/check-free-tier.mjs && node scripts/check-armls-compliance.mjs`

### Bi-weekly — 15 minutes (already automated for ARMLS compliance)
- `node scripts/check-armls-compliance.mjs` — bi-weekly probe (every other Sunday)
- `node scripts/check-free-tier.mjs` — verify all green

### Monthly — 30 minutes
- AWS Cost Explorer review — actual vs budget
- Sentry event count vs free-tier ceiling (4K of 5K cap)
- Vercel bandwidth + GitHub Actions minutes — verify under
- Update `docs/runbook-free-tier.md` "Current spend snapshot" table
- Verify `docs/MEMORY.md` is still accurate (anything stale?)

### Quarterly — 2 hours
- **DR drill:** restore the latest RDS snapshot to a test instance, verify queries work, delete
- Test the rollback flag: set `NEXT_PUBLIC_USE_DUCKDB_WASM=0` in staging, verify RDS path still serves
- Audit IAM Access Analyzer — look for unused permissions
- Run `pnpm audit --audit-level=high` — fix any HIGH+ CVEs

### Semi-annually — 3 hours
- Re-read all 6 ADRs in `docs/DECISIONS.md` — are any decisions stale?
- Re-read `docs/ARCHITECTURE.md` — does the C4 diagram still match reality?
- Refresh the schema baseline: `node scripts/schema-baseline.mjs` → `docs/db/schema-baseline-YYYY-MM-DD.{md,json}`
- Compare to last baseline; document drift

### Annually — half day
- Full architecture review against current scale (Yong's traffic, listing volume, agent count)
- Reassess Vercel Hobby vs Pro
- Reassess RDS instance class
- Review all CloudWatch alarms — drop any that haven't fired in 12 months unless protecting a known recurring failure mode

### Triggered (not on a schedule)
- New Lambda → run runbook checklist + verify free-tier audit still green
- New custom metric → consider dimension instead of new name
- Yong reports anything → investigate within 24h, postmortem within 48h if real

---

## Section 5 — Failure modes + recovery

What can go wrong, ordered by likelihood × impact:

| Failure | Likelihood | Impact | Recovery |
|---|---|---|---|
| ARMLS staleness >12h alarm fires | Medium | $21K fine | Re-fire `refresh-actives` Lambda manually; if persistent, check Spark token, EventBridge state |
| Sentry errors spike during cutover | Medium | User-visible | Halt ramp, investigate via halt criteria doc, rollback flag if needed |
| dbt Lambda timeout >900s as data grows | Medium | Marts go stale | Bump memory, increase incremental usage, partition further |
| Parity drift >1% on a pair | Medium | Audit risk | Halt, isolate which pair, query bronze + dbt + RDS-MV to find root cause |
| RDS snapshot restore fails | Low | Catastrophic | We rehearsed restore in S19; have automated daily snapshots as second line |
| DuckDB-WASM fails on a browser version | Low | Minority of users | Feature flag back to RDS path; investigate user agent |
| Vercel cancels Hobby for commercial use | Low | Site down | Pre-purchased Pro hedge ($20/mo); flagged as ADR question |
| ARMLS API down for >12h | Low | Compliance breach | Pause refresh-actives; existing data ages naturally; resume when ARMLS recovers |
| Lambda concurrency throttling | Low | Sync delays | We're at 4 with 8 EventBridge rules; bump to 6 if needed |

---

## Section 6 — Calendar map

Realistic calendar assuming 1–2 hrs/day weekdays, 4–8 hrs Saturdays:

```
Week 1 (May 5–11)
  Mon  S1+S2  Phase A complete (3 hrs evening)
  Tue  S3     Phase B audit (3 hrs evening)
  Wed  S4     Hero/KPI redesign (3 hrs)
  Thu  S5     Tab content (3 hrs)
  Fri  —      (rest, monitor)
  Sat  S6+S7  Region/community + listings cleanup + merge (4 hrs)
  Sun  —      (free)

Week 2 (May 12–18)
  Mon  S8     Phase B merge + Phase C unlock (3 hrs)
  Tue  S9     Phase D part 1 — container + Lambda (4 hrs across 2 days possible)
  Wed  S9 cont
  Thu  S10    Phase D part 2 — ORR + alarms (5 hrs across 2 days)
  Fri  S10 cont
  Sat  S11    Phase E — reconciliation + parity dashboard (5 hrs)
  Sun  —      Soak begins

Week 3 (May 19–25)
  Daily 5-min checks during 7-day soak (S12)
  Sat (May 25): If green, S13 begin — WASM scaffold

Week 4 (May 26 – Jun 1)
  Mon  S13 cont (5 hrs across days)
  Wed  S14    Web Worker + Sentry (6 hrs across days)
  Sat  S15    Port remaining 4 tabs (4 hrs)
  Sun  S16    Halt criteria + rehearsal + 1% ramp (4 hrs)

Week 5 (Jun 2–8)
  S17 ramp days
  Mon  10% ramp
  Wed  50% ramp (if green)
  Fri  100% ramp (if green)
  Weekend: 14-day soak begins

Week 6–7 (Jun 9–22)
  S18 — 14-day passive soak
  Daily 5-min checks

Week 8 (Jun 23–29)
  Mon  S19   RDS snapshot + restore rehearsal (3 hrs)
  Wed  S20   Drop MVs + shrink RDS (4 hrs, planned downtime communicated)
  Sat  S21   Runbooks + ADRs + diagrams (4 hrs)
  Sun  S22   Final hand-off audit (1 hr)
```

**Realistic completion: ~Jun 29, 2026** — ~8 weeks from today.

After Jun 29: enter monitoring-only mode per Section 4.

---

## Section 6.5 — Anti-pattern checklist by phase (the consolidated list)

Run this list before merging any PR. Cross-reference against your diff. **Source of truth:** `docs/superpowers/plans/2026-05-04-roadmap-best-practices.md` § Anti-pattern Hall of Fame.

### Phase A (Git stabilization)
- [ ] No `--no-verify` on commits
- [ ] No mixing of unrelated concerns in one commit
- [ ] No AI/Anthropic/Claude attribution in commits, code, or PR body
- [ ] No force-push to a shared branch
- [ ] No committed secrets (gitleaks pre-commit catches)
- [ ] No `tsbuildinfo` files staged

### Phase B (Phoenix UI)
- [ ] No hardcoded colors / spacing (no `[#hex]` in Tailwind)
- [ ] No raw `<img>` (use `next/image`)
- [ ] No JSX > 150 lines in a single component
- [ ] No loading spinners for content (use Skeleton)
- [ ] No `framer-motion` import (CSS-only transitions)
- [ ] No mock-DB in tests
- [ ] No interactive element without `data-testid`
- [ ] No KPI from `sample_count < 20`
- [ ] No missing `list_agent_full_name` / `list_office_name` on IDX surfaces

### Phase C (dbt active)
- [ ] No `select *` business logic in views (centralize in staging)
- [ ] No copy-pasted column logic across marts
- [ ] No `materialized='view'` on hot-read marts
- [ ] No `dbt run --full-refresh` in production cron
- [ ] No `UPDATE listing_records` (ARMLS license)
- [ ] No tests on sources without tests on staging

### Phase D (Production dbt Lambda)
- [ ] No wildcard IAM (no `s3:*` on `*`)
- [ ] No DSN in env vars (Secrets Manager only)
- [ ] No `print()` statements (Power Tools structured logger)
- [ ] No ECR `latest` tag in production deploy
- [ ] No missing DLQ on async invocation
- [ ] No `reservedConcurrentExecutions > 1` on a batch job
- [ ] No single "Lambda Errors > 0" alarm without RED triad
- [ ] No new metric NAME if a dimension covers it (free-tier)

### Phase E (Reconciliation)
- [ ] No row-count-only comparison
- [ ] No alarm threshold <0.1% (false-positive flood)
- [ ] No alarm threshold >5% (real drift hidden)
- [ ] No identical SQL on both sides (proves nothing)
- [ ] No 9 separate metric NAMES (use dimensions)

### Phase F (DuckDB-WASM)
- [ ] No DuckDB-WASM eager load on non-/phoenix routes
- [ ] No whole-Parquet fetch (range requests required)
- [ ] No queries on main thread (Web Worker required)
- [ ] No service worker absent (re-download per nav)
- [ ] No `Cache-Control: no-cache` on hashed Parquet URLs
- [ ] No Sentry config without `tracesSampleRate ≤ 0.1`

### Phase G (Cutover)
- [ ] No cutover during ARMLS audit window
- [ ] No 0% → 100% flip without intermediate ramps
- [ ] No cutover Friday afternoon
- [ ] No undocumented rollback plan
- [ ] No skipping the 14-day soak
- [ ] No flag flip without active monitoring window
- [ ] No ramp without pre-committed halt-and-revert criteria

### Phase H (RDS shrink + ops)
- [ ] No DROP without snapshot
- [ ] No snapshot without restore rehearsal
- [ ] No DROP outside a transaction
- [ ] No instance modify without communication to Yong
- [ ] No runbook that says "figure it out"
- [ ] No ADR without WHY + alternatives
- [ ] No deletion of `docs/CHANGELOG.md` history

### Cross-cutting (any session)
- [ ] No `--no-verify` to skip hooks
- [ ] No commit without `pnpm type-check` 0 errors
- [ ] No commit without `pnpm lint` 0 errors
- [ ] No PR merge without standing gates from Section 2.0
- [ ] No new AWS resource without `node scripts/check-free-tier.mjs` PASS
- [ ] No architectural choice without ADR in same PR

---

## Section 7 — How to use this playbook

### Each session
1. Open this file at the relevant Session section
2. Verify prereqs are met (previous session's exit criteria)
3. Use TaskCreate to add tasks for the session's work items
4. Work through the work items
5. Verify exit criteria — every checkbox green
6. Commit + PR + merge
7. Update this file: cross out completed sessions

### When you have <2 hrs
Don't start a new session. Pick a Quick Win from Section 2.5.

### When you're not sure if a phase is complete
Open Section 1 — end-state checklist. If everything in your phase is checked, you're done with that phase.

### When something goes wrong
Open Section 5 — failure modes. If your failure isn't listed, postmortem it and add it to Section 5 for future reference.

### When you finish
Section 4 takes over. You stop opening this playbook except for the rare audits.

---

**End of playbook.**
