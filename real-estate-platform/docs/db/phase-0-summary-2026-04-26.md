# Phase 0 Close-out — 2026-04-26

## What Phase 0 found

### 1. Lambda failure root cause (CloudWatch logs Apr 19–20)

Two error classes, both architectural:

- **`numeric field overflow` (PG 22003)** — recurring all day Apr 19 in `[upsert] Batch failed (10 records)` lines. Some incoming row has a value that exceeds a `NUMERIC(p,s)` column on `listing_records`.
- **`deadlock detected` (PG 40P01)** — concurrent Lambda invocations (134 in one day vs. the scheduled 6) updating overlapping rows in `listing_records`.

**The structural problem behind both** is in `apps/backend/src/lib/spark/sync-engine.ts` lines 146–164:

```ts
async function upsertPage(records) {
  await client.query('BEGIN');
  for (const raw of records) {
    await upsertRecord(client, entity, raw);   // each in same txn
  }
  await client.query('COMMIT');
}
```

A single bad row throws → the entire 10-row batch rolls back → the page is "Batch failed" in logs → next invocation re-encounters the same bad row → fails again. Compound that with parallel invocations, and you get deadlocks on top.

### 2. Schema baseline produced

`docs/db/schema-baseline-2026-04-26.{md,json}` — 31 tables, 11 MVs, 156 indexes, 32 numeric columns audited. This is our ground truth before Phase 4 baseline reset.

### 3. The Silver layer is a phantom

- `clean_listings` exists in `src/migrations/022_clean_layer_ddl.sql` but **was never created in production** (or was dropped). `analytics_base` was refactored to bypass it.
- `subdivision_canonical_map` exists in `migrations/rds/022_normalization_tables.sql` but **was never created in production**.
- `analytics_base` (85 MB, 357K rows) is built by `scripts/rebuild-analytics-base.js`, **not any SQL migration**. Its current definition `LEFT JOIN`s `listing_records` to `listing_geography` directly.
- The new analytics_base script *already* has the future-close-date filter (`close_date <= CURRENT_DATE + INTERVAL '30 days'`) — Task 3 of the 2026-04-12 plan is partially done.

This means Phase 2 of the master plan has to **build** the Silver layer, not refactor it.

### 4. Migration drift documented

`docs/db/migration-drift-2026-04-26.md` — TWO migration directories that don't talk; only `001_initial` is registered in the `migrations` audit table; ~40 MVs in migration files don't exist live; migration 028 unapplied; 027 is a collision. Phase 4 baseline reset is the right cleanup.

### 5. Numeric column precisions (overflow audit)

The likely overflow culprits (NUMERIC columns on `listing_records` with tight bounds):

| Column | Type | Max value | Risk |
|---|---|---|---|
| `tax_annual_amount` | NUMERIC(10,2) | $99,999,999.99 | High — luxury commercial properties exceed |
| `garage_spaces` / `covered_spaces` / `carport_spaces` / `open_parking_spaces` | NUMERIC(4,1) | 999.9 | High — data-entry errors / commercial garages |
| `lot_size_acres` | NUMERIC(10,4) | 999,999.9999 | Medium — large ranches push it |
| `living_area` / `association_fee` / `price_per_sqft` | NUMERIC(10,2) | $99,999,999.99 | Low but possible |
| `list_price` / `close_price` / `original_list_price` / `concession_amount` | NUMERIC(12,2) | $9,999,999,999.99 | Very low |
| `lot_size_square_feet` | NUMERIC(12,2) | 9.99B | Live max sits at 9.99B exactly — edge case |

---

## Phase 1.1 proposal — exact code changes ready to ship

All changes are **code-only** plus one **new side table** (additive, compliance-friendly).

### Change 1: SAVEPOINT-per-record in `upsertPage()`

Replaces single-transaction batching with per-record isolation:

```ts
private async upsertPage(entity: EntityName, records: Record<string, unknown>[]): Promise<number> {
  if (records.length === 0) return 0;
  const client = await getRdsClient();
  let succeeded = 0;
  try {
    await client.query('BEGIN');
    for (const raw of records) {
      await client.query('SAVEPOINT row_save');
      try {
        await this.upsertRecord(client, entity, raw);
        await client.query('RELEASE SAVEPOINT row_save');
        succeeded++;
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT row_save');
        await this.recordSyncError(client, entity, raw, err);
      }
    }
    await client.query('COMMIT');
    return succeeded;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

private async recordSyncError(
  client: PoolClient, entity: EntityName, raw: Record<string, unknown>, err: unknown
): Promise<void> {
  const e = err as { code?: string; message?: string };
  const listingKey = (raw.ListingKey ?? raw.MemberKey ?? raw.OfficeKey ?? raw.OpenHouseKey) as string | undefined;
  await client.query(
    `INSERT INTO sync_errors (entity_name, listing_key, error_code, error_message, raw_payload)
     VALUES ($1, $2, $3, $4, $5)`,
    [entity, listingKey ?? null, e.code ?? null, e.message ?? 'unknown', JSON.stringify(raw)]
  );
}
```

### Change 2: New side table `sync_errors`

Single forward-only DDL — additive, no mirror mutation:

```sql
CREATE TABLE IF NOT EXISTS sync_errors (
  id BIGSERIAL PRIMARY KEY,
  entity_name TEXT NOT NULL,
  listing_key TEXT,
  error_code TEXT,
  error_message TEXT NOT NULL,
  raw_payload JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sync_errors_listing_key ON sync_errors(listing_key);
CREATE INDEX idx_sync_errors_occurred_at ON sync_errors(occurred_at DESC);
```

This goes in `migrations/rds/029_sync_errors.sql` as the **first migration after baseline reset** (or applied directly with manual register if reset hasn't run yet).

### Change 3: Lambda concurrency guard

Set `reservedConcurrentExecutions = 1` on the `rlsir-armls-sync` Lambda. Eliminates parallel-invocation deadlocks. AWS CLI command:

```bash
aws lambda put-function-concurrency \
  --function-name rlsir-armls-sync \
  --reserved-concurrent-executions 1 \
  --region us-east-1
```

This is an AWS write — needs explicit go-ahead.

### Change 4 (defer): Switch `$skip` to `nextLink + ModificationTimestamp`

Per RESO replication best practice. Recommended but **not required** for Phase 1 — the savepoint fix alone unblocks the sync. This becomes a Phase 1.2 follow-up if we still see duplication issues.

---

## What I need from you to proceed

Three approval gates:

1. **Apply `029_sync_errors.sql`** — one CREATE TABLE + 2 indexes against RDS. Pure additive, zero risk to existing data. ✅ / ❌
2. **Modify `apps/backend/src/lib/spark/sync-engine.ts`** with the SAVEPOINT pattern + recordSyncError method, plus rebuild the Lambda zip via `infra/lambda/build.mjs` and deploy. This is local code + a Lambda update. ✅ / ❌
3. **Set Lambda `reservedConcurrentExecutions = 1`** via AWS CLI. Single AWS write. ✅ / ❌

After all three: smoke test with manual invoke → backfill from last good watermark → re-enable EventBridge → verify alarms re-evaluate.

If any of these three feels wrong, course-correct now and I'll adjust.
