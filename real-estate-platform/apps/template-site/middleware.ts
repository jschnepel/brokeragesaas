import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface CachedAgent {
  agent: {
    id: string;
    name: string;
    tier: string;
  };
  timestamp: number;
}

// Simple in-memory cache (replace with Redis in production)
const agentCache = new Map<string, CachedAgent>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const domain = hostname.split(':')[0]; // Remove port for local dev

  // Skip for localhost development with specific agent
  if (domain === 'localhost') {
    const response = NextResponse.next();
    response.headers.set('x-agent-id', 'demo');
    return response;
  }

  // Check cache first
  const cached = agentCache.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const response = NextResponse.next();
    response.headers.set('x-agent-id', cached.agent.id);
    return response;
  }

  // Resolve agent from domain
  const agent = await resolveAgentFromDomain(domain);

  if (!agent) {
    return new NextResponse('Domain not configured', { status: 404 });
  }

  // Cache the result
  agentCache.set(domain, { agent, timestamp: Date.now() });

  // Add agent_id to headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-agent-id', agent.id);

  return response;
}

async function resolveAgentFromDomain(domain: string): Promise<{ id: string; name: string; tier: string } | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${apiUrl}/api/agents/resolve?domain=${encodeURIComponent(domain)}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.agent;
  } catch (error) {
    console.error('Failed to resolve agent from domain:', error);
    return null;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
