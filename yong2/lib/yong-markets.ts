/**
 * Cities & regions Yong actively represents. Used to filter mv_active_listings
 * down to his service area. Listings outside this set won't appear on /portfolio
 * (or featured strips, sitemap, SSG params) even if they're flagged is_luxury,
 * since they're outside his practice.
 *
 * Source: Yong's bio + agent-config — Russ Lyon Sotheby's, North Scottsdale.
 * Focus: Scottsdale (all subareas), Paradise Valley, Desert Mountain, DC Ranch,
 * Silverleaf, Estancia, Carefree, Cave Creek, Fountain Hills, Arcadia, Biltmore.
 *
 * Slugs verified against mv_active_listings.region_slug on 2026-04-24:
 *   north-scottsdale, central-scottsdale, south-scottsdale,
 *   paradise-valley, arcadia, biltmore, desert-ridge,
 *   fountain-hills, carefree, cave-creek
 *
 * Cities used as fallback when region_slug is NULL but the listing is in
 * a Yong city (e.g. Arcadia/Biltmore homes carry city='Phoenix').
 */

export const YONG_REGION_SLUGS = [
  'north-scottsdale',
  'central-scottsdale',
  'south-scottsdale',
  'paradise-valley',
  'arcadia',
  'biltmore',
  'desert-ridge',
  'fountain-hills',
  'carefree',
  'cave-creek',
] as const;

export const YONG_CITIES = [
  'Scottsdale',
  'Paradise Valley',
  'Phoenix', // covers Arcadia, Biltmore, Desert Ridge listings with city=Phoenix
  'Carefree',
  'Cave Creek',
  'Fountain Hills',
] as const;

export type YongRegionSlug = (typeof YONG_REGION_SLUGS)[number];
export type YongCity = (typeof YONG_CITIES)[number];
