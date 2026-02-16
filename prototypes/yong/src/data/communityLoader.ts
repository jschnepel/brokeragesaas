// Multi-entity loader with FK resolution
// Reads all 5 collections from JSON and resolves references

import type {
  CommunityDatabase,
  CommunityEntity,
  ResolvedCommunity,
  RegionEntity,
  ZipcodeEntity,
  SectionEntity,
  AmenityEntity,
} from './types';

import rawData from './communities-enriched.json';

const db = rawData as unknown as CommunityDatabase;

// ═══════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════

const regionsById = new Map<string, RegionEntity>();
for (const r of db.regions) regionsById.set(r.id, r);

const zipcodesByCode = new Map<string, ZipcodeEntity>();
for (const z of db.zipcodes) zipcodesByCode.set(z.code, z);

const sectionsById = new Map<string, SectionEntity>();
for (const s of db.sections) sectionsById.set(s.id, s);

const amenitiesById = new Map<string, AmenityEntity>();
for (const a of db.amenities) amenitiesById.set(a.id, a);

// ═══════════════════════════════════════════
// FK RESOLUTION
// ═══════════════════════════════════════════

// Fallback entities for safety
const FALLBACK_REGION: RegionEntity = {
  id: 'unknown', name: 'Unknown', tagline: '', description: '',
  coordinates: [33.49, -111.93], heroImage: '', displayOrder: 99,
  market: null, demographics: null,
};

const FALLBACK_SECTION: SectionEntity = {
  id: 'unknown', label: 'Unknown', description: '',
  heroImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2400',
  displayOrder: 99,
};

const FALLBACK_ZIPCODE: ZipcodeEntity = {
  code: '00000', regionId: 'unknown', city: 'Unknown',
  coordinates: [33.49, -111.93], demographics: null, market: null,
};

function resolve(entity: CommunityEntity): ResolvedCommunity {
  const region = regionsById.get(entity.identity.regionId) ?? FALLBACK_REGION;
  const section = sectionsById.get(entity.identity.sectionId) ?? FALLBACK_SECTION;
  const zipcode = zipcodesByCode.get(entity.identity.zipcodeCode) ?? FALLBACK_ZIPCODE;

  const amenities = entity.amenityIds
    .map(id => amenitiesById.get(id))
    .filter((a): a is AmenityEntity => a !== undefined);

  const signatureAmenity = entity.signatureAmenityId
    ? amenitiesById.get(entity.signatureAmenityId) ?? null
    : null;

  const nearestTrail = entity.nearestTrailId
    ? amenitiesById.get(entity.nearestTrailId) ?? null
    : null;

  // Resolve hero image: community override → section stock
  const heroImage = entity.identity.heroImage ?? section.heroImage;

  return {
    ...entity,
    amenities,
    signatureAmenity,
    nearestTrail,
    region,
    section,
    zipcode,
    heroImage,

    // Convenience flat accessors
    id: entity.identity.slug,
    slug: entity.identity.slug,
    name: entity.identity.name,
    city: entity.identity.city,
    priceRange: entity.identity.priceRange,
    gating: entity.identity.gating,
    zipCode: entity.identity.zipcodeCode,
    categoryTags: entity.identity.tags,
    website: entity.identity.website ?? '',
    coordinates: entity.identity.coordinates,
    tagline: entity.narrative.tagline,
    description: entity.narrative.summary,
  };
}

// ═══════════════════════════════════════════
// RESOLVED DATA
// ═══════════════════════════════════════════

const allResolved: ResolvedCommunity[] = db.communities.map(resolve);

// Indexes on resolved data
const resolvedById = new Map<string, ResolvedCommunity>();
const resolvedByRegion = new Map<string, ResolvedCommunity[]>();
const resolvedBySection = new Map<string, ResolvedCommunity[]>();

for (const c of allResolved) {
  resolvedById.set(c.id, c);

  const regionList = resolvedByRegion.get(c.identity.regionId) ?? [];
  regionList.push(c);
  resolvedByRegion.set(c.identity.regionId, regionList);

  const sectionList = resolvedBySection.get(c.identity.sectionId) ?? [];
  sectionList.push(c);
  resolvedBySection.set(c.identity.sectionId, sectionList);
}

// Zipcodes by region index
const zipcodesByRegion = new Map<string, ZipcodeEntity[]>();
for (const z of db.zipcodes) {
  const list = zipcodesByRegion.get(z.regionId) ?? [];
  list.push(z);
  zipcodesByRegion.set(z.regionId, list);
}

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

// --- Communities ---

export function getCommunityById(slug: string): ResolvedCommunity | undefined {
  return resolvedById.get(slug);
}

export function getAllCommunities(): ResolvedCommunity[] {
  return allResolved;
}

export function getCommunitiesByRegion(regionId: string): ResolvedCommunity[] {
  return resolvedByRegion.get(regionId) ?? [];
}

export function getCommunitiesBySection(sectionId: string): ResolvedCommunity[] {
  return resolvedBySection.get(sectionId) ?? [];
}

// --- Regions ---

export function getRegionById(id: string): RegionEntity | undefined {
  return regionsById.get(id);
}

export function getAllRegions(): RegionEntity[] {
  return db.regions;
}

export function getRegions(): RegionEntity[] {
  // Only regions that have communities
  return db.regions.filter(r => (resolvedByRegion.get(r.id)?.length ?? 0) > 0);
}

// --- Sections ---

export function getSections(): SectionEntity[] {
  return db.sections.filter(s => (resolvedBySection.get(s.id)?.length ?? 0) > 0);
}

export function getSectionById(id: string): SectionEntity | undefined {
  return sectionsById.get(id);
}

// --- Amenities ---

export function getAmenityById(id: string): AmenityEntity | undefined {
  return amenitiesById.get(id);
}

export function getAmenitiesByCommunity(slug: string): AmenityEntity[] {
  const c = resolvedById.get(slug);
  return c ? c.amenities : [];
}

export function getAmenitiesByType(type: string): AmenityEntity[] {
  return db.amenities.filter(a => a.type === type);
}

// --- Zipcodes ---

export function getZipcodesByRegion(regionId: string): ZipcodeEntity[] {
  return zipcodesByRegion.get(regionId) ?? [];
}

export function getZipcodeByCode(code: string): ZipcodeEntity | undefined {
  return zipcodesByCode.get(code);
}

// --- Utility ---

export function getRegionFromZip(zip: string): string {
  const z = zipcodesByCode.get(zip);
  return z?.regionId ?? 'north-scottsdale';
}

export function getRegionName(regionId: string): string {
  return regionsById.get(regionId)?.name ?? regionId;
}

export function getRegionDescription(regionId: string): string {
  return regionsById.get(regionId)?.description ?? '';
}
