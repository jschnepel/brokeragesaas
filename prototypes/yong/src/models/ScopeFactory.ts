import { RegionScope } from './RegionScope';
import { ZipcodeScope } from './ZipcodeScope';
import { CommunityScope } from './CommunityScope';
import type { RegionConfig, ZipcodeConfig, CommunityConfig } from './types';

export class ScopeFactory {
  createRegion(config: RegionConfig): RegionScope {
    return new RegionScope(config);
  }

  createZipcode(config: ZipcodeConfig, parentRegionSlug: string): ZipcodeScope {
    return new ZipcodeScope(config, parentRegionSlug);
  }

  createCommunity(config: CommunityConfig): CommunityScope {
    return new CommunityScope(config);
  }
}
