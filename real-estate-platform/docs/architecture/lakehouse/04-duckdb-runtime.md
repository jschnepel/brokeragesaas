# DuckDB Runtime

**Date:** 2026-04-30
**Status:** Spec covering all three DuckDB runtimes — build (dbt), browser (WASM), ad-hoc (CLI/Lambda).
**Related:** `03-dbt-project.md` (build target), `06-browser-dashboard.md` (WASM), `05-dagster-orchestration.md` (build trigger).

---

## 1. The three runtimes

| Runtime | Where | Purpose |
|---|---|---|
| Build (dbt's target) | Lambda container `rlsir-analytics-dbt` (prod) or local file (dev) | Run dbt models. Read bronze NDJSON from S3, write Parquet marts to S3. |
| Browser (DuckDB-WASM) | Loaded into `apps/premium-site` and `apps/premium-site/admin/metrics` pages | Query Parquet marts client-side. Sub-5ms tile drill-downs after initial Parquet fetch. |
| Ad-hoc (CLI / query Lambda) | Analyst laptop, occasionally a Lambda for debug | Direct queries against bronze + marts for investigation. No state. |

All three use the same DuckDB version, the same SQL dialect, the same extensions. Same query works everywhere.

## 2. Version + extensions

**Version:** DuckDB ≥ 1.3 (browser WASM ≥ 1.3 has the right Parquet predicate-pushdown behavior).
**Extensions used everywhere:**
- `httpfs` — read S3 directly via `s3://...` paths
- `parquet` — Parquet read/write
- `json` — `read_json_auto`, jsonb manipulation

**Build runtime additionally:**
- `postgres` — for the `attach` to RDS (used by `int_listings_status_history` reading `listing_change_log`)

**Browser runtime intentionally MINIMAL:**
- `httpfs` (or shadow via `fetch()` and registerFileBuffer for tighter control)
- `parquet`
- (no `postgres` — browser can't talk to RDS)

## 3. Build runtime (`rlsir-analytics-dbt` Lambda)

**Container image:** `rlsir-analytics-dbt:latest` in ECR, ~800MB.

```dockerfile
FROM public.ecr.aws/lambda/python:3.11

RUN pip install \
      dbt-core==1.8.* \
      dbt-duckdb==1.8.* \
      duckdb==1.3.*

# dbt project + packages
COPY analytics/ ${LAMBDA_TASK_ROOT}/analytics/
RUN cd ${LAMBDA_TASK_ROOT}/analytics && dbt deps

# Lambda entry — invokes dbt build with selectors from event payload
COPY infra/lambda/dbt-runner.py ${LAMBDA_TASK_ROOT}/

CMD ["dbt-runner.handler"]
```

**Lambda handler:**

```python
def handler(event, context):
    """
    event = { selector: "+tag:active", target: "prod", vars: {...}, full_refresh: false }
    """
    args = ["build",
            "--target", event.get("target", "prod"),
            "--profiles-dir", "/opt/profiles",
            "--project-dir", os.path.join(LAMBDA_TASK_ROOT, "analytics")]
    if event.get("selector"): args.extend(["--select", event["selector"]])
    if event.get("full_refresh"): args.append("--full-refresh")
    if event.get("vars"): args.extend(["--vars", json.dumps(event["vars"])])

    result = subprocess.run(["dbt"] + args, capture_output=True, text=True, timeout=850)
    upload_run_results(result)
    emit_metrics(result)
    return {"statusCode": 0 if result.returncode == 0 else 500,
            "body": json.dumps({"returncode": result.returncode, "stdout_tail": result.stdout[-2000:]})}
```

**Memory + timeout:** 1024MB / 900s. dbt-DuckDB build is CPU + memory bound; 1024MB is enough for the 27-model project. If memory pressure rises, bump to 2048MB.

**reservedConcurrentExecutions:** 1 (lessons from active-snapshot — never let two dbt runs race on the same DuckDB file or S3 mart prefix).

**IAM role:** see `01-storage-schema.md § 7`.

**Invocation paths:**
- Dagster `@asset` materialization (primary) — payloads `{selector: "+tag:active"}` etc.
- Manual via `aws lambda invoke` for debug
- EventBridge schedules (fallback if Dagster is down)

## 4. Browser runtime (DuckDB-WASM)

**Bundle choice:** `@duckdb/duckdb-wasm` **EH bundle** (single-threaded with exception handling).

Why EH and not COI:
- COI requires `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` headers, which break image embeds + cross-origin iframes elsewhere on the site.
- For solo-agent dashboard, single-threaded is plenty. The 27-mart full dashboard needs <100ms of compute on M1 hardware; multi-threading buys nothing meaningful.
- EH bundle is ~5MB (vs 8MB for COI).

**Bootstrap pattern** (`apps/premium-site/lib/duckdb-wasm.ts`):

```typescript
import * as duckdb from "@duckdb/duckdb-wasm";
import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import duckdb_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";

let dbInstance: duckdb.AsyncDuckDB | null = null;

export async function getDuckDB(): Promise<duckdb.AsyncDuckDB> {
  if (dbInstance) return dbInstance;

  const logger = new duckdb.ConsoleLogger();
  const worker = new Worker(duckdb_worker);
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(duckdb_wasm);
  dbInstance = db;
  return db;
}

export async function loadParquet(name: string, url: string): Promise<void> {
  const db = await getDuckDB();
  const conn = await db.connect();
  // Fetch + register as a virtual file (avoids CORS preflight on cross-origin parquet)
  const buf = await fetch(url).then((r) => r.arrayBuffer());
  await db.registerFileBuffer(name, new Uint8Array(buf));
  await conn.close();
}

export async function query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const db = await getDuckDB();
  const conn = await db.connect();
  try {
    const result = await conn.query(sql);
    return result.toArray().map((r) => r.toJSON()) as T[];
  } finally {
    await conn.close();
  }
}
```

**Usage from a tab component:**

```typescript
// apps/premium-site/app/(routes)/phoenix/components/tabs/OverviewTab.tsx

const { data, isLoading } = useParquet({
  name: "market_pulse",
  url: "/api/parquet/armls/metro/market_pulse.parquet",  // proxy to S3 or direct CloudFront
  query: `SELECT * FROM market_pulse
          WHERE scope_type = 'metro' AND scope_key = 'phoenix_metro' AND property_segment = 'residential'
            AND month >= ?
          ORDER BY month`,
  params: [twelveMonthsAgo],
});
```

The `useParquet` hook:
1. Fetch + register Parquet on first call
2. Cache the file buffer (in-memory + IndexedDB for cross-page persistence)
3. Run the query, return rows

**Performance:**
- Parquet fetch: ~50–500ms depending on size (most marts <1MB)
- Query execution: <5ms for typical mart drill-downs
- Total tile interaction: instant (no network round-trip after load)

**Bundle size impact on premium-site:**
- Lazy-loaded (dynamic import on `/phoenix` route only)
- Adds ~5MB on first dashboard visit; cached thereafter
- No impact on `/`, `/listings`, `/portfolio` routes

**Fallback:** if WASM bootstrap fails (rare — old browsers, sandboxed iframes), the page falls through to SSR'd KPIs (which need a Server Action that queries Parquet via a server-side DuckDB Lambda — see § 5).

## 5. Ad-hoc / debug runtime

For an analyst querying directly:

```bash
# Local CLI against marts on S3
duckdb << 'EOF'
INSTALL httpfs; LOAD httpfs;
SELECT scope_type, COUNT(*) AS n_rows
FROM read_parquet('s3://rlsir-platform-assets-us-east-1/analytics/armls/metro/market_pulse.parquet')
GROUP BY 1;
EOF

# Or against bronze NDJSON.gz
duckdb -c "SELECT COUNT(*) FROM read_json_auto('s3://.../bronze/listings/sync_year=2026/sync_month=04/sync_day=*/page_*.ndjson.gz', union_by_name=true)"
```

For a SSR Server Action (when DuckDB-WASM fallback fires):

`apps/premium-site/app/api/parquet-query/route.ts`:

```typescript
import duckdb from "duckdb";
const db = new duckdb.Database(":memory:");
const conn = db.connect();

export async function POST(req: Request) {
  const { sql, params } = await req.json();
  const rows = await new Promise((resolve, reject) =>
    conn.all(sql, ...params, (err: Error, res: Record<string, unknown>[]) => err ? reject(err) : resolve(res))
  );
  return Response.json(rows);
}
```

This SSR path uses the Node DuckDB binding, not WASM. Same SQL dialect, same Parquet files.

## 6. Performance tuning

**Memory limits:** DuckDB's default is 80% of system memory. In Lambda containers, this needs explicit setting:

```sql
SET memory_limit = '768MB';   -- in 1024MB Lambda, leave headroom for runtime overhead
```

**Threads:** Lambda has 2 vCPUs at most for our memory class. `SET threads = 2`.

**HTTP connections (httpfs):** S3 reads benefit from 8–16 parallel connections.

```sql
SET httpfs_keep_alive = true;   -- reuse TLS sessions across queries
```

**Parquet predicate pushdown:** make sure marts have `WHERE` predicate-friendly columns first. DuckDB skips entire row groups when min/max stats prove the predicate false. Verify with `EXPLAIN ANALYZE`:

```sql
EXPLAIN ANALYZE
SELECT * FROM read_parquet('s3://.../market_pulse.parquet')
WHERE scope_type = 'metro' AND month >= '2025-01-01';
-- Look for "Filter: ... [pushed down]" in the plan
```

If a query reads more bytes than expected, sort the source mart by the predicate column before writing — `ORDER BY scope_type, scope_key, month`. This clusters min/max stats per row group.

## 7. Cost

**Build runtime (per Lambda invocation):**
- 4 hrs cadence × 30 days = 180 invocations/mo for closed marts
- 1 hr cadence × 30 days × 24 = 720 invocations/mo for active marts (lighter, ~30s each)
- Avg duration: 2 min × 1024MB = ~$0.04 per invocation
- Total: ~$36/mo at planned cadence

**Browser runtime:** $0 (runs on user device).

**Ad-hoc runtime:** $0 (local CLI) or per-invoke if Lambda-backed.

## 8. Failure modes + recovery

| Failure | Detection | Recovery |
|---|---|---|
| Build Lambda OOMs | Runtime.OutOfMemory | Bump memory to 2048MB. Last resort: split dbt build into multiple Lambda invocations by `--select` |
| dbt model returns 0 rows when it shouldn't | Singular test, dbt-expectations row count test | Test fails the build; mart isn't published. Fix model or fix bronze. |
| S3 PutObject denied during mart write | dbt error log | Check `rlsir-analytics-dbt` IAM policy includes `s3:PutObject` on `analytics/*` |
| Browser WASM bootstrap fails | Hook error state | Page falls back to SSR via `/api/parquet-query` |
| Parquet schema drift breaks browser query | Browser-side error | `union_by_name=true` in `read_parquet` tolerates added cols. Renames/drops require browser code update — do under feature flag. |
| Stale mart on S3 (dbt run failed silently) | Dagster sees no asset materialization in N hours; alarm fires | Re-run via Dagster UI or `aws lambda invoke` |

## 9. Why DuckDB and not Athena/Snowflake/BigQuery

| Option | Cost | Latency | Fit |
|---|---|---|---|
| **DuckDB** (chosen) | $0–$36/mo (Lambda compute only) | <5ms in browser, <100ms ad-hoc | Solo-agent scale, browser-side queries are the killer feature |
| Athena | $5/TB scanned | ~2s per query | Pay-per-query is wrong for an interactive dashboard; no browser path |
| Snowflake | $40+/mo even idle | ~500ms | Massive overkill for solo-agent volumes |
| BigQuery | $5/TB scanned + storage | ~1s | Same as Athena; vendor lock-in |
| RDS Postgres MVs (current) | $66/mo (t3.medium) | 60s+ timeouts on big queries | Doesn't scale; was the problem we set out to solve |

DuckDB at this scale is strictly better. The lakehouse architecture is portable — a future move to Athena or Iceberg is straightforward because the bronze + marts are already columnar Parquet on S3.
