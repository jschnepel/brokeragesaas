/**
 * Schema.org JSON-LD builders for SEO. These produce plain JS objects
 * that pages stringify into a `<script type="application/ld+json">`
 * tag. Validated against Google's Rich Results spec for RealEstateAgent
 * and SingleFamilyResidence.
 */

import type { Listing, CommunityKpis } from './types';
import { siteContent } from '@/content/site';
import { yongBio } from '@/content/yong';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3200';

/** Strip null/undefined keys so Google's validator doesn't see empty fields. */
function clean<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as Record<string, unknown>;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === null || v === undefined) continue;
    out[k] = v;
  }
  return out as T;
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: "Yong Choi · Sotheby's International Realty",
    url: SITE_URL,
  };
}

export function realEstateAgentSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: yongBio.name,
    image: `${SITE_URL}${yongBio.photoUrl}`,
    telephone: siteContent.contact.mobile,
    email: siteContent.contact.email,
    url: SITE_URL,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Scottsdale',
      addressRegion: 'AZ',
      addressCountry: 'US',
    },
    affiliation: {
      '@type': 'RealEstateOrganization',
      name: yongBio.brokerage,
    },
    areaServed: ['Scottsdale', 'Paradise Valley', 'Desert Mountain', 'Carefree', 'Cave Creek'],
  };
}

export function realEstateListingSchema(listing: Listing) {
  const description =
    listing.publicRemarks?.slice(0, 500) ??
    `${listing.bedrooms ?? '?'} bed / ${listing.bathroomsTotal ?? '?'} bath in ${listing.community || listing.city || 'Scottsdale'}`;

  const geo =
    listing.latitude !== null && listing.longitude !== null
      ? {
          '@type': 'GeoCoordinates',
          latitude: listing.latitude,
          longitude: listing.longitude,
        }
      : null;

  const floorSize =
    listing.livingArea !== null
      ? {
          '@type': 'QuantitativeValue',
          value: listing.livingArea,
          unitCode: 'FTK',
        }
      : null;

  const offers =
    listing.listPrice !== null
      ? {
          '@type': 'Offer',
          price: listing.listPrice,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        }
      : null;

  return clean({
    '@context': 'https://schema.org',
    '@type': 'SingleFamilyResidence',
    name: listing.unparsedAddress,
    description,
    url: `${SITE_URL}/portfolio/${listing.slug}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.unparsedAddress,
      addressLocality: listing.city,
      addressRegion: 'AZ',
      postalCode: listing.postalCode,
      addressCountry: 'US',
    },
    geo,
    // Include up to 6 gallery photos for rich-result image carousels.
    // Strip any non-image URLs (occasional virtual-tour links live in
    // photos[]) and fall back to coverPhotoUrl if nothing remains.
    image: (() => {
      const isImage = (u: string) => {
        try {
          const url = new URL(u);
          if (url.hostname.endsWith('sparkplatform.com')) return true;
          return /\.(jpe?g|png|webp|avif|gif)$/i.test(url.pathname);
        } catch { return false; }
      };
      const filtered = (listing.photos ?? []).filter(isImage).slice(0, 6);
      if (filtered.length > 0) return filtered;
      if (listing.coverPhotoUrl && isImage(listing.coverPhotoUrl)) return [listing.coverPhotoUrl];
      return undefined;
    })(),
    numberOfRooms: listing.bedrooms ?? undefined,
    numberOfBathroomsTotal: listing.bathroomsTotal ?? undefined,
    floorSize,
    yearBuilt: listing.yearBuilt ?? undefined,
    offers,
  });
}

/**
 * BreadcrumbList JSON-LD. Emit on detail pages to give Google a clear
 * crawl trail ("Home > Communities > Silverleaf") without rendering a
 * visible breadcrumb UI — yong2's voice is intentionally breadcrumb-less
 * but Schema.org still earns rich-result eligibility from the markup.
 */
export function breadcrumbListSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

interface CommunitySchemaInput {
  name: string;
  locality: string;
  description?: string;
  kpis?: CommunityKpis | null;
  url?: string;
}

export function communitySchema(input: CommunitySchemaInput) {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: input.name,
    url: input.url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: input.locality,
      addressRegion: 'AZ',
      addressCountry: 'US',
    },
    description: input.description,
  });
}
