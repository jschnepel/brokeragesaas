/**
 * ARMLS Sync Engine
 * Orchestrates replication: fetches pages from Spark, maps fields,
 * upserts into RDS, and checkpoints progress for Lambda resume.
 */

import { rdsQuery, getRdsClient } from '@platform/database';
import type { PoolClient } from 'pg';
import { SparkReplicationClient } from './client';
import {
  mapPropertyRecord,
  mapMemberRecord,
  mapOfficeRecord,
  mapOpenHouseRecord,
} from './field-mapper';
import type { MappedListing } from './field-mapper';

type EntityName = 'Property' | 'Member' | 'Office' | 'OpenHouse';

interface SyncState {
  entity_name: string;
  last_skip_token: string | null;
  last_sync_started: string | null;
  last_sync_completed: string | null;
  last_sync_record_count: number;
  last_sync_status: string;
  last_sync_error: string | null;
  total_records_synced: string;
  initial_pull_complete: boolean;
}

interface SyncResult {
  entity: EntityName;
  pagesProcessed: number;
  recordsUpserted: number;
  lastSkipToken: string | null;
  completed: boolean;
  error?: string;
}

/** How often to checkpoint (save skiptoken) — every N pages */
const CHECKPOINT_INTERVAL = 100;

/** Safety margin before Lambda timeout (ms) — stop 60s before deadline */
const TIMEOUT_SAFETY_MARGIN_MS = 60_000;

export class SyncEngine {
  private client: SparkReplicationClient;
  private deadlineMs: number | null;

  constructor(options?: { deadlineMs?: number }) {
    this.client = new SparkReplicationClient();
    this.deadlineMs = options?.deadlineMs ?? null;
  }

  /**
   * Run sync for an entity. Resumes from last checkpoint if available.
   * Stops gracefully before Lambda timeout.
   */
  async syncEntity(entity: EntityName): Promise<SyncResult> {
    const state = await this.getSyncState(entity);

    // Mark sync as running
    await this.updateSyncState(entity, {
      last_sync_status: 'running',
      last_sync_started: new Date().toISOString(),
      last_sync_error: null,
    });

    let pagesProcessed = 0;
    let recordsUpserted = 0;
    let lastSkipToken = state.last_skip_token;
    let prevSkipToken = state.last_skip_token;
    let completed = false;

    try {
      const paginator = this.client.paginateEntity(entity, state.last_skip_token);

      for await (const page of paginator) {
        // Check if we're running out of time
        if (this.isNearDeadline()) {
          await this.checkpoint(entity, lastSkipToken, pagesProcessed, recordsUpserted, false);
          return {
            entity,
            pagesProcessed,
            recordsUpserted,
            lastSkipToken,
            completed: false,
          };
        }

        // Map and upsert records
        const count = await this.upsertPage(entity, page.records);
        recordsUpserted += count;
        pagesProcessed++;

        // Track the last non-null skiptoken for delta resume
        if (page.skipToken) {
          prevSkipToken = page.skipToken;
        }
        lastSkipToken = page.skipToken;

        // Periodic checkpoint
        if (pagesProcessed % CHECKPOINT_INTERVAL === 0) {
          await this.checkpoint(entity, lastSkipToken, pagesProcessed, recordsUpserted, false);
        }
      }

      // Feed exhausted — save the last valid skiptoken for delta resume.
      // Next invocation resumes from here and only gets modified records.
      completed = true;
      await this.checkpoint(entity, prevSkipToken, pagesProcessed, recordsUpserted, true);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      await this.updateSyncState(entity, {
        last_sync_status: 'error',
        last_sync_error: errorMsg,
        last_skip_token: lastSkipToken,
      });

      return {
        entity,
        pagesProcessed,
        recordsUpserted,
        lastSkipToken,
        completed: false,
        error: errorMsg,
      };
    }

    return {
      entity,
      pagesProcessed,
      recordsUpserted,
      lastSkipToken,
      completed,
    };
  }

  /**
   * Upsert a page of records into RDS.
   * Returns the number of records upserted.
   */
  private async upsertPage(entity: EntityName, records: Record<string, unknown>[]): Promise<number> {
    if (records.length === 0) return 0;

    const client = await getRdsClient();
    try {
      await client.query('BEGIN');

      for (const raw of records) {
        await this.upsertRecord(client, entity, raw);
      }

      await client.query('COMMIT');
      return records.length;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Upsert a single record based on entity type.
   */
  private async upsertRecord(
    client: PoolClient,
    entity: EntityName,
    raw: Record<string, unknown>
  ): Promise<void> {
    let mapped: MappedListing;
    let table: string;
    let uniqueKey: string;

    switch (entity) {
      case 'Property':
        mapped = mapPropertyRecord(raw);
        table = 'listing_records';
        uniqueKey = 'listing_key';
        break;
      case 'Member':
        mapped = mapMemberRecord(raw);
        table = 'listing_members';
        uniqueKey = 'member_key';
        break;
      case 'Office':
        mapped = mapOfficeRecord(raw);
        table = 'listing_offices';
        uniqueKey = 'office_key';
        break;
      case 'OpenHouse':
        mapped = mapOpenHouseRecord(raw);
        table = 'listing_open_houses';
        uniqueKey = 'open_house_key';
        break;
    }

    // Add raw_data and last_synced_at
    mapped.columns.raw_data = JSON.stringify(mapped.rawData);
    mapped.columns.last_synced_at = new Date().toISOString();

    const columns = Object.keys(mapped.columns);
    const values = Object.values(mapped.columns);
    const placeholders = columns.map((_, i) => `$${i + 1}`);

    // Build ON CONFLICT UPDATE — update all columns except the unique key
    const updateCols = columns
      .filter(c => c !== uniqueKey && c !== 'id' && c !== 'first_synced_at')
      .map(c => `${c} = EXCLUDED.${c}`)
      .join(', ');

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      ON CONFLICT (${uniqueKey}) DO UPDATE SET ${updateCols}
    `;

    await client.query(sql, values);
  }

  /**
   * Save checkpoint: skiptoken + progress counters.
   */
  private async checkpoint(
    entity: EntityName,
    skipToken: string | null,
    _pages: number,
    records: number,
    completed: boolean
  ): Promise<void> {
    // On completion, KEEP the skiptoken — next sync resumes from here
    // for delta mode (only records modified since this cursor).
    // Only resetSyncState() should null out the skiptoken (full re-pull).
    await rdsQuery(
      `UPDATE listing_sync_state
       SET last_skip_token = $1,
           last_sync_record_count = $2,
           last_sync_status = $3,
           last_sync_completed = $4,
           initial_pull_complete = CASE WHEN $5 THEN TRUE ELSE initial_pull_complete END,
           total_records_synced = total_records_synced + $6
       WHERE entity_name = $7`,
      [
        skipToken,
        records,
        completed ? 'completed' : 'running',
        completed ? new Date().toISOString() : null,
        completed,
        records,
        entity,
      ]
    );
  }

  /**
   * Check if we're approaching the Lambda timeout deadline.
   */
  private isNearDeadline(): boolean {
    if (!this.deadlineMs) return false;
    return Date.now() >= this.deadlineMs - TIMEOUT_SAFETY_MARGIN_MS;
  }

  /**
   * Get current sync state for an entity.
   */
  private async getSyncState(entity: EntityName): Promise<SyncState> {
    const result = await rdsQuery<SyncState>(
      'SELECT * FROM listing_sync_state WHERE entity_name = $1',
      [entity]
    );
    if (result.rows.length === 0) {
      throw new Error(`No sync state found for entity: ${entity}`);
    }
    return result.rows[0];
  }

  /**
   * Update sync state fields.
   */
  private async updateSyncState(
    entity: EntityName,
    updates: Record<string, unknown>
  ): Promise<void> {
    const entries = Object.entries(updates);
    const sets = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
    const values = entries.map(([, val]) => val);

    await rdsQuery(
      `UPDATE listing_sync_state SET ${sets} WHERE entity_name = $1`,
      [entity, ...values]
    );
  }
}

/**
 * Get sync status for all entities.
 */
export async function getAllSyncStates(): Promise<SyncState[]> {
  const result = await rdsQuery<SyncState>(
    'SELECT * FROM listing_sync_state ORDER BY entity_name'
  );
  return result.rows;
}

/**
 * Reset sync state for an entity (for re-sync from scratch).
 * This is the ONLY way to null out the skiptoken — forces full re-pull.
 */
export async function resetSyncState(entity: EntityName): Promise<void> {
  await rdsQuery(
    `UPDATE listing_sync_state
     SET last_skip_token = NULL,
         last_sync_started = NULL,
         last_sync_completed = NULL,
         last_sync_record_count = 0,
         last_sync_status = 'idle',
         last_sync_error = NULL,
         total_records_synced = 0,
         initial_pull_complete = FALSE
     WHERE entity_name = $1`,
    [entity]
  );
}

/**
 * Mark stale listings as deleted.
 * Any active listing not seen (last_synced_at) in the given number of hours
 * is likely off-market or removed from the feed.
 * Run daily after a successful full delta sync.
 */
export async function markStaleListings(staleHours = 48): Promise<number> {
  const result = await rdsQuery(
    `UPDATE listing_records
     SET is_deleted = TRUE,
         standard_status = 'Withdrawn'
     WHERE is_deleted = FALSE
       AND standard_status IN ('Active', 'Active Under Contract', 'Coming Soon', 'Pending')
       AND last_synced_at < NOW() - INTERVAL '1 hour' * $1
     RETURNING listing_key`,
    [staleHours]
  );
  return result.rowCount ?? 0;
}
