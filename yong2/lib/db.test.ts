import { describe, it, expect, afterEach } from 'vitest';
import { getPool, resetPool } from './db';

describe('db pool', () => {
  afterEach(async () => { await resetPool(); });

  it('throws if RDS_DATABASE_URL is missing', () => {
    const prev = process.env.RDS_DATABASE_URL;
    delete process.env.RDS_DATABASE_URL;
    expect(() => getPool()).toThrow(/RDS_DATABASE_URL/);
    process.env.RDS_DATABASE_URL = prev;
  });

  it('returns the same pool on repeated calls (singleton)', () => {
    process.env.RDS_DATABASE_URL = 'postgres://u:p@localhost:5432/db';
    const a = getPool();
    const b = getPool();
    expect(a).toBe(b);
  });
});
