/**
 * Lakehouse mart reader. Fetches Parquet files via CloudFront (edge-cached)
 * and returns rows as typed objects.
 *
 * Fetch path: yong2 → CloudFront edge → S3 analytics/* (public).
 * - CloudFront caches each parquet for 1h (matches dbt schedule).
 * - S3 prefix `analytics/*` is publicly readable (bucket policy
 *   'PublicReadAnalyticsMartsOnly'); other prefixes (bronze/, etc.) stay
 *   private.
 * - The marts are aggregate market stats (counts, medians, $/sqft), not
 *   raw listings — publishable per IDX rules.
 *
 * No in-process cache: CloudFront + Next.js fetch cache + Next ISR own all
 * caching. Keeps Lambda memory low and a single source of truth.
 *
 * Usage:
 *   const rows = await readMart<MarketPulseRow>('fct_market_pulse_metro');
 *   const metro = rows.filter(r => r.scope_key === 'phoenix_metro');
 */

import { parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';

// CloudFront distribution E3JUA9RU5MGWQV → S3 analytics/* (1h TTL).
// Override via env if migrating to a custom domain (e.g. marts.yongchoi.com).
const CDN_BASE =
  process.env.NEXT_PUBLIC_MARTS_CDN_BASE
  ?? 'https://d12v6de1xwcjhk.cloudfront.net';

async function fetchParquetBuffer(martName: string): Promise<ArrayBuffer> {
  const url = `${CDN_BASE}/${martName}.parquet`;
  // `next: { revalidate }` lets Next.js's data cache layer dedupe + edge-cache
  // the bytes for 1h. Combined with CloudFront, we get effectively two cache
  // tiers: edge bytes (CloudFront) + decoded rows (Next data cache).
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`mart fetch failed: ${url} → HTTP ${res.status}`);
  }
  return res.arrayBuffer();
}

export async function readMart<T = Record<string, unknown>>(
  martName: string,
): Promise<T[]> {
  const buf = await fetchParquetBuffer(martName);
  const rows = (await parquetReadObjects({ file: buf, compressors })) as T[];
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
