/**
 * Spark API client — minimal OData fetcher for the ARMLS Spark Replication API.
 *
 * Pattern matches infra/lambda/active-snapshot.ts in the platform repo:
 *   GET https://replication.sparkapi.com/Reso/OData/Property?$filter=...
 *   Authorization: Bearer <non-expiring access token>
 *   Response: { value: [...records], "@odata.nextLink"?: string }
 *
 * Pagination: we follow @odata.nextLink verbatim (Spark uses $skip when
 * $orderby is set, so the URL is a complete continuation).
 *
 * Auth: token comes from SPARK_ACCESS_TOKEN env var (same non-expiring
 * token stored in AWS Secrets Manager `rlsir/armls/tokens` for the
 * Lambda; for yong2 SSR it's baked into the Amplify build env at deploy
 * time per amplify.yml).
 */

function getSparkBase(): string {
  return (
    process.env.SPARK_REPLICATION_URL ??
    'https://replication.sparkapi.com/Reso/OData'
  );
}

/**
 * Spark API token — read from process.env at call time. The token is
 * populated in the Amplify branch env on every build by amplify.yml
 * step 3, which fetches the canonical value from AWS Secrets Manager
 * (`rlsir/armls/tokens`) and syncs it to the branch env via
 * `aws amplify update-branch`. Single source of truth = SM; the
 * branch env is a build-time projection of it.
 *
 * Why not read SM at request time? Amplify Hosting Next.js Compute
 * runtime has no AWS SDK credentials available, so any SDK call
 * fails with CredentialsProviderError. Branch env is the only
 * mechanism that actually reaches the SSR Lambda.
 */
function getSparkToken(): string | undefined {
  return process.env.SPARK_ACCESS_TOKEN;
}

export class SparkConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SparkConfigError';
  }
}

export class SparkApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'SparkApiError';
  }
}

export type SparkProperty = Record<string, unknown>;

interface SparkPageResponse {
  value: SparkProperty[];
  '@odata.nextLink'?: string;
  '@odata.count'?: number;
}

/**
 * Fetch one page from Spark with retry on 429/503. Returns the page's
 * records, the next-page URL (null when exhausted), and the total
 * record count if the request asked for it via `$count=true`.
 */
async function fetchPage(pageUrl: string): Promise<{
  records: SparkProperty[];
  nextPageUrl: string | null;
  totalCount: number | null;
}> {
  const token = getSparkToken();
  if (!token) {
    throw new SparkConfigError(
      'SPARK_ACCESS_TOKEN is not set on Amplify branch env. The build ' +
        'phase syncs it from Secrets Manager — check the build log for ' +
        '"[spark-token] branch env synced".',
    );
  }

  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(pageUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (res.ok) break;
    // 429 (rate limit) and 503 (Spark temporarily unavailable) → retry.
    if ((res.status === 429 || res.status === 503) && attempt < 2) {
      const backoffMs = (attempt + 1) * 5_000;
      await new Promise((r) => setTimeout(r, backoffMs));
      continue;
    }
    const text = await res.text();
    throw new SparkApiError(
      `Spark error ${res.status}: ${text.substring(0, 200)}`,
      res.status,
    );
  }

  if (!res || !res.ok) {
    throw new SparkApiError(
      `Spark request failed after retries`,
      res?.status ?? 0,
    );
  }

  const data = (await res.json()) as SparkPageResponse;
  return {
    records: data.value ?? [],
    nextPageUrl: data['@odata.nextLink'] ?? null,
    totalCount: typeof data['@odata.count'] === 'number' ? data['@odata.count'] : null,
  };
}

/**
 * Build the first-page URL for an OData query against /Property.
 * `$orderby` defeats Spark's per-token response cache on identical
 * filter+top requests (otherwise rapid re-fetches return cached payloads
 * for ~15min and yield 429 "request already in progress" errors).
 */
export function buildPropertyUrl(opts: {
  filter: string;
  top?: number;
  orderby?: string;
  select?: string[];
  expand?: string[];
  /** Set true to ask Spark for the total record count via @odata.count.
   *  Returned alongside the records on the first page only. */
  count?: boolean;
}): string {
  const params = new URLSearchParams();
  params.set('$filter', opts.filter);
  params.set('$top', String(opts.top ?? 200));
  params.set('$orderby', opts.orderby ?? 'ModificationTimestamp desc');
  if (opts.select && opts.select.length > 0) {
    params.set('$select', opts.select.join(','));
  }
  if (opts.expand && opts.expand.length > 0) {
    params.set('$expand', opts.expand.join(','));
  }
  if (opts.count) {
    params.set('$count', 'true');
  }
  return `${getSparkBase()}/Property?${params.toString()}`;
}

/**
 * Fetch all pages for a Property query. For yong2 this is a small set
 * (Yong's Active+Pending listings — typically 5-50 properties) so we
 * collect everything in memory. Hard cap at maxPages to defend against
 * runaway pagination.
 */
export async function fetchAllProperties(opts: {
  filter: string;
  top?: number;
  orderby?: string;
  select?: string[];
  expand?: string[];
  maxPages?: number;
  count?: boolean;
}): Promise<SparkProperty[]> {
  const result = await fetchPropertiesWithMeta(opts);
  return result.records;
}

/**
 * Same fetch as fetchAllProperties but also returns Spark's
 * `@odata.count` (when requested via `count: true`). Lets callers
 * report the true total record count without fetching every record —
 * critical for the /listings "Showing N of M" display where the pin
 * universe is capped well below the full pool size.
 */
export async function fetchPropertiesWithMeta(opts: {
  filter: string;
  top?: number;
  orderby?: string;
  select?: string[];
  expand?: string[];
  maxPages?: number;
  count?: boolean;
}): Promise<{ records: SparkProperty[]; totalCount: number | null }> {
  const maxPages = opts.maxPages ?? 5;
  let url: string | null = buildPropertyUrl(opts);
  const all: SparkProperty[] = [];
  let totalCount: number | null = null;
  let page = 0;
  while (url && page < maxPages) {
    const { records, nextPageUrl, totalCount: pageCount } = await fetchPage(url);
    all.push(...records);
    if (page === 0 && pageCount != null) {
      totalCount = pageCount;
    }
    url = nextPageUrl;
    page += 1;
  }
  return { records: all, totalCount };
}
