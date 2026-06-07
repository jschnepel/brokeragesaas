/**
 * ARMLS Sync Lambda Worker
 * Triggered by EventBridge on a schedule.
 * Uses 15-minute timeout with checkpoint pattern — saves skiptoken
 * every 100 pages so the next invocation can resume.
 *
 * EventBridge rule fires every 15 minutes during initial pull,
 * then every 4 hours for ongoing sync (IDX requires ≤12h refresh).
 */

import { SyncEngine, getAllSyncStates, syncPhotos } from '../../apps/backend/src/lib/spark/sync-engine';
import { rdsQuery } from '@platform/database';
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';

interface LambdaEvent {
  /**
   * Sync mode:
   *   - "delta" (default) — incremental sync via $skiptoken; touches only modified rows
   *   - "actives_refresh" — full Active+AUC re-fetch to bump last_synced_at for ARMLS
   *                        12h compliance. Walks Spark filtered to Active+AUC.
   *                        Doesn't disturb the delta sync's checkpoint.
   */
  mode?: 'delta' | 'actives_refresh';
  /** Which entity to sync (delta mode only). If omitted, syncs all in order. */
  entity?: 'Property' | 'Member' | 'Office' | 'OpenHouse';
  /** Force a fresh sync from the beginning (delta mode only) */
  resetState?: boolean;
}

const cwClient = new CloudWatchClient({ region: 'us-east-1' });

async function emitMetric(name: string, value: number, unit: 'Count' | 'Seconds' = 'Count'): Promise<void> {
  try {
    await cwClient.send(
      new PutMetricDataCommand({
        Namespace: 'RLSIR/DataPipeline',
        MetricData: [{
          MetricName: name,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
        }],
      })
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[metric] ${name} publish failed: ${msg}`);
  }
}

interface LambdaContext {
  getRemainingTimeInMillis(): number;
  functionName: string;
  memoryLimitInMB: string;
  logGroupName: string;
  logStreamName: string;
  awsRequestId: string;
}

interface SyncResult {
  entity: string;
  pagesProcessed: number;
  recordsUpserted: number;
  completed: boolean;
  error?: string;
}

const ENTITY_ORDER: Array<'Property' | 'Member' | 'Office' | 'OpenHouse'> = [
  'Property',
  'Member',
  'Office',
  'OpenHouse',
];

export async function handler(
  event: LambdaEvent,
  context: LambdaContext
): Promise<{ statusCode: number; body: string }> {
  const startTime = Date.now();
  const deadlineMs = startTime + context.getRemainingTimeInMillis();

  console.log(`ARMLS sync starting. Event: ${JSON.stringify(event)}`);
  console.log(`Time budget: ${context.getRemainingTimeInMillis()}ms`);

  const engine = new SyncEngine({ deadlineMs });

  // ── Mode 2: actives_refresh — ARMLS 12h compliance path ──────────────────
  // Re-fetches every Active+AUC listing from Spark and UPSERTs to bump
  // last_synced_at. Doesn't run the delta sync, doesn't touch the checkpoint.
  if (event.mode === 'actives_refresh') {
    console.log('[actives_refresh] Re-fetching all Active+AUC listings');
    const result = await engine.refreshActives();
    const staleCount = await engine.countStaleActives(12);

    await emitMetric('ActivesRefreshPagesProcessed', result.pagesProcessed);
    await emitMetric('ActivesRefreshRecordsUpserted', result.recordsUpserted);
    await emitMetric('ActivesStaleOver12h', staleCount);

    const summary = {
      mode: 'actives_refresh',
      duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      pagesProcessed: result.pagesProcessed,
      recordsUpserted: result.recordsUpserted,
      completed: result.completed,
      activesStaleOver12h: staleCount,
      error: result.error,
    };
    console.log(`[actives_refresh] complete: ${JSON.stringify(summary)}`);

    return {
      statusCode: result.error ? 500 : 200,
      body: JSON.stringify(summary),
    };
  }

  // ── Mode 1: delta sync (default) ─────────────────────────────────────────
  const results: SyncResult[] = [];

  try {
    // If specific entity requested, sync just that one
    if (event.entity) {
      const result = await engine.syncEntity(event.entity);
      results.push(result);
    } else {
      // Sync all entities in order — Property first (largest), then supporting entities
      // Check sync state to prioritize entities that haven't completed initial pull
      const states = await getAllSyncStates();

      for (const entity of ENTITY_ORDER) {
        const state = states.find(s => s.entity_name === entity);

        // Skip entities that are already fully synced and completed recently
        // (during initial pull, we want to focus on Property first)
        if (state?.initial_pull_complete && state.last_sync_status !== 'error') {
          // For ongoing sync, still process but it'll be fast (delta only)
        }

        const result = await engine.syncEntity(entity);
        results.push(result);

        // If we're running low on time, stop after this entity
        if (Date.now() >= deadlineMs - 120_000) {
          console.log(`Time running low, stopping after ${entity}`);
          break;
        }
      }
    }

    // After property sync, fetch photos for new listings if time permits
    let photoResult = { listingsProcessed: 0, photosInserted: 0, errors: 0 };
    if (Date.now() < deadlineMs - 120_000) {
      photoResult = await syncPhotos({
        limit: 100,
        deadlineMs,
      });
      console.log(`Photo sync: ${photoResult.listingsProcessed} listings, ${photoResult.photosInserted} photos, ${photoResult.errors} errors`);
    }

    const totalRecords = results.reduce((sum, r) => sum + r.recordsUpserted, 0);
    const totalPages = results.reduce((sum, r) => sum + r.pagesProcessed, 0);
    const allCompleted = results.every(r => r.completed);
    const errors = results.filter(r => r.error);

    // Refresh materialized views after successful sync
    // Order matters: analytics_base first (no CONCURRENTLY — no unique index),
    // then mv_supply_demand before mv_absorption (absorption reads from it),
    // then remaining MVs concurrently.
    const REFRESH_ORDER = [
      'REFRESH MATERIALIZED VIEW analytics_base',
      // Capture today's active-inventory snapshot before mv_dashboard reads it.
      // Idempotent on (snapshot_date, scope_type, scope_key, property_segment).
      `INSERT INTO active_inventory_snapshots (
         snapshot_date, scope_type, scope_key, property_segment,
         active_count, active_auc_count, pending_count
       )
       SELECT CURRENT_DATE, sc.scope_type, sc.scope_key, sc.property_segment,
              COUNT(*) FILTER (WHERE ab.standard_status = 'Active'),
              COUNT(*) FILTER (WHERE ab.standard_status IN ('Active','Active Under Contract')),
              COUNT(*) FILTER (WHERE ab.standard_status = 'Pending')
       FROM analytics_base ab
       CROSS JOIN LATERAL (VALUES
         ('metro'::TEXT, 'phoenix_metro'::TEXT, 'all'::TEXT, TRUE),
         ('metro', 'phoenix_metro', 'residential', ab.property_segment = 'residential'),
         ('metro', 'phoenix_metro', 'land', ab.property_segment = 'land'),
         ('region', ab.region_slug, 'all', ab.region_slug IS NOT NULL),
         ('region', ab.region_slug, 'residential', ab.region_slug IS NOT NULL AND ab.property_segment = 'residential'),
         ('community', ab.community_slug, 'all', ab.community_slug IS NOT NULL)
       ) AS sc(scope_type, scope_key, property_segment, included)
       WHERE sc.included
       GROUP BY sc.scope_type, sc.scope_key, sc.property_segment
       ON CONFLICT (snapshot_date, scope_type, scope_key, property_segment) DO UPDATE
         SET active_count = EXCLUDED.active_count,
             active_auc_count = EXCLUDED.active_auc_count,
             pending_count = EXCLUDED.pending_count,
             recorded_at = NOW()`,
      'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_supply_demand',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_market_pulse',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_absorption',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_price_bands',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_negotiation',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_inventory_age',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_community_scorecard',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_community_yoy',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard',
    ] as const;

    let viewsRefreshed = false;
    if (errors.length === 0 && Date.now() < deadlineMs - 120_000) {
      try {
        console.log('Refreshing analytics views (10 MVs)...');
        const refreshStart = Date.now();
        for (const stmt of REFRESH_ORDER) {
          const mvStart = Date.now();
          await rdsQuery(stmt);
          console.log(`  ${stmt} — ${((Date.now() - mvStart) / 1000).toFixed(1)}s`);
        }
        console.log(`All analytics views refreshed in ${((Date.now() - refreshStart) / 1000).toFixed(1)}s`);
        viewsRefreshed = true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`View refresh failed (non-fatal): ${msg}`);
      }
    } else if (errors.length > 0) {
      console.log('Skipping view refresh due to sync errors');
    } else {
      console.log('Skipping view refresh — insufficient time remaining');
    }

    const summary = {
      duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      totalPages,
      totalRecords,
      allCompleted,
      viewsRefreshed,
      entities: results.map(r => ({
        entity: r.entity,
        pages: r.pagesProcessed,
        records: r.recordsUpserted,
        completed: r.completed,
        error: r.error,
      })),
    };

    console.log(`Sync complete: ${JSON.stringify(summary)}`);

    return {
      statusCode: errors.length > 0 ? 207 : 200,
      body: JSON.stringify(summary),
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Sync fatal error: ${errorMsg}`);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: errorMsg,
        duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
        partialResults: results,
      }),
    };
  }
}
