/**
 * Soft-match a listing's ARMLS community/subdivision/city to the
 * curated community profiles in content/communities.ts.
 *
 * ARMLS records use uppercase or mixed-case subdivision names that
 * don't always equal our curated slugs ("Silverleaf at DC Ranch" /
 * "DESERT MOUNTAIN" / "DC RANCH PARCEL 6.14"). The match is
 * intentionally permissive: substring + city fallback.
 */

import { communitiesContent, type CuratedCommunity } from '@/content/communities';

type CommunityMatchInput = {
  community: string | null | undefined;
  subdivisionDisplay?: string | null;
  city?: string | null;
};

const NEEDLES: ReadonlyArray<{
  match: (haystack: string) => boolean;
  slug: string;
}> = [
  { match: (s) => s.includes('silverleaf'), slug: 'silverleaf' },
  { match: (s) => s.includes('desert mountain'), slug: 'desert-mountain' },
  { match: (s) => s.includes('estancia'), slug: 'estancia' },
];

export function matchCuratedCommunity(input: CommunityMatchInput): CuratedCommunity | null {
  const haystack = [input.community, input.subdivisionDisplay]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const { match, slug } of NEEDLES) {
    if (match(haystack)) {
      return communitiesContent[slug] ?? null;
    }
  }

  if (input.city && input.city.toLowerCase() === 'paradise valley') {
    return communitiesContent['paradise-valley'] ?? null;
  }

  return null;
}
