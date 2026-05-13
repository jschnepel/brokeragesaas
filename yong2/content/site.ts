/**
 * Phone-number helpers. Build a `tel:` href from any 10/11-digit raw
 * string, and produce a `(XXX) XXX-XXXX` display string. Both return
 * null when the input is null/blank/non-numeric so callers can use a
 * single nullish check to hide a phone row entirely.
 */
export function formatPhoneHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11) return `tel:+${digits}`;
  return null;
}

export function formatPhoneDisplay(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, '');
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d[0] === '1') return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  // Last-resort fallback: hand back whatever the operator typed so the
  // page still renders something rather than a blank dt/dd row.
  return raw;
}

// Read raw env at module load — NEXT_PUBLIC_* values are inlined into
// the client bundle at build time, so this evaluates once per build.
const advisorMobileRaw = process.env.NEXT_PUBLIC_ADVISOR_MOBILE || null;
const officePhoneRaw = process.env.NEXT_PUBLIC_OFFICE_PHONE || null;
const advisorEmail = process.env.NEXT_PUBLIC_ADVISOR_EMAIL || 'yong.choi@russlyon.com';
const officeAddress =
  process.env.NEXT_PUBLIC_OFFICE_ADDRESS || "Russ Lyon Sotheby's International Realty";

const advisorMobileDisplay = formatPhoneDisplay(advisorMobileRaw);
const advisorMobileHref = formatPhoneHref(advisorMobileRaw);
const officePhoneDisplay = formatPhoneDisplay(officePhoneRaw);
const officePhoneHref = formatPhoneHref(officePhoneRaw);

// Fallback ladder for surfaces that show a single phone row (Footer,
// ContactCTA, /contact page): mobile preferred, office as backup,
// null when neither is configured so the row collapses cleanly.
const primaryPhone = advisorMobileDisplay ?? officePhoneDisplay;
const primaryPhoneHref = advisorMobileHref ?? officePhoneHref;
const primaryPhoneLabel: 'Mobile' | 'Office' | null = advisorMobileDisplay
  ? 'Mobile'
  : officePhoneDisplay
    ? 'Office'
    : null;

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
    // Mobile pair — null when NEXT_PUBLIC_ADVISOR_MOBILE is unset.
    mobile: advisorMobileDisplay,
    mobileHref: advisorMobileHref,
    // Office-phone pair — null when NEXT_PUBLIC_OFFICE_PHONE is unset.
    officePhone: officePhoneDisplay,
    officePhoneHref: officePhoneHref,
    // Primary phone — mobile preferred, office as fallback, null if
    // neither is configured. Use these on surfaces that show one row.
    primaryPhone,
    primaryPhoneHref,
    primaryPhoneLabel,
    email: advisorEmail,
    // Brokerage / office display string (name OR address depending on
    // env). Defaults to the brokerage name when no address is set.
    office: officeAddress,
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
