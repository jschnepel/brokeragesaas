/**
 * Spark Platform RESO Replication Client
 * Handles OAuth2 auth and cursor-based pagination against
 * replication.sparkapi.com/Reso/OData/
 */

interface SparkTokens {
  accessToken: string;
  refreshToken: string;
}

interface SparkConfig {
  oauthKey: string;
  oauthSecret: string;
  accessToken: string;
  refreshToken: string;
  baseUrl: string;
}

interface ODataResponse {
  '@odata.nextLink'?: string;
  value: Record<string, unknown>[];
}

type EntityName = 'Property' | 'Member' | 'Office' | 'OpenHouse';

export class SparkReplicationClient {
  private config: SparkConfig;
  private tokens: SparkTokens;
  private requestCount = 0;

  constructor(config?: Partial<SparkConfig>) {
    this.config = {
      oauthKey: config?.oauthKey ?? process.env.SPARK_OAUTH_KEY ?? '',
      oauthSecret: config?.oauthSecret ?? process.env.SPARK_OAUTH_SECRET ?? '',
      accessToken: config?.accessToken ?? process.env.SPARK_ACCESS_TOKEN ?? '',
      refreshToken: config?.refreshToken ?? process.env.SPARK_REFRESH_TOKEN ?? '',
      baseUrl: config?.baseUrl ?? process.env.SPARK_REPLICATION_URL ?? 'https://replication.sparkapi.com/Reso/OData',
    };

    this.tokens = {
      accessToken: this.config.accessToken,
      refreshToken: this.config.refreshToken,
    };

    if (!this.tokens.accessToken) {
      throw new Error('Spark access token is required');
    }
  }

  /**
   * Fetch one page from the replication feed.
   * Returns records + the next skiptoken (null if done).
   */
  async fetchPage(
    entity: EntityName,
    skipToken?: string | null
  ): Promise<{ records: Record<string, unknown>[]; nextSkipToken: string | null }> {
    const url = skipToken
      ? `${this.config.baseUrl}/${entity}?$skiptoken=${skipToken}`
      : `${this.config.baseUrl}/${entity}`;

    const res = await this.authenticatedFetch(url);

    if (!res.ok) {
      if (res.status === 401) {
        await this.refreshAccessToken();
        return this.fetchPage(entity, skipToken);
      }
      const text = await res.text();
      throw new Error(`Spark API error ${res.status}: ${text.substring(0, 200)}`);
    }

    const data: ODataResponse = await res.json();
    this.requestCount++;

    const nextSkipToken = data['@odata.nextLink']
      ? this.extractSkipToken(data['@odata.nextLink'])
      : null;

    return {
      records: data.value ?? [],
      nextSkipToken,
    };
  }

  /**
   * Generator that yields pages from the replication feed.
   * Starts from a skiptoken (for resume) or the beginning.
   */
  async *paginateEntity(
    entity: EntityName,
    startSkipToken?: string | null
  ): AsyncGenerator<{
    records: Record<string, unknown>[];
    skipToken: string | null;
    pageNumber: number;
  }> {
    let skipToken = startSkipToken ?? null;
    let pageNumber = 0;

    // First page: no skiptoken if starting fresh
    const isResume = !!startSkipToken;

    while (true) {
      const { records, nextSkipToken } = await this.fetchPage(
        entity,
        pageNumber === 0 && !isResume ? undefined : skipToken
      );

      pageNumber++;

      yield {
        records,
        skipToken: nextSkipToken,
        pageNumber,
      };

      if (!nextSkipToken || records.length === 0) {
        break;
      }

      skipToken = nextSkipToken;
    }
  }

  /**
   * Refresh the OAuth2 access token using the refresh token.
   */
  async refreshAccessToken(): Promise<void> {
    const url = 'https://sparkplatform.com/oauth2/grant';

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.tokens.refreshToken,
      client_id: this.config.oauthKey,
      client_secret: this.config.oauthSecret,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Token refresh failed (${res.status}): ${text.substring(0, 200)}`);
    }

    const data = await res.json();
    this.tokens.accessToken = data.access_token;
    if (data.refresh_token) {
      this.tokens.refreshToken = data.refresh_token;
    }
  }

  /** Get current request count (for monitoring) */
  getRequestCount(): number {
    return this.requestCount;
  }

  /** Get current tokens (for persisting after refresh) */
  getTokens(): SparkTokens {
    return { ...this.tokens };
  }

  private async authenticatedFetch(url: string): Promise<Response> {
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${this.tokens.accessToken}`,
        Accept: 'application/json',
      },
    });
  }

  private extractSkipToken(nextLink: string): string | null {
    try {
      const url = new URL(nextLink);
      return url.searchParams.get('$skiptoken');
    } catch {
      // Sometimes the nextLink is just the skiptoken value
      const match = nextLink.match(/\$skiptoken=([^&]+)/);
      return match ? match[1] : null;
    }
  }
}
