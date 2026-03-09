'use server';

import {
  searchListingsWithPhotos,
  getListingByKey,
  getListingById,
  getListingPhotos,
} from '@platform/database/src/queries/listings';
import type {
  ListingSearchFilters,
} from '@platform/database/src/queries/listings';

/**
 * Fetch listings for the search page (SSR).
 * Uses the photo-joined query to avoid N+1 on card thumbnails.
 */
export async function fetchListings(filters: ListingSearchFilters = {}) {
  return searchListingsWithPhotos(filters);
}

/**
 * Fetch a single listing by listing_key (SSR).
 */
export async function fetchListingDetail(listingKey: string) {
  return getListingByKey(listingKey);
}

/**
 * Fetch a single listing by listing_id / MLS number (SSR).
 */
export async function fetchListingByMlsId(listingId: string) {
  return getListingById(listingId);
}

/**
 * Fetch photos for a listing (SSR).
 */
export async function fetchListingPhotos(listingKey: string) {
  return getListingPhotos(listingKey);
}
