// Adapter: ResolvedCommunity (enriched JSON) → CommunityTemplateData (template page)

import type { ResolvedCommunity, AmenityEntity } from '../data/types';
import type { CommunityTemplateData } from '../pages/TemplateCommunityPage';

// Amenity type → explore map tab mapping
const AMENITY_TAB_MAP: Record<string, { key: string; label: string; desc: string; markerColor: string }> = {
  'golf-course': { key: 'golf', label: 'Golf', desc: 'Championship courses', markerColor: '#3D405B' },
  'restaurant': { key: 'dining', label: 'Dining', desc: 'Fine dining & casual', markerColor: '#E07A5F' },
  'trail': { key: 'trails', label: 'Trails', desc: 'Hiking & nature', markerColor: '#81B29A' },
  'fitness': { key: 'fitness', label: 'Fitness', desc: 'Health & wellness', markerColor: '#4A90D9' },
  'spa': { key: 'fitness', label: 'Fitness', desc: 'Health & wellness', markerColor: '#4A90D9' },
  'pool': { key: 'fitness', label: 'Fitness', desc: 'Health & wellness', markerColor: '#4A90D9' },
  'tennis': { key: 'fitness', label: 'Fitness', desc: 'Health & wellness', markerColor: '#4A90D9' },
  'clubhouse': { key: 'fitness', label: 'Fitness', desc: 'Health & wellness', markerColor: '#4A90D9' },
  'shopping': { key: 'shopping', label: 'Shopping', desc: 'Retail & boutiques', markerColor: '#9B59B6' },
  'park': { key: 'parks', label: 'Parks', desc: 'Parks & recreation', markerColor: '#27AE60' },
};

// ── Fine Dining filtering constants ──

const DINING_EXCLUDE = new Set([
  'sports_club', 'association_or_organization', 'golf_course', 'shopping_mall',
  'hotel', 'resort_hotel', 'night_club', 'hookah_bar', 'sports_bar', 'pub',
  'cocktail_bar', 'bar', 'wine_bar', 'pizza_restaurant', 'pizza_delivery',
  'fast_food_restaurant', 'diner', 'breakfast_restaurant', 'sandwich_shop',
  'coffee_shop', 'ice_cream_shop', 'bakery', 'donut_shop', 'juice_shop',
  'bagel_shop', 'dessert_shop', 'cafe', 'deli', 'meal_delivery',
  'clothing_store', 'furniture_store', 'grocery_store', 'liquor_store',
  'corporate_office', 'spa', 'educational_institution',
  'hamburger_restaurant', 'chicken_wings_restaurant', 'brunch_restaurant',
  'fish_and_chips_restaurant', 'taco_restaurant',
  'community_center', 'art_gallery', 'sporting_goods_store', 'barber_shop',
  'health', 'butcher_shop', 'event_venue', 'banquet_hall', 'catering_service',
  'convenience_store', 'supermarket', 'discount_store', 'department_store',
]);

// Known chains, non-restaurants, and fast-casual spots that sneak past type filters
const DINING_NAME_EXCLUDE = new Set([
  'pei wei', 'filiberto\'s', 'noodles & company', 'buffalo wild wings',
  'ono hawaiian bbq', 'matt\'s big breakfast', 'the cheesecake factory',
  'dickey\'s barbecue pit', 'norterra shopping corridor (nearby)',
  'kierland commons', 'scottsdale quarter', 'hb wellness',
  'casa del monte central location', 'best life nutrition',
  'chili\'s', 'olive garden', 'downtown carefree shops & galleries',
  'teebox indoor golf club', 'legend trail clubhouse & pool',
]);

const TIER1_TYPES = new Set(['fine_dining_restaurant', 'steak_house']);
const TIER2_TYPES = new Set([
  'seafood_restaurant', 'sushi_restaurant', 'mediterranean_restaurant',
  'french_restaurant', 'italian_restaurant', 'japanese_restaurant',
]);

const CUISINE_MAP: Record<string, string> = {
  fine_dining_restaurant: 'Fine Dining',
  steak_house: 'Steakhouse',
  italian_restaurant: 'Italian',
  seafood_restaurant: 'Seafood',
  sushi_restaurant: 'Sushi',
  japanese_restaurant: 'Japanese',
  mediterranean_restaurant: 'Mediterranean',
  french_restaurant: 'French',
  mexican_restaurant: 'Mexican',
  thai_restaurant: 'Thai',
  indian_restaurant: 'Indian',
  american_restaurant: 'American',
  korean_restaurant: 'Korean',
  chinese_restaurant: 'Chinese',
  greek_restaurant: 'Greek',
  vietnamese_restaurant: 'Vietnamese',
  persian_restaurant: 'Persian',
  brazilian_restaurant: 'Brazilian',
  african_restaurant: 'African',
  asian_restaurant: 'Asian',
  asian_fusion_restaurant: 'Asian Fusion',
  hawaiian_restaurant: 'Hawaiian',
  middle_eastern_restaurant: 'Middle Eastern',
  southwestern_us_restaurant: 'Southwestern',
  gastropub: 'Gastropub',
  bistro: 'Bistro',
  brunch_restaurant: 'Brunch',
  bar_and_grill: 'Bar & Grill',
  fondue_restaurant: 'Fondue',
  mongolian_barbecue_restaurant: 'Mongolian BBQ',
  barbecue_restaurant: 'BBQ',
  ramen_restaurant: 'Ramen',
  vegan_restaurant: 'Vegan',
  gyro_restaurant: 'Mediterranean',
  taco_restaurant: 'Mexican',
  hamburger_restaurant: 'American',
  fish_and_chips_restaurant: 'Seafood',
  chicken_wings_restaurant: 'American',
  restaurant: 'Dining',
};

// Pipeline artifacts that aren't cuisine labels
const NON_CUISINE_RE = /clubhouse|golf|resort|shopping|spa|walkable|nearby|modern|western|waterfront|on-course|pool|tennis|social|events|fitness|nightlife|lifestyle|entertainment|arts|central-location/i;

function formatCuisine(subtype: string | null | undefined, googleType: string | undefined): string {
  // Prefer curated subtype if it looks like a cuisine
  if (subtype && !NON_CUISINE_RE.test(subtype)) {
    // Already formatted (starts with uppercase) — use as-is
    if (/^[A-Z]/.test(subtype)) return subtype;
    // Pipeline format: "mexican", "italian;pizza" → take first, capitalize, clean underscores
    const first = subtype.split(';')[0].replace(/_/g, ' ');
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  // Fall back to CUISINE_MAP
  if (googleType && CUISINE_MAP[googleType]) return CUISINE_MAP[googleType];
  return 'Dining';
}

function buildExploreData(community: ResolvedCommunity) {
  const amenitiesWithCoords = community.amenities.filter(a => a.coordinates !== null);
  if (amenitiesWithCoords.length === 0) return null;

  // Group amenities into tabs
  const tabMap = new Map<string, {
    key: string; label: string; desc: string; markerColor: string;
    items: { id: number; name: string; coords: [number, number]; cuisine?: string; rating?: number; type?: string; holes?: number }[];
  }>();

  let itemId = 1;
  for (const amenity of amenitiesWithCoords) {
    const tabConfig = AMENITY_TAB_MAP[amenity.type];
    if (!tabConfig) continue;

    let tab = tabMap.get(tabConfig.key);
    if (!tab) {
      tab = { ...tabConfig, items: [] };
      tabMap.set(tabConfig.key, tab);
    }

    const coords = amenity.coordinates as [number, number];
    const item: { id: number; name: string; coords: [number, number]; cuisine?: string; rating?: number; type?: string; holes?: number } = {
      id: itemId++,
      name: amenity.name,
      coords,
    };

    // Type-specific fields
    if (amenity.type === 'restaurant') {
      const poi = community.pois?.find(p => p.type === 'restaurant' && p.name === amenity.name);
      item.cuisine = formatCuisine(poi?.subtype, poi?.googleType) !== 'Dining' ? formatCuisine(poi?.subtype, poi?.googleType) : (amenity.tags.slice(0, 2).join(' · ') || amenity.description.slice(0, 50));
      if (poi?.rating) item.rating = poi.rating;
    }
    if (amenity.type === 'golf-course') {
      item.type = amenity.tags.includes('jack-nicklaus') ? 'Jack Nicklaus Signature' :
                  amenity.tags.includes('tom-fazio') ? 'Tom Fazio Design' : 'Championship';
      item.holes = 18;
    }

    tab.items.push(item);
  }

  // Preferred tab order
  const tabOrder = ['golf', 'dining', 'trails', 'fitness', 'shopping', 'parks'];
  const tabs = tabOrder
    .map(key => tabMap.get(key))
    .filter((t): t is NonNullable<typeof t> => t != null && t.items.length > 0);

  if (tabs.length === 0) return null;

  return {
    center: community.coordinates,
    zoom: 13,
    tabs,
  };
}

function buildDemographics(community: ResolvedCommunity) {
  const demo = community.zipcode.enrichment?.demographics;
  if (!demo) return null;

  return {
    population: demo.population ? demo.population.toLocaleString() : '—',
    medianAge: demo.medianAge ? String(demo.medianAge) : '—',
    collegeEducated: demo.collegePct ? `${demo.collegePct}%` : '—',
    householdIncome: demo.medianIncome
      ? demo.medianIncome >= 1_000_000
        ? `$${(demo.medianIncome / 1_000_000).toFixed(1)}M`
        : `$${Math.round(demo.medianIncome / 1000)}K`
      : '—',
    homeOwnership: demo.homeOwnershipPct ? `${demo.homeOwnershipPct}%` : '—',
    avgHomeValue: demo.medianHomeValue
      ? demo.medianHomeValue >= 1_000_000
        ? `$${(demo.medianHomeValue / 1_000_000).toFixed(1)}M`
        : `$${Math.round(demo.medianHomeValue / 1000)}K`
      : '—',
  };
}

function buildAirports(community: ResolvedCommunity) {
  const airports = community.location.airports;
  const privateAirport = airports.find(a =>
    a.type.toLowerCase().includes('private') ||
    a.type.toLowerCase().includes('executive') ||
    a.type.toLowerCase().includes('general')
  );
  const commercialAirport = airports.find(a =>
    a.type.toLowerCase().includes('international') ||
    a.type.toLowerCase().includes('commercial')
  );

  return {
    private: {
      name: privateAirport ? `${privateAirport.name} (${privateAirport.code})` : 'Scottsdale Airport (KSDL)',
      type: privateAirport?.type ?? 'Private/Executive',
      distance: privateAirport?.distance ?? '—',
    },
    commercial: {
      name: commercialAirport ? `${commercialAirport.name} (${commercialAirport.code})` : 'Phoenix Sky Harbor (PHX)',
      type: commercialAirport?.type ?? 'International',
      distance: commercialAirport?.distance ?? '—',
    },
  };
}

function buildSignatureAmenity(community: ResolvedCommunity) {
  const sig = community.signatureAmenity;
  if (!sig) {
    return {
      icon: 'Shield',
      title: community.name,
      description: community.description,
      stats: [],
      image: '',
    };
  }

  const iconMap: Record<string, string> = {
    'golf-course': 'Mountain',
    trail: 'TreePine',
    fitness: 'Zap',
    spa: 'Activity',
    clubhouse: 'Shield',
  };

  return {
    icon: iconMap[sig.type] ?? 'Shield',
    title: sig.name,
    description: sig.description,
    stats: sig.stats ?? [],
    image: sig.image ?? '',
  };
}

function buildSchools(community: ResolvedCommunity) {
  const schools: { name: string; type: string; rating: number; distance: string }[] = [];
  const sd = community.residential.schoolDistrict;

  // Helper: find enriched POI data for a school by name
  const findSchoolPoi = (name: string) =>
    community.pois?.find(p => p.type === 'school' && p.name === name);

  if (sd.highSchool) {
    const poi = findSchoolPoi(sd.highSchool);
    schools.push({
      name: sd.highSchool,
      type: 'Public High School',
      rating: poi?.rating ?? 0,
      distance: poi?.distanceMi ? `${poi.distanceMi.toFixed(1)} mi` : '—',
    });
  }
  for (const ps of sd.privateSchools) {
    const poi = findSchoolPoi(ps);
    schools.push({
      name: ps,
      type: 'Private',
      rating: poi?.rating ?? 0,
      distance: poi?.distanceMi ? `${poi.distanceMi.toFixed(1)} mi` : '—',
    });
  }

  return schools.slice(0, 6);
}

function getTier(googleType: string | undefined, rating: number): number {
  if (!googleType) return 9;
  if (TIER1_TYPES.has(googleType)) return 1;
  if (TIER2_TYPES.has(googleType)) return 2;
  // Tier 3: any other accepted type with decent rating
  if (googleType === 'restaurant' && rating >= 4.0) return 3;
  if (!DINING_EXCLUDE.has(googleType)) return 3;
  return 9; // should not reach here after filtering
}

function buildRestaurants(community: ResolvedCommunity) {
  type Candidate = {
    name: string; cuisine: string; distance: string;
    rating: number; image: string; tier: number;
  };

  const seen = new Set<string>();
  const candidates: Candidate[] = [];

  // Collect from POIs (primary source — has googleType, rating, photos)
  if (community.pois) {
    for (const poi of community.pois) {
      if (poi.type !== 'restaurant') continue;
      if (!poi.googleType || DINING_EXCLUDE.has(poi.googleType)) continue;
      if (DINING_NAME_EXCLUDE.has(poi.name.toLowerCase())) continue;
      if ((poi.rating ?? 0) <= 0) continue;
      if (!poi.photoUrl) continue;

      const tier = getTier(poi.googleType, poi.rating ?? 0);
      if (tier > 3) continue;

      seen.add(poi.name);
      candidates.push({
        name: poi.name,
        cuisine: formatCuisine(poi.subtype, poi.googleType),
        distance: poi.distanceMi === 0 ? 'On-Site' : `${poi.distanceMi.toFixed(1)} mi`,
        rating: poi.rating ?? 0,
        image: poi.photoUrl,
        tier,
      });
    }
  }

  // Supplement from amenity entities that are real restaurants (not clubhouses)
  const restaurantAmenities = community.amenities.filter(
    (a: AmenityEntity) => a.type === 'restaurant'
  );
  for (const a of restaurantAmenities) {
    if (seen.has(a.name)) continue;
    if (DINING_NAME_EXCLUDE.has(a.name.toLowerCase())) continue;
    const poi = community.pois?.find(p => p.type === 'restaurant' && p.name === a.name);
    if (!poi?.photoUrl || (poi.rating ?? 0) <= 0) continue;
    if (poi.googleType && DINING_EXCLUDE.has(poi.googleType)) continue;

    const tier = getTier(poi.googleType, poi.rating ?? 0);
    if (tier > 3) continue;

    seen.add(a.name);
    candidates.push({
      name: a.name,
      cuisine: formatCuisine(poi.subtype, poi.googleType),
      distance: poi.distanceMi === 0 ? 'On-Site' : `${poi.distanceMi.toFixed(1)} mi`,
      rating: poi.rating ?? 0,
      image: poi.photoUrl,
      tier,
    });
  }

  // If fewer than 4 candidates, relax: accept Tier 3 at rating >= 3.5
  if (candidates.length < 4 && community.pois) {
    for (const poi of community.pois) {
      if (poi.type !== 'restaurant' || seen.has(poi.name)) continue;
      if (!poi.googleType || DINING_EXCLUDE.has(poi.googleType)) continue;
      if (DINING_NAME_EXCLUDE.has(poi.name.toLowerCase())) continue;
      if ((poi.rating ?? 0) < 3.5 || !poi.photoUrl) continue;

      seen.add(poi.name);
      candidates.push({
        name: poi.name,
        cuisine: formatCuisine(poi.subtype, poi.googleType),
        distance: poi.distanceMi === 0 ? 'On-Site' : `${poi.distanceMi.toFixed(1)} mi`,
        rating: poi.rating ?? 0,
        image: poi.photoUrl,
        tier: 3,
      });
      if (candidates.length >= 4) break;
    }
  }

  // Sort: tier asc, rating desc
  candidates.sort((a, b) => a.tier - b.tier || b.rating - a.rating);

  return candidates.slice(0, 4).map(({ tier: _t, ...rest }) => rest);
}

function buildQualityOfLife(community: ResolvedCommunity) {
  if (!community.qualityOfLife || community.qualityOfLife.length === 0) return null;

  return community.qualityOfLife.map(q => ({
    metric: q.metric,
    value: q.value,
    score: 0,
    icon: q.icon,
    color: q.color,
  }));
}

export function resolvedToTemplate(community: ResolvedCommunity): CommunityTemplateData {
  const exploreData = buildExploreData(community);
  const demographics = buildDemographics(community);
  const airports = buildAirports(community);
  const signatureAmenity = buildSignatureAmenity(community);
  const schools = buildSchools(community);
  const restaurants = buildRestaurants(community);
  const qualityOfLife = buildQualityOfLife(community);

  return {
    id: community.id,
    name: community.name,
    city: community.city,
    region: community.identity.regionId,
    tagline: community.tagline,
    description: community.description,
    narrative: community.narrative.body as string | { lead: string; sections: { tab: string; content: string }[] },
    heroImage: community.heroImage,
    elevation: community.location.elevation ?? '—',
    zipCode: community.zipCode,
    coordinates: community.coordinates,

    // Market data
    stats: community.market?.stats ?? {
      avgPrice: '—', priceRange: community.priceRange, avgPpsf: '—',
      avgDom: 0, inventory: 0, trend: '—',
    },
    metrics: community.market?.metrics ?? [],

    // Tags
    features: community.categoryTags,
    amenities: community.amenities.map(a => a.name),

    // Rich content
    gallery: community.gallery,
    demographics,
    qualityOfLife,
    schools,
    restaurants,

    // Economy
    employers: community.economy?.employers ?? null,
    economicStats: community.economy?.stats ?? null,

    // Location
    airports,
    keyDistances: community.location.keyDistances.map(kd => ({
      place: kd.label,
      time: kd.distance,
    })),

    // Signature
    signatureAmenity,

    // Listings (empty — will come from MLS API)
    listings: [],

    // Explore map
    exploreData: exploreData ?? { center: [0, 0] as [number, number], zoom: 13, tabs: [] },

    // Boundary
    boundary: true,
  };
}
