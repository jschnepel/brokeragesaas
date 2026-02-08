// URL helper functions for SEO-friendly slugs

// Create SEO-friendly community URL: /:region/:community
export const createCommunitySlug = (community: {
  region: string;
  id: string
}): string => {
  const region = community.region.toLowerCase().replace(/\s+/g, '-');
  const communitySlug = community.id.toLowerCase().replace(/\s+/g, '-');
  return `/${region}/${communitySlug}`;
};

// Create SEO-friendly listing URL: /listings/:city/:zipcode/:community/:address
export const createListingSlug = (listing: {
  City?: string;
  PostalCode?: string;
  Address?: string;
  SubdivisionName?: string;
}): string => {
  const city = (listing.City || 'arizona').toLowerCase().replace(/\s+/g, '-');
  const zip = listing.PostalCode || '00000';
  const community = listing.SubdivisionName
    ? listing.SubdivisionName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
    : null;
  const address = (listing.Address || 'property')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);

  if (community) {
    return `/listings/${city}/${zip}/${community}/${address}`;
  }
  return `/listings/${city}/${zip}/${address}`;
};
