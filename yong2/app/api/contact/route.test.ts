import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/contact', () => ({ sendContactMessage: vi.fn() }));
vi.mock('@/lib/rate-limit', async () => {
  const actual = await vi.importActual<typeof import('@/lib/rate-limit')>('@/lib/rate-limit');
  return actual;
});

describe('POST /api/contact', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { __resetRateLimit } = await import('@/lib/rate-limit');
    __resetRateLimit();
  });

  it('rejects missing fields with 400', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.1.1.1' },
      body: JSON.stringify({ name: 'x' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects honeypot hits with 200 (silent drop)', async () => {
    const { POST } = await import('./route');
    const body = { name: 'a', email: 'a@b.co', phone: '1', interest: 'Buying', message: 'hi', website: 'spam.com' };
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '2.2.2.2' },
      body: JSON.stringify(body),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const { sendContactMessage } = await import('@/lib/contact');
    expect(sendContactMessage).not.toHaveBeenCalled();
  });

  it('accepts valid payload and calls sendContactMessage', async () => {
    const { POST } = await import('./route');
    const body = { name: 'a', email: 'a@b.co', phone: '1', interest: 'Buying', message: 'hi' };
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '3.3.3.3' },
      body: JSON.stringify(body),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const { sendContactMessage } = await import('@/lib/contact');
    expect(sendContactMessage).toHaveBeenCalledOnce();
  });
});
