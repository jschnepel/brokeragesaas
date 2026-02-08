import type { MLSAdapter, MLSConfig } from './types';
import { ARMLSAdapter } from './adapters/armls';
import { BridgeAdapter } from './adapters/bridge';
import { ManualAdapter } from './adapters/manual';

export function createMLSAdapter(config: MLSConfig, agentId?: string): MLSAdapter {
  switch (config.type) {
    case 'armls':
      return new ARMLSAdapter(config);
    case 'bridge':
      return new BridgeAdapter(config);
    case 'manual':
      if (!agentId) {
        throw new Error('agentId is required for manual adapter');
      }
      return new ManualAdapter(agentId);
    default:
      throw new Error(`Unknown MLS adapter type: ${config.type}`);
  }
}

export function getMLSConfigFromEnv(type: MLSConfig['type']): MLSConfig {
  switch (type) {
    case 'armls':
      return {
        type: 'armls',
        apiKey: process.env.ARMLS_API_KEY,
        apiSecret: process.env.ARMLS_API_SECRET,
      };
    case 'bridge':
      return {
        type: 'bridge',
        apiKey: process.env.BRIDGE_API_KEY,
      };
    case 'manual':
      return {
        type: 'manual',
      };
    default:
      throw new Error(`Unknown MLS type: ${type}`);
  }
}
