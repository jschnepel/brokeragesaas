/**
 * Spark-backed search for the /listings page (Home Search).
 *
 * Scope: ENTIRE ARMLS Active + Pending inventory (no agent or city
 * filter). The dataset is too large to load into memory (~35-40K
 * records), so all filters are translated to OData $filter and pushed
 * to Spark — same pattern Spark itself recommends for IDX search.
 *
 * Two Spark calls per request:
 *   1. Listings page  — $top=limit, $skip=offset, $count=true (returns total)
 *   2. Pins universe  — $top=2000, $select trimmed to lat/lng/price/status
 *
 * Same return shape as lib/listings-search.ts so the existing
 * /listings page + ListingsClient work unchanged.
 *
 * Text search caveat: OData has no FTS. We approximate with a
 * substring match on UnparsedAddress (handles "10293 Chiricahua"-
 * style address queries; weaker for "silverleaf 5 bedroom" prose).
 * If text-search precision becomes a real ask, we'd add a separate
 * lite-index over UnparsedAddress + SubdivisionName + City.
 */

import {
  fetchAllProperties,
  fetchPropertiesWithMeta,
  type SparkProperty,
} from './client';
import type { Listing } from '@/lib/types';
import { listingSlug } from '@/lib/listings';
import type {
  BBox,
  PinPoint,
  PolygonGeoJSON,
  SearchOpts,
  SearchResult,
  SortKey,
  StatusFilter,
} from '@/lib/listings-search';

// ── Spark → Listing mapper (small footprint) ──

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

function extractPhotos(record: SparkProperty): { photos: string[]; cover: string | null } {
  const media = record['Media'];
  if (!Array.isArray(media)) return { photos: [], cover: null };
  const sorted = [...media].sort((a, b) => {
    const ao = (a as { Order?: number })?.Order ?? 0;
    const bo = (b as { Order?: number })?.Order ?? 0;
    return ao - bo;
  });
  // Some ARMLS records include PDFs (disclosures, brochures) under the
  // Media array with no MediaType or MediaCategory set. Passing those
  // URLs to next/image triggers a 400 on the optimizer endpoint and
  // surfaces as a broken-image tile on the gallery. Filter by:
  //   1. MediaType — when present, must start with "image"
  //   2. MediaCategory — when present, must equal "Photo" (RESO standard)
  //   3. URL host — accept Spark's photo CDN; reject documents.* host
  //   4. URL extension — accept common image extensions when explicit
  // Defaults err on the side of inclusion (data quality is uneven) but
  // any obvious non-image signal disqualifies.
  const photos: string[] = [];
  for (const item of sorted) {
    if (!item || typeof item !== 'object') continue;
    const m = item as {
      MediaURL?: unknown;
      MediaType?: unknown;
      MediaCategory?: unknown;
    };
    const url = asString(m.MediaURL);
    if (!url) continue;
    const mediaType = typeof m.MediaType === 'string' ? m.MediaType.toLowerCase() : '';
    const mediaCategory = typeof m.MediaCategory === 'string' ? m.MediaCategory.toLowerCase() : '';
    if (mediaType && !mediaType.startsWith('image')) continue;
    if (mediaCategory && mediaCategory !== 'photo') continue;
    // URL-level filter: reject documents.* host outright; require an
    // image extension when the URL has any extension at all.
    const lower = url.toLowerCase();
    if (lower.includes('://documents.')) continue;
    const extMatch = lower.match(/\.([a-z0-9]{2,4})(?:\?|$)/);
    if (extMatch && !['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(extMatch[1])) continue;
    photos.push(url);
  }
  return { photos, cover: photos[0] ?? null };
}

function derivePricePerSqft(r: SparkProperty): number | null {
  const explicit = asNumber(r['PricePerSquareFoot']);
  if (explicit != null && explicit > 0) return explicit;
  const price = asNumber(r['ListPrice']);
  const area = asNumber(r['LivingArea']);
  if (price != null && area != null && area > 0) return Math.round(price / area);
  return null;
}

/** Best-effort string-array extractor for RESO multi-value fields. */
function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === 'string' && x.length > 0);
  }
  if (typeof v === 'string' && v.length > 0) {
    // RESO sometimes returns comma-separated single-strings.
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function sparkRecordToListing(r: SparkProperty): Listing {
  const { photos, cover } = extractPhotos(r);
  const listingId = asString(r['ListingId']) ?? asString(r['ListingKey']) ?? '';
  const listingKey = asString(r['ListingKey']) ?? listingId;
  const unparsed = asString(r['UnparsedAddress']) ?? '';
  const community =
    asString(r['SubdivisionName']) ?? asString(r['CityRegion']) ?? asString(r['City']) ?? '';
  const garageSpaces = asInt(r['GarageSpaces']);

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
    daysOnMarket: asInt(r['DaysOnMarket']) ?? asInt(r['CumulativeDaysOnMarket']),
    latitude: asNumber(r['Latitude']),
    longitude: asNumber(r['Longitude']),
    propertyType: asString(r['PropertyType']),
    propertySubType: asString(r['PropertySubType']),
    hasPool: asBool(r['PoolPrivateYN']),
    hasFireplace: asBool(r['FireplaceYN']),
    hasGarage: garageSpaces ? true : false,
    isLuxury: (asNumber(r['ListPrice']) ?? 0) >= 3_000_000,
    publicRemarks: asString(r['PublicRemarks']),
    coverPhotoUrl: cover,
    photos,
    photoUrls: photos.map((url) => ({ url, desc: null })),
    listAgentKey: asString(r['ListAgentMlsId']),
    listAgentName: asString(r['ListAgentFullName']),
    modificationTimestamp: asString(r['ModificationTimestamp']),

    // ── Rich detail-page fields ─────────────────────────
    originalListPrice: asNumber(r['OriginalListPrice']),
    cumulativeDaysOnMarket: asInt(r['CumulativeDaysOnMarket']),
    storiesTotal: asInt(r['StoriesTotal']),
    fireplacesTotal: asInt(r['FireplacesTotal']),
    garageSpaces,

    architecturalStyle: asStringArray(r['ArchitecturalStyle']),
    constructionMaterials: asStringArray(r['ConstructionMaterials']),
    flooring: asStringArray(r['Flooring']),
    appliances: asStringArray(r['Appliances']),
    interiorFeatures: asStringArray(r['InteriorFeatures']),
    exteriorFeatures: asStringArray(r['ExteriorFeatures']),
    poolFeatures: asStringArray(r['PoolFeatures']),
    spaFeatures: asStringArray(r['SpaFeatures']),
    fireplaceFeatures: asStringArray(r['FireplaceFeatures']),
    parkingFeatures: asStringArray(r['ParkingFeatures']),
    view: asStringArray(r['View']),
    heating: asStringArray(r['Heating']),
    cooling: asStringArray(r['Cooling']),
    windowFeatures: asStringArray(r['WindowFeatures']),
    laundryFeatures: asStringArray(r['LaundryFeatures']),
    lotFeatures: asStringArray(r['LotFeatures']),
    fencing: asStringArray(r['Fencing']),
    vegetation: asStringArray(r['Vegetation']),
    associationAmenities: asStringArray(r['AssociationAmenities']),

    associationName: asString(r['AssociationName']),
    associationFee: asNumber(r['AssociationFee']),
    associationFeeFrequency: asString(r['AssociationFeeFrequency']),
    associationYn: asBool(r['AssociationYN']),

    taxAnnualAmount: asNumber(r['TaxAnnualAmount']),
    taxYear: asInt(r['TaxYear']),
    parcelNumber: asString(r['ParcelNumber']),

    elementarySchool: asString(r['ElementarySchool']),
    middleOrJuniorSchool: asString(r['MiddleOrJuniorSchool']),
    highSchool: asString(r['HighSchool']),
    highSchoolDistrict: asString(r['HighSchoolDistrict']),

    listOfficeName: asString(r['ListOfficeName']),
    listOfficePhone: asString(r['ListOfficePhone']),
    listAgentDirectPhone: asString(r['ListAgentDirectPhone']),

    hasSpa: asBool(r['SpaYN']),
    hasWaterfront: asBool(r['WaterfrontYN']),
  };
}

// ── OData $filter builder ──

function escapeLiteral(s: string): string {
  return s.replace(/'/g, "''");
}

function expandStatuses(filter: StatusFilter[]): string[] {
  const out = new Set<string>();
  for (const s of filter) {
    out.add(s);
    if (s === 'Pending') out.add('Active Under Contract');
  }
  return Array.from(out);
}

/**
 * Build the OData $filter for a search request. Defaults to
 * Active+Pending+ActiveUnderContract when no status is provided,
 * matching the IDX-active baseline.
 *
 * @compliance IDX (ARMLS): The InternetEntireListingDisplayYN field
 *   is required by ARMLS rules to be respected (sellers can opt out
 *   of IDX display; surfacing an opted-out listing is a violation
 *   ~$21K/occurrence). Spark's OData API rejects this field in
 *   $filter (verified build #61: 400 "field does not exist"), same
 *   reason platform's rlsir-active-snapshot Lambda doesn't filter it
 *   server-side either. The check happens post-fetch in
 *   sparkRecordToListing — records where InternetEntireListingDisplayYN
 *   is false are dropped from the result set.
 */
function buildSearchFilter(opts: SearchOpts): string {
  const clauses: string[] = [];

  // Status filter — defaults to all IDX-active variants if unset.
  // Status, price, beds are confirmed Spark-queryable.
  const statuses =
    opts.status && opts.status.length > 0
      ? expandStatuses(opts.status)
      : ['Active', 'Pending', 'Active Under Contract'];
  const statusClause = statuses.map((s) => `StandardStatus eq '${escapeLiteral(s)}'`).join(' or ');
  clauses.push(`(${statusClause})`);

  // Text query — pushed server-side via OData contains() against
  // address, city, and subdivision/community name. PublicRemarks is
  // deliberately excluded: it produces too much noise for short or
  // common terms (a search for "Indian School" matched any listing
  // that mentioned the Indian School District in marketing copy,
  // not just the listings ON Indian School Road).
  //
  // Earlier assumption that Spark's OData rejects substring matching
  // was wrong for contains() — it works fine and lets the filter
  // narrow the entire active feed rather than the top-N-by-price
  // window that post-fetch filtering would have to over-fetch from.
  if (opts.q && opts.q.trim().length > 0) {
    const escaped = escapeLiteral(opts.q.trim());
    const textClause = `(contains(UnparsedAddress,'${escaped}') or contains(City,'${escaped}') or contains(SubdivisionName,'${escaped}'))`;
    clauses.push(textClause);
  }

  if (typeof opts.priceMin === 'number') {
    clauses.push(`ListPrice ge ${opts.priceMin}`);
  }
  if (typeof opts.priceMax === 'number') {
    clauses.push(`ListPrice le ${opts.priceMax}`);
  }
  if (typeof opts.bedsMin === 'number') {
    clauses.push(`BedroomsTotal ge ${opts.bedsMin}`);
  }

  if (typeof opts.bathsMin === 'number') {
    clauses.push(`BathroomsTotalInteger ge ${opts.bathsMin}`);
  }

  if (typeof opts.sqftMin === 'number') clauses.push(`LivingArea ge ${opts.sqftMin}`);
  if (typeof opts.sqftMax === 'number') clauses.push(`LivingArea le ${opts.sqftMax}`);
  if (typeof opts.lotAcresMin === 'number') clauses.push(`LotSizeAcres ge ${opts.lotAcresMin}`);
  if (typeof opts.lotAcresMax === 'number') clauses.push(`LotSizeAcres le ${opts.lotAcresMax}`);
  if (typeof opts.yearBuiltMin === 'number') clauses.push(`YearBuilt ge ${opts.yearBuiltMin}`);
  if (typeof opts.yearBuiltMax === 'number') clauses.push(`YearBuilt le ${opts.yearBuiltMax}`);
  if (typeof opts.garageMin === 'number') clauses.push(`GarageSpaces ge ${opts.garageMin}`);

  // Boolean amenities — RESO YN fields. eq true narrows to the
  // listings where the seller explicitly confirmed the amenity;
  // null/false records drop out (matches Zillow's behavior — a
  // pool checkbox excludes "unknown").
  if (opts.hasPool) clauses.push(`PoolPrivateYN eq true`);
  if (opts.hasSpa) clauses.push(`SpaYN eq true`);
  if (opts.hasWaterfront) clauses.push(`WaterfrontYN eq true`);
  if (opts.singleStory) clauses.push(`StoriesTotal eq 1`);
  if (opts.newConstruction) clauses.push(`NewConstructionYN eq true`);

  // Price reduced — only narrows when explicitly checked. Compares
  // the seller's original list price against the current ListPrice;
  // skips records where OriginalListPrice is missing so we don't
  // accidentally exclude every listing whose feed entry omits it.
  if (opts.priceReduced) {
    clauses.push(`OriginalListPrice gt ListPrice`);
  }

  // Home Type — translates the visitor's Zillow-style buckets to
  // ARMLS PropertyType + PropertySubType clauses.
  //
  // ARMLS uses PropertyType='Residential' for FOR-SALE residential and
  // PropertyType='Residential Lease' for rentals. Filtering on
  // PropertySubType alone returns both, so we anchor 'house'/'condo'
  // to PropertyType='Residential' to exclude rentals from a for-sale
  // search.
  //
  // Filter shape — empirically required by Spark's OData parser:
  //
  //   ResidentialOnly  → PropertyType eq 'Residential' and (PST=X or PST=Y)
  //   ResidentialOnly + Land/Multi (mixed):
  //                      (PropertyType eq 'Residential' and (PST=X or PST=Y))
  //                      or PropertyType eq 'Land'
  //                      or PropertyType eq 'Residential Income'
  //   LandOnly         → PropertyType eq 'Land'
  //
  // The earlier distributed form
  //   ((PT='Residential' and PST='SFR') or (PT='Residential' and PST='Condo'))
  // confuses Spark's parser when combined with another contains()-based
  // AND clause: Spark returns Condominium results that don't satisfy
  // the contains() at all. Verified directly against the API — the
  // flat-anchor form below produces correct results in every combo.
  if (opts.homeTypes && opts.homeTypes.length > 0) {
    const residentialSubTypes: string[] = [];
    const standalonePropTypes: string[] = [];
    for (const t of opts.homeTypes) {
      if (t === 'house') {
        residentialSubTypes.push('Single Family Residence');
      } else if (t === 'condo') {
        residentialSubTypes.push('Condominium', 'Townhouse', 'Apartment');
      } else if (t === 'multi') {
        standalonePropTypes.push('Residential Income');
      } else if (t === 'land') {
        standalonePropTypes.push('Land');
      }
    }
    // Residential branch — collapsed to a single AND with an
    // inner subtype OR group. One layer of nesting.
    const residentialBranch =
      residentialSubTypes.length > 0
        ? `(PropertyType eq 'Residential' and (${residentialSubTypes
            .map((s) => `PropertySubType eq '${escapeLiteral(s)}'`)
            .join(' or ')}))`
        : null;
    const standaloneBranches = standalonePropTypes.map(
      (p) => `PropertyType eq '${escapeLiteral(p)}'`,
    );
    const allBranches = [
      residentialBranch,
      ...standaloneBranches,
    ].filter((b): b is string => b !== null);
    if (allBranches.length === 1) {
      clauses.push(allBranches[0]);
    } else if (allBranches.length > 1) {
      clauses.push(`(${allBranches.join(' or ')})`);
    }
  }

  // Spatial filtering (bbox/polygon) and text search (substringof) are
  // applied post-fetch in applyClientFilters() — Spark's OData rejects
  // `geo.intersects` and `substringof` (verified build #62 → 400 'field
  // does not exist'). The platform's rlsir-active-snapshot Lambda hits
  // the same constraint, which is why it doesn't filter spatially in
  // OData either. We over-fetch, then narrow client-side.

  return clauses.join(' and ');
}

/**
 * Post-fetch narrow: bbox/polygon spatial check + text-search substring
 * match. Equivalent semantics to the OData clauses we used to send,
 * but applied to the response payload because Spark's $filter rejects
 * spatial + substring functions.
 */
function applyClientFilters(records: SparkProperty[], opts: SearchOpts): SparkProperty[] {
  let out = records;

  if (opts.polygonGeoJSON) {
    const ring = opts.polygonGeoJSON.coordinates[0];
    if (ring && ring.length >= 4) {
      out = out.filter((r) => {
        const lat = asNumber(r['Latitude']);
        const lng = asNumber(r['Longitude']);
        if (lat == null || lng == null) return false;
        return pointInPolygon(lng, lat, ring);
      });
    }
  } else if (opts.bbox) {
    const b = opts.bbox;
    out = out.filter((r) => {
      const lat = asNumber(r['Latitude']);
      const lng = asNumber(r['Longitude']);
      if (lat == null || lng == null) return false;
      return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
    });
  }

  // Drop land-shaped records when the visitor is searching for
  // residential. ARMLS data quality is uneven: some agents file a
  // vacant lot under PropertyType='Residential' + PropertySubType=
  // 'Single Family Residence' (presumably because that's where the
  // future home would go), which slips through the home-type OData
  // clause. The reliable signal is "no bedrooms AND no livable
  // square footage" — that's land regardless of the misfiled type.
  //
  // Only triggered when the visitor has any residential type selected
  // AND has NOT included Land in their selection. When Land IS
  // selected, the visitor wants vacant lots and we leave them in.
  const homeTypes = opts.homeTypes ?? [];
  const residentialSelected = homeTypes.some(
    (t) => t === 'house' || t === 'condo' || t === 'multi',
  );
  const landSelected = homeTypes.includes('land');
  if (residentialSelected && !landSelected) {
    out = out.filter((r) => {
      const beds = asNumber(r['BedroomsTotal']);
      const sqft = asNumber(r['LivingArea']);
      return (beds != null && beds > 0) || (sqft != null && sqft > 0);
    });
  }

  // Text-query filtering moved server-side via OData contains() in
  // buildSearchFilter — no post-fetch step needed. Keeping
  // searchHaystack() in the file in case a future feature-array search
  // ever needs to fall back to client-side scanning, but it's no
  // longer called in this path.

  // Horse property — Spark won't filter by HorseAmenities array
  // server-side (no any() lambda support) so we narrow post-fetch.
  // HorseYN is unreliable in the ARMLS feed (sellers leave it null
  // even when HorseAmenities is populated), so we treat any non-empty
  // HorseAmenities array as horse property regardless of HorseYN.
  if (opts.hasHorse) {
    out = out.filter((r) => {
      const ha = r['HorseAmenities'];
      if (Array.isArray(ha) && ha.length > 0) return true;
      const yn = r['HorseYN'];
      return yn === true || yn === 'Y' || yn === 'true';
    });
  }

  return out;
}

/**
 * Build a single lowercase text blob covering everything a visitor
 * might search by: address, city, neighborhood, public remarks, and
 * the feature arrays Yong's typical buyer hunts in ("wine cellar",
 * "casita", "mountain view", "tennis court", etc.). Spark's OData
 * doesn't allow substring matching, so this is post-fetch — limited
 * to whatever set of records was returned, but still useful narrow.
 */
function searchHaystack(r: SparkProperty): string {
  const parts: string[] = [];
  const pushString = (v: unknown) => {
    if (typeof v === 'string' && v.length > 0) parts.push(v);
  };
  const pushArray = (v: unknown) => {
    if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === 'string') parts.push(item);
      }
    }
  };
  pushString(r['UnparsedAddress']);
  pushString(r['City']);
  pushString(r['SubdivisionName']);
  pushString(r['CommunityFeatures']);
  pushString(r['PublicRemarks']);
  pushArray(r['InteriorFeatures']);
  pushArray(r['ExteriorFeatures']);
  pushArray(r['Appliances']);
  pushArray(r['View']);
  pushArray(r['ArchitecturalStyle']);
  pushArray(r['ConstructionMaterials']);
  pushArray(r['PoolFeatures']);
  pushArray(r['SpaFeatures']);
  pushArray(r['FireplaceFeatures']);
  pushArray(r['ParkingFeatures']);
  pushArray(r['Flooring']);
  pushArray(r['HorseAmenities']);
  pushArray(r['AssociationAmenities']);
  pushArray(r['LotFeatures']);
  return parts.join(' ').toLowerCase();
}

function pointInPolygon(x: number, y: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ── Field projection ──────────────────────────────────

/**
 * Explicit OData `$select` for the search endpoint. Without this,
 * Spark returns the full RESO Property entity (~200 fields) per
 * record — for a 1000-record pool that's 5-10MB of JSON, most of
 * which we never read.
 *
 * Every field in this list is consumed by at least one of:
 *   - sparkRecordToListing (mapper to the Listing type)
 *   - applyClientFilters    (bbox/polygon/horse/residential narrow)
 *   - getSortDef.extract    (sort key + cursor value)
 *   - isIdxDisplayable      (IDX gate)
 *   - pinFromRecord         (map pin metadata)
 *
 * Add a field here when you add a new filter, sort, or card surface
 * that reads it. The /listings/[slug] DETAIL page uses a separate
 * fetch path (getListingBySlug) with its own broader projection —
 * trimming this list does not affect detail rendering.
 */
const LIST_SELECT: string[] = [
  // Identity
  'ListingKey',
  'ListingId',
  'StandardStatus',
  // IDX gate
  'InternetEntireListingDisplayYN',
  // Address
  'UnparsedAddress',
  'StreetNumber',
  'StreetName',
  'StreetSuffix',
  'City',
  'PostalCode',
  'CountyOrParish',
  'SubdivisionName',
  'CityRegion',
  'MLSAreaMajor',
  // Geometry
  'Latitude',
  'Longitude',
  // Pricing
  'ListPrice',
  'OriginalListPrice',
  'PricePerSquareFoot',
  // Specs
  'BedroomsTotal',
  'BathroomsFull',
  'BathroomsHalf',
  'BathroomsTotalInteger',
  'BathroomsTotalDecimal',
  'LivingArea',
  'LotSizeAcres',
  'LotSizeSquareFeet',
  'YearBuilt',
  'DaysOnMarket',
  'CumulativeDaysOnMarket',
  'StoriesTotal',
  'FireplacesTotal',
  'GarageSpaces',
  // Type
  'PropertyType',
  'PropertySubType',
  // Amenity bools
  'PoolPrivateYN',
  'SpaYN',
  'WaterfrontYN',
  'FireplaceYN',
  'NewConstructionYN',
  'AssociationYN',
  'HorseYN',
  // Feature arrays (consumed by mapper + horse filter + future feature text)
  'ArchitecturalStyle',
  'ConstructionMaterials',
  'Flooring',
  'Appliances',
  'InteriorFeatures',
  'ExteriorFeatures',
  'PoolFeatures',
  'SpaFeatures',
  'FireplaceFeatures',
  'ParkingFeatures',
  'View',
  'Heating',
  'Cooling',
  'WindowFeatures',
  'LaundryFeatures',
  'LotFeatures',
  'Fencing',
  'Vegetation',
  'AssociationAmenities',
  'HorseAmenities',
  'CommunityFeatures',
  // HOA
  'AssociationName',
  'AssociationFee',
  'AssociationFeeFrequency',
  // Tax
  'TaxAnnualAmount',
  'TaxYear',
  'ParcelNumber',
  // Schools
  'ElementarySchool',
  'MiddleOrJuniorSchool',
  'HighSchool',
  'HighSchoolDistrict',
  // Agent/Office
  'ListAgentMlsId',
  'ListAgentFullName',
  'ListAgentDirectPhone',
  'ListOfficeName',
  'ListOfficePhone',
  // Remarks + meta
  'PublicRemarks',
  'ModificationTimestamp',
];

// ── Sort + cursor ─────────────────────────────────────

/**
 * Sort key → OData `$orderby` clause + SparkProperty field used for
 * client-side sort/cursor logic. The same field is used for the
 * cursor's comparable value, so sort order and cursor comparison
 * always agree.
 *
 * Stable secondary key (`ListingKey`) makes ordering deterministic
 * across Spark page boundaries — without it, two records with the
 * same `ListPrice` could swap positions between page 1 and page 2
 * and the cursor would skip or duplicate them.
 */
interface SortDef {
  orderby: string;
  field: string;
  direction: 'asc' | 'desc';
  /** Extract the comparable scalar for sort/cursor logic. Returns null for
   *  missing values; null always sorts to the end regardless of direction. */
  extract: (r: SparkProperty) => number | null;
}

function getSortDef(sort: SortKey | undefined): SortDef {
  switch (sort) {
    case 'newest':
      return {
        orderby: 'ModificationTimestamp desc, ListingKey asc',
        field: 'ModificationTimestamp',
        direction: 'desc',
        extract: (r) => {
          const v = asString(r['ModificationTimestamp']);
          if (!v) return null;
          const t = Date.parse(v);
          return Number.isFinite(t) ? t : null;
        },
      };
    case 'price-asc':
      return {
        orderby: 'ListPrice asc, ListingKey asc',
        field: 'ListPrice',
        direction: 'asc',
        extract: (r) => asNumber(r['ListPrice']),
      };
    case 'sqft-desc':
      return {
        orderby: 'LivingArea desc, ListingKey asc',
        field: 'LivingArea',
        direction: 'desc',
        extract: (r) => asNumber(r['LivingArea']),
      };
    case 'lot-desc':
      return {
        orderby: 'LotSizeAcres desc, ListingKey asc',
        field: 'LotSizeAcres',
        direction: 'desc',
        extract: (r) => asNumber(r['LotSizeAcres']),
      };
    case 'year-desc':
      return {
        orderby: 'YearBuilt desc, ListingKey asc',
        field: 'YearBuilt',
        direction: 'desc',
        extract: (r) => asNumber(r['YearBuilt']),
      };
    case 'dom-asc':
      return {
        orderby: 'DaysOnMarket asc, ListingKey asc',
        field: 'DaysOnMarket',
        direction: 'asc',
        extract: (r) => asNumber(r['DaysOnMarket']),
      };
    case 'price-desc':
    default:
      return {
        orderby: 'ListPrice desc, ListingKey asc',
        field: 'ListPrice',
        direction: 'desc',
        extract: (r) => asNumber(r['ListPrice']),
      };
  }
}

/**
 * Sort the post-filter pool by `(sortValue, listingKey)`. Nulls always
 * land at the end regardless of direction. Stable on listingKey so
 * cursor pagination is deterministic — two records with the same
 * primary sort value resolve to a fixed order.
 */
function sortPool(pool: SparkProperty[], def: SortDef): SparkProperty[] {
  const cmpDir = def.direction === 'asc' ? 1 : -1;
  return [...pool].sort((a, b) => {
    const av = def.extract(a);
    const bv = def.extract(b);
    if (av === null && bv === null) {
      // Both null — fall through to listingKey tiebreaker.
    } else if (av === null) {
      return 1;
    } else if (bv === null) {
      return -1;
    } else if (av !== bv) {
      return cmpDir === 1 ? av - bv : bv - av;
    }
    const ak = asString(a['ListingKey']) ?? '';
    const bk = asString(b['ListingKey']) ?? '';
    return ak < bk ? -1 : ak > bk ? 1 : 0;
  });
}

interface DecodedCursor {
  s: SortKey;
  v: number | null;
  k: string;
}

function encodeCursor(sort: SortKey, value: number | null, listingKey: string): string {
  const payload: DecodedCursor = { s: sort, v: value, k: listingKey };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodeCursor(cursor: string | undefined, expectedSort: SortKey): DecodedCursor | null {
  if (!cursor) return null;
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as Partial<DecodedCursor>;
    // Sort key must match — otherwise the comparable value isn't
    // meaningful against the new ordering. The client must re-paginate
    // from scratch when sort changes.
    if (parsed.s !== expectedSort) return null;
    if (typeof parsed.k !== 'string' || parsed.k.length === 0) return null;
    const v = parsed.v === null || typeof parsed.v === 'number' ? parsed.v : null;
    return { s: parsed.s, v: v ?? null, k: parsed.k };
  } catch {
    return null;
  }
}

/**
 * Find the index in `pool` of the first record strictly AFTER the
 * cursor under the given sort definition. Returns 0 when no cursor,
 * pool.length when the cursor points beyond the last record.
 *
 * Pool MUST already be sorted by sortPool() — this is a linear scan
 * that relies on the established ordering for correctness when ties
 * collapse to the listingKey tiebreaker.
 */
function cursorIndex(
  pool: SparkProperty[],
  def: SortDef,
  cursor: DecodedCursor | null,
): number {
  if (!cursor) return 0;
  const dirSign = def.direction === 'asc' ? 1 : -1;
  for (let i = 0; i < pool.length; i++) {
    const r = pool[i];
    const v = def.extract(r);
    const k = asString(r['ListingKey']) ?? '';
    // Compare (v, k) against (cursor.v, cursor.k) under the direction.
    // "After" means strictly greater under the sort ordering.
    if (v === cursor.v) {
      if (k > cursor.k) return i;
      continue;
    }
    if (v === null) continue; // nulls sort last; cursor can't point past them in normal case
    if (cursor.v === null) {
      // Cursor's value is null (last bucket). Any non-null record is
      // BEFORE it under the ordering, so we never advance.
      continue;
    }
    if (dirSign === 1 ? v > cursor.v : v < cursor.v) return i;
  }
  return pool.length;
}

// ── Public API — same shape as lib/listings-search.ts ──

/**
 * Per-Lambda-instance result cache. 60s TTL — Spark hourly refresh
 * gives plenty of headroom, and this absorbs traffic spikes without
 * tripping Spark's per-token rate limit (429 "exceeds performance
 * threshold"). Keyed on full SearchOpts JSON.
 */
const SEARCH_CACHE_TTL_MS = 60_000;
const searchCache = new Map<string, { at: number; promise: Promise<SearchResult> }>();

function searchCacheKey(opts: SearchOpts): string {
  // Stable key: omits identity-irrelevant fields, sorts keys.
  return JSON.stringify(opts, Object.keys(opts).sort());
}

/**
 * Pin record fields — minimal $select for the map's GeoJSON source.
 * Excludes Media (huge per record) and remarks/details.
 */
const PIN_SELECT = [
  'ListingKey',
  'ListingId',
  'UnparsedAddress',
  'Latitude',
  'Longitude',
  'ListPrice',
  'StandardStatus',
];

function pinFromRecord(r: SparkProperty): PinPoint | null {
  const lat = asNumber(r['Latitude']);
  const lng = asNumber(r['Longitude']);
  if (lat == null || lng == null) return null;
  const listingId = asString(r['ListingId']) ?? asString(r['ListingKey']) ?? '';
  const listingKey = asString(r['ListingKey']) ?? listingId;
  const unparsed = asString(r['UnparsedAddress']) ?? '';
  // Pull the primary photo from the expanded Media array (the listings
  // call uses $expand=Media($top=1)). Keeps the hover popup rich for
  // every pin on the map, not just the 60 listings currently in view.
  let coverPhotoUrl: string | null = null;
  const media = r['Media'];
  if (Array.isArray(media) && media.length > 0) {
    const first = media[0] as { MediaURL?: unknown };
    coverPhotoUrl = asString(first?.MediaURL);
  }
  return {
    listingKey,
    listingId,
    slug: listingSlug(unparsed, listingId),
    latitude: lat,
    longitude: lng,
    listPrice: asNumber(r['ListPrice']),
    status: asString(r['StandardStatus']) ?? 'Active',
    unparsedAddress: unparsed || null,
    community:
      asString(r['SubdivisionName']) ??
      asString(r['CityRegion']) ??
      asString(r['City']),
    bedrooms: asInt(r['BedroomsTotal']),
    bathroomsTotal:
      asNumber(r['BathroomsTotalInteger']) ??
      asNumber(r['BathroomsTotalDecimal']),
    livingArea: asNumber(r['LivingArea']),
    coverPhotoUrl,
  };
}

export async function searchListings(opts: SearchOpts = {}): Promise<SearchResult> {
  // Cache check first — every visitor for the same query in a 60s
  // window shares one Spark round-trip. Critical for cold-start UX
  // (cold Lambda + cold Spark = 2-4s; warm cache = <100ms).
  const cacheKey = searchCacheKey(opts);
  const now = Date.now();
  const cached = searchCache.get(cacheKey);
  if (cached && now - cached.at < SEARCH_CACHE_TTL_MS) {
    return cached.promise;
  }

  const promise = doSearchListings(opts);
  searchCache.set(cacheKey, { at: now, promise });
  // Evict the cache entry on rejection or when pins came back empty
  // (likely a transient Spark rate-limit on the parallel call) so the
  // next request retries fresh instead of locking in a broken state
  // for the full 60s TTL.
  promise.then(
    (result) => {
      if (result.pins.length === 0) {
        searchCache.delete(cacheKey);
      }
    },
    () => searchCache.delete(cacheKey),
  );
  return promise;
}

async function doSearchListings(opts: SearchOpts): Promise<SearchResult> {
  const limit = Math.min(Math.max(opts.limit ?? 60, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);
  const filter = buildSearchFilter(opts);
  const sortDef = getSortDef(opts.sort);
  const cursor = decodeCursor(opts.cursor, opts.sort ?? 'price-desc');

  // Pagination + pin coverage strategy: a single Spark call returns
  // ALL records this query needs. The pool is sorted on the requested
  // sort key (with a stable ListingKey tiebreaker) so both offset and
  // cursor pagination are deterministic. Listings are sliced from the
  // sorted pool; pins are derived from the same pool's top-1000.
  //
  // Window sizing: when starting fresh (no cursor and offset=0) we
  // fetch 4 pages (1000 records) so the initial map has a wide pin
  // universe. Beyond that, we fetch only the pages needed to serve
  // the new listings slice + 1 for hasMore — the client-side pin
  // merge in ListingsClient grows the map's pin set as the visitor
  // scrolls.
  const PAGE_SIZE = 250;
  const INITIAL_PIN_PAGES = 4; // 1000 records on the first page load
  const isFreshStart = !cursor && offset === 0;
  const pagesNeeded = isFreshStart
    ? INITIAL_PIN_PAGES
    : Math.max(Math.ceil((offset + limit + 1) / PAGE_SIZE), 1);

  // Single Spark call — fetch the full pool, slice for listings, derive
  // pins from the bbox/IDX-filtered records.
  let pool: SparkProperty[] = [];
  let fetchError: string | null = null;
  try {
    const records = await fetchAllProperties({
      filter,
      top: PAGE_SIZE,
      orderby: sortDef.orderby,
      // NOTE: explicit $select reverted 2026-05-12 after Spark
      // returned empty responses to projected queries — the ARMLS
      // Spark variant appears to interact poorly with $select on
      // multi-page paginated Property requests (the @odata.nextLink
      // it emits drops the $select and serves fewer records). The
      // unfiltered request fetches the full RESO Property entity per
      // record (5-10MB for 1000 records); a future fix should either
      // (a) re-issue $select on every page rather than following
      // nextLink verbatim, or (b) move to a server-side projection
      // proxy. The Media expand stays narrowed via $top=1 — that
      // limit Spark does honor.
      expand: ['Media($top=1;$orderby=Order)'],
      maxPages: pagesNeeded,
    });
    pool = applyClientFilters(records, opts).filter(isIdxDisplayable);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err);
  }

  // Re-sort the pool client-side after applyClientFilters() — Spark's
  // orderby is honored upstream, but bbox/polygon filtering can drop
  // records mid-page in a way that breaks the upstream ordering's
  // tiebreaker assumptions. A local sort restores the deterministic
  // (sortValue, listingKey) order that the cursor logic depends on.
  pool = sortPool(pool, sortDef);

  // Resolve pagination — cursor wins over offset when present, offset
  // is the legacy path. Both produce an [start, start+limit) window.
  const start = cursor ? cursorIndex(pool, sortDef, cursor) : offset;
  const end = start + limit;
  const sliceHasMore = pool.length > end;
  const listings = pool.slice(start, end).map(sparkRecordToListing);

  // Pins — every pool record with lat/lng, capped at 1000 for map
  // performance. Always drawn from the START of the sorted pool so the
  // map represents the "best" 1000 for the active sort (cheapest under
  // price-asc, most recent under newest, etc.).
  const pins: PinPoint[] = [];
  for (const r of pool.slice(0, 1000)) {
    const p = pinFromRecord(r);
    if (p) pins.push(p);
  }

  // Cursor encoding the last record in this slice — feeds the next
  // page request. Null when there's no next page.
  const lastRecord = listings.length > 0 ? pool[start + listings.length - 1] : null;
  const nextCursor = sliceHasMore && lastRecord
    ? encodeCursor(
        opts.sort ?? 'price-desc',
        sortDef.extract(lastRecord),
        asString(lastRecord['ListingKey']) ?? '',
      )
    : null;

  // Total reflects the bbox-filtered pool, capped at the pin
  // universe size (1000). This is honest about the viewport.
  const total = pool.length;
  const fetchedAt = new Date().toISOString();

  if (fetchError) {
    // eslint-disable-next-line no-console
    console.error('[spark/search] fetch failed:', fetchError);
  }

  return {
    listings,
    pins,
    total,
    hasMore: sliceHasMore,
    fetchedAt,
    nextCursor,
  };
}

/**
 * Resolve a slug → single Listing via direct ListingId lookup.
 * The slug ends in the ARMLS listing_id (digits); we match exactly,
 * then fall through to a substring scan if not found.
 *
 * @compliance IDX: respects InternetEntireListingDisplayYN — Spark's
 *   OData rejects this field in $filter, so we check the response
 *   field after fetch and return null if the seller has opted out.
 */
export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const match = slug.match(/-(\d+)$/);
  const listingId = match ? match[1] : null;
  if (!listingId) return null;

  try {
    const records = await fetchAllProperties({
      filter: `ListingId eq '${escapeLiteral(listingId)}'`,
      top: 1,
      expand: ['Media'],
      maxPages: 1,
    });
    if (records.length === 0) return null;
    if (!isIdxDisplayable(records[0])) return null;
    return sparkRecordToListing(records[0]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[spark/search] getListingBySlug failed:', err);
    return null;
  }
}

/**
 * Nearby listings — surfaces a small set of comparable Active
 * residentials within a fixed lat/lng radius around the subject. Used
 * by the listing-detail "You may also consider" strip so the visitor's
 * session continues if the current listing isn't the right fit.
 *
 * Filter strategy: target ±0.05° lat/lng (~3.5 mi N/S, ~3 mi E/W in
 * Phoenix latitude) + ±25% price band. ARMLS Active residential only
 * — pending and land are excluded so the strip reads as live for-sale
 * inventory in the same ballpark. We over-fetch to 60 records (plenty
 * for a 4-tile strip after IDX/spatial filtering and excluding the
 * subject itself) and trim client-side.
 */
export async function getNearbyListings(opts: {
  excludeListingId: string;
  latitude: number;
  longitude: number;
  listPrice: number | null;
  limit?: number;
}): Promise<Listing[]> {
  const limit = opts.limit ?? 4;
  const RADIUS_DEG = 0.05;
  const PRICE_BAND = 0.25;
  const minLat = opts.latitude - RADIUS_DEG;
  const maxLat = opts.latitude + RADIUS_DEG;
  const minLng = opts.longitude - RADIUS_DEG;
  const maxLng = opts.longitude + RADIUS_DEG;

  const clauses: string[] = [
    `StandardStatus eq 'Active'`,
    `(PropertyType eq 'Residential' and PropertySubType eq 'Single Family Residence') or (PropertyType eq 'Residential' and PropertySubType eq 'Condominium') or (PropertyType eq 'Residential' and PropertySubType eq 'Townhouse')`,
  ];
  if (opts.listPrice && opts.listPrice > 0) {
    const lo = Math.round(opts.listPrice * (1 - PRICE_BAND));
    const hi = Math.round(opts.listPrice * (1 + PRICE_BAND));
    clauses.push(`ListPrice ge ${lo}`);
    clauses.push(`ListPrice le ${hi}`);
  }
  // Wrap the home-type OR group in parens so it's treated as one term
  // when AND'd with status/price; the bbox filter is applied client-side
  // (Spark OData doesn't support geo predicates).
  const filter = `${clauses[0]} and (${clauses[1]})${clauses
    .slice(2)
    .map((c) => ` and ${c}`)
    .join('')}`;

  try {
    const records = await fetchAllProperties({
      filter,
      top: 60,
      orderby: 'ListPrice desc',
      expand: ['Media($top=1;$orderby=Order)'],
      maxPages: 1,
    });
    return records
      .filter((r) => {
        if (!isIdxDisplayable(r)) return false;
        if (asString(r['ListingId']) === opts.excludeListingId) return false;
        const lat = asNumber(r['Latitude']);
        const lng = asNumber(r['Longitude']);
        if (lat == null || lng == null) return false;
        return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
      })
      .slice(0, limit)
      .map(sparkRecordToListing);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[spark/search] getNearbyListings failed:', err);
    return [];
  }
}

/**
 * IDX opt-out check. ARMLS sellers can flag a listing with
 * InternetEntireListingDisplayYN=false to suppress public IDX display.
 * We must drop those records before rendering.
 *
 * @compliance IDX (ARMLS): mandatory respect of seller opt-out.
 */
function isIdxDisplayable(r: SparkProperty): boolean {
  const v = r['InternetEntireListingDisplayYN'];
  // Default-allow only when the field is absent — Spark sometimes omits
  // it from the response payload. When present it must be truthy.
  if (v === undefined || v === null) return true;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'y' || v.toLowerCase() === 'true';
  return Boolean(v);
}

export async function searchListingPins(opts: SearchOpts = {}): Promise<PinPoint[]> {
  const filter = buildSearchFilter(opts);
  try {
    const records = await fetchAllProperties({
      filter,
      top: 1000,
      orderby: 'ListPrice desc',
      select: PIN_SELECT,
      maxPages: 2,
    });
    const filtered = applyClientFilters(records, opts);
    const pins: PinPoint[] = [];
    for (const r of filtered) {
      if (!isIdxDisplayable(r)) continue;
      const p = pinFromRecord(r);
      if (p) pins.push(p);
    }
    return pins;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[spark/search] searchListingPins failed:', err);
    return [];
  }
}
