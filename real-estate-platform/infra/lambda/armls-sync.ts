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

interface LambdaEvent {
  /** Which entity to sync. If omitted, syncs all in order. */
  entity?: 'Property' | 'Member' | 'Office' | 'OpenHouse';
  /** Force a fresh sync from the beginning */
  resetState?: boolean;
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

    const summary = {
      duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      totalPages,
      totalRecords,
      allCompleted,
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
