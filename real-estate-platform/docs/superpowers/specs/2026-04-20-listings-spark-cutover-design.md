# Listings → Spark API Cutover — Design Spec

**Date:** 2026-04-20 (revised)
**Status:** Drafted, awaiting review
**Scope:** `apps/premium-site` — every surface that reads active-listing data from RDS
**Out of scope:** `/market/*` analytics, `apps/platform`, RDS lambda remediation

---

## 1. Motivation

ARMLS IDX inspection requires listing data to match live MLS state. Today every active-listing surface on the premium site is backed by RDS, which can lag the MLS by hours and is currently bloated (46 % dead tuples, 60 s query timeouts). The sync Lambda that keeps RDS fresh is **paused** because it was about to blow the AWS Lambda free tier. RDS-backed listings are the single biggest failure risk at inspection.

Direct-to-Spark on every active-listing read eliminates this risk: every listing we display is ≤5 min stale from source (cache TTL) and the 12-hour IDX refresh rule is trivially satisfied.

## 2. Scope — all surfaces that read listings

**Routes & APIs that must migrate (full list, from grep):**

| Path | Current RDS dependency |
|---|---|
| `app/(routes)/listings/actions.ts` | `@platform/database/queries/listings` — `searchListingsWithPhotos`, `getListingByKey`, `getListingById`, `getListingPhotos` |
| `app/api/search/route.ts` | `@platform/database/queries/search` — `searchListings(SearchFilters)` |
| `app/api/search/pins/route.ts` | `@platform/database/queries/search` — `getAllMapPins()` (all ~50 K active pins) |
| `app/api/search/autocomplete/route.ts` | `@platform/database/queries/search` — `searchAutocomplete(term)` |
| `app/api/listings/community/route.ts` | `@platform/database/queries/listings` — `searchListingsWithPhotos({ subdivisionName })` |
| Homepage `/` featured strip | (to verify during implementation — likely uses `searchListingsWithPhotos`) |
| `/phoenix/[regionId]/[communityId]` community listings grid | Uses `api/listings/community` — covered by #5 above |

**Out of scope (stay on RDS):**
- `/market/*` — all analytics pages, materialized views
- `app/api/analytics/*` — analytics API routes
- `app/api/geo/*` — region/community boundary data (not listing data)
- `apps/platform` — internal brokerage OS
- `apps/backend` — sync Lambda stays broken-but-off

## 3. Architecture — new `@platform/spark` package by extracting the existing client

`apps/backend/src/lib/spark/` already contains a working `SparkReplicationClient` (auth, pagination, photo fetch) used by the sync Lambda. Rather than write a new one, we **extract** that module to a new workspace package and layer search-focused methods on top.

```
packages/spark/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # public exports — add `import 'server-only'`
│   ├── client.ts             # extracted SparkReplicationClient + new searchProperties() method
│   ├── field-mapper.ts       # extracted from backend (RESO → our shape)
│   ├── ListingService.ts     # search(), getByKey(), getById(), getPins(), getAutocomplete()
│   ├── filters.ts            # SearchFilters / ListingSearchFilters → OData $filter
│   ├── mappers.ts            # Spark OData row → SearchListingCard / ListingRecord / ListingDetail
│   ├── compliance.ts         # attribution enforcement + prohibited-field strip
│   ├── cache.ts              # unstable_cache wrapper + 12h ceiling
│   └── errors.ts             # SparkAuthError, SparkRateLimitError, etc.
└── __tests__/
    ├── filters.test.ts
    ├── mappers.test.ts
    └── compliance.test.ts
```

**Post-extraction:** `apps/backend/src/lib/spark/` files become thin re-exports from `@platform/spark` so the sync Lambda code continues to work untouched when we re-enable it.

## 4. Public API

```ts
// @platform/spark
import 'server-only';

export class ListingService {
  // Premium-site server actions + api/listings/community
  static search(filters: ListingSearchFilters): Promise<{ listings: ListingRecord[]; total: number }>;
  static getByKey(listingKey: string): Promise<ListingDetail | null>;
  static getById(listingId: string): Promise<ListingDetail | null>;
  static getPhotos(listingKey: string): Promise<ListingPhoto[]>;

  // api/search/route.ts (card-level search)
  static searchCards(filters: SearchFilters): Promise<SearchResult>;

  // api/search/pins/route.ts (all active pins)
  static getAllPins(): Promise<MapPin[]>;

  // api/search/autocomplete/route.ts
  static autocomplete(term: string): Promise<AutocompleteSuggestion[]>;
}
```

All types (`ListingSearchFilters`, `SearchFilters`, `SearchResult`, `MapPin`, `AutocompleteSuggestion`, `ListingRecord`, `ListingDetail`, `ListingPhoto`, `SearchListingCard`, `GeoJSONPolygon`, `BoundingBox`, `SortOption`) relocate to `@platform/shared/src/listings/` so both `@platform/database` (analytics) and `@platform/spark` (live) depend on a single type source with no import cycle.

**Why two filter types survive:** the premium site already has two filter surfaces (`SearchFilters` for the search API, `ListingSearchFilters` for server actions). Consolidating would churn the UI. `ListingService` accepts both; internally they map to the same OData filter builder.

## 5. Data-fetching strategies per surface

Each active-listing surface has different cost/latency characteristics. The single `@platform/spark` client implements each with the right Spark query + cache TTL.

### 5.1 Search results (paginated cards)

`searchCards(filters)` and `search(filters)` both hit:

```
GET {base}/Property
  ?$filter=<built from filters>
  &$select=ListingKey,ListingId,ListPrice,Bedrooms,..., (lean field set)
  &$expand=Media($filter=ImageSizeDescription eq 'Large';$orderby=Order;$top=1)
  &$orderby=<mapped from sort>
  &$top=<pageSize, default 24>
  &$skip=<page * pageSize>
```

Cache key: `listings:search:<hash(filters)>`, TTL **5 min**, tag `listings`.

Pagination note: ARMLS Spark caps `$skip` at 5 000 records (≈208 pages @ 24/page). That is well beyond any realistic user depth. For edge-case deep paging, the UI already has a reasonable page cap — we retain current behavior.

### 5.2 Listing detail

`getByKey(listingKey)` hits:

```
GET {base}/Property('<key>')
  ?$expand=Media($orderby=Order)
```

Cache key: `listings:byKey:<key>`, TTL **5 min**, tag `listings` + `listings:<key>`.

`getById(listingId)` is the same query with `$filter=ListingId eq '<id>'&$top=1`.

### 5.3 Map pins (all ~50 K active)

Fetching 50 000 full-photo-expanded listings on every map load is not viable. Spark returns lightweight records fast when `$select` is narrow:

```
GET {base}/Property
  ?$filter=StandardStatus in ('Active','Active Under Contract','Pending')
         and InternetEntireListingDisplayYN eq true
  &$select=ListingKey,ListingId,ListPrice,Latitude,Longitude
  &$top=5000  (iterate with $skiptoken for full set)
```

Expected payload: ~2–4 MB across ~10 paginated calls, ~5–10 s total when cold.

Cache key: `listings:pins:all`, TTL **5 min**, tag `listings`. **Single shared cache entry** — one Spark fetch every 5 min serves every user's map, regardless of traffic. Well under rate limits.

### 5.4 Autocomplete

Vocabulary (cities, ZIPs, subdivision names) is slow-changing. Current RDS implementation uses trigram indexes; Spark has no direct equivalent.

Strategy: **daily snapshot** of active-listing distinct values.

```
GET {base}/Property
  ?$filter=<active>
  &$select=City,PostalCode,SubdivisionName
  &$top=5000 (full iteration)
```

Aggregate client-side to produce `{ cities: [...], zips: [...], subdivisions: [...] }` with counts. Cache `listings:autocomplete:vocab` with TTL **24 h**, tag `listings:vocab`.

`autocomplete(term)` does in-memory prefix/substring match against the cached vocabulary. Zero Spark calls per user request.

### 5.5 Community featured listings

`api/listings/community` is an `ListingService.search({ subdivisionName, limit: 3, sortBy: 'price_desc' })` call. Nothing special — standard search cache.

## 6. OData filter mapping (filters.ts)

**Common filters (both types):**
- Active statuses (baseline): `(StandardStatus eq 'Active' or StandardStatus eq 'Active Under Contract' or StandardStatus eq 'Pending' or StandardStatus eq 'Coming Soon')`
- IDX baseline (always appended): `InternetEntireListingDisplayYN eq true`
- Price: `ListPrice ge X and ListPrice le Y`
- Beds: `BedroomsTotal ge X`
- Baths: `BathroomsTotalInteger ge X`
- Sqft: `LivingArea ge X and LivingArea le Y`
- Lot acres: `LotSizeAcres ge X`
- Year built: `YearBuilt ge X and YearBuilt le Y`
- Cities (multi): `(tolower(City) eq 'scottsdale' or tolower(City) eq 'phoenix')`
- Postal codes (multi): `(PostalCode eq '85255' or PostalCode eq '85262')`
- Subdivision: `tolower(SubdivisionName) eq '<value>'`
- Property type (multi): `(PropertyType eq 'Residential' or ...)`
- Pool: `PoolPrivateYN eq true`
- Horse property: `HorseYN eq true`
- Virtual tour: `VirtualTourURLUnbranded ne null`
- Has photos: `PhotosCount gt 0`
- Garage min: `GarageSpaces ge X`
- Stories min: `StoriesTotal ge X`
- HOA max: `AssociationFee le X`
- Keyword: `contains(tolower(UnparsedAddress), '<term>') or contains(tolower(PublicRemarks), '<term>')`
- Bounding box: `Latitude ge south and Latitude le north and Longitude ge west and Longitude le east`
- GeoJSON polygon: client-side post-filter on result set using point-in-polygon (Spark has no `$filter` geo operator we can count on)

**Sort mapping:**
- `newest` → `$orderby=ModificationTimestamp desc`
- `price_asc` / `price_desc` → `$orderby=ListPrice asc|desc`
- `sqft` → `$orderby=LivingArea desc`
- `lot_size` → `$orderby=LotSizeAcres desc`
- `proximity` → client-side post-sort by haversine distance (requires map center)

## 7. Compliance middleware (compliance.ts)

Runs inside `ListingService` before any listing is returned:

**Required attribution — listing dropped if any missing:**
- `ListOfficeName`
- `ListAgentFullName`
- `ListAgentDirectPhone` OR `ListAgentEmail`

Missing → log structured `ComplianceWarning`, exclude from result set.

**Prohibited fields — always stripped:**
- `PrivateRemarks`
- `ShowingInstructions`
- `SellerContact*`
- Any field flagged `IsIDXDisplay = false` in the RESO dictionary (conservative default: strip unless explicitly allow-listed)

**Enrichment:**
- Attach `lastUpdated = sparkFetchTimestamp` — surfaced by every card and detail page per `idx-compliance.md`.

**Hard filter:** `InternetEntireListingDisplayYN eq true` is always in the `$filter` baseline — respects seller opt-out before compliance middleware even runs.

## 8. Caching & 12-hour ceiling (cache.ts)

Next.js 16 Cache Components:

```ts
const cached = <T>(
  key: string,
  impl: (...args: any[]) => Promise<T>,
  opts: { tags: string[]; revalidate: number }
) => unstable_cache(impl, [key], opts);
```

Per-method TTLs:

| Method | TTL | Tags |
|---|---|---|
| `search`, `searchCards` | 5 min | `listings`, `listings:search` |
| `getByKey`, `getById` | 5 min | `listings`, `listings:<key>` |
| `getAllPins` | 5 min | `listings`, `listings:pins` |
| `autocomplete` (vocab) | 24 h | `listings`, `listings:vocab` |

**12-hour compliance ceiling:** inside the cache wrapper, check entry `createdAt`. If `age > 12h`, bypass cache and force-fetch. If fetch fails AND no entry fresher than 12h exists, return `{ status: 'unavailable' }` — UI shows a compliance-friendly blank state, never stale past 12h.

**Manual invalidation:** export `revalidateListings()` that calls `revalidateTag('listings')`. Wire to an admin-only button at `/component-library` for pre-inspection purge.

## 9. Errors (errors.ts)

```ts
export class SparkAuthError extends Error { /* 401/403 */ }
export class SparkRateLimitError extends Error { /* 429 after retries */ }
export class SparkUnavailableError extends Error { /* 5xx / network */ }
export class ComplianceError extends Error { /* listing missing attribution */ }
```

Service methods catch `SparkUnavailableError` → cache-ceiling fallback. Other errors propagate.

## 10. Testing

| Test | Type | Location |
|---|---|---|
| `buildODataFilter` — every filter + sort combination | Unit | `packages/spark/__tests__/filters.test.ts` |
| `sparkRowToListing` — RESO → internal type mapping, photo expansion | Unit | `__tests__/mappers.test.ts` |
| Compliance middleware — required-attribution drop, prohibited-field strip | Unit | `__tests__/compliance.test.ts` |
| Cache wrapper — 12h ceiling, unavailable-fallback | Unit (mocked clock) | `__tests__/cache.test.ts` |
| `SparkClient` — retry on 429/503, rate-limit backoff | Unit (mocked fetch) | `__tests__/client.test.ts` |
| Live Spark integration: active search, detail fetch, pin list, vocab — compliance fields present, prohibited fields absent | Integration, gated `SPARK_INTEGRATION=1` | `__tests__/integration/live.test.ts` |
| Component smoke: SearchClient, SearchMap render with mocked service | Component | existing premium-site tests, updated |

Coverage per CLAUDE.md: services 90 %, utilities 90 %.

## 11. Migration sequence

**Phase A — Build `@platform/spark` (package lives alongside existing packages):**
1. Create `packages/spark/` workspace skeleton
2. Relocate types to `@platform/shared/src/listings/`
3. Copy `SparkReplicationClient` + `field-mapper` from `apps/backend/src/lib/spark/` into `@platform/spark`
4. Add new methods: `searchProperties`, `getProperty`, `searchDistinct` (vocab)
5. Build filters, mappers, compliance, cache, errors modules with TDD
6. Verify against live Spark via scratch script with `SPARK_INTEGRATION=1`
7. Replace `apps/backend/src/lib/spark/*` with thin re-exports from `@platform/spark` so the sync Lambda still works when re-enabled

**Phase B — Premium-site cutover (one file at a time, verifiable per commit):**
8. `app/api/search/autocomplete/route.ts` — smallest surface, easiest rollback
9. `app/api/search/pins/route.ts`
10. `app/api/search/route.ts`
11. `app/api/listings/community/route.ts`
12. `app/(routes)/listings/actions.ts`
13. Homepage featured strip (verify location during implementation)

Each step: swap import, run dev on port 3005, manual QA, commit.

**Phase C — Cleanup:**
14. Delete dead RDS listing queries from `packages/database/src/queries/listings.ts` and search-only exports from `search.ts` (keep analytics-supporting functions)
15. Drop unused materialized views: `mv_active_listings`, `mv_price_bands` if only used by listings UI (verify via grep)
16. Type-check + lint + build + final manual smoke

## 12. Observability

- Every Spark call logs: path, filter clause hash, response size, duration, cache hit/miss, retry count
- Compliance warnings logged with `{ listingKey, missingField }` for grep-ability on inspection day
- CloudWatch alarm (follow-up ticket): Spark 5xx rate >5 % in 5 min → Slack/email

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Spark outage during inspection | 5-min cache serves through brief outages; 12h ceiling forces compliant blank past that |
| Rate-limit hit during traffic spike or crawler | Shared cache entries mean 1 fetch per TTL regardless of traffic; token bucket smooths short bursts |
| Filter mapping bug hides listings | Unit tests on every filter branch; integration test asserts Spark count within 10 % of a RDS baseline pre-cutover |
| Map pin full-fetch too slow cold | 5-min shared cache; first hit after revalidation pays ~5 s, rest are <10 ms; consider background regenerator if cold latency becomes UX visible |
| Autocomplete vocab stale | 24 h TTL acceptable per IDX (vocab doesn't affect listing data); manual purge tag exists |
| Token leaked to client bundle | `import 'server-only'` at package entry + ESLint rule |
| Spark `$skip` cap blocks deep paging | Current UI rarely exceeds 10 pages; we accept the limit |
| `proximity` sort not native in OData | Client-side sort after fetch — acceptable because a proximity search is always bbox-filtered first |

## 14. Non-goals

- Fixing RDS bloat / paused sync Lambda (separate effort)
- Migrating analytics surfaces
- Caching Spark photos ourselves — keep `MediaURL` direct from Spark CDN
- Fallback to RDS — the paused Lambda makes RDS data stale and unsuitable; compliance-blank is the correct fallback

## 15. Open questions (not blocking; decide during implementation)

1. Homepage featured listings exact code location — verify during Phase B step 13.
2. Should `revalidateListings()` be exposed on a user-facing admin surface, or kept to a secret route / CLI? Default assumption: internal `/component-library` button gated by platform-admin role.
3. Map pin cold-load latency — if >5 s feels bad, add a background regenerator via a 5-min Vercel cron that warms the cache. Defer until we measure.

---

*Next step: writing-plans generates the implementation plan from this spec.*
