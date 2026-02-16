// ═══════════════════════════════════════════
// Entity types — map to JSON v9 → future DB tables
// ═══════════════════════════════════════════

export type AmenityType =
  | 'golf-course' | 'restaurant' | 'clubhouse' | 'spa' | 'pool'
  | 'trail' | 'fitness' | 'tennis' | 'shopping' | 'park' | 'venue';

export type AccessLevel = 'public' | 'residents' | 'members-only' | 'membership-required';

// ─── Enrichment data (from pipeline) ───

export interface DemographicsData {
  population: number | null;
  medianIncome: number | null;
  source: string;
}

export interface ZipDemographicsData {
  population: number | null;
  medianAge: number | null;
  medianIncome: number | null;
  medianHomeValue: number | null;
  collegePct: number | null;
  homeOwnershipPct: number | null;
  source: string;
}

export interface ClimateData {
  sunnyDays: number;
  avgHighJan: number;
  avgHighJul: number;
  avgLowJan: number;
  avgLowJul: number;
  precipIn: number;
  source: string;
}

export interface EnrichedPoi {
  id: string;
  name: string;
  type: string;
  subtype: string | null;
  lat: number;
  lng: number;
  distanceMi: number;
}

// ─── Entity 1: Region ───

export interface RegionEntity {
  id: string;
  name: string;
  tagline: string;
  description: string;
  coordinates: [number, number];
  heroImage: string;
  displayOrder: number;
  market: null; // enrichment placeholder
  demographics: null; // enrichment placeholder
  enrichment?: {
    demographics: DemographicsData | null;
    climate: ClimateData | null;
  };
}

// ─── Entity 2: Zipcode ───

export interface ZipcodeEntity {
  code: string;
  regionId: string;
  city: string;
  coordinates: [number, number];
  demographics: null;
  market: null;
  enrichment?: {
    demographics: ZipDemographicsData | null;
    climate: ClimateData | null;
  };
}

// ─── Entity 3: Section ───

export interface SectionEntity {
  id: string;
  label: string;
  description: string;
  heroImage: string;
  displayOrder: number;
}

// ─── Entity 4: Amenity ───

export interface AmenityEntity {
  id: string;
  name: string;
  type: AmenityType;
  description: string;
  tags: string[];
  access: AccessLevel;
  url: string | null;
  address: string;
  coordinates: [number, number] | null;
  communityIds: string[];
  coordSource?: string;
  coordVerified?: boolean;
  stats?: { value: string; label: string }[];
  image?: string;
}

// ─── Entity 5: Community (sub-types) ───

export interface Airport {
  name: string;
  code: string;
  type: string;
  distance: string;
}

export interface KeyDistance {
  label: string;
  distance: string;
}

export interface CommunityIdentity {
  name: string;
  slug: string;
  sectionId: string;
  regionId: string;
  zipcodeCode: string;
  city: string;
  coordinates: [number, number];
  originalCoordinates?: [number, number];
  coordSource?: string;
  centroidDeltaM?: number | null;
  priceRange: string;
  gating: string;
  tags: string[];
  website: string | null;
  heroImage: string | null;
}

export interface NarrativeSection {
  tab: string;
  content: string;
}

export interface StructuredNarrative {
  lead: string;
  sections: NarrativeSection[];
}

export interface CommunityNarrative {
  tagline: string;
  summary: string;
  body: string | StructuredNarrative;
}

export interface CommunityLocation {
  airports: Airport[];
  keyDistances: KeyDistance[];
  elevation: string | null;
}

export interface HOAInfo {
  monthlyLow: number | null;
  monthlyHigh: number | null;
  hasCapitalFee: boolean;
  details: string | null;
}

export interface SchoolDistrict {
  district: string;
  highSchool: string;
  privateSchools: string[];
}

export interface CommunityResidential {
  hoa: HOAInfo;
  schoolDistrict: SchoolDistrict;
  neighborhoods: string | null;
}

export interface GolfInfo {
  description: string;
  membership: string | null;
}

// ─── Enrichment types (populated later) ───

export interface MarketStats {
  avgPrice: string;
  priceRange: string;
  avgPpsf: string;
  avgDom: number;
  inventory: number;
  trend: string;
}

export interface MarketMetric {
  label: string;
  value: string;
  numericValue: number;
  suffix: string;
  trend: string;
  trendDir: 'up' | 'down' | 'neutral';
  description: string;
}

export interface MarketData {
  stats: MarketStats;
  metrics: MarketMetric[];
}

export interface QualityMetric {
  metric: string;
  value: string;
  detail: string;
  source: string;
  icon: string;
  color: string;
}

export interface Employer {
  name: string;
  sector: string;
  employees: string;
  distance: string;
}

export interface EconomicStat {
  label: string;
  value: string;
  benchmark: string;
  source: string;
}

export interface EconomyData {
  employers: Employer[];
  stats: EconomicStat[];
}

export interface GalleryImage {
  url: string;
  caption: string;
  category: string;
}

export interface Listing {
  id: number;
  price: string;
  ppsf: string;
  beds: number;
  baths: number;
  sqft: number;
  address: string;
  status: 'Active' | 'Pending' | 'Coming Soon';
  lot: string;
  img: string;
}

// ─── Main Community Entity (raw from JSON) ───

export interface CommunityEntity {
  identity: CommunityIdentity;
  narrative: CommunityNarrative;
  location: CommunityLocation;
  amenityIds: string[];
  signatureAmenityId: string | null;
  nearestTrailId: string | null;
  residential: CommunityResidential;
  golf: GolfInfo | null;
  recognition: string | null;
  market: MarketData | null;
  qualityOfLife: QualityMetric[] | null;
  economy: EconomyData | null;
  gallery: GalleryImage[] | null;
  pois?: EnrichedPoi[];
}

// ─── Resolved Community (what components receive) ───

export interface ResolvedCommunity extends CommunityEntity {
  // Resolved FK references
  amenities: AmenityEntity[];
  signatureAmenity: AmenityEntity | null;
  nearestTrail: AmenityEntity | null;
  region: RegionEntity;
  section: SectionEntity;
  zipcode: ZipcodeEntity;
  heroImage: string;

  // Convenience flat accessors (avoid deep nesting in templates)
  id: string;
  slug: string;
  name: string;
  city: string;
  priceRange: string;
  gating: string;
  zipCode: string;
  categoryTags: string[];
  website: string;
  coordinates: [number, number];
  tagline: string;
  description: string;
}

// ─── Database wrapper (JSON root) ───

export interface CommunityDatabase {
  meta: {
    version: string;
    sourceVersion?: string;
    schema?: string;
    generated: string;
    enriched?: boolean;
    entities: {
      regions: number;
      zipcodes: number;
      sections?: number;
      amenities: number;
      communities: number;
      pois?: number;
    };
    pipeline?: {
      totalApiCost: number;
      cacheHits: number;
    };
  };
  regions: RegionEntity[];
  zipcodes: ZipcodeEntity[];
  sections: SectionEntity[];
  amenities: AmenityEntity[];
  communities: CommunityEntity[];
}
