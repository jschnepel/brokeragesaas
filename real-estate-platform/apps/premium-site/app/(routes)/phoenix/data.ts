// Communities page data — sourced from prototype communities-enriched.json
// TODO: Replace with database queries when community tables are seeded

export interface CommunityStat {
  label: string;
  value: string;
}

export interface CommunityItem {
  id: string;
  name: string;
  price: string;
  zipCode: string;
  tags: string[];
}

export interface RegionData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  stats: CommunityStat[];
  highlights: string[];
  communities: CommunityItem[];
}

export const REGIONS_DATA: RegionData[] = [
  {
    id: 'north-scottsdale',
    name: 'North Scottsdale',
    tagline: 'Where Desert Elegance Meets Championship Golf',
    description:
      'The pinnacle of Arizona luxury living with championship golf and guard-gated enclaves set against the McDowell Mountains.',
    heroImage:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Communities', value: '35' },
      { label: 'Guard-Gated', value: '12' },
      { label: 'Golf', value: '10' },
      { label: 'Price Range', value: '$450K–$30M+' },
    ],
    highlights: ['Guard-Gated', 'Golf', 'Mountain Views', 'Ultra-Luxury'],
    communities: [
      { id: 'silverleaf-at-dc-ranch', name: 'Silverleaf at DC Ranch', price: '$2M – $30M+', zipCode: '85255', tags: ['Guard-Gated', 'Golf'] },
      { id: 'desert-mountain', name: 'Desert Mountain', price: '$450K – $12M+', zipCode: '85262', tags: ['Guard-Gated', 'Golf'] },
      { id: 'whisper-rock', name: 'Whisper Rock', price: '$2M – $10M+', zipCode: '85255', tags: ['Guard-Gated', 'Golf'] },
      { id: 'estancia', name: 'Estancia', price: '$2M – $15M+', zipCode: '85262', tags: ['Guard-Gated', 'Golf'] },
      { id: 'dc-ranch', name: 'DC Ranch', price: '$600K – $8M+', zipCode: '85255', tags: ['Guard-Gated'] },
      { id: 'troon', name: 'Troon', price: '$800K – $8M+', zipCode: '85262', tags: ['Golf', 'Mountain Views'] },
      { id: 'grayhawk', name: 'Grayhawk', price: '$400K – $3M+', zipCode: '85255', tags: ['Golf', 'Master-Planned'] },
      { id: 'legend-trail', name: 'Legend Trail', price: '$500K – $2M+', zipCode: '85262', tags: ['Golf'] },
      { id: 'terravita', name: 'Terravita', price: '$500K – $2M+', zipCode: '85262', tags: ['Guard-Gated', 'Golf'] },
      { id: 'pinnacle-peak-country-club', name: 'Pinnacle Peak CC', price: '$600K – $4M+', zipCode: '85255', tags: ['Guard-Gated', 'Golf'] },
    ],
  },
  {
    id: 'paradise-valley',
    name: 'Paradise Valley',
    tagline: "Arizona's Most Prestigious Address",
    description:
      "Arizona's wealthiest municipality with sprawling estates on minimum one-acre lots nestled between Camelback and Mummy Mountains.",
    heroImage:
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Communities', value: '16' },
      { label: 'Guard-Gated', value: '6' },
      { label: 'Min Lot Size', value: '1 Acre' },
      { label: 'Price Range', value: '$1.5M–$30M+' },
    ],
    highlights: ['Guard-Gated', 'Resort-Branded', 'Mountain Views', 'Estates'],
    communities: [
      { id: 'paradise-reserve', name: 'Paradise Reserve', price: '$3M – $10M+', zipCode: '85253', tags: ['Guard-Gated'] },
      { id: 'crown-canyon', name: 'Crown Canyon', price: '$16M – $30M+', zipCode: '85253', tags: ['Guard-Gated', 'Ultra-Luxury'] },
      { id: 'clearwater-hills', name: 'Clearwater Hills', price: '$3M – $15M+', zipCode: '85253', tags: ['Guard-Gated'] },
      { id: 'mountain-shadows', name: 'Mountain Shadows', price: '$1.5M – $5M+', zipCode: '85253', tags: ['Resort-Branded'] },
      { id: 'camelback-country-club', name: 'Camelback Country Club', price: '$1.5M – $5M+', zipCode: '85253', tags: ['Golf'] },
      { id: 'smoke-tree-resort', name: 'Smoke Tree Resort', price: '$2M – $8M+', zipCode: '85253', tags: ['Resort-Branded'] },
    ],
  },
  {
    id: 'central-scottsdale',
    name: 'Central Scottsdale',
    tagline: 'Urban Luxury, Desert Lifestyle',
    description:
      'Urban convenience meets desert beauty with walkable access to dining, galleries, and culture.',
    heroImage:
      'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Communities', value: '15' },
      { label: 'Guard-Gated', value: '4' },
      { label: 'Golf', value: '5' },
      { label: 'Price Range', value: '$400K–$5M+' },
    ],
    highlights: ['Golf', 'Walkable', 'Guard-Gated', 'Urban Living'],
    communities: [
      { id: 'gainey-ranch', name: 'Gainey Ranch', price: '$500K – $5M+', zipCode: '85258', tags: ['Guard-Gated', 'Golf'] },
      { id: 'ancala', name: 'Ancala', price: '$800K – $5M+', zipCode: '85259', tags: ['Guard-Gated', 'Golf'] },
      { id: 'mccormick-ranch', name: 'McCormick Ranch', price: '$400K – $3M+', zipCode: '85258', tags: ['Golf', 'Waterfront'] },
      { id: 'scottsdale-ranch', name: 'Scottsdale Ranch', price: '$500K – $2M+', zipCode: '85258', tags: ['Master-Planned'] },
      { id: 'casa-del-monte', name: 'Casa del Monte', price: '$1.5M – $5M+', zipCode: '85260', tags: ['Guard-Gated'] },
    ],
  },
  {
    id: 'south-scottsdale',
    name: 'South Scottsdale',
    tagline: 'Vibrant Living, Endless Possibilities',
    description:
      'Vibrant mix of mid-century charm, modern development, and urban energy near Old Town.',
    heroImage:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Communities', value: '15' },
      { label: 'Condo/High-Rise', value: '5' },
      { label: 'Resort', value: '3' },
      { label: 'Price Range', value: '$300K–$8M+' },
    ],
    highlights: ['Resort-Branded', 'Condo & High-Rise', 'Walkable', 'Old Town'],
    communities: [
      { id: 'ascent-at-the-phoenician', name: 'Ascent at The Phoenician', price: '$1.5M – $8M+', zipCode: '85251', tags: ['Resort-Branded'] },
      { id: 'scottsdale-waterfront', name: 'Scottsdale Waterfront Residences', price: '$600K – $3M+', zipCode: '85251', tags: ['Condo & High-Rise'] },
      { id: 'scottsdale-country-club', name: 'Scottsdale Country Club', price: '$500K – $3M+', zipCode: '85257', tags: ['Golf'] },
      { id: 'optima-sonoran', name: 'Optima Sonoran Village', price: '$400K – $2M+', zipCode: '85251', tags: ['Condo & High-Rise'] },
    ],
  },
  {
    id: 'arcadia',
    name: 'Arcadia',
    tagline: 'Classic Phoenix Charm, Modern Luxury',
    description:
      'One of Phoenix\'s most coveted neighborhoods with tree-lined streets, citrus groves, and Camelback Mountain views.',
    heroImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Neighborhoods', value: '8' },
      { label: 'Avg Lot', value: '10K+ SF' },
      { label: 'Walk Score', value: '65+' },
      { label: 'Price Range', value: '$800K–$8M+' },
    ],
    highlights: ['Mountain Views', 'Tree-Lined', 'Historic', 'Modern Builds'],
    communities: [
      { id: 'arcadia-proper', name: 'Arcadia Proper', price: '$1M – $5M+', zipCode: '85018', tags: ['Historic', 'Mountain Views'] },
      { id: 'arcadia-lite', name: 'Arcadia Lite', price: '$800K – $2M+', zipCode: '85018', tags: ['Walkable'] },
      { id: 'north-arcadia', name: 'North Arcadia', price: '$1.5M – $8M+', zipCode: '85018', tags: ['Ultra-Luxury', 'Mountain Views'] },
    ],
  },
  {
    id: 'biltmore',
    name: 'Biltmore',
    tagline: 'Iconic Phoenix Luxury Corridor',
    description:
      'Iconic Phoenix corridor of luxury living, resort access, and Camelback Mountain proximity.',
    heroImage:
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Communities', value: '6' },
      { label: 'Condo/High-Rise', value: '3' },
      { label: 'Golf', value: '2' },
      { label: 'Price Range', value: '$400K–$3.5M+' },
    ],
    highlights: ['Condo & High-Rise', 'Golf', 'Resort', 'Urban Luxury'],
    communities: [
      { id: 'optima-biltmore-towers', name: 'Optima Biltmore Towers', price: '$400K – $3M+', zipCode: '85016', tags: ['Condo & High-Rise'] },
      { id: 'esplanade-place', name: 'Esplanade Place', price: '$900K – $3.5M+', zipCode: '85016', tags: ['Condo & High-Rise'] },
      { id: 'royal-palm', name: 'Royal Palm / Moon Valley', price: '$500K – $3M+', zipCode: '85020', tags: ['Golf'] },
      { id: 'biltmore-estates', name: 'Biltmore Estates', price: '$1M – $3M+', zipCode: '85016', tags: ['Guard-Gated'] },
    ],
  },
  {
    id: 'carefree',
    name: 'Carefree',
    tagline: 'Boutique Desert Living Under Dark Skies',
    description:
      'Boutique desert town with dark-sky ordinances and dramatic boulder landscapes.',
    heroImage:
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Communities', value: '6' },
      { label: 'Guard-Gated', value: '2' },
      { label: 'Min Lot', value: '1+ Acre' },
      { label: 'Price Range', value: '$600K–$6M+' },
    ],
    highlights: ['Dark-Sky', 'Boulders', 'Guard-Gated', 'Desert Views'],
    communities: [
      { id: 'the-boulders', name: 'The Boulders', price: '$600K – $5M+', zipCode: '85377', tags: ['Guard-Gated', 'Golf'] },
      { id: 'carefree-plat', name: 'Carefree Plat / Downtown Estates', price: '$800K – $5M+', zipCode: '85377', tags: ['Desert Views'] },
      { id: 'cow-track-estates', name: 'Cow Track Estates', price: '$1.5M – $6M+', zipCode: '85377', tags: ['Guard-Gated'] },
    ],
  },
  {
    id: 'cave-creek',
    name: 'Cave Creek',
    tagline: 'Western Spirit, Desert Soul',
    description:
      'Western heritage with towering saguaros, large lots, and equestrian properties.',
    heroImage:
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Communities', value: '6' },
      { label: 'Equestrian', value: '3' },
      { label: 'Min Lot', value: '1+ Acre' },
      { label: 'Price Range', value: '$800K–$8M+' },
    ],
    highlights: ['Equestrian', 'Western', 'Large Lots', 'Saguaro Desert'],
    communities: [
      { id: 'seven-sisters', name: 'Seven Sisters Estates', price: '$3M – $8M+', zipCode: '85331', tags: ['Guard-Gated', 'Equestrian'] },
      { id: 'montevista', name: 'Montevista', price: '$800K – $2M+', zipCode: '85331', tags: ['Mountain Views'] },
      { id: 'chaparral-lone-mountain', name: 'Chaparral at Lone Mountain', price: '$800K – $2M+', zipCode: '85331', tags: ['Desert Views'] },
    ],
  },
  {
    id: 'fountain-hills',
    name: 'Fountain Hills',
    tagline: 'Small Town Feel, Big Mountain Views',
    description:
      'Master-planned community with the famous fountain, McDowell Mountain views, and small-town charm.',
    heroImage:
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Communities', value: '6' },
      { label: 'Golf', value: '3' },
      { label: 'Mountain Views', value: '100%' },
      { label: 'Price Range', value: '$500K–$5M+' },
    ],
    highlights: ['Golf', 'Mountain Views', 'Small Town', 'Dark-Sky'],
    communities: [
      { id: 'eagle-mountain', name: 'Eagle Mountain', price: '$500K – $3M+', zipCode: '85268', tags: ['Golf', 'Mountain Views'] },
      { id: 'firerock', name: 'FireRock Country Club', price: '$800K – $5M+', zipCode: '85268', tags: ['Guard-Gated', 'Golf'] },
      { id: 'sunridge-canyon', name: 'SunRidge Canyon', price: '$600K – $3M+', zipCode: '85268', tags: ['Golf'] },
    ],
  },
  {
    id: 'rio-verde',
    name: 'Rio Verde',
    tagline: 'Desert Serenity, Unlimited Space',
    description:
      'Secluded desert living with horse properties and championship golf east of Fountain Hills.',
    heroImage:
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Communities', value: '3' },
      { label: 'Golf', value: '2' },
      { label: 'Horse Properties', value: 'Yes' },
      { label: 'Price Range', value: '$350K–$3M+' },
    ],
    highlights: ['Golf', 'Equestrian', 'Secluded', 'Desert Views'],
    communities: [
      { id: 'tonto-verde', name: 'Tonto Verde', price: '$400K – $1.5M', zipCode: '85263', tags: ['Golf'] },
      { id: 'rio-verde-cc', name: 'Rio Verde Country Club', price: '$350K – $1.5M', zipCode: '85263', tags: ['Golf'] },
      { id: 'granite-mountain-ranch', name: 'Granite Mountain Ranch', price: '$800K – $3M+', zipCode: '85263', tags: ['Equestrian'] },
    ],
  },
  {
    id: 'desert-ridge',
    name: 'Desert Ridge',
    tagline: 'Modern Amenities, Mountain Backdrop',
    description:
      'North Phoenix master-planned corridor with modern amenities and family-friendly communities.',
    heroImage:
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Communities', value: '7' },
      { label: 'Master-Planned', value: '4' },
      { label: 'Family-Friendly', value: 'Yes' },
      { label: 'Price Range', value: '$600K–$8M+' },
    ],
    highlights: ['Master-Planned', 'Family', 'Modern', 'Mountain Views'],
    communities: [
      { id: 'echo-canyon', name: 'Echo Canyon', price: '$2M – $8M+', zipCode: '85050', tags: ['Mountain Views', 'Ultra-Luxury'] },
      { id: 'desert-hills', name: 'Desert Hills Estates', price: '$700K – $5M+', zipCode: '85050', tags: ['Custom Homes'] },
      { id: 'aviano', name: 'Aviano', price: '$600K – $2M+', zipCode: '85050', tags: ['Master-Planned'] },
    ],
  },
  {
    id: 'anthem',
    name: 'Anthem',
    tagline: 'Family Living with Mountain Views',
    description:
      'North Phoenix master-planned communities with family amenities and mountain views.',
    heroImage:
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Communities', value: '4' },
      { label: 'Golf', value: '2' },
      { label: 'Family-Friendly', value: 'Yes' },
      { label: 'Price Range', value: '$300K–$2M+' },
    ],
    highlights: ['Golf', 'Master-Planned', 'Family', '55+'],
    communities: [
      { id: 'anthem-cc', name: 'Anthem Country Club', price: '$400K – $2M+', zipCode: '85086', tags: ['Golf'] },
      { id: 'tramonto', name: 'Tramonto', price: '$600K – $2M+', zipCode: '85085', tags: ['Master-Planned'] },
      { id: 'anthem-merrill', name: 'Anthem at Merrill Ranch (55+)', price: '$300K – $700K', zipCode: '85086', tags: ['Active Adult 55+'] },
    ],
  },
  {
    id: 'peoria',
    name: 'Peoria',
    tagline: 'West Valley Luxury & Lake Living',
    description:
      'West Valley luxury with lake access, Vistancia, and mountain-framed communities.',
    heroImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Communities', value: '11' },
      { label: 'Golf', value: '3' },
      { label: 'Lake Access', value: 'Yes' },
      { label: 'Price Range', value: '$400K–$5.3M+' },
    ],
    highlights: ['Golf', 'Lake Living', 'Master-Planned', 'Mountain Views'],
    communities: [
      { id: 'blackstone-vistancia', name: 'Blackstone at Vistancia', price: '$1M – $3M+', zipCode: '85383', tags: ['Golf', 'Guard-Gated'] },
      { id: 'alvamar-westwing', name: 'Alvamar at WestWing Mountain', price: '$2M – $3.5M+', zipCode: '85383', tags: ['Mountain Views'] },
      { id: 'casa-de-sunrise', name: 'Casa De Sunrise', price: '$3M – $5.3M+', zipCode: '85383', tags: ['Ultra-Luxury'] },
      { id: 'trilogy-vistancia', name: 'Trilogy at Vistancia (55+)', price: '$400K – $1M+', zipCode: '85383', tags: ['Active Adult 55+', 'Golf'] },
    ],
  },
];

export function getAllRegions(): RegionData[] {
  return REGIONS_DATA;
}

export function getRegionById(id: string): RegionData | undefined {
  return REGIONS_DATA.find((r) => r.id === id);
}

export function getTotalCommunityCount(): number {
  return REGIONS_DATA.reduce((sum, r) => sum + r.communities.length, 0);
}

/* ── Editorial Region Data (rich content for region detail pages) ── */

export interface GalleryImage {
  url: string;
  caption: string;
  category: string;
}

export interface RegionHighlight {
  icon: string;
  title: string;
  description: string;
}

export interface AmenityCategory {
  category: string;
  items: { name: string; distance?: string }[];
}

export interface MarketMetric {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface QualityOfLifeItem {
  metric: string;
  value: string;
  description: string;
}

export interface LifestyleCommunity {
  id: string;
  name: string;
  image: string;
  priceRange: string;
  bio: string;
}

export interface LifestyleCategory {
  id: number;
  title: string;
  communities: LifestyleCommunity[];
}

export interface EditorialStat {
  label: string;
  value: string;
  trend?: string;
  trendDir?: 'up' | 'down' | 'neutral';
}

export interface RegionEditorial {
  lifestyle?: { title: string; paragraphs: string[] };
  editorialStats?: EditorialStat[];
  gallery?: GalleryImage[];
  highlights?: RegionHighlight[];
  amenities?: AmenityCategory[];
  marketMetrics?: MarketMetric[];
  qualityOfLife?: QualityOfLifeItem[];
  lifestyles?: LifestyleCategory[];
}

// Editorial enrichment for regions that have deeper content
// Regions without editorial data still render with the base RegionData
export const REGION_EDITORIAL: Record<string, RegionEditorial> = {
  'north-scottsdale': {
    editorialStats: [
      { label: 'Median Price', value: '$2.8M', trend: '+8.2%', trendDir: 'up' },
      { label: 'Communities', value: '20+', trendDir: 'neutral' },
      { label: 'Golf Courses', value: '15+', trendDir: 'neutral' },
      { label: 'Elevation', value: '2,500 ft', trendDir: 'neutral' },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200', caption: 'Desert Mountain Estates', category: 'Community' },
      { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1200', caption: 'Silverleaf at DC Ranch', category: 'Architecture' },
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200', caption: 'Championship Golf', category: 'Lifestyle' },
      { url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1200', caption: 'Sonoran Desert Views', category: 'Nature' },
    ],
    lifestyle: {
      title: 'The North Scottsdale Lifestyle',
      paragraphs: [
        "Life in North Scottsdale moves at a rhythm defined by the desert itself\u2014unhurried yet purposeful, private yet connected. Residents wake to spectacular sunrises painting Pinnacle Peak in shades of gold and amber, enjoy morning rounds on championship courses designed by golf's greatest architects, and return home to estates where indoor-outdoor living blurs the line between shelter and landscape.",
        "This is Arizona's premier address for those who have achieved success and seek a lifestyle that reflects it. The community attracts Fortune 500 executives, professional athletes, entrepreneurs, and retirees who appreciate the unique combination of world-class amenities, natural beauty, and genuine privacy that North Scottsdale provides.",
        "The social fabric here is woven through country club memberships, charitable galas, and intimate gatherings in homes designed to entertain. Yet for all its exclusivity, North Scottsdale maintains a welcoming warmth characteristic of the American West.",
      ],
    },
    highlights: [
      { icon: 'Mountain', title: 'Desert Preservation', description: 'Over 30,000 acres of protected Sonoran Desert preserve, ensuring pristine views and trails for generations.' },
      { icon: 'Star', title: 'World-Class Golf', description: '15+ championship courses by Nicklaus, Fazio, and Weiskopf. Home to PGA Tour players.' },
      { icon: 'Shield', title: 'Privacy & Security', description: 'Guard-gated communities, low density zoning, and a culture of discretion.' },
      { icon: 'Sun', title: 'Climate Advantage', description: '330+ days of sunshine annually. 5-10 degrees F cooler than central Phoenix in summer.' },
      { icon: 'Activity', title: 'Active Lifestyle', description: '100+ miles of hiking and biking trails. Tennis, spa, and fitness at every major club.' },
      { icon: 'Users', title: 'Community Culture', description: 'Social calendars, wine clubs, charity events, and genuine camaraderie among residents.' },
    ],
    amenities: [
      { category: 'Golf & Recreation', items: [{ name: 'Desert Mountain Club (6 courses)', distance: '0-5 mi' }, { name: 'Silverleaf Club', distance: '3 mi' }, { name: 'Estancia Club', distance: '5 mi' }, { name: 'Troon North Golf Club', distance: '2 mi' }, { name: 'Grayhawk Golf Club', distance: '6 mi' }] },
      { category: 'Dining', items: [{ name: 'Sassi Ristorante', distance: '8 mi' }, { name: 'Talavera at Four Seasons', distance: '10 mi' }, { name: 'El Chorro Lodge', distance: '12 mi' }, { name: 'DC Ranch Market Street', distance: '5 mi' }] },
      { category: 'Education', items: [{ name: 'Basis Scottsdale (Top 10)', distance: '8 mi' }, { name: 'Great Hearts Academies', distance: '10 mi' }, { name: 'Pinnacle Peak Preparatory', distance: '3 mi' }] },
      { category: 'Healthcare', items: [{ name: 'HonorHealth Thompson Peak', distance: '8 mi' }, { name: 'Mayo Clinic Arizona', distance: '18 mi' }] },
      { category: 'Travel', items: [{ name: 'Scottsdale Airport (Private)', distance: '15 mi' }, { name: 'Phoenix Sky Harbor', distance: '30 mi' }, { name: 'Loop 101 Freeway', distance: '5 mi' }] },
    ],
    marketMetrics: [
      { label: 'Median Sale Price', value: '$2.45M', change: '+8.2%', trend: 'up' },
      { label: 'Price per Sq Ft', value: '$485', change: '+5.1%', trend: 'up' },
      { label: 'Days on Market', value: '68', change: '-12%', trend: 'down' },
      { label: 'Inventory', value: '4.2 Mo', change: '-0.8', trend: 'down' },
      { label: 'Sales Volume YTD', value: '$1.2B', change: '+15%', trend: 'up' },
      { label: 'Active Listings', value: '342', change: '+5%', trend: 'up' },
      { label: 'List-to-Sale', value: '97.2%', change: '+1.2%', trend: 'up' },
      { label: 'Luxury ($5M+)', value: '48 Sales', change: '+22%', trend: 'up' },
    ],
    qualityOfLife: [
      { metric: 'Air Quality', value: 'Excellent', description: 'Among the best in metro Phoenix due to elevation and distance from urban core.' },
      { metric: 'Crime Rate', value: '70% Below Avg', description: 'One of the safest areas in Arizona with 24/7 security patrols.' },
      { metric: 'Schools', value: '9-10/10', description: 'Top-rated public and private schools including nationally ranked BASIS.' },
      { metric: 'Commute', value: '25-35 min', description: 'Easy access via Loop 101 to Scottsdale, Tempe, and Phoenix.' },
      { metric: 'Walkability', value: 'Community', description: 'DC Ranch and others offer walkable town centers.' },
      { metric: 'Noise', value: 'Very Low', description: 'No flight paths, minimal traffic, large-lot zoning.' },
    ],
    lifestyles: [
      {
        id: 1, title: 'The Golf Collection',
        communities: [
          { id: 'silverleaf-at-dc-ranch', name: 'Silverleaf', image: 'https://images.unsplash.com/photo-1587382769062-a50e18147d38?auto=format&fit=crop&q=80&w=1600', priceRange: '$3M - $25M+', bio: 'Ultra-exclusive enclave of 295 homesites with a Tom Weiskopf championship course.' },
          { id: 'desert-mountain', name: 'Desert Mountain', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1600', priceRange: '$1.5M - $15M+', bio: 'Premier private golf community spanning 8,000 acres with six Jack Nicklaus courses.' },
          { id: 'whisper-rock', name: 'Whisper Rock', image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=1600', priceRange: '$2M - $10M+', bio: 'Home to PGA Tour professionals with two Phil Mickelson-designed courses.' },
          { id: 'estancia', name: 'Estancia', image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1600', priceRange: '$2M - $12M+', bio: 'Intimate community of 285 homesites surrounding a Tom Fazio masterpiece.' },
        ],
      },
      {
        id: 2, title: 'Mountain Estates',
        communities: [
          { id: 'troon', name: 'Troon North', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=1600', priceRange: '$1M - $6M+', bio: 'Set against Pinnacle Peak with two Tom Weiskopf courses amid ancient boulders.' },
          { id: 'dc-ranch', name: 'DC Ranch', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1600', priceRange: '$800K - $8M+', bio: 'Master-planned at the base of the McDowell Mountains with Market Street shops.' },
        ],
      },
      {
        id: 3, title: 'Guard-Gated Enclaves',
        communities: [
          { id: 'grayhawk', name: 'Grayhawk', image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&q=80&w=1600', priceRange: '$600K - $4M+', bio: 'Two championship courses and vibrant community with varied home styles.' },
          { id: 'terravita', name: 'Terravita', image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=1600', priceRange: '$600K - $2.5M+', bio: 'Premier 55+ community with resort-style amenities and active social calendar.' },
        ],
      },
    ],
  },
  'paradise-valley': {
    editorialStats: [
      { label: 'Median Price', value: '$4.5M', trend: '+12%', trendDir: 'up' },
      { label: 'Min. Lot Size', value: '1 Acre', trendDir: 'neutral' },
      { label: 'Resorts', value: '5-Star', trendDir: 'neutral' },
      { label: 'Population', value: '14,000', trendDir: 'neutral' },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1200', caption: 'Camelback Mountain Views', category: 'Vista' },
      { url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=1200', caption: 'Resort Living', category: 'Lifestyle' },
      { url: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=1200', caption: 'Luxury Estates', category: 'Architecture' },
    ],
    lifestyle: {
      title: 'The Paradise Valley Lifestyle',
      paragraphs: [
        "Paradise Valley stands as Arizona's wealthiest municipality and most coveted residential enclave. This 16-square-mile town of just 14,000 residents maintains strict zoning that preserves its character of sprawling estates on minimum one-acre lots.",
        "Nestled between Camelback Mountain and Mummy Mountain, Paradise Valley offers unmatched privacy, world-class resorts like The Phoenician and Sanctuary, and easy access to Scottsdale's finest dining and shopping.",
      ],
    },
  },
};

export function getRegionEditorial(id: string): RegionEditorial | undefined {
  return REGION_EDITORIAL[id];
}

/** Find the hero image and region info for a community by matching its name. */
export function getRegionByCommunityName(communityName: string): { heroImage: string; regionId: string; regionName: string; communityId: string } | null {
  const slug = communityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  for (const region of REGIONS_DATA) {
    for (const c of region.communities) {
      if (c.id === slug || c.name.toLowerCase() === communityName.toLowerCase()) {
        return { heroImage: region.heroImage, regionId: region.id, regionName: region.name, communityId: c.id };
      }
    }
  }
  return null;
}

/** Find the hero image for a community by matching its name against all regions' community lists. */
export function getHeroImageByCommunityName(communityName: string): string | null {
  return getRegionByCommunityName(communityName)?.heroImage ?? null;
}

/** Find the hero image for a region by matching a city name. */
export function getHeroImageByCity(city: string): string | null {
  const lower = city.toLowerCase();
  for (const region of REGIONS_DATA) {
    if (region.name.toLowerCase().includes(lower) || lower.includes(region.name.toLowerCase())) {
      return region.heroImage;
    }
  }
  return null;
}

/** Default hero image for the market overview page. */
export const DEFAULT_MARKET_HERO = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1600';
