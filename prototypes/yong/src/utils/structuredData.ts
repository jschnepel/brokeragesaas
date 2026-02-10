// JSON-LD structured data generators for SEO

const SITE_URL = 'https://yongchoi.com';

export const agentSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'Yong Choi',
  jobTitle: 'Global Real Estate Advisor',
  worksFor: {
    '@type': 'RealEstateAgent',
    name: "Russ Lyon Sotheby's International Realty",
  },
  areaServed: {
    '@type': 'City',
    name: 'Scottsdale',
    containedInPlace: { '@type': 'State', name: 'Arizona' },
  },
  url: SITE_URL,
});

export const breadcrumbSchema = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: `${SITE_URL}${item.path}`,
  })),
});

export const placeSchema = (name: string, description: string, region?: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Place',
  name,
  description,
  address: {
    '@type': 'PostalAddress',
    addressLocality: region || 'Scottsdale',
    addressRegion: 'AZ',
    addressCountry: 'US',
  },
});

export const articleSchema = (title: string, description: string, datePublished: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  datePublished,
  author: agentSchema(),
});
