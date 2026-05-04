import { Pool, type QueryResult, type QueryResultRow } from 'pg';

let pool: Pool | null = null;

/**
 * pg Pool singleton. Settings mirror premium-site (real-estate-platform's
 * rds-client) so behavior matches in production.
 */
export function getPool(): Pool {
  if (pool) return pool;
  const url = process.env.RDS_DATABASE_URL;
  if (!url) {
    throw new Error('RDS_DATABASE_URL is required');
  }
  pool = new Pool({
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    statement_timeout: 60_000,
    ssl: { rejectUnauthorized: false },
  });
  return pool;
}

/**
 * Run a parameterized query against RDS. Logs slow queries (>1s) in dev.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await getPool().query<T>(text, params);
  const duration = Date.now() - start;

  if (duration > 1000 && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn('Slow RDS query', {
      text: text.replace(/\s+/g, ' ').slice(0, 120),
      duration,
      rows: res.rowCount,
    });
  }

  return res;
}

/** Convenience: fetch one row or null. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const res = await query<T>(text, params);
  return res.rows[0] ?? null;
}

/** Tear down the pool — used by tests / hot-reload cleanup. */
export async function resetPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
