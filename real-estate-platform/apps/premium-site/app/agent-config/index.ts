import type { AgentSiteConfig } from '@platform/shared';
import { YONG_CHOI_CONFIG } from './yong-choi';

/**
 * Agent config registry.
 * In production, this will be resolved by domain lookup in middleware.
 * For now, maps agent slugs to their configs.
 */
const AGENT_CONFIGS: Record<string, AgentSiteConfig> = {
  'yong-choi': YONG_CHOI_CONFIG,
};

/**
 * Resolve the active agent config.
 * TODO: In production, middleware resolves domain → agent_id via DB lookup,
 * then passes agentId as a header or cookie. This function reads that.
 * For now, returns Yong as the default.
 */
export function resolveAgentConfig(agentId?: string): AgentSiteConfig {
  if (agentId && AGENT_CONFIGS[agentId]) {
    return AGENT_CONFIGS[agentId];
  }
  return YONG_CHOI_CONFIG;
}

export { YONG_CHOI_CONFIG };
