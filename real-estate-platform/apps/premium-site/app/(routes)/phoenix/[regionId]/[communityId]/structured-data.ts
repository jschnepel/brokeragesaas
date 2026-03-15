/**
 * Community Detail Page — JSON-LD Structured Data
 *
 * Generates Place and BreadcrumbList schemas for SEO.
 * Consumed by the page orchestrator and injected as <script type="application/ld+json">.
 */

import type { CommunityPageData } from './lib/types';

const BASE_URL = 'https://yongchoi.com';

interface JsonLdPlace {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  address: {
    '@type': string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    '@type': string;
    latitude: number;
    longitude: number;
  };
  image?: string;
}

interface JsonLdBreadcrumbItem {
  '@type': string;
  position: number;
  name: string;
  item: string;
}

interface JsonLdBreadcrumbList {
  '@context': string;
  '@type': string;
  itemListElement: JsonLdBreadcrumbItem[];
}

/**
 * Build a Place schema for the community.
 */
export function buildPlaceSchema(data: CommunityPageData): JsonLdPlace {
  const schema: JsonLdPlace = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: data.name,
    description: data.narrative.tagline || `${data.name} — luxury community in ${data.city}, Arizona`,
    url: `${BASE_URL}/phoenix/${data.regionId}/${toSlug(data.name)}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: data.city,
      addressRegion: 'AZ',
      postalCode: data.zipCode,
      addressCountry: 'US',
    },
  };

  if (data.coordinates) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: data.coordinates[1],
      longitude: data.coordinates[0],
    };
  }

  if (data.heroImage) {
    schema.image = data.heroImage;
  }

  return schema;
}

/**
 * Build a BreadcrumbList schema:
 * Home > Phoenix Metro > Region > Community
 */
export function buildBreadcrumbSchema(data: CommunityPageData): JsonLdBreadcrumbList {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Phoenix Metro',
        item: `${BASE_URL}/phoenix`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: data.regionName,
        item: `${BASE_URL}/phoenix/${data.regionId}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: data.name,
        item: `${BASE_URL}/phoenix/${data.regionId}/${toSlug(data.name)}`,
      },
    ],
  };
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/ /g, '-');
}
