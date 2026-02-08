// Spark API Service for MLS Listing Data
// Documentation: https://sparkplatform.com/docs/api_services

// Use proxy in development to avoid CORS issues
const SPARK_API_BASE = import.meta.env.DEV ? '/api/spark' : 'https://sparkapi.com/v1';
const DEMO_ACCESS_TOKEN = '870vf8lm9wtm4ohi2dm9trr22';

interface SparkApiOptions {
  limit?: number;
  offset?: number;
  filter?: string;
  orderby?: string;
  select?: string;
}

interface SparkPhoto {
  Uri800?: string;
  Uri1600?: string;
  UriLarge?: string;
  Primary?: boolean;
}

export interface SparkListing {
  Id: string;
  ResourceUri: string;
  StandardFields: {
    ListingId: string;
    ListPrice: number;
    BedsTotal: number;
    BathsFull: number;
    BathsHalf?: number;
    BathsTotal?: number;
    BuildingAreaTotal: number;
    City: string;
    StateOrProvince: string;
    PostalCode: string;
    UnparsedAddress?: string;
    UnparsedFirstLineAddress?: string;
    StreetNumber?: string;
    StreetName?: string;
    StreetDirPrefix?: string;
    StreetSuffix?: string;
    YearBuilt?: number;
    PropertyType: string;
    PropertySubType?: string;
    MlsStatus: string;
    ListingKey?: string;
    Latitude?: number;
    Longitude?: number;
    LotSizeArea?: number;
    PublicRemarks?: string;
    SubdivisionName?: string;
    Photos?: SparkPhoto[];
    VirtualTours?: Array<{ Uri: string }>;
  };
}

interface SparkListingsResponse {
  D: {
    Success: boolean;
    Results: SparkListing[];
    Pagination?: {
      TotalRows: number;
      PageSize: number;
      CurrentPage: number;
      TotalPages: number;
    };
  };
}

async function fetchFromSpark<T>(
  endpoint: string,
  options: SparkApiOptions = {}
): Promise<T> {
  const params = new URLSearchParams();

  if (options.limit) params.append('_limit', options.limit.toString());
  if (options.offset) params.append('_offset', options.offset.toString());
  if (options.filter) params.append('_filter', options.filter);
  if (options.orderby) params.append('_orderby', options.orderby);
  if (options.select) params.append('_select', options.select);

  const url = `${SPARK_API_BASE}${endpoint}${params.toString() ? '?' + params.toString() : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${DEMO_ACCESS_TOKEN}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Spark API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Fetch listings with optional filters
export async function getListings(options: SparkApiOptions = {}): Promise<SparkListing[]> {
  const response = await fetchFromSpark<SparkListingsResponse>('/listings', options);
  return response.D.Results;
}

// Fetch a single listing by ID
export async function getListing(listingId: string): Promise<SparkListing | null> {
  try {
    const response = await fetchFromSpark<SparkListingsResponse>(`/listings/${listingId}`);
    return response.D.Results[0] || null;
  } catch {
    return null;
  }
}

// Fetch luxury listings (high-end properties)
export async function getLuxuryListings(options: SparkApiOptions = {}): Promise<SparkListing[]> {
  return getListings({
    ...options,
    filter: options.filter
      ? `${options.filter} And ListPrice Gt 1000000`
      : 'ListPrice Gt 1000000',
    orderby: '-ListPrice',
  });
}

// Fetch listings by city
export async function getListingsByCity(city: string, options: SparkApiOptions = {}): Promise<SparkListing[]> {
  return getListings({
    ...options,
    filter: options.filter
      ? `${options.filter} And City Eq '${city}'`
      : `City Eq '${city}'`,
  });
}

// Fetch active listings only
export async function getActiveListings(options: SparkApiOptions = {}): Promise<SparkListing[]> {
  return getListings({
    ...options,
    filter: options.filter
      ? `${options.filter} And MlsStatus Eq 'Active'`
      : "MlsStatus Eq 'Active'",
  });
}

// Format price for display
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

// Format square footage
export function formatSqft(sqft: number): string {
  return new Intl.NumberFormat('en-US').format(sqft);
}

// Get primary photo URL from listing
export function getPrimaryPhoto(listing: SparkListing): string | null {
  const photos = listing.StandardFields.Photos;
  if (!photos || photos.length === 0) return null;

  const primary = photos.find(p => p.Primary) || photos[0];
  return primary.Uri1600 || primary.Uri800 || primary.UriLarge || null;
}

// Get all photo URLs from listing
export function getAllPhotos(listing: SparkListing): string[] {
  const photos = listing.StandardFields.Photos;
  if (!photos) return [];

  return photos
    .map(p => p.Uri1600 || p.Uri800 || p.UriLarge)
    .filter((url): url is string => url !== undefined);
}
