/**
 * Haversine distance + curated Phoenix-metro POIs for the listing
 * detail Location section's "Distance to" rows. Calculated at SSR
 * time so the rows are pre-rendered into HTML — no client roundtrip
 * to Google Distance Matrix and no per-pageview API spend.
 *
 * Trade-off: haversine is straight-line "as the crow flies" — actual
 * driving distance runs ~1.2-1.4× longer in the Valley's grid layout,
 * and driving time depends on traffic. For a luxury listing detail
 * page these directional reads are still useful ("Sky Harbor ≈ 24 mi")
 * without committing to the paid Distance Matrix billing.
 *
 * If precise driving time becomes a real ask, swap the implementation
 * to a server-side Distance Matrix call cached behind Next's data
 * cache; the public API of this file (computeDistances) doesn't need
 * to change.
 */

export interface PhoenixPOI {
  /** Display label rendered next to the distance value. */
  label: string;
  latitude: number;
  longitude: number;
}

export interface DistanceRow {
  label: string;
  /** Pre-formatted, e.g. "24 mi" or "0.6 mi". */
  value: string;
}

/**
 * Curated POIs that resonate for the Phoenix-metro luxury buyer.
 * Order matters — the rows render top-to-bottom in this sequence.
 */
export const PHOENIX_POIS: ReadonlyArray<PhoenixPOI> = [
  { label: 'Sky Harbor International', latitude: 33.4373, longitude: -112.0078 },
  { label: 'Old Town Scottsdale', latitude: 33.4942, longitude: -111.9261 },
  { label: 'Scottsdale Airpark', latitude: 33.6231, longitude: -111.9111 },
  { label: 'Loop 101 / Pima', latitude: 33.6267, longitude: -111.8842 },
];

/**
 * Great-circle distance between two lat/lng points in miles.
 * Standard haversine implementation; no dependency overhead.
 */
export function haversineMiles(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 3958.8; // Earth radius in miles
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatMiles(miles: number): string {
  if (!Number.isFinite(miles)) return '—';
  if (miles < 0.1) return '< 0.1 mi';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

/**
 * Compute distance rows for a listing's lat/lng to the curated POIs.
 * Returns an empty array when lat/lng are missing so callers can
 * conditionally render the section.
 */
export function computeDistances(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  pois: ReadonlyArray<PhoenixPOI> = PHOENIX_POIS,
): DistanceRow[] {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return [];
  return pois.map((poi) => ({
    label: poi.label,
    value: formatMiles(
      haversineMiles(latitude, longitude, poi.latitude, poi.longitude),
    ),
  }));
}
