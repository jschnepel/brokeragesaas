/**
 * /api/listings — ARMLS listing search & detail
 * Queries RDS (ARMLS mirror), not Neon.
 * All results filtered by IDX display flags.
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleAPIError } from '@/middleware/error-handler';
import {
  searchListings,
  getListingByKey,
  getListingById,
  getListingAgent,
  getMarketStats,
  getListingCounts,
} from '@platform/database/src/queries/listings';
import type { ListingSearchFilters } from '@platform/database/src/queries/listings';

/**
 * GET /api/listings
 * Query params: city, postalCode, subdivisionName, propertyType,
 *   minPrice, maxPrice, minBeds, maxBeds, minBaths, minSqft, maxSqft,
 *   minYearBuilt, hasPool, hasGarage, sortBy, limit, offset,
 *   listingKey, listingId, mode (search|detail|stats|counts|agent)
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const mode = params.get('mode') ?? 'search';

    switch (mode) {
      case 'detail': {
        const listingKey = params.get('listingKey');
        const listingId = params.get('listingId');

        if (!listingKey && !listingId) {
          return NextResponse.json(
            { error: 'listingKey or listingId required' },
            { status: 400 }
          );
        }

        const listing = listingKey
          ? await getListingByKey(listingKey)
          : await getListingById(listingId!);

        if (!listing) {
          return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        return NextResponse.json({ listing });
      }

      case 'agent': {
        const listingKey = params.get('listingKey');
        if (!listingKey) {
          return NextResponse.json(
            { error: 'listingKey required for agent lookup' },
            { status: 400 }
          );
        }

        const agent = await getListingAgent(listingKey);
        return NextResponse.json({ agent });
      }

      case 'stats': {
        const stats = await getMarketStats({
          city: params.get('city') ?? undefined,
          postalCode: params.get('postalCode') ?? undefined,
          subdivisionName: params.get('subdivisionName') ?? undefined,
        });

        return NextResponse.json({ stats });
      }

      case 'counts': {
        const counts = await getListingCounts();
        return NextResponse.json({ counts });
      }

      case 'search':
      default: {
        const filters: ListingSearchFilters = {};

        if (params.get('status')) filters.status = params.get('status')!;
        if (params.get('city')) filters.city = params.get('city')!;
        if (params.get('postalCode')) filters.postalCode = params.get('postalCode')!;
        if (params.get('subdivisionName')) filters.subdivisionName = params.get('subdivisionName')!;
        if (params.get('propertyType')) filters.propertyType = params.get('propertyType')!;
        if (params.get('minPrice')) filters.minPrice = Number(params.get('minPrice'));
        if (params.get('maxPrice')) filters.maxPrice = Number(params.get('maxPrice'));
        if (params.get('minBeds')) filters.minBeds = Number(params.get('minBeds'));
        if (params.get('maxBeds')) filters.maxBeds = Number(params.get('maxBeds'));
        if (params.get('minBaths')) filters.minBaths = Number(params.get('minBaths'));
        if (params.get('minSqft')) filters.minSqft = Number(params.get('minSqft'));
        if (params.get('maxSqft')) filters.maxSqft = Number(params.get('maxSqft'));
        if (params.get('minYearBuilt')) filters.minYearBuilt = Number(params.get('minYearBuilt'));
        if (params.get('hasPool') === 'true') filters.hasPool = true;
        if (params.get('hasGarage') === 'true') filters.hasGarage = true;
        if (params.get('sortBy')) {
          filters.sortBy = params.get('sortBy') as ListingSearchFilters['sortBy'];
        }
        if (params.get('limit')) filters.limit = Number(params.get('limit'));
        if (params.get('offset')) filters.offset = Number(params.get('offset'));

        const result = await searchListings(filters);

        return NextResponse.json({
          listings: result.listings,
          pagination: {
            total: result.total,
            limit: filters.limit ?? 25,
            offset: filters.offset ?? 0,
            hasMore: (filters.offset ?? 0) + (filters.limit ?? 25) < result.total,
          },
        });
      }
    }
  } catch (error) {
    return handleAPIError(error);
  }
}
