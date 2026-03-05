import type { AgentSiteConfig } from '@platform/shared';

export const YONG_CHOI_CONFIG: AgentSiteConfig = {
  agentId: 'yong-choi',
  name: 'Yong Choi',
  title: 'Global Real Estate Advisor',
  tagline: 'The Art of Desert Living',
  bio: 'With $1.2 billion in career sales and 34 years navigating Arizona\'s most prestigious markets, Yong Choi has built a practice on one principle: your goals define the strategy. From discrete off-market acquisitions to record-setting sales, every transaction is handled with the precision and confidentiality you expect.',
  photoUrl:
    'https://media.placester.com/image/upload/c_fill,dpr_1.0,f_auto,fl_lossy,h_768,q_auto,w_768/c_scale,w_768/v1/inception-app-prod/NjY3YTZkOTktMzhiOS00OWVhLWJjMDQtNWZlMWRmODUyYTU3/content/2024/06/8bbcec7735e907c73a61342dd761093e5aed2002.jpg',
  logoUrl: null,
  brokerage: "Russ Lyon Sotheby's International Realty",
  contact: {
    phone: '(480) 555-1234',
    email: 'yong.choi@russlyon.com',
    office: "Russ Lyon Sotheby's International Realty",
    location: 'North Scottsdale, AZ',
  },
  social: {
    instagram: 'https://instagram.com/yongchoi',
    linkedin: 'https://linkedin.com/in/yongchoi',
  },
  brandColors: {
    primary: '#0C1C2E',
    accent: '#Bfa67a',
    surface: '#F9F8F6',
    surfaceAlt: '#F2F2ED',
    highlight: '#D4654B',
    primaryMid: '#2A4A6A',
  },
  nav: [
    {
      label: 'Discover',
      href: '/phoenix',
      children: [
        { label: 'All Communities', href: '/phoenix' },
      ],
    },
    {
      label: 'Collection',
      href: '/listings/10293-n-chiricahua-dr',
      children: [
        { label: 'Featured Estates', href: '/listings/10293-n-chiricahua-dr' },
        { label: 'By Community', href: '/phoenix' },
      ],
    },
    {
      label: 'The Advisor',
      href: '/about',
      children: [
        { label: 'About Yong', href: '/about' },
        { label: 'Blog & Insights', href: '/blog' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  ],
  stats: [
    { value: '$1.2B+', label: 'Career Sales' },
    { value: '#1', label: 'Team in N. Scottsdale' },
    { value: '98%', label: 'List-to-Sale Ratio' },
    { value: '34+', label: 'Years Experience' },
  ],
  seo: {
    defaultTitle: "Yong Choi | Russ Lyon Sotheby's International Realty",
    titleTemplate: '%s | Yong Choi',
    description:
      'Luxury real estate in Scottsdale, Paradise Valley, and Greater Phoenix. $1.2B in career sales.',
    ogImage: null,
  },
  regions: [
    { name: 'North Scottsdale', href: '/phoenix' },
    { name: 'Paradise Valley', href: '/phoenix' },
    { name: 'Carefree & Cave Creek', href: '/phoenix' },
    { name: 'Central Scottsdale', href: '/phoenix' },
    { name: 'Arcadia', href: '/phoenix' },
    { name: 'Fountain Hills', href: '/phoenix' },
    { name: 'Biltmore', href: '/phoenix' },
    { name: 'Rio Verde', href: '/phoenix' },
  ],
};
