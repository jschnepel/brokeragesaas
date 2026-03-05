'use server';

import {
  searchListings,
  getListingByKey,
  getListingPhotos,
} from '@platform/database/src/queries/listings';
import type {
  ListingSearchFilters,
  ListingRecord,
  ListingDetail,
  ListingPhoto,
} from '@platform/database/src/queries/listings';

export type { ListingSearchFilters, ListingRecord, ListingDetail, ListingPhoto };

/**
 * Fetch listings for the search page (SSR).
 */
export async function fetchListings(filters: ListingSearchFilters = {}) {
  return searchListings(filters);
}

/**
 * Fetch a single listing by listing_key (SSR).
 */
export async function fetchListingDetail(listingKey: string) {
  return getListingByKey(listingKey);
}

/**
 * Fetch photos for a listing (SSR).
 */
export async function fetchListingPhotos(listingKey: string) {
  return getListingPhotos(listingKey);
}
