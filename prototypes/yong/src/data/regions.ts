/**
 * Region editorial configuration data.
 * Extracted from RegionPage.tsx for reuse across components.
 * NOTE: ICON_MAP remains in RegionPage.tsx since it maps to React components.
 */

export interface RegionEditorialConfig {
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  stats: { label: string; value: string; numericValue: number; suffix: string; trend?: string; trendDir?: 'up' | 'down' | 'neutral' }[];
  lifestyle?: {
    title: string;
    paragraphs: string[];
  };
  highlights?: {
    icon: string;
    title: string;
    description: string;
  }[];
  amenities?: {
    category: string;
    items: { name: string; distance?: string }[];
  }[];
  marketMetrics?: {
    label: string;
    value: string;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
  }[];
  qualityOfLife?: {
    metric: string;
    value: string;
    description: string;
  }[];
  gallery: { url: string; caption: string; category: string }[];
  lifestyles?: {
    id: number;
    title: string;
    communities: {
      id: string;
      name: string;
      image: string;
      priceRange: string;
      bio: string;
    }[];
  }[];
  communities: {
    id: string;
    name: string;
    image: string;
    priceRange: string;
    description: string;
  }[];
}

export const REGIONS: Record<string, RegionEditorialConfig> = {
  'north-scottsdale': {
    name: 'North Scottsdale',
    tagline: 'Where Desert Elegance Meets Championship Golf',
    description: 'North Scottsdale represents the pinnacle of Arizona luxury living, where the high Sonoran Desert meets world-class amenities. This prestigious corridor stretches from the McDowell Mountains to the foothills of Black Mountain, encompassing some of the most exclusive golf communities and custom home enclaves in the American Southwest.',
    heroImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000',
    stats: [
      { label: 'Median Price', value: '$2.8M', numericValue: 2.8, suffix: 'M', trend: '+8.2%', trendDir: 'up' },
      { label: 'Communities', value: '20+', numericValue: 20, suffix: '+', trendDir: 'neutral' },
      { label: 'Golf Courses', value: '15+', numericValue: 15, suffix: '+', trendDir: 'neutral' },
      { label: 'Elevation', value: '2,500 ft', numericValue: 2500, suffix: ' ft', trendDir: 'neutral' },
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
        'Life in North Scottsdale moves at a rhythm defined by the desert itself—unhurried yet purposeful, private yet connected. Residents wake to spectacular sunrises painting Pinnacle Peak in shades of gold and amber, enjoy morning rounds on championship courses designed by golf\'s greatest architects, and return home to estates where indoor-outdoor living blurs the line between shelter and landscape.',
        'This is Arizona\'s premier address for those who have achieved success and seek a lifestyle that reflects it. The community attracts Fortune 500 executives, professional athletes, entrepreneurs, and retirees who appreciate the unique combination of world-class amenities, natural beauty, and genuine privacy that North Scottsdale provides.',
        'The social fabric here is woven through country club memberships, charitable galas, and intimate gatherings in homes designed to entertain. Yet for all its exclusivity, North Scottsdale maintains a welcoming warmth characteristic of the American West—neighbors know each other, communities look out for their own, and the shared appreciation for this remarkable landscape creates genuine bonds.',
        'Whether your passion is golf, hiking, equestrian pursuits, or simply enjoying spectacular sunsets from your private terrace, North Scottsdale offers an unparalleled canvas for crafting your ideal lifestyle. The combination of 330+ days of sunshine, pristine natural surroundings, and proximity to urban amenities creates a living experience that draws discerning buyers from around the world.',
      ],
    },
    highlights: [
      {
        icon: 'Mountain',
        title: 'Desert Preservation',
        description: 'Over 30,000 acres of protected Sonoran Desert preserve, ensuring your views and trails remain pristine for generations.',
      },
      {
        icon: 'Star',
        title: 'World-Class Golf',
        description: '15+ championship courses by Nicklaus, Fazio, and Weiskopf. Home to PGA Tour players and exclusive member clubs.',
      },
      {
        icon: 'Shield',
        title: 'Privacy & Security',
        description: 'Guard-gated communities, low density zoning, and a culture of discretion attract high-profile residents seeking sanctuary.',
      },
      {
        icon: 'Sun',
        title: 'Climate Advantage',
        description: '330+ days of sunshine annually with cooler temperatures at elevation. 5-10°F cooler than central Phoenix in summer.',
      },
      {
        icon: 'Activity',
        title: 'Active Lifestyle',
        description: '100+ miles of hiking and biking trails. Tennis, pickleball, spa facilities, and fitness centers at every major club.',
      },
      {
        icon: 'Users',
        title: 'Community Culture',
        description: 'Tight-knit neighborhoods with social calendars, wine clubs, charity events, and genuine camaraderie among residents.',
      },
    ],
    amenities: [
      {
        category: 'Golf & Recreation',
        items: [
          { name: 'Desert Mountain Club (6 courses)', distance: '0-5 mi' },
          { name: 'Silverleaf Club', distance: '3 mi' },
          { name: 'Estancia Club', distance: '5 mi' },
          { name: 'Whisper Rock Golf Club', distance: '4 mi' },
          { name: 'Troon North Golf Club', distance: '2 mi' },
          { name: 'Grayhawk Golf Club', distance: '6 mi' },
        ],
      },
      {
        category: 'Dining & Entertainment',
        items: [
          { name: 'Sassi Ristorante', distance: '8 mi' },
          { name: 'Talavera at Four Seasons', distance: '10 mi' },
          { name: 'El Chorro Lodge', distance: '12 mi' },
          { name: 'DC Ranch Market Street', distance: '5 mi' },
          { name: 'Kierland Commons', distance: '12 mi' },
          { name: 'Scottsdale Quarter', distance: '14 mi' },
        ],
      },
      {
        category: 'Education',
        items: [
          { name: 'Basis Scottsdale (Top 10 National)', distance: '8 mi' },
          { name: 'Great Hearts Academies', distance: '10 mi' },
          { name: 'Pinnacle Peak Preparatory', distance: '3 mi' },
          { name: 'Desert Mountain High School', distance: '6 mi' },
          { name: 'ASU/Mayo Clinic Partnership', distance: '15 mi' },
        ],
      },
      {
        category: 'Healthcare',
        items: [
          { name: 'HonorHealth Scottsdale Thompson Peak', distance: '8 mi' },
          { name: 'Mayo Clinic Arizona', distance: '18 mi' },
          { name: 'Scottsdale Concierge Medicine', distance: '10 mi' },
          { name: 'Arizona Oncology', distance: '12 mi' },
        ],
      },
      {
        category: 'Travel & Access',
        items: [
          { name: 'Scottsdale Airport (Private)', distance: '15 mi' },
          { name: 'Phoenix Sky Harbor International', distance: '30 mi' },
          { name: 'Loop 101 Freeway', distance: '5 mi' },
          { name: 'Carefree Highway', distance: '2 mi' },
        ],
      },
    ],
    marketMetrics: [
      { label: 'Median Sale Price', value: '$2.45M', change: '+8.2%', trend: 'up' },
      { label: 'Price per Sq Ft', value: '$485', change: '+5.1%', trend: 'up' },
      { label: 'Days on Market', value: '68', change: '-12%', trend: 'down' },
      { label: 'Inventory (Months)', value: '4.2', change: '-0.8', trend: 'down' },
      { label: 'Sales Volume YTD', value: '$1.2B', change: '+15%', trend: 'up' },
      { label: 'Active Listings', value: '342', change: '+5%', trend: 'up' },
      { label: 'List-to-Sale Ratio', value: '97.2%', change: '+1.2%', trend: 'up' },
      { label: 'Luxury Segment ($5M+)', value: '48 Sales', change: '+22%', trend: 'up' },
    ],
    qualityOfLife: [
      {
        metric: 'Air Quality Index',
        value: 'Excellent',
        description: 'Consistently rated among the best in metro Phoenix due to elevation and distance from urban core.',
      },
      {
        metric: 'Crime Rate',
        value: '70% Below Average',
        description: 'One of the safest areas in Arizona with 24/7 security patrols in gated communities.',
      },
      {
        metric: 'School Ratings',
        value: '9-10/10',
        description: 'Access to top-rated public and private schools including nationally ranked BASIS.',
      },
      {
        metric: 'Commute to Downtown',
        value: '25-35 min',
        description: 'Easy access via Loop 101 to Scottsdale, Tempe, and Phoenix business districts.',
      },
      {
        metric: 'Walkability',
        value: 'Community-Based',
        description: 'While car-dependent overall, communities like DC Ranch offer walkable town centers.',
      },
      {
        metric: 'Noise Level',
        value: 'Very Low',
        description: 'No commercial flight paths, minimal traffic noise, and large-lot zoning ensures tranquility.',
      },
    ],
    lifestyles: [
      {
        id: 1,
        title: 'The Golf Collection',
        communities: [
          { id: 'silverleaf', name: 'Silverleaf', image: 'https://images.unsplash.com/photo-1587382769062-a50e18147d38?auto=format&fit=crop&q=80&w=1600', priceRange: '$3M - $25M+', bio: 'The crown jewel of DC Ranch, Silverleaf is an ultra-exclusive enclave of just 295 homesites. Features a Tom Weiskopf championship course, world-class clubhouse, and homes by Arizona\'s most prestigious builders.' },
          { id: 'desert-mountain', name: 'Desert Mountain', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1600', priceRange: '$1.5M - $15M+', bio: 'Arizona\'s premier private golf community spanning 8,000 acres with six Jack Nicklaus signature courses. Offers hiking trails, tennis, spa, and multiple dining venues in a pristine Sonoran Desert setting.' },
          { id: 'whisper-rock', name: 'Whisper Rock', image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=1600', priceRange: '$2M - $10M+', bio: 'Home to PGA Tour professionals, Whisper Rock features two Phil Mickelson-designed courses. Known for its serious golf culture, practice facilities, and intimate community of 400 homesites.' },
          { id: 'estancia', name: 'Estancia', image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1600', priceRange: '$2M - $12M+', bio: 'An intimate community of just 285 homesites surrounding a Tom Fazio masterpiece. Estancia offers dramatic elevation changes, boulder outcroppings, and unobstructed mountain views.' },
        ],
      },
      {
        id: 2,
        title: 'Mountain Estates',
        communities: [
          { id: 'troon-north', name: 'Troon North', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=1600', priceRange: '$1M - $6M+', bio: 'Set against the dramatic backdrop of Pinnacle Peak, Troon North features two Tom Weiskopf courses weaving through ancient boulder formations. A perfect blend of desert beauty and championship golf.' },
          { id: 'desert-highlands', name: 'Desert Highlands', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=1600', priceRange: '$1.5M - $8M+', bio: 'One of Arizona\'s original luxury golf communities, Desert Highlands features a Jack Nicklaus signature course with stunning Pinnacle Peak views. Known for its mature landscaping and established community.' },
          { id: 'mirabel', name: 'Mirabel', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600', priceRange: '$2M - $10M+', bio: 'A Tom Fazio golf course winds through dramatic terrain with panoramic mountain views. Mirabel offers a relaxed, family-friendly atmosphere with outstanding practice facilities and clubhouse.' },
        ],
      },
      {
        id: 3,
        title: 'Guard-Gated Enclaves',
        communities: [
          { id: 'dc-ranch', name: 'DC Ranch', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1600', priceRange: '$800K - $8M+', bio: 'A master-planned community at the base of the McDowell Mountains featuring the Country Club at DC Ranch and Market Street\'s walkable shops and dining. Perfect for families seeking luxury with convenience.' },
          { id: 'ancala', name: 'Ancala', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=1600', priceRange: '$800K - $3M+', bio: 'A guard-gated community featuring a Scott Miller championship course. Ancala offers a more intimate setting with excellent mountain views and easy access to North Scottsdale amenities.' },
          { id: 'grayhawk', name: 'Grayhawk', image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&q=80&w=1600', priceRange: '$600K - $4M+', bio: 'Home to two championship courses and the vibrant Grayhawk community, featuring Phil\'s Grill, the famous Talon and Raptor courses, and a variety of home styles from condos to custom estates.' },
        ],
      },
      {
        id: 4,
        title: 'Active Adult Living',
        communities: [
          { id: 'terravita', name: 'Terravita', image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=1600', priceRange: '$600K - $2.5M+', bio: 'A premier 55+ community offering resort-style amenities including golf, tennis, fitness center, and an active social calendar. Beautiful desert setting with mountain views and well-maintained grounds.' },
          { id: 'mcdowell-mountain-ranch', name: 'McDowell Mountain Ranch', image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1600', priceRange: '$500K - $2M+', bio: 'A family-friendly community adjacent to the McDowell Sonoran Preserve. Features an aquatic center, miles of trails, top-rated schools, and easy access to outdoor recreation.' },
        ],
      },
      {
        id: 5,
        title: 'Urban Sanctuaries',
        communities: [
          { id: 'kierland', name: 'Kierland', image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=1600', priceRange: '$400K - $3M+', bio: 'An urban village featuring Kierland Commons shopping and dining, championship golf, and a variety of home styles from luxury condos to custom estates. The perfect blend of convenience and resort living.' },
          { id: 'old-town-scottsdale', name: 'Old Town Scottsdale', image: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=1600', priceRange: '$300K - $5M+', bio: 'The heart of Scottsdale featuring walkable galleries, world-class dining, and vibrant nightlife. From historic adobes to modern penthouses, Old Town offers urban luxury with desert flair.' },
        ],
      },
      {
        id: 6,
        title: 'Waterfront Living',
        communities: [
          { id: 'mccormick-ranch', name: 'McCormick Ranch', image: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=1600', priceRange: '$500K - $3M+', bio: 'One of Scottsdale\'s original master-planned communities featuring lakes, two golf courses, and miles of paths. Mature landscaping and established neighborhoods offer proven value and lifestyle.' },
          { id: 'gainey-ranch', name: 'Gainey Ranch', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=1600', priceRange: '$1M - $5M+', bio: 'A prestigious guard-gated community featuring lakes, golf, tennis, and spa amenities. Known for its lush landscaping, stunning Camelback Mountain views, and proximity to Paradise Valley.' },
        ],
      },
    ],
    communities: [
      {
        id: 'desert-mountain',
        name: 'Desert Mountain',
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800',
        priceRange: '$1.5M - $15M+',
        description: 'Six Jack Nicklaus courses and 8,000 acres of pristine desert.',
      },
      {
        id: 'silverleaf',
        name: 'Silverleaf',
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800',
        priceRange: '$3M - $25M+',
        description: 'Ultra-exclusive enclave with Tom Weiskopf golf.',
      },
      {
        id: 'dc-ranch',
        name: 'DC Ranch',
        image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800',
        priceRange: '$800K - $8M+',
        description: 'Master-planned community with Country Club and Market Street.',
      },
      {
        id: 'estancia',
        name: 'Estancia',
        image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=800',
        priceRange: '$2M - $12M+',
        description: 'Private Tom Fazio course with only 285 homesites.',
      },
      {
        id: 'mirabel',
        name: 'Mirabel',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
        priceRange: '$2M - $10M+',
        description: 'Tom Fazio design with dramatic mountain backdrops.',
      },
      {
        id: 'troon-north',
        name: 'Troon North',
        image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=800',
        priceRange: '$1M - $6M+',
        description: 'Two Tom Weiskopf courses amid boulder outcroppings.',
      },
      {
        id: 'grayhawk',
        name: 'Grayhawk',
        image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&q=80&w=800',
        priceRange: '$600K - $4M+',
        description: 'Two championship courses and vibrant town center.',
      },
      {
        id: 'desert-highlands',
        name: 'Desert Highlands',
        image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800',
        priceRange: '$1.5M - $8M+',
        description: 'Jack Nicklaus signature course with Pinnacle Peak views.',
      },
      {
        id: 'whisper-rock',
        name: 'Whisper Rock',
        image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=800',
        priceRange: '$2M - $10M+',
        description: 'Two Phil Mickelson-designed courses, PGA Tour haven.',
      },
      {
        id: 'ancala',
        name: 'Ancala',
        image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800',
        priceRange: '$800K - $3M+',
        description: 'Guard-gated with Scott Miller golf course.',
      },
      {
        id: 'terravita',
        name: 'Terravita',
        image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=800',
        priceRange: '$600K - $2.5M+',
        description: 'Active adult community with outstanding amenities.',
      },
      {
        id: 'mcdowell-mountain-ranch',
        name: 'McDowell Mountain Ranch',
        image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800',
        priceRange: '$500K - $2M+',
        description: 'Family-friendly with trails and aquatic center.',
      },
    ],
  },
  'paradise-valley': {
    name: 'Paradise Valley',
    tagline: 'Arizona\'s Most Prestigious Address',
    description: 'Paradise Valley stands as Arizona\'s wealthiest municipality and most coveted residential enclave. This 16-square-mile town of just 14,000 residents maintains strict zoning that preserves its character of sprawling estates on minimum one-acre lots. Nestled between Camelback Mountain and Mummy Mountain, Paradise Valley offers unmatched privacy, world-class resorts, and easy access to Scottsdale\'s finest dining and shopping.',
    heroImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2000',
    stats: [
      { label: 'Median Price', value: '$4.5M', numericValue: 4.5, suffix: 'M', trend: '+12%', trendDir: 'up' },
      { label: 'Min. Lot Size', value: '1 Acre', numericValue: 1, suffix: ' Acre', trendDir: 'neutral' },
      { label: 'Resorts', value: '5-Star', numericValue: 5, suffix: '-Star', trendDir: 'neutral' },
      { label: 'Population', value: '14,000', numericValue: 14, suffix: 'K', trendDir: 'neutral' },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1200', caption: 'Camelback Mountain Views', category: 'Vista' },
      { url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=1200', caption: 'Resort Living', category: 'Lifestyle' },
      { url: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=1200', caption: 'Luxury Estates', category: 'Architecture' },
    ],
    communities: [
      {
        id: 'paradise-valley',
        name: 'Paradise Valley Estates',
        image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800',
        priceRange: '$2M - $30M+',
        description: 'Sprawling estates on one-acre minimum lots.',
      },
      {
        id: 'gainey-ranch',
        name: 'Gainey Ranch',
        image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800',
        priceRange: '$1M - $5M+',
        description: 'Guard-gated with golf, tennis, and spa.',
      },
      {
        id: 'mccormick-ranch',
        name: 'McCormick Ranch',
        image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=800',
        priceRange: '$500K - $3M+',
        description: 'Lake living with two golf courses.',
      },
      {
        id: 'scottsdale-ranch',
        name: 'Scottsdale Ranch',
        image: 'https://images.unsplash.com/photo-1600566753104-685f4f24cb4d?auto=format&fit=crop&q=80&w=800',
        priceRange: '$600K - $2.5M+',
        description: 'Established community with park and lake.',
      },
    ],
  },
  'carefree-cave-creek': {
    name: 'Carefree & Cave Creek',
    tagline: 'Western Spirit, Desert Soul',
    description: 'The twin communities of Carefree and Cave Creek offer a distinct alternative to the manicured golf communities of Scottsdale. Here, the Old West spirit lives on in a landscape of towering saguaros, dramatic boulder formations, and custom homes that celebrate authentic Southwestern architecture. Carefree\'s famous sundial and European-inspired town center complement Cave Creek\'s rustic saloons and art galleries.',
    heroImage: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=2000',
    stats: [
      { label: 'Median Price', value: '$1.8M', numericValue: 1.8, suffix: 'M', trend: '+6%', trendDir: 'up' },
      { label: 'Communities', value: '10+', numericValue: 10, suffix: '+', trendDir: 'neutral' },
      { label: 'Avg. Lot Size', value: '2+ Acres', numericValue: 2, suffix: '+ Ac', trendDir: 'neutral' },
      { label: 'Elevation', value: '2,800 ft', numericValue: 2800, suffix: ' ft', trendDir: 'neutral' },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=1200', caption: 'Desert Wilderness', category: 'Nature' },
      { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=1200', caption: 'Western Living', category: 'Lifestyle' },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1200', caption: 'The Boulders', category: 'Community' },
    ],
    communities: [
      {
        id: 'carefree',
        name: 'Carefree',
        image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800',
        priceRange: '$800K - $8M+',
        description: 'Charming town center with world\'s largest sundial.',
      },
      {
        id: 'cave-creek',
        name: 'Cave Creek',
        image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=800',
        priceRange: '$600K - $5M+',
        description: 'Western heritage with horse properties and trails.',
      },
      {
        id: 'boulders',
        name: 'The Boulders',
        image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800',
        priceRange: '$1M - $6M+',
        description: 'Iconic resort community amid ancient boulders.',
      },
    ],
  },
  'central-scottsdale': {
    name: 'Central Scottsdale',
    tagline: 'Urban Luxury, Desert Lifestyle',
    description: 'Central Scottsdale offers the perfect balance of urban convenience and desert beauty. From the vibrant energy of Old Town to the upscale shopping of Kierland and Scottsdale Quarter, this area provides walkable access to world-class dining, entertainment, and culture. Established communities like Gainey Ranch and McCormick Ranch offer mature landscaping and proven value, while newer developments bring contemporary living options.',
    heroImage: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=2000',
    stats: [
      { label: 'Median Price', value: '$1.2M', numericValue: 1.2, suffix: 'M', trend: '+5%', trendDir: 'up' },
      { label: 'Communities', value: '15+', numericValue: 15, suffix: '+', trendDir: 'neutral' },
      { label: 'Walk Score', value: '70+', numericValue: 70, suffix: '+', trendDir: 'neutral' },
      { label: 'Restaurants', value: '500+', numericValue: 500, suffix: '+', trendDir: 'neutral' },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=1200', caption: 'Old Town Arts', category: 'Culture' },
      { url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&q=80&w=1200', caption: 'Kierland Commons', category: 'Shopping' },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200', caption: 'Urban Living', category: 'Lifestyle' },
    ],
    communities: [
      {
        id: 'kierland',
        name: 'Kierland',
        image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&q=80&w=800',
        priceRange: '$400K - $3M+',
        description: 'Urban village with Kierland Commons and golf.',
      },
      {
        id: 'old-town-scottsdale',
        name: 'Old Town Scottsdale',
        image: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=800',
        priceRange: '$300K - $5M+',
        description: 'Walkable arts district with galleries and nightlife.',
      },
      {
        id: 'central-scottsdale',
        name: 'Central Scottsdale',
        image: 'https://images.unsplash.com/photo-1600566753104-685f4f24cb4d?auto=format&fit=crop&q=80&w=800',
        priceRange: '$400K - $2M+',
        description: 'Convenient location near Fashion Square.',
      },
      {
        id: 'stonegate',
        name: 'Stonegate',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
        priceRange: '$500K - $1.5M+',
        description: 'Guard-gated with community pool and parks.',
      },
    ],
  },
};
