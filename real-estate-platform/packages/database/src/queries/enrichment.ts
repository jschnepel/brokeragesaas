import type { QueryResultRow } from 'pg';
import { rdsQuery, rdsQueryOne } from '../rds-client';

interface EnrichmentRow extends QueryResultRow {
  listing_key: string;
  commute_data: unknown;
  lifestyle_data: unknown;
  nearby_data: unknown;
  grocery_data: unknown;
  created_at: string;
  updated_at: string;
}

const CACHE_TTL_DAYS = 30;

export async function getListingEnrichment(
  listingKey: string,
): Promise<EnrichmentRow | null> {
  return rdsQueryOne<EnrichmentRow>(
    `SELECT listing_key, commute_data, lifestyle_data, nearby_data, grocery_data, created_at, updated_at
     FROM listing_enrichment
     WHERE listing_key = $1
       AND updated_at > now() - INTERVAL '${CACHE_TTL_DAYS} days'`,
    [listingKey],
  );
}

export async function upsertListingEnrichment(
  listingKey: string,
  data: {
    commuteData?: unknown;
    lifestyleData?: unknown;
    nearbyData?: unknown;
    groceryData?: unknown;
  },
): Promise<void> {
  await rdsQuery(
    `INSERT INTO listing_enrichment (listing_key, commute_data, lifestyle_data, nearby_data, grocery_data, updated_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (listing_key) DO UPDATE SET
       commute_data   = COALESCE($2, listing_enrichment.commute_data),
       lifestyle_data = COALESCE($3, listing_enrichment.lifestyle_data),
       nearby_data    = COALESCE($4, listing_enrichment.nearby_data),
       grocery_data   = COALESCE($5, listing_enrichment.grocery_data),
       updated_at     = now()`,
    [listingKey, JSON.stringify(data.commuteData), JSON.stringify(data.lifestyleData), JSON.stringify(data.nearbyData), JSON.stringify(data.groceryData)],
  );
}
