import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MapGL, { Source, Layer } from 'react-map-gl/maplibre';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import type { FillLayerSpecification, LineLayerSpecification, CircleLayerSpecification } from 'maplibre-gl';
import type { Polygon, MultiPolygon, FeatureCollection } from 'geojson';
import { getGeometryBounds } from '../utils/mapHelpers';

import {
  MapPin,
  TrendingUp,
  Award,
  ArrowRight,
  Home,
  Layers,
  Crosshair,
  ChevronDown,
  Search,
  X,
  Building2,
  Map,
  Hash,
  Loader2,
  Camera,
  ShieldCheck,
  Landmark,
  GraduationCap,
  TreePine,
  DollarSign,
  Footprints,
  Wind,
  Activity,
  Leaf,
  Car,
  BedDouble,
  Bath,
} from 'lucide-react';
import Navigation from '../components/Navigation';
import SEOHead from '../components/shared/SEOHead';

import {
  loadGeoJSON,
  PHOENIX_CENTER,
  DEFAULT_ZOOM,
  MAP_STYLE,
  BRAND_COLORS,
  type GeoJSONData,
} from '../data/phoenixLuxuryZones';

import {
  getCommunityById,
  getCommunitiesByRegion,
  getRegions,
  getAllCommunities,
} from '../data/communities';

import { getRegionName, getRegionDescription } from '../data/regionMapping';

// --- Helpers ---

// --- Extended Zone Data for Panel ---
interface ExtendedZoneData {
  id: string;
  name: string;
  description: string;
  headerImage: string;
  lifestyle: { label: string; img: string }[];
  qualitySignals: {
    id: string;
    label: string;
    value: string;
    rating: number;
    detail: string;
  }[];
  stats: {
    avgPrice: string;
    inventory: number;
    dom: number;
    trend: string;
    ppsf: string;
  };
  buyerData: {
    negotiability: string;
    inventoryTrend: string;
    forecast: string;
    priceDistribution: { range: string; value: number }[];
  };
  sellerData: {
    marketIndex: number;
    cashBuyerPercent: string;
    daysToContract: string;
    yoyAppreciation: string;
    saleToList: string;
  };
  enclaves: {
    id: string;
    name: string;
    avgPrice: string;
    dom: number;
    inventory: number;
    type: string;
  }[];
}

const ZONE_DETAILS: Record<string, ExtendedZoneData> = {
  'north-scottsdale': {
    id: 'north-scottsdale',
    name: 'North Scottsdale',
    description: 'High-altitude luxury estates nestled in the McDowell Mountains. Known for championship golf clubs, equestrian zoning, and cooler temperatures.',
    headerImage: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200",
    lifestyle: [
      { label: 'Championship Golf', img: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=400" },
      { label: 'Equestrian', img: "https://images.unsplash.com/photo-1534313314376-2847290e3181?auto=format&fit=crop&q=80&w=400" },
      { label: 'Hiking Trails', img: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=400" },
      { label: 'Gated Privacy', img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=400" }
    ],
    qualitySignals: [
      { id: 'walk', label: 'Walkability', value: '12/100', rating: 12, detail: 'Car-dependent enclave; designed for privacy.' },
      { id: 'air', label: 'Air Quality', value: '98 AQI', rating: 98, detail: 'Pristine high-desert air.' },
      { id: 'noise', label: 'Noise Index', value: '35 dB', rating: 95, detail: 'Whisper quiet; protected from traffic.' },
      { id: 'safety', label: 'Safety Score', value: 'A+', rating: 99, detail: 'Top 1% nationally.' },
      { id: 'green', label: 'Green Space', value: '85%', rating: 85, detail: 'McDowell Sonoran Preserve access.' },
      { id: 'commute', label: 'Avg Commute', value: '28 min', rating: 40, detail: 'Secluded location.' },
    ],
    stats: { avgPrice: '$3.2M', inventory: 142, dom: 45, trend: '+12%', ppsf: '$795' },
    buyerData: {
      negotiability: "1.2% Disc.",
      inventoryTrend: "+8% (Good)",
      forecast: "Steady Growth",
      priceDistribution: [
        { range: '< $1M', value: 10 },
        { range: '$1M-$3M', value: 35 },
        { range: '$3M-$5M', value: 40 },
        { range: '$5M+', value: 15 },
      ]
    },
    sellerData: {
      marketIndex: 68,
      cashBuyerPercent: "58%",
      daysToContract: "22 Days",
      yoyAppreciation: "+12.4%",
      saleToList: "98.8%"
    },
    enclaves: [
      { id: 'desert-mountain', name: 'Desert Mountain', avgPrice: '$3.4M', dom: 48, inventory: 72, type: 'golf' },
      { id: 'silverleaf', name: 'Silverleaf', avgPrice: '$6.2M', dom: 62, inventory: 18, type: 'guard-gated' },
      { id: 'dc-ranch', name: 'DC Ranch', avgPrice: '$2.1M', dom: 38, inventory: 45, type: 'master-planned' },
      { id: 'mirabel', name: 'Mirabel', avgPrice: '$4.2M', dom: 70, inventory: 8, type: 'golf' },
      { id: 'estancia', name: 'Estancia', avgPrice: '$4.8M', dom: 65, inventory: 12, type: 'golf' },
      { id: 'troon-north', name: 'Troon North', avgPrice: '$2.6M', dom: 50, inventory: 20, type: 'golf' },
      { id: 'grayhawk', name: 'Grayhawk', avgPrice: '$1.4M', dom: 32, inventory: 38, type: 'golf' },
      { id: 'desert-highlands', name: 'Desert Highlands', avgPrice: '$3.2M', dom: 55, inventory: 15, type: 'golf' },
      { id: 'whisper-rock', name: 'Whisper Rock', avgPrice: '$3.8M', dom: 60, inventory: 10, type: 'golf' },
      { id: 'ancala', name: 'Ancala', avgPrice: '$1.8M', dom: 45, inventory: 18, type: 'guard-gated' },
      { id: 'terravita', name: 'Terravita', avgPrice: '$1.3M', dom: 42, inventory: 25, type: 'guard-gated' },
      { id: 'windgate-ranch', name: 'Windgate Ranch', avgPrice: '$1.6M', dom: 38, inventory: 20, type: 'guard-gated' },
      { id: 'troon-village', name: 'Troon Village', avgPrice: '$1.8M', dom: 45, inventory: 30, type: 'golf' },
      { id: 'legend-trail', name: 'Legend Trail', avgPrice: '$950K', dom: 40, inventory: 22, type: 'golf' },
      { id: 'mcdowell-mountain-ranch', name: 'McDowell Mountain Ranch', avgPrice: '$1.1M', dom: 35, inventory: 35, type: 'master-planned' },
      { id: 'pinnacle-peak', name: 'Pinnacle Peak', avgPrice: '$2.8M', dom: 58, inventory: 28, type: 'estate' },
      { id: 'scottsdale-mountain', name: 'Scottsdale Mountain', avgPrice: '$1.5M', dom: 42, inventory: 18, type: 'guard-gated' },
      { id: 'sincuidados', name: 'Sincuidados', avgPrice: '$2.1M', dom: 50, inventory: 12, type: 'guard-gated' },
      { id: 'boulders', name: 'The Boulders', avgPrice: '$2.4M', dom: 52, inventory: 24, type: 'resort' },
      { id: 'kierland', name: 'Kierland', avgPrice: '$1.2M', dom: 28, inventory: 42, type: 'urban' },
      { id: 'pima-acres', name: 'Pima Acres', avgPrice: '$2.4M', dom: 55, inventory: 15, type: 'equestrian' },
    ]
  },
  'paradise-valley': {
    id: 'paradise-valley',
    name: 'Paradise Valley',
    description: 'The Beverly Hills of Arizona. Acre-plus lots, historic luxury, and unmatched views of Camelback Mountain.',
    headerImage: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1200",
    lifestyle: [
      { label: 'Estate Living', img: "https://images.unsplash.com/photo-1600607687940-47a04b629733?auto=format&fit=crop&q=80&w=400" },
      { label: 'Mountain Views', img: "https://images.unsplash.com/photo-1545652985-5edd3ebc3437?auto=format&fit=crop&q=80&w=400" },
      { label: 'Resort Spas', img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=400" },
      { label: 'Quiet Zoning', img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=400" }
    ],
    qualitySignals: [
      { id: 'walk', label: 'Walkability', value: '15/100', rating: 15, detail: 'Large acreage estates.' },
      { id: 'air', label: 'Air Quality', value: '92 AQI', rating: 92, detail: 'Excellent air flow.' },
      { id: 'noise', label: 'Noise Index', value: '38 dB', rating: 90, detail: 'Strict noise ordinances.' },
      { id: 'safety', label: 'Safety Score', value: 'A', rating: 95, detail: 'Dedicated police force.' },
      { id: 'green', label: 'Green Space', value: '65%', rating: 65, detail: 'Private gardens and courses.' },
      { id: 'commute', label: 'Avg Commute', value: '20 min', rating: 60, detail: 'Central location.' },
    ],
    stats: { avgPrice: '$5.4M', inventory: 85, dom: 62, trend: '+8%', ppsf: '$1,150' },
    buyerData: {
      negotiability: "3.5% Disc.",
      inventoryTrend: "-2% (Tight)",
      forecast: "High Apprec.",
      priceDistribution: [
        { range: '< $2M', value: 5 },
        { range: '$2M-$4M', value: 20 },
        { range: '$4M-$8M', value: 50 },
        { range: '$8M+', value: 25 },
      ]
    },
    sellerData: {
      marketIndex: 45,
      cashBuyerPercent: "72%",
      daysToContract: "48 Days",
      yoyAppreciation: "+8.2%",
      saleToList: "96.5%"
    },
    enclaves: [
      { id: 'cameldale', name: 'Cameldale', avgPrice: '$6.5M', dom: 70, inventory: 12, type: 'estate' },
      { id: 'mockingbird', name: 'Mockingbird Lane', avgPrice: '$4.8M', dom: 55, inventory: 8, type: 'estate' },
      { id: 'mummy-mountain', name: 'Mummy Mountain', avgPrice: '$7.1M', dom: 90, inventory: 6, type: 'estate' },
    ]
  },
  'biltmore': {
    id: 'biltmore',
    name: 'Arcadia & Biltmore',
    description: 'Historic charm meets modern luxury. Lush citrus groves, green lawns, and proximity to high-end dining.',
    headerImage: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&q=80&w=1200",
    lifestyle: [
      { label: 'Historic Charm', img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=400" },
      { label: 'Lush Greenery', img: "https://images.unsplash.com/photo-1558234329-373b70747424?auto=format&fit=crop&q=80&w=400" },
      { label: 'Fine Dining', img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=400" },
      { label: 'Family Estates', img: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=400" }
    ],
    qualitySignals: [
      { id: 'walk', label: 'Walkability', value: '75/100', rating: 75, detail: 'Walkable to dining and canals.' },
      { id: 'air', label: 'Air Quality', value: '85 AQI', rating: 85, detail: 'Heavy vegetation helps.' },
      { id: 'noise', label: 'Noise Index', value: '45 dB', rating: 80, detail: 'Residential quiet.' },
      { id: 'safety', label: 'Safety Score', value: 'B+', rating: 88, detail: 'Family-oriented.' },
      { id: 'green', label: 'Green Space', value: '90%', rating: 90, detail: 'Highest vegetation density.' },
      { id: 'commute', label: 'Avg Commute', value: '15 min', rating: 90, detail: 'Rapid access everywhere.' },
    ],
    stats: { avgPrice: '$2.8M', inventory: 56, dom: 28, trend: '+15%', ppsf: '$920' },
    buyerData: {
      negotiability: "0% (List)",
      inventoryTrend: "-15% (Scarce)",
      forecast: "Aggressive",
      priceDistribution: [
        { range: '< $1.5M', value: 15 },
        { range: '$1.5M-$3M', value: 60 },
        { range: '$3M-$5M', value: 20 },
        { range: '$5M+', value: 5 },
      ]
    },
    sellerData: {
      marketIndex: 82,
      cashBuyerPercent: "45%",
      daysToContract: "14 Days",
      yoyAppreciation: "+15.5%",
      saleToList: "101.3%"
    },
    enclaves: [
      { id: 'arcadia-proper', name: 'Arcadia Proper', avgPrice: '$3.5M', dom: 30, inventory: 15, type: 'estate' },
      { id: 'biltmore-estates', name: 'Biltmore Estates', avgPrice: '$2.8M', dom: 40, inventory: 10, type: 'estate' },
      { id: 'arizona-biltmore', name: 'Arizona Biltmore', avgPrice: '$2.2M', dom: 35, inventory: 12, type: 'golf' },
    ]
  },
  'central-scottsdale': {
    id: 'central-scottsdale',
    name: 'Central Scottsdale',
    description: 'The heart of the city. Lakefront properties, equestrian estates, and easy access to Old Town.',
    headerImage: "https://images.unsplash.com/photo-1560613276-793264eb7478?auto=format&fit=crop&q=80&w=1200",
    lifestyle: [
      { label: 'Waterfront', img: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=400" },
      { label: 'Luxury Shopping', img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=400" },
      { label: 'Nightlife', img: "https://images.unsplash.com/photo-1514525253440-b393452e8d03?auto=format&fit=crop&q=80&w=400" },
      { label: 'Central Access', img: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=400" }
    ],
    qualitySignals: [
      { id: 'walk', label: 'Walkability', value: '65/100', rating: 65, detail: 'Walkable pockets near lakes.' },
      { id: 'air', label: 'Air Quality', value: '88 AQI', rating: 88, detail: 'Central greenbelt airflow.' },
      { id: 'noise', label: 'Noise Index', value: '50 dB', rating: 70, detail: 'Moderate urban activity.' },
      { id: 'safety', label: 'Safety Score', value: 'B', rating: 85, detail: 'Solid residential safety.' },
      { id: 'green', label: 'Green Space', value: '70%', rating: 70, detail: 'Extensive greenbelt system.' },
      { id: 'commute', label: 'Avg Commute', value: '18 min', rating: 85, detail: 'Perfectly centralized.' },
    ],
    stats: { avgPrice: '$1.8M', inventory: 112, dom: 35, trend: '+5%', ppsf: '$640' },
    buyerData: {
      negotiability: "1.5% Disc.",
      inventoryTrend: "+5% (Stable)",
      forecast: "Moderate",
      priceDistribution: [
        { range: '< $1M', value: 40 },
        { range: '$1M-$2M', value: 45 },
        { range: '$2M-$3M', value: 10 },
        { range: '$3M+', value: 5 },
      ]
    },
    sellerData: {
      marketIndex: 55,
      cashBuyerPercent: "30%",
      daysToContract: "32 Days",
      yoyAppreciation: "+5.2%",
      saleToList: "99.0%"
    },
    enclaves: [
      { id: 'mccormick-ranch', name: 'McCormick Ranch', avgPrice: '$2.3M', dom: 45, inventory: 22, type: 'golf' },
      { id: 'gainey-ranch', name: 'Gainey Ranch', avgPrice: '$1.9M', dom: 38, inventory: 18, type: 'golf' },
      { id: 'kierland', name: 'Kierland', avgPrice: '$1.6M', dom: 30, inventory: 25, type: 'urban' },
    ]
  },
  'cave-creek': {
    id: 'cave-creek',
    name: 'Carefree & Cave Creek',
    description: 'Western charm meets luxury living. Equestrian properties, artistic communities, and rugged Sonoran beauty.',
    headerImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200",
    lifestyle: [
      { label: 'Western Heritage', img: "https://images.unsplash.com/photo-1534313314376-2847290e3181?auto=format&fit=crop&q=80&w=400" },
      { label: 'Equestrian', img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400" },
      { label: 'Desert Beauty', img: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=400" },
      { label: 'Small Town Charm', img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=400" }
    ],
    qualitySignals: [
      { id: 'walk', label: 'Walkability', value: '20/100', rating: 20, detail: 'Rural setting, car essential.' },
      { id: 'air', label: 'Air Quality', value: '96 AQI', rating: 96, detail: 'Pristine high-desert air.' },
      { id: 'noise', label: 'Noise Index', value: '32 dB', rating: 98, detail: 'Serene and quiet.' },
      { id: 'safety', label: 'Safety Score', value: 'A', rating: 95, detail: 'Low-density, low crime.' },
      { id: 'green', label: 'Green Space', value: '90%', rating: 90, detail: 'Natural Sonoran preserve.' },
      { id: 'commute', label: 'Avg Commute', value: '35 min', rating: 30, detail: 'Remote location.' },
    ],
    stats: { avgPrice: '$1.6M', inventory: 90, dom: 52, trend: '+8%', ppsf: '$395' },
    buyerData: {
      negotiability: "2.0% Disc.",
      inventoryTrend: "+5% (Stable)",
      forecast: "Steady Growth",
      priceDistribution: [
        { range: '< $800K', value: 20 },
        { range: '$800K-$1.5M', value: 35 },
        { range: '$1.5M-$3M', value: 30 },
        { range: '$3M+', value: 15 },
      ]
    },
    sellerData: {
      marketIndex: 58,
      cashBuyerPercent: "52%",
      daysToContract: "38 Days",
      yoyAppreciation: "+7.5%",
      saleToList: "97.8%"
    },
    enclaves: [
      { id: 'carefree', name: 'Carefree', avgPrice: '$1.8M', dom: 55, inventory: 38, type: 'town' },
      { id: 'cave-creek', name: 'Cave Creek', avgPrice: '$1.4M', dom: 48, inventory: 52, type: 'western' },
    ]
  },
  'anthem': {
    id: 'anthem',
    name: 'North Phoenix',
    description: 'Master-planned luxury in North Phoenix. Resort-style living with top schools and modern amenities.',
    headerImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200",
    lifestyle: [
      { label: 'Resort Living', img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=400" },
      { label: 'Shopping', img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=400" },
      { label: 'Golf', img: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=400" },
      { label: 'Family', img: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=400" }
    ],
    qualitySignals: [
      { id: 'walk', label: 'Walkability', value: '45/100', rating: 45, detail: 'Walkable to shopping.' },
      { id: 'air', label: 'Air Quality', value: '88 AQI', rating: 88, detail: 'Good suburban air.' },
      { id: 'noise', label: 'Noise Index', value: '48 dB', rating: 75, detail: 'Moderate activity.' },
      { id: 'safety', label: 'Safety Score', value: 'A-', rating: 90, detail: 'Family-friendly area.' },
      { id: 'green', label: 'Green Space', value: '60%', rating: 60, detail: 'Parks and golf courses.' },
      { id: 'commute', label: 'Avg Commute', value: '25 min', rating: 55, detail: 'North location.' },
    ],
    stats: { avgPrice: '$850K', inventory: 65, dom: 32, trend: '+9%', ppsf: '$325' },
    buyerData: {
      negotiability: "1.5% Disc.",
      inventoryTrend: "+8% (Good)",
      forecast: "Strong Growth",
      priceDistribution: [
        { range: '< $500K', value: 25 },
        { range: '$500K-$800K', value: 40 },
        { range: '$800K-$1.5M', value: 25 },
        { range: '$1.5M+', value: 10 },
      ]
    },
    sellerData: {
      marketIndex: 62,
      cashBuyerPercent: "35%",
      daysToContract: "28 Days",
      yoyAppreciation: "+9.2%",
      saleToList: "99.2%"
    },
    enclaves: [
      { id: 'anthem-country-club', name: 'Anthem Country Club', avgPrice: '$850K', dom: 32, inventory: 65, type: 'master-planned' },
    ]
  },
  'fountain-hills': {
    id: 'fountain-hills',
    name: 'Fountain Hills',
    description: 'Scenic mountain living with world-famous fountain views. Championship golf, desert tranquility, and artistic community.',
    headerImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
    lifestyle: [
      { label: 'Mountain Views', img: "https://images.unsplash.com/photo-1545652985-5edd3ebc3437?auto=format&fit=crop&q=80&w=400" },
      { label: 'Golf', img: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=400" },
      { label: 'Art Community', img: "https://images.unsplash.com/photo-1532509854226-a2d9d8e66f8e?auto=format&fit=crop&q=80&w=400" },
      { label: 'Desert Serenity', img: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=400" }
    ],
    qualitySignals: [
      { id: 'walk', label: 'Walkability', value: '18/100', rating: 18, detail: 'Car-dependent mountain community.' },
      { id: 'air', label: 'Air Quality', value: '96 AQI', rating: 96, detail: 'Pristine desert air at elevation.' },
      { id: 'noise', label: 'Noise Index', value: '30 dB', rating: 97, detail: 'Exceptionally quiet mountain setting.' },
      { id: 'safety', label: 'Safety Score', value: 'A', rating: 95, detail: 'Very low crime rate.' },
      { id: 'green', label: 'Green Space', value: '80%', rating: 80, detail: 'Natural desert preserve surrounds.' },
      { id: 'commute', label: 'Avg Commute', value: '35 min', rating: 30, detail: 'Remote scenic location.' },
    ],
    stats: { avgPrice: '$1.4M', inventory: 78, dom: 48, trend: '+7%', ppsf: '$420' },
    buyerData: {
      negotiability: "1.8% Disc.",
      inventoryTrend: "+6% (Good)",
      forecast: "Steady Growth",
      priceDistribution: [
        { range: '< $700K', value: 20 },
        { range: '$700K-$1.5M', value: 40 },
        { range: '$1.5M-$3M', value: 30 },
        { range: '$3M+', value: 10 },
      ]
    },
    sellerData: {
      marketIndex: 60,
      cashBuyerPercent: "48%",
      daysToContract: "30 Days",
      yoyAppreciation: "+7.1%",
      saleToList: "98.2%"
    },
    enclaves: [
      { id: 'eagle-mountain', name: 'Eagle Mountain', avgPrice: '$1.2M', dom: 42, inventory: 28, type: 'golf' },
      { id: 'firerock', name: 'FireRock', avgPrice: '$1.8M', dom: 55, inventory: 15, type: 'guard-gated' },
    ]
  },
  'peoria': {
    id: 'peoria',
    name: 'Peoria & West Valley',
    description: 'Growing luxury corridor in the West Valley. New-build estates, spring training facilities, and family-oriented communities.',
    headerImage: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=1200",
    lifestyle: [
      { label: 'New Construction', img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=400" },
      { label: 'Spring Training', img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=400" },
      { label: 'Lake Pleasant', img: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=400" },
      { label: 'Family Living', img: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=400" }
    ],
    qualitySignals: [
      { id: 'walk', label: 'Walkability', value: '40/100', rating: 40, detail: 'Walkable to shopping centers.' },
      { id: 'air', label: 'Air Quality', value: '86 AQI', rating: 86, detail: 'Good suburban air quality.' },
      { id: 'noise', label: 'Noise Index', value: '45 dB', rating: 78, detail: 'Suburban quiet neighborhoods.' },
      { id: 'safety', label: 'Safety Score', value: 'A-', rating: 90, detail: 'Family-safe communities.' },
      { id: 'green', label: 'Green Space', value: '55%', rating: 55, detail: 'Parks and lake access.' },
      { id: 'commute', label: 'Avg Commute', value: '30 min', rating: 45, detail: 'West Valley location.' },
    ],
    stats: { avgPrice: '$750K', inventory: 85, dom: 28, trend: '+11%', ppsf: '$295' },
    buyerData: {
      negotiability: "1.0% Disc.",
      inventoryTrend: "+10% (Good)",
      forecast: "Strong Growth",
      priceDistribution: [
        { range: '< $500K', value: 30 },
        { range: '$500K-$800K', value: 40 },
        { range: '$800K-$1.2M', value: 20 },
        { range: '$1.2M+', value: 10 },
      ]
    },
    sellerData: {
      marketIndex: 65,
      cashBuyerPercent: "28%",
      daysToContract: "24 Days",
      yoyAppreciation: "+11.2%",
      saleToList: "99.5%"
    },
    enclaves: [
      { id: 'vistancia', name: 'Vistancia', avgPrice: '$750K', dom: 28, inventory: 45, type: 'master-planned' },
      { id: 'trilogy-at-vistancia', name: 'Trilogy at Vistancia', avgPrice: '$650K', dom: 25, inventory: 40, type: 'active-adult' },
    ]
  },
};

// Featured listings data for each enclave
interface FeaturedListing {
  id: string;
  address: string;
  price: string;
  beds: number;
  baths: number;
  sqft: string;
  image: string;
  status: 'active' | 'pending' | 'just-listed';
}

interface EnclaveMarketData {
  priceChange: string;
  avgPpsf: string;
  listToSale: string;
  hotness: 'hot' | 'warm' | 'balanced' | 'cooling';
  absorptionRate: string;
  medianDom: number;
  newListings30d: number;
  pendingSales: number;
  closedSales30d: number;
  avgPriceReduction: string;
  monthsSupply: string;
  pricePerSqftTrend: { month: string; value: number }[];
  recentSales: { price: string; date: string; ppsf: string }[];
}

const ENCLAVE_FEATURED_LISTINGS: Record<string, { listings: FeaturedListing[]; marketData: EnclaveMarketData }> = {
  'desert-mountain': {
    listings: [
      { id: 'dm-1', address: '10040 E Happy Valley Rd #330', price: '$4,950,000', beds: 5, baths: 6, sqft: '7,200', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=400', status: 'active' },
      { id: 'dm-2', address: '9820 E Thompson Peak Pkwy', price: '$3,850,000', beds: 4, baths: 5, sqft: '5,800', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=400', status: 'just-listed' },
      { id: 'dm-3', address: '41588 N 101st Way', price: '$5,200,000', beds: 6, baths: 7, sqft: '8,500', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=400', status: 'pending' },
    ],
    marketData: {
      priceChange: '+8.5%', avgPpsf: '$625', listToSale: '97.2%', hotness: 'hot',
      absorptionRate: '2.1 mo', medianDom: 35, newListings30d: 8, pendingSales: 12, closedSales30d: 6,
      avgPriceReduction: '-2.8%', monthsSupply: '3.2',
      pricePerSqftTrend: [{ month: 'Jul', value: 598 }, { month: 'Aug', value: 605 }, { month: 'Sep', value: 612 }, { month: 'Oct', value: 625 }],
      recentSales: [{ price: '$4.2M', date: 'Oct 15', ppsf: '$618' }, { price: '$5.1M', date: 'Oct 8', ppsf: '$632' }, { price: '$3.8M', date: 'Sep 28', ppsf: '$595' }]
    }
  },
  'silverleaf': {
    listings: [
      { id: 'sl-1', address: '10696 E Wingspan Way', price: '$12,500,000', beds: 6, baths: 8, sqft: '12,000', image: 'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&q=80&w=400', status: 'active' },
      { id: 'sl-2', address: '20913 N 104th St', price: '$8,750,000', beds: 5, baths: 7, sqft: '9,200', image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=400', status: 'active' },
      { id: 'sl-3', address: '10801 E Happy Valley Rd #114', price: '$7,200,000', beds: 5, baths: 6, sqft: '7,800', image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=400', status: 'just-listed' },
    ],
    marketData: {
      priceChange: '+5.2%', avgPpsf: '$1,050', listToSale: '94.5%', hotness: 'balanced',
      absorptionRate: '5.8 mo', medianDom: 90, newListings30d: 3, pendingSales: 2, closedSales30d: 2,
      avgPriceReduction: '-5.2%', monthsSupply: '7.5',
      pricePerSqftTrend: [{ month: 'Jul', value: 1020 }, { month: 'Aug', value: 1035 }, { month: 'Sep', value: 1042 }, { month: 'Oct', value: 1050 }],
      recentSales: [{ price: '$9.8M', date: 'Oct 12', ppsf: '$1,085' }, { price: '$7.2M', date: 'Sep 22', ppsf: '$1,025' }]
    }
  },
  'dc-ranch': {
    listings: [
      { id: 'dc-1', address: '9290 E Thompson Peak Pkwy #227', price: '$3,200,000', beds: 4, baths: 5, sqft: '4,800', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400', status: 'active' },
      { id: 'dc-2', address: '20750 N 87th St #1091', price: '$4,100,000', beds: 5, baths: 5, sqft: '5,500', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=400', status: 'pending' },
      { id: 'dc-3', address: '9820 E Thompson Peak Pkwy #706', price: '$2,950,000', beds: 4, baths: 4, sqft: '4,200', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=400', status: 'active' },
    ],
    marketData: {
      priceChange: '+11.2%', avgPpsf: '$720', listToSale: '98.8%', hotness: 'hot',
      absorptionRate: '1.6 mo', medianDom: 28, newListings30d: 10, pendingSales: 8, closedSales30d: 9,
      avgPriceReduction: '-1.2%', monthsSupply: '2.8',
      pricePerSqftTrend: [{ month: 'Jul', value: 685 }, { month: 'Aug', value: 698 }, { month: 'Sep', value: 710 }, { month: 'Oct', value: 720 }],
      recentSales: [{ price: '$3.4M', date: 'Oct 18', ppsf: '$728' }, { price: '$2.9M', date: 'Oct 10', ppsf: '$712' }, { price: '$3.8M', date: 'Oct 2', ppsf: '$695' }]
    }
  },
  'mirabel': {
    listings: [
      { id: 'mi-1', address: '37200 N Cave Creek Rd #1056', price: '$2,850,000', beds: 4, baths: 5, sqft: '4,600', image: 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&q=80&w=400', status: 'active' },
      { id: 'mi-2', address: '10040 E Happy Valley Rd #456', price: '$3,400,000', beds: 5, baths: 5, sqft: '5,200', image: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?auto=format&fit=crop&q=80&w=400', status: 'just-listed' },
    ],
    marketData: {
      priceChange: '+6.8%', avgPpsf: '$595', listToSale: '96.5%', hotness: 'warm',
      absorptionRate: '3.2 mo', medianDom: 48, newListings30d: 4, pendingSales: 3, closedSales30d: 3,
      avgPriceReduction: '-3.5%', monthsSupply: '4.5',
      pricePerSqftTrend: [{ month: 'Jul', value: 565 }, { month: 'Aug', value: 575 }, { month: 'Sep', value: 585 }, { month: 'Oct', value: 595 }],
      recentSales: [{ price: '$2.9M', date: 'Oct 14', ppsf: '$602' }, { price: '$3.2M', date: 'Sep 30', ppsf: '$588' }]
    }
  },
  'estancia': {
    listings: [
      { id: 'es-1', address: '27950 N 103rd Pl', price: '$6,200,000', beds: 5, baths: 6, sqft: '7,400', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=400', status: 'active' },
      { id: 'es-2', address: '28009 N 90th Way', price: '$5,500,000', beds: 5, baths: 5, sqft: '6,800', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=400', status: 'active' },
    ],
    marketData: {
      priceChange: '+4.5%', avgPpsf: '$810', listToSale: '95.2%', hotness: 'balanced',
      absorptionRate: '4.5 mo', medianDom: 55, newListings30d: 2, pendingSales: 2, closedSales30d: 2,
      avgPriceReduction: '-4.2%', monthsSupply: '6.0',
      pricePerSqftTrend: [{ month: 'Jul', value: 785 }, { month: 'Aug', value: 792 }, { month: 'Sep', value: 800 }, { month: 'Oct', value: 810 }],
      recentSales: [{ price: '$5.8M', date: 'Oct 5', ppsf: '$825' }, { price: '$6.1M', date: 'Sep 18', ppsf: '$798' }]
    }
  },
  'troon-north': {
    listings: [
      { id: 'tn-1', address: '10040 E Happy Valley Rd #2025', price: '$2,450,000', beds: 4, baths: 4, sqft: '4,100', image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=400', status: 'just-listed' },
      { id: 'tn-2', address: '25150 N Windy Walk Dr #38', price: '$3,100,000', beds: 4, baths: 5, sqft: '4,800', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=400', status: 'active' },
      { id: 'tn-3', address: '26125 N 104th Way', price: '$2,750,000', beds: 4, baths: 4, sqft: '4,400', image: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&q=80&w=400', status: 'pending' },
    ],
    marketData: {
      priceChange: '+9.8%', avgPpsf: '$680', listToSale: '99.1%', hotness: 'hot',
      absorptionRate: '1.8 mo', medianDom: 32, newListings30d: 7, pendingSales: 6, closedSales30d: 5,
      avgPriceReduction: '-1.5%', monthsSupply: '2.5',
      pricePerSqftTrend: [{ month: 'Jul', value: 645 }, { month: 'Aug', value: 658 }, { month: 'Sep', value: 672 }, { month: 'Oct', value: 680 }],
      recentSales: [{ price: '$2.8M', date: 'Oct 16', ppsf: '$692' }, { price: '$3.2M', date: 'Oct 8', ppsf: '$675' }, { price: '$2.5M', date: 'Sep 25', ppsf: '$668' }]
    }
  },
  'grayhawk': {
    listings: [
      { id: 'gh-1', address: '19550 N Grayhawk Dr #1054', price: '$1,350,000', beds: 4, baths: 3, sqft: '3,200', image: 'https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?auto=format&fit=crop&q=80&w=400', status: 'active' },
      { id: 'gh-2', address: '8989 E Gainey Center Dr #228', price: '$1,650,000', beds: 4, baths: 4, sqft: '3,600', image: 'https://images.unsplash.com/photo-1600607687166-86c1e3b10c5a?auto=format&fit=crop&q=80&w=400', status: 'just-listed' },
      { id: 'gh-3', address: '20121 N 76th St #1007', price: '$1,450,000', beds: 3, baths: 3, sqft: '2,900', image: 'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&q=80&w=400', status: 'active' },
    ],
    marketData: {
      priceChange: '+7.2%', avgPpsf: '$485', listToSale: '100.2%', hotness: 'hot',
      absorptionRate: '1.4 mo', medianDom: 25, newListings30d: 12, pendingSales: 10, closedSales30d: 11,
      avgPriceReduction: '0%', monthsSupply: '2.0',
      pricePerSqftTrend: [{ month: 'Jul', value: 458 }, { month: 'Aug', value: 468 }, { month: 'Sep', value: 478 }, { month: 'Oct', value: 485 }],
      recentSales: [{ price: '$1.5M', date: 'Oct 19', ppsf: '$492' }, { price: '$1.4M', date: 'Oct 12', ppsf: '$480' }, { price: '$1.6M', date: 'Oct 5', ppsf: '$488' }]
    }
  },
  'cameldale': {
    listings: [
      { id: 'cd-1', address: '6116 N 38th Pl', price: '$7,500,000', beds: 5, baths: 6, sqft: '7,800', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=400', status: 'active' },
      { id: 'cd-2', address: '5825 E Camelback Rd', price: '$5,900,000', beds: 5, baths: 5, sqft: '6,200', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=400', status: 'pending' },
    ],
    marketData: {
      priceChange: '+3.8%', avgPpsf: '$985', listToSale: '94.8%', hotness: 'balanced',
      absorptionRate: '4.8 mo', medianDom: 70, newListings30d: 2, pendingSales: 1, closedSales30d: 1,
      avgPriceReduction: '-5.5%', monthsSupply: '6.5',
      pricePerSqftTrend: [{ month: 'Jul', value: 958 }, { month: 'Aug', value: 968 }, { month: 'Sep', value: 975 }, { month: 'Oct', value: 985 }],
      recentSales: [{ price: '$6.8M', date: 'Oct 8', ppsf: '$998' }, { price: '$5.5M', date: 'Sep 15', ppsf: '$972' }]
    }
  },
  'mockingbird': {
    listings: [
      { id: 'mb-1', address: '5600 N Mockingbird Ln', price: '$5,200,000', beds: 5, baths: 5, sqft: '5,800', image: 'https://images.unsplash.com/photo-1600047509782-20d39509f26d?auto=format&fit=crop&q=80&w=400', status: 'just-listed' },
      { id: 'mb-2', address: '5425 E Lincoln Dr #36', price: '$4,600,000', beds: 4, baths: 5, sqft: '5,200', image: 'https://images.unsplash.com/photo-1600566752229-250ed79470f8?auto=format&fit=crop&q=80&w=400', status: 'active' },
    ],
    marketData: {
      priceChange: '+5.5%', avgPpsf: '$895', listToSale: '96.2%', hotness: 'warm',
      absorptionRate: '3.8 mo', medianDom: 55, newListings30d: 3, pendingSales: 2, closedSales30d: 2,
      avgPriceReduction: '-3.8%', monthsSupply: '5.0',
      pricePerSqftTrend: [{ month: 'Jul', value: 862 }, { month: 'Aug', value: 875 }, { month: 'Sep', value: 885 }, { month: 'Oct', value: 895 }],
      recentSales: [{ price: '$4.8M', date: 'Oct 12', ppsf: '$908' }, { price: '$5.2M', date: 'Sep 28', ppsf: '$882' }]
    }
  },
  'mummy-mountain': {
    listings: [
      { id: 'mm-1', address: '5815 N Saguaro Rd', price: '$8,900,000', beds: 6, baths: 7, sqft: '9,500', image: 'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&q=80&w=400', status: 'active' },
    ],
    marketData: {
      priceChange: '+2.1%', avgPpsf: '$1,150', listToSale: '92.5%', hotness: 'cooling',
      absorptionRate: '8.2 mo', medianDom: 120, newListings30d: 1, pendingSales: 0, closedSales30d: 1,
      avgPriceReduction: '-7.5%', monthsSupply: '10.0',
      pricePerSqftTrend: [{ month: 'Jul', value: 1135 }, { month: 'Aug', value: 1140 }, { month: 'Sep', value: 1145 }, { month: 'Oct', value: 1150 }],
      recentSales: [{ price: '$7.2M', date: 'Sep 20', ppsf: '$1,125' }]
    }
  },
  'arcadia-proper': {
    listings: [
      { id: 'ap-1', address: '5102 E Lafayette Blvd', price: '$3,850,000', beds: 5, baths: 5, sqft: '4,600', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400', status: 'just-listed' },
      { id: 'ap-2', address: '4901 E Calle Del Medio', price: '$3,200,000', beds: 4, baths: 4, sqft: '4,100', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=400', status: 'active' },
      { id: 'ap-3', address: '5220 E Arcadia Ln', price: '$4,100,000', beds: 5, baths: 5, sqft: '5,000', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=400', status: 'active' },
    ],
    marketData: {
      priceChange: '+14.2%', avgPpsf: '$875', listToSale: '102.5%', hotness: 'hot',
      absorptionRate: '1.2 mo', medianDom: 18, newListings30d: 8, pendingSales: 7, closedSales30d: 9,
      avgPriceReduction: '0%', monthsSupply: '1.5',
      pricePerSqftTrend: [{ month: 'Jul', value: 795 }, { month: 'Aug', value: 825 }, { month: 'Sep', value: 852 }, { month: 'Oct', value: 875 }],
      recentSales: [{ price: '$3.6M', date: 'Oct 20', ppsf: '$892' }, { price: '$4.2M', date: 'Oct 15', ppsf: '$868' }, { price: '$3.1M', date: 'Oct 8', ppsf: '$855' }]
    }
  },
  'biltmore-estates': {
    listings: [
      { id: 'be-1', address: '2525 E Arizona Biltmore Cir #C128', price: '$2,450,000', beds: 4, baths: 4, sqft: '3,800', image: 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&q=80&w=400', status: 'active' },
      { id: 'be-2', address: '2401 E Bethany Home Rd', price: '$3,100,000', beds: 5, baths: 5, sqft: '4,400', image: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?auto=format&fit=crop&q=80&w=400', status: 'pending' },
    ],
    marketData: {
      priceChange: '+10.8%', avgPpsf: '$750', listToSale: '99.5%', hotness: 'hot',
      absorptionRate: '1.8 mo', medianDom: 25, newListings30d: 5, pendingSales: 4, closedSales30d: 5,
      avgPriceReduction: '-0.8%', monthsSupply: '2.2',
      pricePerSqftTrend: [{ month: 'Jul', value: 698 }, { month: 'Aug', value: 718 }, { month: 'Sep', value: 735 }, { month: 'Oct', value: 750 }],
      recentSales: [{ price: '$2.8M', date: 'Oct 18', ppsf: '$762' }, { price: '$3.2M', date: 'Oct 10', ppsf: '$745' }]
    }
  },
  'arizona-biltmore': {
    listings: [
      { id: 'ab-1', address: '2323 E Missouri Ave', price: '$1,950,000', beds: 4, baths: 3, sqft: '3,200', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=400', status: 'active' },
      { id: 'ab-2', address: '2211 E Camelback Rd #602', price: '$2,350,000', beds: 3, baths: 3, sqft: '2,800', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=400', status: 'just-listed' },
    ],
    marketData: {
      priceChange: '+8.5%', avgPpsf: '$695', listToSale: '98.2%', hotness: 'warm',
      absorptionRate: '2.5 mo', medianDom: 35, newListings30d: 4, pendingSales: 3, closedSales30d: 4,
      avgPriceReduction: '-2.2%', monthsSupply: '3.0',
      pricePerSqftTrend: [{ month: 'Jul', value: 658 }, { month: 'Aug', value: 672 }, { month: 'Sep', value: 685 }, { month: 'Oct', value: 695 }],
      recentSales: [{ price: '$2.1M', date: 'Oct 14', ppsf: '$708' }, { price: '$1.9M', date: 'Oct 5', ppsf: '$688' }]
    }
  },
  'mccormick-ranch': {
    listings: [
      { id: 'mc-1', address: '8989 N Gainey Center Dr', price: '$2,100,000', beds: 4, baths: 4, sqft: '3,600', image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=400', status: 'active' },
      { id: 'mc-2', address: '7500 E McCormick Pkwy #42', price: '$2,450,000', beds: 4, baths: 4, sqft: '4,000', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=400', status: 'active' },
    ],
    marketData: {
      priceChange: '+6.5%', avgPpsf: '$620', listToSale: '97.8%', hotness: 'warm',
      absorptionRate: '2.8 mo', medianDom: 38, newListings30d: 6, pendingSales: 4, closedSales30d: 5,
      avgPriceReduction: '-2.5%', monthsSupply: '3.5',
      pricePerSqftTrend: [{ month: 'Jul', value: 592 }, { month: 'Aug', value: 602 }, { month: 'Sep', value: 612 }, { month: 'Oct', value: 620 }],
      recentSales: [{ price: '$2.3M', date: 'Oct 16', ppsf: '$632' }, { price: '$2.0M', date: 'Oct 8', ppsf: '$615' }]
    }
  },
  'gainey-ranch': {
    listings: [
      { id: 'gr-1', address: '7710 E Gainey Ranch Rd #205', price: '$1,750,000', beds: 3, baths: 3, sqft: '2,900', image: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&q=80&w=400', status: 'just-listed' },
      { id: 'gr-2', address: '7525 E Gainey Ranch Rd #114', price: '$2,050,000', beds: 4, baths: 4, sqft: '3,400', image: 'https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?auto=format&fit=crop&q=80&w=400', status: 'active' },
    ],
    marketData: {
      priceChange: '+5.2%', avgPpsf: '$585', listToSale: '98.5%', hotness: 'warm',
      absorptionRate: '3.0 mo', medianDom: 42, newListings30d: 5, pendingSales: 3, closedSales30d: 4,
      avgPriceReduction: '-2.8%', monthsSupply: '4.0',
      pricePerSqftTrend: [{ month: 'Jul', value: 558 }, { month: 'Aug', value: 568 }, { month: 'Sep', value: 578 }, { month: 'Oct', value: 585 }],
      recentSales: [{ price: '$1.9M', date: 'Oct 12', ppsf: '$598' }, { price: '$1.8M', date: 'Oct 2', ppsf: '$578' }]
    }
  },
  'kierland': {
    listings: [
      { id: 'kl-1', address: '15215 N Kierland Blvd #535', price: '$1,450,000', beds: 3, baths: 3, sqft: '2,400', image: 'https://images.unsplash.com/photo-1600607687166-86c1e3b10c5a?auto=format&fit=crop&q=80&w=400', status: 'active' },
      { id: 'kl-2', address: '6803 E Main St #4410', price: '$1,750,000', beds: 3, baths: 3, sqft: '2,800', image: 'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&q=80&w=400', status: 'pending' },
      { id: 'kl-3', address: '15802 N 71st St #402', price: '$1,350,000', beds: 2, baths: 2, sqft: '2,100', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=400', status: 'just-listed' },
    ],
    marketData: {
      priceChange: '+9.2%', avgPpsf: '$575', listToSale: '100.5%', hotness: 'hot',
      absorptionRate: '1.5 mo', medianDom: 22, newListings30d: 9, pendingSales: 8, closedSales30d: 10,
      avgPriceReduction: '0%', monthsSupply: '2.0',
      pricePerSqftTrend: [{ month: 'Jul', value: 538 }, { month: 'Aug', value: 552 }, { month: 'Sep', value: 565 }, { month: 'Oct', value: 575 }],
      recentSales: [{ price: '$1.6M', date: 'Oct 19', ppsf: '$588' }, { price: '$1.4M', date: 'Oct 12', ppsf: '$572' }, { price: '$1.8M', date: 'Oct 5', ppsf: '$580' }]
    }
  },
  'roosevelt-row': {
    listings: [
      { id: 'rr-1', address: '1 E Lexington Ave #1503', price: '$725,000', beds: 2, baths: 2, sqft: '1,400', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=400', status: 'active' },
      { id: 'rr-2', address: '215 E McKinley St #308', price: '$580,000', beds: 1, baths: 1, sqft: '950', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=400', status: 'just-listed' },
    ],
    marketData: {
      priceChange: '+4.8%', avgPpsf: '$495', listToSale: '98.2%', hotness: 'warm',
      absorptionRate: '2.8 mo', medianDom: 35, newListings30d: 12, pendingSales: 8, closedSales30d: 10,
      avgPriceReduction: '-2.0%', monthsSupply: '3.2',
      pricePerSqftTrend: [{ month: 'Jul', value: 472 }, { month: 'Aug', value: 480 }, { month: 'Sep', value: 488 }, { month: 'Oct', value: 495 }],
      recentSales: [{ price: '$695K', date: 'Oct 18', ppsf: '$502' }, { price: '$620K', date: 'Oct 10', ppsf: '$488' }]
    }
  },
  'willo': {
    listings: [
      { id: 'wi-1', address: '318 W Monte Vista Rd', price: '$1,350,000', beds: 4, baths: 3, sqft: '2,800', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=400', status: 'active' },
      { id: 'wi-2', address: '502 W Coronado Rd', price: '$1,150,000', beds: 3, baths: 2, sqft: '2,200', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=400', status: 'active' },
    ],
    marketData: {
      priceChange: '+12.5%', avgPpsf: '$520', listToSale: '101.2%', hotness: 'hot',
      absorptionRate: '1.3 mo', medianDom: 18, newListings30d: 6, pendingSales: 5, closedSales30d: 7,
      avgPriceReduction: '0%', monthsSupply: '1.2',
      pricePerSqftTrend: [{ month: 'Jul', value: 475 }, { month: 'Aug', value: 492 }, { month: 'Sep', value: 508 }, { month: 'Oct', value: 520 }],
      recentSales: [{ price: '$1.4M', date: 'Oct 17', ppsf: '$535' }, { price: '$1.2M', date: 'Oct 10', ppsf: '$518' }, { price: '$1.3M', date: 'Oct 2', ppsf: '$512' }]
    }
  },
  'encanto': {
    listings: [
      { id: 'en-1', address: '2102 N Central Ave #E5', price: '$1,550,000', beds: 4, baths: 3, sqft: '3,100', image: 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&q=80&w=400', status: 'just-listed' },
      { id: 'en-2', address: '1801 W Encanto Blvd', price: '$1,250,000', beds: 3, baths: 3, sqft: '2,600', image: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?auto=format&fit=crop&q=80&w=400', status: 'active' },
    ],
    marketData: {
      priceChange: '+7.8%', avgPpsf: '$495', listToSale: '99.5%', hotness: 'warm',
      absorptionRate: '2.2 mo', medianDom: 32, newListings30d: 5, pendingSales: 4, closedSales30d: 5,
      avgPriceReduction: '-1.5%', monthsSupply: '2.8',
      pricePerSqftTrend: [{ month: 'Jul', value: 468 }, { month: 'Aug', value: 478 }, { month: 'Sep', value: 488 }, { month: 'Oct', value: 495 }],
      recentSales: [{ price: '$1.4M', date: 'Oct 15', ppsf: '$508' }, { price: '$1.2M', date: 'Oct 8', ppsf: '$492' }]
    }
  }
};

const getSignalIcon = (id: string) => {
  switch (id) {
    case 'walk': return <Footprints size={18} />;
    case 'air': return <Wind size={18} />;
    case 'noise': return <Activity size={18} />;
    case 'safety': return <ShieldCheck size={18} />;
    case 'green': return <Leaf size={18} />;
    case 'commute': return <Car size={18} />;
    default: return <Award size={18} />;
  }
};

// MapController removed — handled via useEffect + mapRef in main component

// --- Search types ---
interface SearchItem {
  id: string;
  name: string;
  type: 'region' | 'community' | 'city' | 'zipcode';
  regionId: string;
  communitySlug?: string;
}

function buildSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [];

  // Regions
  for (const r of getRegions()) {
    items.push({ id: r.id, name: r.name, type: 'region', regionId: r.id });
  }

  // Communities
  for (const c of getAllCommunities()) {
    items.push({
      id: c.slug,
      name: c.name,
      type: 'community',
      regionId: c.identity.regionId,
      communitySlug: c.slug,
    });
  }

  // Cities (deduplicated)
  const cities = new Set<string>();
  for (const c of getAllCommunities()) {
    if (!cities.has(c.city)) {
      cities.add(c.city);
      items.push({
        id: `city-${c.city.toLowerCase().replace(/\s+/g, '-')}`,
        name: c.city,
        type: 'city',
        regionId: c.identity.regionId,
      });
    }
  }

  // Zip codes (deduplicated)
  const zips = new Set<string>();
  for (const c of getAllCommunities()) {
    if (!zips.has(c.zipCode)) {
      zips.add(c.zipCode);
      items.push({
        id: `zip-${c.zipCode}`,
        name: `${c.zipCode} - ${c.city}`,
        type: 'zipcode',
        regionId: c.identity.regionId,
      });
    }
  }

  return items;
}

function fuzzySearch(query: string, items: SearchItem[]): SearchItem[] {
  if (!query.trim()) return [];
  const searchTerms = query.toLowerCase().split(/\s+/);

  return items
    .map(item => {
      const name = item.name.toLowerCase();
      let score = 0;
      if (name === query.toLowerCase()) score = 100;
      else if (name.startsWith(query.toLowerCase())) score = 80;
      else if (name.includes(query.toLowerCase())) score = 60;
      else if (searchTerms.every(term => name.includes(term))) score = 40;
      else {
        const matched = searchTerms.filter(term => name.includes(term));
        score = (matched.length / searchTerms.length) * 30;
      }
      if (item.type === 'zipcode' && /^\d+$/.test(query) && item.name.includes(query)) score += 20;
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ item }) => item);
}

const getSearchIcon = (type: SearchItem['type']) => {
  switch (type) {
    case 'region': return <Map size={14} className="text-[#Bfa67a]" />;
    case 'community': return <Home size={14} className="text-[#0C1C2E]" />;
    case 'city': return <Building2 size={14} className="text-gray-500" />;
    case 'zipcode': return <Hash size={14} className="text-gray-500" />;
  }
};

// --- Main Component ---

const InteractiveMap: React.FC = () => {
  // GeoJSON state
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedRegion, setSelectedRegion] = useState<string | null>('north-scottsdale');
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [hoveredCommunity, setHoveredCommunity] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // UI state
  const [showCommunities, setShowCommunities] = useState(true);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite'>('dark');
  const [expandedCommunity, setExpandedCommunity] = useState<string | null>(null);
  const [cardTab, setCardTab] = useState<'listings' | 'market' | 'lifestyle'>('listings');
  const [performanceView, setPerformanceView] = useState<'buyer' | 'seller'>('buyer');

  const panelRef = useRef<HTMLDivElement>(null);

  // Zone data for current region
  const currentZoneData = selectedRegion ? ZONE_DETAILS[selectedRegion] : null;

  // Build search index once
  const searchIndex = useMemo(() => buildSearchIndex(), []);

  // Load GeoJSON on mount
  useEffect(() => {
    loadGeoJSON()
      .then(data => {
        setGeoData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load map data');
        setLoading(false);
      });
  }, []);

  // Search handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchResults(fuzzySearch(query, searchIndex));
  };

  const handleSearchSelect = (item: SearchItem) => {
    setSelectedRegion(item.regionId);
    if (item.communitySlug) {
      setSelectedCommunity(item.communitySlug);
      setExpandedCommunity(item.communitySlug);
    } else {
      setSelectedCommunity(null);
    }
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to expanded community card
  useEffect(() => {
    if (expandedCommunity) {
      const cardEl = document.getElementById(`community-card-${expandedCommunity}`);
      if (cardEl) {
        setTimeout(() => {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [expandedCommunity]);

  // Current region communities
  const regionCommunities = useMemo(() => {
    if (!selectedRegion) return [];
    return getCommunitiesByRegion(selectedRegion);
  }, [selectedRegion]);

  const regionName = selectedRegion ? getRegionName(selectedRegion) : '';
  const regionDescription = selectedRegion ? getRegionDescription(selectedRegion) : '';

  // Filter GeoJSON communities for current region
  const regionCommunityFeatures = useMemo(() => {
    if (!geoData || !selectedRegion) return [];
    return geoData.communities.features.filter(f => {
      const community = getCommunityById(f.properties.slug);
      return community?.region === selectedRegion;
    });
  }, [geoData, selectedRegion]);

  // --- Map ref and helpers ---
  const mapRef = useRef<MapRef>(null);

  // Separate polygon and point communities into GeoJSON sources
  // Polygons get regionId injected for data-driven styling
  const polygonGeoJson = useMemo<FeatureCollection | null>(() => {
    if (!geoData) return null;
    return {
      type: 'FeatureCollection',
      features: geoData.communities.features
        .filter(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
        .map(f => ({
          ...f,
          properties: {
            ...f.properties,
            regionId: getCommunityById(f.properties.slug)?.region ?? '',
          },
        })),
    };
  }, [geoData]);

  const pointGeoJson = useMemo<FeatureCollection | null>(() => {
    if (!geoData) return null;
    return {
      type: 'FeatureCollection',
      features: geoData.communities.features
        .filter(f => f.geometry.type === 'Point')
        .map(f => ({
          ...f,
          properties: {
            ...f.properties,
            regionId: getCommunityById(f.properties.slug)?.region ?? '',
          },
        })),
    };
  }, [geoData]);

  // Fly to selected feature
  useEffect(() => {
    if (!geoData || !mapRef.current) return;
    const map = mapRef.current;

    if (selectedCommunity) {
      const feature = geoData.communities.features.find(
        f => f.properties.slug === selectedCommunity
      );
      if (feature) {
        if (feature.geometry.type === 'Point') {
          const [lng, lat] = feature.geometry.coordinates;
          map.flyTo({ center: [lng, lat], zoom: 14, duration: 800 });
        } else {
          const bounds = getGeometryBounds(feature.geometry as Polygon | MultiPolygon);
          map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
        }
      }
    } else if (selectedRegion) {
      const regionFeatures = geoData.communities.features.filter(f => {
        const c = getCommunityById(f.properties.slug);
        return c?.region === selectedRegion;
      });
      if (regionFeatures.length > 0) {
        const allLngs: number[] = [];
        const allLats: number[] = [];
        for (const f of regionFeatures) {
          if (f.geometry.type === 'Point') {
            allLngs.push(f.geometry.coordinates[0]);
            allLats.push(f.geometry.coordinates[1]);
          } else {
            const b = getGeometryBounds(f.geometry as Polygon | MultiPolygon);
            const [[minLng, minLat], [maxLng, maxLat]] = b as [[number, number], [number, number]];
            allLngs.push(minLng, maxLng);
            allLats.push(minLat, maxLat);
          }
        }
        map.fitBounds(
          [[Math.min(...allLngs), Math.min(...allLats)], [Math.max(...allLngs), Math.max(...allLats)]],
          { padding: 50, maxZoom: 13 }
        );
      }
    }
  }, [selectedRegion, selectedCommunity, geoData]);

  // Map event handlers
  const onMapClick = useCallback((e: MapLayerMouseEvent) => {
    if (!e.features || e.features.length === 0) return;
    const slug = e.features[0].properties?.slug as string;
    if (!slug) return;
    const community = getCommunityById(slug);
    setSelectedCommunity(slug);
    if (community) setSelectedRegion(community.identity.regionId);
    setExpandedCommunity(slug);
  }, []);

  const onMapMouseMove = useCallback((e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const slug = e.features[0].properties?.slug as string;
      setHoveredCommunity(slug ?? null);
      if (mapRef.current) mapRef.current.getMap().getCanvas().style.cursor = 'pointer';
    }
  }, []);

  const onMapMouseLeave = useCallback(() => {
    setHoveredCommunity(null);
    if (mapRef.current) mapRef.current.getMap().getCanvas().style.cursor = '';
  }, []);

  // --- Loading / Error states ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col">
        <Navigation variant="solid" />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-[#Bfa67a] mx-auto mb-4" />
            <p className="text-sm text-gray-500 uppercase tracking-widest">Loading Map Data</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !geoData) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col">
        <Navigation variant="solid" />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center max-w-md">
            <p className="text-lg font-serif text-[#0C1C2E] mb-2">Unable to load map data</p>
            <p className="text-sm text-gray-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-[#0C1C2E] text-white text-sm uppercase tracking-widest hover:bg-[#Bfa67a] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Header image for the region
  const regionImages: Record<string, string> = {
    'north-scottsdale': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200',
    'paradise-valley': 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1200',
    'central-scottsdale': 'https://images.unsplash.com/photo-1560613276-793264eb7478?auto=format&fit=crop&q=80&w=1200',
    'south-scottsdale': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=1200',
    'cave-creek': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200',
    'carefree': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200',
    'fountain-hills': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
    'rio-verde': 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=1200',
    'desert-ridge': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200',
    'biltmore': 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&q=80&w=1200',
    'anthem': 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=1200',
    'peoria': 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=1200',
  };
  const headerImage = selectedRegion ? regionImages[selectedRegion] ?? regionImages['north-scottsdale'] : regionImages['north-scottsdale'];

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] lg:[zoom:0.9] font-sans flex flex-col lg:h-screen lg:overflow-hidden overflow-y-auto">
      <SEOHead
        title="Interactive Market Map | Scottsdale Real Estate"
        description="Explore 133 luxury communities across the Phoenix metro area with real Maricopa County boundary data."
      />

      <Navigation variant="solid" />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative pt-16 lg:pt-20">

        {/* LEFT: Map */}
        <div className="h-[40vh] lg:h-auto lg:w-7/12 relative shrink-0 z-0">

          {/* Search Bar */}
          <div ref={searchRef} className="absolute top-4 left-4 right-4 z-20 max-w-md">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search address, zip, community, or region..."
                className="w-full pl-12 pr-12 py-2.5 lg:py-3 bg-white border border-gray-200 shadow-lg text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#Bfa67a] focus:ring-2 focus:ring-[#Bfa67a]/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Search Results */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-xl overflow-hidden max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSearchSelect(result)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#F9F8F6] transition-colors text-left border-b border-gray-100 last:border-0"
                  >
                    {getSearchIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#0C1C2E] truncate">{result.name}</p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">{result.type}</p>
                    </div>
                    <ArrowRight size={14} className="text-gray-300" />
                  </button>
                ))}
              </div>
            )}

            {isSearchFocused && searchQuery && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-xl p-4">
                <p className="text-sm text-gray-500 text-center">No results found for &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}
          </div>

          <div className={mapStyle === 'dark' ? 'h-full w-full map-navy-overlay' : 'h-full w-full'}>
            <MapGL
              ref={mapRef}
              initialViewState={{
                longitude: PHOENIX_CENTER[1],
                latitude: PHOENIX_CENTER[0],
                zoom: DEFAULT_ZOOM,
              }}
              mapStyle={mapStyle === 'dark' ? MAP_STYLE.dark : MAP_STYLE.satellite}
              style={{ width: '100%', height: '100%', background: '#0C1C2E' }}
              interactiveLayerIds={showCommunities ? ['community-polygons-fill', 'community-points'] : []}
              onClick={onMapClick}
              onMouseMove={onMapMouseMove}
              onMouseLeave={onMapMouseLeave}
            >
              {/* Community Polygons */}
              {showCommunities && polygonGeoJson && (
                <Source id="community-polygons" type="geojson" data={polygonGeoJson}>
                  <Layer {...{
                    id: 'community-polygons-fill',
                    type: 'fill',
                    paint: {
                      'fill-color': [
                        'case',
                        ['==', ['get', 'slug'], selectedCommunity ?? ''],
                        BRAND_COLORS.gold,
                        ['==', ['get', 'slug'], hoveredCommunity ?? ''],
                        '#ffffff',
                        ['==', ['get', 'regionId'], selectedRegion ?? ''],
                        '#ffffff',
                        '#ffffff',
                      ],
                      'fill-opacity': [
                        'case',
                        ['==', ['get', 'slug'], selectedCommunity ?? ''],
                        0.7,
                        ['==', ['get', 'slug'], hoveredCommunity ?? ''],
                        0.5,
                        ['==', ['get', 'regionId'], selectedRegion ?? ''],
                        0.25,
                        0.08,
                      ],
                    },
                  } as FillLayerSpecification} />
                  <Layer {...{
                    id: 'community-polygons-line',
                    type: 'line',
                    paint: {
                      'line-color': [
                        'case',
                        ['==', ['get', 'slug'], selectedCommunity ?? ''],
                        BRAND_COLORS.gold,
                        ['==', ['get', 'slug'], hoveredCommunity ?? ''],
                        BRAND_COLORS.goldHover,
                        ['==', ['get', 'regionId'], selectedRegion ?? ''],
                        'rgba(191, 166, 122, 0.6)',
                        'rgba(255,255,255,0.2)',
                      ],
                      'line-width': [
                        'case',
                        ['==', ['get', 'slug'], selectedCommunity ?? ''],
                        3,
                        ['==', ['get', 'slug'], hoveredCommunity ?? ''],
                        2,
                        ['==', ['get', 'regionId'], selectedRegion ?? ''],
                        1.5,
                        0.5,
                      ],
                    },
                  } as LineLayerSpecification} />
                </Source>
              )}

              {/* Point-only communities as circle markers */}
              {showCommunities && pointGeoJson && (
                <Source id="community-points" type="geojson" data={pointGeoJson}>
                  <Layer {...{
                    id: 'community-points',
                    type: 'circle',
                    paint: {
                      'circle-radius': [
                        'case',
                        ['==', ['get', 'slug'], selectedCommunity ?? ''],
                        10,
                        ['==', ['get', 'slug'], hoveredCommunity ?? ''],
                        8,
                        ['==', ['get', 'regionId'], selectedRegion ?? ''],
                        6,
                        4,
                      ],
                      'circle-color': [
                        'case',
                        ['==', ['get', 'slug'], selectedCommunity ?? ''],
                        BRAND_COLORS.gold,
                        '#ffffff',
                      ],
                      'circle-opacity': [
                        'case',
                        ['==', ['get', 'slug'], selectedCommunity ?? ''],
                        0.9,
                        ['==', ['get', 'slug'], hoveredCommunity ?? ''],
                        0.7,
                        ['==', ['get', 'regionId'], selectedRegion ?? ''],
                        0.5,
                        0.15,
                      ],
                      'circle-stroke-color': [
                        'case',
                        ['==', ['get', 'slug'], selectedCommunity ?? ''],
                        BRAND_COLORS.gold,
                        ['==', ['get', 'regionId'], selectedRegion ?? ''],
                        'rgba(191,166,122,0.6)',
                        'rgba(255,255,255,0.2)',
                      ],
                      'circle-stroke-width': [
                        'case',
                        ['==', ['get', 'slug'], selectedCommunity ?? ''],
                        3,
                        ['==', ['get', 'regionId'], selectedRegion ?? ''],
                        1.5,
                        0.5,
                      ],
                    },
                  } as CircleLayerSpecification} />
                </Source>
              )}
            </MapGL>
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2">
            <button
              onClick={() => setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark')}
              className="bg-[#0C1C2E]/90 backdrop-blur text-white p-2 lg:p-3 border border-white/10 hover:border-[#Bfa67a] transition-all"
              title="Toggle map style"
            >
              <Layers size={16} />
            </button>
            <button
              onClick={() => setShowCommunities(!showCommunities)}
              className={`backdrop-blur p-2 lg:p-3 border transition-all ${showCommunities ? 'bg-[#Bfa67a] text-[#0C1C2E] border-[#Bfa67a]' : 'bg-[#0C1C2E]/90 text-white border-white/10 hover:border-[#Bfa67a]'}`}
              title="Toggle communities"
            >
              <Home size={16} />
            </button>
            <button
              onClick={() => {
                setSelectedRegion(null);
                setSelectedCommunity(null);
                setExpandedCommunity(null);
              }}
              className="bg-[#0C1C2E]/90 backdrop-blur text-white p-2 lg:p-3 border border-white/10 hover:border-[#Bfa67a] transition-all"
              title="Reset view"
            >
              <Crosshair size={16} />
            </button>
          </div>

          {/* Legend */}
          <div className="hidden lg:block absolute bottom-4 right-4 z-[1000] bg-[#0C1C2E]/90 backdrop-blur border border-white/10 p-4 text-white text-xs">
            <div className="font-bold uppercase tracking-widest text-[10px] mb-3 text-[#Bfa67a]">Legend</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#Bfa67a] opacity-70 border border-[#Bfa67a]" />
                <span>Selected Community</span>
              </div>
              {showCommunities && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white/25 border border-[#Bfa67a]/60" style={{ borderStyle: 'dashed' }} />
                    <span>Region Community</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white/10 border border-white/20" />
                    <span>Other Community</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white/50 border border-white/60" />
                    <span>Point-Only</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Hover tooltip */}
          {hoveredCommunity && (() => {
            const c = getCommunityById(hoveredCommunity);
            return c ? (
              <div className="hidden lg:block absolute top-4 right-4 z-[1000] bg-[#0C1C2E]/95 backdrop-blur border border-[#Bfa67a] p-4 text-white max-w-xs">
                <div className="text-[10px] uppercase tracking-widest text-[#Bfa67a] mb-1">Community</div>
                <div className="font-serif text-lg">{c.name}</div>
                <div className="text-sm text-gray-400 mt-1">{c.priceRange}</div>
              </div>
            ) : null;
          })()}
        </div>

        {/* RIGHT: Info Panel */}
        <div ref={panelRef} className="h-[55vh] lg:h-auto lg:w-5/12 bg-white flex flex-col border-l border-gray-200 overflow-hidden">

          {/* Sticky Header Image */}
          {selectedRegion && (
            <div className="relative shrink-0 z-10">
              {/* Hero Image */}
              <div className="relative h-56">
                <img
                  src={headerImage}
                  alt={regionName}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E] via-[#0C1C2E]/50 to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold mb-2">
                        <Award size={14} />
                        {selectedCommunity ? 'Luxury Community' : 'Market Zone'}
                      </div>
                      <h2 className="text-3xl font-serif mb-2">
                        {selectedCommunity
                          ? getCommunityById(selectedCommunity)?.name ?? regionName
                          : regionName
                        }
                      </h2>
                      <p className="text-gray-300 text-sm font-light leading-relaxed max-w-sm">
                        {selectedCommunity
                          ? getCommunityById(selectedCommunity)?.description ?? regionDescription
                          : regionDescription
                        }
                      </p>
                    </div>

                    <div className="hidden lg:flex items-center gap-6">
                      <Link
                        to={`/phoenix/${selectedRegion}`}
                        className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white font-bold hover:text-[#Bfa67a] transition-all"
                      >
                        Explore Region <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link
                        to={`/insights/${selectedRegion}`}
                        className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white font-bold hover:text-[#Bfa67a] transition-all"
                      >
                        Market Report <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 bg-[#0C1C2E]">
                <div className="p-4 text-center border-r border-white/10">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold mb-1">Communities</p>
                  <p className="text-xl font-serif text-white">{regionCommunities.length}</p>
                </div>
                <div className="p-4 text-center border-r border-white/10">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold mb-1">Guard-Gated</p>
                  <p className="text-xl font-serif text-white">
                    {regionCommunities.filter(c => c.gating.toLowerCase().includes('guard')).length}
                  </p>
                </div>
                <div className="p-4 text-center border-r border-white/10">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold mb-1">Mapped</p>
                  <p className="text-xl font-serif text-white">
                    {regionCommunityFeatures.filter(f => f.geometry.type !== 'Point').length}
                  </p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold mb-1">Zip Codes</p>
                  <p className="text-xl font-serif text-white">
                    {new Set(regionCommunities.map(c => c.zipCode)).size}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Scrollable Content Area */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Section Header - Sticky */}
            <div className="sticky top-0 bg-white z-20 px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home size={16} className="text-[#Bfa67a]" />
                  <h3 className="text-sm font-serif text-[#0C1C2E]">Luxury Communities</h3>
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">
                  {regionCommunities.length} Enclaves
                </span>
              </div>
            </div>

            {/* Community Cards */}
            <div className="flex-1 p-6 pb-24 bg-gray-50/50">
              {regionCommunities.length > 0 ? (
                <div className="space-y-4">
                  {regionCommunities.map((community) => {
                    const isExpanded = expandedCommunity === community.slug;
                    const hasPolygon = regionCommunityFeatures.some(
                      f => f.properties.slug === community.slug && f.geometry.type !== 'Point'
                    );

                    return (
                      <div
                        key={community.slug}
                        id={`community-card-${community.slug}`}
                        className={`
                          bg-white overflow-hidden transition-all duration-300 ease-out
                          ${isExpanded ? 'shadow-xl ring-1 ring-[#Bfa67a]' : 'shadow-sm hover:shadow-lg hover:-translate-y-0.5'}
                        `}
                        style={{ scrollMarginTop: '80px' }}
                      >
                        {/* Header - Always Visible */}
                        <div
                          onClick={() => {
                            setExpandedCommunity(isExpanded ? null : community.slug);
                            setSelectedCommunity(community.slug);
                            setCardTab('listings');
                          }}
                          className="w-full text-left px-5 py-4 cursor-pointer transition-all duration-200"
                          style={{
                            backgroundColor: isExpanded ? '#0C1C2E' : '#ffffff',
                            color: isExpanded ? '#ffffff' : '#0C1C2E',
                          }}
                        >
                          {/* Top Row: Type Badge + Price + Chevron */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[9px] uppercase tracking-[0.2em] font-semibold px-2 py-1"
                                style={{
                                  backgroundColor: isExpanded ? 'rgba(191, 166, 122, 0.2)' : 'rgba(12, 28, 46, 0.05)',
                                  color: isExpanded ? '#Bfa67a' : 'rgba(12, 28, 46, 0.6)',
                                }}
                              >
                                {community.section.label}
                              </span>
                              {!hasPolygon && (
                                <span
                                  className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: isExpanded ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                    color: isExpanded ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)',
                                  }}
                                >
                                  Approx
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <span
                                className="text-2xl font-serif font-light tracking-tight"
                                style={{ color: isExpanded ? '#ffffff' : '#0C1C2E' }}
                              >
                                {community.priceRange}
                              </span>
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ease-out"
                                style={{
                                  backgroundColor: isExpanded ? '#Bfa67a' : '#f3f4f6',
                                  color: isExpanded ? '#ffffff' : '#9ca3af',
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                }}
                              >
                                <ChevronDown size={18} strokeWidth={2} />
                              </div>
                            </div>
                          </div>

                          {/* Community Name */}
                          <h4
                            className="font-serif text-xl mb-3 tracking-wide"
                            style={{ color: isExpanded ? '#ffffff' : '#0C1C2E' }}
                          >
                            {community.name}
                          </h4>

                          {/* Stats Row */}
                          <div
                            className="flex items-center gap-6 text-[11px]"
                            style={{ color: isExpanded ? 'rgba(255,255,255,0.7)' : '#6b7280' }}
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className="font-semibold"
                                style={{ color: isExpanded ? '#ffffff' : '#0C1C2E' }}
                              >
                                {community.city}
                              </span>
                            </div>
                            <div
                              className="w-px h-3 opacity-30"
                              style={{ backgroundColor: isExpanded ? '#ffffff' : '#6b7280' }}
                            />
                            <div className="flex items-center gap-1.5">
                              <span
                                className="font-semibold"
                                style={{ color: isExpanded ? '#ffffff' : '#0C1C2E' }}
                              >
                                {community.zipCode}
                              </span>
                            </div>
                            <div
                              className="w-px h-3 opacity-30"
                              style={{ backgroundColor: isExpanded ? '#ffffff' : '#6b7280' }}
                            />
                            <span
                              className="font-semibold"
                              style={{ color: isExpanded ? '#Bfa67a' : '#059669' }}
                            >
                              {community.gating}
                            </span>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <div className={`
                          grid transition-all duration-300 ease-out
                          ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}
                        `}>
                          <div className="overflow-hidden">
                            {/* Overview Hero — always visible when expanded */}
                            <div>
                              {/* Key Stats Bar */}
                              <div className="grid grid-cols-3 bg-white border-b border-gray-100">
                                {[
                                  { label: 'Section', value: community.section.label },
                                  { label: 'Gating', value: community.gating },
                                  { label: 'Zip Code', value: community.zipCode },
                                ].map((stat, i) => (
                                  <div
                                    key={stat.label}
                                    className={`py-3 text-center ${i > 0 ? 'border-l border-gray-100' : ''}`}
                                  >
                                    <p className="text-[9px] uppercase tracking-[0.15em] text-gray-400 mb-1 font-medium">
                                      {stat.label}
                                    </p>
                                    <p className="text-sm font-serif text-[#0C1C2E] truncate px-2">{stat.value}</p>
                                  </div>
                                ))}
                              </div>

                              <div className="px-5 py-4 space-y-3 border-b border-gray-100">
                                {/* Description */}
                                {community.description && (
                                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                                    {community.description}
                                  </p>
                                )}

                                {/* Details Bento Grid */}
                                <div className="grid grid-cols-2 gap-2">
                                  {community.residential.schoolDistrict.district && (
                                    <div className="bg-gray-50 border border-gray-100 p-2.5 rounded flex flex-col">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <GraduationCap size={11} className="text-[#Bfa67a]" />
                                        <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">School District</span>
                                      </div>
                                      <p className="text-xs font-serif text-[#0C1C2E]">{community.residential.schoolDistrict.district}</p>
                                      {community.residential.schoolDistrict.highSchool && (
                                        <p className="text-[10px] text-gray-400 mt-0.5">{community.residential.schoolDistrict.highSchool}</p>
                                      )}
                                    </div>
                                  )}
                                  {community.residential.hoa.monthlyLow != null && (
                                    <div className="bg-gray-50 border border-gray-100 p-2.5 rounded flex flex-col">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <DollarSign size={11} className="text-[#Bfa67a]" />
                                        <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">HOA Fees</span>
                                      </div>
                                      <p className="text-xs font-serif text-[#0C1C2E]">
                                        {community.residential.hoa.monthlyLow && community.residential.hoa.monthlyHigh
                                          ? `$${community.residential.hoa.monthlyLow}–$${community.residential.hoa.monthlyHigh}/mo`
                                          : 'See details'}
                                      </p>
                                    </div>
                                  )}
                                  {community.nearestTrail?.name && (
                                    <div className="bg-gray-50 border border-gray-100 p-2.5 rounded flex flex-col">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <TreePine size={11} className="text-[#Bfa67a]" />
                                        <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Nearest Trail</span>
                                      </div>
                                      <p className="text-xs font-serif text-[#0C1C2E]">{community.nearestTrail.name}</p>
                                    </div>
                                  )}
                                  {community.location.keyDistances.length > 0 && (
                                    <div className="bg-gray-50 border border-gray-100 p-2.5 rounded flex flex-col">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Landmark size={11} className="text-[#Bfa67a]" />
                                        <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Proximity</span>
                                      </div>
                                      <p className="text-[10px] text-gray-600 leading-relaxed line-clamp-2">{community.location.keyDistances.map(d => `${d.label}: ${d.distance}`).join(' · ')}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 p-2 bg-[#F8F7F5] border-b border-gray-200">
                              {([
                                { id: 'listings' as const, label: 'Featured Listings', icon: Home },
                                { id: 'market' as const, label: 'Market Intel', icon: TrendingUp },
                                { id: 'lifestyle' as const, label: 'Lifestyle', icon: Camera },
                              ]).map((tab) => {
                                const Icon = tab.icon;
                                const isActiveTab = cardTab === tab.id;
                                return (
                                  <button
                                    key={tab.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCardTab(tab.id);
                                    }}
                                    className={`
                                      flex-1 py-2.5 px-2 rounded
                                      text-[9px] uppercase tracking-[0.12em] font-bold
                                      transition-all duration-200 ease-out
                                      flex items-center justify-center gap-1.5
                                      ${isActiveTab
                                        ? 'bg-white text-[#0C1C2E] shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                                      }
                                    `}
                                  >
                                    <Icon size={12} className={isActiveTab ? 'text-[#Bfa67a]' : ''} />
                                    {tab.label}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Featured Listings Tab */}
                            {cardTab === 'listings' && (() => {
                              const enclaveData = ENCLAVE_FEATURED_LISTINGS[community.slug];
                              if (enclaveData) {
                                return (
                                  <div>
                                    {/* Market Data Bar */}
                                    <div className="grid grid-cols-3 bg-white border-b border-gray-100">
                                      {[
                                        { label: 'Price/SqFt', value: enclaveData.marketData.avgPpsf },
                                        { label: 'Sale-to-List', value: enclaveData.marketData.listToSale },
                                        { label: 'YoY Growth', value: enclaveData.marketData.priceChange, highlight: true },
                                      ].map((stat, i) => (
                                        <div
                                          key={stat.label}
                                          className={`py-4 text-center ${i > 0 ? 'border-l border-gray-100' : ''}`}
                                        >
                                          <p className="text-[9px] uppercase tracking-[0.15em] text-gray-400 mb-1 font-medium">
                                            {stat.label}
                                          </p>
                                          <p className={`text-lg font-serif ${
                                            stat.highlight
                                              ? (stat.value.startsWith('+') ? 'text-emerald-600' : 'text-red-500')
                                              : 'text-[#0C1C2E]'
                                          }`}>
                                            {stat.value}
                                          </p>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Listings */}
                                    <div className="px-5 py-5">
                                      <div className="grid grid-cols-3 gap-4">
                                        {enclaveData.listings.slice(0, 3).map((listing) => (
                                          <div key={listing.id} className="cursor-pointer group">
                                            <div className="aspect-[4/3] relative overflow-hidden mb-3 bg-gray-100">
                                              <img
                                                src={listing.image}
                                                alt={listing.address}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                              />
                                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                              {listing.status !== 'active' && (
                                                <div className={`
                                                  absolute top-2 left-2 text-[8px] uppercase tracking-wider font-bold px-2 py-1
                                                  ${listing.status === 'just-listed' ? 'bg-[#0C1C2E] text-white' : 'bg-[#Bfa67a] text-white'}
                                                `}>
                                                  {listing.status === 'just-listed' ? 'Just Listed' : 'Pending'}
                                                </div>
                                              )}
                                            </div>
                                            <p className="text-base font-serif text-[#0C1C2E] mb-1 transition-colors duration-200 group-hover:text-[#Bfa67a]">
                                              {listing.price}
                                            </p>
                                            <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                              <span className="flex items-center gap-1">
                                                <BedDouble size={11} className="text-gray-400" />
                                                {listing.beds} bd
                                              </span>
                                              <span className="flex items-center gap-1">
                                                <Bath size={11} className="text-gray-400" />
                                                {listing.baths} ba
                                              </span>
                                              <span className="text-gray-400">{listing.sqft} sf</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      <Link
                                        to={`/phoenix/${community.identity.regionId}/${community.slug}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full mt-5 py-3 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#0C1C2E] bg-transparent border border-[#0C1C2E]/20 transition-all duration-300 ease-out hover:bg-[#0C1C2E] hover:text-white hover:border-[#0C1C2E] flex items-center justify-center gap-2 group/btn"
                                      >
                                        View All {enclaveData.listings.length} Listings
                                        <ArrowRight size={14} className="transition-transform duration-200 group-hover/btn:translate-x-1" />
                                      </Link>
                                    </div>
                                  </div>
                                );
                              }
                              // Fallback: no data
                              return (
                                <div>
                                  <div className="grid grid-cols-3 bg-white border-b border-gray-100">
                                    {[
                                      { label: 'Price/SqFt', value: '\u2014' },
                                      { label: 'Sale-to-List', value: '\u2014' },
                                      { label: 'YoY Growth', value: '\u2014' },
                                    ].map((stat, i) => (
                                      <div
                                        key={stat.label}
                                        className={`py-4 text-center ${i > 0 ? 'border-l border-gray-100' : ''}`}
                                      >
                                        <p className="text-[9px] uppercase tracking-[0.15em] text-gray-400 mb-1 font-medium">
                                          {stat.label}
                                        </p>
                                        <p className="text-lg font-serif text-gray-300">{stat.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="px-5 py-5">
                                    <div className="grid grid-cols-3 gap-4">
                                      {[0, 1, 2].map((idx) => (
                                        <div key={idx} className="group">
                                          <div className="aspect-[4/3] relative overflow-hidden mb-3 bg-gray-100 flex items-center justify-center">
                                            <div className="text-center">
                                              <Home size={20} className="text-gray-300 mx-auto mb-1" />
                                              <p className="text-[8px] text-gray-400 uppercase tracking-wider">Coming Soon</p>
                                            </div>
                                          </div>
                                          <div className="h-3 bg-gray-100 rounded mb-2 w-3/4" />
                                          <div className="h-2 bg-gray-100 rounded w-1/2" />
                                        </div>
                                      ))}
                                    </div>
                                    <Link
                                      to={`/phoenix/${community.identity.regionId}/${community.slug}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full mt-5 py-3 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#0C1C2E] bg-transparent border border-[#0C1C2E]/20 transition-all duration-300 ease-out hover:bg-[#0C1C2E] hover:text-white hover:border-[#0C1C2E] flex items-center justify-center gap-2 group/btn"
                                    >
                                      View All Listings
                                      <ArrowRight size={14} className="transition-transform duration-200 group-hover/btn:translate-x-1" />
                                    </Link>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Market Intel Tab */}
                            {cardTab === 'market' && (() => {
                              const enclaveData = ENCLAVE_FEATURED_LISTINGS[community.slug];
                              if (enclaveData && currentZoneData) {
                                // Calculate pie chart values
                                const newVal = enclaveData.marketData.newListings30d || 0;
                                const pendingVal = enclaveData.marketData.pendingSales || 0;
                                const soldVal = enclaveData.marketData.closedSales30d || 0;
                                const total = newVal + pendingVal + soldVal || 1;
                                const newPct = (newVal / total) * 100;
                                const pendingPct = (pendingVal / total) * 100;
                                const soldPct = (soldVal / total) * 100;

                                // Calculate stroke dash arrays for donut chart
                                const circumference = 2 * Math.PI * 40;
                                const newDash = (newPct / 100) * circumference;
                                const pendingDash = (pendingPct / 100) * circumference;
                                const soldDash = (soldPct / 100) * circumference;
                                const newOffset = 0;
                                const pendingOffset = -newDash;
                                const soldOffset = -(newDash + pendingDash);

                                return (
                                  <div className="p-4">
                                    {/* Bento Grid Layout */}
                                    <div className="grid grid-cols-2 gap-2.5">
                                      {/* 30-Day Activity - Large Donut Chart */}
                                      <div className="bg-white border border-gray-100 shadow-sm p-3 rounded flex flex-col">
                                        <h4 className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2">30-Day Activity</h4>
                                        <div className="flex-1 flex flex-col items-center justify-center">
                                          <div className="relative w-28 h-28">
                                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                              <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="14" />
                                              <circle cx="50" cy="50" r="40" fill="none" stroke="#0C1C2E" strokeWidth="14"
                                                strokeDasharray={`${newDash} ${circumference}`} strokeDashoffset={newOffset} />
                                              <circle cx="50" cy="50" r="40" fill="none" stroke="#Bfa67a" strokeWidth="14"
                                                strokeDasharray={`${pendingDash} ${circumference}`} strokeDashoffset={pendingOffset} />
                                              <circle cx="50" cy="50" r="40" fill="none" stroke="#8B7355" strokeWidth="14"
                                                strokeDasharray={`${soldDash} ${circumference}`} strokeDashoffset={soldOffset} />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <span className="text-xl font-bold text-[#0C1C2E]">{total}</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center justify-center gap-4 mt-3">
                                            <div className="flex items-center gap-1">
                                              <div className="w-2 h-2 bg-[#0C1C2E] rounded-sm" />
                                              <span className="text-[9px] text-gray-500">New</span>
                                              <span className="text-[10px] font-bold text-[#0C1C2E] ml-0.5">{newVal}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <div className="w-2 h-2 bg-[#Bfa67a] rounded-sm" />
                                              <span className="text-[9px] text-gray-500">Pending</span>
                                              <span className="text-[10px] font-bold text-[#0C1C2E] ml-0.5">{pendingVal}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <div className="w-2 h-2 bg-[#8B7355] rounded-sm" />
                                              <span className="text-[9px] text-gray-500">Sold</span>
                                              <span className="text-[10px] font-bold text-[#0C1C2E] ml-0.5">{soldVal}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Market Snapshot */}
                                      <div className="bg-white border border-gray-100 shadow-sm p-3 rounded flex flex-col">
                                        <h4 className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-3">Market Snapshot</h4>
                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                          <div className="flex flex-col justify-center">
                                            <span className="text-2xl font-serif text-[#0C1C2E]">{enclaveData.marketData.avgPpsf}</span>
                                            <span className="text-[8px] uppercase tracking-widest text-gray-400">Avg $/SqFt</span>
                                          </div>
                                          <div className="flex flex-col justify-center">
                                            <span className="text-2xl font-serif text-[#0C1C2E]">{enclaveData.marketData.medianDom}<span className="text-sm text-gray-400 ml-0.5">d</span></span>
                                            <span className="text-[8px] uppercase tracking-widest text-gray-400">Median DOM</span>
                                          </div>
                                          <div className="flex flex-col justify-center">
                                            <span className="text-2xl font-serif text-[#0C1C2E]">{enclaveData.marketData.listToSale}</span>
                                            <span className="text-[8px] uppercase tracking-widest text-gray-400">List-to-Sale</span>
                                          </div>
                                          <div className="flex flex-col justify-center">
                                            <span className="text-2xl font-serif text-[#0C1C2E]">{enclaveData.marketData.monthsSupply}</span>
                                            <span className="text-[8px] uppercase tracking-widest text-gray-400">Mo. Supply</span>
                                          </div>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                                          <span className="text-[8px] text-gray-400">YoY Change</span>
                                          <span className={`text-xs font-bold ${enclaveData.marketData.priceChange.startsWith('+') ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]'}`}>
                                            {enclaveData.marketData.priceChange}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Price Distribution (spans full width) */}
                                      <div className="col-span-2 bg-white border border-gray-100 shadow-sm rounded">
                                        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                                          <h4 className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Price Distribution</h4>
                                          <div className="bg-gray-100 p-0.5 rounded flex">
                                            <button
                                              onClick={(e) => { e.stopPropagation(); setPerformanceView('buyer'); }}
                                              className={`px-1.5 py-0.5 text-[7px] uppercase tracking-widest font-bold rounded transition-all ${performanceView === 'buyer' ? 'bg-white text-[#0C1C2E] shadow-sm' : 'text-gray-400'}`}
                                            >
                                              Buy
                                            </button>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); setPerformanceView('seller'); }}
                                              className={`px-1.5 py-0.5 text-[7px] uppercase tracking-widest font-bold rounded transition-all ${performanceView === 'seller' ? 'bg-white text-[#0C1C2E] shadow-sm' : 'text-gray-400'}`}
                                            >
                                              Sell
                                            </button>
                                          </div>
                                        </div>

                                        <div className="p-3">
                                          {performanceView === 'buyer' ? (
                                            <div className="space-y-2">
                                              {currentZoneData.buyerData.priceDistribution.map((seg, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                  <span className="text-[8px] text-gray-500 w-14 shrink-0">{seg.range}</span>
                                                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-[#0C1C2E] to-[#Bfa67a] rounded-full" style={{ width: `${seg.value}%` }}></div>
                                                  </div>
                                                  <span className="text-[8px] font-bold text-[#0C1C2E] w-6 text-right">{seg.value}%</span>
                                                </div>
                                              ))}
                                              <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                                                <div>
                                                  <span className="text-[7px] uppercase tracking-widest text-gray-400 block">Negotiability</span>
                                                  <span className="text-xs font-serif text-[#0C1C2E]">{currentZoneData.buyerData.negotiability}</span>
                                                </div>
                                                <div className="text-right">
                                                  <span className="text-[7px] uppercase tracking-widest text-gray-400 block">Inventory</span>
                                                  <span className={`text-xs font-serif ${currentZoneData.buyerData.inventoryTrend.includes('-') ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                    {currentZoneData.buyerData.inventoryTrend}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-around py-1">
                                                <div className="text-center">
                                                  <p className="text-xl font-serif text-[#0C1C2E]">{currentZoneData.sellerData.marketIndex}</p>
                                                  <p className="text-[7px] uppercase tracking-widest text-gray-400">Market Index</p>
                                                </div>
                                                <div className="text-center">
                                                  <p className="text-xl font-serif text-emerald-600">{currentZoneData.sellerData.saleToList}</p>
                                                  <p className="text-[7px] uppercase tracking-widest text-gray-400">Sale/List</p>
                                                </div>
                                              </div>
                                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                <div>
                                                  <span className="text-[7px] uppercase tracking-widest text-gray-400 block">Cash Buyers</span>
                                                  <span className="text-xs font-serif text-[#0C1C2E]">{currentZoneData.sellerData.cashBuyerPercent}</span>
                                                </div>
                                                <div className="text-right">
                                                  <span className="text-[7px] uppercase tracking-widest text-gray-400 block">Avg DOM</span>
                                                  <span className="text-xs font-serif text-[#0C1C2E]">{currentZoneData.sellerData.daysToContract}</span>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              // Fallback: blurred placeholder
                              return (
                                <div className="p-4">
                                  <div className="grid grid-cols-2 gap-2.5">
                                    <div className="bg-white border border-gray-100 shadow-sm p-3 rounded flex flex-col items-center justify-center relative overflow-hidden">
                                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                                        <div className="text-center">
                                          <ShieldCheck size={20} className="text-[#Bfa67a] mx-auto mb-1" />
                                          <p className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">ARMLS Data</p>
                                          <p className="text-[7px] text-gray-400">Coming Soon</p>
                                        </div>
                                      </div>
                                      <h4 className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2">30-Day Activity</h4>
                                      <div className="relative w-28 h-28 opacity-20">
                                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                          <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="14" />
                                          <circle cx="50" cy="50" r="40" fill="none" stroke="#0C1C2E" strokeWidth="14"
                                            strokeDasharray="80 251" strokeDashoffset="0" />
                                          <circle cx="50" cy="50" r="40" fill="none" stroke="#Bfa67a" strokeWidth="14"
                                            strokeDasharray="60 251" strokeDashoffset="-80" />
                                        </svg>
                                      </div>
                                    </div>
                                    <div className="bg-white border border-gray-100 shadow-sm p-3 rounded flex flex-col relative overflow-hidden">
                                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                                        <div className="text-center">
                                          <TrendingUp size={20} className="text-[#Bfa67a] mx-auto mb-1" />
                                          <p className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">Market Intel</p>
                                          <p className="text-[7px] text-gray-400">Coming Soon</p>
                                        </div>
                                      </div>
                                      <h4 className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-3 opacity-20">Market Snapshot</h4>
                                      <div className="flex-1 grid grid-cols-2 gap-3 opacity-20">
                                        <div className="flex flex-col justify-center">
                                          <span className="text-2xl font-serif text-[#0C1C2E]">$485</span>
                                          <span className="text-[8px] uppercase tracking-widest text-gray-400">Avg $/SqFt</span>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                          <span className="text-2xl font-serif text-[#0C1C2E]">62<span className="text-sm text-gray-400 ml-0.5">d</span></span>
                                          <span className="text-[8px] uppercase tracking-widest text-gray-400">Median DOM</span>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                          <span className="text-2xl font-serif text-[#0C1C2E]">97.2%</span>
                                          <span className="text-[8px] uppercase tracking-widest text-gray-400">List-to-Sale</span>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                          <span className="text-2xl font-serif text-[#0C1C2E]">4.8</span>
                                          <span className="text-[8px] uppercase tracking-widest text-gray-400">Mo. Supply</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-span-2 bg-[#0C1C2E] p-4 rounded text-center">
                                      <p className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.2em] font-bold mb-1">Real-Time Market Intelligence</p>
                                      <p className="text-white/60 text-[11px] mb-3">ARMLS-powered analytics for this community</p>
                                      <Link
                                        to={`/insights/${community.identity.regionId}/${community.zipCode}/${community.slug}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-2 text-white text-[10px] uppercase tracking-[0.15em] font-bold hover:text-[#Bfa67a] transition-colors"
                                      >
                                        View Market Report <ArrowRight size={12} />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Lifestyle Tab */}
                            {cardTab === 'lifestyle' && (
                              currentZoneData ? (
                                <div className="p-5 space-y-4">
                                  <div>
                                    <h3 className="text-xs font-serif text-[#0C1C2E] mb-3 flex items-center gap-2">
                                      <Activity size={14} className="text-[#Bfa67a]"/>
                                      Quality Signals
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                      {currentZoneData.qualitySignals.slice(0, 4).map((signal, i) => (
                                        <div key={i} className="bg-white border border-gray-100 p-3 hover:border-[#Bfa67a] transition-all group">
                                          <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1.5 text-gray-600 group-hover:text-[#0C1C2E]">
                                              {getSignalIcon(signal.id)}
                                              <span className="text-[8px] uppercase tracking-widest font-bold">{signal.label}</span>
                                            </div>
                                            <span className="text-xs font-bold text-[#0C1C2E] font-serif">{signal.value}</span>
                                          </div>
                                          <div className="w-full h-1 bg-gray-100 rounded-full">
                                            <div className="h-full bg-[#Bfa67a] rounded-full" style={{ width: `${signal.rating}%` }}></div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="text-xs font-serif text-[#0C1C2E] mb-3 flex items-center gap-2">
                                      <Camera size={14} className="text-[#Bfa67a]"/>
                                      Signature Lifestyle
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                      {currentZoneData.lifestyle.map((item, i) => (
                                        <div key={i} className="relative h-20 overflow-hidden group cursor-pointer">
                                          <img
                                            src={item.img}
                                            alt={item.label}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                          />
                                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                                          <div className="absolute bottom-0 left-0 w-full p-2">
                                            <span className="text-white text-[8px] font-bold uppercase tracking-widest border-b border-[#Bfa67a] pb-0.5">
                                              {item.label}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-5 space-y-4">
                                  {community.golf && (
                                    <div>
                                      <h3 className="text-xs font-serif text-[#0C1C2E] mb-3 flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-[#Bfa67a]" />
                                        Golf &amp; Recreation
                                      </h3>
                                      <p className="text-sm text-gray-600 leading-relaxed">{community.golf.description}</p>
                                    </div>
                                  )}
                                  {community.categoryTags.length > 0 && (
                                    <div>
                                      <h3 className="text-xs font-serif text-[#0C1C2E] mb-3 flex items-center gap-2">
                                        <Camera size={14} className="text-[#Bfa67a]" />
                                        Signature Lifestyle
                                      </h3>
                                      <div className="grid grid-cols-2 gap-2">
                                        {community.categoryTags.slice(0, 8).map(tag => (
                                          <div
                                            key={tag}
                                            className="bg-white border border-gray-100 p-3 hover:border-[#Bfa67a] transition-all group"
                                          >
                                            <span className="text-[9px] uppercase tracking-widest font-bold text-gray-600 group-hover:text-[#0C1C2E]">
                                              {tag}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {community.amenities.length > 0 && (
                                    <div>
                                      <h3 className="text-xs font-serif text-[#0C1C2E] mb-3 flex items-center gap-2">
                                        <MapPin size={14} className="text-[#Bfa67a]" />
                                        Nearby Amenities
                                      </h3>
                                      <div className="space-y-2">
                                        {community.amenities.slice(0, 4).map((amenity, i) => (
                                          <div key={i} className="bg-white border border-gray-100 p-3 rounded flex items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-serif text-[#0C1C2E] truncate">{amenity.name}</p>
                                              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{amenity.description}</p>
                                            </div>
                                            <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-[#0C1C2E]/5 text-[#0C1C2E]/50 shrink-0 capitalize">
                                              {amenity.access}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            )}

                            {/* Action Buttons */}
                            <div className="px-5 pb-5 flex gap-3">
                              <Link
                                to={`/phoenix/${community.identity.regionId}/${community.slug}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#0C1C2E] text-white py-3 text-[10px] uppercase tracking-[0.15em] font-bold hover:bg-[#Bfa67a] transition-all"
                              >
                                <MapPin size={14} />
                                Community Profile
                              </Link>
                              <Link
                                to={`/insights/${community.identity.regionId}/${community.zipCode}/${community.slug}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 flex items-center justify-center gap-2 border border-[#0C1C2E] text-[#0C1C2E] py-3 text-[10px] uppercase tracking-[0.15em] font-bold hover:bg-[#0C1C2E] hover:text-white transition-all"
                              >
                                <TrendingUp size={14} />
                                Market Report
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : selectedRegion ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm">No communities found in this region.</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm font-serif">Select a region on the map to explore communities.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
