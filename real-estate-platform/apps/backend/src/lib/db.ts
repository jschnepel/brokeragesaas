import { query, queryOne, getClient, pool } from '@platform/database';

export { query, queryOne, getClient, pool };

export async function withTransaction<T>(
  callback: (client: ReturnType<typeof getClient> extends Promise<infer U> ? U : never) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
