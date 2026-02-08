import { NEIGHBORHOODS } from './neighborhoods';
import type { RegionConfig, ZipcodeConfig, CommunityConfig } from '../models/types';

// Helper: parse price strings like "$1.8M", "$950K", "$4.8M"
function parsePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[^0-9.MK]/g, '');
  if (cleaned.endsWith('M')) return parseFloat(cleaned) * 1000000;
  if (cleaned.endsWith('K')) return parseFloat(cleaned) * 1000;
  return parseFloat(cleaned);
}

// Helper: parse PPSF strings like "$425"
function parsePpsf(ppsfStr: string): number {
  return parseInt(ppsfStr.replace(/[^0-9]/g, ''), 10);
}

// Helper: parse trend strings like "+8%", "+14%"
function parseTrend(trendStr: string): number {
  return parseFloat(trendStr.replace('%', '')) / 100;
}

// --- Region Configs ---
export const REGION_CONFIGS: RegionConfig[] = [
  {
    slug: 'north-scottsdale',
    name: 'North Scottsdale',
    description: 'North Scottsdale is Arizona\'s premier luxury real estate destination, featuring world-class golf communities, custom estates, and breathtaking Sonoran Desert landscapes.',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2400',
    baseStats: { medianPrice: 2400000, avgDom: 45, inventory: 350, monthsSupply: 2.5, listToSale: 97.2, ppsf: 525, trend: 0.10 },
  },
  {
    slug: 'paradise-valley',
    name: 'Paradise Valley',
    description: 'Known as the "Beverly Hills of Arizona," Paradise Valley features sprawling estates on one-acre-plus lots with no commercial development — pure residential luxury.',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2400',
    baseStats: { medianPrice: 4800000, avgDom: 68, inventory: 72, monthsSupply: 3.0, listToSale: 96.5, ppsf: 765, trend: 0.12 },
  },
  {
    slug: 'carefree-cave-creek',
    name: 'Carefree & Cave Creek',
    description: 'Carefree and Cave Creek offer a unique blend of small-town charm, Western heritage, and luxury desert living just north of Scottsdale.',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2400',
    baseStats: { medianPrice: 1600000, avgDom: 52, inventory: 90, monthsSupply: 3.2, listToSale: 96.0, ppsf: 395, trend: 0.075 },
  },
  {
    slug: 'central-scottsdale',
    name: 'Central Scottsdale',
    description: 'Central Scottsdale offers convenient access to Old Town dining and entertainment with established residential neighborhoods and diverse housing options.',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2400',
    baseStats: { medianPrice: 1050000, avgDom: 32, inventory: 145, monthsSupply: 2.2, listToSale: 97.8, ppsf: 350, trend: 0.07 },
  },
  {
    slug: 'south-scottsdale',
    name: 'South Scottsdale',
    description: 'South Scottsdale encompasses established luxury communities including Gainey Ranch, McCormick Ranch, and the vibrant Old Town area.',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2400',
    baseStats: { medianPrice: 1300000, avgDom: 36, inventory: 138, monthsSupply: 2.4, listToSale: 97.5, ppsf: 460, trend: 0.07 },
  },
  {
    slug: 'phoenix',
    name: 'Phoenix',
    description: 'North Phoenix features premier master-planned communities including Desert Ridge, offering resort-style living with excellent schools and amenities.',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2400',
    baseStats: { medianPrice: 850000, avgDom: 32, inventory: 65, monthsSupply: 2.0, listToSale: 98.0, ppsf: 325, trend: 0.09 },
  },
];

// --- Build zipcode and community configs from neighborhoods data ---

// Collect unique zipcodes per region
const zipcodeMap = new Map<string, { codes: Set<string>; neighborhoods: typeof NEIGHBORHOODS }>();

for (const n of NEIGHBORHOODS) {
  if (!zipcodeMap.has(n.region)) {
    zipcodeMap.set(n.region, { codes: new Set(), neighborhoods: [] });
  }
  const entry = zipcodeMap.get(n.region)!;
  for (const zip of n.zipCodes) {
    entry.codes.add(zip);
  }
  entry.neighborhoods.push(n);
}

// Zipcode name map for nice display names
const ZIPCODE_NAMES: Record<string, string> = {
  '85255': 'Pinnacle Peak / DC Ranch',
  '85262': 'Far North Scottsdale',
  '85254': 'Kierland / Scottsdale Airpark',
  '85258': 'McCormick Ranch / Gainey Ranch',
  '85257': 'Central Scottsdale',
  '85251': 'Old Town Scottsdale',
  '85253': 'Paradise Valley',
  '85377': 'Carefree',
  '85331': 'Cave Creek',
  '85050': 'Desert Ridge North',
  '85054': 'Desert Ridge South',
};

// Zipcode images based on region
const ZIPCODE_IMAGES: Record<string, string> = {
  '85255': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2400',
  '85262': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2400',
  '85254': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2400',
  '85258': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2400',
  '85257': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2400',
  '85251': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2400',
  '85253': 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2400',
  '85377': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2400',
  '85331': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2400',
  '85050': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2400',
  '85054': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2400',
};

export const ZIPCODE_CONFIGS: ZipcodeConfig[] = [];
const processedZips = new Set<string>();

for (const [regionSlug, data] of zipcodeMap) {
  for (const code of data.codes) {
    // Avoid duplicate zipcodes across regions - assign to first region
    if (processedZips.has(code)) continue;
    processedZips.add(code);

    const neighborhoodsInZip = NEIGHBORHOODS.filter(n =>
      n.zipCodes.includes(code) && n.region === regionSlug
    );

    if (neighborhoodsInZip.length === 0) continue;

    // Aggregate stats from neighborhoods in this zip
    const avgPrice = neighborhoodsInZip.reduce((sum, n) => sum + parsePrice(n.stats.avgPrice), 0) / neighborhoodsInZip.length;
    const avgDom = Math.round(neighborhoodsInZip.reduce((sum, n) => sum + n.stats.avgDom, 0) / neighborhoodsInZip.length);
    const totalInventory = neighborhoodsInZip.reduce((sum, n) => sum + n.stats.inventory, 0);
    const avgPpsf = Math.round(neighborhoodsInZip.reduce((sum, n) => sum + parsePpsf(n.stats.avgPpsf), 0) / neighborhoodsInZip.length);
    const avgTrend = neighborhoodsInZip.reduce((sum, n) => sum + parseTrend(n.stats.trend), 0) / neighborhoodsInZip.length;

    ZIPCODE_CONFIGS.push({
      code,
      name: ZIPCODE_NAMES[code] || `${code} Area`,
      regionSlug,
      description: `The ${code} zip code encompasses ${neighborhoodsInZip.length} luxury communities in the ${regionSlug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')} area.`,
      image: ZIPCODE_IMAGES[code] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2400',
      baseStats: {
        medianPrice: Math.round(avgPrice),
        avgDom,
        inventory: totalInventory,
        monthsSupply: Number((totalInventory / Math.max(1, Math.round(totalInventory * 0.4))).toFixed(1)),
        listToSale: Number((96 + Math.random() * 2.5).toFixed(1)),
        ppsf: avgPpsf,
        trend: Number(avgTrend.toFixed(3)),
      },
    });
  }
}

// --- Community Configs from neighborhoods ---
export const COMMUNITY_CONFIGS: CommunityConfig[] = NEIGHBORHOODS.map(n => {
  const avgPrice = parsePrice(n.stats.avgPrice);
  const ppsf = parsePpsf(n.stats.avgPpsf);
  const trend = parseTrend(n.stats.trend);
  const primaryZip = n.zipCodes[0];

  // Derive additional stats from base data
  const highestSale = Math.round(avgPrice * 2.5);
  const lowestSale = Math.round(avgPrice * 0.45);
  const avgSqFt = ppsf > 0 ? Math.round(avgPrice / ppsf) : 3500;
  const cashPortion = avgPrice > 3000000 ? 70 : avgPrice > 2000000 ? 60 : avgPrice > 1000000 ? 50 : 35;

  return {
    slug: n.id,
    name: n.name,
    zipcodeCode: primaryZip,
    type: n.features.includes('Golf Course') || n.features.includes('Jack Nicklaus Course') || n.features.includes('Tom Fazio Course') || n.features.includes('Two Golf Courses') || n.features.includes('Six Golf Courses')
      ? 'Luxury Golf Community'
      : n.features.includes('Guard-Gated')
        ? 'Guard-Gated Community'
        : n.features.includes('Master-Planned')
          ? 'Master-Planned Community'
          : n.features.includes('Equestrian') || n.features.includes('Equestrian Zoning')
            ? 'Equestrian Community'
            : n.features.includes('Walkable') || n.features.includes('Urban Living')
              ? 'Urban Living'
              : 'Luxury Community',
    description: n.description,
    image: n.image,
    baseStats: {
      medianPrice: avgPrice,
      avgDom: n.stats.avgDom,
      inventory: n.stats.inventory,
      monthsSupply: Number((n.stats.inventory / Math.max(1, Math.round(n.stats.inventory * 0.4))).toFixed(1)),
      listToSale: Number((96 + Math.random() * 2.5).toFixed(1)),
      ppsf,
      trend,
      highestSale,
      lowestSale,
      avgSqFt,
      cashPortion,
    },
  };
});
