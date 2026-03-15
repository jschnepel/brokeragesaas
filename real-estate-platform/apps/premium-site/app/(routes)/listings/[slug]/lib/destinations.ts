// destinations.ts — Curated commute destinations for Phoenix metro area
import type { CuratedDestination } from './types';

export const CURATED_DESTINATIONS: CuratedDestination[] = [
  { name: 'Sky Harbor (PHX)', lat: 33.4373, lng: -112.0078 },
  { name: 'Scottsdale Airport (SDL)', lat: 33.6229, lng: -111.9107 },
  { name: 'Old Town Scottsdale', lat: 33.4942, lng: -111.9261 },
  { name: 'Scottsdale Fashion Square', lat: 33.5032, lng: -111.9270 },
  { name: 'Camelback / Biltmore', lat: 33.5092, lng: -112.0184 },
  { name: 'Mayo Clinic Scottsdale', lat: 33.6598, lng: -111.9584 },
  { name: 'Kierland Commons', lat: 33.5811, lng: -111.9242 },
  { name: 'Downtown Phoenix', lat: 33.4484, lng: -112.0740 },
];

export const PHOENIX_ELEVATION_BASELINE_FT = 1100;
export const TEMP_LAPSE_RATE_F_PER_1000FT = 3.5;
