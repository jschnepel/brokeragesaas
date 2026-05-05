/**
 * Active + Pending listings, sourced live from the Spark API.
 *
 * Filter scope: StandardStatus IN ('Active', 'Pending', 'Active Under
 * Contract') — no agent narrowing. Same scope premium-site uses.
 *
 * Caches per-Lambda-instance for 60s — Spark has rate limits (one
 * identical request per ~15min triggers 429), and yong2 traffic doesn't
 * need second-by-second freshness for an IDX listings page.
 *
 * Maps the Spark Property record to the existing `Listing` type so
 * components downstream (ListingGrid, ListingHeroGallery, etc.) work
 * unchanged from the prior RDS-backed code path.
 */

import { fetchAllProperties, type SparkProperty } from './client';
import type { Listing, ListingPhoto } from '@/lib/types';
import { listingSlug } from '@/lib/listings';

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  at: number;
  promise: Promise<Listing[]>;
}
let listingsCache: CacheEntry | null = null;

/**
 * Build the OData $filter clause for Active + Pending IDX listings.
 * No agent narrowing — premium-site doesn't filter at the query layer
 * either; the IDX scope is the entire ARMLS Active+Pending universe.
 */
function buildActivePendingFilter(): string {
  return (
    `(StandardStatus eq 'Active' or StandardStatus eq 'Pending' ` +
    `or StandardStatus eq 'Active Under Contract')`
  );
}

// ── Spark → Listing mapper ──────────────────────────

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asInt(v: unknown): number | null {
  const n = asNumber(v);
  return n != null ? Math.round(n) : null;
}

function asBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
  return false;
}

/**
 * Spark Property records carry a Media[] array — each item has
 * MediaURL, Order, ShortDescription, MediaType. We extract photo URLs
 * sorted by Order.
 */
function extractPhotos(record: SparkProperty): { photos: string[]; photoUrls: ListingPhoto[] } {
  const media = record['Media'];
  if (!Array.isArray(media)) return { photos: [], photoUrls: [] };

  const photoUrls: ListingPhoto[] = [];
  const sorted = [...media].sort((a, b) => {
    const ao = (a as { Order?: number })?.Order ?? 0;
    const bo = (b as { Order?: number })?.Order ?? 0;
    return ao - bo;
  });

  for (const item of sorted) {
    if (!item || typeof item !== 'object') continue;
    const m = item as { MediaURL?: unknown; ShortDescription?: unknown; MediaType?: unknown };
    // Filter to images only; Spark also returns floor-plan PDFs etc.
    const isImage =
      typeof m.MediaType !== 'string' || m.MediaType.toLowerCase().startsWith('image');
    const url = asString(m.MediaURL);
    if (url && isImage) {
      photoUrls.push({ url, desc: asString(m.ShortDescription) });
    }
  }
  return { photos: photoUrls.map((p) => p.url), photoUrls };
}

/** Days on market — prefer DaysOnMarket, fall back to CumulativeDaysOnMarket. */
function deriveDaysOnMarket(r: SparkProperty): number | null {
  return asInt(r['DaysOnMarket']) ?? asInt(r['CumulativeDaysOnMarket']);
}

/** Price-per-sqft — prefer PricePerSquareFoot, derive from list_price/living_area otherwise. */
function derivePricePerSqft(r: SparkProperty): number | null {
  const explicit = asNumber(r['PricePerSquareFoot']);
  if (explicit != null && explicit > 0) return explicit;
  const price = asNumber(r['ListPrice']);
  const area = asNumber(r['LivingArea']);
  if (price != null && area != null && area > 0) {
    return Math.round(price / area);
  }
  return null;
}

function sparkRecordToListing(r: SparkProperty): Listing {
  const { photos, photoUrls } = extractPhotos(r);
  const listingId = asString(r['ListingId']) ?? asString(r['ListingKey']) ?? '';
  const listingKey = asString(r['ListingKey']) ?? listingId;
  const unparsed = asString(r['UnparsedAddress']) ?? '';
  const community =
    asString(r['SubdivisionName']) ?? asString(r['CityRegion']) ?? asString(r['City']) ?? '';

  return {
    listingKey,
    listingId,
    slug: listingSlug(unparsed, listingId),
    status: asString(r['StandardStatus']) ?? 'Active',
    unparsedAddress: unparsed,
    streetNumber: asString(r['StreetNumber']),
    streetName: asString(r['StreetName']),
    streetSuffix: asString(r['StreetSuffix']),
    city: asString(r['City']),
    postalCode: asString(r['PostalCode']),
    county: asString(r['CountyOrParish']),
    subdivisionDisplay: asString(r['SubdivisionName']),
    communitySlug: null,
    communityName: asString(r['SubdivisionName']),
    regionSlug: null,
    regionName: asString(r['MLSAreaMajor']),
    community,
    listPrice: asNumber(r['ListPrice']),
    pricePerSqft: derivePricePerSqft(r),
    bedrooms: asInt(r['BedroomsTotal']),
    bathroomsFull: asInt(r['BathroomsFull']),
    bathroomsHalf: asInt(r['BathroomsHalf']),
    bathroomsTotal: asNumber(r['BathroomsTotalInteger']) ?? asNumber(r['BathroomsTotalDecimal']),
    livingArea: asNumber(r['LivingArea']),
    lotAcres: asNumber(r['LotSizeAcres']),
    lotSqft: asNumber(r['LotSizeSquareFeet']),
    yearBuilt: asInt(r['YearBuilt']),
    daysOnMarket: deriveDaysOnMarket(r),
    latitude: asNumber(r['Latitude']),
    longitude: asNumber(r['Longitude']),
    propertyType: asString(r['PropertyType']),
    propertySubType: asString(r['PropertySubType']),
    hasPool: asBool(r['PoolPrivateYN']),
    hasFireplace: asBool(r['FireplaceYN']),
    hasGarage: asInt(r['GarageSpaces']) ? true : false,
    isLuxury: (asNumber(r['ListPrice']) ?? 0) >= 3_000_000,
    publicRemarks: asString(r['PublicRemarks']),
    coverPhotoUrl: photos[0] ?? null,
    photos,
    photoUrls,
    listAgentKey: asString(r['ListAgentMlsId']),
    listAgentName: asString(r['ListAgentFullName']),
    modificationTimestamp: asString(r['ModificationTimestamp']),
  };
}

// ── Public API ──────────────────────────────────────

/**
 * Top-N Active + Pending listings, ordered by ListPrice desc — used to
 * power /portfolio (curated card grid). Cached per Lambda instance
 * for 60s. Returns [] (not throws) on Spark errors so the page renders
 * an empty grid rather than a 500.
 */
export async function getYongActiveListings(): Promise<Listing[]> {
  const now = Date.now();
  if (listingsCache && now - listingsCache.at < CACHE_TTL_MS) {
    return listingsCache.promise;
  }

  const promise = (async () => {
    try {
      const records = await fetchAllProperties({
        filter: buildActivePendingFilter(),
        top: 60,
        orderby: 'ListPrice desc',
        maxPages: 1,
      });
      return records.map(sparkRecordToListing);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[spark/listings] getYongActiveListings failed:', err);
      // Evict failed cache so the next request retries instead of pinning.
      listingsCache = null;
      return [];
    }
  })();

  listingsCache = { at: now, promise };
  return promise;
}

/**
 * Single listing by slug. Resolves slug → listing_id (the trailing
 * digits) → Spark direct lookup by ListingId. Falls back to a scan of
 * the cached top listings if direct lookup yields nothing.
 */
export async function getYongListingBySlug(slug: string): Promise<Listing | null> {
  const match = slug.match(/-(\d+)$/);
  const listingId = match ? match[1] : null;

  if (listingId) {
    try {
      const records = await fetchAllProperties({
        filter:
          `ListingId eq '${listingId}' ` +
          `and ${buildActivePendingFilter()}`,
        top: 1,
      });
      if (records.length > 0) {
        return sparkRecordToListing(records[0]);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[spark/listings] getYongListingBySlug direct lookup failed:', err);
    }
  }

  // Fallback: scan the cached top set.
  const all = await getYongActiveListings();
  return all.find((l) => l.slug === slug) ?? null;
}
