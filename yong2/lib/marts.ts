/**
 * Lakehouse mart reader. Fetches Parquet files from S3 (the dbt-built
 * analytics marts) and returns rows as typed objects.
 *
 * Runs server-side (Node.js). For local dev the AWS SDK auto-discovers
 * credentials from ~/.aws/credentials. For Amplify SSR Lambda, the
 * function's IAM role needs `s3:GetObject` on
 * `arn:aws:s3:::rlsir-platform-assets-us-east-1/analytics/*`.
 *
 * Cache: each mart Parquet is fetched once per process and held in
 * module-level memory. Next.js route caching + ISR layer on top.
 *
 * Usage:
 *   const rows = await readMart<MarketPulseRow>('fct_market_pulse');
 *   const metro = rows.filter(r => r.scope_type === 'metro' && r.scope_key === 'phoenix_metro');
 */

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';

const BUCKET = 'rlsir-platform-assets-us-east-1';
const REGION = 'us-east-1';

const s3 = new S3Client({ region: REGION });

const cache = new Map<string, { rows: unknown[]; fetchedAt: number }>();
const TTL_MS = 60 * 60 * 1000; // 1h — matches dbt schedule

async function fetchParquetBuffer(key: string): Promise<ArrayBuffer> {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  if (!res.Body) throw new Error(`empty body for s3://${BUCKET}/${key}`);
  const bytes = await res.Body.transformToByteArray();
  // transformToByteArray returns Uint8Array; slice to get an ArrayBuffer
  // hyparquet needs a real ArrayBuffer, not a Buffer/SharedArrayBuffer.
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export async function readMart<T = Record<string, unknown>>(
  martName: string,
): Promise<T[]> {
  const key = `analytics/${martName}.parquet`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.fetchedAt < TTL_MS) {
    return hit.rows as T[];
  }
  const buf = await fetchParquetBuffer(key);
  const rows = (await parquetReadObjects({ file: buf, compressors })) as T[];
  cache.set(key, { rows, fetchedAt: Date.now() });
  return rows;
}

export type ScopeType = 'metro' | 'region' | 'community' | 'subdivision' | 'zipcode';
export type PropertySegment = 'all' | 'residential' | 'land';

export interface ScopeFilter {
  scope_type: ScopeType;
  scope_key: string;
  property_segment: PropertySegment;
}

/** Row shapes — generated from dbt mart schemas. */
export interface MarketPulseRow extends ScopeFilter {
  market_pulse_id: string;
  month: string;
  closing_count: number | null;
  median_close: number | null;
  median_ppsf: number | null;
  median_dom: number | null;
  p10_close: number | null;
  p90_close: number | null;
  total_volume: number | null;
  median_close_3mo: number | null;
  sample_12mo: number | null;
  confidence: 'none' | 'very_low' | 'low' | 'medium' | 'high' | null;
}

export interface ActiveInventoryRow extends ScopeFilter {
  active_inventory_id: string;
  active_count: number | null;
  strict_active_count: number | null;
  pending_count: number | null;
  coming_soon_count: number | null;
  median_list_price: number | null;
  median_ppsf: number | null;
  mean_list_price: number | null;
  median_dom: number | null;
  mean_dom: number | null;
  total_list_volume: number | null;
  confidence: string | null;
}

/** Fast scope-key lookup helper. */
export function filterScope<T extends ScopeFilter>(
  rows: T[],
  filter: ScopeFilter,
): T[] {
  return rows.filter(
    (r) =>
      r.scope_type === filter.scope_type &&
      r.scope_key === filter.scope_key &&
      r.property_segment === filter.property_segment,
  );
}
