import { useState, useEffect, useCallback } from 'react';
import type { SparkListing } from '../lib/sparkApi';
import {
  getListings,
  getListing,
  getLuxuryListings,
  getListingsByCity,
  getActiveListings
} from '../lib/sparkApi';

interface UseSparkListingsOptions {
  limit?: number;
  offset?: number;
  filter?: string;
  orderby?: string;
  autoFetch?: boolean;
}

interface UseSparkListingsReturn {
  listings: SparkListing[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Generic hook for fetching listings
export function useSparkListings(options: UseSparkListingsOptions = {}): UseSparkListingsReturn {
  const { autoFetch = true, ...apiOptions } = options;
  const [listings, setListings] = useState<SparkListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getListings(apiOptions);
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, [apiOptions.limit, apiOptions.offset, apiOptions.filter, apiOptions.orderby]);

  useEffect(() => {
    if (autoFetch) {
      fetchListings();
    }
  }, [autoFetch, fetchListings]);

  return { listings, loading, error, refetch: fetchListings };
}

// Hook for luxury listings (1M+)
export function useLuxuryListings(options: UseSparkListingsOptions = {}): UseSparkListingsReturn {
  const { autoFetch = true, ...apiOptions } = options;
  const [listings, setListings] = useState<SparkListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLuxuryListings(apiOptions);
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch luxury listings');
    } finally {
      setLoading(false);
    }
  }, [apiOptions.limit, apiOptions.offset, apiOptions.filter, apiOptions.orderby]);

  useEffect(() => {
    if (autoFetch) {
      fetchListings();
    }
  }, [autoFetch, fetchListings]);

  return { listings, loading, error, refetch: fetchListings };
}

// Hook for listings by city
export function useListingsByCity(
  city: string,
  options: UseSparkListingsOptions = {}
): UseSparkListingsReturn {
  const { autoFetch = true, ...apiOptions } = options;
  const [listings, setListings] = useState<SparkListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    if (!city) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getListingsByCity(city, apiOptions);
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch city listings');
    } finally {
      setLoading(false);
    }
  }, [city, apiOptions.limit, apiOptions.offset, apiOptions.filter, apiOptions.orderby]);

  useEffect(() => {
    if (autoFetch && city) {
      fetchListings();
    }
  }, [autoFetch, city, fetchListings]);

  return { listings, loading, error, refetch: fetchListings };
}

// Hook for fetching a single listing by ID
interface UseSparkListingReturn {
  listing: SparkListing | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSparkListing(listingId: string | undefined): UseSparkListingReturn {
  const [listing, setListing] = useState<SparkListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListing = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getListing(listingId);
      setListing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listing');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    if (listingId) {
      fetchListing();
    }
  }, [listingId, fetchListing]);

  return { listing, loading, error, refetch: fetchListing };
}

// Hook for active listings only
export function useActiveListings(options: UseSparkListingsOptions = {}): UseSparkListingsReturn {
  const { autoFetch = true, ...apiOptions } = options;
  const [listings, setListings] = useState<SparkListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActiveListings(apiOptions);
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active listings');
    } finally {
      setLoading(false);
    }
  }, [apiOptions.limit, apiOptions.offset, apiOptions.filter, apiOptions.orderby]);

  useEffect(() => {
    if (autoFetch) {
      fetchListings();
    }
  }, [autoFetch, fetchListings]);

  return { listings, loading, error, refetch: fetchListings };
}
