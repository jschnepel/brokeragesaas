// Communities page data — dynamically generated from JSON v9
import { getRegions, getCommunitiesByRegion } from './communityLoader';
import type { ResolvedCommunity } from './types';

export interface CommunityStat {
  label: string;
  value: number;
  suffix: string;
  prefix?: string;
}

export interface CommunityListing {
  id: string;
  name: string;
  price: string;
  image: string;
  zipCode?: string;
}

export interface RegionListingData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  stats: CommunityStat[];
  highlights: string[];
  communities: CommunityListing[];
}

export interface SearchResult {
  type: 'region' | 'community';
  regionId: string;
  regionName: string;
  communityId?: string;
  communityName?: string;
  price?: string;
  zipCode?: string;
  image: string;
}

function extractHighlights(communities: ResolvedCommunity[]): string[] {
  const tagCounts = new Map<string, number>();
  communities.forEach(c => {
    c.categoryTags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    });
  });
  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag]) => tag);
}

// Generate REGIONS_DATA dynamically from JSON
export const REGIONS_DATA: RegionListingData[] = getRegions().map(region => {
  const communities = getCommunitiesByRegion(region.id);
  return {
    id: region.id,
    name: region.name,
    tagline: region.tagline,
    description: region.description,
    image: region.heroImage,
    stats: [
      { label: 'Communities', value: communities.length, suffix: '' },
      { label: 'Guard-Gated', value: communities.filter(c => c.gating.toLowerCase().includes('guard')).length, suffix: '' },
      { label: 'Golf', value: communities.filter(c => c.golf != null).length, suffix: '' },
      { label: 'Sections', value: new Set(communities.map(c => c.identity.sectionId)).size, suffix: '' },
    ],
    highlights: extractHighlights(communities),
    communities: communities.map(c => ({
      id: c.id,
      name: c.name,
      price: c.priceRange,
      image: c.heroImage,
      zipCode: c.zipCode,
    })),
  };
});

export const fuzzyMatch = (text: string, query: string): boolean => {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  if (textLower.includes(queryLower)) return true;

  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === queryLower.length;
};
