import type { QueryResultRow } from 'pg';
import { Pool, type QueryResult } from 'pg';
import { resolveDatabaseUrl } from './ssm';

// Lazy pool — defers connectionString resolution until the first query.
// Avoids resolveDatabaseUrl() at module load (which throws if DATABASE_URL is
// unset and SSM is unreachable, e.g. in CI / Next.js static page generation).
let _pool: Pool | undefined;

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: resolveDatabaseUrl(),
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: true,
    });
  }
  return _pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await getPool().query<T>(text, params);
  const duration = Date.now() - start;

  // Log slow queries in development
  if (duration > 1000 && process.env.NODE_ENV === 'development') {
    console.warn('Slow query detected', { text, duration, rows: res.rowCount });
  }

  return res;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<T | null> {
  const res = await query<T>(text, params);
  return res.rows[0] || null;
}

export async function getClient() {
  return await getPool().connect();
}

// Backward-compatibility export. Code that imports `pool` directly hits the
// same lazy-init path as the helper functions.
export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    return Reflect.get(getPool(), prop);
  },
});
