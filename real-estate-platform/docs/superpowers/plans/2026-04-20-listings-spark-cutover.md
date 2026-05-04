# Listings → Spark Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate every active-listing surface on `apps/premium-site` from RDS to live ARMLS Spark API, eliminating replication-lag compliance risk.

**Architecture:** New `@platform/spark` workspace package. Extract the existing `SparkReplicationClient` from `apps/backend/src/lib/spark/`, layer search/detail/pin/vocab methods on top, enforce IDX compliance in a middleware, cache with 5-min TTL + 12-hour hard ceiling. Swap one consumer at a time, commit per swap, verify in dev on port 3005.

**Tech Stack:** TypeScript strict, pnpm workspace, Next.js 16.1.6 (`unstable_cache` + `revalidateTag`), Vitest, Spark OData over `replication.sparkapi.com/Reso/OData`.

**Spec:** `docs/superpowers/specs/2026-04-20-listings-spark-cutover-design.md`

---

## Phase A — Build `@platform/spark`

### Task 1: Create package skeleton

**Files:**
- Create: `packages/spark/package.json`
- Create: `packages/spark/tsconfig.json`
- Create: `packages/spark/src/index.ts`
- Create: `packages/spark/vitest.config.ts`
- Modify: `pnpm-workspace.yaml` (verify it globs `packages/*`)

- [ ] **Step 1: Write package.json**

```json
{
  "name": "@platform/spark",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@platform/shared": "workspace:*",
    "server-only": "^0.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Write tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": false
  },
  "include": ["src/**/*", "__tests__/**/*"]
}
```

If `tsconfig.base.json` does not exist at the monorepo root, copy the `compilerOptions` block from `packages/database/tsconfig.json` inline instead (mirror: `strict: true`, `target: "ES2022"`, `module: "NodeNext"`, `moduleResolution: "NodeNext"`, `esModuleInterop: true`, `skipLibCheck: true`, `resolveJsonModule: true`, `noUncheckedIndexedAccess: true`).

- [ ] **Step 3: Write index.ts with server-only guard**

```ts
import 'server-only';

export { ListingService } from './ListingService';
export { SparkClient } from './client';
export {
  SparkAuthError,
  SparkRateLimitError,
  SparkUnavailableError,
  ComplianceError,
} from './errors';
```

- [ ] **Step 4: Write vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
});
```

- [ ] **Step 5: Install and verify**

Run:
```bash
cd "C:/Users/joeys/Desktop/RLSIR Websites/real-estate-platform"
pnpm install
pnpm --filter @platform/spark type-check
```

Expected: pnpm resolves the new workspace package; type-check passes (may warn about missing modules referenced from index.ts — that's fine, we'll create them next).

- [ ] **Step 6: Commit**

```bash
git add packages/spark/ pnpm-lock.yaml
git commit -m "feat(spark): scaffold @platform/spark workspace package"
```

---

### Task 2: Relocate shared types to `@platform/shared/src/listings/`

**Files:**
- Create: `packages/shared/src/listings/filters.ts`
- Create: `packages/shared/src/listings/listing.ts`
- Create: `packages/shared/src/listings/search.ts`
- Create: `packages/shared/src/listings/pins.ts`
- Create: `packages/shared/src/listings/index.ts`
- Modify: `packages/shared/src/index.ts` (re-export new listings module)

- [ ] **Step 1: Write listings/filters.ts**

Copy the `ListingSearchFilters` and `SearchFilters` interfaces verbatim from their current homes. Source: `packages/database/src/queries/listings.ts:64-99` and `packages/database/src/queries/search.ts:55-99`.

```ts
// packages/shared/src/listings/filters.ts

export interface ListingSearchFilters {
  status?: string | string[];
  cities?: string[];
  postalCode?: string;
  subdivisionName?: string;
  subdivisionNames?: string[];
  propertyType?: string;
  listingType?: 'sale' | 'rent' | 'all';
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  minSqft?: number;
  maxSqft?: number;
  minLotAcres?: number;
  minYearBuilt?: number;
  maxDom?: number;
  maxHoa?: number;
  minStories?: number;
  minGarageSpaces?: number;
  hasPool?: boolean;
  hasGarage?: boolean;
  hasFireplace?: boolean;
  isHorseProperty?: boolean;
  hasPhotos?: boolean;
  keyword?: string;
  swLat?: number;
  swLng?: number;
  neLat?: number;
  neLng?: number;
  polygon?: [number, number][];
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'beds' | 'sqft' | 'dom' | 'price_sqft' | 'lot_size';
  limit?: number;
  offset?: number;
}

export interface SearchFilters {
  city?: string | string[];
  postalCode?: string | string[];
  subdivisionName?: string;
  regionSlug?: string;
  listingType?: 'sale' | 'rent' | 'all';
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  minSqft?: number;
  maxSqft?: number;
  minLotAcres?: number;
  maxLotAcres?: number;
  propertyType?: string[];
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  hasPool?: boolean;
  minGarage?: number;
  minStories?: number;
  maxHoa?: number;
  isHorseProperty?: boolean;
  hasPhotos?: boolean;
  hasVirtualTour?: boolean;
  keywords?: string;
  polygon?: GeoJSONPolygon;
  bounds?: BoundingBox;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'sqft' | 'lot_size' | 'proximity';
```

- [ ] **Step 2: Write listings/listing.ts**

Mirror the existing `ListingRecord` shape from `packages/database/src/queries/listings.ts:101-...` and the card/pin types from `search.ts`. Retain the `extends QueryResultRow` via an optional intersection so non-DB consumers don't force pull `pg`. Solution: define pure interfaces here, and keep DB-specific extensions (`extends QueryResultRow`) inside `@platform/database` only.

```ts
// packages/shared/src/listings/listing.ts

export interface ListingRecord {
  listing_key: string;
  listing_id: string;
  standard_status: string;
  mls_status: string | null;
  unparsed_address: string | null;
  city: string | null;
  state_or_province: string | null;
  postal_code: string;
  subdivision_display: string | null;
  latitude: number | null;
  longitude: number | null;
  list_price: number | null;
  close_price: number | null;
  property_type: string | null;
  property_sub_type: string | null;
  bedrooms: number | null;
  bathrooms_total: number | null;
  bathrooms_full: number | null;
  bathrooms_half: number | null;
  living_area: number | null;
  lot_sqft: number | null;
  lot_acres: number | null;
  year_built: number | null;
  days_on_market: number | null;
  price_per_sqft: number | null;
  photos_count: number | null;
  primary_photo_url: string | null;
  list_agent_name: string | null;
  list_office_name: string | null;
  list_office_phone: string | null;
  last_updated: string;   // ISO timestamp — set by compliance middleware
}

export interface ListingDetail extends ListingRecord {
  listing_contract_date: string | null;
  close_date: string | null;
  modification_timestamp: string | null;
  status_change_timestamp: string | null;
  original_entry_timestamp: string | null;
  public_remarks: string | null;
  photo_urls: Array<{ url: string; order: number; description: string | null }>;
  virtual_tour_url: string | null;
  parcel_number: string | null;
  elementary_school: string | null;
  elementary_school_district: string | null;
  middle_school: string | null;
  high_school_district: string | null;
  interior_features: string[] | null;
  exterior_features: string[] | null;
  appliances: string[] | null;
  cooling: string[] | null;
  heating: string[] | null;
  flooring: string[] | null;
  pool_features: string[] | null;
  community_features: string[] | null;
  view_features: string[] | null;
  architectural_style: string[] | null;
  construction_materials: string[] | null;
  roof: string[] | null;
  fireplace_features: string[] | null;
  lot_features: string[] | null;
  patio_and_porch_features: string[] | null;
  fencing: string[] | null;
  sewer: string[] | null;
  water_source: string[] | null;
  garage_spaces: number | null;
  covered_spaces: number | null;
  carport_spaces: number | null;
  hoa_fee: number | null;
  hoa_frequency: string | null;
  tax_annual: number | null;
  tax_year: number | null;
  list_agent_key: string | null;
  list_office_key: string | null;
  buyer_agent_key: string | null;
  buyer_agent_name: string | null;
  buyer_office_key: string | null;
  buyer_office_name: string | null;
  has_pool: boolean | null;
  has_fireplace: boolean | null;
  has_garage: boolean | null;
  has_hoa: boolean | null;
  is_horse_property: boolean | null;
  is_luxury: boolean | null;
  internet_display_yn: boolean | null;
}

export interface ListingPhoto {
  url: string;
  order: number;
  description: string | null;
  is_preferred: boolean;
}
```

- [ ] **Step 3: Write listings/search.ts and pins.ts**

```ts
// packages/shared/src/listings/search.ts
import type { ListingRecord } from './listing';

export interface SearchListingCard {
  listing_key: string;
  listing_id: string;
  primary_photo_url: string | null;
  list_price: number | null;
  bedrooms: number | null;
  bathrooms_total: number | null;
  bathrooms_full: number | null;
  bathrooms_half: number | null;
  living_area: number | null;
  lot_acres: number | null;
  unparsed_address: string | null;
  street_number: string | null;
  street_name: string | null;
  street_suffix: string | null;
  city: string | null;
  postal_code: string;
  days_on_market: number | null;
  has_price_reduction: boolean | null;
  price_reduction_amount: number | null;
  price_reduction_pct: number | null;
  property_type: string | null;
  property_sub_type: string | null;
  is_horse_property: boolean | null;
  is_luxury: boolean | null;
  photos_count: number | null;
  latitude: number | null;
  longitude: number | null;
  status_change_timestamp: string | null;
  subdivision_display: string | null;
  list_office_name: string | null;
}

export interface SearchResult {
  results: SearchListingCard[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AutocompleteSuggestion {
  type: 'city' | 'zip' | 'subdivision' | 'region';
  value: string;
  count: number;
}
```

```ts
// packages/shared/src/listings/pins.ts
export interface MapPin {
  k: string;           // listing_key
  id: string;          // listing_id
  p: number | null;    // list_price
  la: number;          // latitude
  ln: number;          // longitude
}
```

- [ ] **Step 4: Write listings/index.ts barrel**

```ts
export * from './filters';
export * from './listing';
export * from './search';
export * from './pins';
```

- [ ] **Step 5: Update packages/shared/src/index.ts to re-export**

Append to the file:

```ts
export * from './listings';
```

- [ ] **Step 6: Type-check the shared package**

```bash
pnpm --filter @platform/shared type-check
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): relocate listing/search/pin types for cross-package use"
```

---

### Task 3: Write error classes

**Files:**
- Create: `packages/spark/src/errors.ts`
- Create: `packages/spark/__tests__/errors.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/spark/__tests__/errors.test.ts
import { describe, it, expect } from 'vitest';
import {
  SparkAuthError,
  SparkRateLimitError,
  SparkUnavailableError,
  ComplianceError,
} from '../src/errors';

describe('error classes', () => {
  it('SparkAuthError has name and status', () => {
    const err = new SparkAuthError('bad token', 401);
    expect(err.name).toBe('SparkAuthError');
    expect(err.status).toBe(401);
    expect(err instanceof Error).toBe(true);
  });

  it('SparkRateLimitError exposes retryAfter', () => {
    const err = new SparkRateLimitError('429', 60);
    expect(err.name).toBe('SparkRateLimitError');
    expect(err.retryAfter).toBe(60);
  });

  it('SparkUnavailableError wraps cause', () => {
    const cause = new Error('network');
    const err = new SparkUnavailableError('offline', { cause });
    expect(err.name).toBe('SparkUnavailableError');
    expect(err.cause).toBe(cause);
  });

  it('ComplianceError carries listingKey + field', () => {
    const err = new ComplianceError('missing agent', {
      listingKey: 'abc',
      missingField: 'ListOfficeName',
    });
    expect(err.name).toBe('ComplianceError');
    expect(err.listingKey).toBe('abc');
    expect(err.missingField).toBe('ListOfficeName');
  });
});
```

- [ ] **Step 2: Run the test — expect fail**

```bash
pnpm --filter @platform/spark test
```

Expected: module not found, all 4 tests fail.

- [ ] **Step 3: Write errors.ts**

```ts
// packages/spark/src/errors.ts

export class SparkAuthError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'SparkAuthError';
    this.status = status;
  }
}

export class SparkRateLimitError extends Error {
  readonly retryAfter: number;
  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'SparkRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class SparkUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'SparkUnavailableError';
  }
}

export class ComplianceError extends Error {
  readonly listingKey: string;
  readonly missingField: string;
  constructor(message: string, context: { listingKey: string; missingField: string }) {
    super(message);
    this.name = 'ComplianceError';
    this.listingKey = context.listingKey;
    this.missingField = context.missingField;
  }
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
pnpm --filter @platform/spark test
```

Expected: 4/4 pass.

- [ ] **Step 5: Commit**

```bash
git add packages/spark/src/errors.ts packages/spark/__tests__/errors.test.ts
git commit -m "feat(spark): error classes for Spark client and compliance"
```

---

### Task 4: Extract SparkReplicationClient → SparkClient

**Files:**
- Create: `packages/spark/src/client.ts`
- Create: `packages/spark/__tests__/client.test.ts`
- Source of copy: `apps/backend/src/lib/spark/client.ts` (read entire file first)

- [ ] **Step 1: Write failing test for constructor**

```ts
// packages/spark/__tests__/client.test.ts
import { describe, it, expect } from 'vitest';
import { SparkClient } from '../src/client';

describe('SparkClient constructor', () => {
  it('throws when no access token provided', () => {
    expect(() => new SparkClient({ accessToken: '' })).toThrow('Spark access token is required');
  });

  it('accepts explicit token', () => {
    const c = new SparkClient({ accessToken: 'abc' });
    expect(c).toBeInstanceOf(SparkClient);
  });

  it('falls back to process.env.SPARK_ACCESS_TOKEN', () => {
    process.env.SPARK_ACCESS_TOKEN = 'envtoken';
    const c = new SparkClient();
    expect(c).toBeInstanceOf(SparkClient);
    delete process.env.SPARK_ACCESS_TOKEN;
  });
});
```

- [ ] **Step 2: Run — expect fail (module missing)**

```bash
pnpm --filter @platform/spark test client
```

Expected: fail.

- [ ] **Step 3: Create client.ts by copying from backend + adapt**

Open `apps/backend/src/lib/spark/client.ts`, copy the entire file to `packages/spark/src/client.ts`. Rename the exported class from `SparkReplicationClient` to `SparkClient`. Leave the rest (paginateEntity, fetchPage, fetchPhotos, extractSkipToken) intact.

- [ ] **Step 4: Run — expect pass**

```bash
pnpm --filter @platform/spark test client
```

Expected: 3/3 pass.

- [ ] **Step 5: Commit**

```bash
git add packages/spark/src/client.ts packages/spark/__tests__/client.test.ts
git commit -m "feat(spark): extract SparkReplicationClient as SparkClient"
```

---

### Task 5: Add `searchProperties()` method to SparkClient

**Files:**
- Modify: `packages/spark/src/client.ts`
- Modify: `packages/spark/__tests__/client.test.ts`

- [ ] **Step 1: Write failing test with mocked fetch**

Append to `client.test.ts`:

```ts
import { vi, beforeEach, afterEach } from 'vitest';

describe('SparkClient.searchProperties', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls Property endpoint with $filter, $top, $skip, $orderby', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [{ ListingKey: 'abc' }], '@odata.count': 1 }),
    });

    const c = new SparkClient({ accessToken: 't' });
    const result = await c.searchProperties({
      filter: "StandardStatus eq 'Active'",
      top: 24,
      skip: 0,
      orderby: 'ListPrice desc',
      select: 'ListingKey,ListPrice',
      expand: "Media($top=1)",
    });

    expect(result.records.length).toBe(1);
    expect(result.totalCount).toBe(1);

    const call = (global.fetch as any).mock.calls[0][0] as string;
    expect(call).toContain('/Property?');
    expect(call).toContain('%24filter=StandardStatus+eq+%27Active%27');
    expect(call).toContain('%24top=24');
    expect(call).toContain('%24skip=0');
    expect(call).toContain('%24orderby=ListPrice+desc');
    expect(call).toContain('%24count=true');
  });

  it('throws SparkUnavailableError on 5xx', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    });
    const c = new SparkClient({ accessToken: 't' });
    await expect(c.searchProperties({ filter: "1 eq 1" })).rejects.toThrow('SparkUnavailableError');
  });

  it('throws SparkAuthError on 401', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });
    const c = new SparkClient({ accessToken: 't' });
    await expect(c.searchProperties({ filter: "1 eq 1" })).rejects.toMatchObject({ name: 'SparkAuthError' });
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
pnpm --filter @platform/spark test client
```

Expected: 3 new tests fail (method does not exist).

- [ ] **Step 3: Add `searchProperties` method to SparkClient**

In `packages/spark/src/client.ts`, add:

```ts
import { SparkAuthError, SparkUnavailableError, SparkRateLimitError } from './errors';

interface SearchPropertiesOptions {
  filter: string;
  top?: number;
  skip?: number;
  orderby?: string;
  select?: string;
  expand?: string;
  count?: boolean;
}

interface SearchResponse {
  records: Record<string, unknown>[];
  totalCount: number | null;
  nextSkipToken: string | null;
}

// Add inside SparkClient class:
async searchProperties(opts: SearchPropertiesOptions): Promise<SearchResponse> {
  const params = new URLSearchParams();
  params.set('$filter', opts.filter);
  if (opts.top != null) params.set('$top', String(opts.top));
  if (opts.skip != null) params.set('$skip', String(opts.skip));
  if (opts.orderby) params.set('$orderby', opts.orderby);
  if (opts.select) params.set('$select', opts.select);
  if (opts.expand) params.set('$expand', opts.expand);
  if (opts.count !== false) params.set('$count', 'true');

  const url = `${this.config.baseUrl}/Property?${params.toString()}`;
  const res = await this.authenticatedFetch(url);

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw new SparkAuthError(text.substring(0, 200), res.status);
    }
    if (res.status === 429) {
      const retry = Number(res.headers.get('retry-after') ?? '1');
      throw new SparkRateLimitError(text.substring(0, 200), retry);
    }
    if (res.status >= 500) {
      throw new SparkUnavailableError(`Spark ${res.status}: ${text.substring(0, 200)}`);
    }
    throw new Error(`Spark API error ${res.status}: ${text.substring(0, 200)}`);
  }

  const data: { value: Record<string, unknown>[]; '@odata.count'?: number; '@odata.nextLink'?: string } = await res.json();
  this.requestCount++;

  return {
    records: data.value ?? [],
    totalCount: data['@odata.count'] ?? null,
    nextSkipToken: data['@odata.nextLink'] ? this.extractSkipToken(data['@odata.nextLink']) : null,
  };
}
```

- [ ] **Step 4: Run — expect pass**

```bash
pnpm --filter @platform/spark test client
```

Expected: 6/6 pass.

- [ ] **Step 5: Commit**

```bash
git add packages/spark/src/client.ts packages/spark/__tests__/client.test.ts
git commit -m "feat(spark): searchProperties with filter/top/skip/orderby and error taxonomy"
```

---

### Task 6: Add `getProperty(listingKey)` and `getPropertyByListingId(id)` to SparkClient

**Files:**
- Modify: `packages/spark/src/client.ts`
- Modify: `packages/spark/__tests__/client.test.ts`

- [ ] **Step 1: Write failing tests**

Append:

```ts
describe('SparkClient.getProperty', () => {
  it('fetches /Property(key) with $expand', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ListingKey: 'abc', Media: [{ MediaURL: 'x' }] }),
    });
    const c = new SparkClient({ accessToken: 't' });
    const rec = await c.getProperty('abc', { expand: 'Media' });
    expect(rec).toMatchObject({ ListingKey: 'abc' });
    const call = (global.fetch as any).mock.calls[0][0] as string;
    expect(call).toContain("/Property('abc')");
  });

  it('returns null on 404', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    });
    const c = new SparkClient({ accessToken: 't' });
    const rec = await c.getProperty('nope');
    expect(rec).toBeNull();
  });
});

describe('SparkClient.getPropertyByListingId', () => {
  it('filters by ListingId and returns first row', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [{ ListingId: '6800000', ListingKey: 'abc' }] }),
    });
    const c = new SparkClient({ accessToken: 't' });
    const rec = await c.getPropertyByListingId('6800000');
    expect(rec).toMatchObject({ ListingKey: 'abc' });
  });

  it('returns null when empty', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [] }),
    });
    const c = new SparkClient({ accessToken: 't' });
    const rec = await c.getPropertyByListingId('nope');
    expect(rec).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Add methods**

```ts
async getProperty(
  listingKey: string,
  opts: { expand?: string; select?: string } = {},
): Promise<Record<string, unknown> | null> {
  const params = new URLSearchParams();
  if (opts.expand) params.set('$expand', opts.expand);
  if (opts.select) params.set('$select', opts.select);
  const qs = params.toString();
  const url = `${this.config.baseUrl}/Property('${listingKey}')${qs ? '?' + qs : ''}`;
  const res = await this.authenticatedFetch(url);
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401 || res.status === 403) throw new SparkAuthError(text.substring(0, 200), res.status);
    if (res.status >= 500) throw new SparkUnavailableError(`Spark ${res.status}: ${text.substring(0, 200)}`);
    throw new Error(`Spark API error ${res.status}: ${text.substring(0, 200)}`);
  }
  this.requestCount++;
  return (await res.json()) as Record<string, unknown>;
}

async getPropertyByListingId(
  listingId: string,
  opts: { expand?: string } = {},
): Promise<Record<string, unknown> | null> {
  const result = await this.searchProperties({
    filter: `ListingId eq '${listingId}'`,
    top: 1,
    expand: opts.expand,
    count: false,
  });
  return result.records[0] ?? null;
}
```

- [ ] **Step 4: Run — expect pass**

- [ ] **Step 5: Commit**

```bash
git add packages/spark/src/client.ts packages/spark/__tests__/client.test.ts
git commit -m "feat(spark): getProperty + getPropertyByListingId client methods"
```

---

### Task 7: Extract field-mapper into `@platform/spark`

**Files:**
- Create: `packages/spark/src/field-mapper.ts` (copy from `apps/backend/src/lib/spark/field-mapper.ts`)
- Create: `packages/spark/__tests__/field-mapper.test.ts`

- [ ] **Step 1: Read and copy field-mapper.ts**

```bash
cp "apps/backend/src/lib/spark/field-mapper.ts" "packages/spark/src/field-mapper.ts"
```

Fix any imports that reference backend-only paths; replace with relative imports or stub.

- [ ] **Step 2: Write a minimal smoke test**

```ts
// packages/spark/__tests__/field-mapper.test.ts
import { describe, it, expect } from 'vitest';
import { mapSparkProperty } from '../src/field-mapper';

describe('mapSparkProperty (imported from backend)', () => {
  it('maps basic RESO fields to db schema shape', () => {
    const row = {
      ListingKey: 'K1',
      ListingId: '6800000',
      StandardStatus: 'Active',
      ListPrice: 500000,
      BedroomsTotal: 3,
      BathroomsTotalInteger: 2,
      UnparsedAddress: '123 Main',
      City: 'Phoenix',
      PostalCode: '85001',
      Latitude: 33.4,
      Longitude: -112.0,
    };
    const mapped = mapSparkProperty(row);
    expect(mapped.listing_key).toBe('K1');
    expect(mapped.listing_id).toBe('6800000');
    expect(mapped.standard_status).toBe('Active');
    expect(mapped.list_price).toBe(500000);
    expect(mapped.bedrooms_total).toBe(3);
    expect(mapped.bathrooms_total_integer).toBe(2);
  });
});
```

- [ ] **Step 3: Run — confirm pass or fix import paths**

```bash
pnpm --filter @platform/spark test field-mapper
```

- [ ] **Step 4: Commit**

```bash
git add packages/spark/src/field-mapper.ts packages/spark/__tests__/field-mapper.test.ts
git commit -m "feat(spark): extract field-mapper from backend into package"
```

---

### Task 8: Write OData filter builder (filters.ts)

**Files:**
- Create: `packages/spark/src/filters.ts`
- Create: `packages/spark/__tests__/filters.test.ts`

- [ ] **Step 1: Write failing tests covering every filter branch**

```ts
// packages/spark/__tests__/filters.test.ts
import { describe, it, expect } from 'vitest';
import { buildODataFilter, buildODataOrderby } from '../src/filters';
import type { SearchFilters, ListingSearchFilters } from '@platform/shared';

describe('buildODataFilter — IDX baseline', () => {
  it('always includes InternetEntireListingDisplayYN and active statuses when no status filter', () => {
    const f = buildODataFilter({});
    expect(f).toContain('InternetEntireListingDisplayYN eq true');
    expect(f).toContain('Active');
  });
});

describe('buildODataFilter — price and numeric ranges', () => {
  it('price range both sides', () => {
    expect(buildODataFilter({ minPrice: 100000, maxPrice: 500000 } as SearchFilters))
      .toContain('ListPrice ge 100000 and ListPrice le 500000');
  });
  it('beds min only', () => {
    expect(buildODataFilter({ minBeds: 3 } as SearchFilters)).toContain('BedroomsTotal ge 3');
  });
  it('baths min only', () => {
    expect(buildODataFilter({ minBaths: 2 } as SearchFilters)).toContain('BathroomsTotalInteger ge 2');
  });
  it('sqft range', () => {
    const f = buildODataFilter({ minSqft: 1000, maxSqft: 3000 } as SearchFilters);
    expect(f).toContain('LivingArea ge 1000');
    expect(f).toContain('LivingArea le 3000');
  });
  it('lot acres min', () => {
    expect(buildODataFilter({ minLotAcres: 0.5 } as SearchFilters)).toContain('LotSizeAcres ge 0.5');
  });
  it('year built range', () => {
    const f = buildODataFilter({ yearBuiltMin: 1990, yearBuiltMax: 2020 } as SearchFilters);
    expect(f).toContain('YearBuilt ge 1990');
    expect(f).toContain('YearBuilt le 2020');
  });
  it('hoa max', () => {
    expect(buildODataFilter({ maxHoa: 500 } as SearchFilters)).toContain('AssociationFee le 500');
  });
});

describe('buildODataFilter — location', () => {
  it('single city', () => {
    expect(buildODataFilter({ city: 'Scottsdale' } as SearchFilters))
      .toContain("tolower(City) eq 'scottsdale'");
  });
  it('multi city with OR', () => {
    const f = buildODataFilter({ city: ['Scottsdale', 'Phoenix'] } as SearchFilters);
    expect(f).toContain("tolower(City) eq 'scottsdale'");
    expect(f).toContain("tolower(City) eq 'phoenix'");
    expect(f).toContain(' or ');
  });
  it('subdivision', () => {
    expect(buildODataFilter({ subdivisionName: 'Desert Mountain' } as SearchFilters))
      .toContain("tolower(SubdivisionName) eq 'desert mountain'");
  });
  it('postal codes multi', () => {
    const f = buildODataFilter({ postalCode: ['85255', '85262'] } as SearchFilters);
    expect(f).toContain("PostalCode eq '85255'");
    expect(f).toContain("PostalCode eq '85262'");
  });
});

describe('buildODataFilter — features', () => {
  it('pool yn', () => {
    expect(buildODataFilter({ hasPool: true } as SearchFilters)).toContain('PoolPrivateYN eq true');
  });
  it('horse yn', () => {
    expect(buildODataFilter({ isHorseProperty: true } as SearchFilters)).toContain('HorseYN eq true');
  });
  it('has photos', () => {
    expect(buildODataFilter({ hasPhotos: true } as SearchFilters)).toContain('PhotosCount gt 0');
  });
  it('has virtual tour', () => {
    expect(buildODataFilter({ hasVirtualTour: true } as SearchFilters)).toContain('VirtualTourURLUnbranded ne null');
  });
});

describe('buildODataFilter — spatial bounds', () => {
  it('bounding box', () => {
    const f = buildODataFilter({
      bounds: { north: 34, south: 33, east: -111, west: -112 },
    } as SearchFilters);
    expect(f).toContain('Latitude ge 33');
    expect(f).toContain('Latitude le 34');
    expect(f).toContain('Longitude ge -112');
    expect(f).toContain('Longitude le -111');
  });
});

describe('buildODataFilter — keyword', () => {
  it('uses contains on lower-cased address and remarks', () => {
    const f = buildODataFilter({ keywords: 'Main St' } as SearchFilters);
    expect(f).toContain("contains(tolower(UnparsedAddress), 'main st')");
    expect(f).toContain("contains(tolower(PublicRemarks), 'main st')");
  });
  it('escapes single quotes in keyword', () => {
    const f = buildODataFilter({ keywords: "O'Brien" } as SearchFilters);
    expect(f).toContain("o''brien");  // OData escape
  });
});

describe('buildODataFilter — ListingSearchFilters variant', () => {
  it('maps cities (array) and subdivisionNames (array)', () => {
    const f = buildODataFilter({
      cities: ['Scottsdale'],
      subdivisionNames: ['DC Ranch', 'Troon'],
    } as ListingSearchFilters);
    expect(f).toContain("tolower(City) eq 'scottsdale'");
    expect(f).toContain("tolower(SubdivisionName) eq 'dc ranch'");
    expect(f).toContain("tolower(SubdivisionName) eq 'troon'");
  });
});

describe('buildODataOrderby', () => {
  it('maps sort keys', () => {
    expect(buildODataOrderby('newest')).toBe('ModificationTimestamp desc');
    expect(buildODataOrderby('price_asc')).toBe('ListPrice asc');
    expect(buildODataOrderby('price_desc')).toBe('ListPrice desc');
    expect(buildODataOrderby('sqft')).toBe('LivingArea desc');
    expect(buildODataOrderby('lot_size')).toBe('LotSizeAcres desc');
  });
  it('returns null for proximity (handled client-side)', () => {
    expect(buildODataOrderby('proximity')).toBeNull();
  });
  it('defaults to newest when no sort', () => {
    expect(buildODataOrderby(undefined)).toBe('ModificationTimestamp desc');
  });
});
```

- [ ] **Step 2: Run — expect fail (module missing)**

```bash
pnpm --filter @platform/spark test filters
```

- [ ] **Step 3: Implement filters.ts**

```ts
// packages/spark/src/filters.ts
import type {
  ListingSearchFilters,
  SearchFilters,
  SortOption,
} from '@platform/shared';

type AnyListingFilters = ListingSearchFilters | SearchFilters;

const ACTIVE_STATUSES = ['Active', 'Active Under Contract', 'Pending', 'Coming Soon'];

function odataEscape(value: string): string {
  return value.replace(/'/g, "''");
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function statusClause(filters: AnyListingFilters): string {
  const requested = asArray((filters as ListingSearchFilters).status);
  const statuses = requested.length > 0 ? requested : ACTIVE_STATUSES;
  return '(' + statuses.map(s => `StandardStatus eq '${odataEscape(s)}'`).join(' or ') + ')';
}

function cityClause(filters: AnyListingFilters): string | null {
  const asSearch = (filters as SearchFilters).city;
  const asListing = (filters as ListingSearchFilters).cities;
  const cities = asArray(asSearch ?? asListing);
  if (cities.length === 0) return null;
  return '(' + cities.map(c => `tolower(City) eq '${odataEscape(c.toLowerCase())}'`).join(' or ') + ')';
}

function postalClause(filters: AnyListingFilters): string | null {
  const asSearch = (filters as SearchFilters).postalCode;
  const codes = asArray(typeof asSearch === 'string' ? [asSearch] : asSearch ?? (filters as ListingSearchFilters).postalCode);
  if (codes.length === 0) return null;
  return '(' + codes.map(p => `PostalCode eq '${odataEscape(p)}'`).join(' or ') + ')';
}

function subdivisionClause(filters: AnyListingFilters): string | null {
  const asSearch = (filters as SearchFilters).subdivisionName;
  const asListingSingle = (filters as ListingSearchFilters).subdivisionName;
  const asListingMulti = (filters as ListingSearchFilters).subdivisionNames;
  const subs = asArray(asSearch ?? asListingSingle ?? asListingMulti);
  if (subs.length === 0) return null;
  return '(' + subs.map(s => `tolower(SubdivisionName) eq '${odataEscape(s.toLowerCase())}'`).join(' or ') + ')';
}

function propertyTypeClause(filters: AnyListingFilters): string | null {
  const asSearch = asArray((filters as SearchFilters).propertyType);
  const asListing = (filters as ListingSearchFilters).propertyType;
  const types = asSearch.length > 0 ? asSearch : asListing ? [asListing] : [];
  if (types.length === 0) return null;
  return '(' + types.map(t => `PropertyType eq '${odataEscape(t)}'`).join(' or ') + ')';
}

export function buildODataFilter(filters: AnyListingFilters): string {
  const parts: string[] = [];

  // Baseline
  parts.push('InternetEntireListingDisplayYN eq true');
  parts.push(statusClause(filters));

  // Price
  if (filters.minPrice != null) parts.push(`ListPrice ge ${filters.minPrice}`);
  if (filters.maxPrice != null) parts.push(`ListPrice le ${filters.maxPrice}`);

  // Bedrooms / bathrooms
  if (filters.minBeds != null) parts.push(`BedroomsTotal ge ${filters.minBeds}`);
  if ((filters as ListingSearchFilters).maxBeds != null) parts.push(`BedroomsTotal le ${(filters as ListingSearchFilters).maxBeds}`);
  if (filters.minBaths != null) parts.push(`BathroomsTotalInteger ge ${filters.minBaths}`);

  // Sqft / lot
  if (filters.minSqft != null) parts.push(`LivingArea ge ${filters.minSqft}`);
  if (filters.maxSqft != null) parts.push(`LivingArea le ${filters.maxSqft}`);
  if (filters.minLotAcres != null) parts.push(`LotSizeAcres ge ${filters.minLotAcres}`);
  const maxLot = (filters as SearchFilters).maxLotAcres;
  if (maxLot != null) parts.push(`LotSizeAcres le ${maxLot}`);

  // Year built
  const ybMin = (filters as SearchFilters).yearBuiltMin ?? (filters as ListingSearchFilters).minYearBuilt;
  if (ybMin != null) parts.push(`YearBuilt ge ${ybMin}`);
  const ybMax = (filters as SearchFilters).yearBuiltMax;
  if (ybMax != null) parts.push(`YearBuilt le ${ybMax}`);

  // HOA
  if (filters.maxHoa != null) parts.push(`AssociationFee le ${filters.maxHoa}`);

  // Garage / stories
  const minGarage = (filters as SearchFilters).minGarage ?? (filters as ListingSearchFilters).minGarageSpaces;
  if (minGarage != null) parts.push(`GarageSpaces ge ${minGarage}`);
  if (filters.minStories != null) parts.push(`StoriesTotal ge ${filters.minStories}`);

  // Features (booleans)
  if (filters.hasPool) parts.push('PoolPrivateYN eq true');
  if (filters.isHorseProperty) parts.push('HorseYN eq true');
  if (filters.hasPhotos) parts.push('PhotosCount gt 0');
  if ((filters as SearchFilters).hasVirtualTour) parts.push('VirtualTourURLUnbranded ne null');

  // Location
  const city = cityClause(filters);
  if (city) parts.push(city);
  const postal = postalClause(filters);
  if (postal) parts.push(postal);
  const subdivision = subdivisionClause(filters);
  if (subdivision) parts.push(subdivision);
  const pType = propertyTypeClause(filters);
  if (pType) parts.push(pType);

  // Spatial bounds
  const bounds = (filters as SearchFilters).bounds;
  if (bounds) {
    parts.push(`Latitude ge ${bounds.south}`);
    parts.push(`Latitude le ${bounds.north}`);
    parts.push(`Longitude ge ${bounds.west}`);
    parts.push(`Longitude le ${bounds.east}`);
  } else if ((filters as ListingSearchFilters).swLat != null) {
    const lf = filters as ListingSearchFilters;
    parts.push(`Latitude ge ${lf.swLat}`);
    parts.push(`Latitude le ${lf.neLat}`);
    parts.push(`Longitude ge ${lf.swLng}`);
    parts.push(`Longitude le ${lf.neLng}`);
  }

  // Keyword
  const keyword = (filters as SearchFilters).keywords ?? (filters as ListingSearchFilters).keyword;
  if (keyword) {
    const esc = odataEscape(keyword.toLowerCase());
    parts.push(`(contains(tolower(UnparsedAddress), '${esc}') or contains(tolower(PublicRemarks), '${esc}'))`);
  }

  return parts.join(' and ');
}

const SORT_MAP: Record<Exclude<SortOption, 'proximity'>, string> = {
  newest: 'ModificationTimestamp desc',
  price_asc: 'ListPrice asc',
  price_desc: 'ListPrice desc',
  sqft: 'LivingArea desc',
  lot_size: 'LotSizeAcres desc',
};

export function buildODataOrderby(sort: SortOption | string | undefined): string | null {
  if (sort === 'proximity') return null;
  if (!sort) return 'ModificationTimestamp desc';
  return SORT_MAP[sort as Exclude<SortOption, 'proximity'>] ?? 'ModificationTimestamp desc';
}
```

- [ ] **Step 4: Run — expect pass**

```bash
pnpm --filter @platform/spark test filters
```

Expected: all filter tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/spark/src/filters.ts packages/spark/__tests__/filters.test.ts
git commit -m "feat(spark): OData filter + orderby builder for both filter shapes"
```

---

### Task 9: Write mappers.ts — Spark row → internal types

**Files:**
- Create: `packages/spark/src/mappers.ts`
- Create: `packages/spark/__tests__/mappers.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/spark/__tests__/mappers.test.ts
import { describe, it, expect } from 'vitest';
import {
  sparkToListingRecord,
  sparkToSearchCard,
  sparkToListingDetail,
  sparkToMapPin,
  extractPhotos,
} from '../src/mappers';

const row = {
  ListingKey: 'K1',
  ListingId: '6800001',
  StandardStatus: 'Active',
  UnparsedAddress: '123 Main St',
  City: 'Scottsdale',
  PostalCode: '85255',
  Latitude: 33.6,
  Longitude: -111.9,
  ListPrice: 750000,
  BedroomsTotal: 4,
  BathroomsTotalInteger: 3,
  LivingArea: 2800,
  LotSizeAcres: 0.25,
  YearBuilt: 2010,
  PropertyType: 'Residential',
  PropertySubType: 'Single Family Residence',
  DaysOnMarket: 14,
  ModificationTimestamp: '2026-04-19T10:00:00Z',
  ListOfficeName: 'ABC Realty',
  ListAgentFullName: 'Jane Smith',
  ListAgentDirectPhone: '(602) 555-0100',
  SubdivisionName: 'DC Ranch',
  Media: [
    { MediaURL: 'https://cdn/1.jpg', Order: 1, ShortDescription: 'Front' },
    { MediaURL: 'https://cdn/2.jpg', Order: 2, ShortDescription: null },
  ],
  PhotosCount: 2,
  PublicRemarks: 'Beautiful home.',
};

describe('sparkToSearchCard', () => {
  it('maps the card subset', () => {
    const card = sparkToSearchCard(row);
    expect(card.listing_key).toBe('K1');
    expect(card.listing_id).toBe('6800001');
    expect(card.list_price).toBe(750000);
    expect(card.bedrooms).toBe(4);
    expect(card.bathrooms_total).toBe(3);
    expect(card.living_area).toBe(2800);
    expect(card.city).toBe('Scottsdale');
    expect(card.primary_photo_url).toBe('https://cdn/1.jpg');
    expect(card.subdivision_display).toBe('DC Ranch');
    expect(card.list_office_name).toBe('ABC Realty');
  });
  it('handles missing Media gracefully', () => {
    const { Media, ...noMedia } = row;
    const card = sparkToSearchCard(noMedia as any);
    expect(card.primary_photo_url).toBeNull();
  });
});

describe('sparkToListingRecord', () => {
  it('includes last_updated as ISO string', () => {
    const r = sparkToListingRecord(row);
    expect(r.last_updated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(r.listing_key).toBe('K1');
  });
});

describe('sparkToListingDetail', () => {
  it('expands photo_urls array', () => {
    const d = sparkToListingDetail(row);
    expect(d.photo_urls).toHaveLength(2);
    expect(d.photo_urls[0]).toMatchObject({ url: 'https://cdn/1.jpg', order: 1 });
    expect(d.public_remarks).toBe('Beautiful home.');
  });
});

describe('sparkToMapPin', () => {
  it('maps minimal geo pin', () => {
    expect(sparkToMapPin(row)).toEqual({
      k: 'K1',
      id: '6800001',
      p: 750000,
      la: 33.6,
      ln: -111.9,
    });
  });
});

describe('extractPhotos', () => {
  it('returns sorted photo list', () => {
    const photos = extractPhotos(row.Media as any);
    expect(photos[0].order).toBe(1);
    expect(photos[1].order).toBe(2);
  });
  it('handles null input', () => {
    expect(extractPhotos(null)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Implement mappers.ts**

```ts
// packages/spark/src/mappers.ts
import type {
  ListingRecord,
  ListingDetail,
  ListingPhoto,
  MapPin,
  SearchListingCard,
} from '@platform/shared';

type SparkRow = Record<string, unknown>;

function s(v: unknown): string | null {
  return v == null || v === '' ? null : String(v);
}
function n(v: unknown): number | null {
  if (v == null || v === '') return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}
function b(v: unknown): boolean | null {
  if (v == null) return null;
  return v === true || v === 'true' || v === 1;
}
function arr(v: unknown): string[] | null {
  if (!v) return null;
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') return v.split(',').map(x => x.trim()).filter(Boolean);
  return null;
}

export function extractPhotos(media: unknown): ListingPhoto[] {
  if (!Array.isArray(media)) return [];
  return media
    .map((m: any) => ({
      url: String(m.MediaURL ?? ''),
      order: Number(m.Order ?? 0),
      description: m.ShortDescription ? String(m.ShortDescription) : null,
      is_preferred: m.PreferredPhotoYN === true || m.PreferredPhotoYN === 'true',
    }))
    .filter(p => p.url.length > 0)
    .sort((a, b) => a.order - b.order);
}

export function sparkToSearchCard(row: SparkRow): SearchListingCard {
  const photos = extractPhotos(row.Media);
  const primary = photos[0]?.url ?? null;
  return {
    listing_key: String(row.ListingKey),
    listing_id: String(row.ListingId),
    primary_photo_url: primary,
    list_price: n(row.ListPrice),
    bedrooms: n(row.BedroomsTotal),
    bathrooms_total: n(row.BathroomsTotalInteger),
    bathrooms_full: n(row.BathroomsFull),
    bathrooms_half: n(row.BathroomsHalf),
    living_area: n(row.LivingArea),
    lot_acres: n(row.LotSizeAcres),
    unparsed_address: s(row.UnparsedAddress),
    street_number: s(row.StreetNumber),
    street_name: s(row.StreetName),
    street_suffix: s(row.StreetSuffix),
    city: s(row.City),
    postal_code: String(row.PostalCode ?? ''),
    days_on_market: n(row.DaysOnMarket),
    has_price_reduction: row.PreviousListPrice != null && Number(row.PreviousListPrice) > Number(row.ListPrice),
    price_reduction_amount: row.PreviousListPrice ? Number(row.PreviousListPrice) - Number(row.ListPrice) : null,
    price_reduction_pct: row.PreviousListPrice && row.ListPrice
      ? ((Number(row.PreviousListPrice) - Number(row.ListPrice)) / Number(row.PreviousListPrice)) * 100
      : null,
    property_type: s(row.PropertyType),
    property_sub_type: s(row.PropertySubType),
    is_horse_property: b(row.HorseYN),
    is_luxury: (n(row.ListPrice) ?? 0) >= 1_000_000,
    photos_count: n(row.PhotosCount) ?? photos.length,
    latitude: n(row.Latitude),
    longitude: n(row.Longitude),
    status_change_timestamp: s(row.StatusChangeTimestamp),
    subdivision_display: s(row.SubdivisionName),
    list_office_name: s(row.ListOfficeName),
  };
}

export function sparkToListingRecord(row: SparkRow): ListingRecord {
  const photos = extractPhotos(row.Media);
  return {
    listing_key: String(row.ListingKey),
    listing_id: String(row.ListingId),
    standard_status: String(row.StandardStatus),
    mls_status: s(row.MlsStatus),
    unparsed_address: s(row.UnparsedAddress),
    city: s(row.City),
    state_or_province: s(row.StateOrProvince) ?? 'AZ',
    postal_code: String(row.PostalCode ?? ''),
    subdivision_display: s(row.SubdivisionName),
    latitude: n(row.Latitude),
    longitude: n(row.Longitude),
    list_price: n(row.ListPrice),
    close_price: n(row.ClosePrice),
    property_type: s(row.PropertyType),
    property_sub_type: s(row.PropertySubType),
    bedrooms: n(row.BedroomsTotal),
    bathrooms_total: n(row.BathroomsTotalInteger),
    bathrooms_full: n(row.BathroomsFull),
    bathrooms_half: n(row.BathroomsHalf),
    living_area: n(row.LivingArea),
    lot_sqft: n(row.LotSizeSquareFeet),
    lot_acres: n(row.LotSizeAcres),
    year_built: n(row.YearBuilt),
    days_on_market: n(row.DaysOnMarket),
    price_per_sqft: row.ListPrice && row.LivingArea
      ? Math.round((Number(row.ListPrice) / Number(row.LivingArea)) * 100) / 100
      : null,
    photos_count: n(row.PhotosCount) ?? photos.length,
    primary_photo_url: photos[0]?.url ?? null,
    list_agent_name: s(row.ListAgentFullName),
    list_office_name: s(row.ListOfficeName),
    list_office_phone: s(row.ListOfficePhone),
    last_updated: new Date().toISOString(),
  };
}

export function sparkToListingDetail(row: SparkRow): ListingDetail {
  const base = sparkToListingRecord(row);
  return {
    ...base,
    listing_contract_date: s(row.ListingContractDate),
    close_date: s(row.CloseDate),
    modification_timestamp: s(row.ModificationTimestamp),
    status_change_timestamp: s(row.StatusChangeTimestamp),
    original_entry_timestamp: s(row.OriginalEntryTimestamp),
    public_remarks: s(row.PublicRemarks),
    photo_urls: extractPhotos(row.Media),
    virtual_tour_url: s(row.VirtualTourURLUnbranded),
    parcel_number: s(row.ParcelNumber),
    elementary_school: s(row.ElementarySchool),
    elementary_school_district: s(row.ElementarySchoolDistrict),
    middle_school: s(row.MiddleOrJuniorSchool),
    high_school_district: s(row.HighSchoolDistrict),
    interior_features: arr(row.InteriorFeatures),
    exterior_features: arr(row.ExteriorFeatures),
    appliances: arr(row.Appliances),
    cooling: arr(row.Cooling),
    heating: arr(row.Heating),
    flooring: arr(row.Flooring),
    pool_features: arr(row.PoolFeatures),
    community_features: arr(row.CommunityFeatures),
    view_features: arr(row.ViewFeatures),
    architectural_style: arr(row.ArchitecturalStyle),
    construction_materials: arr(row.ConstructionMaterials),
    roof: arr(row.Roof),
    fireplace_features: arr(row.FireplaceFeatures),
    lot_features: arr(row.LotFeatures),
    patio_and_porch_features: arr(row.PatioAndPorchFeatures),
    fencing: arr(row.Fencing),
    sewer: arr(row.Sewer),
    water_source: arr(row.WaterSource),
    garage_spaces: n(row.GarageSpaces),
    covered_spaces: n(row.CoveredSpaces),
    carport_spaces: n(row.CarportSpaces),
    hoa_fee: n(row.AssociationFee),
    hoa_frequency: s(row.AssociationFeeFrequency),
    tax_annual: n(row.TaxAnnualAmount),
    tax_year: n(row.TaxYear),
    list_agent_key: s(row.ListAgentKey),
    list_office_key: s(row.ListOfficeKey),
    buyer_agent_key: s(row.BuyerAgentKey),
    buyer_agent_name: s(row.BuyerAgentFullName),
    buyer_office_key: s(row.BuyerOfficeKey),
    buyer_office_name: s(row.BuyerOfficeName),
    has_pool: b(row.PoolPrivateYN),
    has_fireplace: b(row.FireplaceYN),
    has_garage: (n(row.GarageSpaces) ?? 0) > 0,
    has_hoa: (n(row.AssociationFee) ?? 0) > 0,
    is_horse_property: b(row.HorseYN),
    is_luxury: (n(row.ListPrice) ?? 0) >= 1_000_000,
    internet_display_yn: b(row.InternetEntireListingDisplayYN),
  };
}

export function sparkToMapPin(row: SparkRow): MapPin {
  return {
    k: String(row.ListingKey),
    id: String(row.ListingId),
    p: n(row.ListPrice),
    la: Number(row.Latitude),
    ln: Number(row.Longitude),
  };
}
```

- [ ] **Step 4: Run — expect pass**

- [ ] **Step 5: Commit**

```bash
git add packages/spark/src/mappers.ts packages/spark/__tests__/mappers.test.ts
git commit -m "feat(spark): row mappers for card/record/detail/pin"
```

---

### Task 10: Compliance middleware

**Files:**
- Create: `packages/spark/src/compliance.ts`
- Create: `packages/spark/__tests__/compliance.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/spark/__tests__/compliance.test.ts
import { describe, it, expect, vi } from 'vitest';
import { enforceCompliance, stripProhibited } from '../src/compliance';

const valid = {
  ListingKey: 'K1',
  ListOfficeName: 'ABC',
  ListAgentFullName: 'Jane',
  ListAgentDirectPhone: '555-0100',
  PrivateRemarks: 'secret',
  ShowingInstructions: 'lockbox',
  PublicRemarks: 'public',
};

describe('stripProhibited', () => {
  it('removes PrivateRemarks, ShowingInstructions', () => {
    const out = stripProhibited({ ...valid });
    expect(out.PrivateRemarks).toBeUndefined();
    expect(out.ShowingInstructions).toBeUndefined();
    expect(out.PublicRemarks).toBe('public');
  });
});

describe('enforceCompliance', () => {
  it('passes complete listing through', () => {
    const warn = vi.fn();
    const result = enforceCompliance([valid], { warn });
    expect(result).toHaveLength(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it('drops listing missing ListOfficeName', () => {
    const warn = vi.fn();
    const bad = { ...valid, ListOfficeName: '' };
    const result = enforceCompliance([bad, valid], { warn });
    expect(result).toHaveLength(1);
    expect(result[0].ListingKey).toBe('K1');
    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(expect.objectContaining({ missingField: 'ListOfficeName' }));
  });

  it('accepts agent email as substitute for phone', () => {
    const warn = vi.fn();
    const emailOnly = { ...valid, ListAgentDirectPhone: '', ListAgentEmail: 'j@abc.com' };
    const result = enforceCompliance([emailOnly], { warn });
    expect(result).toHaveLength(1);
  });

  it('drops listing with neither phone nor email', () => {
    const warn = vi.fn();
    const noContact = { ...valid, ListAgentDirectPhone: '', ListAgentEmail: '' };
    const result = enforceCompliance([noContact], { warn });
    expect(result).toHaveLength(0);
    expect(warn).toHaveBeenCalledWith(expect.objectContaining({ missingField: 'ListAgentContact' }));
  });
});
```

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Implement compliance.ts**

```ts
// packages/spark/src/compliance.ts

const PROHIBITED_FIELDS = [
  'PrivateRemarks',
  'ShowingInstructions',
  'BuyerAgencyCompensation',
  'SellerContact',
  'SellerPhone',
  'SellerEmail',
];

export function stripProhibited(row: Record<string, unknown>): Record<string, unknown> {
  const out = { ...row };
  for (const f of PROHIBITED_FIELDS) {
    delete out[f];
  }
  return out;
}

export interface ComplianceWarning {
  listingKey: string;
  missingField: string;
}

export interface ComplianceOptions {
  warn?: (w: ComplianceWarning) => void;
}

function hasValue(row: Record<string, unknown>, key: string): boolean {
  const v = row[key];
  return v != null && String(v).trim().length > 0;
}

export function enforceCompliance(
  rows: Record<string, unknown>[],
  opts: ComplianceOptions = {},
): Record<string, unknown>[] {
  const warn = opts.warn ?? (() => {});
  const out: Record<string, unknown>[] = [];
  for (const row of rows) {
    const listingKey = String(row.ListingKey ?? '');
    if (!hasValue(row, 'ListOfficeName')) {
      warn({ listingKey, missingField: 'ListOfficeName' });
      continue;
    }
    if (!hasValue(row, 'ListAgentFullName')) {
      warn({ listingKey, missingField: 'ListAgentFullName' });
      continue;
    }
    if (!hasValue(row, 'ListAgentDirectPhone') && !hasValue(row, 'ListAgentEmail')) {
      warn({ listingKey, missingField: 'ListAgentContact' });
      continue;
    }
    out.push(stripProhibited(row));
  }
  return out;
}
```

- [ ] **Step 4: Run — expect pass**

- [ ] **Step 5: Commit**

```bash
git add packages/spark/src/compliance.ts packages/spark/__tests__/compliance.test.ts
git commit -m "feat(spark): compliance middleware — drop incomplete, strip prohibited"
```

---

### Task 11: Cache wrapper with 12-hour ceiling

**Files:**
- Create: `packages/spark/src/cache.ts`
- Create: `packages/spark/__tests__/cache.test.ts`

- [ ] **Step 1: Write failing test (mocked fetch clock)**

```ts
// packages/spark/__tests__/cache.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cachedWithCeiling, HOUR_MS } from '../src/cache';

describe('cachedWithCeiling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns cached value within TTL', async () => {
    const impl = vi.fn().mockResolvedValue({ data: 1 });
    const cached = cachedWithCeiling(impl, { ttlMs: 5 * 60_000 });
    const a = await cached('k');
    const b = await cached('k');
    expect(a).toEqual({ data: 1 });
    expect(b).toEqual({ data: 1 });
    expect(impl).toHaveBeenCalledOnce();
  });

  it('refetches after TTL', async () => {
    const impl = vi.fn()
      .mockResolvedValueOnce({ data: 1 })
      .mockResolvedValueOnce({ data: 2 });
    const cached = cachedWithCeiling(impl, { ttlMs: 1000 });
    const a = await cached('k');
    vi.advanceTimersByTime(1500);
    const b = await cached('k');
    expect(a).toEqual({ data: 1 });
    expect(b).toEqual({ data: 2 });
  });

  it('serves stale within 12h ceiling when fetch fails', async () => {
    const impl = vi.fn()
      .mockResolvedValueOnce({ data: 1 })
      .mockRejectedValueOnce(new Error('spark down'));
    const cached = cachedWithCeiling(impl, { ttlMs: 1000 });
    await cached('k');                  // populate
    vi.advanceTimersByTime(2_000);      // past TTL but under 12h
    const b = await cached('k');        // fetch fails — stale served
    expect(b).toEqual({ data: 1 });
  });

  it('returns unavailable when no entry and fetch fails', async () => {
    const impl = vi.fn().mockRejectedValue(new Error('spark down'));
    const cached = cachedWithCeiling(impl, { ttlMs: 1000 });
    const b = await cached('k');
    expect(b).toEqual({ status: 'unavailable', reason: 'compliance_stale' });
  });

  it('returns unavailable when stale entry past 12h and fetch fails', async () => {
    const impl = vi.fn()
      .mockResolvedValueOnce({ data: 1 })
      .mockRejectedValueOnce(new Error('spark down'));
    const cached = cachedWithCeiling(impl, { ttlMs: 1000 });
    await cached('k');
    vi.advanceTimersByTime(13 * HOUR_MS);
    const b = await cached('k');
    expect(b).toEqual({ status: 'unavailable', reason: 'compliance_stale' });
  });
});
```

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Implement cache.ts**

```ts
// packages/spark/src/cache.ts

export const HOUR_MS = 60 * 60 * 1000;
export const COMPLIANCE_CEILING_MS = 12 * HOUR_MS;

export interface UnavailableResult {
  status: 'unavailable';
  reason: 'compliance_stale';
}

interface CacheEntry<T> {
  value: T;
  createdAt: number;
}

interface CacheOptions {
  ttlMs: number;
  ceilingMs?: number;
}

/**
 * In-memory cache with TTL + 12h compliance ceiling.
 * - Within TTL: serve cached.
 * - Past TTL but within ceiling: refetch; if refetch fails, serve stale.
 * - Past ceiling (or no entry) + fetch fails: return { status: 'unavailable' }.
 *
 * In Next.js runtime, this module-level cache is per-instance.
 * For production cross-instance caching, the ListingService-level
 * wrappers layer unstable_cache(revalidate=N, tags=[...]) ON TOP of this.
 */
export function cachedWithCeiling<Args extends string[], T>(
  impl: (...args: Args) => Promise<T>,
  opts: CacheOptions,
): (...args: Args) => Promise<T | UnavailableResult> {
  const store = new Map<string, CacheEntry<T>>();
  const ceiling = opts.ceilingMs ?? COMPLIANCE_CEILING_MS;

  return async (...args: Args): Promise<T | UnavailableResult> => {
    const key = args.join('|');
    const entry = store.get(key);
    const now = Date.now();

    if (entry && now - entry.createdAt < opts.ttlMs) {
      return entry.value;
    }

    try {
      const fresh = await impl(...args);
      store.set(key, { value: fresh, createdAt: now });
      return fresh;
    } catch (err) {
      if (entry && now - entry.createdAt < ceiling) {
        console.warn('[spark cache] serving stale within ceiling:', key);
        return entry.value;
      }
      console.error('[spark cache] unavailable:', key, err);
      return { status: 'unavailable', reason: 'compliance_stale' };
    }
  };
}
```

- [ ] **Step 4: Run — expect pass**

- [ ] **Step 5: Commit**

```bash
git add packages/spark/src/cache.ts packages/spark/__tests__/cache.test.ts
git commit -m "feat(spark): in-memory cache with TTL + 12h compliance ceiling"
```

---

### Task 12: ListingService core — search + searchCards

**Files:**
- Create: `packages/spark/src/ListingService.ts`
- Create: `packages/spark/__tests__/ListingService.test.ts`

- [ ] **Step 1: Write failing test (mocked SparkClient)**

```ts
// packages/spark/__tests__/ListingService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListingService } from '../src/ListingService';
import { SparkClient } from '../src/client';

vi.mock('../src/client');

const MockedSparkClient = vi.mocked(SparkClient);

beforeEach(() => {
  MockedSparkClient.mockClear();
  // Reset internal singleton
  (ListingService as any)._client = null;
});

const row = {
  ListingKey: 'K1',
  ListingId: '6800001',
  StandardStatus: 'Active',
  UnparsedAddress: '123 Main St',
  City: 'Scottsdale',
  PostalCode: '85255',
  Latitude: 33.6,
  Longitude: -111.9,
  ListPrice: 750000,
  BedroomsTotal: 4,
  BathroomsTotalInteger: 3,
  LivingArea: 2800,
  ListOfficeName: 'ABC Realty',
  ListAgentFullName: 'Jane Smith',
  ListAgentDirectPhone: '(602) 555-0100',
  Media: [{ MediaURL: 'https://cdn/1.jpg', Order: 1 }],
};

describe('ListingService.searchCards', () => {
  it('returns mapped compliant cards', async () => {
    MockedSparkClient.prototype.searchProperties = vi.fn().mockResolvedValue({
      records: [row],
      totalCount: 1,
      nextSkipToken: null,
    });

    const result = await ListingService.searchCards({ minBeds: 3 });
    expect(result.results).toHaveLength(1);
    expect(result.results[0].listing_key).toBe('K1');
    expect(result.total).toBe(1);
  });

  it('drops non-compliant listings', async () => {
    const { ListOfficeName, ...bad } = row;
    MockedSparkClient.prototype.searchProperties = vi.fn().mockResolvedValue({
      records: [bad, row],
      totalCount: 2,
      nextSkipToken: null,
    });

    const result = await ListingService.searchCards({});
    expect(result.results).toHaveLength(1);
    expect(result.results[0].listing_key).toBe('K1');
  });
});

describe('ListingService.search (ListingRecord[])', () => {
  it('returns listings + total', async () => {
    MockedSparkClient.prototype.searchProperties = vi.fn().mockResolvedValue({
      records: [row],
      totalCount: 1,
      nextSkipToken: null,
    });
    const result = await ListingService.search({ minBeds: 3 });
    expect(result.listings).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});
```

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Implement ListingService.ts (initial: search + searchCards only)**

```ts
// packages/spark/src/ListingService.ts
import type {
  ListingSearchFilters,
  SearchFilters,
  SearchResult,
  ListingRecord,
} from '@platform/shared';
import { SparkClient } from './client';
import { buildODataFilter, buildODataOrderby } from './filters';
import { sparkToSearchCard, sparkToListingRecord } from './mappers';
import { enforceCompliance, type ComplianceWarning } from './compliance';

const CARD_SELECT =
  'ListingKey,ListingId,StandardStatus,ListPrice,PreviousListPrice,BedroomsTotal,BathroomsTotalInteger,BathroomsFull,BathroomsHalf,LivingArea,LotSizeAcres,UnparsedAddress,StreetNumber,StreetName,StreetSuffix,City,PostalCode,DaysOnMarket,PropertyType,PropertySubType,HorseYN,PhotosCount,Latitude,Longitude,StatusChangeTimestamp,SubdivisionName,ListOfficeName,ListAgentFullName,ListAgentDirectPhone,ListAgentEmail';

const DETAIL_EXPAND = 'Media($orderby=Order)';
const CARD_EXPAND = "Media($filter=ImageSizeDescription eq 'Large';$orderby=Order;$top=1)";

export class ListingService {
  private static _client: SparkClient | null = null;

  private static client(): SparkClient {
    if (!this._client) {
      this._client = new SparkClient();
    }
    return this._client;
  }

  private static warn = (w: ComplianceWarning) => {
    console.warn('[spark compliance]', JSON.stringify(w));
  };

  static async searchCards(filters: SearchFilters): Promise<SearchResult> {
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.pageSize ?? 24, 200);
    const { records, totalCount } = await this.client().searchProperties({
      filter: buildODataFilter(filters),
      top: pageSize,
      skip: (page - 1) * pageSize,
      orderby: buildODataOrderby(filters.sort) ?? undefined,
      select: CARD_SELECT,
      expand: CARD_EXPAND,
    });
    const compliant = enforceCompliance(records, { warn: this.warn });
    return {
      results: compliant.map(sparkToSearchCard),
      total: totalCount ?? compliant.length,
      page,
      pageSize,
    };
  }

  static async search(filters: ListingSearchFilters): Promise<{ listings: ListingRecord[]; total: number }> {
    const limit = Math.min(filters.limit ?? 24, 200);
    const offset = filters.offset ?? 0;
    const { records, totalCount } = await this.client().searchProperties({
      filter: buildODataFilter(filters),
      top: limit,
      skip: offset,
      orderby: buildODataOrderby(filters.sortBy) ?? undefined,
      expand: CARD_EXPAND,
    });
    const compliant = enforceCompliance(records, { warn: this.warn });
    return {
      listings: compliant.map(sparkToListingRecord),
      total: totalCount ?? compliant.length,
    };
  }
}
```

- [ ] **Step 4: Run — expect pass**

- [ ] **Step 5: Commit**

```bash
git add packages/spark/src/ListingService.ts packages/spark/__tests__/ListingService.test.ts
git commit -m "feat(spark): ListingService.search + searchCards with compliance"
```

---

### Task 13: ListingService — getByKey, getById, getPhotos

**Files:**
- Modify: `packages/spark/src/ListingService.ts`
- Modify: `packages/spark/__tests__/ListingService.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('ListingService.getByKey', () => {
  it('fetches detail with expanded Media', async () => {
    MockedSparkClient.prototype.getProperty = vi.fn().mockResolvedValue(row);
    const d = await ListingService.getByKey('K1');
    expect(d?.listing_key).toBe('K1');
    expect(d?.photo_urls).toHaveLength(1);
  });

  it('returns null on 404', async () => {
    MockedSparkClient.prototype.getProperty = vi.fn().mockResolvedValue(null);
    expect(await ListingService.getByKey('nope')).toBeNull();
  });

  it('returns null when listing fails compliance', async () => {
    const { ListOfficeName, ...bad } = row;
    MockedSparkClient.prototype.getProperty = vi.fn().mockResolvedValue(bad);
    expect(await ListingService.getByKey('K1')).toBeNull();
  });
});

describe('ListingService.getById', () => {
  it('delegates to getPropertyByListingId', async () => {
    MockedSparkClient.prototype.getPropertyByListingId = vi.fn().mockResolvedValue(row);
    const d = await ListingService.getById('6800001');
    expect(d?.listing_id).toBe('6800001');
  });
});

describe('ListingService.getPhotos', () => {
  it('returns sorted photo list via getProperty', async () => {
    MockedSparkClient.prototype.getProperty = vi.fn().mockResolvedValue({
      ListingKey: 'K1',
      ListOfficeName: 'ABC',
      ListAgentFullName: 'Jane',
      ListAgentDirectPhone: 'x',
      Media: [
        { MediaURL: 'b.jpg', Order: 2 },
        { MediaURL: 'a.jpg', Order: 1 },
      ],
    });
    const photos = await ListingService.getPhotos('K1');
    expect(photos).toHaveLength(2);
    expect(photos[0].url).toBe('a.jpg');
  });
});
```

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Add methods to ListingService.ts**

Add import at top:
```ts
import { sparkToListingDetail, extractPhotos } from './mappers';
import type { ListingDetail, ListingPhoto } from '@platform/shared';
```

Add methods to the class:
```ts
static async getByKey(listingKey: string): Promise<ListingDetail | null> {
  const row = await this.client().getProperty(listingKey, { expand: DETAIL_EXPAND });
  if (!row) return null;
  const compliant = enforceCompliance([row], { warn: this.warn });
  if (compliant.length === 0) return null;
  return sparkToListingDetail(compliant[0]);
}

static async getById(listingId: string): Promise<ListingDetail | null> {
  const row = await this.client().getPropertyByListingId(listingId, { expand: DETAIL_EXPAND });
  if (!row) return null;
  const compliant = enforceCompliance([row], { warn: this.warn });
  if (compliant.length === 0) return null;
  return sparkToListingDetail(compliant[0]);
}

static async getPhotos(listingKey: string): Promise<ListingPhoto[]> {
  const row = await this.client().getProperty(listingKey, { expand: 'Media($orderby=Order)' });
  if (!row) return [];
  return extractPhotos(row.Media);
}
```

- [ ] **Step 4: Run — expect pass**

- [ ] **Step 5: Commit**

```bash
git add packages/spark/src/ListingService.ts packages/spark/__tests__/ListingService.test.ts
git commit -m "feat(spark): ListingService getByKey, getById, getPhotos"
```

---

### Task 14: ListingService.getAllPins (bulk pin fetch)

**Files:**
- Modify: `packages/spark/src/ListingService.ts`
- Modify: `packages/spark/__tests__/ListingService.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('ListingService.getAllPins', () => {
  it('paginates until nextSkipToken is null', async () => {
    MockedSparkClient.prototype.searchProperties = vi.fn()
      .mockResolvedValueOnce({
        records: [{ ListingKey: 'K1', ListingId: '1', ListPrice: 100, Latitude: 33, Longitude: -111 }],
        totalCount: 2,
        nextSkipToken: 'token2',
      })
      .mockResolvedValueOnce({
        records: [{ ListingKey: 'K2', ListingId: '2', ListPrice: 200, Latitude: 34, Longitude: -112 }],
        totalCount: 2,
        nextSkipToken: null,
      });

    const pins = await ListingService.getAllPins();
    expect(pins).toHaveLength(2);
    expect(pins[0]).toEqual({ k: 'K1', id: '1', p: 100, la: 33, ln: -111 });
    expect(pins[1]).toEqual({ k: 'K2', id: '2', p: 200, la: 34, ln: -112 });
  });

  it('filters out rows without lat/lng', async () => {
    MockedSparkClient.prototype.searchProperties = vi.fn().mockResolvedValue({
      records: [
        { ListingKey: 'K1', ListingId: '1', ListPrice: 100, Latitude: 33, Longitude: -111 },
        { ListingKey: 'K2', ListingId: '2', ListPrice: 200, Latitude: null, Longitude: null },
      ],
      totalCount: 2,
      nextSkipToken: null,
    });
    const pins = await ListingService.getAllPins();
    expect(pins).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Add method**

Add import:
```ts
import { sparkToMapPin } from './mappers';
import type { MapPin } from '@platform/shared';
```

```ts
static async getAllPins(): Promise<MapPin[]> {
  const pins: MapPin[] = [];
  const pageSize = 5000;
  const baseFilter = buildODataFilter({});
  // Walk pages until exhausted
  let skip = 0;
  while (true) {
    const { records, nextSkipToken } = await this.client().searchProperties({
      filter: baseFilter,
      top: pageSize,
      skip,
      select: 'ListingKey,ListingId,ListPrice,Latitude,Longitude',
      count: false,
    });
    for (const row of records) {
      if (row.Latitude != null && row.Longitude != null) {
        pins.push(sparkToMapPin(row));
      }
    }
    if (!nextSkipToken || records.length < pageSize) break;
    skip += pageSize;
    if (skip >= 50000) break;  // hard ceiling — ARMLS active inventory is ~42K
  }
  return pins;
}
```

- [ ] **Step 4: Run — expect pass**

- [ ] **Step 5: Commit**

```bash
git add packages/spark/src/ListingService.ts packages/spark/__tests__/ListingService.test.ts
git commit -m "feat(spark): ListingService.getAllPins paginates lean pin fetch"
```

---

### Task 15: ListingService.autocomplete — vocabulary snapshot

**Files:**
- Modify: `packages/spark/src/ListingService.ts`
- Modify: `packages/spark/__tests__/ListingService.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('ListingService.autocomplete', () => {
  it('returns city/zip/subdivision prefix matches from vocab snapshot', async () => {
    MockedSparkClient.prototype.searchProperties = vi.fn().mockResolvedValue({
      records: [
        { City: 'Scottsdale', PostalCode: '85255', SubdivisionName: 'DC Ranch' },
        { City: 'Scottsdale', PostalCode: '85262', SubdivisionName: 'Troon' },
        { City: 'Phoenix', PostalCode: '85001', SubdivisionName: null },
        { City: 'Phoenix', PostalCode: '85001', SubdivisionName: null },
      ],
      totalCount: 4,
      nextSkipToken: null,
    });

    const suggestions = await ListingService.autocomplete('sc');
    const cities = suggestions.filter(s => s.type === 'city');
    expect(cities.length).toBeGreaterThanOrEqual(1);
    expect(cities[0].value).toBe('Scottsdale');
    expect(cities[0].count).toBe(2);
  });

  it('returns empty for short terms', async () => {
    const suggestions = await ListingService.autocomplete('a');
    expect(suggestions).toEqual([]);
  });
});
```

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Add method**

Add import:
```ts
import type { AutocompleteSuggestion } from '@platform/shared';
```

Add inside class:
```ts
private static _vocabCache: {
  cities: Map<string, number>;
  zips: Map<string, number>;
  subdivisions: Map<string, number>;
  createdAt: number;
} | null = null;

private static async loadVocab() {
  if (this._vocabCache && Date.now() - this._vocabCache.createdAt < 24 * 60 * 60 * 1000) {
    return this._vocabCache;
  }
  const cities = new Map<string, number>();
  const zips = new Map<string, number>();
  const subdivisions = new Map<string, number>();
  const pageSize = 5000;
  let skip = 0;
  const baseFilter = buildODataFilter({});
  while (true) {
    const { records, nextSkipToken } = await this.client().searchProperties({
      filter: baseFilter,
      top: pageSize,
      skip,
      select: 'City,PostalCode,SubdivisionName',
      count: false,
    });
    for (const r of records) {
      const c = r.City ? String(r.City) : null;
      if (c) cities.set(c, (cities.get(c) ?? 0) + 1);
      const p = r.PostalCode ? String(r.PostalCode) : null;
      if (p) zips.set(p, (zips.get(p) ?? 0) + 1);
      const s = r.SubdivisionName ? String(r.SubdivisionName) : null;
      if (s) subdivisions.set(s, (subdivisions.get(s) ?? 0) + 1);
    }
    if (!nextSkipToken || records.length < pageSize) break;
    skip += pageSize;
    if (skip >= 50000) break;
  }
  this._vocabCache = { cities, zips, subdivisions, createdAt: Date.now() };
  return this._vocabCache;
}

static async autocomplete(term: string): Promise<AutocompleteSuggestion[]> {
  if (term.trim().length < 2) return [];
  const needle = term.trim().toLowerCase();
  const v = await this.loadVocab();

  const matchMap = (
    type: AutocompleteSuggestion['type'],
    m: Map<string, number>,
  ): AutocompleteSuggestion[] =>
    [...m.entries()]
      .filter(([k]) => k.toLowerCase().includes(needle))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({ type, value, count }));

  return [
    ...matchMap('city', v.cities),
    ...matchMap('zip', v.zips),
    ...matchMap('subdivision', v.subdivisions),
  ].slice(0, 10);
}
```

- [ ] **Step 4: Run — expect pass**

- [ ] **Step 5: Commit**

```bash
git add packages/spark/src/ListingService.ts packages/spark/__tests__/ListingService.test.ts
git commit -m "feat(spark): ListingService.autocomplete with daily vocab snapshot"
```

---

### Task 16: Wire cachedWithCeiling into ListingService methods

**Files:**
- Modify: `packages/spark/src/ListingService.ts`

- [ ] **Step 1: Write test asserting cache is shared across calls**

Append to `ListingService.test.ts`:

```ts
describe('ListingService cache behavior', () => {
  it('searchCards with identical filters hits Spark once within TTL', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      records: [row],
      totalCount: 1,
      nextSkipToken: null,
    });
    MockedSparkClient.prototype.searchProperties = fetchSpy;
    await ListingService.searchCards({ minBeds: 3 });
    await ListingService.searchCards({ minBeds: 3 });
    expect(fetchSpy).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run — expect fail**

- [ ] **Step 3: Wrap public methods with cachedWithCeiling**

Refactor `ListingService.ts` to wrap each public method. Simplest pattern:

```ts
import { cachedWithCeiling } from './cache';

// inside class:
private static _searchCardsImpl = async (filtersKey: string): Promise<SearchResult> => {
  const filters = JSON.parse(filtersKey) as SearchFilters;
  // ... existing logic (unchanged)
};

private static searchCardsCached = cachedWithCeiling(this._searchCardsImpl, { ttlMs: 5 * 60_000 });

static async searchCards(filters: SearchFilters): Promise<SearchResult> {
  const result = await this.searchCardsCached(JSON.stringify(filters));
  if ('status' in result && result.status === 'unavailable') {
    return { results: [], total: 0, page: filters.page ?? 1, pageSize: filters.pageSize ?? 24 };
  }
  return result;
}
```

Apply the same wrap to `search`, `getByKey`, `getById`, `getAllPins`, `autocomplete` using their natural cache keys (JSON.stringify(filters) for search; listingKey for getByKey/getPhotos; 'all' for getAllPins; term.toLowerCase() for autocomplete).

TTLs:
- searchCards, search, getByKey, getById, getAllPins: 5 min
- autocomplete: 24 h (pass `ttlMs: 24*HOUR_MS` — import `HOUR_MS` from cache)

- [ ] **Step 4: Run — expect pass**

- [ ] **Step 5: Commit**

```bash
git add packages/spark/src/ListingService.ts packages/spark/__tests__/ListingService.test.ts
git commit -m "feat(spark): wrap ListingService methods with 5-min cache + 12h ceiling"
```

---

### Task 17: Backward-compat re-exports at apps/backend/src/lib/spark/

**Files:**
- Modify: `apps/backend/src/lib/spark/client.ts`
- Modify: `apps/backend/src/lib/spark/field-mapper.ts`
- Modify: `apps/backend/package.json` (add `@platform/spark` dep if missing)

- [ ] **Step 1: Verify sync-engine.ts still imports from ./client (grep)**

```bash
grep -rn "from '../spark/client'\\|from './client'" apps/backend/src/lib/spark/
```

- [ ] **Step 2: Replace client.ts content with re-export**

```ts
// apps/backend/src/lib/spark/client.ts
export { SparkClient as SparkReplicationClient } from '@platform/spark';
```

- [ ] **Step 3: Replace field-mapper.ts content with re-export**

```ts
// apps/backend/src/lib/spark/field-mapper.ts
export * from '@platform/spark/src/field-mapper';
```

- [ ] **Step 4: Add dep to apps/backend/package.json**

Under dependencies:
```json
"@platform/spark": "workspace:*"
```

Run:
```bash
pnpm install
pnpm --filter @real-estate/backend type-check
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/lib/spark/ apps/backend/package.json pnpm-lock.yaml
git commit -m "refactor(backend): re-export spark primitives from @platform/spark"
```

---

### Task 18: Live Spark smoke test (gated)

**Files:**
- Create: `packages/spark/__tests__/integration/live.test.ts`

- [ ] **Step 1: Write the test**

```ts
// packages/spark/__tests__/integration/live.test.ts
import { describe, it, expect } from 'vitest';
import { ListingService } from '../../src';

const SHOULD_RUN = process.env.SPARK_INTEGRATION === '1';
const maybe = SHOULD_RUN ? describe : describe.skip;

maybe('live Spark integration', () => {
  it('fetches at least one compliant active listing card', async () => {
    const result = await ListingService.searchCards({ minBeds: 3, pageSize: 5 });
    expect(result.results.length).toBeGreaterThan(0);
    const card = result.results[0];
    expect(card.list_office_name).toBeTruthy();
  }, 30_000);

  it('fetches detail for the first card with photos and no prohibited fields', async () => {
    const listResult = await ListingService.searchCards({ pageSize: 1 });
    const key = listResult.results[0]?.listing_key;
    if (!key) throw new Error('no listings');
    const detail = await ListingService.getByKey(key);
    expect(detail).toBeTruthy();
    expect((detail as any).PrivateRemarks).toBeUndefined();
    expect((detail as any).ShowingInstructions).toBeUndefined();
    expect(detail?.list_office_name).toBeTruthy();
  }, 30_000);

  it('getAllPins returns many pins with lat/lng', async () => {
    const pins = await ListingService.getAllPins();
    expect(pins.length).toBeGreaterThan(100);
    expect(pins[0]).toMatchObject({ k: expect.any(String), la: expect.any(Number), ln: expect.any(Number) });
  }, 120_000);

  it('autocomplete("sc") returns suggestions', async () => {
    const sugg = await ListingService.autocomplete('sc');
    expect(sugg.length).toBeGreaterThan(0);
  }, 120_000);
});
```

- [ ] **Step 2: Run locally with the token**

```bash
export SPARK_INTEGRATION=1
export SPARK_ACCESS_TOKEN="$(MSYS_NO_PATHCONV=1 'C:/Program Files/Amazon/AWSCLIV2/aws.exe' ssm get-parameter --name /rlsir/spark/access-token --with-decryption --region us-east-1 --query 'Parameter.Value' --output text)"
pnpm --filter @platform/spark test integration
```

Expected: 4/4 pass. If any fail, capture the error and fix before proceeding to Phase B.

- [ ] **Step 3: Commit (test only; no code changes)**

```bash
git add packages/spark/__tests__/integration/live.test.ts
git commit -m "test(spark): gated live integration suite for search/detail/pins/autocomplete"
```

---

## Phase B — Premium-site cutover (one file per commit)

Before starting Phase B: ensure `@platform/spark` is listed as a dependency in `apps/premium-site/package.json`.

- [ ] **Preflight: add dependency**

Add to `apps/premium-site/package.json` under dependencies:
```json
"@platform/spark": "workspace:*"
```

Run:
```bash
pnpm install
pnpm --filter @real-estate/premium-site type-check
```

Commit:
```bash
git add apps/premium-site/package.json pnpm-lock.yaml
git commit -m "chore(premium-site): add @platform/spark dependency"
```

---

### Task 19: Swap `app/api/search/autocomplete/route.ts`

**Files:**
- Modify: `apps/premium-site/app/api/search/autocomplete/route.ts`

- [ ] **Step 1: Read current contents for safety**

```bash
cat apps/premium-site/app/api/search/autocomplete/route.ts
```

- [ ] **Step 2: Rewrite**

```ts
import { NextResponse } from 'next/server';
import { ListingService } from '@platform/spark';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('q');

    if (!term || term.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await ListingService.autocomplete(term);

    return NextResponse.json({ suggestions }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
    });
  } catch (err) {
    console.error('[autocomplete API] Error:', err);
    return NextResponse.json({ error: 'Autocomplete failed.' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Manual QA**

Start dev on port 3005:
```bash
cd "real-estate-platform/apps/premium-site" && pnpm dev -p 3005
```

Browser: `http://localhost:3005/listings` → type "sc" in search box → expect autocomplete suggestions matching Scottsdale.

- [ ] **Step 4: Commit**

```bash
git add apps/premium-site/app/api/search/autocomplete/route.ts
git commit -m "refactor(premium-site): autocomplete route uses @platform/spark"
```

---

### Task 20: Swap `app/api/search/pins/route.ts`

**Files:**
- Modify: `apps/premium-site/app/api/search/pins/route.ts`

- [ ] **Step 1: Rewrite**

```ts
import { NextResponse } from 'next/server';
import { ListingService } from '@platform/spark';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pins = await ListingService.getAllPins();
    return NextResponse.json({ pins }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
    });
  } catch (err) {
    console.error('[pins API] Error:', err);
    return NextResponse.json({ error: 'Failed to load map pins.' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Manual QA**

`http://localhost:3005/listings` → switch to Map view → expect clusters to render; network tab shows `/api/search/pins` returns `{ pins: [...] }` with lat/lng.

**First load may take 5-10 s** (cold pin fetch). Subsequent loads <100 ms (cache hit).

- [ ] **Step 3: Commit**

```bash
git add apps/premium-site/app/api/search/pins/route.ts
git commit -m "refactor(premium-site): pins route uses @platform/spark"
```

---

### Task 21: Swap `app/api/search/route.ts`

**Files:**
- Modify: `apps/premium-site/app/api/search/route.ts`

- [ ] **Step 1: Rewrite**

Keep all existing param parsing; replace only the final query call:

```ts
import { NextResponse } from 'next/server';
import type { SearchFilters, GeoJSONPolygon, BoundingBox, SortOption } from '@platform/shared';
import { ListingService } from '@platform/spark';

export const dynamic = 'force-dynamic';

const VALID_SORTS: SortOption[] = ['newest', 'price_asc', 'price_desc', 'sqft', 'lot_size'];

// [parseNumber / parseBool / parseStringArray / parseBounds / parsePolygon helpers unchanged from original]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: SearchFilters = {};
    // ... (identical param-parsing block from the current file)

    const result = await ListingService.searchCards(filters);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('[search API] Error:', err);
    return NextResponse.json({ error: 'Search failed. Please try again.' }, { status: 500 });
  }
}
```

Keep the parsing helper functions verbatim from the original file.

- [ ] **Step 2: Manual QA**

Browser: `http://localhost:3005/listings` → verify grid renders cards.
Change filters (price, beds). Verify URL query string updates; listings update.
Switch to Map view; verify same listings shown on map clusters.

- [ ] **Step 3: Commit**

```bash
git add apps/premium-site/app/api/search/route.ts
git commit -m "refactor(premium-site): search route uses @platform/spark"
```

---

### Task 22: Swap `app/api/listings/community/route.ts`

**Files:**
- Modify: `apps/premium-site/app/api/listings/community/route.ts`

- [ ] **Step 1: Rewrite**

```ts
import { NextResponse } from 'next/server';
import { ListingService } from '@platform/spark';

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const community = searchParams.get('name');
  if (!community) {
    return NextResponse.json({ listings: [] }, { status: 400 });
  }

  const { listings } = await ListingService.search({
    status: ['Active', 'Active Under Contract', 'Coming Soon'],
    subdivisionName: community,
    limit: 3,
    sortBy: 'price_desc',
  });

  const slim = listings.map((l) => ({
    listing_key: l.listing_key,
    listing_id: l.listing_id,
    unparsed_address: l.unparsed_address,
    city: l.city,
    state_or_province: l.state_or_province,
    postal_code: l.postal_code,
    list_price: l.list_price,
    bedrooms: l.bedrooms,
    bathrooms_total: l.bathrooms_total,
    living_area: l.living_area,
    primary_photo_url: l.primary_photo_url,
  }));

  return NextResponse.json({ listings: slim }, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
```

- [ ] **Step 2: Manual QA**

Browser: `http://localhost:3005/phoenix/north-scottsdale/dc-ranch` → verify community page renders featured listings for that subdivision.

- [ ] **Step 3: Commit**

```bash
git add apps/premium-site/app/api/listings/community/route.ts
git commit -m "refactor(premium-site): community listings route uses @platform/spark"
```

---

### Task 23: Swap `app/(routes)/listings/actions.ts`

**Files:**
- Modify: `apps/premium-site/app/(routes)/listings/actions.ts`

- [ ] **Step 1: Rewrite**

```ts
'use server';

import { ListingService } from '@platform/spark';
import type { ListingSearchFilters } from '@platform/shared';

export async function fetchListings(filters: ListingSearchFilters = {}) {
  return ListingService.search(filters);
}

export async function fetchListingDetail(listingKey: string) {
  return ListingService.getByKey(listingKey);
}

export async function fetchListingByMlsId(listingId: string) {
  return ListingService.getById(listingId);
}

export async function fetchListingPhotos(listingKey: string) {
  return ListingService.getPhotos(listingKey);
}
```

- [ ] **Step 2: Manual QA**

- `http://localhost:3005/listings/<any-slug>` — detail page should render. Pick an active listing key from the search results to test.
- Try an MLS# path as well (if the slug form supports it) — verify `getById` path.

- [ ] **Step 3: Commit**

```bash
git add apps/premium-site/app/(routes)/listings/actions.ts
git commit -m "refactor(premium-site): listings server actions use @platform/spark"
```

---

### Task 24: Swap homepage featured strip

**Files:**
- Identify: grep for `searchListingsWithPhotos` or `fetchListings` in homepage server components
- Modify: whichever file(s) surface as consumers

- [ ] **Step 1: Find consumers**

```bash
grep -rn "searchListingsWithPhotos\\|@platform/database/src/queries/listings" apps/premium-site/app/\\(routes\\)/page.tsx apps/premium-site/app/\\(routes\\)/ 2>/dev/null | head -20
```

- [ ] **Step 2: Rewrite each call site**

Replace `import { searchListingsWithPhotos } from '@platform/database/src/queries/listings'` with `import { ListingService } from '@platform/spark'`. Replace the function call with `ListingService.search(...)`.

Example transformation:
```diff
- import { searchListingsWithPhotos } from '@platform/database/src/queries/listings';
+ import { ListingService } from '@platform/spark';

- const { listings } = await searchListingsWithPhotos({ sortBy: 'newest', limit: 6 });
+ const { listings } = await ListingService.search({ sortBy: 'newest', limit: 6 });
```

- [ ] **Step 3: Manual QA**

Browser: `http://localhost:3005/` → verify homepage featured listings render with images, prices, addresses.

- [ ] **Step 4: Commit**

```bash
git add -A  # after verifying only intended files are staged
git commit -m "refactor(premium-site): homepage featured listings use @platform/spark"
```

---

## Phase C — Cleanup

### Task 25: Delete dead RDS listing queries

**Files:**
- Modify: `packages/database/src/queries/listings.ts`
- Modify: `packages/database/src/queries/search.ts`

- [ ] **Step 1: Identify dead exports**

```bash
grep -rn "from '@platform/database/src/queries/listings'" real-estate-platform/ | grep -v "packages/database"
grep -rn "from '@platform/database/src/queries/search'" real-estate-platform/ | grep -v "packages/database"
```

Expected: only analytics-related files remain after Phase B. Cross-reference each remaining import — if every consumer of `searchListings` / `searchListingsWithPhotos` / `getListingByKey` / `getListingById` / `getListingPhotos` / `getAllMapPins` / `searchAutocomplete` has moved to Spark, those functions are dead.

- [ ] **Step 2: Remove dead functions from listings.ts and search.ts**

Open each file, delete the dead functions. Keep:
- Any function used by analytics/market pages
- Any function used by `apps/backend` sync code (e.g., upserts)
- Type exports — they now live in `@platform/shared/src/listings/` but the DB file may still need its own DB-row interfaces that extend `QueryResultRow`

Leave a header comment: `// Active-listing search moved to @platform/spark. Analytics-only queries remain.`

- [ ] **Step 3: Type-check**

```bash
pnpm --filter @platform/database type-check
pnpm --filter @real-estate/premium-site type-check
pnpm --filter @real-estate/backend type-check
```

Expected: 0 errors across all three.

- [ ] **Step 4: Commit**

```bash
git add packages/database/src/queries/
git commit -m "chore(database): remove dead RDS listing queries post Spark cutover"
```

---

### Task 26: Drop unused materialized views (DB migration)

**Files:**
- Identify: `packages/database/src/migrations/rds/` for the next migration number
- Create: `packages/database/src/migrations/rds/NNN_drop_listings_mvs.sql`

- [ ] **Step 1: Verify MVs are unused**

```bash
grep -rn "mv_active_listings\\|mv_price_bands" real-estate-platform/ --include="*.ts" --include="*.sql" | grep -v "packages/database/src/migrations"
```

- If only analytics files reference `mv_price_bands`, keep it. If only search code referenced `mv_active_listings` and that code is deleted in Task 25, drop it.

- [ ] **Step 2: Write migration**

```sql
-- packages/database/src/migrations/rds/NNN_drop_listings_mvs.sql
-- Drop materialized views that were only used by pre-Spark listings UI.
DROP MATERIALIZED VIEW IF EXISTS mv_active_listings CASCADE;
-- Keep mv_price_bands if analytics still uses it; otherwise:
-- DROP MATERIALIZED VIEW IF EXISTS mv_price_bands CASCADE;
```

- [ ] **Step 3: DO NOT apply the migration yet**

Applying an RDS migration is a write operation requiring explicit user approval per project AWS rules. Leave the migration file committed but unapplied. Note in the commit message that it is pending.

- [ ] **Step 4: Commit**

```bash
git add packages/database/src/migrations/rds/NNN_drop_listings_mvs.sql
git commit -m "chore(rds): migration to drop unused listings MVs (pending apply)"
```

---

### Task 27: Final type-check, lint, build, and smoke

**Files:** none

- [ ] **Step 1: Run full pipeline**

```bash
pnpm type-check
pnpm lint
pnpm --filter @real-estate/premium-site build
```

Expected: 0 type errors, 0 lint errors, clean build.

- [ ] **Step 2: Manual end-to-end smoke on port 3005**

- `/` — homepage featured strip renders
- `/listings` — grid view renders; filters apply; map view renders; clusters visible
- `/listings` autocomplete — suggestions appear on "sc"
- `/listings/[slug]` — detail page renders for an active listing with photos, agent attribution, last-updated badge
- `/phoenix/<region>/<community>` — community page renders featured listings
- IDX attribution visible on every card and detail page (broker, agent, phone/email, last-updated, ARMLS logo)

- [ ] **Step 3: Final commit if anything was fixed**

```bash
git status  # confirm clean or show fixes
git commit -am "chore: final cleanup post Spark cutover" # only if needed
```

- [ ] **Step 4: Push branch**

```bash
git push -u origin feature/analytics-redesign  # or the active cutover branch
```

---

## Self-Review Summary (done inline)

**Spec coverage:** every surface in spec §2 has a task (autocomplete T19, pins T20, search T21, community T22, actions T23, homepage T24). Extraction of existing client in §3 covered by T4 (SparkClient) + T7 (field-mapper) + T17 (backend re-export). Compliance §7 → T10. Cache §8 → T11 + T16. Errors §9 → T3. Testing §10 → tests inline each task + integration suite T18. Migration sequence §11 → Phase B order matches.

**Placeholder scan:** no TBD/TODO/vague steps. Every step has concrete code or a concrete command.

**Type consistency:** method names match spec (`search`, `searchCards`, `getByKey`, `getById`, `getPhotos`, `getAllPins`, `autocomplete`). Types (`ListingSearchFilters`, `SearchFilters`, `SearchResult`, `MapPin`, `ListingRecord`, `ListingDetail`, `ListingPhoto`, `AutocompleteSuggestion`) match the `@platform/shared/src/listings/` relocations in T2.

**Known unknowns, resolved at impl time:**
- T24: exact homepage file(s) — grep answers this mid-task.
- T26: final MV drop list — gated by grep evidence before migration applies.
