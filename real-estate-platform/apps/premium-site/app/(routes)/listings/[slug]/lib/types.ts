// types.ts — All types for the listing detail page enrichment layer

/** Parse JSONB array fields from database — handles string and array inputs */
export function parseJsonbArray(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
  return [];
}

/** Cached commute data for curated destinations */
export interface CommuteDestination {
  name: string;
  lat: number;
  lng: number;
  distanceMiles: number | null;
  driveMinutes: number | null;
}

export interface CommuteData {
  destinations: CommuteDestination[];
  groceryName: string | null;
  groceryDistanceMiles: number | null;
  groceryDriveMinutes: number | null;
}

/** Lifestyle intelligence data */
export interface LifestyleData {
  elevationFt: number | null;
  elevationDiffFt: number | null;
  tempDiffF: number | null;
  aqiCurrent: number | null;
  aqiCategory: string | null;
  aqiMetroAvg: number | null;
  noiseCategory: string | null;
  noiseDescriptor: string | null;
  bortleScale: number | null;
  bortleLabel: string | null;
}

/** Validated nearby amenity from Google Places */
export interface NearbyAmenity {
  name: string;
  distanceMiles: number;
  category: NearbyCategory;
}

export type NearbyCategory = 'dining' | 'golf' | 'grocery' | 'shopping' | 'medical';

export interface NearbyData {
  dining: NearbyAmenity[];
  golf: NearbyAmenity[];
  grocery: NearbyAmenity[];
  shopping: NearbyAmenity[];
  medical: NearbyAmenity[];
}

/** Full enrichment cache row */
export interface ListingEnrichment {
  listingKey: string;
  commuteData: CommuteData | null;
  lifestyleData: LifestyleData | null;
  nearbyData: NearbyData | null;
  createdAt: string;
  updatedAt: string;
}

/** Calculated insights (pure math, no API) */
export interface CalculatedInsights {
  pricePerSqFt: number | null;
  domListing: number | null;
  domAreaAvg: number | null;
}

/** Curated destination definition (static config) */
export interface CuratedDestination {
  name: string;
  lat: number;
  lng: number;
}
