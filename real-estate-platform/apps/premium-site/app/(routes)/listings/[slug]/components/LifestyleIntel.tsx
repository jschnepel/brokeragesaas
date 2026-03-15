import type { LifestyleData } from '../lib/types';
import {
  fetchElevation, deriveTemperatureDiff, fetchAirQuality,
  PHOENIX_METRO_AVG_AQI, estimateBortleScale, estimateNoiseLevel,
} from '../lib/lifestyle-clients';
import { PHOENIX_ELEVATION_BASELINE_FT } from '../lib/destinations';
import { getListingEnrichment, upsertListingEnrichment } from '@platform/database/src/queries/enrichment';
import { LifestyleCards } from './LifestyleCards';

interface LifestyleIntelProps {
  listingKey: string;
  lat: number;
  lng: number;
}

export async function LifestyleIntel({ listingKey, lat, lng }: LifestyleIntelProps) {
  const cached = await getListingEnrichment(listingKey);
  if (cached?.lifestyle_data) {
    return <LifestyleCards data={cached.lifestyle_data as LifestyleData} />;
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

  return <LifestyleCards data={lifestyleData} />;
}
