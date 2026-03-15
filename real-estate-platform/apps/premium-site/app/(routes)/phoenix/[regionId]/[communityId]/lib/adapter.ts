/**
 * Community Data Adapter
 *
 * Transforms raw DB rows (CommunityRow, CommunityAmenityRow, scorecard, pulse)
 * into the CommunityPageData shape that components consume.
 *
 * Ported from prototypes/yong/src/utils/communityAdapter.ts with adaptations
 * for the relational DB schema (vs. the prototype's denormalized JSON).
 */

import type { CommunityRow, CommunityAmenityRow } from '@platform/database/src/queries/communities';
import type { CommunityScorecard, MarketPulseRow } from '@platform/shared';
import type {
  CommunityPageData,
  MarketStats,
  MarketMetric,
  NarrativeData,
  NarrativeTab,
  DemographicsData,
  School,
  Restaurant,
  QualityMetric,
  GalleryImage,
  ExploreData,
  ExploreItem,
  ExploreTab,
  SignatureAmenity,
  AirportInfo,
  KeyDistance,
  Employer,
  EconomicStat,
} from './types';

// ═══════════════════════════════════════════════════════
// JSONB shape assertions for CommunityRow fields
// ═══════════════════════════════════════════════════════

interface NarrativeJson {
  tagline?: string;
  summary?: string;
  body?: string | { lead: string; sections: { tab: string; content: string }[] };
}

interface LocationJson {
  airports?: { name: string; code: string; type: string; distance: string }[];
  keyDistances?: { label: string; distance: string }[];
  elevation?: string;
}

interface ResidentialJson {
  schoolDistrict?: {
    district?: string;
    highSchool?: string;
    privateSchools?: string[];
  };
}

interface DemographicsJson {
  population?: number;
  medianAge?: number;
  medianIncome?: number;
  medianHomeValue?: number;
  collegePct?: number;
  homeOwnershipPct?: number;
}

interface PoiJson {
  id?: string;
  name: string;
  type: string;
  subtype?: string | null;
  lat?: number;
  lng?: number;
  distanceMi?: number;
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
  googleType?: string;
}

interface QualityOfLifeJson {
  metric: string;
  value: string;
  icon: string;
  color: string;
}

interface EconomyJson {
  employers?: { name: string; sector: string; employees: string; distance: string }[];
  stats?: { label: string; value: string; benchmark: string }[];
}

interface GalleryJson {
  url: string;
  caption: string;
  category: string;
}

// ═══════════════════════════════════════════════════════
// Amenity type → explore map tab mapping
// ═══════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════
// Fine Dining filtering constants
// ═══════════════════════════════════════════════════════

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

const DINING_NAME_EXCLUDE = new Set([
  'pei wei', "filiberto's", 'noodles & company', 'buffalo wild wings',
  'ono hawaiian bbq', "matt's big breakfast", 'the cheesecake factory',
  "dickey's barbecue pit", 'norterra shopping corridor (nearby)',
  'kierland commons', 'scottsdale quarter', 'hb wellness',
  'casa del monte central location', 'best life nutrition',
  "chili's", 'olive garden', 'downtown carefree shops & galleries',
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

// ═══════════════════════════════════════════════════════
// Helper: format cuisine label
// ═══════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════
// Helper: determine restaurant tier
// ═══════════════════════════════════════════════════════

function getTier(googleType: string | undefined, rating: number): number {
  if (!googleType) return 9;
  if (TIER1_TYPES.has(googleType)) return 1;
  if (TIER2_TYPES.has(googleType)) return 2;
  if (googleType === 'restaurant' && rating >= 4.0) return 3;
  if (!DINING_EXCLUDE.has(googleType)) return 3;
  return 9;
}

// ═══════════════════════════════════════════════════════
// Build functions
// ═══════════════════════════════════════════════════════

function buildNarrative(community: CommunityRow): NarrativeData {
  const raw = community.narrative as NarrativeJson | null;
  const tagline = raw?.tagline ?? '';

  if (!raw?.body) {
    return { tabs: null, plainText: raw?.summary ?? null, tagline };
  }

  const body = raw.body;

  // Structured: body is an object with lead + sections
  if (typeof body === 'object' && 'lead' in body && 'sections' in body) {
    const tabs: NarrativeTab[] = body.sections.map(s => ({
      tab: s.tab,
      content: s.content,
    }));
    return { tabs, plainText: body.lead, tagline };
  }

  // String body — check paragraph count
  if (typeof body === 'string') {
    const paragraphs = body.split(/\n\n+/).filter(p => p.trim().length > 0);

    if (paragraphs.length > 2) {
      // Auto-chunk into 3 synthetic tabs
      const chunkSize = Math.ceil(paragraphs.length / 3);
      const chunks = [
        paragraphs.slice(0, chunkSize).join('\n\n'),
        paragraphs.slice(chunkSize, chunkSize * 2).join('\n\n'),
        paragraphs.slice(chunkSize * 2).join('\n\n'),
      ];
      const tabLabels = ['Legacy', 'Lifestyle', 'The Homes'];
      const tabs: NarrativeTab[] = tabLabels.map((tab, i) => ({
        tab,
        content: chunks[i] ?? '',
      }));
      return { tabs, plainText: null, tagline };
    }

    // Short string — plain text, no tabs
    return { tabs: null, plainText: body, tagline };
  }

  return { tabs: null, plainText: null, tagline };
}

function buildDemographics(community: CommunityRow): DemographicsData | null {
  const demo = community.demographics as DemographicsJson | null;
  if (!demo) return null;

  // Check if there's any actual data
  if (!demo.population && !demo.medianAge && !demo.medianIncome) return null;

  return {
    population: demo.population ? demo.population.toLocaleString() : '\u2014',
    medianAge: demo.medianAge ? String(demo.medianAge) : '\u2014',
    collegeEducated: demo.collegePct ? `${demo.collegePct}%` : '\u2014',
    householdIncome: demo.medianIncome
      ? demo.medianIncome >= 1_000_000
        ? `$${(demo.medianIncome / 1_000_000).toFixed(1)}M`
        : `$${Math.round(demo.medianIncome / 1000)}K`
      : '\u2014',
    homeOwnership: demo.homeOwnershipPct ? `${demo.homeOwnershipPct}%` : '\u2014',
    avgHomeValue: demo.medianHomeValue
      ? demo.medianHomeValue >= 1_000_000
        ? `$${(demo.medianHomeValue / 1_000_000).toFixed(1)}M`
        : `$${Math.round(demo.medianHomeValue / 1000)}K`
      : '\u2014',
  };
}

function buildAirports(community: CommunityRow): {
  private: AirportInfo;
  commercial: AirportInfo;
} {
  const loc = community.location_data as LocationJson | null;
  const airports = loc?.airports ?? [];

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
      distance: privateAirport?.distance ?? '\u2014',
    },
    commercial: {
      name: commercialAirport ? `${commercialAirport.name} (${commercialAirport.code})` : 'Phoenix Sky Harbor (PHX)',
      type: commercialAirport?.type ?? 'International',
      distance: commercialAirport?.distance ?? '\u2014',
    },
  };
}

function buildSignatureAmenity(
  community: CommunityRow,
  amenities: CommunityAmenityRow[],
): SignatureAmenity {
  const sig = amenities.find(a => a.is_signature);

  if (!sig) {
    return {
      icon: 'Shield',
      title: community.name,
      description: (community.narrative as NarrativeJson | null)?.summary ?? '',
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

  const statsArray = sig.stats as { value: string; label: string }[] | null;

  return {
    icon: iconMap[sig.type ?? ''] ?? 'Shield',
    title: sig.name,
    description: sig.description ?? '',
    stats: statsArray ?? [],
    image: sig.image ?? '',
  };
}

function buildSchools(community: CommunityRow, pois: PoiJson[]): School[] {
  const res = community.residential as ResidentialJson | null;
  const sd = res?.schoolDistrict;
  if (!sd) return [];

  const schools: School[] = [];

  const findSchoolPoi = (name: string) =>
    pois.find(p => p.type === 'school' && p.name === name);

  if (sd.highSchool) {
    const poi = findSchoolPoi(sd.highSchool);
    schools.push({
      name: sd.highSchool,
      type: 'Public High School',
      rating: poi?.rating ?? 0,
      distance: poi?.distanceMi ? `${poi.distanceMi.toFixed(1)} mi` : '\u2014',
    });
  }

  const privateSchools = sd.privateSchools ?? [];
  for (const ps of privateSchools) {
    const poi = findSchoolPoi(ps);
    schools.push({
      name: ps,
      type: 'Private',
      rating: poi?.rating ?? 0,
      distance: poi?.distanceMi ? `${poi.distanceMi.toFixed(1)} mi` : '\u2014',
    });
  }

  return schools.slice(0, 6);
}

function buildRestaurants(
  amenities: CommunityAmenityRow[],
  pois: PoiJson[],
): Restaurant[] {
  type Candidate = {
    name: string;
    cuisine: string;
    distance: string;
    rating: number;
    image: string;
    tier: number;
  };

  const seen = new Set<string>();
  const candidates: Candidate[] = [];

  // Collect from POIs (primary source — has googleType, rating, photos)
  for (const poi of pois) {
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
      distance: poi.distanceMi === 0 ? 'On-Site' : `${(poi.distanceMi ?? 0).toFixed(1)} mi`,
      rating: poi.rating ?? 0,
      image: poi.photoUrl,
      tier,
    });
  }

  // Supplement from amenity entities that are real restaurants
  const restaurantAmenities = amenities.filter(a => a.type === 'restaurant');
  for (const a of restaurantAmenities) {
    if (seen.has(a.name)) continue;
    if (DINING_NAME_EXCLUDE.has(a.name.toLowerCase())) continue;
    const poi = pois.find(p => p.type === 'restaurant' && p.name === a.name);
    if (!poi?.photoUrl || (poi.rating ?? 0) <= 0) continue;
    if (poi.googleType && DINING_EXCLUDE.has(poi.googleType)) continue;

    const tier = getTier(poi.googleType, poi.rating ?? 0);
    if (tier > 3) continue;

    seen.add(a.name);
    candidates.push({
      name: a.name,
      cuisine: formatCuisine(poi.subtype, poi.googleType),
      distance: poi.distanceMi === 0 ? 'On-Site' : `${(poi.distanceMi ?? 0).toFixed(1)} mi`,
      rating: poi.rating ?? 0,
      image: poi.photoUrl,
      tier,
    });
  }

  // If fewer than 4 candidates, relax: accept Tier 3 at rating >= 3.5
  if (candidates.length < 4) {
    for (const poi of pois) {
      if (poi.type !== 'restaurant' || seen.has(poi.name)) continue;
      if (!poi.googleType || DINING_EXCLUDE.has(poi.googleType)) continue;
      if (DINING_NAME_EXCLUDE.has(poi.name.toLowerCase())) continue;
      if ((poi.rating ?? 0) < 3.5 || !poi.photoUrl) continue;

      seen.add(poi.name);
      candidates.push({
        name: poi.name,
        cuisine: formatCuisine(poi.subtype, poi.googleType),
        distance: poi.distanceMi === 0 ? 'On-Site' : `${(poi.distanceMi ?? 0).toFixed(1)} mi`,
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

function buildQualityOfLife(community: CommunityRow): QualityMetric[] {
  const raw = community.quality_of_life;
  if (!raw) return [];

  // Handle both array format and object-with-array format
  const items: QualityOfLifeJson[] = Array.isArray(raw)
    ? raw as QualityOfLifeJson[]
    : [];

  if (items.length === 0) return [];

  return items.map(q => ({
    metric: q.metric,
    value: q.value,
    score: 0,
    icon: q.icon,
    color: q.color,
  }));
}

function buildExploreData(
  community: CommunityRow,
  amenities: CommunityAmenityRow[],
  pois: PoiJson[],
): ExploreData | null {
  const amenitiesWithCoords = amenities.filter(
    a => a.latitude !== null && a.longitude !== null
  );
  if (amenitiesWithCoords.length === 0) return null;

  const tabMap = new Map<string, {
    key: string;
    label: string;
    desc: string;
    markerColor: string;
    items: ExploreItem[];
  }>();

  let itemId = 1;
  for (const amenity of amenitiesWithCoords) {
    const tabConfig = AMENITY_TAB_MAP[amenity.type ?? ''];
    if (!tabConfig) continue;

    let tab = tabMap.get(tabConfig.key);
    if (!tab) {
      tab = { ...tabConfig, items: [] };
      tabMap.set(tabConfig.key, tab);
    }

    const coords: [number, number] = [amenity.longitude as number, amenity.latitude as number];
    const item: ExploreItem = {
      id: itemId++,
      name: amenity.name,
      coords,
    };

    // Type-specific fields
    if (amenity.type === 'restaurant') {
      const poi = pois.find(p => p.type === 'restaurant' && p.name === amenity.name);
      const cuisine = formatCuisine(poi?.subtype, poi?.googleType);
      const tags = amenity.tags ?? [];
      item.cuisine = cuisine !== 'Dining'
        ? cuisine
        : (tags.slice(0, 2).join(' \u00B7 ') || (amenity.description ?? '').slice(0, 50));
      if (poi?.rating) item.rating = poi.rating;
    }
    if (amenity.type === 'golf-course') {
      const tags = amenity.tags ?? [];
      item.type = tags.includes('jack-nicklaus') ? 'Jack Nicklaus Signature' :
                  tags.includes('tom-fazio') ? 'Tom Fazio Design' : 'Championship';
      item.holes = 18;
    }

    tab.items.push(item);
  }

  // Preferred tab order
  const tabOrder = ['golf', 'dining', 'trails', 'fitness', 'shopping', 'parks'];
  const tabs: ExploreTab[] = tabOrder
    .map(key => tabMap.get(key))
    .filter((t): t is NonNullable<typeof t> => t != null && t.items.length > 0);

  if (tabs.length === 0) return null;

  const center: [number, number] = community.longitude !== null && community.latitude !== null
    ? [community.longitude, community.latitude]
    : [0, 0];

  return { center, zoom: 13, tabs };
}

function buildGallery(community: CommunityRow): GalleryImage[] {
  const raw = community.gallery;
  if (!raw) return [];

  const items: GalleryJson[] = Array.isArray(raw)
    ? raw as GalleryJson[]
    : [];

  return items.map(g => ({
    url: g.url,
    caption: g.caption,
    category: g.category,
  }));
}

function buildStatsFromScorecard(
  scorecard: CommunityScorecard | null,
  community: CommunityRow,
): MarketStats | null {
  if (!scorecard) return null;

  const formatPrice = (v: number): string => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${Math.round(v / 1000)}K`;
    return `$${v}`;
  };

  return {
    avgPrice: formatPrice(scorecard.medianActivePrice || scorecard.avgActivePrice),
    priceRange: community.price_range ?? '\u2014',
    avgPpsf: `$${Math.round(scorecard.medianPricePerSqft || scorecard.avgPricePerSqft)}`,
    avgDom: scorecard.medianDom || scorecard.avgDom,
    inventory: scorecard.activeCount,
    trend: '\u2014',
  };
}

function buildMetricsFromScorecard(
  scorecard: CommunityScorecard | null,
  pulseData: MarketPulseRow[] | null,
): MarketMetric[] {
  if (!scorecard) return [];

  const metrics: MarketMetric[] = [];

  // Calculate trend from pulse data (compare last 3 months to prior 3)
  const calcTrend = (getValue: (row: MarketPulseRow) => number): { trend: string; trendDir: 'up' | 'down' | 'neutral' } => {
    if (!pulseData || pulseData.length < 6) return { trend: '\u2014', trendDir: 'neutral' };
    const recent = pulseData.slice(-3);
    const prior = pulseData.slice(-6, -3);
    const recentAvg = recent.reduce((sum, r) => sum + getValue(r), 0) / recent.length;
    const priorAvg = prior.reduce((sum, r) => sum + getValue(r), 0) / prior.length;
    if (priorAvg === 0) return { trend: '\u2014', trendDir: 'neutral' };
    const pct = ((recentAvg - priorAvg) / priorAvg) * 100;
    const dir = pct > 1 ? 'up' : pct < -1 ? 'down' : 'neutral';
    return { trend: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`, trendDir: dir };
  };

  const priceTrend = calcTrend(r => r.medianClosePrice);
  const ppsfTrend = calcTrend(r => r.medianPricePerSqft);
  const domTrend = calcTrend(r => r.medianDom);

  const formatPrice = (v: number): string => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${Math.round(v / 1000)}K`;
    return `$${v}`;
  };

  metrics.push({
    label: 'Median Price',
    value: formatPrice(scorecard.medianActivePrice || scorecard.avgActivePrice),
    numericValue: scorecard.medianActivePrice || scorecard.avgActivePrice,
    suffix: '',
    trend: priceTrend.trend,
    trendDir: priceTrend.trendDir,
    description: 'Median active listing price',
  });

  metrics.push({
    label: 'Price/Sq Ft',
    value: `$${Math.round(scorecard.medianPricePerSqft || scorecard.avgPricePerSqft)}`,
    numericValue: scorecard.medianPricePerSqft || scorecard.avgPricePerSqft,
    suffix: '/sqft',
    trend: ppsfTrend.trend,
    trendDir: ppsfTrend.trendDir,
    description: 'Median price per square foot',
  });

  metrics.push({
    label: 'Days on Market',
    value: String(scorecard.medianDom || scorecard.avgDom),
    numericValue: scorecard.medianDom || scorecard.avgDom,
    suffix: ' days',
    trend: domTrend.trend,
    trendDir: domTrend.trendDir,
    description: 'Median days on market',
  });

  metrics.push({
    label: 'Active Listings',
    value: String(scorecard.activeCount),
    numericValue: scorecard.activeCount,
    suffix: '',
    trend: '\u2014',
    trendDir: 'neutral',
    description: 'Current active inventory',
  });

  if (scorecard.avgCloseToListRatio > 0) {
    metrics.push({
      label: 'Close/List Ratio',
      value: `${(scorecard.avgCloseToListRatio * 100).toFixed(1)}%`,
      numericValue: scorecard.avgCloseToListRatio,
      suffix: '%',
      trend: '\u2014',
      trendDir: 'neutral',
      description: 'Average close-to-list price ratio',
    });
  }

  return metrics;
}

function buildKeyDistances(community: CommunityRow): KeyDistance[] {
  const loc = community.location_data as LocationJson | null;
  const distances = loc?.keyDistances ?? [];
  return distances.map(kd => ({
    place: kd.label,
    time: kd.distance,
  }));
}

function buildEmployers(community: CommunityRow): Employer[] {
  const eco = community.economy as EconomyJson | null;
  return eco?.employers ?? [];
}

function buildEconomicStats(community: CommunityRow): EconomicStat[] {
  const eco = community.economy as EconomyJson | null;
  return eco?.stats ?? [];
}

function extractPois(community: CommunityRow): PoiJson[] {
  const raw = community.pois;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as PoiJson[];
  return [];
}

// ═══════════════════════════════════════════════════════
// Main adapter export
// ═══════════════════════════════════════════════════════

export function adaptCommunityData(
  community: CommunityRow,
  amenities: CommunityAmenityRow[],
  scorecard: CommunityScorecard | null,
  pulseData: MarketPulseRow[] | null,
): CommunityPageData {
  const pois = extractPois(community);
  const loc = community.location_data as LocationJson | null;

  const coordinates: [number, number] | null =
    community.latitude !== null && community.longitude !== null
      ? [community.longitude, community.latitude]
      : null;

  return {
    // Identity
    id: community.id,
    name: community.name,
    city: community.city ?? '',
    zipCode: community.zip_code ?? '',
    elevation: loc?.elevation ?? '\u2014',
    priceRange: community.price_range ?? '\u2014',
    gating: community.gating ?? 'Non-Gated',
    heroImage: community.hero_image ?? '',
    website: community.website ?? '',
    tags: community.tags ?? [],
    coordinates,
    boundaryGeoJson: community.boundary_geojson ?? null,

    // Hierarchy
    regionId: community.region_id,
    regionName: community.region_name,
    sectionLabel: community.section_label ?? null,

    // Content
    narrative: buildNarrative(community),
    stats: buildStatsFromScorecard(scorecard, community),
    metrics: buildMetricsFromScorecard(scorecard, pulseData),
    gallery: buildGallery(community),

    // Community data
    demographics: buildDemographics(community),
    qualityOfLife: buildQualityOfLife(community),
    schools: buildSchools(community, pois),
    restaurants: buildRestaurants(amenities, pois),

    // Economy
    employers: buildEmployers(community),
    economicStats: buildEconomicStats(community),

    // Transportation
    airports: buildAirports(community),
    keyDistances: buildKeyDistances(community),

    // Amenities
    signatureAmenity: buildSignatureAmenity(community, amenities),
    exploreData: buildExploreData(community, amenities, pois),
  };
}
