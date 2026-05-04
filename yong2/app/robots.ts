import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: siteUrl('/sitemap.xml'),
    host: process.env.NEXT_PUBLIC_SITE_URL,
  };
}
