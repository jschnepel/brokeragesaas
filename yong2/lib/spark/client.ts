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

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

function getSparkBase(): string {
  return (
    process.env.SPARK_REPLICATION_URL ??
    'https://replication.sparkapi.com/Reso/OData'
  );
}

/**
 * Spark API token — single source of truth is AWS Secrets Manager
 * (`rlsir/armls/tokens`), the same secret the rlsir-armls-sync and
 * rlsir-active-snapshot Lambdas read.
 *
 * On Amplify Hosting Next.js Compute, server env vars in
 * .env.production.local don't reach the SSR runtime — only branch-
 * level Amplify env vars do, plus NEXT_PUBLIC_* via webpack inline.
 * Reading from SM at request time:
 *   1. Single source of truth (rotate once in SM, all consumers
 *      pick up the new value on next Lambda init)
 *   2. Cached per-Lambda-instance forever (it's non-expiring)
 *   3. IAM perm `yong2-spark-secret-read` on AmplifySSRServiceRole
 *      grants exactly this read.
 *
 * SPARK_ACCESS_TOKEN env var still wins if present (escape hatch +
 * local dev where Lambda IAM isn't available).
 */
const smClient = new SecretsManagerClient({ region: 'us-east-1' });
let cachedToken: string | null = null;

async function getSparkToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  const fromEnv = process.env.SPARK_ACCESS_TOKEN;
  if (fromEnv && fromEnv.length > 0) {
    cachedToken = fromEnv;
    return cachedToken;
  }
  try {
    const res = await smClient.send(
      new GetSecretValueCommand({ SecretId: 'rlsir/armls/tokens' }),
    );
    if (!res.SecretString) return null;
    const secret = JSON.parse(res.SecretString) as { access_token?: string };
    if (secret.access_token) {
      cachedToken = secret.access_token;
      return cachedToken;
    }
    return null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[spark/client] SM read failed:', err);
    return null;
  }
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
}

/**
 * Fetch one page from Spark with retry on 429/503. Returns the page's
 * records and the next-page URL (null when exhausted).
 */
async function fetchPage(pageUrl: string): Promise<{
  records: SparkProperty[];
  nextPageUrl: string | null;
}> {
  const token = await getSparkToken();
  if (!token) {
    throw new SparkConfigError(
      'Spark token unavailable — Secrets Manager read failed and ' +
        'SPARK_ACCESS_TOKEN env not set. See [spark/client] log above.',
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
}): string {
  const params = new URLSearchParams();
  params.set('$filter', opts.filter);
  params.set('$top', String(opts.top ?? 200));
  params.set('$orderby', opts.orderby ?? 'ModificationTimestamp desc');
  if (opts.select && opts.select.length > 0) {
    params.set('$select', opts.select.join(','));
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
  maxPages?: number;
}): Promise<SparkProperty[]> {
  const maxPages = opts.maxPages ?? 5;
  let url: string | null = buildPropertyUrl(opts);
  const all: SparkProperty[] = [];
  let page = 0;
  while (url && page < maxPages) {
    const { records, nextPageUrl } = await fetchPage(url);
    all.push(...records);
    url = nextPageUrl;
    page += 1;
  }
  return all;
}
