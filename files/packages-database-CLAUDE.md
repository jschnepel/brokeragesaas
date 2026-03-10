# CLAUDE.md — packages/database
# Instructions for Claude Code operating in real-estate-platform/packages/database/

---

## WHAT THIS PACKAGE IS

The single source of truth for all database concerns:
- Neon serverless Postgres connection pool
- Migration files (ordered, append-only)
- Seed scripts (safe to re-run)
- Shared DB types

Everything that touches SQL lives here or in `apps/platform/services/`. Never write raw pool queries anywhere else.

---

## POOL USAGE

The pool is exported from `src/index.ts`. Import it like this everywhere:

```ts
import { pool } from '@platform/database';
```

Never create a second pool. Never import `pg` directly in app code.

The pool reads from `DATABASE_URL` environment variable. This must be a Neon connection string with `?sslmode=require`.

---

## MIGRATIONS

### Rules
1. **Append-only** — never modify an existing migration file. If a change is needed, write a new migration.
2. **Numbered sequentially** — `001_`, `002_`, `003_`, etc. Gaps are not allowed.
3. **Idempotent** — every migration must be safe to run twice. Use `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `CREATE OR REPLACE`.
4. **Self-contained** — a migration must not depend on app code, services, or env vars beyond `DATABASE_URL`.

### File naming
```
src/migrations/
├── 001_initial_schema.sql
├── 002_agents.sql
├── 003_listings.sql
├── 004_intake_tables.sql
├── 005_tenant_themes.sql
└── 006_next_migration.sql   ← always next number
```

### Migration template
```sql
-- Migration: 006_example.sql
-- Description: Add example_table for feature X
-- Author: Joey
-- Date: YYYY-MM-DD

-- Always use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS example_table (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  tenant_id   TEXT NOT NULL DEFAULT 'russ-lyon',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes go in the same file as the table
CREATE INDEX IF NOT EXISTS example_table_tenant_idx ON example_table (tenant_id);

-- Any seed data for this migration
INSERT INTO example_table (name) VALUES ('Default')
ON CONFLICT DO NOTHING;
```

### Running migrations
```bash
cd real-estate-platform
npx tsx packages/database/src/db-migrate.ts
```

If `db-migrate.ts` doesn't exist, run manually:
```bash
npx tsx -e "
const { pool } = require('./packages/database/src/index');
const fs = require('fs');
const sql = fs.readFileSync('./packages/database/src/migrations/00X_name.sql', 'utf8');
pool.query(sql)
  .then(() => { console.log('Done'); process.exit(0); })
  .catch(e => { console.error(e.message); process.exit(1); });
"
```

---

## SEED SCRIPTS

### Rules
1. **Idempotent** — safe to run multiple times. Use `ON CONFLICT DO UPDATE` or `ON CONFLICT DO NOTHING`.
2. **Realistic data** — luxury real estate context. Real Phoenix/Scottsdale addresses, community names, agent names.
3. **Predictable IDs** — use fixed UUIDs for seed data so foreign keys work consistently across re-runs.
4. **Clean teardown** — every seed script has a corresponding `teardown` export that deletes seeded data by a known marker (e.g. `WHERE is_seed = true` or by known IDs).

### Seed file naming
```
src/
├── seed-agents.ts
├── seed-intake.ts
├── seed-themes.ts
└── seed-all.ts     ← runs all seeds in dependency order
```

### Seed template
```ts
// src/seed-example.ts
import { pool } from './index';

const SEED_MARKER = 'seed-v1';  // increment if seed data changes

export async function seedExample(): Promise<void> {
  console.log('Seeding example_table...');

  await pool.query(`
    INSERT INTO example_table (id, name, seed_marker)
    VALUES
      ('00000000-0000-0000-0000-000000000001', 'Example One', $1),
      ('00000000-0000-0000-0000-000000000002', 'Example Two', $1)
    ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          updated_at = NOW()
  `, [SEED_MARKER]);

  console.log('✓ example_table seeded');
}

export async function teardownExample(): Promise<void> {
  await pool.query(`DELETE FROM example_table WHERE seed_marker = $1`, [SEED_MARKER]);
  console.log('✓ example_table seed data removed');
}

// Run directly
if (require.main === module) {
  seedExample()
    .then(() => process.exit(0))
    .catch(e => { console.error(e); process.exit(1); });
}
```

---

## QUERY PATTERNS

### Always use parameterized queries
```ts
// ✗ Wrong — SQL injection risk
pool.query(`SELECT * FROM agents WHERE email = '${email}'`);

// ✓ Right
pool.query('SELECT * FROM agents WHERE email = $1', [email]);
```

### Type your results
```ts
// ✗ Wrong — untyped
const { rows } = await pool.query('SELECT * FROM agents');

// ✓ Right
interface AgentRow {
  id: string;
  name: string;
  email: string;
  role: string;
}
const { rows } = await pool.query<AgentRow>('SELECT * FROM agents');
```

### Use transactions for multi-step writes
```ts
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO intake_requests ...', [...]);
  await client.query('INSERT INTO intake_status_log ...', [...]);
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

### Null safety
```ts
// Always handle null/undefined from DB
const request = rows[0] ?? null;
if (!request) throw new Error('Request not found');
```

---

## COLUMN NAMING CONVENTIONS

Database columns use `snake_case`. TypeScript properties use `camelCase`. Map explicitly — never use raw row objects in app code.

```ts
// ✓ Map in the service, not in the query
return {
  id:           row.id,
  title:        row.title,
  assignedTo:   row.assigned_to,    // snake → camel
  createdAt:    row.created_at,
  slaBreached:  row.sla_breached,
};
```

---

## SCHEMA REFERENCE

Current tables as of migration 005:

| Table                | Purpose                              |
|----------------------|--------------------------------------|
| `agents`             | Users (all roles)                    |
| `intake_requests`    | Marketing requests                   |
| `intake_messages`    | Per-request chat messages            |
| `intake_files`       | File attachments on requests         |
| `intake_status_log`  | Status transition history            |
| `intake_kpi_snapshots` | Cached analytics snapshots         |
| `intake_material_type` | Material type lookup                |
| `tenant_themes`      | Per-tenant design tokens             |

**Column name exceptions** (built names differ from original spec):

| Original spec name     | Actual column       |
|------------------------|---------------------|
| `assigned_designer_id` | `assigned_to`       |
| `sender_agent_id`      | `sender_id`         |
| `changed_by_agent_id`  | `changed_by`        |

---

## TESTING

```ts
// Always mock pool in unit tests
vi.mock('@platform/database', () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
  }
}));
```

For integration tests that hit a real DB, use a separate `TEST_DATABASE_URL` pointing to a `test` schema:
```sql
CREATE SCHEMA IF NOT EXISTS test;
SET search_path TO test;
```

Never run integration tests against the production Neon DB.

---

## WHAT NOT TO DO

- ❌ Don't create a second pool instance
- ❌ Don't write raw SQL in app code — use services
- ❌ Don't modify existing migration files
- ❌ Don't use string interpolation in queries
- ❌ Don't commit migration files with placeholder TODO values
- ❌ Don't write seed data with random UUIDs — use fixed values
- ❌ Don't use `SELECT *` in production queries — select only needed columns
