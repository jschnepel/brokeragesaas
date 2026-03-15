const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? '';

interface PlacesResult {
  name: string;
  types: string[];
  rating: number;
  user_ratings_total: number;
  price_level?: number;
  business_status: string;
  geometry: { location: { lat: number; lng: number } };
}

interface PlacesResponse {
  results: PlacesResult[];
  status: string;
}

export async function searchNearbyPlaces(
  lat: number, lng: number,
  type: string,
  radiusMeters: number = 16000,
): Promise<PlacesResult[]> {
  if (!PLACES_API_KEY) return [];
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&type=${type}&key=${PLACES_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 86400 * 30 } });
    if (!res.ok) return [];
    const data: PlacesResponse = await res.json();
    if (data.status !== 'OK') return [];
    return data.results;
  } catch {
    return [];
  }
}

export function haversineDistanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
