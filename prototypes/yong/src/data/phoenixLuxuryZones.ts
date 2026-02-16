import type { FeatureCollection, Feature, Polygon, MultiPolygon, Point } from 'geojson';

// --- GeoJSON Feature Property Types ---

export interface RegionGeoProperties {
  name: string;
  type: 'geographic_region';
  description: string;
  geometry_source: string;
}

export interface CommunityGeoProperties {
  name: string;
  slug: string;
  section: string;
  city: string;
  zip_code: string;
  price_range: string;
  geometry_source: string;
  subdivision_plats?: number;
  mcr_numbers?: string[];
}

export type RegionFeature = Feature<Polygon | MultiPolygon, RegionGeoProperties>;
export type CommunityFeature = Feature<Polygon | MultiPolygon | Point, CommunityGeoProperties>;

export interface GeoJSONData {
  regions: FeatureCollection<Polygon | MultiPolygon, RegionGeoProperties>;
  communities: FeatureCollection<Polygon | MultiPolygon | Point, CommunityGeoProperties>;
}

// --- Map from GeoJSON region names → app region IDs ---
// Some GeoJSON regions map to multiple app regions; we use community data for precise mapping.
const GEOJSON_REGION_TO_ID: Record<string, string> = {
  'North Scottsdale': 'north-scottsdale',
  'Paradise Valley': 'paradise-valley',
  'Cave Creek / Carefree': 'cave-creek',
  'Central Scottsdale': 'central-scottsdale',
  'Fountain Hills / Rio Verde': 'fountain-hills',
  'Peoria / Vistancia': 'peoria',
  'Phoenix / Arcadia / Biltmore': 'biltmore',
  'Anthem / North Phoenix': 'anthem',
  'Desert Mountain / Far North': 'north-scottsdale',
};

export function getRegionId(geoJsonName: string): string {
  return GEOJSON_REGION_TO_ID[geoJsonName] ?? 'north-scottsdale';
}

// --- Constants ---

export const PHOENIX_CENTER: [number, number] = [33.5722, -111.9280];
export const DEFAULT_ZOOM = 10;

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string;

export const MAP_STYLE = {
  dark: `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`,
  light: `https://api.maptiler.com/maps/dataviz-light/style.json?key=${MAPTILER_KEY}`,
  satellite: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
};

export const BRAND_COLORS = {
  navy: '#0C1C2E',
  gold: '#Bfa67a',
  goldHover: '#d4b896',
  selected: '#Bfa67a',
  hover: 'rgba(191, 166, 122, 0.4)',
  border: 'rgba(191, 166, 122, 0.6)'
};

// --- Async GeoJSON Loader ---

let cachedData: GeoJSONData | null = null;

export async function loadGeoJSON(): Promise<GeoJSONData> {
  if (cachedData) return cachedData;

  const response = await fetch('/luxury-communities.geojson');
  if (!response.ok) {
    throw new Error(`Failed to load GeoJSON: ${response.status}`);
  }

  const raw = await response.json() as FeatureCollection;

  const regionFeatures: RegionFeature[] = [];
  const communityFeatures: CommunityFeature[] = [];

  for (const feature of raw.features) {
    const props = feature.properties as Record<string, unknown>;
    if (props.type === 'geographic_region') {
      // Inject an id based on the name mapping
      regionFeatures.push(feature as RegionFeature);
    } else {
      communityFeatures.push(feature as CommunityFeature);
    }
  }

  cachedData = {
    regions: {
      type: 'FeatureCollection',
      features: regionFeatures,
    },
    communities: {
      type: 'FeatureCollection',
      features: communityFeatures,
    },
  };

  return cachedData;
}
