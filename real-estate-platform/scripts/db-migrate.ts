/**
 * Database Migration Script
 *
 * Runs database migrations in order.
 * Run via: npx ts-node scripts/db-migrate.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { query, pool } from '../packages/database/src/client';

const MIGRATIONS_DIR = path.join(__dirname, '../packages/database/src/migrations');

interface Migration {
  id: string;
  name: string;
  applied_at: Date;
}

async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations(): Promise<string[]> {
  const result = await query<Migration>('SELECT id FROM migrations ORDER BY id');
  return result.rows.map((m) => m.id);
}

async function applyMigration(filename: string) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filepath, 'utf-8');

  const id = filename.split('_')[0];
  const name = filename.replace('.sql', '');

  console.log(`Applying migration: ${name}`);

  await query('BEGIN');
  try {
    await query(sql);
    await query('INSERT INTO migrations (id, name) VALUES ($1, $2)', [id, name]);
    await query('COMMIT');
    console.log(`Applied: ${name}`);
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

async function migrate() {
  console.log('Starting database migration...');

  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const pending = files.filter((f) => !applied.includes(f.split('_')[0]));

  if (pending.length === 0) {
    console.log('No pending migrations');
    return;
  }

  console.log(`Found ${pending.length} pending migrations`);

  for (const file of pending) {
    await applyMigration(file);
  }

  console.log('Migration complete');
}

async function rollback() {
  const result = await query<Migration>(
    'SELECT * FROM migrations ORDER BY applied_at DESC LIMIT 1'
  );

  if (result.rows.length === 0) {
    console.log('No migrations to rollback');
    return;
  }

  const migration = result.rows[0];
  console.log(`Rolling back: ${migration.name}`);

  // Note: In production, you'd have down migrations
  await query('DELETE FROM migrations WHERE id = $1', [migration.id]);
  console.log(`Rolled back: ${migration.name}`);
}

// CLI entry point
const command = process.argv[2] || 'up';

if (command === 'up') {
  migrate()
    .catch(console.error)
    .finally(() => pool.end());
} else if (command === 'down') {
  rollback()
    .catch(console.error)
    .finally(() => pool.end());
} else {
  console.log('Usage: npx ts-node scripts/db-migrate.ts [up|down]');
  process.exit(1);
}
