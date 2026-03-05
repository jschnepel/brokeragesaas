/**
 * /api/health — System health check
 * Checks Neon, RDS, and sync status.
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { rdsQuery } from '@platform/database';
import { getAllSyncStates } from '@/lib/spark/sync-engine';

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  // Check Neon
  try {
    const result = await query('SELECT 1 as ok');
    checks.neon = { status: 'ok', connected: result.rows.length > 0 };
  } catch (err) {
    checks.neon = { status: 'error', error: err instanceof Error ? err.message : String(err) };
  }

  // Check RDS
  try {
    const result = await rdsQuery('SELECT 1 as ok');
    checks.rds = { status: 'ok', connected: result.rows.length > 0 };
  } catch (err) {
    checks.rds = { status: 'error', error: err instanceof Error ? err.message : String(err) };
  }

  // Check listing counts on RDS
  try {
    const result = await rdsQuery<{ count: string }>(
      'SELECT COUNT(*) as count FROM listing_records WHERE is_deleted = FALSE'
    );
    checks.listings = { count: parseInt(result.rows[0].count, 10) };
  } catch (err) {
    checks.listings = { status: 'error', error: err instanceof Error ? err.message : String(err) };
  }

  // Check sync status
  try {
    const states = await getAllSyncStates();
    checks.sync = states.map(s => ({
      entity: s.entity_name,
      status: s.last_sync_status,
      lastCompleted: s.last_sync_completed,
      totalSynced: s.total_records_synced,
      initialPullComplete: s.initial_pull_complete,
    }));
  } catch (err) {
    checks.sync = { status: 'error', error: err instanceof Error ? err.message : String(err) };
  }

  const allOk = checks.neon && (checks.neon as Record<string, unknown>).status === 'ok'
    && checks.rds && (checks.rds as Record<string, unknown>).status === 'ok';

  return NextResponse.json(checks, { status: allOk ? 200 : 503 });
}
