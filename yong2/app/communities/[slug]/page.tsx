import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { CommunityHero } from '@/components/communities/CommunityHero';
import { CommunityKpis } from '@/components/communities/CommunityKpis';
import { CommunityViewTracker } from '@/components/communities/CommunityViewTracker';
import { ListingTile } from '@/components/portfolio/ListingTile';
import { communitiesContent, communitySlugs, type CommunitySlug } from '@/content/communities';
import { getCommunityScorecard } from '@/lib/communities';
import { getListingsByCommunity, getListingsByRegionSlug } from '@/lib/listings';
import { listAvailablePeriods, monthLabel, weekRangeLabel, type Period } from '@/lib/market-reports';
import { communitySchema, breadcrumbListSchema } from '@/lib/jsonld';
import { siteUrl, truncateMetaDescription } from '@/lib/seo';

export const revalidate = 3600;
// Each community page fans out to ~36 RDS queries (4 quarterly reports
// × ~9 queries) plus listings + scorecard + map data. With current
// platform DB load (ARMLS 12h compliance refresh + market-data MV
// refreshes), build-time prerender of all 4 communities exceeds the
// Next.js 60s per-page render budget. Render on demand instead — ISR
// kicks in on first request and the result is cached for the
// `revalidate` window. Trade: first request to each community is
// slower; build is reliable.
export const dynamic = 'force-dynamic';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3200';

type PageProps = { params: Promise<{ slug: string }> };

// generateStaticParams disabled — see `dynamic = 'force-dynamic'` above.
// Re-enable when the data layer rewrite reduces per-render query count.

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!(slug in communitiesContent)) return { title: 'Community' };
  const c = communitiesContent[slug as CommunitySlug];
  return {
    title: c.name,
    description: c.narrative[0] ? truncateMetaDescription(c.narrative[0], 160) : undefined,
    alternates: { canonical: siteUrl(`/communities/${c.slug}`) },
  };
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  if (!(slug in communitiesContent)) notFound();
  const c = communitiesContent[slug as CommunitySlug];

  // Branch on the curated entry's scopeType:
  //  - community → filter mv_active_listings by community_slug
  //  - region    → filter by region_slug (paradise-valley has no community-level row)
  // Region-scoped pages (e.g. paradise-valley) cover a much larger inventory
  // than a single community, so we widen the strip to 24 to keep the grid full
  // after the residential filter narrows the result set.
  const listingsPromise = c.scopeType === 'community' && c.communitySlug
    ? getListingsByCommunity(c.communitySlug).catch(() => [])
    : c.scopeType === 'region'
      ? getListingsByRegionSlug(c.scopeKey, 24).catch(() => [])
      : Promise.resolve([]);

  const [kpis, listings, periodManifest] = await Promise.all([
    getCommunityScorecard(c.scopeKey, c.scopeType).catch(() => null),
    listingsPromise,
    listAvailablePeriods().catch(() => ({ weeks: [], months: [], latest: null as Period | null })),
  ]);
  const latestPeriod = periodManifest.latest;
  const latestReportHref = latestPeriod ? `/market-reports/${latestPeriod.iso}` : null;
  const latestReportLabel = latestPeriod
    ? latestPeriod.kind === 'week'
      ? weekRangeLabel(latestPeriod)
      : `${monthLabel(latestPeriod)} read`
    : null;

  const placeJsonLd = communitySchema({
    name: c.name,
    locality: c.locality,
    description: c.narrative[0],
    url: `${SITE_URL}/communities/${c.slug}`,
  });
  const placeLdJson = JSON.stringify(placeJsonLd);
  const breadcrumbs = breadcrumbListSchema([
    { name: 'Home', url: siteUrl('/') },
    { name: 'Communities', url: siteUrl('/communities') },
    { name: c.name, url: siteUrl(`/communities/${c.slug}`) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify of an internal Schema.org object — XSS not applicable.
        dangerouslySetInnerHTML={{ __html: placeLdJson }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <Navigation />
      {/*
       * No curated entry has scopeType === 'metro' today (only community |
       * region), but the wider CommunityScopeType union covers it for future
       * regional rollups. Narrow before passing to the tracker; if a future
       * entry adds 'metro' the analytics simply categorize it as 'region'
       * (the closest semantic match) without breaking compilation.
       */}
      <CommunityViewTracker
        slug={c.slug}
        scopeType={c.scopeType === 'community' ? 'community' : 'region'}
      />
      <CommunityHero
        name={c.name}
        locality={c.locality}
        imageUrl={c.heroImageUrl ?? null}
        aerialVideoId={c.aerialVideoId}
      />
      <SectionFrame className="py-16">
        <CommunityKpis kpis={kpis} />
        <div className="max-w-3xl">
          {c.narrative.map((p, i) => (
            <p key={i} className="text-stone/85 leading-relaxed mb-4">{p}</p>
          ))}
          {latestReportHref && latestReportLabel && (
            <p className="mt-6">
              <Link
                href={latestReportHref}
                className="caps text-gold hover:text-stone transition-colors inline-flex items-center gap-2"
              >
                Read the latest market read — {latestReportLabel}
                <span aria-hidden="true">→</span>
              </Link>
            </p>
          )}
        </div>
        {listings.length > 0 ? (
          <>
            <h2 className="display-lg italic mt-16 mb-8">Now in {c.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => <ListingTile key={l.listingKey} listing={l} />)}
            </div>
          </>
        ) : null}
        <Link href="/communities" className="caps mt-16 inline-block hover:text-stone">← All Communities</Link>
      </SectionFrame>
      <Footer />
    </>
  );
}
