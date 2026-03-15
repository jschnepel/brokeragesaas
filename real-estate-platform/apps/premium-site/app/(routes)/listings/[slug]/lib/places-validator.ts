import type { NearbyAmenity, NearbyCategory, NearbyData } from './types';
import { searchNearbyPlaces, haversineDistanceMiles } from './places-client';
import { DINING_BLACKLIST, GROCERY_BLACKLIST, EXCLUDED_DINING_TYPES, EXCLUDED_GROCERY_TYPES } from './blacklists';

interface CategoryConfig {
  type: string;
  category: NearbyCategory;
  maxResults: number;
  minRating?: number;
  minReviews?: number;
  minPriceLevel?: number;
  blacklist?: Set<string>;
  excludedTypes?: Set<string>;
  nameFilter?: (name: string) => boolean;
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  { type: 'restaurant', category: 'dining', maxResults: 3, minRating: 4.0, minReviews: 50, minPriceLevel: 2, blacklist: DINING_BLACKLIST, excludedTypes: EXCLUDED_DINING_TYPES },
  { type: 'golf_course', category: 'golf', maxResults: 2, nameFilter: (name) => /golf/i.test(name) },
  { type: 'grocery_or_supermarket', category: 'grocery', maxResults: 1, minReviews: 20, blacklist: GROCERY_BLACKLIST, excludedTypes: EXCLUDED_GROCERY_TYPES },
  { type: 'shopping_mall', category: 'shopping', maxResults: 2, minPriceLevel: 2 },
  { type: 'department_store', category: 'shopping', maxResults: 2, minPriceLevel: 2 },
  { type: 'hospital', category: 'medical', maxResults: 1 },
  { type: 'doctor', category: 'medical', maxResults: 1 },
];

export async function fetchValidatedNearby(lat: number, lng: number): Promise<NearbyData> {
  const results = await Promise.all(
    CATEGORY_CONFIGS.map(async (config) => {
      const places = await searchNearbyPlaces(lat, lng, config.type);
      const validated = places
        .filter((p) => p.business_status === 'OPERATIONAL')
        .filter((p) => !config.excludedTypes || !p.types.some((t) => config.excludedTypes!.has(t)))
        .filter((p) => !config.blacklist || !config.blacklist.has(p.name.toLowerCase().trim()))
        .filter((p) => !config.minRating || p.rating >= config.minRating)
        .filter((p) => !config.minReviews || p.user_ratings_total >= config.minReviews)
        .filter((p) => !config.minPriceLevel || (p.price_level != null && p.price_level >= config.minPriceLevel))
        .filter((p) => !config.nameFilter || config.nameFilter(p.name))
        .map((p): NearbyAmenity => ({
          name: p.name,
          distanceMiles: haversineDistanceMiles(lat, lng, p.geometry.location.lat, p.geometry.location.lng),
          category: config.category,
        }))
        .sort((a, b) => a.distanceMiles - b.distanceMiles)
        .slice(0, config.maxResults);
      return { category: config.category, items: validated };
    }),
  );

  const nearby: NearbyData = { dining: [], golf: [], grocery: [], shopping: [], medical: [] };
  for (const result of results) {
    nearby[result.category] = [...nearby[result.category], ...result.items];
  }
  // Deduplicate by name within each category
  for (const key of Object.keys(nearby) as NearbyCategory[]) {
    const seen = new Set<string>();
    const config = CATEGORY_CONFIGS.find((c) => c.category === key);
    nearby[key] = nearby[key]
      .sort((a, b) => a.distanceMiles - b.distanceMiles)
      .filter((item) => { if (seen.has(item.name)) return false; seen.add(item.name); return true; })
      .slice(0, config?.maxResults ?? 3);
  }
  return nearby;
}
