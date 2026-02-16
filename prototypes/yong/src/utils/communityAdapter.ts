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
  'clubhouse': { key: 'dining', label: 'Dining', desc: 'Fine dining & casual', markerColor: '#E07A5F' },
  'shopping': { key: 'shopping', label: 'Shopping', desc: 'Retail & boutiques', markerColor: '#9B59B6' },
  'park': { key: 'parks', label: 'Parks', desc: 'Parks & recreation', markerColor: '#27AE60' },
};

function buildExploreData(community: ResolvedCommunity) {
  const amenitiesWithCoords = community.amenities.filter(a => a.coordinates !== null);
  if (amenitiesWithCoords.length === 0) return null;

  // Group amenities into tabs
  const tabMap = new Map<string, {
    key: string; label: string; desc: string; markerColor: string;
    items: { id: number; name: string; coords: [number, number]; cuisine?: string; type?: string; holes?: number }[];
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
    const item: { id: number; name: string; coords: [number, number]; cuisine?: string; type?: string; holes?: number } = {
      id: itemId++,
      name: amenity.name,
      coords,
    };

    // Type-specific fields
    if (amenity.type === 'restaurant' || amenity.type === 'clubhouse') {
      item.cuisine = amenity.tags.slice(0, 2).join(' · ') || amenity.description.slice(0, 50);
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

function buildRestaurants(community: ResolvedCommunity) {
  const restaurants: { name: string; cuisine: string; distance: string; rating: number; image: string }[] = [];

  // Helper: find enriched POI data for a restaurant by name
  const findRestaurantPoi = (name: string) =>
    community.pois?.find(p => p.type === 'restaurant' && p.name === name);

  // From amenity entities
  const diningAmenities = community.amenities.filter(
    (a: AmenityEntity) => a.type === 'restaurant' ||
      (a.type === 'clubhouse' && a.tags.some(t => t.includes('dining'))) ||
      (a.type === 'golf-course' && a.tags.some(t => t.includes('dining')))
  );
  for (const a of diningAmenities) {
    const poi = findRestaurantPoi(a.name);
    restaurants.push({
      name: a.name,
      cuisine: a.tags.filter(t => !['dining', 'restaurant'].includes(t)).slice(0, 2).join(' · ') || a.description.slice(0, 40),
      distance: poi?.distanceMi != null
        ? (poi.distanceMi === 0 ? 'On-Site' : `${poi.distanceMi.toFixed(1)} mi`)
        : '—',
      rating: poi?.rating ?? 0,
      image: poi?.photoUrl ?? '',
    });
  }

  // Supplement from POIs
  if (community.pois) {
    for (const poi of community.pois) {
      if (poi.type === 'restaurant' && !restaurants.some(r => r.name === poi.name)) {
        restaurants.push({
          name: poi.name,
          cuisine: poi.subtype ?? 'Dining',
          distance: poi.distanceMi === 0 ? 'On-Site' : `${poi.distanceMi.toFixed(1)} mi`,
          rating: poi.rating ?? 0,
          image: poi.photoUrl ?? '',
        });
      }
    }
  }

  return restaurants.slice(0, 6);
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
