import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, __resetRateLimit } from './rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => { __resetRateLimit(); });

  it('allows the first N requests from the same key', () => {
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit('1.2.3.4', 10, 3600_000).allowed).toBe(true);
    }
  });

  it('blocks the 11th request within the window', () => {
    for (let i = 0; i < 10; i++) checkRateLimit('1.2.3.4', 10, 3600_000);
    expect(checkRateLimit('1.2.3.4', 10, 3600_000).allowed).toBe(false);
  });

  it('tracks keys independently', () => {
    for (let i = 0; i < 10; i++) checkRateLimit('1.2.3.4', 10, 3600_000);
    expect(checkRateLimit('5.6.7.8', 10, 3600_000).allowed).toBe(true);
  });
});
