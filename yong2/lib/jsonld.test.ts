import { describe, it, expect } from 'vitest';
import {
  websiteSchema,
  realEstateAgentSchema,
  realEstateListingSchema,
  communitySchema,
} from './jsonld';
import type { Listing } from './types';

const baseListing: Listing = {
  listingKey: 'abc',
  listingId: '6712940',
  slug: '10440-e-desert-hills-dr-scottsdale-az-85262-6712940',
  status: 'Active',
  unparsedAddress: '10440 E Desert Hills Dr, Scottsdale, AZ 85262',
  streetNumber: '10440',
  streetName: 'E Desert Hills Dr',
  streetSuffix: 'Dr',
  city: 'Scottsdale',
  postalCode: '85262',
  county: 'Maricopa',
  subdivisionDisplay: 'Desert Mountain',
  communitySlug: 'desert-mountain',
  communityName: 'Desert Mountain',
  regionSlug: 'north-scottsdale',
  regionName: 'North Scottsdale',
  community: 'Desert Mountain',
  listPrice: 8_500_000,
  pricePerSqft: 1100,
  bedrooms: 5,
  bathroomsFull: 5,
  bathroomsHalf: 1,
  bathroomsTotal: 5.5,
  livingArea: 7800,
  lotAcres: 1.2,
  lotSqft: 52272,
  yearBuilt: 2008,
  daysOnMarket: 14,
  latitude: 33.85,
  longitude: -111.85,
  propertyType: 'Residential',
  propertySubType: 'Single Family - Detached',
  hasPool: true,
  hasFireplace: true,
  hasGarage: true,
  isLuxury: true,
  publicRemarks: 'A spectacular Desert Mountain estate. '.repeat(20),
  coverPhotoUrl: 'https://cdn.photos.sparkplatform.com/az/sample-o.jpg',
  photos: ['https://cdn.photos.sparkplatform.com/az/sample-o.jpg'],
  photoUrls: [{ url: 'https://cdn.photos.sparkplatform.com/az/sample-o.jpg', desc: null }],
  listAgentKey: null,
  listAgentName: null,
  modificationTimestamp: null,
};

describe('jsonld builders', () => {
  it('websiteSchema returns a valid WebSite type with url + name', () => {
    const s = websiteSchema();
    expect(s['@context']).toBe('https://schema.org');
    expect(s['@type']).toBe('WebSite');
    expect(s.url).toBeTypeOf('string');
    expect(s.name).toContain('Yong Choi');
  });

  it('realEstateAgentSchema includes contact + brokerage affiliation', () => {
    const s = realEstateAgentSchema();
    expect(s['@type']).toBe('RealEstateAgent');
    expect(s.name).toBe('Yong Choi');
    expect(s.address.addressRegion).toBe('AZ');
    expect(s.affiliation.name).toContain("Sotheby");
    expect(Array.isArray(s.areaServed)).toBe(true);
  });

  it('realEstateListingSchema serializes a listing with geo + offers + image', () => {
    const s = realEstateListingSchema(baseListing) as Record<string, unknown> & {
      geo?: { latitude: number; longitude: number };
      offers?: { price: number; priceCurrency: string };
      image?: string[];
      address: { postalCode: string };
    };
    expect(s['@type']).toBe('SingleFamilyResidence');
    expect(s.name).toBe(baseListing.unparsedAddress);
    expect(s.geo?.latitude).toBe(33.85);
    expect(s.offers?.price).toBe(8_500_000);
    expect(s.offers?.priceCurrency).toBe('USD');
    expect(s.image?.[0]).toContain('sparkplatform');
    expect(s.address.postalCode).toBe('85262');
  });

  it('realEstateListingSchema omits geo + offers + image when fields are null', () => {
    const stripped: Listing = {
      ...baseListing,
      latitude: null,
      longitude: null,
      listPrice: null,
      coverPhotoUrl: null,
      photos: [],
      photoUrls: [],
    };
    const s = realEstateListingSchema(stripped) as Record<string, unknown>;
    expect(s.geo).toBeUndefined();
    expect(s.offers).toBeUndefined();
    expect(s.image).toBeUndefined();
  });

  it('realEstateListingSchema includes up to 6 gallery photos for image carousel', () => {
    const photos = Array.from({ length: 10 }, (_, i) => `https://cdn.photos.sparkplatform.com/az/photo-${i}-o.jpg`);
    const withGallery: Listing = { ...baseListing, photos };
    const s = realEstateListingSchema(withGallery) as Record<string, unknown> & { image?: string[] };
    expect(s.image).toHaveLength(6);
    expect(s.image?.[0]).toContain('photo-0');
    expect(s.image?.[5]).toContain('photo-5');
  });

  it('realEstateListingSchema falls back to coverPhotoUrl when photos[] is empty', () => {
    const noGallery: Listing = { ...baseListing, photos: [] };
    const s = realEstateListingSchema(noGallery) as Record<string, unknown> & { image?: string[] };
    expect(s.image).toEqual([baseListing.coverPhotoUrl]);
  });

  it('communitySchema produces a Place with PostalAddress', () => {
    const s = communitySchema({
      name: 'Silverleaf',
      locality: 'North Scottsdale',
      description: 'A premier guard-gated village.',
      url: 'https://yongchoi.com/communities/silverleaf',
    }) as Record<string, unknown> & {
      address: { addressLocality: string };
      url?: string;
    };
    expect(s['@type']).toBe('Place');
    expect(s.name).toBe('Silverleaf');
    expect(s.address.addressLocality).toBe('North Scottsdale');
    expect(s.url).toContain('silverleaf');
  });
});
