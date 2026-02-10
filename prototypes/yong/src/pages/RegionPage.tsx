import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  TrendingUp,
  TrendingDown,
  Home,
  ChevronRight,
  ChevronLeft,
  Mountain,
  TreePine,
  Sun,
  Shield,
  Plane,
  GraduationCap,
  Utensils,
  ShoppingBag,
  Activity,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  Clock,
  Star,
  Compass,
  Download,
  Play,
  Minus,
  Camera,
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import AnimatedCounter from '../components/shared/AnimatedCounter';
import { useScrollAnimation } from '../components/shared/useScrollAnimation';

// Extended region data type
interface RegionData {
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

// Icon mapping
const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Mountain,
  TreePine,
  Sun,
  Shield,
  Plane,
  GraduationCap,
  Utensils,
  ShoppingBag,
  Activity,
  Users,
  Star,
};

// Region data with communities
const REGIONS: Record<string, RegionData> = {
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

const RegionPage: React.FC = () => {
  const { regionId } = useParams<{ regionId: string }>();
  const region = regionId ? REGIONS[regionId] : null;

  const [scrollY, setScrollY] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeLifestyle, setActiveLifestyle] = useState(0);
  const [activeCommunity, setActiveCommunity] = useState(0);
  const [activeInfoTab, setActiveInfoTab] = useState<'special' | 'numbers' | 'amenities' | 'residents'>('special');

  const communitiesPerPage = 4;
  const totalSlides = region ? Math.ceil(region.communities.length / communitiesPerPage) : 0;

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate gallery
  useEffect(() => {
    if (!region) return;
    const interval = setInterval(() => {
      setGalleryIndex((prev) => (prev + 1) % region.gallery.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [region]);

  // Scroll to top on region change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [regionId]);

  // Animation hooks
  const metricsAnim = useScrollAnimation();
  const highlightsAnim = useScrollAnimation();
  const communitiesAnim = useScrollAnimation();

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const currentCommunities = region?.communities.slice(
    currentSlide * communitiesPerPage,
    currentSlide * communitiesPerPage + communitiesPerPage
  ) || [];

  if (!region) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col">
        <Navigation variant="solid" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-serif text-[#0C1C2E] mb-4">Region Not Found</h1>
            <p className="text-gray-500 mb-8">The region you're looking for doesn't exist.</p>
            <Link
              to="/communities"
              className="bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#Bfa67a] transition-all"
            >
              View All Communities
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] page-zoom-90 font-sans selection:bg-[#0C1C2E] selection:text-white antialiased overflow-x-hidden">
      <Navigation variant="transparent" />

      {/* Hero Section - Immersive with Parallax */}
      <section className="relative h-[85vh] w-full overflow-hidden flex items-end">
        <div
          className="absolute inset-0 w-full h-[110%]"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        >
          <img
            src={region.heroImage}
            alt={region.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E]/90 via-[#0C1C2E]/30 to-transparent" />

        {/* Video Play Button */}
        <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 group">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              <Play size={24} className="text-[#0C1C2E] ml-1" fill="#0C1C2E" />
            </div>
          </div>
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white text-[10px] uppercase tracking-[0.2em] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Explore Region
          </span>
        </button>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 lg:px-20 pb-20">
          <div className="flex flex-col md:flex-row items-end justify-between gap-12">
            <div className="text-white">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold mb-4">
                <Link to="/" className="text-white/40 hover:text-white transition-colors">Home</Link>
                <span className="text-white/20">/</span>
                <Link to="/communities" className="text-white/40 hover:text-white transition-colors">Communities</Link>
                <span className="text-white/20">/</span>
                <span className="text-[#Bfa67a]">{region.name}</span>
              </nav>

              <span className="block text-[#Bfa67a] text-[11px] uppercase tracking-[0.4em] font-bold mb-4 pl-1">Region Profile</span>
              <h1 className="text-6xl md:text-8xl font-serif leading-[0.9] tracking-tight mb-6">
                {region.name.split(' ').map((word, i, arr) => (
                  i === arr.length - 1 && arr.length > 1
                    ? <span key={i}><br/><span className="italic font-light">{word}</span></span>
                    : <span key={i}>{word} </span>
                ))}
              </h1>
              <p className="text-xl text-white/70 font-light italic max-w-lg">{region.tagline}</p>
            </div>

            {/* Hero CTA */}
            <div className="hidden lg:flex flex-col sm:flex-row gap-3">
              <Link
                to="/map"
                className="bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2 group shadow-xl"
              >
                <MapPin size={14} />
                View on Map
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
              </Link>
              <Link
                to={`/report?region=${regionId}`}
                className="bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2 shadow-xl"
              >
                <Download size={14} />
                Market Report
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Market Intelligence Dashboard - Overlapping Hero */}
      <section ref={metricsAnim.ref} className="relative z-20 -mt-16 max-w-[1600px] mx-auto px-8 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {region.stats.map((stat, i) => (
            <div
              key={i}
              className={`
                bg-white p-8 shadow-xl shadow-black/5 border-t-4 border-[#Bfa67a]
                transition-all duration-500 hover:shadow-2xl hover:-translate-y-1
                ${metricsAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
              `}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">{stat.label}</span>
                {stat.trendDir === 'up' ? (
                  <TrendingUp size={16} className="text-emerald-600"/>
                ) : stat.trendDir === 'down' ? (
                  <TrendingDown size={16} className="text-rose-500"/>
                ) : (
                  <Minus size={16} className="text-gray-300"/>
                )}
              </div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-serif text-[#0C1C2E]">
                  {stat.suffix.includes('M') && '$'}
                  <AnimatedCounter
                    value={stat.numericValue}
                    suffix={stat.suffix}
                  />
                </span>
                {stat.trend && (
                  <span className={`text-xs font-bold ${stat.trendDir === 'up' ? 'text-emerald-600' : stat.trendDir === 'down' ? 'text-rose-500' : 'text-gray-500'}`}>
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">vs. Last Year</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bento Box Layout - Region Information */}
      <section className="py-16 max-w-[1600px] mx-auto px-8 lg:px-20">
        <div className="grid grid-cols-12 gap-4 items-stretch">

          {/* THE NARRATIVE - Main Content (8 cols) */}
          <div className="col-span-12 lg:col-span-8 bg-white p-10 shadow-lg shadow-black/5 flex flex-col">
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-6 block">
              {region.lifestyle ? 'Living Here' : 'The Region'}
            </span>
            <h2 className="text-3xl md:text-4xl font-serif leading-[1.1] text-[#0C1C2E] mb-8">
              {region.lifestyle?.title || region.name} <span className="italic text-gray-400">— {region.name}</span>
            </h2>

            <div className="prose prose-lg text-gray-500 font-light leading-relaxed mb-8 max-w-none space-y-6">
              <p className="first-letter:text-5xl first-letter:font-serif first-letter:text-[#0C1C2E] first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                {region.description}
              </p>

              {/* Lifestyle paragraphs integrated */}
              {region.lifestyle?.paragraphs.map((paragraph, idx) => (
                <p key={idx}>
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Quick Facts Tags */}
            <div className="flex flex-wrap gap-3 mb-8">
              <span className="bg-gray-100 text-[#0C1C2E] px-4 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                <Shield size={12} className="text-[#Bfa67a]" /> Guard-Gated
              </span>
              <span className="bg-gray-100 text-[#0C1C2E] px-4 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                <Star size={12} className="text-[#Bfa67a]" /> World-Class Golf
              </span>
              <span className="bg-gray-100 text-[#0C1C2E] px-4 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                <Mountain size={12} className="text-[#Bfa67a]" /> Desert Preserve
              </span>
              <span className="bg-gray-100 text-[#0C1C2E] px-4 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                <Sun size={12} className="text-[#Bfa67a]" /> 330+ Sunny Days
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to={`/listings?region=${regionId}`}
                className="bg-[#0C1C2E] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#Bfa67a] transition-all flex items-center gap-2 group"
              >
                View Active Listings
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="border border-[#0C1C2E] text-[#0C1C2E] px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#0C1C2E] hover:text-white transition-all flex items-center gap-2"
              >
                Schedule Consultation
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN - Gallery + Quick Stats (4 cols) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col">
            <div className="flex flex-col flex-1 space-y-4">
              {/* GALLERY - Auto Rotating */}
              <div className="relative h-[320px] overflow-hidden group">
                {region.gallery.map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-1000 ${
                      galleryIndex === index ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                    }`}
                  >
                    <img src={image.url} alt={image.caption} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                ))}
                <div className="absolute bottom-4 left-4 text-white z-10">
                  <span className="text-[9px] uppercase tracking-widest text-[#Bfa67a] font-bold block">{region.gallery[galleryIndex]?.category}</span>
                  <h3 className="text-lg font-serif">{region.gallery[galleryIndex]?.caption}</h3>
                </div>
                <div className="absolute bottom-4 right-4 flex gap-1 z-10">
                  {region.gallery.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setGalleryIndex(index)}
                      className={`h-1 rounded-full transition-all ${galleryIndex === index ? 'w-4 bg-[#Bfa67a]' : 'w-1 bg-white/50'}`}
                    />
                  ))}
                </div>
                <button className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold text-[#0C1C2E] z-10">
                  <Camera size={12} /> {region.gallery.length} Photos
                </button>
              </div>

              {/* REGION STATS */}
              <div className="bg-[#0C1C2E] p-6 flex-1 flex flex-col">
                <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold mb-5 block">At a Glance</span>
                <div className="space-y-4">
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Communities</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">{region.communities.length}+</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Price Range</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">$500K - $25M+</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Distance to PHX</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">25-35 min</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer pb-3 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">School Rating</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">A+ District</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Golf Courses</span>
                    <span className="text-xl font-serif text-white group-hover:text-[#Bfa67a] transition-colors">40+</span>
                  </div>
                </div>

                {/* Market Intel Link */}
                <Link
                  to={`/report?region=${regionId}`}
                  className="flex items-center justify-between mt-5 p-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#Bfa67a]/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp size={18} className="text-[#Bfa67a]" />
                    <div>
                      <span className="text-white text-sm font-medium block group-hover:text-[#Bfa67a] transition-colors">Market Intelligence</span>
                      <span className="text-[9px] uppercase tracking-widest text-gray-500">Full Analytics Report</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-500 group-hover:text-[#Bfa67a] group-hover:translate-x-1 transition-all" />
                </Link>

                {/* CTA Buttons */}
                <div className="mt-auto pt-5 space-y-3">
                  <Link
                    to="/contact"
                    className="w-full bg-[#Bfa67a] text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center justify-center gap-2 group"
                  >
                    Contact Yong Choi
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to={`/listings?region=${regionId}`}
                    className="w-full border border-white/20 text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center justify-center gap-2"
                  >
                    Browse All Listings
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curated Lifestyles - Interactive Hover with Community Carousel */}
      {region.lifestyles && (
        <section className="py-16">
          <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
            <div className="flex flex-col lg:flex-row min-h-[500px] overflow-hidden bg-[#0C1C2E]">

              {/* Left Side: Navigation List */}
              <div className="w-full lg:w-1/3 p-8 lg:p-12 flex flex-col justify-center z-10">
                <div className="mb-12">
                  <span className="text-[#Bfa67a] text-xs font-bold tracking-[0.2em] uppercase block mb-4">Curated Lifestyles</span>
                  <h2 className="font-serif text-4xl text-white">Find Your Niche</h2>
                </div>

                <div className="space-y-2">
                  {region.lifestyles.map((style, index) => (
                    <div
                      key={style.id}
                      className="group cursor-pointer py-4 border-b border-white/10"
                      onMouseEnter={() => { setActiveLifestyle(index); setActiveCommunity(0); }}
                    >
                      <div className="flex justify-between items-center group-hover:pl-4 transition-all duration-300">
                        <h3 className={`font-serif text-2xl transition-colors ${activeLifestyle === index ? 'text-white' : 'text-white/40'}`}>
                          {style.title}
                        </h3>
                        <ChevronRight className={`transition-opacity ${activeLifestyle === index ? 'opacity-100 text-[#Bfa67a]' : 'opacity-0'}`} size={20} />
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  to="/communities"
                  className="mt-12 text-left text-xs font-bold uppercase tracking-[0.2em] border-b border-white/30 pb-2 self-start text-white hover:text-[#Bfa67a] hover:border-[#Bfa67a] transition-colors"
                >
                  Explore All Communities
                </Link>
              </div>

              {/* Right Side: Community Cards Carousel */}
              <div className="w-full lg:w-2/3 relative min-h-[400px] lg:min-h-0 bg-[#0a1520] p-6 lg:p-8 flex flex-col">
                {/* Collection Title */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-serif text-xl">{region.lifestyles[activeLifestyle]?.title}</h3>
                    <p className="text-white/50 text-xs mt-1">Hover to explore communities</p>
                  </div>
                  {region.lifestyles[activeLifestyle]?.communities.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveCommunity(prev => prev === 0 ? (region.lifestyles?.[activeLifestyle]?.communities.length || 1) - 1 : prev - 1)}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-white/50 text-xs font-medium min-w-[40px] text-center">
                        {activeCommunity + 1} / {region.lifestyles[activeLifestyle]?.communities.length}
                      </span>
                      <button
                        onClick={() => setActiveCommunity(prev => prev === (region.lifestyles?.[activeLifestyle]?.communities.length || 1) - 1 ? 0 : prev + 1)}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Community Cards */}
                <div className="flex-1 flex gap-3 overflow-hidden">
                  {region.lifestyles[activeLifestyle]?.communities.map((community, idx) => (
                    <Link
                      key={community.id}
                      to={`/${regionId}/${community.id}`}
                      className={`
                        group relative overflow-hidden transition-all duration-500 ease-out cursor-pointer
                        ${activeCommunity === idx ? 'flex-[3]' : 'flex-[1]'}
                      `}
                      onMouseEnter={() => setActiveCommunity(idx)}
                    >
                      {/* Background Image */}
                      <div className="absolute inset-0">
                        <img
                          src={community.image}
                          alt={community.name}
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                        />
                        <div className={`absolute inset-0 transition-all duration-500 ${activeCommunity === idx ? 'bg-gradient-to-t from-[#0C1C2E] via-[#0C1C2E]/40 to-transparent' : 'bg-[#0C1C2E]/60'}`}></div>
                      </div>

                      {/* Content */}
                      <div className="absolute inset-0 flex flex-col justify-end p-4">
                        {/* Collapsed State - Just Name */}
                        <div className={`transition-all duration-500 ${activeCommunity === idx ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                          <h4 className="text-white font-serif text-sm writing-mode-vertical transform -rotate-180" style={{ writingMode: 'vertical-rl' }}>
                            {community.name}
                          </h4>
                        </div>

                        {/* Expanded State - Full Info */}
                        <div className={`transition-all duration-500 ${activeCommunity === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 absolute'}`}>
                          <div className="h-[2px] w-8 bg-[#Bfa67a] mb-3 group-hover:w-16 transition-all duration-500"></div>
                          <h4 className="text-white font-serif text-xl mb-2">{community.name}</h4>
                          <p className="text-[#Bfa67a] text-[10px] font-bold tracking-widest uppercase mb-2">{community.priceRange}</p>
                          <p className="text-white/70 text-xs leading-relaxed mb-4 line-clamp-2">{community.bio}</p>
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white group-hover:text-[#Bfa67a] transition-colors">
                            Explore Community <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Dots Navigation */}
                <div className="flex justify-center gap-2 mt-4">
                  {region.lifestyles[activeLifestyle]?.communities.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveCommunity(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${activeCommunity === idx ? 'w-6 bg-[#Bfa67a]' : 'w-1.5 bg-white/30 hover:bg-white/50'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Region Info Tabs */}
      {(region.highlights || region.marketMetrics || region.amenities || region.qualityOfLife) && (
        <section ref={highlightsAnim.ref} className="py-12 bg-white">
          <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
            {/* Tab Navigation - Same title format as before */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {region.highlights && (
                <button
                  onClick={() => setActiveInfoTab('special')}
                  className={`text-left p-4 transition-all duration-300 border-b-2 ${
                    activeInfoTab === 'special'
                      ? 'border-[#Bfa67a] bg-[#F9F8F6]'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-[0.25em] font-bold block mb-1 transition-colors ${
                    activeInfoTab === 'special' ? 'text-[#Bfa67a]' : 'text-gray-400'
                  }`}>
                    Why {region.name}
                  </span>
                  <h3 className={`text-lg font-serif transition-colors ${
                    activeInfoTab === 'special' ? 'text-[#0C1C2E]' : 'text-gray-400'
                  }`}>
                    What Makes It <span className="italic font-light">Special</span>
                  </h3>
                </button>
              )}
              {region.marketMetrics && (
                <button
                  onClick={() => setActiveInfoTab('numbers')}
                  className={`text-left p-4 transition-all duration-300 border-b-2 ${
                    activeInfoTab === 'numbers'
                      ? 'border-[#Bfa67a] bg-[#F9F8F6]'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-[0.25em] font-bold block mb-1 transition-colors ${
                    activeInfoTab === 'numbers' ? 'text-[#Bfa67a]' : 'text-gray-400'
                  }`}>
                    Market Intelligence
                  </span>
                  <h3 className={`text-lg font-serif transition-colors ${
                    activeInfoTab === 'numbers' ? 'text-[#0C1C2E]' : 'text-gray-400'
                  }`}>
                    By the <span className="italic font-light">Numbers</span>
                  </h3>
                </button>
              )}
              {region.amenities && (
                <button
                  onClick={() => setActiveInfoTab('amenities')}
                  className={`text-left p-4 transition-all duration-300 border-b-2 ${
                    activeInfoTab === 'amenities'
                      ? 'border-[#Bfa67a] bg-[#F9F8F6]'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-[0.25em] font-bold block mb-1 transition-colors ${
                    activeInfoTab === 'amenities' ? 'text-[#Bfa67a]' : 'text-gray-400'
                  }`}>
                    What's Nearby
                  </span>
                  <h3 className={`text-lg font-serif transition-colors ${
                    activeInfoTab === 'amenities' ? 'text-[#0C1C2E]' : 'text-gray-400'
                  }`}>
                    Amenities & <span className="italic font-light">Attractions</span>
                  </h3>
                </button>
              )}
              {region.qualityOfLife && (
                <button
                  onClick={() => setActiveInfoTab('residents')}
                  className={`text-left p-4 transition-all duration-300 border-b-2 ${
                    activeInfoTab === 'residents'
                      ? 'border-[#Bfa67a] bg-[#F9F8F6]'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-[0.25em] font-bold block mb-1 transition-colors ${
                    activeInfoTab === 'residents' ? 'text-[#Bfa67a]' : 'text-gray-400'
                  }`}>
                    Quality of Life
                  </span>
                  <h3 className={`text-lg font-serif transition-colors ${
                    activeInfoTab === 'residents' ? 'text-[#0C1C2E]' : 'text-gray-400'
                  }`}>
                    What Residents <span className="italic font-light">Love</span>
                  </h3>
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="min-h-[180px]">
              {/* What Makes It Special */}
              {activeInfoTab === 'special' && region.highlights && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {region.highlights.map((highlight, idx) => {
                    const IconComponent = ICON_MAP[highlight.icon] || Mountain;
                    return (
                      <div
                        key={idx}
                        className="text-center p-4 bg-[#F9F8F6] hover:shadow-md transition-all duration-300 group cursor-pointer"
                      >
                        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[#0C1C2E]/5 flex items-center justify-center group-hover:bg-[#Bfa67a]/20 transition-colors">
                          <IconComponent size={18} className="text-[#Bfa67a]" />
                        </div>
                        <h3 className="text-sm font-serif text-[#0C1C2E] mb-1 group-hover:text-[#Bfa67a] transition-colors">{highlight.title}</h3>
                        <p className="text-gray-500 text-[11px] leading-snug">{highlight.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* By the Numbers */}
              {activeInfoTab === 'numbers' && region.marketMetrics && (
                <div>
                  <div className="flex justify-end mb-4">
                    <Link
                      to={`/report?region=${regionId}`}
                      className="inline-flex items-center gap-1 text-[#Bfa67a] text-[10px] uppercase tracking-[0.15em] font-bold hover:gap-2 transition-all group"
                    >
                      Full Market Report <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    {region.marketMetrics.map((metric, idx) => (
                      <div
                        key={idx}
                        className="bg-[#F9F8F6] p-4 hover:shadow-md transition-all duration-300 group cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold truncate">
                            {metric.label}
                          </span>
                          {metric.change && (
                            <span className={`flex items-center text-[10px] font-bold ${
                              metric.trend === 'up' ? 'text-emerald-600' : metric.trend === 'down' ? 'text-rose-500' : 'text-gray-500'
                            }`}>
                              {metric.trend === 'up' && <TrendingUp size={10} />}
                              {metric.trend === 'down' && <TrendingDown size={10} />}
                            </span>
                          )}
                        </div>
                        <div className="text-xl font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">{metric.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities & Attractions */}
              {activeInfoTab === 'amenities' && region.amenities && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {region.amenities.map((category, idx) => (
                    <div key={idx} className="bg-[#F9F8F6] p-4 hover:shadow-md transition-shadow">
                      <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold mb-3 pb-2 border-b border-gray-200">
                        {category.category}
                      </h3>
                      <ul className="space-y-2">
                        {category.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-center justify-between text-[11px] group cursor-pointer">
                            <span className="text-gray-700 group-hover:text-[#0C1C2E] transition-colors truncate pr-2">{item.name}</span>
                            {item.distance && (
                              <span className="text-gray-400 text-[10px] group-hover:text-[#Bfa67a] transition-colors whitespace-nowrap">{item.distance}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* What Residents Love */}
              {activeInfoTab === 'residents' && region.qualityOfLife && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {region.qualityOfLife.map((item, idx) => (
                    <div key={idx} className="bg-[#F9F8F6] p-4 hover:shadow-md transition-all duration-300 group">
                      <div className="flex flex-col mb-2">
                        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-1">
                          {item.metric}
                        </span>
                        <span className="text-[#Bfa67a] font-serif text-lg group-hover:scale-105 transition-transform">{item.value}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Communities - Showcase Cards */}
      <section ref={communitiesAnim.ref} className="py-16 bg-[#F5F5F0]">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
          <div className={`flex justify-between items-end mb-10 transition-all duration-700 ${communitiesAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div>
              <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-3 block">Explore Communities</span>
              <h2 className="text-2xl md:text-3xl font-serif text-[#0C1C2E]">
                {region.name} <span className="italic font-light">Communities</span>
              </h2>
            </div>
            <Link
              to="/communities"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors group"
            >
              View All
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Showcase Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {region.communities.map((community, index) => (
              <Link
                key={community.id}
                to={`/${regionId}/${community.id}`}
                className="group relative h-[280px] overflow-hidden cursor-pointer"
                style={{
                  animation: `fadeSlideIn 0.5s ease-out ${index * 50}ms both`
                }}
              >
                {/* Background Image */}
                <div className="absolute inset-0 bg-[#0C1C2E]">
                  <img
                    src={community.image}
                    alt={community.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E] via-transparent to-transparent opacity-90"></div>
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <h4 className="font-serif text-base md:text-lg mb-1">{community.name}</h4>
                    <div className="h-[1px] w-6 bg-[#Bfa67a] mb-1.5 group-hover:w-12 transition-all duration-500"></div>
                    <p className="text-[#Bfa67a] text-[9px] font-bold tracking-widest uppercase mb-0.5">{region.name}</p>
                    <p className="text-white/70 text-[10px] font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{community.priceRange.split(' - ')[0]}</p>
                    <div className="mt-3 flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200 text-white">
                      Explore <ArrowRight size={10} className="text-[#Bfa67a]" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#0C1C2E] py-24">
        <div className="max-w-[800px] mx-auto px-8 text-center">
          <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Ready to Explore?</span>
          <h2 className="text-3xl md:text-5xl font-serif text-white mb-6">
            Find Your Home in <span className="italic font-light">{region.name}</span>
          </h2>
          <p className="text-white/60 mb-10 text-lg font-light">
            Let Yong Choi guide you through the nuances of each community to find the perfect match for your lifestyle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={`/listings?region=${regionId}`}
              className="bg-[#Bfa67a] text-white px-10 py-5 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center justify-center gap-2 group"
            >
              <Home size={14} />
              View Active Listings
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/contact"
              className="border border-white/30 text-white px-10 py-5 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center justify-center gap-2"
            >
              <Calendar size={14} />
              Schedule Consultation
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default RegionPage;
