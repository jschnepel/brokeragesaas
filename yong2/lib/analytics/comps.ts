/**
 * Active-comparable algorithm for the listing detail "The Read" block.
 *
 * Cascading candidate-pool widener (community → wider community → region → metro)
 * combined with a weighted similarity score. Source: `mv_active_listings`
 * (the same view the rest of yong2 reads from), joined to `listing_geography`
 * for the geographic distance term.
 *
 * Compliance: ACTIVE LISTINGS ONLY. Status set is locked to
 * Active / Active Under Contract / Pending. Closed records are never
 * surfaced through this path. IDX clauses (`is_deleted = FALSE`,
 * `internet_display_yn = TRUE`) preserved across every tier.
 *
 * Single round-trip — the cascade is collapsed inside one CTE-bag so
 * each tier's geographic / sqft / bed predicate is evaluated once and
 * the row's lowest qualifying tier is recorded.
 */

import { query } from '../db';
import { listingSlug } from '../listings';

export type CompTier = 1 | 2 | 3 | 4;

export type ActiveComp = {
  listingKey: string;
  listingId: string;
  slug: string;
  unparsedAddress: string;
  city: string;
  bedrooms: number | null;
  bathroomsTotal: number | null;
  livingArea: number | null;
  listPrice: number | null;
  pricePerSqft: number | null;
  status: 'Active' | 'Active Under Contract' | 'Pending';
  daysOnMarket: number | null;
  primaryPhotoUrl: string | null;
  distanceMiles: number | null;
  similarityScore: number;
  tier: CompTier;
};

export type CompResult = {
  comps: ActiveComp[];
  medianAskingPpsf: number | null;
  totalPoolSize: number;
  tierUsed: number;
  fallbackNote: string | null;
};

const METERS_PER_MILE = 1609.34;

type RawTargetRow = {
  listing_id: string;
  listing_key: string;
  community_slug: string | null;
  community_name: string | null;
  region_slug: string | null;
  region_name: string | null;
  list_price: string | number | null;
  living_area: string | number | null;
  bedrooms: number | null;
  bathrooms_total: string | number | null;
  year_built: number | null;
  property_type: string | null;
  city: string | null;
  lon: string | number | null;
  lat: string | number | null;
};

type RawCompRow = {
  listing_key: string;
  listing_id: string;
  unparsed_address: string | null;
  city: string | null;
  bedrooms: number | null;
  bathrooms_total: string | number | null;
  living_area: string | number | null;
  list_price: string | number | null;
  price_per_sqft: string | number | null;
  standard_status: string;
  days_on_market: number | null;
  primary_photo_url: string | null;
  year_built: number | null;
  distance_meters: string | number | null;
  tier: number;
};

function pNum(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

function luxuryBand(price: number | null): string | null {
  if (price == null) return null;
  if (price < 1_000_000) return '<1M';
  if (price < 3_000_000) return '1-3M';
  if (price < 5_000_000) return '3-5M';
  if (price < 10_000_000) return '5-10M';
  return '10M+';
}

function clampUnit(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function statusScore(status: string): number {
  if (status === 'Active') return 1.0;
  if (status === 'Active Under Contract') return 0.7;
  if (status === 'Pending') return 0.4;
  return 0;
}

function score(
  target: RawTargetRow,
  cand: RawCompRow,
): number {
  const tgtSqft = pNum(target.living_area) ?? 0;
  const tgtBed = target.bedrooms ?? null;
  const tgtBath = pNum(target.bathrooms_total);
  const tgtYear = target.year_built ?? null;
  const tgtPrice = pNum(target.list_price);
  const candSqft = pNum(cand.living_area);
  const candBed = cand.bedrooms;
  const candBath = pNum(cand.bathrooms_total);
  const candYear = cand.year_built;
  const candPrice = pNum(cand.list_price);
  const distMeters = pNum(cand.distance_meters);

  const distMiles = distMeters != null ? distMeters / METERS_PER_MILE : null;

  // Weights — renormalized at the end if any null term is dropped.
  const weights: { name: string; weight: number; value: number; valid: boolean }[] = [];

  // geo_score
  if (distMiles != null) {
    weights.push({ name: 'geo', weight: 0.30, value: clampUnit(1 - distMiles / 3.0), valid: true });
  } else {
    weights.push({ name: 'geo', weight: 0.30, value: 0, valid: false });
  }
  // sqft_score
  if (candSqft != null && tgtSqft > 0) {
    weights.push({ name: 'sqft', weight: 0.25, value: clampUnit(1 - Math.abs(candSqft - tgtSqft) / (tgtSqft * 0.5)), valid: true });
  } else {
    weights.push({ name: 'sqft', weight: 0.25, value: 0, valid: false });
  }
  // price_band_score
  const tgtBand = luxuryBand(tgtPrice);
  const candBand = luxuryBand(candPrice);
  if (tgtBand != null && candBand != null) {
    weights.push({ name: 'band', weight: 0.15, value: tgtBand === candBand ? 1 : 0.6, valid: true });
  } else {
    weights.push({ name: 'band', weight: 0.15, value: 0.6, valid: false });
  }
  // bed_score
  if (candBed != null && tgtBed != null) {
    weights.push({ name: 'bed', weight: 0.10, value: clampUnit(1 - Math.abs(candBed - tgtBed) / 3), valid: true });
  } else {
    weights.push({ name: 'bed', weight: 0.10, value: 0, valid: false });
  }
  // year_built_score — null on either side → 0.5 neutral with kept weight
  if (candYear != null && tgtYear != null) {
    weights.push({ name: 'year', weight: 0.10, value: clampUnit(1 - Math.abs(candYear - tgtYear) / 30), valid: true });
  } else {
    weights.push({ name: 'year', weight: 0.10, value: 0.5, valid: true });
  }
  // bath_score
  if (candBath != null && tgtBath != null) {
    weights.push({ name: 'bath', weight: 0.05, value: clampUnit(1 - Math.abs(candBath - tgtBath) / 3), valid: true });
  } else {
    weights.push({ name: 'bath', weight: 0.05, value: 0, valid: false });
  }
  // status_score
  weights.push({ name: 'status', weight: 0.05, value: statusScore(cand.standard_status), valid: true });

  // Renormalize weights for invalid (dropped) terms.
  const validWeightSum = weights.filter((w) => w.valid).reduce((a, b) => a + b.weight, 0);
  if (validWeightSum === 0) return 0;
  let s = 0;
  for (const w of weights) {
    if (w.valid) s += (w.weight / validWeightSum) * w.value;
  }
  return s;
}

/**
 * Fetch active comparables for a target listing.
 *
 * Strategy:
 *   1. Pull target row (geometry from listing_geography, attributes from mv_active_listings).
 *   2. One round-trip query that emits candidates from any of 4 tiers, tagging
 *      each row with the lowest tier it qualifies under.
 *   3. Compute the similarity score in JS (small N — <=300 rows even on the
 *      widest tier in Yong's market) so the weighting is testable.
 *   4. Return the top `limit` by score, descending.
 */
export async function getActiveComps(
  targetListingId: string,
  limit = 5,
): Promise<CompResult> {
  // Load target.
  const targetSql = `
    SELECT
      ml.listing_id, ml.listing_key,
      ml.community_slug, ml.community_name, ml.region_slug, ml.region_name,
      ml.list_price, ml.living_area, ml.bedrooms, ml.bathrooms_total,
      ml.year_built, ml.property_type, ml.city,
      ST_X(lg.point) AS lon, ST_Y(lg.point) AS lat
    FROM mv_active_listings ml
    LEFT JOIN listing_geography lg ON lg.listing_key = ml.listing_key
    WHERE ml.listing_id = $1
      AND ml.is_deleted = FALSE
      AND ml.internet_display_yn = TRUE
    LIMIT 1
  `;
  const targetRes = await query<RawTargetRow>(targetSql, [targetListingId]);
  const target = targetRes.rows[0];
  if (!target) {
    return { comps: [], medianAskingPpsf: null, totalPoolSize: 0, tierUsed: 1, fallbackNote: null };
  }

  const tgtLivingArea = pNum(target.living_area);
  if (!tgtLivingArea || tgtLivingArea <= 0) {
    return { comps: [], medianAskingPpsf: null, totalPoolSize: 0, tierUsed: 1, fallbackNote: null };
  }
  const tgtBed = target.bedrooms;
  const tgtCity = target.city;
  const tgtCommunity = target.community_slug;
  const tgtRegion = target.region_slug;
  const tgtType = target.property_type;
  const tgtLon = pNum(target.lon);
  const tgtLat = pNum(target.lat);

  // Yong-market allowlist for tier 4. Same set used elsewhere in the codebase.
  const yongCities = [
    'Scottsdale',
    'Paradise Valley',
    'Phoenix',
    'Carefree',
    'Cave Creek',
    'Fountain Hills',
  ];

  // Cascading candidate query — collapsed into a single SQL with four CTEs
  // tagged by tier. Each row gets its MIN(tier).
  //
  // Tier 1: same community, ±20% sqft, ±1 bed
  // Tier 2: same community, ±30% sqft, ±2 beds
  // Tier 3: same region AND ST_DWithin <= 3219 m (~2 mi), ±30% sqft, ±2 beds
  // Tier 4: Yong cities AND ST_DWithin <= 8047 m (~5 mi), ±40% sqft, ±2 beds
  //
  // IDX/active gating shared via a base CTE.
  //
  // Geometry comes from listing_geography.point — joined per row. Tiers 3/4
  // require non-null target geometry; if target has no geometry, they
  // collapse to community/region equality without a distance bound.
  const sqftLow = tgtLivingArea * 0.5;     // ±50% absolute floor
  const sqftHi = tgtLivingArea * 1.5;
  // Different ±range envelopes are computed per tier inside SQL so we can
  // keep the full union under one statement.

  // For the bed predicate, NULL beds on the candidate are accepted only
  // when the target also has NULL beds (avoids matching condos to estates).
  const compSql = `
    WITH base AS (
      SELECT
        ml.listing_key, ml.listing_id, ml.unparsed_address, ml.city,
        ml.bedrooms, ml.bathrooms_total, ml.living_area,
        ml.list_price, ml.price_per_sqft, ml.standard_status,
        ml.days_on_market, ml.primary_photo_url, ml.year_built,
        ml.community_slug, ml.region_slug, ml.property_type,
        lg.point AS geom
      FROM mv_active_listings ml
      LEFT JOIN listing_geography lg ON lg.listing_key = ml.listing_key
      WHERE ml.is_deleted = FALSE
        AND ml.internet_display_yn = TRUE
        AND ml.standard_status IN ('Active', 'Active Under Contract', 'Pending')
        AND ml.living_area > 0
        AND ml.listing_id <> $1
        AND ml.property_type = $2
    ),
    target_geom AS (
      SELECT
        CASE WHEN $9::float8 IS NULL OR $10::float8 IS NULL THEN NULL
             ELSE ST_SetSRID(ST_MakePoint($9::float8, $10::float8), 4326)::geography
        END AS pt
    ),
    tier1 AS (
      SELECT b.*, 1 AS tier
      FROM base b
      WHERE b.community_slug IS NOT NULL
        AND b.community_slug = $3
        AND b.living_area BETWEEN ($4::numeric * 0.8) AND ($4::numeric * 1.2)
        AND (
          ($5::int IS NULL) OR
          (b.bedrooms IS NOT NULL AND b.bedrooms BETWEEN ($5::int - 1) AND ($5::int + 1))
        )
    ),
    tier2 AS (
      SELECT b.*, 2 AS tier
      FROM base b
      WHERE b.community_slug IS NOT NULL
        AND b.community_slug = $3
        AND b.living_area BETWEEN ($4::numeric * 0.7) AND ($4::numeric * 1.3)
        AND (
          ($5::int IS NULL) OR
          (b.bedrooms IS NOT NULL AND b.bedrooms BETWEEN ($5::int - 2) AND ($5::int + 2))
        )
    ),
    tier3 AS (
      SELECT b.*, 3 AS tier
      FROM base b, target_geom tg
      WHERE b.region_slug IS NOT NULL
        AND b.region_slug = $6
        AND b.living_area BETWEEN ($4::numeric * 0.7) AND ($4::numeric * 1.3)
        AND (
          ($5::int IS NULL) OR
          (b.bedrooms IS NOT NULL AND b.bedrooms BETWEEN ($5::int - 2) AND ($5::int + 2))
        )
        AND (
          tg.pt IS NULL OR
          (b.geom IS NOT NULL AND ST_DWithin(b.geom::geography, tg.pt, 3219))
        )
    ),
    tier4 AS (
      SELECT b.*, 4 AS tier
      FROM base b, target_geom tg
      WHERE b.city = ANY($7::text[])
        AND b.living_area BETWEEN ($4::numeric * 0.6) AND ($4::numeric * 1.4)
        AND (
          ($5::int IS NULL) OR
          (b.bedrooms IS NOT NULL AND b.bedrooms BETWEEN ($5::int - 2) AND ($5::int + 2))
        )
        AND (
          tg.pt IS NULL OR
          (b.geom IS NOT NULL AND ST_DWithin(b.geom::geography, tg.pt, 8047))
        )
    ),
    unioned AS (
      SELECT * FROM tier1
      UNION ALL SELECT * FROM tier2
      UNION ALL SELECT * FROM tier3
      UNION ALL SELECT * FROM tier4
    ),
    deduped AS (
      SELECT
        listing_key, listing_id, unparsed_address, city,
        bedrooms, bathrooms_total, living_area, list_price,
        price_per_sqft, standard_status, days_on_market,
        primary_photo_url, year_built, geom,
        MIN(tier) AS tier
      FROM unioned
      GROUP BY listing_key, listing_id, unparsed_address, city,
               bedrooms, bathrooms_total, living_area, list_price,
               price_per_sqft, standard_status, days_on_market,
               primary_photo_url, year_built, geom
    )
    SELECT
      d.listing_key, d.listing_id, d.unparsed_address, d.city,
      d.bedrooms, d.bathrooms_total, d.living_area, d.list_price,
      d.price_per_sqft, d.standard_status, d.days_on_market,
      d.primary_photo_url, d.year_built, d.tier,
      CASE
        WHEN d.geom IS NULL OR (SELECT pt FROM target_geom) IS NULL THEN NULL
        ELSE ST_Distance(d.geom::geography, (SELECT pt FROM target_geom))
      END AS distance_meters
    FROM deduped d
    LIMIT $8
  `;

  const widePoolLimit = 200;
  const compRes = await query<RawCompRow>(compSql, [
    targetListingId,                   // $1
    tgtType ?? 'Residential',          // $2
    tgtCommunity ?? '',                // $3 (empty string never matches when null)
    tgtLivingArea,                     // $4
    tgtBed,                            // $5
    tgtRegion ?? '',                   // $6
    yongCities,                        // $7
    widePoolLimit,                     // $8
    tgtLon,                            // $9
    tgtLat,                            // $10
  ]);

  const totalPoolSize = compRes.rows.length;

  // Score in JS for testability.
  const scored = compRes.rows.map((row) => {
    const distMeters = pNum(row.distance_meters);
    const distMiles = distMeters != null ? distMeters / METERS_PER_MILE : null;
    const tier = (row.tier as CompTier);
    const status = row.standard_status as ActiveComp['status'];
    const comp: ActiveComp = {
      listingKey: row.listing_key,
      listingId: row.listing_id,
      slug: listingSlug(row.unparsed_address, row.listing_id),
      unparsedAddress: row.unparsed_address ?? '',
      city: row.city ?? '',
      bedrooms: row.bedrooms,
      bathroomsTotal: pNum(row.bathrooms_total),
      livingArea: pNum(row.living_area),
      listPrice: pNum(row.list_price),
      pricePerSqft: pNum(row.price_per_sqft),
      status,
      daysOnMarket: row.days_on_market,
      primaryPhotoUrl: row.primary_photo_url,
      distanceMiles: distMiles,
      similarityScore: score(target, row),
      tier,
    };
    return comp;
  });

  // Cascade: include tier 1 first; if pool < 4 step up.
  const tier1 = scored.filter((c) => c.tier === 1);
  const tier2 = scored.filter((c) => c.tier <= 2);
  const tier3 = scored.filter((c) => c.tier <= 3);
  const all = scored;

  let activePool: ActiveComp[];
  if (tier1.length >= 4) activePool = tier1;
  else if (tier2.length >= 4) activePool = tier2;
  else if (tier3.length >= 4) activePool = tier3;
  else activePool = all;

  activePool.sort((a, b) => b.similarityScore - a.similarityScore);
  const comps = activePool.slice(0, limit);

  // Median asking ppsf — over the visible comps.
  const ppsfVals = comps
    .map((c) => c.pricePerSqft)
    .filter((v): v is number => v != null && Number.isFinite(v));
  ppsfVals.sort((a, b) => a - b);
  let medianAskingPpsf: number | null = null;
  if (ppsfVals.length > 0) {
    const mid = Math.floor(ppsfVals.length / 2);
    medianAskingPpsf =
      ppsfVals.length % 2 === 0 ? (ppsfVals[mid - 1] + ppsfVals[mid]) / 2 : ppsfVals[mid];
  }

  // Tier reached / fallback note — what the user reads at the bottom.
  const tiersUsed = new Set(comps.map((c) => c.tier));
  const tierUsed = comps.length === 0 ? 1 : Math.max(...comps.map((c) => c.tier));
  const communityLabel = target.community_name ?? target.community_slug ?? null;
  const regionLabel = target.region_name ?? target.region_slug ?? null;
  let fallbackNote: string | null = null;
  if (comps.length === 0) {
    fallbackNote = null;
  } else if (tiersUsed.size === 1) {
    if (tiersUsed.has(1) || tiersUsed.has(2)) {
      fallbackNote = communityLabel
        ? `${comps.length} of ${comps.length} in ${communityLabel}`
        : `${comps.length} comps from this community`;
    } else if (tiersUsed.has(3)) {
      fallbackNote = regionLabel
        ? `Sourced from ${regionLabel} · within ~2 mi`
        : 'Sourced from region · within ~2 mi';
    } else {
      fallbackNote = 'Sourced from broader market · within ~5 mi';
    }
  } else {
    const inCommunity = comps.filter((c) => c.tier <= 2).length;
    const nearby = comps.length - inCommunity;
    if (communityLabel && inCommunity > 0 && nearby > 0) {
      fallbackNote = `${inCommunity} in ${communityLabel} · ${nearby} nearby`;
    } else {
      fallbackNote = `${comps.length} comps · widened search`;
    }
  }

  return { comps, medianAskingPpsf, totalPoolSize, tierUsed, fallbackNote };
}
