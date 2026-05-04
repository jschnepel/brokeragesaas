/**
 * Active snapshot Lambda — pulls Active + Active Under Contract listings
 * from the Spark API every hour and writes per-page NDJSON.gz files to S3.
 *
 * Why per-page (not single blob):
 *   - In-memory accumulation of ~46K records OOM'd 512MB AND 2GB Lambda
 *     (Buffer.concat held ~700MB raw + gzip + JSON.stringify intermediates).
 *   - Per-page writes bound memory to ~5MB raw + ~200KB gzipped.
 *   - dbt staging globs `bronze/active_snapshot/current/page_*.ndjson.gz`.
 *
 * Atomic-ish swap: at run start, delete all existing `current/page_*` files,
 * then write new pages as they arrive. Last page's write is followed by a
 * freshness marker. If the run dies mid-way, the next run cleans up.
 *
 * Output:
 *   s3://.../bronze/active_snapshot/current/page_NNNNNN.ndjson.gz   (one per page)
 *   s3://.../bronze/active_snapshot/_freshness.json                 (last successful run)
 *
 * Schedule: EventBridge rate(1 hour)
 * Wall time: ~140 s (~46 pages × 2.5s throttle + ~600 ms each fetch)
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import { gzip } from "zlib";
import { promisify } from "util";

const gzipAsync = promisify(gzip);

const BRONZE_BUCKET =
  process.env.BRONZE_BUCKET ?? "rlsir-platform-assets-us-east-1";
const PAGES_PREFIX = "bronze/active_snapshot/current/";
const FRESHNESS_KEY = "bronze/active_snapshot/_freshness.json";
const SPARK_BASE =
  process.env.SPARK_REPLICATION_URL ??
  "https://replication.sparkapi.com/Reso/OData";
// Scope: Active + Active Under Contract, Maricopa County only.
// - Pending and Coming Soon dropped 2026-04-29 (page count exceeded Spark's
//   per-token rate cap).
// - Maricopa filter added 2026-04-29 to align bronze with the dashboard scope
//   and the bronze-reconcile Lambda's PG comparison (~36K records / ~36 pages).
const ACTIVE_FILTER =
  "(StandardStatus eq 'Active' or StandardStatus eq 'Active Under Contract') " +
  "and CountyOrParish eq 'Maricopa'";

const smClient = new SecretsManagerClient({ region: "us-east-1" });
const s3Client = new S3Client({ region: "us-east-1" });
const cwClient = new CloudWatchClient({ region: "us-east-1" });

let cachedAccessToken: string | null = null;
async function getAccessToken(): Promise<string> {
  if (cachedAccessToken) return cachedAccessToken;
  const res = await smClient.send(
    new GetSecretValueCommand({ SecretId: "rlsir/armls/tokens" })
  );
  const secret = JSON.parse(res.SecretString!);
  cachedAccessToken = secret.access_token;
  return cachedAccessToken;
}

/**
 * Fetch one page from Spark and return records + the next page URL.
 * Spark uses `$skip` (not `$skiptoken`) when `$orderby` is set, so we just
 * follow the verbatim `@odata.nextLink` URL — no key-extraction needed.
 */
async function fetchPage(
  pageUrl: string,
  token: string
): Promise<{
  records: Record<string, unknown>[];
  nextPageUrl: string | null;
}> {
  let res!: Response;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(pageUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (res.ok) break;
    if ((res.status === 429 || res.status === 503) && attempt < 2) {
      const backoffMs = (attempt + 1) * 15_000;
      console.warn(`[active-snapshot] Spark ${res.status}, retry in ${backoffMs / 1000}s`);
      await new Promise((r) => setTimeout(r, backoffMs));
      continue;
    }
    const text = await res.text();
    throw new Error(`Spark error ${res.status}: ${text.substring(0, 200)}`);
  }

  const data = (await res.json()) as {
    "@odata.nextLink"?: string;
    value: Record<string, unknown>[];
  };

  return { records: data.value ?? [], nextPageUrl: data["@odata.nextLink"] ?? null };
}

function buildFirstPageUrl(filter: string): string {
  const params = new URLSearchParams();
  params.set("$filter", filter);
  params.set("$top", "1000");
  // $orderby defeats the long-TTL response cache on identical filter+top
  // requests (Spark 429 "request already in progress" otherwise).
  params.set("$orderby", "ModificationTimestamp desc");
  return `${SPARK_BASE}/Property?${params.toString()}`;
}

/** Delete all current/page_*.ndjson.gz files from prior run. */
async function clearStalePages(): Promise<number> {
  let deleted = 0;
  let continuationToken: string | undefined;
  do {
    const list = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BRONZE_BUCKET,
        Prefix: PAGES_PREFIX,
        ContinuationToken: continuationToken,
      })
    );
    const keys = (list.Contents ?? [])
      .map((o) => o.Key)
      .filter((k): k is string => typeof k === "string" && k.endsWith(".ndjson.gz"));
    if (keys.length > 0) {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: BRONZE_BUCKET,
          Delete: { Objects: keys.map((Key) => ({ Key })) },
        })
      );
      deleted += keys.length;
    }
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);
  return deleted;
}

interface LambdaContext {
  getRemainingTimeInMillis(): number;
  awsRequestId: string;
}

export async function handler(
  _event: unknown,
  context: LambdaContext
): Promise<{ statusCode: number; body: string }> {
  const startTime = Date.now();
  // Capture deadline ONCE at handler entry. context.getRemainingTimeInMillis()
  // is a running countdown — if read in a comparison expression each iteration
  // it produces an incorrect "halfway" deadline (~270s instead of ~540s).
  const deadlineMs = startTime + context.getRemainingTimeInMillis();
  const runId = require("crypto").randomUUID();
  const observedAt = new Date();
  const observedAtIso = observedAt.toISOString();

  console.log(
    `[active-snapshot] Starting run ${runId} at ${observedAtIso}, time budget ${context.getRemainingTimeInMillis()}ms`
  );

  try {
    const token = await getAccessToken();

    // Clear stale pages from prior run (atomic-ish swap pattern).
    const deleted = await clearStalePages();
    if (deleted > 0) console.log(`[active-snapshot] Cleared ${deleted} stale pages`);

    // Paginate the Spark API and write each page directly to S3.
    // Per-page writes bound memory to ~5MB (one page worth) instead of
    // accumulating ~46K records in memory and OOM'ing the Lambda.
    let pageUrl: string | null = buildFirstPageUrl(ACTIVE_FILTER);
    let pages = 0;
    let totalRecords = 0;
    let totalGzippedBytes = 0;
    const maxPages = 100; // safety ceiling

    while (pageUrl && pages < maxPages) {
      // Stop 60 s before deadline (uses captured deadlineMs, not the running countdown).
      if (deadlineMs - Date.now() < 60_000) {
        console.warn(`[active-snapshot] Near deadline after ${pages} pages, stopping early`);
        break;
      }

      const { records, nextPageUrl } = await fetchPage(pageUrl, token);

      // Stamp provenance + write this page directly to S3 (memory bounded).
      const pageChunks: Buffer[] = [];
      for (const r of records) {
        (r as Record<string, unknown>).sync_run_id = runId;
        (r as Record<string, unknown>).sync_observed_at = observedAtIso;
        pageChunks.push(Buffer.from(JSON.stringify(r) + "\n", "utf-8"));
      }
      const pageNdjson = Buffer.concat(pageChunks);
      const pageGzipped = await gzipAsync(pageNdjson);
      const pageKey = `${PAGES_PREFIX}page_${String(pages).padStart(6, "0")}.ndjson.gz`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BRONZE_BUCKET,
          Key: pageKey,
          Body: pageGzipped,
          ContentType: "application/x-ndjson",
          ContentEncoding: "gzip",
          Metadata: {
            "sync-run-id": runId,
            "record-count": String(records.length),
            "observed-at": observedAtIso,
          },
        })
      );

      totalRecords += records.length;
      totalGzippedBytes += pageGzipped.length;
      pages++;

      if (records.length === 0) break;
      pageUrl = nextPageUrl;

      // Throttle to stay under Spark's per-token rate cap (~30 req/min observed).
      // 2.5s between pages = 24 req/min, comfortably within budget.
      if (pageUrl) {
        await new Promise((r) => setTimeout(r, 2_500));
      }
    }

    console.log(
      `[active-snapshot] Pulled ${totalRecords} records across ${pages} pages in ${((Date.now() - startTime) / 1000).toFixed(1)}s`
    );

    // Freshness marker — final write signals completion.
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BRONZE_BUCKET,
        Key: FRESHNESS_KEY,
        Body: Buffer.from(
          JSON.stringify({
            last_snapshot_at: observedAtIso,
            record_count: totalRecords,
            run_id: runId,
            pages_fetched: pages,
            gzipped_bytes: totalGzippedBytes,
            duration_seconds: (Date.now() - startTime) / 1000,
          }),
          "utf-8"
        ),
        ContentType: "application/json",
        CacheControl: "no-cache",
      })
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `[active-snapshot] Wrote ${totalRecords} records (${(totalGzippedBytes / 1024 / 1024).toFixed(2)} MB gzipped across ${pages} pages) in ${duration}s`
    );

    // Emit observability metrics so a partial walk shows up on a CloudWatch alarm
    // before it shows up on the dashboard. Same namespace as bronze-reconcile.
    await cwClient.send(
      new PutMetricDataCommand({
        Namespace: "RLSIR/DataPipeline",
        MetricData: [
          { MetricName: "ActiveSnapshotPagesFetched", Value: pages, Unit: "Count", Timestamp: new Date() },
          { MetricName: "ActiveSnapshotRecords", Value: totalRecords, Unit: "Count", Timestamp: new Date() },
          { MetricName: "ActiveSnapshotDurationSeconds", Value: parseFloat(duration), Unit: "Seconds", Timestamp: new Date() },
          { MetricName: "ActiveSnapshotGzippedBytes", Value: totalGzippedBytes, Unit: "Bytes", Timestamp: new Date() },
        ],
      })
    ).catch((err) => {
      // CloudWatch failures are observability-only — don't fail the snapshot run.
      console.warn(`[active-snapshot] CloudWatch metric publish failed: ${err instanceof Error ? err.message : String(err)}`);
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        run_id: runId,
        records: totalRecords,
        pages,
        gzipped_bytes: totalGzippedBytes,
        duration_seconds: parseFloat(duration),
      }),
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[active-snapshot] FAILED: ${errMsg}`);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: errMsg,
        run_id: runId,
        duration_seconds: (Date.now() - startTime) / 1000,
      }),
    };
  }
}
