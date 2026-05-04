export const siteContent = {
  brand: {
    name: 'Yong Choi',
    tagline: "Russ Lyon Sotheby's International Realty",
    location: 'Scottsdale · Paradise Valley · Desert Mountain',
    logoUrl: '/images/rlsir-logo.png',
  },
  nav: [
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'Listings', href: '/listings' },
    { label: 'Communities', href: '/communities' },
    { label: 'Market Reports', href: '/market-reports' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  contact: {
    mobile: '(480) 555-1234',
    mobileHref: 'tel:+14805551234',
    email: 'yong.choi@russlyon.com',
    office: "Russ Lyon Sotheby's International Realty",
    officeLocation: 'North Scottsdale, AZ',
    instagram: '@yongchoi',
    instagramHref: 'https://instagram.com/yongchoi',
    linkedinHref: 'https://linkedin.com/in/yongchoi',
  },
  legal: {
    copyright: `© ${new Date().getFullYear()} Yong Choi. All rights reserved.`,
    mlsDisclaimer:
      'Based on information from ARMLS. All data deemed reliable but not guaranteed and should be independently verified.',
    fairHousing: 'Equal Housing Opportunity. Each office is independently owned and operated.',
  },
} as const;

export type SiteContent = typeof siteContent;
