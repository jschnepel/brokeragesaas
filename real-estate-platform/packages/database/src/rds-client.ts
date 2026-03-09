import type { QueryResultRow } from 'pg';
import { Pool, type QueryResult } from 'pg';

const rdsPool = new Pool({
  connectionString: process.env.RDS_DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false },
});

export async function rdsQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await rdsPool.query<T>(text, params);
  const duration = Date.now() - start;

  if (duration > 1000 && process.env.NODE_ENV === 'development') {
    console.warn('Slow RDS query detected', { text: text.substring(0, 100), duration, rows: res.rowCount });
  }

  return res;
}

export async function rdsQueryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const res = await rdsQuery<T>(text, params);
  return res.rows[0] || null;
}

export async function getRdsClient() {
  return await rdsPool.connect();
}

export { rdsPool };
