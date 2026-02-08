// =====================================================
// SEED DATA FOR PROTOTYPE
// Phoenix Luxury Real Estate - Yong Choi
// =====================================================

export const agent = {
  id: 'b0000000-0000-0000-0000-000000000001',
  name: 'Yong Choi',
  firstName: 'Yong',
  lastName: 'Choi',
  email: 'yong@yongchoirealestate.com',
  phone: '(480) 555-0188',
  licenseNumber: 'SA123456789',
  brokerageName: "Russ Lyon Sotheby's International Realty",
  brokerageAddress: '7135 E Camelback Rd #100, Scottsdale, AZ 85251',
  brokeragePhone: '(480) 603-3310',
  headshot: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
  bio: `Yong Choi brings a unique blend of financial expertise and real estate acumen to Arizona's luxury market. With a background in investment banking and over a decade of experience in Phoenix-area real estate, Yong specializes in helping discerning clients find exceptional properties in Paradise Valley, Scottsdale, and the greater Phoenix area.

As a member of Russ Lyon Sotheby's International Realty, Yong leverages the world's most prestigious luxury brand to provide unparalleled marketing exposure for sellers and exclusive access to off-market opportunities for buyers.`,
  specializations: ['Luxury Homes', 'Paradise Valley', 'Scottsdale', 'Investment Properties', 'Relocation'],
  social: {
    linkedin: 'https://linkedin.com/in/yongchoi',
    instagram: 'https://instagram.com/yongchoirealestate',
    facebook: 'https://facebook.com/yongchoirealestate',
  },
};

export const siteConfig = {
  siteName: 'Yong Choi Real Estate',
  tagline: 'Luxury Arizona Living, Expertly Curated',
  domain: 'yongchoirealestate.com',
  colors: {
    primary: '#1a365d',    // Deep navy blue
    secondary: '#c6a052',  // Warm gold
    accent: '#2c5282',
  },
  fonts: {
    heading: 'Playfair Display',
    body: 'Inter',
  },
  seo: {
    title: "Yong Choi | Luxury Arizona Real Estate | Russ Lyon Sotheby's",
    description: 'Discover exceptional luxury properties in Paradise Valley, Scottsdale, and Phoenix with Yong Choi of Russ Lyon Sotheby\'s International Realty.',
  },
  officeHours: {
    monday: '9:00 AM - 6:00 PM',
    tuesday: '9:00 AM - 6:00 PM',
    wednesday: '9:00 AM - 6:00 PM',
    thursday: '9:00 AM - 6:00 PM',
    friday: '9:00 AM - 6:00 PM',
    saturday: '10:00 AM - 4:00 PM',
    sunday: 'By Appointment',
  },
};

export interface Neighborhood {
  id: string;
  slug: string;
  name: string;
  city: string;
  description: string;
  shortDescription: string;
  heroImage: string;
  medianPrice: number;
  avgPricePerSqft: number;
  avgDaysOnMarket: number;
  priceRange: { low: number; high: number };
  lifestyleTags: string[];
  amenities: string[];
  featured: boolean;
}

export const neighborhoods: Neighborhood[] = [
  {
    id: 'n-paradise-valley',
    slug: 'paradise-valley',
    name: 'Paradise Valley',
    city: 'Paradise Valley',
    description: "Paradise Valley is Arizona's most prestigious residential community, home to exclusive estates nestled against Camelback Mountain and Mummy Mountain. This town of approximately 14,000 residents maintains a rural atmosphere with no commercial development, preserving its character as a sanctuary for those seeking privacy and luxury.",
    shortDescription: "Arizona's most exclusive residential enclave featuring mountain estates and world-class resorts",
    heroImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600',
    medianPrice: 4850000,
    avgPricePerSqft: 625,
    avgDaysOnMarket: 95,
    priceRange: { low: 1500000, high: 35000000 },
    lifestyleTags: ['Luxury', 'Golf', 'Mountain Views', 'Resort Living', 'Privacy', 'Equestrian'],
    amenities: ['Private Golf Clubs', 'World-Class Resorts', 'Hiking Trails', 'Tennis', 'Spa & Wellness'],
    featured: true,
  },
  {
    id: 'n-arcadia',
    slug: 'arcadia',
    name: 'Arcadia',
    city: 'Phoenix',
    description: "Arcadia is Phoenix's most coveted neighborhood, stretching from the slopes of Camelback Mountain south to the Arizona Canal. Known for its tree-lined streets, citrus groves, and architectural diversity, Arcadia attracts buyers seeking character homes with generous lots.",
    shortDescription: 'Tree-lined streets and citrus groves at the base of Camelback Mountain',
    heroImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600',
    medianPrice: 2250000,
    avgPricePerSqft: 485,
    avgDaysOnMarket: 45,
    priceRange: { low: 850000, high: 12000000 },
    lifestyleTags: ['Walkable', 'Family-Friendly', 'Urban Luxury', 'Historic Character', 'Foodie Scene'],
    amenities: ['Camelback Mountain Hiking', 'La Grande Orange', 'Postino', 'Top Schools', 'Arizona Canal'],
    featured: true,
  },
  {
    id: 'n-biltmore',
    slug: 'biltmore',
    name: 'Biltmore',
    city: 'Phoenix',
    description: "The Biltmore area encompasses the iconic Arizona Biltmore Resort and its surrounding residential communities, representing Phoenix's original luxury destination since 1929. Guard-gated enclaves like Biltmore Estates offer security and exclusivity.",
    shortDescription: 'Iconic resort community with Frank Lloyd Wright-inspired architecture',
    heroImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600',
    medianPrice: 1850000,
    avgPricePerSqft: 425,
    avgDaysOnMarket: 55,
    priceRange: { low: 650000, high: 8500000 },
    lifestyleTags: ['Golf', 'Resort Living', 'Guard-Gated', 'Historic', 'Shopping'],
    amenities: ['Arizona Biltmore Golf Club', 'Biltmore Fashion Park', 'Guard-Gated Communities', 'Spa & Dining'],
    featured: true,
  },
  {
    id: 'n-dc-ranch',
    slug: 'dc-ranch',
    name: 'DC Ranch',
    city: 'Scottsdale',
    description: "DC Ranch is a 4,000-acre master-planned community in North Scottsdale, consistently ranked among America's best places to live. The community offers diverse neighborhoods from The Village at DC Ranch with its main-street shopping to the ultra-exclusive Silverleaf enclave.",
    shortDescription: 'Premier master-planned community with world-class amenities',
    heroImage: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1600',
    medianPrice: 2650000,
    avgPricePerSqft: 485,
    avgDaysOnMarket: 65,
    priceRange: { low: 800000, high: 15000000 },
    lifestyleTags: ['Golf', 'Family-Friendly', 'Trails', 'Community Events', 'Shopping Village'],
    amenities: ['Country Club at DC Ranch', 'Market Street', 'Community Center', 'Desert Trails', 'McDowell Sonoran Preserve'],
    featured: true,
  },
  {
    id: 'n-silverleaf',
    slug: 'silverleaf',
    name: 'Silverleaf at DC Ranch',
    city: 'Scottsdale',
    description: "Silverleaf represents the pinnacle of Arizona luxury living, an ultra-exclusive community within DC Ranch featuring custom estates on premium homesites. The Tom Weiskopf-designed Silverleaf Club offers a private 18-hole golf course and 50,000-square-foot clubhouse.",
    shortDescription: 'Ultra-exclusive enclave with private Tom Weiskopf golf course',
    heroImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600',
    medianPrice: 6500000,
    avgPricePerSqft: 750,
    avgDaysOnMarket: 120,
    priceRange: { low: 3000000, high: 25000000 },
    lifestyleTags: ['Ultra-Luxury', 'Private Golf', 'Mountain Views', 'Exclusivity', 'Desert Contemporary'],
    amenities: ['Silverleaf Club (Private)', 'Spa & Wellness', 'Fine Dining', 'Concierge Services'],
    featured: true,
  },
  {
    id: 'n-desert-mountain',
    slug: 'desert-mountain',
    name: 'Desert Mountain',
    city: 'Scottsdale',
    description: "Desert Mountain is an 8,300-acre private community in the Sonoran Desert foothills, renowned for having six Jack Nicklaus-designed golf courses. This gated community offers diverse residential options from villas to sprawling estates.",
    shortDescription: 'Private community with six Jack Nicklaus golf courses',
    heroImage: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1600',
    medianPrice: 2150000,
    avgPricePerSqft: 435,
    avgDaysOnMarket: 85,
    priceRange: { low: 600000, high: 12000000 },
    lifestyleTags: ['Golf', 'Tennis', 'Active Adult', 'Gated', 'Mountain Views'],
    amenities: ['Six Golf Courses', 'Sonoran Clubhouse', 'Tennis Center', 'Hiking Trails', 'Multiple Dining Venues'],
    featured: true,
  },
];

export interface Property {
  id: string;
  mlsNumber: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  neighborhood: string;
  neighborhoodSlug: string;
  price: number;
  originalPrice?: number;
  pricePerSqft: number;
  propertyType: string;
  beds: number;
  baths: number;
  sqft: number;
  lotAcres?: number;
  yearBuilt: number;
  stories: number;
  description: string;
  features: string[];
  interiorFeatures: string[];
  exteriorFeatures: string[];
  hasGarage: boolean;
  garageSpaces: number;
  hasPool: boolean;
  poolFeatures: string[];
  hasHoa: boolean;
  hoaFee?: number;
  hoaFrequency?: string;
  photos: { url: string; order: number; caption: string }[];
  virtualTourUrl?: string;
  status: 'Active' | 'Pending' | 'Sold' | 'Coming Soon';
  daysOnMarket: number;
  listedAt: string;
  featured: boolean;
  luxury: boolean;
}

export const properties: Property[] = [
  {
    id: 'p-pv-001',
    mlsNumber: 'PV-2024-001',
    address: '5600 E Mockingbird Lane',
    city: 'Paradise Valley',
    state: 'AZ',
    zip: '85253',
    neighborhood: 'Paradise Valley',
    neighborhoodSlug: 'paradise-valley',
    price: 8750000,
    originalPrice: 8950000,
    pricePerSqft: 892,
    propertyType: 'Estate',
    beds: 6,
    baths: 7.5,
    sqft: 9810,
    lotAcres: 2.15,
    yearBuilt: 2021,
    stories: 2,
    description: "Architectural masterpiece by Drewett Works on over 2 acres in the heart of Paradise Valley. This contemporary desert estate seamlessly blends indoor-outdoor living with walls of glass that frame Camelback Mountain views. The great room features 20-foot ceilings, a floating fireplace, and opens to the infinity-edge pool and outdoor entertaining pavilion. Chef's kitchen with Gaggenau appliances, wine room, home theater, and separate guest casita. Smart home technology throughout.",
    features: ['Mountain Views', 'Guest House', 'Smart Home', 'Wine Cellar', 'Home Theater'],
    interiorFeatures: ['Great Room', 'Open Floor Plan', 'Wet Bar', 'Office/Study', 'Fireplace', 'High Ceilings'],
    exteriorFeatures: ['Infinity Pool', 'Outdoor Kitchen', 'Fire Pit', 'Desert Landscaping', 'Mountain Views'],
    hasGarage: true,
    garageSpaces: 4,
    hasPool: true,
    poolFeatures: ['Infinity Edge', 'Heated', 'Pebble Finish', 'Spa'],
    hasHoa: false,
    photos: [
      { url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200', order: 1, caption: 'Front Exterior' },
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200', order: 2, caption: 'Great Room' },
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200', order: 3, caption: 'Pool & Mountain View' },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200', order: 4, caption: 'Kitchen' },
      { url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200', order: 5, caption: 'Primary Suite' },
    ],
    status: 'Active',
    daysOnMarket: 45,
    listedAt: '2024-12-15',
    featured: true,
    luxury: true,
  },
  {
    id: 'p-pv-002',
    mlsNumber: 'PV-2024-002',
    address: '7001 N Quartz Mountain Road',
    city: 'Paradise Valley',
    state: 'AZ',
    zip: '85253',
    neighborhood: 'Paradise Valley',
    neighborhoodSlug: 'paradise-valley',
    price: 12500000,
    pricePerSqft: 1042,
    propertyType: 'Estate',
    beds: 7,
    baths: 9,
    sqft: 12000,
    lotAcres: 3.5,
    yearBuilt: 2019,
    stories: 2,
    description: "Extraordinary compound on 3.5 gated acres with unobstructed Mummy Mountain views. Main residence features imported Italian marble, custom millwork, and a 2,000-bottle wine cellar. Resort-style grounds include negative-edge pool with swim-up bar, tennis court, putting green, and separate 2-bedroom guest house. Six-car collector's garage with climate control. Private helipad.",
    features: ['Tennis Court', 'Guest House', 'Helipad', 'Wine Cellar', 'Gated'],
    interiorFeatures: ['Imported Marble', 'Custom Millwork', "Butler's Pantry", 'Safe Room', 'Elevator'],
    exteriorFeatures: ['Swim-up Bar', 'Tennis Court', 'Putting Green', 'Outdoor Fireplace', 'Sport Court'],
    hasGarage: true,
    garageSpaces: 6,
    hasPool: true,
    poolFeatures: ['Negative Edge', 'Swim-up Bar', 'Heated', 'LED Lighting'],
    hasHoa: false,
    photos: [
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200', order: 1, caption: 'Estate Exterior' },
      { url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200', order: 2, caption: 'Living Room' },
      { url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200', order: 3, caption: 'Pool & Tennis Court' },
      { url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200', order: 4, caption: 'Wine Cellar' },
    ],
    status: 'Active',
    daysOnMarket: 30,
    listedAt: '2024-12-30',
    featured: true,
    luxury: true,
  },
  {
    id: 'p-arc-001',
    mlsNumber: 'ARC-2024-001',
    address: '5801 E Calle Del Paisano',
    city: 'Phoenix',
    state: 'AZ',
    zip: '85018',
    neighborhood: 'Arcadia',
    neighborhoodSlug: 'arcadia',
    price: 3450000,
    pricePerSqft: 575,
    propertyType: 'Single Family',
    beds: 5,
    baths: 4.5,
    sqft: 6000,
    lotAcres: 0.75,
    yearBuilt: 2022,
    stories: 2,
    description: "New construction in prime Arcadia Proper on a sprawling 33,000 SF lot. This modern farmhouse design features exposed beams, shiplap accents, and wide-plank oak floors throughout. Gourmet kitchen with Wolf/Sub-Zero appliances and massive island. Primary suite with fireplace, dual closets, and steam shower. Resort backyard with pool, turf, and mature citrus trees. Walk to La Grande Orange and Postino.",
    features: ['New Construction', 'Walk to Dining', 'Large Lot', 'Modern Farmhouse'],
    interiorFeatures: ['Exposed Beams', 'Shiplap', 'Wide-Plank Oak', 'Steam Shower', 'Dual Closets'],
    exteriorFeatures: ['Pool', 'Citrus Trees', 'Turf Yard', 'Covered Patio', 'Outdoor Shower'],
    hasGarage: true,
    garageSpaces: 3,
    hasPool: true,
    poolFeatures: ['Heated', 'Pebble Finish', 'LED Lighting'],
    hasHoa: false,
    photos: [
      { url: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200', order: 1, caption: 'Modern Farmhouse Exterior' },
      { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200', order: 2, caption: 'Open Kitchen' },
      { url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200', order: 3, caption: 'Backyard Oasis' },
    ],
    status: 'Active',
    daysOnMarket: 15,
    listedAt: '2025-01-15',
    featured: true,
    luxury: true,
  },
  {
    id: 'p-sl-001',
    mlsNumber: 'SL-2024-001',
    address: '10942 E Wingspan Way',
    city: 'Scottsdale',
    state: 'AZ',
    zip: '85255',
    neighborhood: 'Silverleaf at DC Ranch',
    neighborhoodSlug: 'silverleaf',
    price: 9500000,
    pricePerSqft: 950,
    propertyType: 'Estate',
    beds: 5,
    baths: 6.5,
    sqft: 10000,
    lotAcres: 1.8,
    yearBuilt: 2020,
    stories: 2,
    description: "Silverleaf masterpiece by Calvis Wyant on premium fairway lot with Four Peaks views. Desert contemporary architecture featuring floating planes, water features, and seamless glass walls. The chef's kitchen rivals professional installations with Miele appliances and butler's pantry. Outdoor living includes infinity pool, fire features, and built-in BBQ overlooking the 15th fairway. Full Silverleaf Club membership available.",
    features: ['Golf Course Lot', 'Four Peaks Views', 'Silverleaf Club', 'Designer Home'],
    interiorFeatures: ['Floating Planes', 'Water Features', 'Miele Appliances', 'Wine Room', 'Office'],
    exteriorFeatures: ['Infinity Pool', 'Golf Course Views', 'Fire Features', 'Outdoor Living Room'],
    hasGarage: true,
    garageSpaces: 4,
    hasPool: true,
    poolFeatures: ['Infinity Edge', 'Spa', 'Fire Feature Integration'],
    hasHoa: true,
    hoaFee: 4500,
    hoaFrequency: 'Quarterly',
    photos: [
      { url: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=1200', order: 1, caption: 'Desert Contemporary Exterior' },
      { url: 'https://images.unsplash.com/photo-1600573472591-ee6981cf81ab?w=1200', order: 2, caption: 'Great Room' },
      { url: 'https://images.unsplash.com/photo-1600566752229-250ed79470f8?w=1200', order: 3, caption: 'Golf Course View' },
    ],
    status: 'Active',
    daysOnMarket: 55,
    listedAt: '2024-12-05',
    featured: true,
    luxury: true,
  },
  {
    id: 'p-dcr-001',
    mlsNumber: 'DCR-2024-001',
    address: '9820 E Thompson Peak Parkway Unit 832',
    city: 'Scottsdale',
    state: 'AZ',
    zip: '85255',
    neighborhood: 'DC Ranch',
    neighborhoodSlug: 'dc-ranch',
    price: 875000,
    pricePerSqft: 350,
    propertyType: 'Townhome',
    beds: 3,
    baths: 2.5,
    sqft: 2500,
    yearBuilt: 2019,
    stories: 2,
    description: "Lock-and-leave luxury in The Village at DC Ranch. This end-unit townhome offers low-maintenance living with access to all DC Ranch amenities. Open floor plan with 10-foot ceilings, quartz counters, and wood floors. Private courtyard and rooftop deck with mountain views. Walking distance to Market Street shops, restaurants, and community center.",
    features: ['Lock-and-Leave', 'End Unit', 'Rooftop Deck', 'Walk to Market Street'],
    interiorFeatures: ['10-Foot Ceilings', 'Quartz Counters', 'Wood Floors', 'Open Floor Plan'],
    exteriorFeatures: ['Private Courtyard', 'Rooftop Deck', 'Mountain Views'],
    hasGarage: true,
    garageSpaces: 2,
    hasPool: false,
    poolFeatures: [],
    hasHoa: true,
    hoaFee: 450,
    hoaFrequency: 'Monthly',
    photos: [
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200', order: 1, caption: 'Townhome Exterior' },
      { url: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1200', order: 2, caption: 'Open Living Area' },
    ],
    status: 'Active',
    daysOnMarket: 12,
    listedAt: '2025-01-18',
    featured: false,
    luxury: false,
  },
  {
    id: 'p-dcr-002',
    mlsNumber: 'DCR-2024-002',
    address: '20084 N 92nd Street',
    city: 'Scottsdale',
    state: 'AZ',
    zip: '85255',
    neighborhood: 'DC Ranch',
    neighborhoodSlug: 'dc-ranch',
    price: 2850000,
    originalPrice: 2950000,
    pricePerSqft: 475,
    propertyType: 'Single Family',
    beds: 5,
    baths: 4.5,
    sqft: 6000,
    lotAcres: 0.65,
    yearBuilt: 2016,
    stories: 2,
    description: "Spectacular Country Club at DC Ranch home with sweeping McDowell Mountain views. This Camelot-built home features a great room with stacked stone fireplace, gourmet kitchen with Sub-Zero/Wolf, and expansive multi-slide doors to the backyard. Primary suite with sitting area, fireplace, and spa bath. Pool with water feature, built-in BBQ, and multiple covered patios.",
    features: ['Mountain Views', 'Great Room', 'Builder Upgrades', 'DC Ranch CC'],
    interiorFeatures: ['Stacked Stone Fireplace', 'Sub-Zero/Wolf', 'Multi-Slide Doors', 'Sitting Room'],
    exteriorFeatures: ['Pool', 'Water Feature', 'Built-in BBQ', 'Multiple Patios', 'View Fencing'],
    hasGarage: true,
    garageSpaces: 3,
    hasPool: true,
    poolFeatures: ['Heated', 'Water Feature', 'Travertine Deck'],
    hasHoa: true,
    hoaFee: 350,
    hoaFrequency: 'Monthly',
    photos: [
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200', order: 1, caption: 'Front Exterior' },
      { url: 'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=1200', order: 2, caption: 'Great Room' },
      { url: 'https://images.unsplash.com/photo-1600573472591-ee6981cf81ab?w=1200', order: 3, caption: 'Pool & Mountains' },
    ],
    status: 'Active',
    daysOnMarket: 35,
    listedAt: '2024-12-25',
    featured: true,
    luxury: true,
  },
];

export interface Testimonial {
  id: string;
  clientName: string;
  clientLocation: string;
  text: string;
  rating: number;
  propertyType: string;
  transactionType: 'buyer' | 'seller' | 'both';
  transactionDate: string;
  featured: boolean;
}

export const testimonials: Testimonial[] = [
  {
    id: 't-001',
    clientName: 'Michael & Jennifer R.',
    clientLocation: 'Paradise Valley',
    text: "Yong's expertise in the Paradise Valley market was invaluable. He found us our dream home before it even hit the market and negotiated terms that exceeded our expectations. His financial background gave us confidence throughout the process, and his attention to detail ensured a smooth closing. We couldn't be happier with our new estate.",
    rating: 5,
    propertyType: 'Estate',
    transactionType: 'buyer',
    transactionDate: '2024-06-15',
    featured: true,
  },
  {
    id: 't-002',
    clientName: 'David L.',
    clientLocation: 'Silverleaf at DC Ranch',
    text: "After interviewing several luxury agents, we chose Yong to sell our Silverleaf home. His marketing strategy, including professional photography, virtual tours, and targeted outreach to qualified buyers, resulted in multiple offers within the first week. He achieved a sale price above our expectations and handled every detail professionally.",
    rating: 5,
    propertyType: 'Custom Home',
    transactionType: 'seller',
    transactionDate: '2024-09-20',
    featured: true,
  },
  {
    id: 't-003',
    clientName: 'Sarah & Tom W.',
    clientLocation: 'Arcadia',
    text: "Relocating from the Bay Area, we were unfamiliar with the Phoenix market. Yong took the time to educate us on different neighborhoods, school districts, and lifestyle options. He was patient as we refined our search and ultimately found us a beautiful Arcadia home that checked every box. His responsiveness and market knowledge made a stressful process enjoyable.",
    rating: 5,
    propertyType: 'Single Family',
    transactionType: 'buyer',
    transactionDate: '2024-11-10',
    featured: true,
  },
  {
    id: 't-004',
    clientName: 'Robert M.',
    clientLocation: 'Biltmore',
    text: "I've bought and sold multiple properties with Yong over the years. His consistency, integrity, and market expertise keep me coming back. Whether it's a personal residence or investment property, Yong treats every transaction with the same level of care and professionalism.",
    rating: 5,
    propertyType: 'Various',
    transactionType: 'both',
    transactionDate: '2024-08-05',
    featured: false,
  },
  {
    id: 't-005',
    clientName: 'The Patterson Family',
    clientLocation: 'DC Ranch',
    text: "As first-time luxury home buyers, we appreciated Yong's guidance through every step. He explained the nuances of HOA communities, helped us understand the true cost of ownership, and connected us with excellent inspectors and lenders. Our DC Ranch home is everything we wanted and more.",
    rating: 5,
    propertyType: 'Single Family',
    transactionType: 'buyer',
    transactionDate: '2024-07-22',
    featured: false,
  },
];

export interface MarketStat {
  city: string;
  neighborhood?: string;
  medianPrice: number;
  avgPricePerSqft: number;
  homesSold: number;
  avgDaysOnMarket: number;
  priceChangeYoY: number;
  listToSaleRatio: number;
}

export const marketStats: MarketStat[] = [
  {
    city: 'Paradise Valley',
    medianPrice: 4250000,
    avgPricePerSqft: 615,
    homesSold: 12,
    avgDaysOnMarket: 95,
    priceChangeYoY: 8.5,
    listToSaleRatio: 0.965,
  },
  {
    city: 'Scottsdale',
    medianPrice: 1150000,
    avgPricePerSqft: 425,
    homesSold: 245,
    avgDaysOnMarket: 52,
    priceChangeYoY: 6.8,
    listToSaleRatio: 0.978,
  },
  {
    city: 'Phoenix',
    neighborhood: 'Arcadia/Biltmore',
    medianPrice: 875000,
    avgPricePerSqft: 385,
    homesSold: 85,
    avgDaysOnMarket: 42,
    priceChangeYoY: 5.2,
    listToSaleRatio: 0.982,
  },
];

// Helper functions
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function getFeaturedProperties(): Property[] {
  return properties.filter((p) => p.featured && p.status === 'Active');
}

export function getFeaturedNeighborhoods(): Neighborhood[] {
  return neighborhoods.filter((n) => n.featured);
}

export function getPropertyBySlug(slug: string): Property | undefined {
  return properties.find((p) => p.mlsNumber.toLowerCase() === slug.toLowerCase());
}

export function getNeighborhoodBySlug(slug: string): Neighborhood | undefined {
  return neighborhoods.find((n) => n.slug === slug);
}

export function getPropertiesByNeighborhood(neighborhoodSlug: string): Property[] {
  return properties.filter((p) => p.neighborhoodSlug === neighborhoodSlug);
}
