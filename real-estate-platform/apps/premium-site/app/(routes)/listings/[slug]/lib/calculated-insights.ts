import type { CalculatedInsights } from './types';
import type { ListingDetail } from '@platform/database/src/queries/listings';
import { getCommunityScorecard } from '@platform/database/src/queries/analytics';

export function calculatePricePerSqFt(
  listPrice: number | null,
  livingArea: number | null,
): number | null {
  if (!listPrice || !livingArea || livingArea === 0) return null;
  return Math.round(listPrice / livingArea);
}

export async function fetchAreaAvgDom(
  listing: Pick<ListingDetail, 'subdivision_name' | 'city' | 'postal_code'>,
): Promise<number | null> {
  if (listing.subdivision_name) {
    const result = await getCommunityScorecard({ subdivisionName: listing.subdivision_name });
    if (result?.avgDom != null) return result.avgDom;
  }
  if (listing.city) {
    const result = await getCommunityScorecard({ city: listing.city });
    if (result?.avgDom != null) return result.avgDom;
  }
  if (listing.postal_code) {
    const result = await getCommunityScorecard({ postalCode: listing.postal_code });
    if (result?.avgDom != null) return result.avgDom;
  }
  return null;
}

export async function getCalculatedInsights(
  listing: ListingDetail,
): Promise<CalculatedInsights> {
  const pricePerSqFt = calculatePricePerSqFt(listing.list_price, listing.living_area);
  const domListing = listing.days_on_market ?? null;
  const domAreaAvg = await fetchAreaAvgDom(listing);
  return { pricePerSqFt, domListing, domAreaAvg };
}
