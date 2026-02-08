import { NextRequest, NextResponse } from 'next/server';
import { handleAPIError, NotFoundError } from '@/middleware/error-handler';
import { queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const agentId = request.headers.get('x-agent-id');
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 401 });
    }

    const agent = await queryOne(
      `SELECT
        a.id,
        a.name,
        a.email,
        a.phone,
        a.brokerage_name,
        a.license_number,
        a.bio,
        a.photo_url,
        a.logo_url,
        a.tier,
        s.domain,
        s.brand_colors,
        s.site_config
       FROM agents a
       LEFT JOIN agent_sites s ON a.id = s.agent_id
       WHERE a.id = $1 AND a.active = true`,
      [agentId]
    );

    if (!agent) {
      throw new NotFoundError('Agent');
    }

    const features = await getAgentFeatures(agentId);

    return NextResponse.json({
      agent: {
        ...agent,
        features,
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

async function getAgentFeatures(agentId: string): Promise<Record<string, unknown>> {
  const result = await queryOne(
    `SELECT
       af.feature_config,
       sf.feature_key,
       sf.default_value
     FROM agent_features af
     JOIN site_features sf ON af.feature_id = sf.id
     WHERE af.agent_id = $1 AND af.enabled = true`,
    [agentId]
  );

  if (!result) {
    return {};
  }

  return result.feature_config || {};
}
