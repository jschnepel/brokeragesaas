import type { CommuteData, LifestyleData } from './types';
import { CURATED_DESTINATIONS, PHOENIX_ELEVATION_BASELINE_FT } from './destinations';
import { getOsrmRoutes } from './osrm-client';
import { getListingEnrichment, upsertListingEnrichment } from '@platform/database/src/queries/enrichment';
import {
  fetchElevation, deriveTemperatureDiff, fetchAirQuality,
  PHOENIX_METRO_AVG_AQI, estimateBortleScale, estimateNoiseLevel,
} from './lifestyle-clients';

export async function getCommuteData(
  listingKey: string,
  lat: number,
  lng: number,
): Promise<CommuteData | null> {
  const cached = await getListingEnrichment(listingKey);
  if (cached?.commute_data) {
    return cached.commute_data as CommuteData;
  }

  const results = await getOsrmRoutes(lat, lng,
    CURATED_DESTINATIONS.map((d) => ({ lat: d.lat, lng: d.lng })),
  );

  const destinations = CURATED_DESTINATIONS.map((dest, i) => ({
    name: dest.name,
    lat: dest.lat,
    lng: dest.lng,
    distanceMiles: results[i]?.distanceMiles ?? null,
    driveMinutes: results[i]?.durationMinutes ?? null,
  }));

  const existingCache = await getListingEnrichment(listingKey);
  const groceryCache = existingCache?.grocery_data as { name: string; distanceMiles: number } | null;

  const commuteData: CommuteData = {
    destinations,
    groceryName: groceryCache?.name ?? null,
    groceryDistanceMiles: groceryCache?.distanceMiles ?? null,
    groceryDriveMinutes: null,
  };

  upsertListingEnrichment(listingKey, { commuteData }).catch(() => {});

  return commuteData;
}

export async function getLifestyleData(
  listingKey: string,
  lat: number,
  lng: number,
): Promise<LifestyleData | null> {
  const cached = await getListingEnrichment(listingKey);
  if (cached?.lifestyle_data) {
    return cached.lifestyle_data as LifestyleData;
  }

  const [elevationFt, airQuality] = await Promise.all([
    fetchElevation(lat, lng),
    fetchAirQuality(lat, lng),
  ]);

  const elevationDiffFt = elevationFt != null ? elevationFt - PHOENIX_ELEVATION_BASELINE_FT : null;
  const tempDiffF = elevationFt != null ? deriveTemperatureDiff(elevationFt) : null;
  const bortle = estimateBortleScale(lat, lng);
  const noise = estimateNoiseLevel(lat, lng);

  const lifestyleData: LifestyleData = {
    elevationFt, elevationDiffFt, tempDiffF,
    aqiCurrent: airQuality?.aqi ?? null,
    aqiCategory: airQuality?.category ?? null,
    aqiMetroAvg: PHOENIX_METRO_AVG_AQI,
    noiseCategory: noise.category,
    noiseDescriptor: noise.descriptor,
    bortleScale: bortle.scale,
    bortleLabel: bortle.label,
  };

  upsertListingEnrichment(listingKey, { lifestyleData }).catch(() => {});

  return lifestyleData;
}
