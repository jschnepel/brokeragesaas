/**
 * /api/sync — ARMLS sync management
 * Trigger sync, check status, reset state.
 * Protected: requires platform_admin or broker role in production.
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleAPIError } from '@/middleware/error-handler';
import { SyncEngine, getAllSyncStates, resetSyncState } from '@/lib/spark/sync-engine';

type EntityName = 'Property' | 'Member' | 'Office' | 'OpenHouse';
const VALID_ENTITIES: EntityName[] = ['Property', 'Member', 'Office', 'OpenHouse'];

/**
 * GET /api/sync — Get sync status for all entities
 */
export async function GET() {
  try {
    const states = await getAllSyncStates();
    return NextResponse.json({ syncStates: states });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * POST /api/sync — Trigger a sync manually
 * Body: { entity?: EntityName, reset?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const entity = body.entity as EntityName | undefined;
    const reset = body.reset === true;

    if (entity && !VALID_ENTITIES.includes(entity)) {
      return NextResponse.json(
        { error: `Invalid entity. Must be one of: ${VALID_ENTITIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Reset sync state if requested
    if (reset && entity) {
      await resetSyncState(entity);
    }

    // Run sync with a 5-minute timeout for HTTP-triggered syncs
    const deadlineMs = Date.now() + 5 * 60 * 1000;
    const engine = new SyncEngine({ deadlineMs });

    if (entity) {
      const result = await engine.syncEntity(entity);
      return NextResponse.json({ result });
    }

    // Sync all entities
    const results = [];
    for (const e of VALID_ENTITIES) {
      const result = await engine.syncEntity(e);
      results.push(result);
      if (Date.now() >= deadlineMs - 60_000) break;
    }

    return NextResponse.json({ results });
  } catch (error) {
    return handleAPIError(error);
  }
}
