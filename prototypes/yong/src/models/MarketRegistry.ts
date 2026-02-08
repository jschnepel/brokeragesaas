import { MarketOverview } from './MarketOverview';
import { RegionScope } from './RegionScope';
import { ZipcodeScope } from './ZipcodeScope';
import { CommunityScope } from './CommunityScope';
import { ScopeFactory } from './ScopeFactory';
import type { MarketScope } from './MarketScope';
import type { RegionConfig, ZipcodeConfig, CommunityConfig } from './types';

class MarketRegistryClass {
  private overview: MarketOverview;
  private regions: Map<string, RegionScope> = new Map();
  private zipcodes: Map<string, ZipcodeScope> = new Map(); // key: regionSlug-code
  private communities: Map<string, CommunityScope> = new Map();
  private factory: ScopeFactory;

  constructor() {
    this.overview = new MarketOverview();
    this.factory = new ScopeFactory();
  }

  initialize(
    regionConfigs: RegionConfig[],
    zipcodeConfigs: ZipcodeConfig[],
    communityConfigs: CommunityConfig[]
  ): void {
    this.regions.clear();
    this.zipcodes.clear();
    this.communities.clear();
    this.overview = new MarketOverview();

    // Create regions
    for (const config of regionConfigs) {
      const region = this.factory.createRegion(config);
      this.regions.set(config.slug, region);
      this.overview.addRegion(region);
    }

    // Create zipcodes and attach to regions
    for (const config of zipcodeConfigs) {
      const zipcode = this.factory.createZipcode(config, config.regionSlug);
      const key = `${config.regionSlug}-${config.code}`;
      this.zipcodes.set(key, zipcode);

      const region = this.regions.get(config.regionSlug);
      if (region) {
        region.addZipcode(zipcode);
      }
    }

    // Create communities and attach to zipcodes
    for (const config of communityConfigs) {
      const community = this.factory.createCommunity(config);
      this.communities.set(config.slug, community);

      // Find the parent zipcode
      for (const [key, zipcode] of this.zipcodes) {
        if (zipcode.code === config.zipcodeCode) {
          zipcode.addCommunity(community);
          break;
        }
      }
    }
  }

  getOverview(): MarketOverview {
    return this.overview;
  }

  getRegion(slug: string): RegionScope | undefined {
    return this.regions.get(slug);
  }

  getZipcode(regionSlug: string, code: string): ZipcodeScope | undefined {
    return this.zipcodes.get(`${regionSlug}-${code}`);
  }

  getCommunity(slug: string): CommunityScope | undefined {
    return this.communities.get(slug);
  }

  getByUrl(region?: string, zipcode?: string, community?: string): MarketScope | undefined {
    if (!region) return this.overview;

    if (community) {
      return this.communities.get(community);
    }

    if (zipcode && region) {
      return this.zipcodes.get(`${region}-${zipcode}`);
    }

    return this.regions.get(region);
  }

  getAllRegions(): RegionScope[] {
    return Array.from(this.regions.values());
  }

  getAllCommunities(): CommunityScope[] {
    return Array.from(this.communities.values());
  }
}

// Singleton instance
export const MarketRegistry = new MarketRegistryClass();
