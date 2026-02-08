import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
};

export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const { windowMs, maxRequests } = { ...DEFAULT_CONFIG, ...config };

  return function rateLimiter(
    request: NextRequest
  ): NextResponse | null {
    const identifier = getIdentifier(request);
    const now = Date.now();

    let entry = rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(identifier, entry);
      return null; // Allow request
    }

    entry.count++;

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      return NextResponse.json(
        {
          error: {
            message: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter,
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(entry.resetTime),
          },
        }
      );
    }

    return null; // Allow request
  };
}

function getIdentifier(request: NextRequest): string {
  const agentId = request.headers.get('x-agent-id');
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';

  return agentId ? `agent:${agentId}` : `ip:${ip}`;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000);
