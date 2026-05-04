/**
 * Bronze writer for the ARMLS sync Lambda.
 *
 * Writes each Spark API response page to S3 as gzipped NDJSON, partitioned
 * by sync_year/sync_month/sync_day/run_id, with provenance fields stamped
 * onto every row.
 *
 * Why NDJSON.gz instead of Parquet for v1:
 *   - Node 20 has zlib built-in; no new npm deps to bundle
 *   - DuckDB reads NDJSON natively via read_json_auto (fast at our scale)
 *   - Schema-flexible: new RESO fields show up automatically
 *   - Trivial to compact NDJSON → Parquet later if/when needed
 *
 * Output path:
 *   s3://rlsir-platform-assets-us-east-1/bronze/listings/
 *     sync_year=YYYY/sync_month=MM/sync_day=DD/run_id=<uuid>/page_NNNN.ndjson.gz
 *
 * Each line in the file is one JSON object: the full Spark response record
 * plus sync_run_id and sync_observed_at provenance fields.
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { gzip } from "zlib";
import { promisify } from "util";

const gzipAsync = promisify(gzip);

const BRONZE_BUCKET =
  process.env.BRONZE_BUCKET ?? "rlsir-platform-assets-us-east-1";
const BRONZE_PREFIX = process.env.BRONZE_PREFIX ?? "bronze/listings";

let s3: S3Client | null = null;
function getS3(): S3Client {
  if (!s3) s3 = new S3Client({ region: "us-east-1" });
  return s3;
}

/**
 * Write one page of records to S3. Idempotent at the file level —
 * repeated writes with the same (run_id, page_num) overwrite the same key.
 *
 * Returns metadata for logging; never throws (bronze write failures
 * MUST NOT break the legacy Postgres path during Phase 1).
 */
export async function writeBronzePage(
  records: Record<string, unknown>[],
  runId: string,
  pageNum: number,
  observedAt: Date = new Date()
): Promise<{
  ok: boolean;
  key?: string;
  bytes?: number;
  recordCount?: number;
  error?: string;
}> {
  if (records.length === 0) {
    return { ok: true, recordCount: 0 };
  }

  try {
    const observedAtIso = observedAt.toISOString();

    // Stamp provenance on each row, then NDJSON-encode (one JSON object per line).
    const ndjsonLines = records.map((r) =>
      JSON.stringify({
        ...r,
        sync_run_id: runId,
        sync_observed_at: observedAtIso,
      })
    );
    const ndjsonBuffer = Buffer.from(ndjsonLines.join("\n") + "\n", "utf-8");

    // Gzip — typically 5-7x compression on RESO Property JSON
    const gzipped = await gzipAsync(ndjsonBuffer);

    // Build partition path. UTC date so partitions don't shift across DST.
    const yyyy = observedAt.getUTCFullYear();
    const mm = String(observedAt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(observedAt.getUTCDate()).padStart(2, "0");
    const pageStr = String(pageNum).padStart(4, "0");

    const key = `${BRONZE_PREFIX}/sync_year=${yyyy}/sync_month=${mm}/sync_day=${dd}/run_id=${runId}/page_${pageStr}.ndjson.gz`;

    await getS3().send(
      new PutObjectCommand({
        Bucket: BRONZE_BUCKET,
        Key: key,
        Body: gzipped,
        ContentType: "application/x-ndjson",
        ContentEncoding: "gzip",
        // Custom metadata — readable via S3 ListObjectsV2 without decompressing
        Metadata: {
          "sync-run-id": runId,
          "page-num": String(pageNum),
          "record-count": String(records.length),
          "observed-at": observedAtIso,
        },
      })
    );

    // Update freshness marker for dbt source freshness check.
    // Best-effort — failures here don't fail the page write.
    try {
      const freshnessKey = `${BRONZE_PREFIX}/_freshness.json`;
      await getS3().send(
        new PutObjectCommand({
          Bucket: BRONZE_BUCKET,
          Key: freshnessKey,
          Body: Buffer.from(
            JSON.stringify({
              last_sync_at: observedAtIso,
              records_written: records.length,
              run_id: runId,
              page_num: pageNum,
            }),
            "utf-8"
          ),
          ContentType: "application/json",
          CacheControl: "no-cache",
        })
      );
    } catch (freshErr) {
      console.warn(
        `[bronze] freshness marker write failed (non-fatal): ${
          freshErr instanceof Error ? freshErr.message : String(freshErr)
        }`
      );
    }

    return {
      ok: true,
      key,
      bytes: gzipped.length,
      recordCount: records.length,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Log but never throw — bronze write must not break legacy Postgres path.
    console.error(
      `[bronze] Write failed for run_id=${runId} page=${pageNum}: ${msg}`
    );
    return { ok: false, error: msg };
  }
}

/**
 * Generate a stable UUIDv4 for a sync run.
 * Node 20 has crypto.randomUUID() built in — no extra dep.
 */
export function newRunId(): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("crypto").randomUUID();
}
