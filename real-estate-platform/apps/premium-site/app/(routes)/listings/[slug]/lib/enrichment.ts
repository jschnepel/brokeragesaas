import type { CommuteData } from './types';
import { CURATED_DESTINATIONS } from './destinations';
import { getOsrmRoutes } from './osrm-client';
import { getListingEnrichment, upsertListingEnrichment } from '@platform/database/src/queries/enrichment';

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
