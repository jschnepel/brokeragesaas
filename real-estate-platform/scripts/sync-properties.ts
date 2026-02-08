/**
 * Property Sync Script
 *
 * Syncs properties from MLS sources to local database.
 * Run via: npx ts-node scripts/sync-properties.ts
 */

import { createMLSAdapter, getMLSConfigFromEnv } from '../apps/backend/src/lib/mls/factory';
import { query } from '../packages/database/src/client';

interface SyncOptions {
  agentId: string;
  mlsType: 'armls' | 'bridge' | 'manual';
  dryRun?: boolean;
}

async function syncProperties(options: SyncOptions) {
  const { agentId, mlsType, dryRun = false } = options;

  console.log(`Starting property sync for agent: ${agentId}`);
  console.log(`MLS Type: ${mlsType}`);
  console.log(`Dry Run: ${dryRun}`);

  const config = getMLSConfigFromEnv(mlsType);
  const adapter = createMLSAdapter(config, agentId);

  // Test connection
  const connected = await adapter.testConnection();
  if (!connected) {
    throw new Error('Failed to connect to MLS');
  }
  console.log('Connected to MLS');

  // Fetch properties
  const properties = await adapter.fetchProperties({ limit: 100 });
  console.log(`Fetched ${properties.length} properties`);

  if (dryRun) {
    console.log('Dry run - no changes made');
    return;
  }

  // Upsert properties
  for (const property of properties) {
    await query(
      `INSERT INTO properties (
        agent_id, external_id, data_source, address, city, state, zip,
        price, beds, baths, sqft, status, description, photos, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (agent_id, external_id, data_source)
      DO UPDATE SET
        price = EXCLUDED.price,
        status = EXCLUDED.status,
        photos = EXCLUDED.photos,
        raw_data = EXCLUDED.raw_data,
        updated_at = CURRENT_TIMESTAMP`,
      [
        agentId,
        property.external_id,
        property.data_source,
        property.address,
        property.city,
        property.state,
        property.zip,
        property.price,
        property.beds,
        property.baths,
        property.sqft,
        property.status,
        property.description,
        JSON.stringify(property.photos),
        JSON.stringify(property.raw_data),
      ]
    );
  }

  console.log(`Synced ${properties.length} properties`);
}

// CLI entry point
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: npx ts-node scripts/sync-properties.ts <agent-id> <mls-type> [--dry-run]');
  process.exit(1);
}

syncProperties({
  agentId: args[0],
  mlsType: args[1] as 'armls' | 'bridge' | 'manual',
  dryRun: args.includes('--dry-run'),
}).catch(console.error);
