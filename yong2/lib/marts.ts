/**
 * Lakehouse mart reader (manifest-aware, Phase 4 of the always-warm CDN plan).
 *
 * Fetch path: yong2 → manifest.json → versioned parquet via CloudFront edge.
 *
 *   manifest.json (max-age=60, swr=3600) — tiny pointer, refreshes per minute
 *     ↓
 *   <mart>.<build_id>.parquet (immutable, pre-warmed by dbt Fargate task)
 *
 * The Fargate dbt task writes a new build_id each cycle, runs a CloudFront
 * warmer that pre-fetches every versioned URL (atomic publish gate — manifest
 * only commits if every URL is warm), then mirrors versioned → bare-named
 * paths for backward compat. yong2 reads through the manifest so the
 * versioned URL is always already-warm at the SSR Lambda's edge POP.
 *
 * Multi-layer fallback (in priority order):
 *   1. Latest manifest.json → versioned URL
 *   2. manifest.previous.json → versioned URL of prior cycle (if .json fails)
 *   3. Legacy bare-named path <mart>.parquet (if both manifests fail)
 *
 * Integrity: each parquet response's Content-Length is checked against
 * manifest.size_bytes — mismatch logs + falls back. SHA verification is
 * skipped at read time (would force reading the body twice); the Fargate
 * warmer's atomic gate is the integrity guarantee.
 *
 * Usage:
 *   const rows = await readMart<MarketPulseRow>('fct_market_pulse_metro');
 */

import { parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';

// CloudFront distribution E3JUA9RU5MGWQV → S3 analytics/* (public read).
// Override via env if migrating to a custom domain (e.g. marts.yong-choi.com).
const CDN_BASE =
  process.env.NEXT_PUBLIC_MARTS_CDN_BASE
  ?? 'https://d12v6de1xwcjhk.cloudfront.net';

// Versioned parquet URLs are immutable (build_id-stamped), so cache decoded
// rows for 24h per Lambda lifecycle. Stale rows from a prior build are still
// valid — the manifest has been updated by then so subsequent reads will
// resolve to the new URL and re-decode automatically.
const ROW_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// Manifest cache matches the S3 Cache-Control: max-age=60.
const MANIFEST_CACHE_TTL_MS = 60 * 1000;

interface ManifestEntry {
  url: string;
  sha256: string;
  size_bytes: number;
}

interface Manifest {
  schema_version: number;
  build_id: string;
  generated_at: string;
  previous_build_id: string | null;
  marts: Record<string, ManifestEntry>;
}

interface ManifestCacheEntry {
  manifest: Manifest;
  fetchedAt: number;
}

const manifestCache: { current?: ManifestCacheEntry; previous?: ManifestCacheEntry } = {};
const rowCache = new Map<string, { rows: unknown[]; fetchedAt: number; sourceUrl: string }>();

async function fetchManifest(name: 'manifest' | 'manifest.previous'): Promise<Manifest> {
  const url = `${CDN_BASE}/${name}.json`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`manifest fetch failed: ${url} → HTTP ${res.status}`);
  }
  const json = (await res.json()) as Manifest;
  if (json.schema_version !== 1 || !json.marts) {
    throw new Error(`manifest schema invalid: version=${json.schema_version}`);
  }
  return json;
}

async function readManifest(): Promise<Manifest | null> {
  const now = Date.now();
  if (manifestCache.current && now - manifestCache.current.fetchedAt < MANIFEST_CACHE_TTL_MS) {
    return manifestCache.current.manifest;
  }
  try {
    const m = await fetchManifest('manifest');
    manifestCache.current = { manifest: m, fetchedAt: now };
    return m;
  } catch (err) {
    // Try the prior-cycle manifest as fallback layer 2.
    if (manifestCache.previous && now - manifestCache.previous.fetchedAt < MANIFEST_CACHE_TTL_MS) {
      return manifestCache.previous.manifest;
    }
    try {
      const m = await fetchManifest('manifest.previous');
      manifestCache.previous = { manifest: m, fetchedAt: now };
      console.warn('[marts] primary manifest failed, using manifest.previous:', err);
      return m;
    } catch (err2) {
      console.warn('[marts] both manifests unreachable, falling back to bare paths:', err2);
      return null;
    }
  }
}

async function fetchParquetBuffer(url: string, expectedSize?: number): Promise<ArrayBuffer> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`mart fetch failed: ${url} → HTTP ${res.status}`);
  }
  const buf = await res.arrayBuffer();
  // Integrity check: if manifest gave us an expected size, verify Content-Length.
  // Mismatch = upstream object replaced mid-cycle or partial response. Caller
  // catches and falls through to legacy bare path.
  if (expectedSize !== undefined && buf.byteLength !== expectedSize) {
    throw new Error(
      `mart size mismatch: ${url} got ${buf.byteLength} bytes, manifest says ${expectedSize}`,
    );
  }
  return buf;
}

export async function readMart<T = Record<string, unknown>>(
  martName: string,
): Promise<T[]> {
  // In-process cache hit short-circuits everything — versioned URLs are
  // immutable, so a 24h TTL is safe (and the manifest's own TTL means we
  // won't re-resolve to a stale URL for more than 60 seconds anyway).
  const hit = rowCache.get(martName);
  if (hit && Date.now() - hit.fetchedAt < ROW_CACHE_TTL_MS) {
    return hit.rows as T[];
  }

  // Layer 1+2: try to resolve via manifest (current → previous fallback in readManifest).
  const manifest = await readManifest();
  let buf: ArrayBuffer | null = null;
  let sourceUrl = '';

  if (manifest && manifest.marts[martName]) {
    const entry = manifest.marts[martName];
    sourceUrl = `${CDN_BASE}/${entry.url}`;
    try {
      buf = await fetchParquetBuffer(sourceUrl, entry.size_bytes);
    } catch (err) {
      console.warn(`[marts] manifest path failed for ${martName}, falling back:`, err);
      buf = null;
    }
  }

  // Layer 3: legacy bare-named fallback. Same path the pre-Phase-4 reader used.
  if (buf === null) {
    sourceUrl = `${CDN_BASE}/${martName}.parquet`;
    buf = await fetchParquetBuffer(sourceUrl);
  }

  const rows = (await parquetReadObjects({ file: buf, compressors })) as T[];
  rowCache.set(martName, { rows, fetchedAt: Date.now(), sourceUrl });
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
