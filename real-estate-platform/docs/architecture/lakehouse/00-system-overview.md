# Lakehouse System Overview

**Date:** 2026-04-30
**Owner:** Joey Schnepel
**Status:** Architecture spec — supersedes ad-hoc orchestration. Implementation roadmap in `07-roadmap.md`.
**Audience:** future-Joey, anyone onboarding to RLSIR analytics, ARMLS auditors.

---

## 1. What this system does

Two analytical domains served by one lakehouse:

| Domain | Sources | Consumers |
|---|---|---|
| **MLS analytics** (closed/active listings, change events) | ARMLS Spark API (1.85M listings, 3.5M change events) | `apps/premium-site` Phoenix dashboard, market reports, listing detail sidebars |
| **Yong2 leads + behavioral** (events, sessions, leads) | Browser `/api/track`, `/api/contact`, RDS `leads.*` snapshots | `/admin/metrics` admin dashboard, marketing ROI reports |

Both domains share Bronze (S3) → Silver (dbt + DuckDB) → Gold (Parquet on S3) → Browser (DuckDB-WASM). Operational data (lead transactions, campaign masters) stays in RDS Postgres.

## 2. Architecture in one picture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SOURCES                                                                │
│  ARMLS Spark API     Browser /api/track     /api/contact     leads.*   │
│  (RESO replication)  (events)               (form submit)    (PG)      │
└────────┬─────────────────┬───────────────────────┬───────────────┬─────┘
         │                 │                       │               │
         ▼                 ▼                       ▼               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  BRONZE — S3 (NDJSON.gz, append-only, Hive partitioned)                 │
│  bronze/listings/sync_year=YYYY/sync_month=MM/...                       │
│  bronze/active_snapshot/current/page_*.ndjson.gz                        │
│  bronze/change_log/...                                                  │
│  bronze/yong2/events/sync_year=YYYY/sync_month=MM/...                   │
│  bronze/yong2/leads/sync_year=YYYY/sync_month=MM/snapshot.parquet       │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ORCHESTRATOR — Dagster                                                 │
│    Sensors:  s3-object-landed (bronze writes)                           │
│    Schedules: hourly (active marts), 4-hourly (closed marts), nightly  │
│    Asset graph: dbt models registered as Dagster assets via dagster-dbt │
│    Partitions: time-series (monthly for closed, daily for events)       │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SILVER + GOLD — dbt + DuckDB                                           │
│  models/staging/   stg_armls__*, stg_yong2__*  (table; one bronze scan) │
│  models/intermediate/  int_*  (incremental, merge strategy)             │
│  models/marts/  fct_*, dim_*  (external Parquet on S3)                  │
│                                                                         │
│  Built by Lambda container (rlsir-analytics-dbt) on Dagster trigger     │
│  Output: s3://.../analytics/{domain}/{mart}.parquet (zstd)              │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  CONSUMPTION                                                            │
│   apps/premium-site/phoenix/  → fetch Parquet, query via DuckDB-WASM    │
│   apps/premium-site/admin/metrics → fetch yong2 marts, DuckDB-WASM      │
│   ad-hoc analyst queries → DuckDB CLI on local file or S3 directly      │
└─────────────────────────────────────────────────────────────────────────┘

OPERATIONAL TIER (parallel, not in lakehouse):
   RDS Postgres (t3.micro after shrink) —
     leads.*, marketing.campaigns, marketing.campaign_spend, audit.*
     ARMLS mirror (read-only per license — listing_records, listing_change_log, etc.)
```

## 3. Design principles

1. **One pipeline per medallion layer**: bronze writes are fan-in (multiple sources), silver/gold transforms are fan-out (one dbt project). No silver-to-bronze references.
2. **Append-only bronze, immutable history**: every row carries `sync_run_id` + `sync_observed_at`. Replays are partition re-scans, never overwrites.
3. **dbt is the only transformation language**: staging, intermediate, marts. No SQL outside dbt; no Python outside Dagster ops/sensors.
4. **DuckDB everywhere**: build target (dbt), query layer (browser via WASM, ad-hoc Lambda on S3), CLI (analyst). One engine, one SQL dialect, one performance tuning.
5. **Dagster is data-aware orchestration**: the asset graph IS the system. No DAG defined twice (in dbt + in Airflow).
6. **Operational data stays in PG**: leads, lifecycle, audit. Analytics never writes to PG. PG never writes to S3 except via the nightly CDC Lambda.
7. **Browser is a thin client**: SSR fetches Parquet, hydrates DuckDB-WASM, queries client-side. Zero round-trips after initial load.
8. **ARMLS license respected**: mirror tables (`listing_records` etc.) are read-only per license. Cleanup happens in derived layers (`silver_*`, `mv_*`, side tables).
9. **Observability before launch**: every Lambda emits CloudWatch metrics. Every dbt run is observable in Dagster UI. Every consumer alarm is wired before cutover.
10. **Rollback gates at every cutover**: feature flags, snapshot-before-drop, append-only bronze, Dagster's run history.

## 4. Document map

| # | Doc | What it covers |
|---|---|---|
| 00 | `00-system-overview.md` | This document |
| 01 | `01-storage-schema.md` | S3 layout, Parquet specs, RDS-resident tables, naming conventions |
| 02 | `02-bronze-ingest.md` | Lambdas (armls-sync, active-snapshot, yong2-events, leads-cdc), freshness contract, error handling |
| 03 | `03-dbt-project.md` | Project structure, model conventions, tests, exposures, dbt-bouncer rules |
| 04 | `04-duckdb-runtime.md` | Build target, ad-hoc Lambda, browser WASM, extensions, performance tuning |
| 05 | `05-dagster-orchestration.md` | Asset graph, sensors, schedules, partitions, deployment, dagster-dbt integration |
| 06 | `06-observability.md` | Metrics, alarms, parity reconcile, runbook, rollback |
| 07 | `07-roadmap.md` | Phasing, calendar, approval gates, risk register |

## 5. Cost model

| Component | Today | Target | Annual |
|---|---:|---:|---:|
| RDS Postgres | t3.medium $66/mo | t3.micro $20/mo | -$552 |
| S3 storage (bronze + analytics) | ~$2/mo | ~$5/mo (with new volumes) | +$36 |
| Lambda runtime (sync + analytics + reconcile) | ~$1/mo | ~$3/mo | +$24 |
| CloudWatch metrics + logs | ~$2/mo | ~$3/mo | +$12 |
| Dagster Cloud (Hobby tier) | $0 | $0 (within 30k credit/mo limit) | $0 |
| Vercel (premium-site) | unchanged | unchanged | $0 |
| **Net** | **~$71/mo** | **~$31/mo** | **−$480** |

Solo-agent scale: ~30k step runs/mo at 27 marts × hourly active + 4-hourly closed runs ≈ 19k credits used. Within Dagster Hobby. If Hobby is dropped or scale grows, fallback is self-hosted on ECS Fargate (~$25/mo).

## 6. Cutover risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| dbt mart and RDS MV produce different KPI numbers | High | High (audit credibility) | Phase 3 parallel-run with parity reconcile + 1% drift alarm; code audit before cutover |
| DuckDB-WASM bundle bloats premium-site by >2MB | Medium | Medium (Lighthouse drop) | Use EH bundle (~5MB), lazy-load on tab switch, measure pre/post |
| Dagster Hobby runs out of credits mid-month | Low | Medium (orchestration stops, sync halts) | Alarm on credit usage at 80%; fallback to ECS Fargate Dagster docker |
| Bronze writer regression silently writes empty files | Medium | High (analytics goes blank) | bronze-reconcile + smoke harness already in place; `_freshness.json` mtime monitoring |
| Spark API rate limit / dedup re-emerges | Medium | Medium (partial walks) | $orderby + 2.5s throttle + reservedConcurrency=1 + Maricopa filter (already shipped) |
| RDS shrink corrupts MVs | Low | High (rollback to t3.medium needed) | Snapshot before drop; instance modify is reversible; phased: code-update → MV drop → instance modify |

## 7. What this replaces

- **EventBridge cron orchestration** for analytics → Dagster sensors + schedules
- **PG materialized views** for dashboard KPIs → dbt Parquet marts
- **RDS-as-analytics-DB** → S3 + DuckDB. RDS becomes operational-only.
- **Manual ad-hoc query work** → Dagster asset materializations + browser-side drill-downs
- **Two separate plans (yong2 leads + listings)** → one lakehouse with two domains

## 8. Out of scope (explicit non-goals)

- Real-time / sub-minute dashboards (Parquet+DuckDB-WASM is hourly-fresh by design)
- ML predictive lead scoring (deterministic rubric is enough at solo-agent volume)
- Cross-domain identity stitching beyond `email_hash`
- Server-side ad-platform CAPI (Meta CAPI, Google Enhanced Conversions)
- A custom BI tool (Metabase/Superset). Browser DuckDB-WASM serves both Yong's site and admin metrics.
- Multi-tenant — a `tenant_id` column would need to thread through every model. Defer until there's a second tenant.
