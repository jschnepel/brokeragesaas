export interface CommunityStat {
  label: string;
  value: number;
  suffix: string;
  prefix?: string;
}

export interface CommunityListing {
  id: string;
  name: string;
  price: string;
  image: string;
  zipCode?: string;
}

export interface RegionListingData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  stats: CommunityStat[];
  highlights: string[];
  communities: CommunityListing[];
}

export interface SearchResult {
  type: 'region' | 'community';
  regionId: string;
  regionName: string;
  communityId?: string;
  communityName?: string;
  price?: string;
  zipCode?: string;
  image: string;
}

export const REGIONS_DATA: RegionListingData[] = [
  {
    id: 'north-scottsdale',
    name: 'North Scottsdale',
    tagline: 'Where Desert Elegance Meets Championship Golf',
    description: 'North Scottsdale represents the pinnacle of Arizona luxury living, where the high Sonoran Desert meets world-class amenities. Home to the most exclusive golf communities and custom home enclaves in the Southwest.',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Median Price', value: 2.8, suffix: 'M', prefix: '$' },
      { label: 'Communities', value: 12, suffix: '+' },
      { label: 'Golf Courses', value: 15, suffix: '+' },
      { label: 'YoY Growth', value: 8.2, suffix: '%' },
    ],
    highlights: ['Guard-Gated', 'Championship Golf', 'Desert Preserve', 'A+ Schools'],
    communities: [
      { id: 'desert-mountain', name: 'Desert Mountain', price: '$1.5M - $15M+', zipCode: '85262', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800' },
      { id: 'silverleaf', name: 'Silverleaf', price: '$3M - $25M+', zipCode: '85255', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800' },
      { id: 'dc-ranch', name: 'DC Ranch', price: '$800K - $8M+', zipCode: '85255', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800' },
      { id: 'estancia', name: 'Estancia', price: '$2M - $12M+', zipCode: '85262', image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=800' },
      { id: 'whisper-rock', name: 'Whisper Rock', price: '$2M - $10M+', zipCode: '85262', image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=800' },
      { id: 'troon-north', name: 'Troon North', price: '$1M - $6M+', zipCode: '85262', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=800' },
      { id: 'pinnacle-peak', name: 'Pinnacle Peak', price: '$1.2M - $8M+', zipCode: '85255', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800' },
      { id: 'terravita', name: 'Terravita', price: '$600K - $3M+', zipCode: '85266', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800' },
      { id: 'legend-trail', name: 'Legend Trail', price: '$500K - $2M+', zipCode: '85262', image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800' },
      { id: 'winfield', name: 'Winfield', price: '$800K - $4M+', zipCode: '85255', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800' },
    ],
  },
  {
    id: 'paradise-valley',
    name: 'Paradise Valley',
    tagline: "Arizona's Most Prestigious Address",
    description: "Paradise Valley stands as Arizona's wealthiest municipality and most coveted residential enclave. This 16-square-mile town maintains strict zoning with sprawling estates on minimum one-acre lots, nestled between Camelback and Mummy Mountains.",
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Median Price', value: 4.5, suffix: 'M', prefix: '$' },
      { label: 'Min Lot Size', value: 1, suffix: ' Acre' },
      { label: '5-Star Resorts', value: 5, suffix: '' },
      { label: 'YoY Growth', value: 12, suffix: '%' },
    ],
    highlights: ['Estate Living', 'Mountain Views', 'Ultra Privacy', 'Resort Access'],
    communities: [
      { id: 'paradise-valley-estates', name: 'Paradise Valley Estates', price: '$2M - $30M+', zipCode: '85253', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800' },
      { id: 'clearwater-hills', name: 'Clearwater Hills', price: '$3M - $15M+', zipCode: '85253', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800' },
      { id: 'mummy-mountain', name: 'Mummy Mountain', price: '$4M - $20M+', zipCode: '85253', image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=800' },
      { id: 'camelback-country-estates', name: 'Camelback Country Estates', price: '$2.5M - $12M+', zipCode: '85253', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800' },
      { id: 'paradise-reserve', name: 'Paradise Reserve', price: '$3M - $18M+', zipCode: '85253', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800' },
      { id: 'cheney-estates', name: 'Cheney Estates', price: '$2M - $10M+', zipCode: '85253', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800' },
    ],
  },
  {
    id: 'carefree-cave-creek',
    name: 'Carefree & Cave Creek',
    tagline: 'Western Spirit, Desert Soul',
    description: "The twin communities offer a distinct alternative to manicured golf communities. Here, the Old West spirit lives on with towering saguaros, dramatic boulder formations, and authentic Southwestern architecture.",
    image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Median Price', value: 1.8, suffix: 'M', prefix: '$' },
      { label: 'Avg Lot Size', value: 2, suffix: '+ Ac' },
      { label: 'Elevation', value: 2800, suffix: ' ft' },
      { label: 'YoY Growth', value: 6, suffix: '%' },
    ],
    highlights: ['Horse Properties', 'Western Culture', 'Large Lots', 'Dark Skies'],
    communities: [
      { id: 'carefree', name: 'Carefree', price: '$800K - $8M+', zipCode: '85377', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800' },
      { id: 'cave-creek', name: 'Cave Creek', price: '$600K - $5M+', zipCode: '85331', image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=800' },
      { id: 'the-boulders', name: 'The Boulders', price: '$1M - $6M+', zipCode: '85377', image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800' },
      { id: 'rancho-manana', name: 'Rancho Mañana', price: '$700K - $3M+', zipCode: '85331', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800' },
      { id: 'black-mountain', name: 'Black Mountain', price: '$800K - $4M+', zipCode: '85331', image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=800' },
      { id: 'lone-mountain', name: 'Lone Mountain', price: '$600K - $3M+', zipCode: '85331', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800' },
    ],
  },
  {
    id: 'central-scottsdale',
    name: 'Central Scottsdale',
    tagline: 'Urban Luxury, Desert Lifestyle',
    description: 'Central Scottsdale offers the perfect balance of urban convenience and desert beauty. From the vibrant energy of Old Town to upscale Kierland and Scottsdale Quarter, enjoy walkable access to world-class dining and culture.',
    image: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Median Price', value: 1.2, suffix: 'M', prefix: '$' },
      { label: 'Walk Score', value: 70, suffix: '+' },
      { label: 'Restaurants', value: 500, suffix: '+' },
      { label: 'YoY Growth', value: 5, suffix: '%' },
    ],
    highlights: ['Walkable', 'Arts & Culture', 'Nightlife', 'Shopping'],
    communities: [
      { id: 'old-town', name: 'Old Town Scottsdale', price: '$300K - $5M+', zipCode: '85251', image: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=800' },
      { id: 'kierland', name: 'Kierland', price: '$400K - $3M+', zipCode: '85254', image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&q=80&w=800' },
      { id: 'gainey-ranch', name: 'Gainey Ranch', price: '$1M - $5M+', zipCode: '85258', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800' },
      { id: 'mccormick-ranch', name: 'McCormick Ranch', price: '$500K - $3M+', zipCode: '85258', image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=800' },
      { id: 'stonegate', name: 'Stonegate', price: '$600K - $2M+', zipCode: '85255', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800' },
      { id: 'grayhawk', name: 'Grayhawk', price: '$500K - $4M+', zipCode: '85255', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800' },
    ],
  },
  {
    id: 'south-scottsdale',
    name: 'South Scottsdale',
    tagline: 'Vibrant Living, Endless Possibilities',
    description: 'South Scottsdale offers an eclectic mix of mid-century charm, modern development, and urban energy. Close to ASU, Tempe, and Phoenix, this area attracts young professionals and investors alike.',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Median Price', value: 650, suffix: 'K', prefix: '$' },
      { label: 'Walk Score', value: 55, suffix: '+' },
      { label: 'Restaurants', value: 200, suffix: '+' },
      { label: 'YoY Growth', value: 7, suffix: '%' },
    ],
    highlights: ['Urban Living', 'Nightlife', 'Investment Potential', 'Transit Access'],
    communities: [
      { id: 'papago-park', name: 'Papago Park', price: '$400K - $1.5M+', zipCode: '85257', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800' },
      { id: 'old-town-south', name: 'Old Town South', price: '$350K - $2M+', zipCode: '85251', image: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=800' },
      { id: 'vista-del-camino', name: 'Vista del Camino', price: '$300K - $800K+', zipCode: '85257', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800' },
      { id: 'continental-golf', name: 'Continental Golf', price: '$400K - $1.2M+', zipCode: '85257', image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=800' },
    ],
  },
  {
    id: 'arcadia',
    name: 'Arcadia',
    tagline: 'Historic Charm Meets Modern Luxury',
    description: 'Arcadia is one of Phoenix\'s most desirable neighborhoods, known for its tree-lined streets, historic citrus groves, and proximity to Camelback Mountain. A perfect blend of old-world charm and contemporary sophistication.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Median Price', value: 1.8, suffix: 'M', prefix: '$' },
      { label: 'Avg Lot Size', value: 0.5, suffix: ' Ac' },
      { label: 'Walk Score', value: 45, suffix: '+' },
      { label: 'YoY Growth', value: 9, suffix: '%' },
    ],
    highlights: ['Historic Homes', 'Camelback Mountain', 'Top Schools', 'Walkable'],
    communities: [
      { id: 'arcadia-proper', name: 'Arcadia Proper', price: '$1.5M - $10M+', zipCode: '85018', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800' },
      { id: 'arcadia-lite', name: 'Arcadia Lite', price: '$800K - $3M+', zipCode: '85018', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800' },
      { id: 'arcadia-estates', name: 'Arcadia Estates', price: '$2M - $8M+', zipCode: '85018', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800' },
      { id: 'camelback-corridor', name: 'Camelback Corridor', price: '$1M - $5M+', zipCode: '85016', image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=800' },
    ],
  },
  {
    id: 'fountain-hills',
    name: 'Fountain Hills',
    tagline: 'Small Town Feel, Big Mountain Views',
    description: 'Fountain Hills is a master-planned community known for its famous fountain, stunning McDowell Mountain views, and relaxed lifestyle. A haven for retirees and families seeking tranquility with easy access to Scottsdale.',
    image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Median Price', value: 750, suffix: 'K', prefix: '$' },
      { label: 'Population', value: 25, suffix: 'K' },
      { label: 'Golf Courses', value: 6, suffix: '' },
      { label: 'YoY Growth', value: 5, suffix: '%' },
    ],
    highlights: ['Mountain Views', 'Famous Fountain', 'Golf Communities', 'Dark Sky'],
    communities: [
      { id: 'fountain-hills', name: 'Fountain Hills', price: '$500K - $3M+', zipCode: '85268', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=800' },
      { id: 'eagle-mountain', name: 'Eagle Mountain', price: '$600K - $2.5M+', zipCode: '85268', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800' },
      { id: 'firerock', name: 'FireRock', price: '$800K - $4M+', zipCode: '85268', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800' },
      { id: 'sunridge-canyon', name: 'SunRidge Canyon', price: '$500K - $2M+', zipCode: '85268', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800' },
      { id: 'copperwynd', name: 'CopperWynd', price: '$700K - $3M+', zipCode: '85268', image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=800' },
    ],
  },
  {
    id: 'rio-verde',
    name: 'Rio Verde',
    tagline: 'Desert Serenity, Unlimited Space',
    description: 'Rio Verde offers a true escape to the Sonoran Desert with sprawling horse properties, championship golf, and breathtaking mountain vistas. Perfect for those seeking space, privacy, and the authentic Arizona experience.',
    image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=1600',
    stats: [
      { label: 'Median Price', value: 900, suffix: 'K', prefix: '$' },
      { label: 'Avg Lot Size', value: 2, suffix: '+ Ac' },
      { label: 'Golf Courses', value: 4, suffix: '' },
      { label: 'YoY Growth', value: 4, suffix: '%' },
    ],
    highlights: ['Horse Properties', 'Golf Communities', 'Mountain Views', 'Dark Skies'],
    communities: [
      { id: 'rio-verde', name: 'Rio Verde', price: '$600K - $3M+', zipCode: '85263', image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=800' },
      { id: 'rio-verde-foothills', name: 'Rio Verde Foothills', price: '$500K - $2M+', zipCode: '85263', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800' },
      { id: 'tonto-verde', name: 'Tonto Verde', price: '$400K - $1.5M+', zipCode: '85263', image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800' },
    ],
  },
];

export const fuzzyMatch = (text: string, query: string): boolean => {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  if (textLower.includes(queryLower)) return true;

  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === queryLower.length;
};
