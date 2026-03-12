import { Pool, neonConfig, type QueryResultRow } from "@neondatabase/serverless";
import ws from "ws";

// Enable WebSocket for local dev (Neon serverless requires it outside of edge/serverless)
if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) {
  const res = await pool.query<T>(text, params);
  return res;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<T | null> {
  const res = await query<T>(text, params);
  return res.rows[0] || null;
}

export { pool };
