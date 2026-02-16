// Barrel re-export from communityLoader
// All community data sourced from communities-enriched.json (pipeline output)

export {
  getCommunityById,
  getAllCommunities,
  getCommunitiesByRegion,
  getCommunitiesBySection,
  getRegions,
  getSections,
  getRegionById,
  getAllRegions,
  getAmenityById,
  getAmenitiesByCommunity,
  getAmenitiesByType,
  getZipcodesByRegion,
  getZipcodeByCode,
  getRegionFromZip,
  getRegionName,
  getRegionDescription,
} from './communityLoader';

export type {
  ResolvedCommunity,
  RegionEntity,
  SectionEntity,
  AmenityEntity,
  ZipcodeEntity,
  CommunityEntity,
} from './types';
