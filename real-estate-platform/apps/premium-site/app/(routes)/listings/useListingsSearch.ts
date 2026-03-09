'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ListingSearchFilters } from '@platform/database/src/queries/listings';

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export interface FilterState {
  city: string;
  minPrice: string;
  maxPrice: string;
  minBeds: string;
  minBaths: string;
  minSqft: string;
  propertyType: string;
  listingType: string;
  sortBy: string;
  hasPool: string;
  hasGarage: string;
  hasFireplace: string;
  isHorseProperty: string;
  minYearBuilt: string;
  maxDom: string;
  maxHoa: string;
  minLotAcres: string;
  minStories: string;
  minGarageSpaces: string;
  keyword: string;
  subdivisionName: string;
  page: string;
}

const FILTER_KEYS: (keyof FilterState)[] = [
  'city', 'minPrice', 'maxPrice', 'minBeds', 'minBaths', 'minSqft',
  'propertyType', 'listingType', 'sortBy', 'hasPool', 'hasGarage',
  'hasFireplace', 'isHorseProperty', 'minYearBuilt', 'maxDom', 'maxHoa',
  'minLotAcres', 'minStories', 'minGarageSpaces', 'keyword',
  'subdivisionName', 'page',
];

const BOUND_KEYS = ['swLat', 'swLng', 'neLat', 'neLng'] as const;

function parseFilters(params: URLSearchParams): FilterState {
  return {
    city: params.get('city') ?? '',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    minBeds: params.get('minBeds') ?? '',
    minBaths: params.get('minBaths') ?? '',
    minSqft: params.get('minSqft') ?? '',
    propertyType: params.get('propertyType') ?? '',
    listingType: params.get('listingType') ?? '',
    sortBy: params.get('sortBy') ?? '',
    hasPool: params.get('hasPool') ?? '',
    hasGarage: params.get('hasGarage') ?? '',
    hasFireplace: params.get('hasFireplace') ?? '',
    isHorseProperty: params.get('isHorseProperty') ?? '',
    minYearBuilt: params.get('minYearBuilt') ?? '',
    maxDom: params.get('maxDom') ?? '',
    maxHoa: params.get('maxHoa') ?? '',
    minLotAcres: params.get('minLotAcres') ?? '',
    minStories: params.get('minStories') ?? '',
    minGarageSpaces: params.get('minGarageSpaces') ?? '',
    keyword: params.get('keyword') ?? '',
    subdivisionName: params.get('subdivisionName') ?? '',
    page: params.get('page') ?? '',
  };
}

/** Encode polygon as "lng,lat;lng,lat;..." for URL */
function encodePolygon(polygon: [number, number][]): string {
  return polygon.map(([lng, lat]) => `${lng.toFixed(6)},${lat.toFixed(6)}`).join(';');
}

/** Decode polygon from URL param */
function decodePolygon(raw: string): [number, number][] | null {
  if (!raw) return null;
  const points = raw.split(';').map((pair) => {
    const [lng, lat] = pair.split(',').map(Number);
    return [lng, lat] as [number, number];
  });
  if (points.length < 3 || points.some(([lng, lat]) => isNaN(lng) || isNaN(lat))) {
    return null;
  }
  return points;
}

export function filtersToSearchFilters(
  state: FilterState,
  bounds: MapBounds | null,
  polygon: [number, number][] | null
): ListingSearchFilters {
  const filters: ListingSearchFilters = {
    status: ['Active', 'Active Under Contract', 'Coming Soon'],
    sortBy: (state.sortBy as ListingSearchFilters['sortBy']) || 'price_desc',
  };

  if (state.city) filters.city = state.city;
  if (state.minPrice) filters.minPrice = parseInt(state.minPrice, 10);
  if (state.maxPrice) filters.maxPrice = parseInt(state.maxPrice, 10);
  if (state.minBeds) filters.minBeds = parseInt(state.minBeds, 10);
  if (state.minBaths) filters.minBaths = parseInt(state.minBaths, 10);
  if (state.minSqft) filters.minSqft = parseInt(state.minSqft, 10);
  if (state.propertyType) filters.propertyType = state.propertyType;
  if (state.listingType && (state.listingType === 'sale' || state.listingType === 'rent' || state.listingType === 'all')) {
    filters.listingType = state.listingType;
  }
  if (state.hasPool === 'true') filters.hasPool = true;
  if (state.hasGarage === 'true') filters.hasGarage = true;
  if (state.hasFireplace === 'true') filters.hasFireplace = true;
  if (state.isHorseProperty === 'true') filters.isHorseProperty = true;
  if (state.minYearBuilt) filters.minYearBuilt = parseInt(state.minYearBuilt, 10);
  if (state.maxDom) filters.maxDom = parseInt(state.maxDom, 10);
  if (state.maxHoa) filters.maxHoa = parseInt(state.maxHoa, 10);
  if (state.minLotAcres) filters.minLotAcres = parseFloat(state.minLotAcres);
  if (state.minStories) filters.minStories = parseInt(state.minStories, 10);
  if (state.minGarageSpaces) filters.minGarageSpaces = parseInt(state.minGarageSpaces, 10);
  if (state.keyword) filters.keyword = state.keyword;
  if (state.subdivisionName) filters.subdivisionName = state.subdivisionName;

  if (polygon && polygon.length >= 3) {
    filters.polygon = polygon;
    filters.limit = 200;
  } else if (bounds) {
    filters.swLat = bounds.swLat;
    filters.swLng = bounds.swLng;
    filters.neLat = bounds.neLat;
    filters.neLng = bounds.neLng;
    filters.limit = 100;
  } else {
    const page = Math.max(1, parseInt(state.page || '1', 10));
    filters.limit = 24;
    filters.offset = (page - 1) * 24;
  }

  return filters;
}

export function useListingsSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pendingBounds, setPendingBounds] = useState<MapBounds | null>(null);

  const filterState = useMemo(() => parseFilters(searchParams), [searchParams]);

  const mapBounds = useMemo((): MapBounds | null => {
    const sw = searchParams.get('swLat');
    const se = searchParams.get('swLng');
    const ne = searchParams.get('neLat');
    const nw = searchParams.get('neLng');
    if (sw && se && ne && nw) {
      return {
        swLat: parseFloat(sw),
        swLng: parseFloat(se),
        neLat: parseFloat(ne),
        neLng: parseFloat(nw),
      };
    }
    return null;
  }, [searchParams]);

  const polygon = useMemo((): [number, number][] | null => {
    const raw = searchParams.get('polygon');
    return raw ? decodePolygon(raw) : null;
  }, [searchParams]);

  const hasActiveFilters = useMemo(() => {
    return FILTER_KEYS.some(
      (k) => k !== 'sortBy' && k !== 'page' && filterState[k] !== ''
    );
  }, [filterState]);

  const activeFilterCount = useMemo(() => {
    return FILTER_KEYS.filter(
      (k) => k !== 'sortBy' && k !== 'page' && filterState[k] !== ''
    ).length;
  }, [filterState]);

  const buildUrl = useCallback(
    (
      updates: Partial<FilterState>,
      bounds?: MapBounds | null,
      poly?: [number, number][] | null
    ) => {
      const merged = { ...filterState, ...updates };
      const params = new URLSearchParams();

      for (const key of FILTER_KEYS) {
        const val = merged[key];
        if (val && val !== '') {
          params.set(key, val);
        }
      }

      // Polygon takes precedence over bounds
      const p = poly === undefined ? polygon : poly;
      if (p && p.length >= 3) {
        params.set('polygon', encodePolygon(p));
      } else {
        const b = bounds === undefined ? mapBounds : bounds;
        if (b) {
          for (const key of BOUND_KEYS) {
            params.set(key, String(b[key]));
          }
        }
      }

      const qs = params.toString();
      return qs ? `/listings?${qs}` : '/listings';
    },
    [filterState, mapBounds, polygon]
  );

  const setFilters = useCallback(
    (updates: Partial<FilterState>) => {
      const withPageReset = { ...updates, page: '' };
      router.replace(buildUrl(withPageReset), { scroll: false });
    },
    [router, buildUrl]
  );

  const setMapBounds = useCallback(
    (bounds: MapBounds) => {
      setPendingBounds(bounds);
    },
    []
  );

  const applyMapBounds = useCallback(() => {
    if (!pendingBounds) return;
    router.replace(buildUrl({ page: '' }, pendingBounds, null), { scroll: false });
    setPendingBounds(null);
  }, [pendingBounds, router, buildUrl]);

  const setPolygon = useCallback(
    (poly: [number, number][]) => {
      // Commit polygon to URL immediately, clear bounds
      router.replace(buildUrl({ page: '' }, null, poly), { scroll: false });
      setPendingBounds(null);
    },
    [router, buildUrl]
  );

  const clearPolygon = useCallback(() => {
    router.replace(buildUrl({ page: '' }, null, null), { scroll: false });
  }, [router, buildUrl]);

  const clearFilters = useCallback(() => {
    const cleared: Partial<FilterState> = {};
    for (const key of FILTER_KEYS) {
      cleared[key] = '';
    }
    router.replace(buildUrl(cleared, mapBounds, polygon), { scroll: false });
  }, [router, buildUrl, mapBounds, polygon]);

  const clearMapBounds = useCallback(() => {
    setPendingBounds(null);
    router.replace(buildUrl({}, null, polygon), { scroll: false });
  }, [router, buildUrl, polygon]);

  const setPage = useCallback(
    (page: number) => {
      router.replace(buildUrl({ page: page > 1 ? String(page) : '' }), { scroll: false });
    },
    [router, buildUrl]
  );

  return {
    filterState,
    mapBounds,
    pendingBounds,
    polygon,
    hasActiveFilters,
    activeFilterCount,
    setFilters,
    setMapBounds,
    applyMapBounds,
    setPolygon,
    clearPolygon,
    clearFilters,
    clearMapBounds,
    setPage,
  };
}
