import type { NearbyData } from '../lib/types';
import { fetchValidatedNearby } from '../lib/places-validator';
import { getListingEnrichment, upsertListingEnrichment } from '@platform/database/src/queries/enrichment';
import { NearbyResults } from './NearbyResults';

interface NearbySectionProps {
  listingKey: string;
  lat: number | null;
  lng: number | null;
}

export async function NearbySection({ listingKey, lat, lng }: NearbySectionProps) {
  if (lat == null || lng == null) return null;

  const cached = await getListingEnrichment(listingKey);
  if (cached?.nearby_data) {
    return <NearbyResults data={cached.nearby_data as NearbyData} />;
  }

  const nearbyData = await fetchValidatedNearby(lat, lng);

  const grocery = nearbyData.grocery[0] ?? null;
  const groceryData = grocery ? { name: grocery.name, distanceMiles: grocery.distanceMiles } : null;

  upsertListingEnrichment(listingKey, { nearbyData, groceryData }).catch(() => {});

  return <NearbyResults data={nearbyData} />;
}
