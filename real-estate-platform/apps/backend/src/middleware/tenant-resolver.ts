import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

interface Agent {
  id: string;
  name: string;
  email: string;
  tier: 'premium' | 'template';
}

const agentCache = new Map<string, { agent: Agent; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function resolveTenant(request: NextRequest): Promise<Agent | null> {
  const agentId = request.headers.get('x-agent-id');

  if (!agentId) {
    return null;
  }

  // Check cache first
  const cached = agentCache.get(agentId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.agent;
  }

  // Query database for agent
  const agent = await queryOne<Agent>(
    'SELECT id, name, email, tier FROM agents WHERE id = $1 AND active = true',
    [agentId]
  );

  if (agent) {
    agentCache.set(agentId, { agent, timestamp: Date.now() });
  }

  return agent;
}

export function createTenantMiddleware() {
  return async function tenantMiddleware(
    request: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const agent = await resolveTenant(request);

    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid or missing agent ID' },
        { status: 401 }
      );
    }

    // Add agent info to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-agent-id', agent.id);
    requestHeaders.set('x-agent-tier', agent.tier);

    return next();
  };
}

export function clearAgentCache(agentId?: string): void {
  if (agentId) {
    agentCache.delete(agentId);
  } else {
    agentCache.clear();
  }
}
