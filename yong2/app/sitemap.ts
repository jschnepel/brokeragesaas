import type { MetadataRoute } from 'next';
import { getActiveListings } from '@/lib/listings';
import { communitySlugs } from '@/content/communities';
import { MARKET_REPORTS } from '@/content/market-reports';
import { siteUrl } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ['', '/portfolio', '/communities', '/market-reports', '/about', '/contact'];
  const entries: MetadataRoute.Sitemap = staticRoutes.map((p) => ({
    url: siteUrl(p),
    changeFrequency: p === '' ? 'weekly' : 'monthly',
    priority: p === '' ? 1 : 0.7,
  }));

  entries.push(...communitySlugs.map((s) => ({ url: siteUrl(`/communities/${s}`), changeFrequency: 'weekly' as const, priority: 0.6 })));

  entries.push(...MARKET_REPORTS.map((r) => ({
    url: siteUrl(`/market-reports/${r.slug}`),
    lastModified: new Date(r.datePublished),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  })));

  // Cap at 200 luxury actives to keep sitemap fast and bounded.
  const listings = await getActiveListings({ limit: 200, isLuxury: true }).catch(() => []);
  entries.push(...listings.map((l) => ({
    url: siteUrl(`/portfolio/${l.slug}`),
    lastModified: l.modificationTimestamp ? new Date(l.modificationTimestamp) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  })));

  return entries;
}
