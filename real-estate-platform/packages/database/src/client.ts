import { Pool, QueryResult } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  // Log slow queries in development
  if (duration > 1000 && process.env.NODE_ENV === 'development') {
    console.warn('Slow query detected', { text, duration, rows: res.rowCount });
  }

  return res;
}

export async function queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
  const res = await query<T>(text, params);
  return res.rows[0] || null;
}

export async function getClient() {
  return await pool.connect();
}

export { pool };
