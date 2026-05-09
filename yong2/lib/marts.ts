/**
 * Lakehouse mart reader. Fetches Parquet files from S3 (the dbt-built
 * analytics marts) and returns rows as typed objects.
 *
 * S3 prefix `s3://rlsir-platform-assets-us-east-1/analytics/*` is publicly
 * readable (bucket policy 'PublicReadAnalyticsMartsOnly') so we GET via
 * plain HTTPS — no AWS SDK, no IAM role, works identically in Node + browser.
 * Other prefixes (bronze/, etc.) remain private.
 *
 * Trade-off: the marts are aggregate market stats (counts, medians, $/sqft),
 * not raw listings. Already publishable per IDX rules. Public access lets
 * us drop the AWS SDK entirely and ship a smaller Lambda bundle.
 *
 * Cache: each mart Parquet is fetched once per process and held in
 * module-level memory. Next.js route caching + ISR layer on top.
 *
 * Usage:
 *   const rows = await readMart<MarketPulseRow>('fct_market_pulse_metro');
 *   const metro = rows.filter(r => r.scope_key === 'phoenix_metro');
 */

import { parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';

const PUBLIC_BASE = 'https://rlsir-platform-assets-us-east-1.s3.us-east-1.amazonaws.com/analytics';

const cache = new Map<string, { rows: unknown[]; fetchedAt: number }>();
const TTL_MS = 60 * 60 * 1000; // 1h — matches dbt schedule

async function fetchParquetBuffer(martName: string): Promise<ArrayBuffer> {
  const url = `${PUBLIC_BASE}/${martName}.parquet`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`mart fetch failed: ${url} → HTTP ${res.status}`);
  }
  return res.arrayBuffer();
}

export async function readMart<T = Record<string, unknown>>(
  martName: string,
): Promise<T[]> {
  const hit = cache.get(martName);
  if (hit && Date.now() - hit.fetchedAt < TTL_MS) {
    return hit.rows as T[];
  }
  const buf = await fetchParquetBuffer(martName);
  const rows = (await parquetReadObjects({ file: buf, compressors })) as T[];
  cache.set(martName, { rows, fetchedAt: Date.now() });
  return rows;
}

/**
 * Read a per-scope split of a mart: `{martBase}_{scope_type}.parquet`.
 *
 * Each scope_type lives in its own Parquet file so cold-fetches stay small.
 * Falls back to the unified `{martBase}.parquet` if the per-scope file
 * doesn't exist (e.g. mart hasn't been split yet).
 */
export async function readMartByScope<T = Record<string, unknown>>(
  martBase: string,
  scopeType: ScopeType,
): Promise<T[]> {
  try {
    return await readMart<T>(`${martBase}_${scopeType}`);
  } catch (err) {
    // Fallback to unified mart if per-scope file doesn't exist (older marts).
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('HTTP 403') || msg.includes('HTTP 404') || msg.includes('NoSuchKey')) {
      return readMart<T>(martBase);
    }
    throw err;
  }
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
