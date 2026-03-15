/**
 * Community Detail Page — Component Prop Types
 *
 * All interfaces consumed by community page components.
 * Populated by the adapter (adapter.ts) which transforms
 * raw DB rows into these shapes.
 */

// ── Market ──────────────────────────────────────────

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

// ── Gallery ─────────────────────────────────────────

export interface GalleryImage {
  url: string;
  caption: string;
  category: string;
}

// ── Quality of Life ─────────────────────────────────

export interface QualityMetric {
  metric: string;
  value: string;
  score: number;
  icon: string;
  color: string;
}

// ── Schools ─────────────────────────────────────────

export interface School {
  name: string;
  type: string;
  rating: number;
  distance: string;
}

// ── Dining ──────────────────────────────────────────

export interface Restaurant {
  name: string;
  cuisine: string;
  distance: string;
  rating: number;
  image: string;
}

// ── Economy ─────────────────────────────────────────

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
}

// ── Location & Transportation ───────────────────────

export interface KeyDistance {
  place: string;
  time: string;
}

export interface AirportInfo {
  name: string;
  type: string;
  distance: string;
}

// ── Signature Amenity ───────────────────────────────

export interface SignatureAmenity {
  icon: string;
  title: string;
  description: string;
  stats: { value: string; label: string }[];
  image: string;
}

// ── Narrative ───────────────────────────────────────

export interface NarrativeTab {
  tab: string;
  content: string;
}

export interface NarrativeData {
  tabs: NarrativeTab[] | null;
  plainText: string | null;
  tagline: string;
}

// ── Demographics ────────────────────────────────────

export interface DemographicsData {
  population: string;
  medianAge: string;
  collegeEducated: string;
  householdIncome: string;
  homeOwnership: string;
  avgHomeValue: string;
}

// ── Explore Map ─────────────────────────────────────

export interface ExploreItem {
  id: number;
  name: string;
  coords: [number, number];
  cuisine?: string;
  rating?: number;
  type?: string;
  holes?: number;
}

export interface ExploreTab {
  key: string;
  label: string;
  desc?: string;
  markerColor: string;
  items: ExploreItem[];
}

export interface ExploreData {
  center: [number, number];
  zoom: number;
  tabs: ExploreTab[];
}

// ── Main Page Data ──────────────────────────────────

export interface CommunityPageData {
  // Identity
  id: string;
  name: string;
  city: string;
  zipCode: string;
  elevation: string;
  priceRange: string;
  gating: string;
  heroImage: string;
  website: string;
  tags: string[];
  coordinates: [number, number] | null;
  boundaryGeoJson: Record<string, unknown> | null;

  // Hierarchy
  regionId: string;
  regionName: string;
  sectionLabel: string | null;

  // Content
  narrative: NarrativeData;
  stats: MarketStats | null;
  metrics: MarketMetric[];
  gallery: GalleryImage[];

  // Community data
  demographics: DemographicsData | null;
  qualityOfLife: QualityMetric[];
  schools: School[];
  restaurants: Restaurant[];

  // Economy
  employers: Employer[];
  economicStats: EconomicStat[];

  // Transportation
  airports: {
    private: AirportInfo;
    commercial: AirportInfo;
  };
  keyDistances: KeyDistance[];

  // Amenities
  signatureAmenity: SignatureAmenity;
  exploreData: ExploreData | null;
}
