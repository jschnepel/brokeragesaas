// data.ts — Relocation Tool data layer
// Zone profiles, quiz configuration, and matching logic

export const ZONE_IDS = ['mountain', 'desert-luxury', 'urban-core', 'suburban'] as const;
export type ZoneId = typeof ZONE_IDS[number];

export const FACTOR_IDS = [
  'climate-terrain',
  'social-club',
  'dining-entertainment',
  'outdoor-lifestyle',
  'proximity-access',
  'space-privacy',
  'schools-family',
] as const;
export type FactorId = typeof FACTOR_IDS[number];

export interface FactorData {
  rating: number;       // 1-5
  description: string;  // 1-2 sentences
  tags: string[];       // quiz matching keywords
}

export interface ZoneStats {
  medianPrice: string;
  avgLotSize: string;
  elevation: string;
  avgSummerHigh: string;
  avgWinterLow: string;
  driveToAirport: string;
  topSchoolDistrict: string;
}

export interface ZoneProfile {
  id: ZoneId;
  name: string;
  tagline: string;
  thumbnail: string;
  stats: ZoneStats;
  factors: Record<FactorId, FactorData>;
}

export interface FactorMeta {
  id: FactorId;
  label: string;
  description: string;  // tooltip/subtext for the label column
}

export interface QuizOption {
  label: string;
  zoneWeights: Record<ZoneId, number>;
}

export interface QuizQuestion {
  factorId: FactorId;
  question: string;
  options: QuizOption[];
}

export interface QuizConfig {
  factors: {
    id: FactorId;
    label: string;
    followUp: QuizQuestion;
  }[];
}

// ---------------------------------------------------------------------------
// Factor metadata
// ---------------------------------------------------------------------------

export const FACTORS: FactorMeta[] = [
  { id: 'climate-terrain', label: 'Climate & Terrain', description: 'What you see and feel stepping outside' },
  { id: 'social-club', label: 'Social & Club Life', description: 'How you meet people and what community looks like' },
  { id: 'dining-entertainment', label: 'Dining & Entertainment', description: 'What a night out looks like' },
  { id: 'outdoor-lifestyle', label: 'Outdoor Lifestyle', description: 'What you do on a Saturday morning' },
  { id: 'proximity-access', label: 'Proximity & Access', description: 'How far you are from the things you need' },
  { id: 'space-privacy', label: 'Space & Privacy', description: 'What your property and neighborhood feel like' },
  { id: 'schools-family', label: 'Schools & Family Life', description: 'Family infrastructure and education options' },
];

// ---------------------------------------------------------------------------
// Zone profiles
// ---------------------------------------------------------------------------

export const ZONES: ZoneProfile[] = [
  {
    id: 'mountain',
    name: 'Mountain Living',
    tagline: 'Pine forests, four seasons, and small-town charm',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    stats: {
      medianPrice: '$850K',
      avgLotSize: '1-5 acres',
      elevation: '7,000 ft',
      avgSummerHigh: '82\u00B0F',
      avgWinterLow: '18\u00B0F',
      driveToAirport: '2+ hours to PHX',
      topSchoolDistrict: 'Flagstaff Unified',
    },
    factors: {
      'climate-terrain': {
        rating: 5,
        description: 'Four true seasons at 7,000 ft. Cool summers in the 80s, snowy winters. Ponderosa pine forests and mountain meadows.',
        tags: ['cool', 'four-seasons', 'snow', 'elevation', 'pine'],
      },
      'social-club': {
        rating: 2,
        description: 'Tight-knit small-town community. Local events, farmers markets, and university culture. Few private clubs.',
        tags: ['small-town', 'community', 'local'],
      },
      'dining-entertainment': {
        rating: 2,
        description: 'Charming downtown with local breweries, cafes, and farm-to-table spots. Limited late-night scene.',
        tags: ['local', 'craft', 'casual'],
      },
      'outdoor-lifestyle': {
        rating: 5,
        description: 'World-class skiing, hiking, mountain biking, and fishing. National forests at your doorstep year-round.',
        tags: ['skiing', 'hiking', 'biking', 'fishing', 'nature'],
      },
      'proximity-access': {
        rating: 1,
        description: '2+ hours to Phoenix Sky Harbor. Small regional airport. Limited big-box retail \u2014 most major shopping requires a drive.',
        tags: ['remote', 'drive', 'limited'],
      },
      'space-privacy': {
        rating: 5,
        description: 'Multi-acre lots common. Homes nestled in forests with genuine privacy and distance from neighbors.',
        tags: ['acreage', 'privacy', 'forest', 'secluded'],
      },
      'schools-family': {
        rating: 3,
        description: 'Solid public schools and Northern Arizona University. Smaller class sizes. Limited private school options.',
        tags: ['university', 'small-class', 'public'],
      },
    },
  },
  {
    id: 'desert-luxury',
    name: 'Desert Luxury',
    tagline: 'Club life, golf, and foothills grandeur',
    thumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    stats: {
      medianPrice: '$2.5M',
      avgLotSize: '1-3 acres',
      elevation: '2,500 ft',
      avgSummerHigh: '105\u00B0F',
      avgWinterLow: '42\u00B0F',
      driveToAirport: '35 min to PHX',
      topSchoolDistrict: 'Scottsdale Unified',
    },
    factors: {
      'climate-terrain': {
        rating: 3,
        description: 'Sonoran desert foothills at 2,500 ft. Hot summers (105\u00B0+), mild winters in the 60s\u201370s. Dramatic mountain and desert views.',
        tags: ['hot', 'desert', 'mild-winter', 'foothills'],
      },
      'social-club': {
        rating: 5,
        description: 'Premier private clubs with multiple golf courses, spa, fitness, and dining. Active social calendar and member events.',
        tags: ['club', 'golf', 'spa', 'members', 'social'],
      },
      'dining-entertainment': {
        rating: 4,
        description: "Resort-caliber dining within the clubs. Short drive to Scottsdale's restaurant row and Old Town nightlife.",
        tags: ['resort', 'upscale', 'scottsdale'],
      },
      'outdoor-lifestyle': {
        rating: 4,
        description: 'Golf year-round, desert hiking trails, horseback riding, and resort pools. Outdoor living is the lifestyle.',
        tags: ['golf', 'hiking', 'horseback', 'pool', 'desert'],
      },
      'proximity-access': {
        rating: 3,
        description: '35\u201345 min to Sky Harbor. 20 min to Scottsdale shopping and medical. Gated communities mean deliberate trips.',
        tags: ['moderate', 'scottsdale', 'planned'],
      },
      'space-privacy': {
        rating: 5,
        description: 'Custom estates on 1\u20135+ acre lots. Gated communities with guard houses. Maximum privacy and architectural freedom.',
        tags: ['estate', 'gated', 'custom', 'acreage'],
      },
      'schools-family': {
        rating: 3,
        description: 'Top-rated Scottsdale Unified and Cave Creek districts. Excellent private school options. More retiree/empty-nester oriented.',
        tags: ['top-rated', 'private', 'retiree'],
      },
    },
  },
  {
    id: 'urban-core',
    name: 'Urban Core',
    tagline: 'Walkable energy, culture, and city living',
    thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80',
    stats: {
      medianPrice: '$650K',
      avgLotSize: '3,000-5,000 sqft',
      elevation: '1,100 ft',
      avgSummerHigh: '107\u00B0F',
      avgWinterLow: '44\u00B0F',
      driveToAirport: '10 min to PHX',
      topSchoolDistrict: 'Phoenix Union',
    },
    factors: {
      'climate-terrain': {
        rating: 2,
        description: 'Valley floor at 1,100 ft. Intense summers (110\u00B0+), beautiful winters. Urban heat island effect. Flat terrain.',
        tags: ['hot', 'flat', 'urban-heat', 'mild-winter'],
      },
      'social-club': {
        rating: 3,
        description: 'Arts districts, co-working spaces, rooftop socials, and neighborhood associations. Community through proximity, not gates.',
        tags: ['arts', 'neighborhood', 'social', 'urban'],
      },
      'dining-entertainment': {
        rating: 5,
        description: 'James Beard nominees, craft cocktail bars, live music, pro sports, and theater. Something happening every night.',
        tags: ['fine-dining', 'nightlife', 'sports', 'theater', 'music'],
      },
      'outdoor-lifestyle': {
        rating: 2,
        description: 'Urban parks, Camelback Mountain, canal paths for biking and running. Heat limits outdoor time in summer.',
        tags: ['parks', 'biking', 'urban-trails'],
      },
      'proximity-access': {
        rating: 5,
        description: '10 min to Sky Harbor. Light rail, walkable downtown. Hospitals, shopping, and offices all within minutes.',
        tags: ['walkable', 'transit', 'airport', 'close'],
      },
      'space-privacy': {
        rating: 1,
        description: 'Condos, townhomes, and urban lots. Neighbors are close. Tradeoff: everything you need is within walking distance.',
        tags: ['condo', 'dense', 'walkable', 'compact'],
      },
      'schools-family': {
        rating: 3,
        description: 'Mix of public, charter, and magnet schools. ASU downtown campus. More young professional and DINK oriented.',
        tags: ['charter', 'magnet', 'university', 'young-professional'],
      },
    },
  },
  {
    id: 'suburban',
    name: 'Suburban Life',
    tagline: 'Family-first neighborhoods with everything nearby',
    thumbnail: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
    stats: {
      medianPrice: '$550K',
      avgLotSize: '6,000-10,000 sqft',
      elevation: '1,200 ft',
      avgSummerHigh: '106\u00B0F',
      avgWinterLow: '43\u00B0F',
      driveToAirport: '25 min to PHX',
      topSchoolDistrict: 'Gilbert Unified (A-rated)',
    },
    factors: {
      'climate-terrain': {
        rating: 2,
        description: 'Valley floor, similar heat to urban core. Master-planned communities with lakes, greenbelt, and mature landscaping.',
        tags: ['hot', 'flat', 'landscaped', 'planned'],
      },
      'social-club': {
        rating: 3,
        description: 'HOA community centers, neighborhood pools, youth sports leagues, and block parties. Community built around families.',
        tags: ['hoa', 'sports-league', 'family', 'neighborhood'],
      },
      'dining-entertainment': {
        rating: 3,
        description: 'National chains plus growing local restaurant scenes. Movie theaters, bowling, family entertainment centers.',
        tags: ['family', 'chains', 'local', 'entertainment'],
      },
      'outdoor-lifestyle': {
        rating: 3,
        description: 'Community parks, splash pads, bike paths, and youth sports complexes. San Tan Mountains nearby for hiking.',
        tags: ['parks', 'youth-sports', 'biking', 'family'],
      },
      'proximity-access': {
        rating: 4,
        description: '25\u201335 min to Sky Harbor. Major hospitals, shopping centers, and employment corridors all within 15 min.',
        tags: ['convenient', 'shopping', 'medical', 'moderate'],
      },
      'space-privacy': {
        rating: 3,
        description: 'Standard suburban lots (5,000\u201310,000 sqft). Planned communities with consistent setbacks. Some privacy, some neighbors.',
        tags: ['suburban-lot', 'planned', 'moderate'],
      },
      'schools-family': {
        rating: 5,
        description: 'Top-rated Gilbert, Chandler, and Queen Creek districts. Abundant private and charter options. Built for raising families.',
        tags: ['top-rated', 'family', 'charter', 'private', 'youth'],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Quiz configuration
// ---------------------------------------------------------------------------

export const QUIZ_CONFIG: QuizConfig = {
  factors: [
    {
      id: 'climate-terrain',
      label: 'Climate & Terrain',
      followUp: {
        factorId: 'climate-terrain',
        question: 'What climate do you prefer?',
        options: [
          { label: 'Four seasons with snow', zoneWeights: { mountain: 3, 'desert-luxury': 0, 'urban-core': 0, suburban: 0 } },
          { label: 'Warm year-round', zoneWeights: { mountain: 0, 'desert-luxury': 1, 'urban-core': 1, suburban: 1 } },
          { label: 'Escape the heat', zoneWeights: { mountain: 3, 'desert-luxury': 1, 'urban-core': 0, suburban: 0 } },
        ],
      },
    },
    {
      id: 'social-club',
      label: 'Social & Club Life',
      followUp: {
        factorId: 'social-club',
        question: 'How do you like to connect with your community?',
        options: [
          { label: 'Private clubs and member events', zoneWeights: { mountain: 0, 'desert-luxury': 3, 'urban-core': 0, suburban: 0 } },
          { label: 'Neighborhood and family activities', zoneWeights: { mountain: 1, 'desert-luxury': 0, 'urban-core': 1, suburban: 3 } },
          { label: 'Urban social scene and nightlife', zoneWeights: { mountain: 0, 'desert-luxury': 1, 'urban-core': 3, suburban: 0 } },
          { label: 'Small-town, everyone-knows-everyone', zoneWeights: { mountain: 3, 'desert-luxury': 0, 'urban-core': 0, suburban: 1 } },
        ],
      },
    },
    {
      id: 'dining-entertainment',
      label: 'Dining & Entertainment',
      followUp: {
        factorId: 'dining-entertainment',
        question: 'What does your ideal night out look like?',
        options: [
          { label: 'Fine dining and craft cocktails', zoneWeights: { mountain: 0, 'desert-luxury': 2, 'urban-core': 3, suburban: 0 } },
          { label: 'Resort and club dining', zoneWeights: { mountain: 0, 'desert-luxury': 3, 'urban-core': 1, suburban: 0 } },
          { label: 'Local breweries and casual spots', zoneWeights: { mountain: 3, 'desert-luxury': 0, 'urban-core': 1, suburban: 2 } },
          { label: 'Family-friendly entertainment', zoneWeights: { mountain: 1, 'desert-luxury': 0, 'urban-core': 1, suburban: 3 } },
        ],
      },
    },
    {
      id: 'outdoor-lifestyle',
      label: 'Outdoor Lifestyle',
      followUp: {
        factorId: 'outdoor-lifestyle',
        question: "What's your ideal Saturday morning?",
        options: [
          { label: 'Hitting the ski slopes or mountain trails', zoneWeights: { mountain: 3, 'desert-luxury': 0, 'urban-core': 0, suburban: 0 } },
          { label: 'Golf, pool, and desert hiking', zoneWeights: { mountain: 0, 'desert-luxury': 3, 'urban-core': 1, suburban: 1 } },
          { label: 'Biking to a coffee shop or urban park', zoneWeights: { mountain: 0, 'desert-luxury': 0, 'urban-core': 3, suburban: 1 } },
          { label: "Kids' sports and community parks", zoneWeights: { mountain: 1, 'desert-luxury': 0, 'urban-core': 0, suburban: 3 } },
        ],
      },
    },
    {
      id: 'proximity-access',
      label: 'Proximity & Access',
      followUp: {
        factorId: 'proximity-access',
        question: 'How close do you need to be to everything?',
        options: [
          { label: 'Walking distance to daily needs', zoneWeights: { mountain: 0, 'desert-luxury': 0, 'urban-core': 3, suburban: 1 } },
          { label: 'Short drive is fine for more space', zoneWeights: { mountain: 0, 'desert-luxury': 2, 'urban-core': 0, suburban: 3 } },
          { label: 'Remote is the point \u2014 I want distance', zoneWeights: { mountain: 3, 'desert-luxury': 1, 'urban-core': 0, suburban: 0 } },
        ],
      },
    },
    {
      id: 'space-privacy',
      label: 'Space & Privacy',
      followUp: {
        factorId: 'space-privacy',
        question: 'What kind of property fits your lifestyle?',
        options: [
          { label: 'Custom estate on acreage', zoneWeights: { mountain: 2, 'desert-luxury': 3, 'urban-core': 0, suburban: 0 } },
          { label: 'Standard lot in a nice neighborhood', zoneWeights: { mountain: 0, 'desert-luxury': 0, 'urban-core': 0, suburban: 3 } },
          { label: 'Condo or townhome \u2014 low maintenance', zoneWeights: { mountain: 0, 'desert-luxury': 0, 'urban-core': 3, suburban: 1 } },
          { label: 'Secluded cabin or forest property', zoneWeights: { mountain: 3, 'desert-luxury': 0, 'urban-core': 0, suburban: 0 } },
        ],
      },
    },
    {
      id: 'schools-family',
      label: 'Schools & Family Life',
      followUp: {
        factorId: 'schools-family',
        question: 'What matters most for your household?',
        options: [
          { label: 'Top-rated schools and youth programs', zoneWeights: { mountain: 0, 'desert-luxury': 1, 'urban-core': 0, suburban: 3 } },
          { label: 'University access and young-professional vibe', zoneWeights: { mountain: 1, 'desert-luxury': 0, 'urban-core': 3, suburban: 0 } },
          { label: 'Quiet community for empty-nesters', zoneWeights: { mountain: 2, 'desert-luxury': 3, 'urban-core': 0, suburban: 1 } },
          { label: "Doesn't matter much to me", zoneWeights: { mountain: 0, 'desert-luxury': 0, 'urban-core': 0, suburban: 0 } },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Quiz matching logic
// ---------------------------------------------------------------------------

export function computeMatches(
  answers: Record<FactorId, number>
): [ZoneId, ZoneId] {
  const scores: Record<ZoneId, number> = {
    mountain: 0,
    'desert-luxury': 0,
    'urban-core': 0,
    suburban: 0,
  };

  for (const factor of QUIZ_CONFIG.factors) {
    const selectedIdx = answers[factor.id];
    if (selectedIdx === undefined) continue;
    const option = factor.followUp.options[selectedIdx];
    if (!option) continue;
    for (const zoneId of ZONE_IDS) {
      scores[zoneId] += option.zoneWeights[zoneId];
    }
  }

  const sorted = ZONE_IDS.slice().sort((a, b) => scores[b] - scores[a]);
  // ZONE_IDS always has 4 elements — indices 0 and 1 are guaranteed
  return [sorted[0]!, sorted[1]!];
}
