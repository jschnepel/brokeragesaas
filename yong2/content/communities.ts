/**
 * Curated communities — Yong's signature submarkets.
 *
 * Each entry maps a Yong-marketed slug to a real (scopeType, scopeKey) pair
 * on mv_community_scorecard. Verified by direct DB inspection on
 * 2026-04-24:
 *
 *   silverleaf       → ('community', 'silverleaf-at-dc-ranch')
 *   desert-mountain  → ('community', 'desert-mountain')
 *   estancia         → ('community', 'estancia')
 *   paradise-valley  → ('region', 'paradise-valley')   [no community-level row]
 *
 * communitySlug values are also the real `community_slug` keys on
 * mv_active_listings, so getListingsByCommunity(content.communitySlug) works
 * for any entry whose scopeType === 'community'. For 'region' scopes we cannot
 * pull a clean listing list (paradise-valley has no community_slug), so
 * detail pages render KPIs only.
 */

export type CommunityScopeType = 'community' | 'region' | 'metro';

export interface CuratedCommunity {
  slug: string;
  name: string;
  locality: string;
  /** mv_community_scorecard scope_type. */
  scopeType: CommunityScopeType;
  /** mv_community_scorecard scope_key. Equals community_slug on mv_active_listings when scopeType==='community'. */
  scopeKey: string;
  /**
   * For scopeType === 'community' this is the same as scopeKey and is used
   * to query active listings. For scopeType === 'region' this is null.
   */
  communitySlug: string | null;
  heroImageUrl: string | null;
  aerialVideoId?: string;
  narrative: readonly string[];
}

export const communitiesContent: Record<string, CuratedCommunity> = {
  'silverleaf': {
    slug: 'silverleaf',
    name: 'Silverleaf',
    locality: 'North Scottsdale',
    scopeType: 'community',
    scopeKey: 'silverleaf-at-dc-ranch',
    communitySlug: 'silverleaf-at-dc-ranch',
    heroImageUrl: '/hero/silverleaf.svg',
    narrative: [
      "Silverleaf is the gold standard of North Scottsdale — a gated village inside DC Ranch with an architectural committee that has kept the neighborhood coherent while still producing some of the most ambitious custom homes in the Valley.",
      'Buyer profile skews toward second-home owners with a base outside Arizona, though primary residents are a growing share. Pace has stayed measured through every recent cycle.',
    ],
  },
  'desert-mountain': {
    slug: 'desert-mountain',
    name: 'Desert Mountain',
    locality: 'North Scottsdale',
    scopeType: 'community',
    scopeKey: 'desert-mountain',
    communitySlug: 'desert-mountain',
    heroImageUrl: '/hero/desert-mountain.svg',
    aerialVideoId: 'AWZEVnZC3FoDtxr8ifXBgo',
    narrative: [
      'Seven Jack Nicklaus courses, 8,000 acres of Sonoran preserve, and a member roster spanning North America’s top family offices.',
      'Desert Mountain’s resale velocity has historically led comparable clubs — liquidity matters to the buyer this neighborhood attracts.',
    ],
  },
  'estancia': {
    slug: 'estancia',
    name: 'Estancia',
    locality: 'Scottsdale',
    scopeType: 'community',
    scopeKey: 'estancia',
    communitySlug: 'estancia',
    heroImageUrl: '/hero/estancia.svg',
    narrative: [
      'Pinnacle Peak’s most private enclave. Tom Fazio routing, dramatic topography, and an architectural vocabulary rooted in the Sonoran landscape rather than transplanted from elsewhere.',
    ],
  },
  'paradise-valley': {
    slug: 'paradise-valley',
    name: 'Paradise Valley',
    locality: 'Paradise Valley',
    // Paradise Valley has no community-level scorecard row — only region-level.
    // KPIs render via the region rollup. Listings won't filter cleanly so
    // the detail page renders KPIs without a "Now in" listings strip.
    scopeType: 'region',
    scopeKey: 'paradise-valley',
    communitySlug: null,
    heroImageUrl: '/hero/paradise-valley.svg',
    narrative: [
      'The valley floor — minimum-one-acre lots, Camelback and Mummy Mountain views, and a buyer pool that skews local, generational, and discreet.',
    ],
  },
};

export type CommunitySlug = keyof typeof communitiesContent;
export const communitySlugs = Object.keys(communitiesContent) as CommunitySlug[];
