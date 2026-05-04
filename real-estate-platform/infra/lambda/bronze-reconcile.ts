/**
 * Phase 2 — Daily reconciliation Lambda (v1, no DuckDB).
 *
 * Compares yesterday's bronze NDJSON.gz writes (count from S3 object metadata)
 * to yesterday's listing_records modifications (count from Postgres).
 * Alerts via SNS on row_delta > threshold for N consecutive days.
 *
 * Trigger: EventBridge cron(0 11 * * ? *) — 04:00 PHX = 11:00 UTC daily
 *
 * v1 scope: row count only. Content checksum reconciliation moves to a
 * dbt-driven daily check in Phase 4 (uses DuckDB which we already have there).
 */

import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { Pool } from "pg";

const REGION = "us-east-1";
const BRONZE_BUCKET = "rlsir-platform-assets-us-east-1";
const BRONZE_PREFIX = "bronze/listings";
const SNS_TOPIC =
  process.env.SNS_TOPIC_ARN ??
  "arn:aws:sns:us-east-1:828301486081:rlsir-data-pipeline-alerts";
const STATE_TABLE = process.env.STATE_TABLE ?? "rlsir-bronze-reconcile-state";
const DRIFT_THRESHOLD = 5;
const ALERT_DAYS = 3;

const s3 = new S3Client({ region: REGION });
const cw = new CloudWatchClient({ region: REGION });
const sns = new SNSClient({ region: REGION });
const dynamo = new DynamoDBClient({ region: REGION });
const sm = new SecretsManagerClient({ region: REGION });

// RDS pool — DSN fetched from Secrets Manager at cold start.
// Cached for the lifetime of the warm Lambda.
let pool: Pool | null = null;
async function getPool(): Promise<Pool> {
  if (pool) return pool;
  const secretId = process.env.RDS_DSN_SECRET ?? "rlsir/db/url";
  const res = await sm.send(new GetSecretValueCommand({ SecretId: secretId }));
  const dsn = res.SecretString!;
  pool = new Pool({
    connectionString: dsn,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10_000,
  });
  return pool;
}

interface ReconcileResult {
  date: string;
  bronze_rows: number;
  bronze_pages: number;
  pg_rows: number;
  delta: number;
}

/**
 * Count bronze rows for a given date by summing record-count metadata
 * across all page objects under that day's partitions.
 */
async function countBronzeRows(date: string): Promise<{ rows: number; pages: number }> {
  const [yyyy, mm, dd] = date.split("-");
  const prefix = `${BRONZE_PREFIX}/sync_year=${yyyy}/sync_month=${mm}/sync_day=${dd}/`;

  let totalRows = 0;
  let totalPages = 0;
  let continuationToken: string | undefined;

  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: BRONZE_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    const contents = list.Contents ?? [];
    totalPages += contents.length;

    // For each page, HEAD the object to read its custom metadata.
    // record-count was stamped at write time by bronze-writer.ts.
    for (const obj of contents) {
      if (!obj.Key) continue;
      try {
        const head = await s3.send(
          new HeadObjectCommand({ Bucket: BRONZE_BUCKET, Key: obj.Key })
        );
        const recordCountStr = head.Metadata?.["record-count"];
        if (recordCountStr) {
          totalRows += parseInt(recordCountStr, 10);
        }
      } catch {
        // skip files that can't be read
      }
    }

    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  return { rows: totalRows, pages: totalPages };
}

/**
 * Count Postgres rows modified during the given UTC date.
 */
async function countPgRows(date: string): Promise<number> {
  const p = await getPool();
  const res = await p.query<{ n: string }>(
    `SELECT COUNT(*)::TEXT AS n
     FROM listing_records
     WHERE modification_timestamp >= $1::DATE
       AND modification_timestamp <  $1::DATE + INTERVAL '1 day'
       AND is_deleted = FALSE`,
    [date]
  );
  return parseInt(res.rows[0]?.n ?? "0", 10);
}

async function getConsecutiveDriftDays(): Promise<number> {
  try {
    const res = await dynamo.send(
      new GetItemCommand({
        TableName: STATE_TABLE,
        Key: { id: { S: "drift_counter" } },
      })
    );
    if (res.Item?.consecutive_days?.N) {
      return parseInt(res.Item.consecutive_days.N, 10);
    }
  } catch {
    // table may not exist on first run; treat as 0
  }
  return 0;
}

async function setConsecutiveDriftDays(n: number, lastDelta: number): Promise<void> {
  try {
    await dynamo.send(
      new PutItemCommand({
        TableName: STATE_TABLE,
        Item: {
          id: { S: "drift_counter" },
          consecutive_days: { N: String(n) },
          last_delta: { N: String(lastDelta) },
          updated_at: { S: new Date().toISOString() },
        },
      })
    );
  } catch (err) {
    console.warn(
      `[reconcile] could not write state to ${STATE_TABLE}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

/**
 * Active-snapshot reconciliation.
 *
 * Compares the record_count from bronze/active_snapshot/_freshness.json
 * to a fresh COUNT(*) of Active+AUC listings in RDS. Catches partial walks
 * (deadline cut short, mid-walk crashes) and stale freshness markers.
 *
 * Drift threshold: ±5% of RDS count. Stale-marker threshold: > 2 hours old.
 */
async function reconcileActiveSnapshot(): Promise<{
  bronze_records: number;
  pg_records: number;
  delta_pct: number;
  staleness_hours: number;
  is_drifted: boolean;
  is_stale: boolean;
}> {
  // 1. Pull freshness marker
  let freshness: { record_count: number; last_snapshot_at: string; pages_fetched: number };
  try {
    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: BRONZE_BUCKET,
        Key: "bronze/active_snapshot/_freshness.json",
      })
    );
    const body = await obj.Body!.transformToString();
    freshness = JSON.parse(body);
  } catch (err) {
    throw new Error(
      `Could not read bronze/active_snapshot/_freshness.json: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // 2. Count from PG (must mirror the Lambda's filter exactly)
  const p = await getPool();
  const res = await p.query<{ n: string }>(
    `SELECT COUNT(*)::TEXT AS n
     FROM listing_records
     WHERE standard_status IN ('Active','Active Under Contract')
       AND county_or_parish = 'Maricopa'`
  );
  const pgRecords = parseInt(res.rows[0]?.n ?? "0", 10);

  const bronzeRecords = freshness.record_count;
  const deltaPct =
    pgRecords === 0 ? 100 : Math.abs(bronzeRecords - pgRecords) / pgRecords * 100;
  const staleness =
    (Date.now() - new Date(freshness.last_snapshot_at).getTime()) / 1_000 / 3_600;

  return {
    bronze_records: bronzeRecords,
    pg_records: pgRecords,
    delta_pct: deltaPct,
    staleness_hours: staleness,
    is_drifted: deltaPct > 5,
    is_stale: staleness > 2,
  };
}

async function publishMetric(name: string, value: number): Promise<void> {
  await cw.send(
    new PutMetricDataCommand({
      Namespace: "RLSIR/DataPipeline",
      MetricData: [
        {
          MetricName: name,
          Value: value,
          Unit: "Count",
          Timestamp: new Date(),
        },
      ],
    })
  );
}

async function publishAlert(subject: string, message: string): Promise<void> {
  await sns.send(
    new PublishCommand({
      TopicArn: SNS_TOPIC,
      Subject: subject.substring(0, 100),
      Message: message,
    })
  );
}

interface LambdaContext {
  awsRequestId: string;
}

export async function handler(
  event: { date?: string },
  context: LambdaContext
): Promise<{ statusCode: number; body: string }> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const date = event.date ?? yesterday.toISOString().substring(0, 10);

  console.log(`[reconcile] Running for date=${date}`);

  try {
    const [bronze, pgRows] = await Promise.all([
      countBronzeRows(date),
      countPgRows(date),
    ]);

    const delta = bronze.rows - pgRows;
    const absDelta = Math.abs(delta);

    console.log(
      `[reconcile] bronze=${bronze.rows.toLocaleString()} (${bronze.pages} pages) pg=${pgRows.toLocaleString()} delta=${delta}`
    );

    await Promise.all([
      publishMetric("BronzeReconciliationDelta", delta),
      publishMetric("BronzeReconciliationAbsDelta", absDelta),
      publishMetric("BronzeRowCount", bronze.rows),
      publishMetric("BronzePageCount", bronze.pages),
      publishMetric("PgRowCount", pgRows),
    ]);

    const prevDays = await getConsecutiveDriftDays();
    const newDays = absDelta > DRIFT_THRESHOLD ? prevDays + 1 : 0;
    await setConsecutiveDriftDays(newDays, delta);

    if (newDays >= ALERT_DAYS) {
      await publishAlert(
        `[rlsir-bronze] ${newDays}-day reconciliation drift > ${DRIFT_THRESHOLD}`,
        `Date: ${date}\n` +
          `Bronze rows: ${bronze.rows.toLocaleString()} (${bronze.pages} pages)\n` +
          `Postgres rows: ${pgRows.toLocaleString()}\n` +
          `Delta: ${delta} (threshold: ±${DRIFT_THRESHOLD})\n` +
          `Consecutive drift days: ${newDays}\n\n` +
          `Run ID: ${context.awsRequestId}`
      );
    }

    // Active-snapshot reconciliation runs every day too — separate from the
    // listings drift counter since it has different cadence (hourly snapshot vs
    // daily mirror-modification volume).
    let active: Awaited<ReturnType<typeof reconcileActiveSnapshot>> | null = null;
    try {
      active = await reconcileActiveSnapshot();
      console.log(
        `[reconcile] active-snapshot: bronze=${active.bronze_records.toLocaleString()} pg=${active.pg_records.toLocaleString()} delta=${active.delta_pct.toFixed(2)}% age=${active.staleness_hours.toFixed(2)}h`
      );
      await Promise.all([
        publishMetric("ActiveSnapshotBronzeRecords", active.bronze_records),
        publishMetric("ActiveSnapshotPgRecords", active.pg_records),
        publishMetric("ActiveSnapshotDeltaPct", active.delta_pct),
        publishMetric("ActiveSnapshotStalenessHours", active.staleness_hours),
      ]);
      if (active.is_drifted || active.is_stale) {
        await publishAlert(
          `[rlsir-active-snapshot] ${active.is_drifted ? "drift" : "stale"}`,
          `Bronze records: ${active.bronze_records.toLocaleString()}\n` +
            `PG records (Active+AUC, Maricopa): ${active.pg_records.toLocaleString()}\n` +
            `Delta: ${active.delta_pct.toFixed(2)}% (threshold: ±5%)\n` +
            `Snapshot age: ${active.staleness_hours.toFixed(2)} hours (threshold: 2h)\n\n` +
            `Run ID: ${context.awsRequestId}`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[reconcile] active-snapshot check failed (non-fatal): ${msg}`);
      // Don't fail the whole reconcile; listings reconciliation result still ships.
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        date,
        bronze_rows: bronze.rows,
        bronze_pages: bronze.pages,
        pg_rows: pgRows,
        delta,
        consecutive_drift_days: newDays,
        active_snapshot: active,
      }),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[reconcile] FAILED: ${msg}`);
    await publishAlert(
      `[rlsir-bronze] Reconciliation FAILED for ${date}`,
      `Error: ${msg}\nRun ID: ${context.awsRequestId}`
    );
    return { statusCode: 500, body: JSON.stringify({ error: msg, date }) };
  }
}
