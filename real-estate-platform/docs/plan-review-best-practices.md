# Plan Review — Best Practices Cross-Reference

**Date:** 2026-04-29
**Status:** Review complete; recommendations at end
**Companion docs:** `analytics-comprehensive-plan.md` (master), `bronze-migration-build-path.md` (migration), `closed-listings-etl-strategy.md` (analytics)

This document cross-references our plan against published industry best practices and 2026 production patterns. For each domain we align with, exceed, fall short on, or deliberately diverge from standard practice.

---

## §1 — Methodology

Searched for production patterns (2025–2026) on:
1. DuckDB-WASM as a production analytics dashboard engine
2. Browser-Parquet lazy loading patterns
3. MLS/RESO data lake architectures
4. Data quality and observability tooling (Great Expectations / Soda / Elementary / Monte Carlo)
5. Strangler-fig parallel-run migration validation
6. Bronze layer immutability + partitioning standards
7. dbt project structure conventions (staging/intermediate/marts)

Combined with the earlier research rounds for the migration plan and dbt project structure. Sources cited at end.

---

## §2 — Where our plan ALIGNS with industry standard

### §2.1 Replicate-and-serve architecture

**Industry standard (RESO/MLS):** "A replicate-and-serve approach ingests MLS data into your own storage, normalizes it, indexes it for search, and serves users from your system. This is the more common choice for serious PropTech products because it improves speed, supports advanced search, and enables analytics." — [GTC Systems / RESO compliance guide](https://gtcsys.com/fixing-mls-data-chaos-how-to-design-reso-compliant-real-estate-integrations/)

**Our plan:** Bronze captures every Spark replication response on S3. Silver normalizes to a canonical schema. Gold serves analytics. ✅ Direct alignment.

### §2.2 Bronze layer immutability + ingestion-time partitioning

**Industry standard (Microsoft Fabric, Databricks):** Bronze is append-only, partitioned by ingestion time, contains raw data with light parsing only. — [Microsoft Fabric Medallion Lakehouse Architecture](https://learn.microsoft.com/en-us/fabric/onelake/onelake-medallion-lakehouse-architecture)

**Our plan:** Bronze NDJSON.gz files immutable, partitioned by `sync_year/sync_month/sync_day/run_id`, no transformation beyond provenance stamping. ✅ Direct alignment.

### §2.3 Strangler-fig migration with parallel-run validation

**Industry standard (AWS Prescriptive Guidance):** "Run new and legacy systems alongside each other; cut over piece by piece; validate via row counts + checksums during the parallel-run window." — [AWS Strangler Fig Pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html)

**Our plan:** Phase 1 dual-write (Postgres + bronze), Phase 2 reconciliation (7-day window, row count + 64-bit summed-row hash), Phase 5 feature-flag page-by-page cutover, Phase 6 14-day soak before drop. ✅ Direct alignment.

### §2.4 dbt project structure (staging / intermediate / marts)

**Industry standard:** dbt Labs official guide. Staging is 1:1 with sources, materialized as views (or table for expensive scans). Intermediate organized by entity. Marts grouped by department, plural-noun fact names, surrogate keys via `dbt_utils.generate_surrogate_key`. — [dbt Developer Hub: How we structure our dbt projects](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview)

**Our plan:** Exactly this layout. Naming, grain documentation, surrogate keys (`market_pulse_id`, `closing_id`, etc.), exposures.yml documenting page→mart dependencies, dbt-bouncer enforcement of conventions. ✅ Direct alignment, with the explicit deviation that staging is `table` (not view) because S3 NDJSON dedup is expensive — this matches dbt-DuckDB recommendations for that specific case.

### §2.5 Calendar spine for monthly facts

**Industry standard:** Use a date dimension table to guarantee gap-free time series; "no data" months become explicit zero rows, not missing rows. Standard in Kimball-style dimensional modeling.

**Our plan:** `int_calendar` generates every month from 2011-01 → today+1; every monthly fact left-joins it. ✅ Direct alignment.

### §2.6 Microbatch / merge incremental for time-partitioned tables

**Industry standard (dbt 1.8+):** `incremental_strategy='microbatch'` with `event_time` + `batch_size` + `lookback` for late-arriving data. — [dbt Incremental Microbatch](https://docs.getdbt.com/docs/build/incremental-microbatch)

**Our plan:** Intermediate listings models use `incremental_strategy='merge'` with `unique_key='listing_key'` and a `source_modification_ts` watermark. We considered microbatch but chose merge because our late-arriving window is unpredictable (records modified weeks later via change_log). ✅ Aligned, with deliberate variant.

### §2.7 Sample-size + confidence bands on metrics

**Industry standard (statistical reporting):** Sample-size aware metrics; medians from <30 samples should carry an uncertainty signal.

**Our plan:** Every gold row has `sample_size` (integer) + `confidence` enum (`none/very_low/low/medium/high`). UI degrades on thin data. ✅ Aligned, slightly ahead of typical real-estate platforms (most don't expose this to users).

### §2.8 Reconciliation via row count + content checksum

**Industry standard:** "Use specific techniques like record counts and checksums to verify data integrity. Checksums or hash totals (e.g., SHA-256) help identify even minor discrepancies." — [Quinnox migration validation best practices](https://www.quinnox.com/blogs/data-migration-validation-best-practices/)

**Our plan:** `bronze-reconcile.ts` Lambda runs daily — DuckDB 64-bit `HASH()` summed over rows for per-day comparison. Cheaper than per-row SHA-256 and order-independent. ✅ Direct alignment with smart adaptation.

### §2.9 DuckDB-WASM for in-browser analytics

**Industry standard (2026):** "DuckDB WASM turns the browser into a surprisingly capable analytics edge, providing speed, privacy, and zero-ops for Parquet-shaped problems like quick filters, rollups, and small joins." — [Codastra (Medium, Apr 2026)](https://medium.com/@2nick2patel2/duckdb-in-the-browser-fast-parquet-at-the-edge-76a94863625e)

Active production case studies in 2026:
- Svelte 5 app loading historical NVIDIA stock data, real-time SQL in-browser — [Travis Horn](https://travishorn.com/high-performance-data-visualization-in-the-browser-with-duckdb-and-parquet/)
- MotherDuck's own UI uses DuckDB-WASM for client-side responsiveness — [MotherDuck blog](https://motherduck.com/blog/duckdb-wasm-in-browser/)
- Sparkgeo web-mapping with Parquet + DuckDB-WASM — [Sparkgeo](https://sparkgeo.com/blog/a-duckdb-wasm-web-mapping-experiment-with-parquet/)

**Our plan:** ~650 KB initial load (500 KB WASM + 100 KB metro Parquet + 50 KB regions scorecard), DuckDB-WASM for tab switches and drill-downs, lazy fetch by scope tier. ✅ Validated by 2026 production cases. Our shape is consistent with the recognized pattern.

### §2.10 4-hour replication cadence with cursor checkpointing

**Industry standard (RESO-Web-API consumers):** "Latency can drop from fifteen minutes to under sixty seconds where webhooks are available; otherwise polling at 1–4 hour cadence with `$skiptoken` cursor is standard." — [Realtyna RESO Web API guide](https://realtyna.com/blog/reso-web-api-work/)

**Our plan:** rate(1 h) for actives, rate(4 h) for full Property walk; `listing_sync_state` tracks `$skiptoken` for resumable sync. ✅ Aligned with polling-style RESO consumers.

### §2.11 Cost optimization via Parquet + DuckDB

**Industry standard:** "DuckDB and MotherDuck can cut cloud data warehouse costs by 70%." — [MotherDuck cost-reduction case](https://motherduck.com/learn/reduce-cloud-data-warehouse-costs-duckdb-motherduck/)

**Our plan:** $66/mo → $27/mo (-59%) by moving analytics off RDS. Same direction, comparable magnitude. ✅ Aligned.

---

## §3 — Where our plan EXCEEDS industry standard

### §3.1 Historical depth (14+ years)

**Industry typical:** Most MLS platforms keep 1–5 years of closed listings for analytics; older data archived or dropped.

**Our plan:** Full 14+ years from 2011-01 through present, with a one-shot Spark replication backfill recovering even the 22,914 records our current mirror is missing from 2019. The bronze NDJSON history grows unbounded (cheap on S3) and the silver fact filters as needed.

**Why we go deeper:** Historical context is the primary value we deliver vs. a competitor's "last 12 months" dashboard. A 14-year `fct_market_pulse` lets us show "this is the longest seasonal pattern on record" — a positioning advantage.

### §3.2 Cross-mart `months_of_supply` joining ACTIVE + CLOSED

**Industry typical:** Active analytics and closed analytics are usually separate features in MLS platforms; combining them into single inventory-pace metrics is rare.

**Our plan:** `fct_months_of_supply` joins `fct_active_inventory.active_count` to `fct_market_pulse` trailing-12mo close average, classifies the market (`strong_sellers / sellers / balanced / buyers / strong_buyers`). This is the most actionable single number a client/agent reads — we surface it as a first-class fact.

### §3.3 Buyer-side analytics

**Industry typical:** Most public-facing MLS analytics platforms surface only list-side data because buyer-side fields aren't always populated and IDX rules limit display. We confirmed `BuyerAgentFullName` and `BuyerOfficeName` are 100%-populated in Spark Property responses (sample of 50).

**Our plan:** First-class `fct_buyer_office` mart + `is_dual_representation` flag on `fct_closings`. Powers internal-only broker leaderboards.

### §3.4 Close-to-original ratio (true negotiation strength)

**Industry typical:** "% above asking" / "median sale-to-list ratio" — both compare close to FINAL list price, masking pre-close reductions.

**Our plan:** `fct_negotiation` exposes both the legacy metric AND `close_to_original_ratio` — derived from `listing_change_log`. Catches the "$1.2M reduced to $1M, closed at $1.05M" deal as the 12.5% original haircut it actually is, not the +5% the legacy metric suggests.

### §3.5 Per-row provenance and data-quality flags

**Industry typical:** Most analytics platforms don't surface per-row provenance.

**Our plan:** Every silver row carries `silver_run_id`, `silver_built_at`, `source_modification_ts`. Bronze rows carry `sync_run_id`, `sync_observed_at`. Reject quarantine includes `reject_reason`. Audits and IDX inspections are deterministic.

### §3.6 In-browser analytics for premium-site dashboard

**Industry typical:** Most real-estate dashboards render server-side with a 200–800 ms backend round-trip per interaction.

**Our plan:** SSR for first paint + SEO; DuckDB-WASM for every interaction after. Tab switches and segment toggles execute locally in <5 ms with zero network calls. This is bleeding-edge for our domain — only validated as production-ready in 2026 per the research above.

---

## §4 — Where we should ADD (gaps vs. best practice)

### §4.1 Elementary Data — dbt-native observability

**Gap:** We have dbt tests + dbt_expectations + CloudWatch alarms. We don't have automated anomaly detection, test-result history visualization, or dbt-native lineage alerts.

**Industry recommendation (2026):** "Elementary Data is the most-adopted dbt-native observability layer; complements dbt tests with anomaly detection and freshness monitoring without the cost of Monte Carlo." — [DataKitchen 2026 open-source landscape](https://datakitchen.io/the-2026-open-source-data-quality-and-data-observability-landscape/)

**Recommendation:** Add Elementary Data to the dbt project. Effort: ~half day. Cost: $0 (open-source). Adds:
- Test-result history (catches when a test starts failing intermittently)
- Anomaly detection on metric drift (catches when monthly closing volume drops unexpectedly even if no test fails)
- Slack/email alerts on test failures
- Auto-generated lineage graphs in HTML

Adopting it means installing the package, adding `on-run-end` hook to publish run results, and wiring an alert channel.

### §4.2 RESO Validation Expressions

**Gap:** Our silver cleaning rules are hand-coded against the data we observe. RESO 2.0+ supports machine-readable Validation Expressions exposed via the API (`$validation`).

**Industry recommendation:** "The RESO Validation Expressions feature provides machine-readable business rules baked into the API that allow platforms to automatically enforce data quality constraints at ingestion time." — [GTC Systems RESO compliance](https://gtcsys.com/fixing-mls-data-chaos-how-to-design-reso-compliant-real-estate-integrations/)

**Recommendation:** Probe whether the ARMLS Spark API exposes `$validation`. If yes, we could replace some of our hand-coded silver rules with auto-generated ones. Effort: ~1 day to probe + integrate. Risk: low (additive; doesn't replace our hand rules, augments them).

### §4.3 RESO EntityEvent webhooks for sub-minute freshness

**Gap:** We poll at rate(1 h) for actives. Latency is up to 1 hour for status changes to land in bronze.

**Industry recommendation:** "The RESO Web API's EntityEvent resource defines how MLSs can push change notifications, and some forward-thinking boards now support webhooks that fire in near real-time when listings are created, modified, or deleted. Where webhooks are available, they're the right choice for any data category that users interact with directly, with latency potentially dropping from fifteen minutes to under sixty seconds." — [Realtyna RESO Web API guide](https://realtyna.com/blog/reso-web-api-work/)

**Recommendation:** Probe whether ARMLS supports EntityEvent webhooks. If yes, /listings detail page renders could see <60 s freshness. **Defer to v2** — not blocking. The current 1-hour cadence already satisfies IDX 12-hour requirements with a 12× margin.

### §4.4 `parquet_metadata()` for instant preview before download

**Gap:** Our browser fetch always pulls the full Parquet. For users who only ever view the metro hero, the regions Parquet is wasted bandwidth.

**Industry recommendation:** "The parquet_metadata() function is particularly useful here as it avoids the need to download the entire Parquet file, significantly improving performance and reducing data transfer." — [MotherDuck DuckDB-WASM blog](https://motherduck.com/blog/duckdb-wasm-in-browser/)

**Recommendation:** Use `parquet_metadata()` in DuckDB-WASM to preview row counts + schema before deciding whether to download a slice. Lightweight optimization (~half day to implement); meaningful win on mobile.

### §4.5 DuckDB 1.3+ lazy column fetching

**Gap:** Our DuckDB-WASM version pin should target 1.3 or later for the lazy column fetch feature.

**Industry recommendation:** "DuckDB now defers fetching columns until absolutely necessary, resulting in 3–10x faster reads for queries with LIMIT." — [MotherDuck DuckDB 1.3 announcement](https://motherduck.com/blog/announcing-duckdb-13-on-motherduck-cdw/)

**Recommendation:** Pin `@duckdb/duckdb-wasm` to a version that wraps DuckDB ≥1.3. Already documented in the comprehensive plan as "version pin in `package.json`" but should explicitly target ≥1.3 for the lazy-column benefit. Trivial.

### §4.6 OLAP cache for repeated queries

**Gap:** Browser hits the same Parquet every time the user revisits a page in the same session.

**Industry recommendation:** "OLAP caches for DuckDB simplify the database experience while delivering cache speed." — [MotherDuck OLAP caching](https://motherduck.com/blog/duckdb-olap-caching/)

**Recommendation:** DuckDB-WASM keeps Parquet in memory after first fetch. Within a session, repeat reads are free. Cross-session, we have CloudFront edge caching (4 h TTL on Parquet). Already covered. No gap, but worth documenting as a proactive choice.

### §4.7 Soda Core for continuous warehouse monitoring

**Gap:** We have point-in-time tests in dbt. We don't have continuous monitoring beyond the daily reconcile + freshness checks.

**Industry recommendation:** "A common pattern is to use dbt for tests during transformation, Great Expectations for rigorous validation of raw data at ingestion, and Soda for continuous monitoring and alerting on production data warehouses." — [Datacoves dbt data quality guide](https://datacoves.com/post/dbt-data-quality-tools)

**Our position:** At our scale (single tenant, single source), CloudWatch alarms + the daily reconcile + dbt tests provide adequate continuous monitoring. Soda would be additive but not load-bearing.

**Recommendation:** Add Soda Core only if we expand to multi-tenant or multi-source. Not needed for v1.

### §4.8 Data lineage visualization

**Gap:** We have exposures.yml documenting page→mart dependencies. We don't have visual lineage rendering.

**Recommendation:** dbt's built-in `dbt docs generate` + `dbt docs serve` produces a clickable lineage graph for free. Wire `dbt docs generate` into the build pipeline; serve from S3 + CloudFront. Effort: ~2 hours.

---

## §5 — Where we deliberately DIVERGE from industry standard (and why)

### §5.1 NDJSON.gz over Parquet for v1 bronze

**Standard:** Parquet is the default columnar format for data lakes.

**Our choice:** NDJSON.gz for v1 bronze; eventual compaction to Parquet (per §11.5 of master plan).

**Why:** Node 20 Lambda has zlib built-in — no new npm dep, no native binding. Parquet writers in Node (parquet-wasm, @dsnp/parquetjs) have larger bundles, higher cold-start cost, and rougher edge cases. DuckDB reads NDJSON.gz natively at fast-enough speed for our scale (50K rows/day per Lambda invocation, ~5 MB JSON.gz/day total). The monthly compaction job rolls page-files into per-month Parquet without losing the original NDJSON history.

**Trade-off accepted:** ~30–40% larger raw size (5 MB/day vs ~3 MB/day Parquet equivalent). Negligible cost ($0.001/mo).

### §5.2 In-browser execution vs. server-rendered for analytics

**Standard:** Real-estate analytics dashboards render server-side, sometimes with cached JSON.

**Our choice:** Hybrid — SSR for hero KPIs (SEO + first paint), DuckDB-WASM for everything else.

**Why:** Tab switches and segment toggles in our /phoenix dashboard are the highest-frequency interaction. Server round-trip per interaction adds 200–500 ms; 0 ms local query is dramatically better UX. The bandwidth cost (~650 KB initial load) is offset by zero subsequent fetches.

**Trade-off accepted:** ~0.5% of browsers don't support WASM — feature-detect and fall back to DuckDB Lambda for those. Very-low-end devices may experience memory pressure with the full Parquet bundle (~5–10 MB in memory) — monitor via Performance API.

### §5.3 t3.micro RDS over t3.medium

**Standard:** Most replicate-and-serve PropTech platforms run on db.r6g.large or larger for concurrent search + analytics load.

**Our choice:** t3.micro after Phase 6 because RDS only holds app data (auth, intake, agents) + change_log + geographic_boundaries. ~6 GB total, ~50K writes/day.

**Why:** Search has already moved to Spark API direct. Analytics moves to DuckDB-WASM. RDS becomes an app-only database with low load. micro is the right size for that workload.

**Trade-off accepted:** No headroom for surprise load on RDS. If we add other features that need RDS (e.g., a notifications queue), revisit instance class.

### §5.4 No Iceberg / Delta Lake

**Standard:** Modern lakehouses use Apache Iceberg or Delta Lake for transactional Parquet semantics.

**Our choice:** Plain Parquet with Hive partitioning + dbt orchestration.

**Why:** Iceberg/Delta Lake become valuable beyond ~1 TB or with multi-writer concurrency, neither of which we have. Operational complexity not justified at our scale.

**Trade-off accepted:** Schema evolution is more manual (we increment `schema_version` in manifest.json on column changes; Iceberg would track this automatically).

### §5.5 No commercial observability platform (Monte Carlo / Acceldata)

**Standard:** Mid-to-enterprise data teams use Monte Carlo, Acceldata, or Bigeye for end-to-end observability.

**Our choice:** dbt tests + dbt-bouncer + CloudWatch alarms + (recommended) Elementary Data.

**Why:** Monte Carlo starts at $1500/mo. We're saving $39/mo with the migration; adding $1500/mo of observability undoes the cost win. Open-source dbt-native tools cover 80% of what Monte Carlo provides at our scale.

**Trade-off accepted:** No automatic anomaly detection beyond what Elementary provides. Manual eyeball on the daily reconcile output for the first quarter.

### §5.6 Spark API direct for active marts (not bronze-mediated)

**Standard:** All data flows through bronze → silver → gold in canonical lakehouse architecture.

**Our choice:** `int_listings_active_cleaned` reads from a separate hourly Spark snapshot, not the bronze listings prefix.

**Why:** Active analytics demand <1-h freshness. Bronze sync is on 4-h cadence. Routing actives through bronze adds 4 hours of latency for no benefit (current state is overwritten anyway). Direct hourly snapshot to a single Parquet is the cleanest pattern.

**Trade-off accepted:** Two ingestion paths instead of one. Slight operational complexity. Documented in §4.8 of master plan.

---

## §6 — Domain-specific divergences from RESO/MLS norms

### §6.1 Property segmentation as a first-class dimension

**Standard MLS platforms:** Treat all listings as a single dataset. Cave Creek median lying because of land contamination is a known pain point but rarely surfaced to users.

**Our plan:** `property_segment` enum on every silver row + every gold mart. Default residential. User can toggle. Methodology footer explains what's included.

This is a **deliberate product decision**, not just a data-model choice. Most MLS platforms hide methodology because it's complicated; we expose it because customers (agents) appreciate transparency.

### §6.2 Reject quarantine with `reject_reason`

**Standard:** Most ETL pipelines drop bad rows silently or fail loudly.

**Our plan:** Bad rows route to `_quarantine/reject_log/` Parquet on S3 with `reject_reason` enum. Audit-friendly, debuggable.

### §6.3 Honest disclosure on partial coverage

**Standard:** Most platforms hide that "11.3% of listings had recorded reductions; the rest closed without changes." They either misrepresent the metric or exclude it.

**Our plan:** Methodology footer states this explicitly. UI dims/asterisks low-confidence metrics. Builds trust.

---

## §7 — Recommendations summary

Adoption priority based on cost-benefit:

| Recommendation | Effort | Value | Priority |
|---|---|---|---|
| Add Elementary Data for dbt observability | Half day | High (anomaly detection + alerting) | **Adopt** before Phase 5 |
| Pin DuckDB-WASM to ≥1.3 (lazy column fetching) | 5 min | Medium-High (3–10× faster reads with LIMIT) | **Adopt** at the package install step |
| Wire `dbt docs generate` for lineage graph | 2 hours | Medium (lineage visualization for any future engineer) | **Adopt** during Phase 4 |
| Use `parquet_metadata()` for instant preview | Half day | Medium (mobile bandwidth savings) | **Adopt** during Phase 5 client work |
| Probe ARMLS for `$validation` Validation Expressions | 1 hour probe + 1 day if found | Low-Medium | **Defer** — only adopt if probe confirms support |
| Probe ARMLS for EntityEvent webhooks | 1 hour probe + ~2 days if supported | Medium (sub-minute freshness) | **Defer** to v2 — current cadence is fine for IDX |
| Add Soda Core for continuous monitoring | 1 day | Low at our scale | **Defer** — revisit on multi-tenant |
| Adopt Iceberg/Delta Lake | 1 week | Low at our scale | **Defer** indefinitely (revisit at >1 TB) |
| Add Monte Carlo / commercial observability | n/a | Low at our scale, high cost | **Reject** — Elementary covers 80% at $0 |

---

## §7.1 — ARMLS capability probe results (2026-04-29)

Probed the ARMLS Spark API `/$metadata` (731 KB XML) and tested the EntityEvent + Subscription endpoints:

| Probe | Result | Verdict |
|---|---|---|
| RESO `$validation` annotations in `$metadata` | 0 hits for `sap:validation`, `org.reso.metadata`, `MinValue/MaxValue`, "Validation" anywhere | **NOT supported** — keep hand-coded silver cleaning rules |
| `<Annotation Term="RESO.*">` annotations on Property | 123 matches — all `RESO.OData.Metadata.LookupName` (enum lookup table refs) | **Partial value** — can drive enum-validation tests but not range/format rules |
| `/EntityEvent?$top=1` endpoint | HTTP 404 | **NOT supported** — keep polling cadence |
| `EntityEvent` in `$metadata` | 1 occurrence (documentation), but endpoint returns 404 | Documented but not exposed by ARMLS |
| `/Subscription` endpoint | HTTP 404 | **NOT supported** — no RESO 2.0 push subscription |
| `/$metadata` declared entities | 15 (Property, Member, Office, Association, DelegatedAccess, ExternalProducts, Media, SocialMedia, TeamMembers, OpenHouse, Room, Unit, HistoryTransactional, RentalCalendar, Lookup) | Standard RESO surface |

**Net:** ARMLS Spark ships RESO 1.x classic replication only. No `$validation`, no webhooks. Our polling + hand-coded cleaning is the right shape; no v2 freshness or validation upgrade path available without ARMLS updating their server.

**One small bonus we can extract:** the 123 `LookupName` annotations on Property fields. We can read `$metadata` once and auto-generate `accepted_values` tests from the lookup tables for any enum-typed field. Effort: ~2 hours; adds ~40 generic tests; catches future ARMLS lookup additions automatically. Worth doing in Phase 4.

## §8 — Verdict

**Our plan is well-grounded in 2026 best practices.** Direct alignment in 11 areas (replicate-and-serve, bronze immutability, strangler-fig migration, dbt structure, calendar spine, incremental, confidence bands, reconciliation, DuckDB-WASM, polling cadence, cost optimization). We exceed standard practice in 6 areas (historical depth, months-of-supply cross-mart, buyer-side analytics, close-to-original ratio, provenance, in-browser execution).

Five gaps worth addressing — most are quick wins (Elementary Data, DuckDB version pin, dbt docs, `parquet_metadata`, lineage). Two require ARMLS-side capability probes ($validation, EntityEvent) and can be deferred.

Six deliberate divergences from typical practice (NDJSON.gz, browser execution, micro RDS, no Iceberg, no Monte Carlo, separate active path) are well-justified for our scale + workload + cost profile.

**No structural concerns.** Plan is buildable as-is; recommendations are additive optimizations.

---

## Sources

- [AWS Strangler Fig Pattern — Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html)
- [Microsoft Fabric Medallion Lakehouse Architecture](https://learn.microsoft.com/en-us/fabric/onelake/onelake-medallion-lakehouse-architecture)
- [Microsoft Data Lake Zones and Containers](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/scenarios/cloud-scale-analytics/best-practices/data-lake-zones)
- [dbt Developer Hub — How we structure our dbt projects](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview)
- [dbt Incremental Microbatch documentation](https://docs.getdbt.com/docs/build/incremental-microbatch)
- [DuckDB WASM in Browser — MotherDuck blog](https://motherduck.com/blog/duckdb-wasm-in-browser/)
- [DuckDB-WASM: Fast Analytical Processing for the Web — VLDB paper](https://www.vldb.org/pvldb/vol15/p3574-kohn.pdf)
- [DuckDB 1.3 on MotherDuck — lazy column fetching](https://motherduck.com/blog/announcing-duckdb-13-on-motherduck-cdw/)
- [DuckDB OLAP Caching — MotherDuck](https://motherduck.com/blog/duckdb-olap-caching/)
- [High Performance Data Visualization in the Browser — Travis Horn](https://travishorn.com/high-performance-data-visualization-in-the-browser-with-duckdb-and-parquet/)
- [DuckDB-WASM Web Mapping with Parquet — Sparkgeo](https://sparkgeo.com/blog/a-duckdb-wasm-web-mapping-experiment-with-parquet/)
- [DuckDB in the Browser, Fast Parquet at the Edge — Codastra (Apr 2026)](https://medium.com/@2nick2patel2/duckdb-in-the-browser-fast-parquet-at-the-edge-76a94863625e)
- [OLAP in Your Browser: DuckDB Meets Wasm — Vectorlane (Jan 2026)](https://medium.com/@jickpatel611/olap-in-your-browser-duckdb-meets-wasm-9248b1077281)
- [Customer Facing Analytics Database — MotherDuck guide](https://motherduck.com/learn-more/customer-facing-analytics-database/)
- [How to Cut Cloud Data Warehouse Costs by 70% — MotherDuck](https://motherduck.com/learn/reduce-cloud-data-warehouse-costs-duckdb-motherduck/)
- [RESO Web API & Data Standards — MEV](https://mev.com/blog/reso-standards-a-practical-advantage-for-real-estate-businesses)
- [Fixing MLS Data Chaos: RESO-Compliant Integrations — GTC Systems](https://gtcsys.com/fixing-mls-data-chaos-how-to-design-reso-compliant-real-estate-integrations/)
- [How Does RESO Web API Work? — Realtyna](https://realtyna.com/blog/reso-web-api-work/)
- [Real Estate Data Integrations: MLS, IDX, RESO Web API for PropTech — EVNE Developers](https://evnedev.com/blog/company/real-estate-data-integrations/)
- [MLS Software Development Guide for Real Estate in 2025 — Biz4Group](https://www.biz4group.com/blog/mls-software-development)
- [The 2026 Open-Source Data Quality and Observability Landscape — DataKitchen](https://datakitchen.io/the-2026-open-source-data-quality-and-data-observability-landscape/)
- [12 Best Data Quality Tools for 2026 — lakeFS](https://lakefs.io/data-quality/data-quality-tools/)
- [dbt vs Great Expectations vs Soda — Cybersierra](https://cybersierra.co/blog/best-data-quality-tools/)
- [Beyond dbt Tests: Advanced Tools for Data Quality — Datacoves](https://datacoves.com/post/dbt-data-quality-tools)
- [Top open source data quality tools to know in 2026 — Atlan](https://atlan.com/open-source-data-quality-tools/)
- [Data Migration Validation Best Practices — Quinnox](https://www.quinnox.com/blogs/data-migration-validation-best-practices/)
- [Data Reconciliation Best Practices — Datagaps](https://www.datagaps.com/blog/data-reconciliation-best-practices/)
- [Big Bang vs. Progressive Modernization — AppsTek](https://appstekcorp.com/blog/progressive-modernization-enterprise-transformation/)
- [Bronze Layer Data Modeling Best Practices — Kishan Raj (Medium)](https://medium.com/@kishanraj41/bronze-layer-data-modeling-best-practices-8acebd540754)
- [AWS Lambda with Polars II: PyArrow — Rho Signal](https://www.rhosignal.com/posts/polars-aws-lambda-pyarrow/)
- [dbt-DuckDB GitHub](https://github.com/duckdb/dbt-duckdb)
- [Fully Local Data Transformation with dbt and DuckDB — DuckDB blog](https://duckdb.org/2025/04/04/dbt-duckdb)
- [dbt-bouncer GitHub](https://github.com/godatadriven/dbt-bouncer)
