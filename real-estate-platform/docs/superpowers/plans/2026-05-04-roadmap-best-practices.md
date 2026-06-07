# Roadmap — Best-Practice, Industry-Standard, Research-Backed Methodology

**Date:** 2026-05-04
**Owner:** Joey Schnepel
**Companion to:** `2026-05-04-comprehensive-roadmap.md`
**Status:** Reference. Apply as you execute each phase.

This document layers research-backed methodology onto the WHAT/WHEN of the roadmap. Each phase below maps to a Phase letter (A–H) in the roadmap.

For each phase you get:
- **Why it has standards** — what failure mode the standard prevents
- **Industry-standard practices** with citations
- **Quality gates** — concrete checklists per PR
- **Anti-patterns** — common mistakes
- **Tooling** — recommended specific tools
- **Research basis** — peer-reviewed / industry-foundational sources

---

## Phase A — Git Stabilization

### Why it has standards
Uncommitted production code is a single-point-of-failure. The DORA "State of DevOps" research (Forsgren, Humble, Kim, 2018, *Accelerate*) found **deployment frequency** and **lead time for changes** are the strongest predictors of org performance — both depend on small, atomic, well-described commits.

### Industry-standard practices

| Practice | Source | Concrete application |
|---|---|---|
| **Conventional Commits** spec for commit messages | conventionalcommits.org | `feat(lambda): ARMLS 12h compliance — refresh-actives task` |
| **Atomic commits** — one logical change per commit | Linus Torvalds' git guidelines; Erlang's Joe Armstrong "small is beautiful" | Each Phase A sub-phase (A.1 → A.6) is one atomic commit |
| **Trunk-based development** — short-lived branches off main | Paul Hammant, *Trunk-Based Development*; DORA 2019 SODR | `feature/lakehouse-stabilize` lives <2 days |
| **Signed commits + verified author** | Git/GitHub security model | All commits authored by Joey only (per `CLAUDE.md` line 197) |
| **CODEOWNERS** for protected paths | GitHub docs | Add `infra/lambda/` and `analytics/` to CODEOWNERS for review-required gates |
| **Pre-commit hooks** with linters | Husky + lint-staged (per `CLAUDE.md` §6.3) | `pnpm type-check` + `pnpm lint` before each commit |
| **PR description as work artifact** | Atlassian, GitHub Flow | Each PR explains the WHY (motivation), not the WHAT (diff is the WHAT) |
| **Git LFS for binary blobs >100KB** | git-lfs.com | Avoid checking in `.parquet`, `.zip`, debug `.json` payloads |

### Quality gates per commit

- [ ] `pnpm type-check` exit code 0
- [ ] `pnpm lint` exit code 0
- [ ] No secrets in diff (`git diff --check`; secret scanner like gitleaks)
- [ ] No binary files >100KB (use `git ls-files --eol` to scan)
- [ ] Conventional Commits format on subject line
- [ ] Subject line ≤72 chars; body wraps at 72
- [ ] Body explains WHY, not WHAT
- [ ] No "WIP" or "fixup!" commits in PR (squash before merge)
- [ ] CodeSha256 of deployed Lambda matches built artifact (for A.1, A.2)

### Anti-patterns

| Smell | Why bad |
|---|---|
| `git add .` on a 50-file working tree | Bundles unrelated changes — breaks bisect, makes review impossible |
| Mixing migration registry + Lambda code in one commit | Different rollback cadences; one might revert independently |
| "Final fixes" / "stuff" commit messages | Breaks `git log` searchability, future blame archaeology |
| Force-pushing a shared branch | Rewrites history others may have based work on |
| Skipping pre-commit hooks (`--no-verify`) | Defeats the purpose; breaks CI later |
| Committing `tsconfig.tsbuildinfo` files | Generated artifacts; goes in `.gitignore` |

### Tooling

- `commitlint` — enforce Conventional Commits at pre-commit
- `gitleaks` — scan for secrets in pre-commit
- `git-blame-ignore-revs` file — exclude formatting-only commits from blame
- GitHub branch protection: require reviewers, status checks, linear history
- `git rerere` — auto-resolve repeated rebase conflicts (helpful for rebasing the redesign branch)

### Research basis

- Forsgren, Humble, Kim (2018). *Accelerate: The Science of Lean Software and DevOps*. ISBN 978-1942788331. — DORA's four key metrics.
- Hammant, Paul (2020). *Trunk-Based Development*. trunkbaseddevelopment.com — TBD as predictor of high performance.
- Cohn, Mike (2009). *Succeeding with Agile*. — Small batch sizes reduce risk linearly.

---

## Phase B — Phoenix Dashboard Redesign

### Why it has standards
UI work without standards regresses accessibility, performance, and consistency between releases. The "tech debt is debt" framing (Cunningham 1992; refined by Fowler 2003) applies most acutely to UI because it's customer-facing and visible to the ARMLS audit.

### Industry-standard practices

| Practice | Source | Concrete application |
|---|---|---|
| **Component-Driven Development** | Storybook / Brad Frost *Atomic Design* | Phoenix tabs use `@platform/ui` components; new compositions go in `apps/premium-site/.../components/` |
| **Design tokens (W3C-DTCG draft)** | tr.designtokens.org/format | All values via CSS vars — no `[#hex]` (per `CLAUDE.md` §1.5, §2.1) |
| **WCAG 2.2 AA** accessibility | W3C / Section 508 | Color contrast 4.5:1 body / 3:1 large; keyboard nav; ARIA roles |
| **Core Web Vitals** budget | web.dev/vitals | LCP <2.5s, INP <200ms, CLS <0.1 on mobile 4G |
| **Lighthouse CI** in CI/CD | github.com/GoogleChrome/lighthouse-ci | Block merge if Lighthouse mobile score <90 (per RLSIR skill) |
| **Visual regression testing** | Playwright snapshots (free, in-repo) | Snapshot Phoenix tabs before/after each PR via `expect(page).toHaveScreenshot()` |
| **Bundle-size budgets** | bundlesize, size-limit | Block PR if main bundle grows >5% without justification |
| **Mobile-first responsive** | Luke Wroblewski (2011) | Design at 375px first, scale up; not desktop-down |
| **Progressive enhancement** | Aaron Gustafson (2008) | Server-render first paint; hydrate for interactivity |
| **Optimistic UI updates** | Per `CLAUDE.md` §7.4 | Apply updates immediately; revert on failure |
| **Empty / loading / error states** | Per `CLAUDE.md` §6.4, §7.5 | Three-state pattern, never blank |

### Quality gates per redesign PR

- [ ] `pnpm type-check` 0 errors across packages
- [ ] `pnpm --filter @real-estate/premium-site build` green
- [ ] Lighthouse mobile (4G throttled): all four categories ≥ 90
- [ ] Bundle size delta: main bundle ≤ +5% without doc justification
- [ ] WCAG: axe-core in Playwright shows 0 violations
- [ ] Visual diff approved (Playwright snapshot diff or manual review)
- [ ] Attribution preserved on every IDX surface (ARMLS prime directive G1)
- [ ] No `display_block` or removed listings (ARMLS prime directive G3)
- [ ] No KPIs sourced from rows with `sample_count < 20` (ARMLS prime directive G5)
- [ ] Manual smoke on staging in browser — golden path + 2 edge cases

### Anti-patterns

| Smell | Why bad |
|---|---|
| Hardcoded colors / spacing | Breaks per-tenant theming; fights design tokens |
| `<img>` instead of `next/image` | Skip CLS optimization, layout shift, format negotiation |
| Inline JSX > 50 lines in a route page | Violates 150-line rule; unmaintainable |
| Mocking the database in tests | "We got burned last quarter" — feedback memory |
| Adding framer-motion | Project rule (`CLAUDE.md` §pattern) — CSS-only transitions |
| Loading spinners instead of skeletons | Per `CLAUDE.md` §6.5 |
| Submitting changes without browser smoke | "If you can't test the UI, say so explicitly rather than claim success" — system instruction |

### Tooling (all free)

- Storybook 8 — component playground; can host Yong's review (free, OSS, MIT)
- Playwright visual snapshots — `expect(page).toHaveScreenshot()` for visual regression (free, already in repo) — replaces Chromatic/Percy
- Playwright — E2E (free, already in repo)
- `@axe-core/playwright` — accessibility scanner (free, OSS, MPL-2.0)
- `size-limit` + GitHub Action — bundle budget enforcement (free, OSS, MIT)
- `treosh/lighthouse-ci-action` — Lighthouse CI in GitHub Actions (free, OSS)
- React DevTools Profiler — render perf (free, browser extension)
- **Skipped (paid):** Chromatic ($149+/mo paid tier), Percy (free tier 5K screenshots/mo — use Playwright snapshots in repo instead)

### Research basis

- Frost, Brad (2016). *Atomic Design*. atomicdesign.bradfrost.com — primitives → molecules → organisms.
- Wroblewski, Luke (2011). *Mobile First*. ABA. — content priority forced by constraint.
- Krug, Steve (2014). *Don't Make Me Think (3rd ed)*. — usability heuristics.
- Wagner, J. (web.dev). Core Web Vitals — measured against bounce/conversion correlations.
- Norman, Don (2013). *The Design of Everyday Things (Revised)*. — affordance, signifiers, feedback loops.

---

## Phase C — dbt Active Branch Unlock

### Why it has standards
The data layer is where silent bugs live longest. A dashboard that displays incorrect numbers can ship for months before anyone notices. dbt Labs' best-practices guide and Maxime Beauchemin's "Functional Data Engineering" frame this problem.

### Industry-standard practices

| Practice | Source | Concrete application |
|---|---|---|
| **Layered project: sources → staging → marts** | dbt Labs best practices | `analytics/models/staging/armls/` → `models/marts/*` |
| **One-to-one source-to-staging** | dbt Labs | One stg model per source table; rename + light cast only |
| **Data tests on every model** | dbt-utils, dbt-expectations | `not_null`, `unique`, `relationships`, `accepted_range` |
| **Source freshness checks** | dbt source freshness | Block dbt run if bronze source >12h stale (ARMLS rule) |
| **dbt-bouncer for project-level rules** | godatadriven/dbt-bouncer | Enforce model-naming, materialization, tag conventions |
| **Functional / idempotent transforms** | Beauchemin (Airbnb 2017) "Functional Data Engineering" | No mutations; rebuild from source on demand |
| **Slowly Changing Dimensions (Type 2 where needed)** | Kimball *The Data Warehouse Toolkit* | Apply to listing changes that need point-in-time history |
| **Exposures** for downstream consumers | dbt exposures | `apps/premium-site/.../phoenix` declared as exposure on the marts |
| **dbt docs generate + serve** | dbt Labs | Lineage graph + column descriptions in CI artifacts |
| **Deterministic surrogate keys** | `dbt_utils.generate_surrogate_key` | Stable across reruns; required for incremental models |

### Quality gates

- [ ] `dbt build --target dev` exits 0
- [ ] `dbt test` exits 0 — every test passes
- [ ] All 27 models have `description` in YAML
- [ ] Every column with semantic meaning has `description`
- [ ] Every primary key has `unique` + `not_null` test
- [ ] Every foreign key has `relationships` test
- [ ] `dbt source freshness` shows all bronze sources fresh ≤12h
- [ ] `dbt-bouncer` checks pass (naming, materialization, tagging)
- [ ] `fct_active_inventory` row count within ±5% of Spark live count
- [ ] No silent NULL columns where the source has values

### Anti-patterns

| Smell | Why bad |
|---|---|
| Business logic in `select *` views | Buries logic in implicit casts/coercions |
| Same column logic copy-pasted across marts | Centralize in staging or a macro |
| `materialized='view'` on a mart that's read 1000x/day | Recomputes every read; should be `table` or `incremental` |
| Tests defined on sources but not staging | Tests on raw data don't catch transform bugs |
| `dbt run --full-refresh` in production cron | Defeats incremental models; expensive |
| Hard-deletes in `listing_records` | Violates ARMLS license — derived layer only |
| Numerical KPIs from `< 20` sample rows | Thin-data trap (DOM=3 incident) |

### Tooling

- dbt-core 1.11+ + dbt-duckdb 1.10+
- dbt-bouncer — project-level linting
- dbt-checkpoint — pre-commit validation
- Elementary — observability + anomaly detection
- dbt-expectations — Great Expectations-style assertions
- ReData / SqlFluff — SQL linting

### Research basis

- Kimball, R. & Ross, M. (2013). *The Data Warehouse Toolkit (3rd ed)*. — dimensional modeling standard.
- Beauchemin, Maxime (2017). "Functional Data Engineering — A Modern Paradigm for Batch Data Processing." Medium. — idempotency primacy.
- Reis, J. & Housley, M. (2022). *Fundamentals of Data Engineering*. O'Reilly. — modern data stack lifecycle.
- Inmon, B. & Linstedt, D. (2014). *Data Architecture: A Primer for the Data Scientist*. — Bronze/Silver/Gold (medallion) origins.

---

## Phase D — Production dbt Deployment (Lambda Container)

### Why it has standards
The transition from "scheduled job that works on my laptop" to "serverless container in production" is where most teams introduce silent failures. AWS Well-Architected Framework + 12-Factor App methodology address this.

### Industry-standard practices

| Practice | Source | Concrete application |
|---|---|---|
| **AWS Well-Architected — 5 pillars** | AWS docs | Operational excellence, security, reliability, performance, cost |
| **Container image scanning** | AWS Inspector v2; ECR scan on push | Block deploy if HIGH+ vulnerabilities |
| **Image SBOM** | CycloneDX or SPDX | Track every dependency for license + CVE |
| **Least-privilege IAM** | AWS docs; CIS benchmarks | Lambda role has only the 3 actions on 1 resource |
| **Single-purpose Lambdas** | AWS Lambda best practices | One Lambda = one job; don't multi-purpose `rlsir-armls-sync` further |
| **Reserved concurrency** | AWS Lambda docs | Set to 1 for serialized jobs (matches existing pattern) |
| **Dead-letter queues** | AWS Lambda async invocation | Capture failed events for forensics |
| **Structured logging** | 12-factor app, OpenTelemetry | JSON logs with correlation IDs into CloudWatch |
| **Custom metrics with namespaces** | AWS CloudWatch best practices | `RLSIR/DataPipeline` namespace (already exists) |
| **Three SLIs per service** | Google SRE book | Latency p99, error rate, freshness — alarm each |
| **Operational Readiness Review** | AWS WA OPS09-BP01 | Pre-launch checklist (see Quality gates below) |
| **Idempotent Lambda handler** | AWS Lambda best practices | Same input → same output (re-run safety) |
| **Container image size <250MB compressed** | AWS Lambda docs | Use `--platform=linux/amd64 --provenance=false`; multi-stage builds |
| **Health-check / dry-run mode** | 12-factor; Stripe's "test mode" | Lambda accepts `task: "smoke"` payload that exits without writes |

### Quality gates (Operational Readiness Review)

- [ ] `pnpm type-check` 0 errors
- [ ] Container image scanned, no HIGH+ CVEs
- [ ] Image size <250MB
- [ ] IAM policy: `iam-policy-simulator` confirms only intended actions allowed
- [ ] Smoke test: `task: "smoke"` invocation returns success without S3 writes
- [ ] Manual cold-invoke: produces all 27 marts in <300s
- [ ] CloudWatch logs show structured JSON, correlation IDs present
- [ ] All 3 alarms reach SNS topic on simulated breach
- [ ] Reserved concurrency = 1
- [ ] DLQ configured (SNS or SQS) for async failures
- [ ] Runbook entry: "How to rerun dbt manually" + "How to rollback"
- [ ] Doc: "How to get into the Lambda's Python REPL for debugging" (CW Logs Insights queries)

### Anti-patterns

| Smell | Why bad |
|---|---|
| Wildcard IAM (`s3:*` on `*`) | Blast radius; breach = total compromise |
| Storing RDS DSN in env vars | Use Secrets Manager (rotation, audit) |
| `print()` instead of structured logger | CW Logs Insights can't parse, can't aggregate |
| No reserved concurrency on a batch job | Concurrent fires cause race conditions |
| Single alarm "Lambda Errors > 0" | Misses freshness, latency tail |
| 900s timeout always | If your job needs 800s, fix the job — don't pad budget |
| No DLQ on async invocation | Failures vanish; no forensic trail |
| Bundling node_modules into Lambda zip when container would work | Container has 10GB limit vs zip's 250MB |
| `reservedConcurrentExecutions > 1` on the sync Lambda | Returns deadlock failure (memory + skill warns) |

### Tooling

- AWS Inspector — image scanning
- IAM Access Analyzer — find unused permissions
- AWS Lambda Power Tools (Python) — structured logging, metrics, tracing
- aws-sdk-mock + moto — local Lambda testing
- AWS SAM or Serverless Framework — repeatable deploys
- CloudWatch Logs Insights — log analysis queries

### Research basis

- AWS (2023). *AWS Well-Architected Framework*. aws.amazon.com/architecture/well-architected
- Google SRE (2016). *Site Reliability Engineering*. Beyer, Jones, Petoff, Murphy. Ch. 4 (SLOs), Ch. 5 (eliminating toil)
- Heroku (2011). *The Twelve-Factor App*. 12factor.net — standard for cloud-native services
- AWS Lambda team. *Lambda Operator Guide*. docs.aws.amazon.com/lambda/latest/operatorguide/
- Burns, B. & Beda, J. (2019). *Kubernetes: Up and Running*. — applies to container patterns, not just K8s

---

## Phase E — Parallel-Run Reconciliation

### Why it has standards
Dual-running an old and new system without reconciliation is "hope-driven engineering." The Strangler Fig Pattern (Fowler 2004) and the Stripe online-migration playbook formalize how to compare and switch safely.

### Industry-standard practices

| Practice | Source | Concrete application |
|---|---|---|
| **Strangler Fig Pattern** | Martin Fowler (2004) | New system grows alongside old; old shrinks until removed |
| **Shadow / dark traffic** | Twitter SRE; LinkedIn engineering blog | Read both, return old, log new for comparison |
| **Tolerance bands per metric** | Stripe migration playbook | <1% drift OK; 1-5% investigate; >5% block cutover |
| **Daily reconciliation cron** | Modern Data Stack norm | Independent of business hours; runs whether anyone watches |
| **Drift dashboard with history** | CloudWatch Dashboards (free, already in use) | 30-day trend per pair; spot regressions early |
| **Soak time before cutover** | Google SRE — error budgets | 7 days of green before each progressive rollout step |
| **Statistical comparisons** | Great Expectations / Soda | Not just `=`; compare distributions (KS test, Wasserstein distance) |
| **Sampled deep comparison** | Stripe; Airbnb data quality | Row-level sampling for the lowest-tolerance pairs |
| **Reconciliation tests in CI** | dbt-expectations | Block PR if a known invariant breaks |

### Quality gates

- [ ] All 9 mart/MV pairs reconciled daily
- [ ] Drift threshold <1% per pair for triggering green status
- [ ] Drift dashboard at `/admin/parity` shows 30-day trend
- [ ] Alarm fires if any pair >1% for 3 consecutive days
- [ ] At least 7 consecutive green days before Phase F unlocks
- [ ] Manual statistical comparison run for one pair: distribution histograms aligned
- [ ] Sampled deep comparison: 100 random rows from each pair, all match within rounding

### Anti-patterns

| Smell | Why bad |
|---|---|
| Reconciliation only checks row counts | Misses semantic drift (right count, wrong values) |
| Reconciling sums but not percentiles | DOM, price-per-sqft drift hides in tails |
| Reconciliation alarm threshold too low (<0.1%) | Floods with false positives; team ignores it |
| Reconciliation alarm threshold too high (>5%) | Real drift hides in noise |
| Same SQL in both systems being compared | If logic is shared, the comparison proves nothing |
| Reconciliation that depends on the system being reconciled | Circular |
| No history retained | Can't diagnose "when did this start drifting" |

### Tooling (all free)

- `dbt-expectations` — assertions in dbt (already wired, free, OSS, Apache-2.0)
- `scipy.stats` (Python) or `simple-statistics` (npm) — KS test for distribution drift (free, OSS)
- CloudWatch Custom Metrics + Dashboards — drift visualization (already in use; AWS free tier covers 10 custom metrics + 3 dashboards, well within scope)
- CloudWatch Logs Insights — drift query history (free for retained logs)
- Recce CLI (recce.com) — dbt-aware diff (free OSS CLI; Cloud tier paid, skip Cloud)
- **Skipped:** Great Expectations / Soda Core (free OSS but redundant with `dbt-expectations`); Datadog ($15+/host/mo, paid); Grafana Cloud ($0 free tier 50GB but heavyweight setup vs CloudWatch)

### Research basis

- Fowler, M. (2004). "StranglerFigApplication." martinfowler.com — incremental rewrite pattern
- Stripe Engineering (2017). "Online migrations at scale." stripe.com/blog/online-migrations
- Google SRE (2016). *Site Reliability Engineering*. Ch. 3 (error budgets), Ch. 17 (testing for reliability)
- Beyer, Jones, et al (2018). *The Site Reliability Workbook*. — practical SRE patterns
- Kniberg, H. (2014). *Lean from the Trenches*. — Spotify-style canary releases

---

## Phase F — DuckDB-WASM Browser Scaffold

### Why it has standards
WebAssembly is new enough that the fastest paths through web.dev / MDN haven't been internalized everywhere. Wrong COEP/COOP setup = no SharedArrayBuffer = no DuckDB threading = orders-of-magnitude slowdowns.

### Industry-standard practices

| Practice | Source | Concrete application |
|---|---|---|
| **COEP / COOP / CORP headers** for SharedArrayBuffer | web.dev/coop-coep | Required for WASM threads in DuckDB-WASM 1.30+ |
| **Lazy / dynamic imports** for WASM | webpack docs; Next.js dynamic | DuckDB-WASM bundle (~5MB) loaded only on Phoenix routes |
| **Service Worker caching** for WASM bundle | web.dev/service-workers-cache-api | DuckDB-WASM cached; avoids re-downloading 5MB on every nav |
| **HTTP range requests** on Parquet | Apache Arrow / DuckDB docs | Don't fetch whole file; DuckDB pulls only needed column chunks |
| **Brotli compression** for Parquet | RFC 7932 | Server `Content-Encoding: br` for 20-30% smaller transfer |
| **CDN caching with long TTL + content-hash** | Vercel / CloudFront | Marts versioned: `metro/market_pulse-{hash}.parquet` |
| **Web Worker for DuckDB queries** | DuckDB-WASM docs | Keep main thread responsive; queries off-main-thread |
| **Feature flag + progressive rollout** | Newman *Building Microservices* Ch. 11 | `NEXT_PUBLIC_USE_DUCKDB_WASM` per-environment via Vercel Edge Config (free) |
| **Graceful degradation** | Aaron Gustafson 2008 | If DuckDB-WASM fails, fall back to RDS path silently |
| **Performance budget enforcement** | web.dev | LCP < 2.5s on 4G; first paint not regressed |
| **Source maps for WASM** | DWARF debugging | Production-grade error reports |

### Quality gates

- [ ] COEP / COOP / CORP headers present (verify with curl)
- [ ] DuckDB-WASM bundle ≤ 5.5MB compressed
- [ ] Bundle loads only on Phoenix routes (verify webpack-bundle-analyzer)
- [ ] Service worker caches WASM successfully (DevTools Application tab)
- [ ] First Parquet fetch <500ms warm; <2s cold
- [ ] Query execution <300ms p99 on Overview tab
- [ ] Worker isolation: queries don't block main thread (DevTools Performance tab)
- [ ] Lighthouse mobile 4G ≥ 90 in all 4 categories
- [ ] LCP no regression vs RDS-served version
- [ ] Feature flag toggles cleanly: 0 → 100% → 0% with no stale state
- [ ] KPI parity within rounding error vs RDS-served version
- [ ] Network panel: HTTP range requests visible, not whole-file fetches
- [ ] Sentry / error reporting: WASM stack traces include source maps

### Anti-patterns

| Smell | Why bad |
|---|---|
| Loading DuckDB-WASM on every page (incl /listings) | 5MB on landing kills mobile LCP |
| Fetching whole Parquet file (no range support) | Defeats DuckDB-WASM's main perf win |
| Running queries on main thread | Janks scroll/click during 200ms aggregation |
| No service worker → re-download on every nav | Wastes mobile data, adds latency |
| Server returning Parquet as `text/plain` | DuckDB needs `application/octet-stream` or specific MIME |
| `Cache-Control: no-cache` on versioned Parquet files | Breaks CDN; you want long TTL on hashed URLs |
| Feature flag flip without monitoring window | Flag is the rollout — needs SLI dashboard |
| Hard-coded mart paths in client | Marts move; abstract behind a manifest file |

### Tooling (all free)

- DuckDB-WASM 1.30+ — free, OSS, MIT
- `@duckdb/duckdb-wasm` npm package — free
- Webpack 5 / Next.js dynamic imports — free, already in repo
- Service Worker with `workbox` — free, OSS, MIT
- `@next/bundle-analyzer` — verify lazy loading (free, OSS)
- Lighthouse CI for budget enforcement — free (added in Phase B)
- `@sentry/nextjs` — browser error reporting + source maps (**free tier 5K events/mo**; use 10% sampling + inbound filters per Free Tier Discipline below)
- WebPageTest — real-device throttled testing (free public instance at webpagetest.org)

### Research basis

- Mozilla MDN. "WebAssembly." Section on threads, memory, isolation.
- Google web.dev. "Cross Origin Embedder Policy." Required for SharedArrayBuffer post-Spectre.
- Newman, S. (2021). *Building Microservices (2nd ed)*. Ch. 11 — feature flags + canary patterns.
- DuckDB Foundation (2024). "DuckDB-WASM Documentation." duckdb.org/docs/api/wasm.
- Apache Arrow. "Parquet Format Specification." For HTTP range optimization.

---

## Phase G — Full Dashboard Cutover

### Why it has standards
Cutovers fail by going too fast or too slow. Going fast: customers see broken pages; ARMLS audit fires. Going slow: the parallel cost compounds + drift accumulates. Google SRE's error budgets + canary release patterns formalize the right pace.

### Industry-standard practices

| Practice | Source | Concrete application |
|---|---|---|
| **Canary releases (1% → 10% → 50% → 100%)** | Sam Newman; Netflix Spinnaker | `NEXT_PUBLIC_USE_DUCKDB_WASM_PERCENT` env var; gradual ramp |
| **Error budgets** | Google SRE Ch. 4 | If error rate spikes >budget during ramp, halt + rollback |
| **SLI dashboard during rollout** | Google SRE | Latency p99, error rate, parity drift, business KPIs |
| **Halt-and-revert criteria** documented before rollout | Google SRE; SRE Workbook Ch. 16 | Specific thresholds; not "we'll know it when we see it" |
| **Per-route gradual rollout** | Newman *Building Microservices* Ch. 7 | One tab at a time via Vercel Edge Config, not whole app at once |
| **A/B-style parity verification** | Google's Ch. 14 testing | For 5% of traffic, render both paths and compare |
| **Sticky bucketing on user identity** | Newman *Building Microservices* Ch. 11 | A user gets the same path consistently — implement via cookie hash + Vercel Edge Config |
| **Blue-green for the underlying Lambda** | Martin Fowler 2010 | Two stable Lambda versions; flag chooses |
| **Postmortem culture (blameless)** | Google SRE Ch. 15 | Any rollback = postmortem within 48h |
| **Communication plan** | Atlassian SRE handbook (free read) | Internal `/admin/parity` doc; email Yong directly at each ramp step |

### Quality gates per ramp step

- [ ] All 9 mart/MV pairs <1% drift for 14 days before any 100% cutover
- [ ] Error rate at current % no higher than baseline
- [ ] Latency p99 no regression vs RDS path
- [ ] No Sentry error spike (>2σ above baseline)
- [ ] No customer-reported visual bug in last 7 days
- [ ] Lighthouse score holds ≥90 at every traffic %
- [ ] Manual smoke against the live site at each step
- [ ] Rollback rehearsed (set flag back to 0%, confirm reverts cleanly)
- [ ] On-call rotation aware of the ramp window

### Anti-patterns

| Smell | Why bad |
|---|---|
| Cutover during an ARMLS audit window | Compounds risk; audit failure = $21K |
| 0% → 100% flip without intermediate steps | Can't catch regressions until everyone's broken |
| Cutover Friday afternoon | Nobody to fix it; "Read-Only Friday" exists for a reason |
| No rollback plan documented | Panic rollback is bad rollback |
| Skipping the 14-day soak because "looks fine" | The whole point is patience |
| Cutting over without Yong's awareness | He's the customer; needs to know the timeline |
| Lighting up a flag and walking away | Active monitoring during ramp, not fire-and-forget |

### Tooling (all free)

- Vercel Edge Config — feature flag percentage (free, included with Vercel)
- `@sentry/nextjs` — browser error reporting (**free tier 5K events/mo**; sampling required — see Free Tier Discipline)
- CloudWatch Custom Metrics + Alarms — multi-source SLI dashboard (already in use; AWS free tier sufficient)
- CloudWatch Synthetics — uptime canaries (**free tier: 100 canary runs/mo** — one canary at 1/hour fits)
- SNS → email — on-call notification (already in use, free)
- Internal status doc in `/admin/parity` (built in Phase E) — status communication
- GitHub Issues — postmortem tracker (free)
- **Skipped (paid):** LaunchDarkly ($/seat); Split ($/seat); Statsig (free tier exists but Vercel Edge Config covers our needs); PagerDuty ($21/user/mo); StatusPage.io ($29/mo); Datadog ($15+/host/mo)

### Research basis

- Google SRE (2016). *Site Reliability Engineering*. Ch. 3 (error budgets), Ch. 4 (SLOs), Ch. 14 (testing), Ch. 15 (postmortems)
- Newman, S. (2015). *Building Microservices*. Ch. 7 (release patterns)
- Humble, J. & Farley, D. (2010). *Continuous Delivery*. — deployment pipeline foundations
- Forsgren, Humble, Kim (2018). *Accelerate*. — small batch / canary releases as performance predictor
- Allspaw, J. & Hammond, P. (2009). "10+ Deploys per Day." Velocity Conf — original DevOps argument

---

## Phase H — RDS Shrink + Operations

### Why it has standards
Phase H.1 is destructive and irreversible without backup. Phase H.2 is "the part everyone skips" — and as a result, future-Joey can't debug the system. SRE book + ADR pattern fix this.

### Industry-standard practices — H.1 (RDS Shrink)

| Practice | Source | Concrete application |
|---|---|---|
| **Pre-destructive snapshot** | AWS RDS docs; SRE book | `aws rds create-db-snapshot` BEFORE any DROP MV |
| **Maintenance window scheduled** | AWS docs; Atlassian incident comms | Notify Yong; do during low-traffic hours |
| **Rollback rehearsal** | Stripe migration playbook | Test snapshot restore in a separate env first |
| **Stripe-style multi-step migration** | Stripe Online Migrations 2017 | (1) dual-write, (2) backfill, (3) dual-read, (4) drop old |
| **Vacuum + analyze post-drop** | PostgreSQL docs | Reclaim space, refresh planner stats |
| **Instance class downsize during low traffic** | AWS RDS docs | t3.medium → t3.micro means brief downtime ~5 min |
| **Cost validation post-shrink** | FinOps Foundation | AWS Cost Explorer review at 7-day mark |
| **Monitoring continues post-shrink** | Google SRE | New baseline; watch for sustained CPU >70% |
| **Reversibility test** | DR drill culture | Practice the "we shrunk too much, restore" flow first |

### Quality gates — H.1

- [ ] RDS snapshot created and snapshot ID recorded
- [ ] Snapshot restore tested in a dev/stage env successfully
- [ ] Yong notified of maintenance window 48h+ in advance
- [ ] On-call awareness during the window
- [ ] DROP MV statements run inside a transaction (commit only after all 9)
- [ ] `VACUUM FULL` completes; reclaimed disk visible in AWS metrics
- [ ] Instance modify completes without data loss
- [ ] Premium-site builds + serves with zero RDS-MV imports
- [ ] Lighthouse + parity dashboard green for 7 consecutive days post-shrink
- [ ] Cost Explorer shows new line-item ≤ $20/mo within 14 days

### Industry-standard practices — H.2 (Operations + Docs)

| Practice | Source | Concrete application |
|---|---|---|
| **Architecture Decision Records (ADRs)** | Michael Nygard 2011 | One ADR per architecturally-significant choice in this rollout |
| **Runbooks per common operation** | Google SRE Ch. 27 | "Rerun dbt manually," "Roll back to RDS," "Refresh active branch" |
| **Postmortem template ready** | Google SRE Ch. 15 | Available before incident, not after |
| **C4 model for architecture diagrams** | Simon Brown | Context → Container → Component → Code |
| **MkDocs / Docusaurus for hosted docs** | (if needed) | Make docs discoverable beyond the repo |
| **Onboarding doc for future engineer** | Google "Site Reliability Engineering" | "Day 1 / Week 1 / Month 1" for someone new |
| **DECISIONS.md never deletes, only supersedes** | ADR convention | History matters for context |
| **CHANGELOG.md, newest at top** | Keep a Changelog (keepachangelog.com) | Version-spans, not commit-spans |
| **Disaster recovery drill cadence** | NIST SP 800-34 | Quarterly: simulate ARMLS feed loss, RDS failure, Lambda outage |

### Quality gates — H.2

- [ ] `docs/runbook-analytics.md` exists with 5+ runbooks
- [ ] `docs/DECISIONS.md` has new ADRs for: dbt-on-Lambda, DuckDB-WASM, parity threshold, RDS shrink, monitoring strategy
- [ ] `docs/ARCHITECTURE.md` updated with new C4 diagram; RDS-MV section deprecated, not deleted
- [ ] `docs/PROJECT.md` reflects roadmap completion
- [ ] `docs/CHANGELOG.md` has entries for every shipped phase
- [ ] Postmortem template at `docs/incident/postmortem-template.md`
- [ ] DR drill scheduled within 30 days of completion
- [ ] Future-Joey acceptance test: open `docs/runbook-analytics.md`, find an answer to "rerun yesterday's dbt run" without grep

### Anti-patterns

| Smell | Why bad |
|---|---|
| Skipping the snapshot "because we're confident" | One typo in `DROP MATERIALIZED VIEW` = irrecoverable loss |
| Rollback never rehearsed | First rehearsal during real incident = panic |
| Runbook is "ssh in and figure it out" | Future-Joey at 3am can't figure it out |
| ADRs that say "we decided X" without WHY or alternatives | Useless for future context |
| Docs hosted only in the repo, not searchable | Devs grep instead of read; drift accelerates |
| Monolithic ARCHITECTURE.md | Becomes stale immediately; split per concern |
| No DR drill cadence | "We have backups" → never tested → no backup |

### Tooling (all free)

- AWS RDS automated backups — verify retention (free for our volume; default 7-day retention)
- ADR Tools (`npm install -g adr-tools`) — free OSS CLI for scaffolding ADRs
- C4-PlantUML — architecture diagrams as code (free, OSS, MIT) — chosen over Structurizr (Lite is free, Cloud is paid)
- MkDocs Material — docs site (free, OSS, MIT)
- **Skipped (paid):** Better Uptime ($18+/mo), StatusPage.io ($29+/mo) — CloudWatch + internal `/admin/parity` doc cover this
- **Skipped (free but heavy):** Backstage (free OSS but multi-week ops investment for a solo project; revisit if team grows)

### Research basis

- Google SRE (2016). *Site Reliability Engineering*. Ch. 15 (postmortems), Ch. 27 (reliable product launches), Ch. 28 (engineering culture)
- Nygard, Michael (2011). "Documenting Architecture Decisions." cognitect.com — ADR pattern origin
- Brown, Simon (2018). *The C4 Model for Visualising Software Architecture*. c4model.com
- NIST (2018). SP 800-34 Rev. 1. *Contingency Planning Guide for Federal Information Systems*. — DR drill cadence
- DAMA International (2017). *DAMA-DMBOK: Data Management Body of Knowledge (2nd ed)*. — operational data governance
- "Keep a Changelog" project. keepachangelog.com — version history conventions
- Reis & Housley (2022). *Fundamentals of Data Engineering*. Ch. 11 (governance, security, privacy)

---

## Cross-cutting practices (every phase)

These run across every phase. List them once.

### Continuous delivery hygiene

- **Trunk-based development** (DORA): short-lived branches off main
- **Each PR does one thing**: <400 LOC, single concern
- **CI green = merge eligible**: no manual override
- **Squash merge for feature branches; merge for release branches**
- **Failed deploy = automatic rollback**: not manual

### Observability triad (logs / metrics / traces)

- **Structured logs** (JSON) into CloudWatch with correlation IDs
- **RED metrics per service**: Rate, Errors, Duration (Tom Wilkie)
- **USE metrics per resource**: Utilization, Saturation, Errors (Brendan Gregg)
- **Distributed tracing** for cross-service requests (OpenTelemetry)
- **One alert per SLI** — not 50 alerts on 50 metrics

### Security

- **Least-privilege IAM** at every Lambda + every IAM role
- **Secrets Manager** for any token, password, key — never in env vars
- **IAM Access Analyzer** weekly to find unused permissions
- **Pre-commit secret scanning** (gitleaks, truffleHog)
- **HTTPS-only** for every public endpoint (already on Vercel)
- **CSP + security headers** per `CLAUDE.md` §4.7
- **Dependency audit** weekly (`pnpm audit`)

### Cost discipline

- **AWS Cost Explorer review** weekly during rollout (free)
- **Tagged resources** (`Project: rlsir`, `Phase: lakehouse-cutover`) for cost attribution
- **CloudWatch Logs retention** ≤ 30 days unless retained for compliance
- **Lambda right-sizing** post-stable: reduce memory if utilization <50%
- **Sentry free-tier discipline** — see Free Tier Discipline section below
- **AWS Budgets** — configure $20/mo alarm threshold (free; sends to existing SNS topic)

### Compliance (ARMLS-specific)

- **Mirror is read-only** — every change verified pre-deploy
- **Attribution preserved** — automated test against any IDX surface
- **No deletions of MLS data** — only `display_block` flag on Silver views
- **Sync recency ≤ 12h** — alarm verified per the bi-weekly probe
- **No fallback to thin data** (`sample_count < 20`) — every KPI uses `getConfidence()`
- See `.claude/skills/rlsir-recursive-improvement/SKILL.md` for the full prime-directive list

---

## Free Tier Discipline

The plan stays free as long as we respect the limits below. Each external service has a hard discipline that keeps us under the free threshold. Add a CloudWatch alarm or a manual weekly check for any service that approaches 80% of its free-tier ceiling.

### Sentry (free tier: 5K errors / mo, 10K performance events / mo)

Without discipline, a single client error in a render loop emits hundreds of events per visitor.

**Rules:**
- `tracesSampleRate: 0.1` (10% performance sampling)
- `replaysOnErrorSampleRate: 0.0` (no session replay — paid feature anyway)
- `replaysSessionSampleRate: 0.0`
- `beforeSend` filter — drop:
  - `ResizeObserver loop limit exceeded` (browser noise)
  - errors from `chrome-extension://` and `moz-extension://` URLs
  - errors with `status: 401` (auth failures, separate concern)
- Inbound filters in Sentry UI: legacy browsers, web crawlers, common health-check user agents
- Weekly check: Sentry dashboard event count — alert if monthly total exceeds 4K

**Math:** Yong's site at ~500 sessions/day × 30 days × 1% error rate = ~150 errors/mo without sampling. With 10% sampling and noise filters, well under 5K.

### CloudWatch Synthetics (free tier: 100 canary runs / mo)

**Rules:**
- One canary, hourly = ~720/mo. **Hourly is over-budget.**
- Use one canary at every 8 hours = 90/mo (safe under 100)
- Or: skip Synthetics entirely; rely on the existing 4-hour ARMLS sync alarm + parity dashboard

**Recommendation:** skip Synthetics until something fails that wouldn't have been caught by existing alarms.

**Rules:**
- 30-day retention on every log group (`aws logs put-retention-policy --retention-in-days 30`)
- Suppress Lambda Power Tools `INFO` logs in production; emit only `WARN` and `ERROR`
- Drop verbose `httpx` / `boto3` debug logs at the root logger level

**Math:** 4 Lambdas × ~50 MB/mo = ~200 MB/mo ingest = $0.10/mo. Storage with 30-day retention is bounded at ~200 MB = $0.006/mo. Negligible.

### CloudWatch Custom Metrics (NOT free — 12-month free tier expired)

**Honest correction:** AWS free tier of 10 custom metrics is **12-month-only**. We're past that window. Custom metrics now cost **$0.30/metric-month** for the first 10K.

**Audit (verified 2026-05-04):**
- Current count in `RLSIR/DataPipeline`: **23 unique metrics** (~$6.90/mo today)
- Adding Phase D-G metrics (latency p99, error rate, freshness, 9 parity-drift, dbt_models_failed) = +13 = 36 total = ~$10.80/mo

**Rules going forward:**
- Use **dimensions** instead of new metric names (one metric `ParityDelta` with `MartName` dimension counts as 1, not 9)
- Consolidate `ArmlsParquet*` family — many are duplicates
- Drop unused metrics quarterly via `aws cloudwatch delete-metric-stream` (cosmetic — they age out at 15 months automatically)
- Hard ceiling: **40 metrics** (~$12/mo) — beyond that, justify in an ADR

### CloudWatch Logs (free tier: 5 GB ingest first 12 mo only, then $0.50/GB)

**Honest correction:** Free tier expired. Log ingest now costs $0.50/GB; storage $0.03/GB/mo.

**Audit (verified 2026-05-04):**
- 4 Lambda log groups, total stored ~3 MB (~$0/mo cost today)
- 3 of 4 log groups have **NO retention set** (logs kept forever)
- Only `rlsir-armls-sync` has 30-day retention

### Vercel (free Hobby tier limits)

- 100 GB bandwidth/mo (Yong's traffic well under)
- 1000 build minutes/mo (CI builds well under)
- 12 serverless function regions (1 used)
- **Risk:** Hobby tier prohibits commercial use. Verify Yong's site terms — may need Pro ($20/mo) eventually. Out of scope for this plan; flag in Phase H ADR.

### GitHub Actions (free tier: 2,000 minutes/mo on private repos)

- Each CI run ~5 min × ~30 PRs/mo = ~150 minutes — well under
- Lighthouse CI adds ~3 min × 30 = 90 minutes — still under
- **Total budget:** ~250 min/mo, 12% of free tier

### AWS Lambda free tier

- 1M requests/mo + 400,000 GB-seconds/mo
- New `rlsir-analytics-dbt` at hourly rate(1h) = 720 invocations/mo at 1024MB × 300s = 220K GB-s — well within budget
- Existing Lambdas combined: ~75K GB-s/mo

### S3 free tier (12 months only — already past)

We're past the 12-month free tier window. Costs are real but tiny:
- Storage: 500 MB Parquet × $0.023/GB = $0.01/mo
- GET requests: ~10K/mo × $0.0004/1K = $0.004/mo
- PUT requests: ~3K/mo × $0.005/1K = $0.015/mo

**Total: ~$0.03/mo for S3** — effectively free.

### Cost & Headroom Summary (verified 2026-05-04)

| Service | Free tier | Our usage | Cost today |
|---|---|---|---|
| Sentry events | 5K/mo | 0 (not installed) | $0 |
| CloudWatch Logs ingest | (expired) | ~200 MB/mo | $0.10/mo |
| CloudWatch Custom Metrics | (expired) | 23 metrics | **$6.90/mo** |
| CloudWatch Synthetics | 100 runs/mo | 0 (skipped) | $0 |
| CloudWatch Alarms | (expired) | 8 alarms | $0.80/mo |
| GitHub Actions | 2K min/mo | ~250 | $0 |
| Lambda compute | 400K GB-s/mo | ~300K | $0 |
| Lambda invocations | 1M/mo | ~3K | $0 |
| Vercel Hobby | 100 GB bandwidth | ~10 GB | $0 |
| RDS db.t3.medium | — | continuous | $66/mo (until Phase H) |
| S3 storage | — | ~500 MB | $0.03/mo |
| **Total new spend from this rollout** | | | **~$8/mo** |

**Reality check:** We can't get to literal $0 without dropping CloudWatch entirely. The discipline is keeping incremental cost <$10/mo. The big-ticket cost ($66 RDS) drops in Phase H.

**Bottleneck:** custom metrics — adding more = directly adds to bill. Use dimensions, not new metric names.

---

## Anti-pattern Hall of Fame (across all phases)

| Anti-pattern | Phase | Why catastrophic |
|---|---|---|
| `--no-verify` on a commit hook | A | Defeats lint/type-check gates; CI catches it later, but PR review window already wasted |
| Mocking the function under test | B | Tests prove nothing |
| Mocking the database in integration tests | C | "Mocked tests passed but prod migration failed last quarter" |
| `UPDATE listing_records SET …` | C, D, E | Violates ARMLS license — instant audit failure |
| ECR image with `latest` tag in production | D | Can't roll back to a known image |
| Reconciliation that compares only row counts | E | Misses semantic drift |
| Loading 5MB WASM on landing pages | F | Tanks mobile LCP, fails Lighthouse |
| Cutover Friday afternoon | G | Nobody to fix it Saturday morning |
| `DROP MATERIALIZED VIEW` without snapshot | H.1 | Irrecoverable; the whole reason snapshots exist |
| Runbook that says "figure it out" | H.2 | Future-Joey at 3am can't figure it out |

---

## Definition of "best-practice compliant"

For each phase to be considered best-practice compliant:

1. **Every Quality Gate** in that phase passes before merge
2. **No Anti-pattern** in that phase appears in the diff
3. **At least one Research-Basis citation** is referenced in the PR description (proves you read the relevant practice)
4. **Tooling list** is honored — if the practice has a recommended tool and you skip it, justify in the PR

---

## References (master list)

### Books
- Forsgren, Humble, Kim (2018). *Accelerate*.
- Beyer, Jones, Petoff, Murphy, Eds. (2016). *Site Reliability Engineering*. O'Reilly.
- Beyer, Murphy, Rensin, Kawahara, Thorne, Eds. (2018). *The Site Reliability Workbook*. O'Reilly.
- Newman, Sam (2021). *Building Microservices (2nd ed)*. O'Reilly.
- Humble & Farley (2010). *Continuous Delivery*. Addison-Wesley.
- Kimball & Ross (2013). *The Data Warehouse Toolkit (3rd ed)*. Wiley.
- Reis & Housley (2022). *Fundamentals of Data Engineering*. O'Reilly.
- Frost, Brad (2016). *Atomic Design*.
- Krug, Steve (2014). *Don't Make Me Think*.
- Norman, Don (2013). *The Design of Everyday Things*.
- DAMA International (2017). *DAMA-DMBOK (2nd ed)*.
- Brown, Simon (2018). *The C4 Model*.

### Foundational papers / posts
- Cunningham, Ward (1992). "The WyCash Portfolio Management System." OOPSLA 1992. — tech debt original metaphor
- Fowler, Martin (2003). "Tech Debt Quadrant." martinfowler.com
- Fowler, Martin (2004). "StranglerFigApplication." martinfowler.com
- Allspaw, J. & Hammond, P. (2009). "10+ Deploys per Day." Velocity 2009
- Beauchemin, Maxime (2017). "Functional Data Engineering." Medium
- Stripe Engineering (2017). "Online migrations at scale." stripe.com/blog
- Heroku (2011). *The Twelve-Factor App*. 12factor.net
- Nygard, Michael (2011). "Documenting Architecture Decisions." cognitect.com
- Wilkie, Tom (2018). "The RED Method." weave.works/blog
- Gregg, Brendan (2013). "USE Method." brendangregg.com

### Industry / standards bodies
- AWS Well-Architected Framework (2023)
- Google SRE (Search "Google SRE Book" or sre.google)
- DORA / Google Cloud "State of DevOps" reports (2014–2024)
- W3C Design Tokens Community Group (DTCG)
- WCAG 2.2 (W3C, 2023)
- web.dev / Core Web Vitals (Google, ongoing)
- NIST SP 800-34 (Contingency Planning)
- CIS Benchmarks (cisecurity.org)

### Project-specific
- `.claude/skills/rlsir-recursive-improvement/SKILL.md` — the loop + ARMLS prime directives
- `CLAUDE.md` (repo root) — engineering standards
- `docs/superpowers/plans/2026-05-04-comprehensive-roadmap.md` — phasing companion to this doc

---

**End of best-practices document.**
