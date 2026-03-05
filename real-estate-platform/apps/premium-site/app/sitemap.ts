import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yongchoi.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/phoenix`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // Dynamic pages — regions, zip codes, communities
  // Will be populated from database queries in Phase 4
  // try {
  //   const regions = await getRegions();
  //   for (const region of regions) {
  //     staticPages.push({
  //       url: `${baseUrl}/phoenix/${region.slug}`,
  //       lastModified: new Date(),
  //       changeFrequency: 'weekly',
  //       priority: 0.9,
  //     });
  //   }
  // } catch {
  //   // If DB unavailable at build time, return static pages only
  // }

  return staticPages;
}
