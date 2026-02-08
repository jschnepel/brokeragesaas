// Default/shared data for community pages
// Communities override only what's different

export interface Listing {
  id: number;
  price: string;
  ppsf: string;
  beds: number;
  baths: number;
  sqft: number;
  address: string;
  status: 'Active' | 'Pending' | 'Coming Soon';
  lot: string;
  img: string;
}

export interface MarketMetric {
  label: string;
  value: string;
  numericValue: number;
  suffix: string;
  trend: string;
  trendDir: 'up' | 'down' | 'neutral';
  description: string;
}

export interface School {
  name: string;
  type: string;
  rating: number;
  distance: string;
  students: number;
  highlight: string;
}

export interface Restaurant {
  name: string;
  cuisine: string;
  location: string;
  distance: string;
  priceRange: string;
  rating: number;
  image: string;
  highlight: string;
}

export interface QualityMetric {
  metric: string;
  value: string;
  score: number;
  icon: string;
  color: string;
}

export interface Employer {
  name: string;
  sector: string;
  employees: string;
  distance: string;
}

export interface EconomicStat {
  label: string;
  value: string;
  benchmark: string;
}

export interface GalleryImage {
  url: string;
  caption: string;
  category: string;
}

export interface LifestyleFeature {
  icon: string;
  title: string;
  description: string;
  image: string;
}

export interface KeyDistance {
  place: string;
  time: string;
  miles: string;
}

export interface CommunityData {
  // Core Info
  id: string;
  name: string;
  city: string;
  region: string;
  tagline: string;
  description: string;
  narrative: string;
  heroImage: string;
  elevation: string;
  zipCode: string;
  coordinates: [number, number];

  // Market Stats
  stats: {
    avgPrice: string;
    priceRange: string;
    avgPpsf: string;
    avgDom: number;
    inventory: number;
    trend: string;
  };

  // Market Metrics (KPI Dashboard)
  metrics: MarketMetric[];

  // Features & Amenities
  features: string[];
  amenities: string[];

  // Lifestyle Features
  lifestyleFeatures: LifestyleFeature[];

  // Gallery
  gallery: GalleryImage[];

  // Demographics
  demographics: {
    population: string;
    medianAge: string;
    collegeEducated: string;
    householdIncome: string;
    homeOwnership: string;
    avgHomeValue: string;
  };

  // Quality of Life
  qualityOfLife: QualityMetric[];

  // Schools
  schools: School[];

  // Dining
  restaurants: Restaurant[];

  // Employment & Economy
  employers: Employer[];
  economicStats: EconomicStat[];

  // Transportation
  airports: {
    private: { name: string; type: string; distance: string; details: string };
    commercial: { name: string; type: string; distance: string; details: string };
  };
  keyDistances: KeyDistance[];

  // Signature Amenity
  signatureAmenity: {
    icon: string;
    title: string;
    description: string;
    stats: { value: string; label: string }[];
    image: string;
  };

  // Featured Listings
  listings: Listing[];
}

// ============================================
// DEFAULT VALUES - Shared across communities
// ============================================

export const DEFAULT_AIRPORTS = {
  private: {
    name: 'Scottsdale Airport (KSDL)',
    type: 'Private/Executive',
    distance: '15 min',
    details: 'FBO services, Gulfstream capable runway',
  },
  commercial: {
    name: 'Phoenix Sky Harbor (PHX)',
    type: 'International',
    distance: '35 min',
    details: 'Direct flights to 100+ destinations',
  },
};

export const DEFAULT_ECONOMIC_STATS: EconomicStat[] = [
  { label: 'Unemployment Rate', value: '2.8%', benchmark: 'vs 3.7% National' },
  { label: 'Job Growth (YoY)', value: '+4.2%', benchmark: 'Tech & Healthcare' },
  { label: 'Median Household', value: '$425K', benchmark: 'Top 1% Nationally' },
  { label: 'Remote Work', value: '38%', benchmark: 'Work from Home' },
];

export const DEFAULT_EMPLOYERS: Employer[] = [
  { name: 'Mayo Clinic Arizona', sector: 'Healthcare', employees: '6,500+', distance: '12 mi' },
  { name: 'Scottsdale Healthcare', sector: 'Healthcare', employees: '4,200+', distance: '8 mi' },
  { name: 'General Dynamics', sector: 'Aerospace', employees: '3,800+', distance: '15 mi' },
  { name: 'CVS Health', sector: 'Corporate HQ', employees: '2,500+', distance: '10 mi' },
];

export const DEFAULT_QUALITY_OF_LIFE: QualityMetric[] = [
  { metric: 'Air Quality', value: 'Good', score: 92, icon: 'Wind', color: 'emerald' },
  { metric: 'Sunny Days', value: '299/yr', score: 82, icon: 'Sun', color: 'amber' },
  { metric: 'Crime Rate', value: 'Very Low', score: 95, icon: 'Shield', color: 'blue' },
  { metric: 'Healthcare', value: 'Excellent', score: 98, icon: 'Activity', color: 'rose' },
  { metric: 'Noise Level', value: 'Minimal', score: 96, icon: 'VolumeX', color: 'indigo' },
  { metric: 'Light Pollution', value: 'Dark Sky', score: 94, icon: 'Moon', color: 'purple' },
];

// North Scottsdale Schools (shared by N. Scottsdale communities)
export const NORTH_SCOTTSDALE_SCHOOLS: School[] = [
  { name: 'Pinnacle Peak Preparatory', type: 'Private K-8', rating: 10, distance: '3 mi', students: 450, highlight: 'Blue Ribbon School' },
  { name: 'Desert Mountain High School', type: 'Public 9-12', rating: 9, distance: '4 mi', students: 2100, highlight: 'STEM Excellence' },
  { name: 'Scottsdale Country Day', type: 'Private K-12', rating: 10, distance: '5 mi', students: 680, highlight: 'IB Program' },
  { name: 'Basis Scottsdale', type: 'Charter 5-12', rating: 10, distance: '6 mi', students: 1200, highlight: '#1 in Arizona' },
];

export const CENTRAL_SCOTTSDALE_SCHOOLS: School[] = [
  { name: 'Chaparral High School', type: 'Public 9-12', rating: 9, distance: '2 mi', students: 2400, highlight: 'Top Athletics' },
  { name: 'Scottsdale Preparatory', type: 'Charter 7-12', rating: 10, distance: '3 mi', students: 600, highlight: 'Great Books' },
  { name: 'Notre Dame Preparatory', type: 'Private 6-12', rating: 9, distance: '4 mi', students: 900, highlight: 'College Prep' },
  { name: 'Kiva Elementary', type: 'Public K-6', rating: 9, distance: '2 mi', students: 550, highlight: 'STEM Focus' },
];

export const PARADISE_VALLEY_SCHOOLS: School[] = [
  { name: 'Phoenix Country Day', type: 'Private K-12', rating: 10, distance: '3 mi', students: 750, highlight: 'Elite Academics' },
  { name: 'Arcadia High School', type: 'Public 9-12', rating: 9, distance: '5 mi', students: 2800, highlight: 'Top 100 US' },
  { name: 'Xavier College Prep', type: 'Private 9-12', rating: 10, distance: '6 mi', students: 1200, highlight: 'All-Girls' },
  { name: 'Brophy College Prep', type: 'Private 9-12', rating: 10, distance: '7 mi', students: 1350, highlight: 'Jesuit' },
];

export const CAREFREE_SCHOOLS: School[] = [
  { name: 'Cactus Shadows High School', type: 'Public 9-12', rating: 8, distance: '2 mi', students: 1800, highlight: 'Arts Programs' },
  { name: 'Sonoran Trails Middle School', type: 'Public 6-8', rating: 8, distance: '3 mi', students: 800, highlight: 'STEM' },
  { name: 'Black Mountain Elementary', type: 'Public K-5', rating: 9, distance: '2 mi', students: 500, highlight: 'A+ Rated' },
  { name: 'Desert Sun Academy', type: 'Charter K-8', rating: 9, distance: '4 mi', students: 450, highlight: 'Montessori' },
];

// North Scottsdale Restaurants
export const NORTH_SCOTTSDALE_RESTAURANTS: Restaurant[] = [
  { name: 'Talavera', cuisine: 'Southwestern Fine Dining', location: 'Four Seasons Scottsdale', distance: '8 min', priceRange: '$$$$', rating: 4.8, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=600', highlight: 'Desert Views' },
  { name: 'Toca Madera', cuisine: 'Modern Mexican', location: 'Scottsdale Quarter', distance: '12 min', priceRange: '$$$', rating: 4.7, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600', highlight: 'Trendy Scene' },
  { name: "Mastro's City Hall", cuisine: 'Steakhouse', location: 'Old Town Scottsdale', distance: '18 min', priceRange: '$$$$', rating: 4.9, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600', highlight: 'Prime Steaks' },
  { name: 'Café Monarch', cuisine: 'New American', location: 'Old Town Scottsdale', distance: '20 min', priceRange: '$$$$', rating: 4.9, image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=600', highlight: 'Tasting Menu' },
  { name: 'Deseo', cuisine: 'Latin Fusion', location: 'Westin Kierland', distance: '15 min', priceRange: '$$$', rating: 4.6, image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600', highlight: 'Resort Dining' },
  { name: 'Bourbon & Bones', cuisine: 'Steakhouse & Whiskey', location: 'Kierland Commons', distance: '14 min', priceRange: '$$$', rating: 4.5, image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&q=80&w=600', highlight: '200+ Whiskeys' },
];

export const PARADISE_VALLEY_RESTAURANTS: Restaurant[] = [
  { name: 'Elements', cuisine: 'American Contemporary', location: 'Sanctuary Resort', distance: '5 min', priceRange: '$$$$', rating: 4.9, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=600', highlight: 'Mountain Views' },
  { name: 'LON\'s at the Hermosa', cuisine: 'Arizona Cuisine', location: 'Hermosa Inn', distance: '8 min', priceRange: '$$$$', rating: 4.8, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600', highlight: 'Historic Hacienda' },
  { name: 'Prado', cuisine: 'Spanish', location: 'Omni Montelucia', distance: '6 min', priceRange: '$$$', rating: 4.7, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600', highlight: 'Tapas & Paella' },
  { name: 'T. Cook\'s', cuisine: 'Mediterranean', location: 'Royal Palms Resort', distance: '10 min', priceRange: '$$$$', rating: 4.8, image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=600', highlight: 'Romantic Setting' },
];

export const CAREFREE_RESTAURANTS: Restaurant[] = [
  { name: 'Latilla', cuisine: 'Southwestern', location: 'Boulders Resort', distance: '5 min', priceRange: '$$$$', rating: 4.7, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=600', highlight: 'Boulder Views' },
  { name: 'The Horny Toad', cuisine: 'American', location: 'Cave Creek', distance: '8 min', priceRange: '$$', rating: 4.5, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600', highlight: 'Western Charm' },
  { name: 'Cartwright\'s', cuisine: 'Sonoran Cuisine', location: 'Cave Creek', distance: '10 min', priceRange: '$$$', rating: 4.6, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600', highlight: 'Local Favorite' },
  { name: 'Tonto Bar & Grill', cuisine: 'Southwestern', location: 'Cave Creek', distance: '10 min', priceRange: '$$', rating: 4.4, image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=600', highlight: 'Live Music' },
];

// Key Distances by Region
export const NORTH_SCOTTSDALE_DISTANCES: KeyDistance[] = [
  { place: 'Old Town Scottsdale', time: '20 min', miles: '14 mi' },
  { place: 'Scottsdale Fashion Square', time: '18 min', miles: '12 mi' },
  { place: 'Kierland Commons', time: '15 min', miles: '9 mi' },
  { place: 'Phoenix Sky Harbor', time: '35 min', miles: '28 mi' },
];

export const CENTRAL_SCOTTSDALE_DISTANCES: KeyDistance[] = [
  { place: 'Old Town Scottsdale', time: '10 min', miles: '5 mi' },
  { place: 'Scottsdale Fashion Square', time: '8 min', miles: '4 mi' },
  { place: 'Kierland Commons', time: '10 min', miles: '6 mi' },
  { place: 'Phoenix Sky Harbor', time: '20 min', miles: '12 mi' },
];

export const PARADISE_VALLEY_DISTANCES: KeyDistance[] = [
  { place: 'Old Town Scottsdale', time: '12 min', miles: '6 mi' },
  { place: 'Scottsdale Fashion Square', time: '10 min', miles: '5 mi' },
  { place: 'Biltmore Fashion Park', time: '8 min', miles: '4 mi' },
  { place: 'Phoenix Sky Harbor', time: '18 min', miles: '10 mi' },
];

export const CAREFREE_DISTANCES: KeyDistance[] = [
  { place: 'Old Town Scottsdale', time: '30 min', miles: '22 mi' },
  { place: 'Kierland Commons', time: '25 min', miles: '18 mi' },
  { place: 'Desert Ridge', time: '20 min', miles: '15 mi' },
  { place: 'Scottsdale Airport', time: '25 min', miles: '18 mi' },
];

// Default Lifestyle Features
export const GOLF_LIFESTYLE_FEATURES: LifestyleFeature[] = [
  { icon: 'Mountain', title: 'Mountain Preserve', description: 'Direct trail access to pristine Sonoran Desert preserve.', image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=600' },
  { icon: 'TreePine', title: 'Desert Sanctuary', description: 'Native landscaping with centuries-old saguaros and protected wildlife.', image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&q=80&w=600' },
  { icon: 'Shield', title: 'Gated Privacy', description: '24/7 manned security with advanced surveillance and controlled access.', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600' },
  { icon: 'Zap', title: 'Smart Infrastructure', description: 'Fiber optic connectivity and underground utilities throughout.', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=600' },
];

// Default Gallery Images
export const DEFAULT_GALLERY: GalleryImage[] = [
  { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200', caption: 'Contemporary Desert Architecture', category: 'Homes' },
  { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=1200', caption: 'Sonoran Desert Landscape', category: 'Nature' },
  { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200', caption: 'Luxury Interior Living', category: 'Interiors' },
  { url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1200', caption: 'World-Class Golf', category: 'Lifestyle' },
  { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200', caption: 'Sunset Over the Valley', category: 'Views' },
  { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1200', caption: 'Resort-Style Living', category: 'Pools' },
];

// Default Featured Listings
export const DEFAULT_LISTINGS: Listing[] = [
  { id: 1, price: "$4,850,000", ppsf: "$892", beds: 5, baths: 5.5, sqft: 5430, address: "1024 Desert Vista Dr", status: "Active", lot: "1.4 Acres", img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800" },
  { id: 2, price: "$2,975,000", ppsf: "$714", beds: 4, baths: 4, sqft: 4165, address: "8842 Sonoran Ridge", status: "Pending", lot: "0.8 Acres", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800" },
  { id: 3, price: "$7,200,000", ppsf: "$1,104", beds: 6, baths: 7.5, sqft: 6520, address: "12 Canyon Overlook", status: "Active", lot: "2.1 Acres", img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800" },
  { id: 4, price: "$3,450,000", ppsf: "$780", beds: 4, baths: 4.5, sqft: 4420, address: "901 Desert Bloom Cir", status: "Active", lot: "1.1 Acres", img: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800" },
  { id: 5, price: "$5,200,000", ppsf: "$845", beds: 5, baths: 6, sqft: 6150, address: "4501 N Saguaro Way", status: "Coming Soon", lot: "1.8 Acres", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800" },
  { id: 6, price: "$3,875,000", ppsf: "$762", beds: 4, baths: 5, sqft: 5085, address: "7722 E Mountain View", status: "Active", lot: "1.2 Acres", img: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800" },
];

// Helper to generate metrics from stats
export const generateMetrics = (avgPrice: string, dom: number, ppsf: string, trend: string): MarketMetric[] => {
  const priceNum = parseFloat(avgPrice.replace(/[$M,]/g, ''));
  const ppsfNum = parseInt(ppsf.replace(/[$,]/g, ''));
  const trendNum = parseFloat(trend.replace(/[+%]/g, ''));

  return [
    { label: "Median List Price", value: avgPrice, numericValue: priceNum, suffix: "M", trend: trend, trendDir: trendNum > 0 ? 'up' : 'down', description: "12-Month Rolling Avg" },
    { label: "Avg Days on Market", value: String(dom), numericValue: dom, suffix: "", trend: dom < 30 ? "-8%" : "+5%", trendDir: dom < 30 ? 'down' : 'up', description: dom < 30 ? "High Velocity" : "Moderate Pace" },
    { label: "Price Per SqFt", value: ppsf, numericValue: ppsfNum, suffix: "", trend: `+$${Math.round(ppsfNum * 0.05)}`, trendDir: 'up', description: "Sector Leading" },
    { label: "Absorption Rate", value: dom < 30 ? "1.4 Mo" : "2.8 Mo", numericValue: dom < 30 ? 1.4 : 2.8, suffix: " Mo", trend: dom < 30 ? "Hot" : "Balanced", trendDir: 'neutral', description: dom < 30 ? "Seller's Market" : "Balanced Market" },
  ];
};

// Helper to generate demographics from price
export const generateDemographics = (avgPrice: string) => {
  const priceNum = parseFloat(avgPrice.replace(/[$MK,]/g, ''));
  const isLuxury = priceNum > 2;

  return {
    population: isLuxury ? '2,450' : '8,200',
    medianAge: isLuxury ? '52' : '45',
    collegeEducated: isLuxury ? '78%' : '62%',
    householdIncome: isLuxury ? '$425K' : '$185K',
    homeOwnership: isLuxury ? '94%' : '78%',
    avgHomeValue: avgPrice,
  };
};
