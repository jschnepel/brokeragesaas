/**
 * Yong's listings, sourced live from the Spark API.
 *
 * Filter scope:
 *   - StandardStatus IN ('Active', 'Pending')
 *   - List agent matches Yong (configurable via SPARK_LIST_AGENT_KEY env)
 *
 * Caches per-Lambda-instance for 60s — Spark has rate limits (one
 * identical request per ~15min triggers 429), and yong2 traffic doesn't
 * need second-by-second freshness for what is effectively a static
 * portfolio page.
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
 * Build the OData $filter clause for Yong's Active+Pending listings.
 *
 * Identifier resolution order:
 *   1. SPARK_LIST_AGENT_KEY env (preferred — exact MLS member ID match)
 *   2. SPARK_LIST_AGENT_NAME env (substring match on ListAgentFullName)
 *   3. Fallback: substring "Yong Choi"
 *
 * The fallback exists so the page renders something during initial setup
 * before the env var is provisioned, but in production at least one of
 * the env vars should be set.
 */
function buildAgentClause(): string {
  const key = process.env.SPARK_LIST_AGENT_KEY?.trim();
  const name = process.env.SPARK_LIST_AGENT_NAME?.trim() ?? 'Yong Choi';
  if (key) {
    return `(ListAgentMlsId eq '${key.replace(/'/g, "''")}' or CoListAgentMlsId eq '${key.replace(/'/g, "''")}')`;
  }
  // OData substring match for the name fallback.
  return `(substringof('${name.replace(/'/g, "''")}', ListAgentFullName))`;
}

function buildYongActivePendingFilter(): string {
  const agent = buildAgentClause();
  return (
    `(StandardStatus eq 'Active' or StandardStatus eq 'Pending') ` +
    `and ${agent}`
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
 * All of Yong's Active + Pending listings. Cached per Lambda instance
 * for 60s. Returns [] (not throws) on Spark errors so the portfolio
 * page renders an empty grid rather than a 500.
 */
export async function getYongActiveListings(): Promise<Listing[]> {
  const now = Date.now();
  if (listingsCache && now - listingsCache.at < CACHE_TTL_MS) {
    return listingsCache.promise;
  }

  const promise = (async () => {
    try {
      const records = await fetchAllProperties({
        filter: buildYongActivePendingFilter(),
        top: 200,
        orderby: 'ListPrice desc',
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
 * the full active-listing set if direct lookup yields nothing.
 */
export async function getYongListingBySlug(slug: string): Promise<Listing | null> {
  const match = slug.match(/-(\d+)$/);
  const listingId = match ? match[1] : null;

  if (listingId) {
    try {
      const records = await fetchAllProperties({
        filter:
          `ListingId eq '${listingId}' ` +
          `and (StandardStatus eq 'Active' or StandardStatus eq 'Pending')`,
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

  // Fallback: scan Yong's active set by slug.
  const all = await getYongActiveListings();
  return all.find((l) => l.slug === slug) ?? null;
}
