import { PHOENIX_ELEVATION_BASELINE_FT, TEMP_LAPSE_RATE_F_PER_1000FT } from './destinations';

export async function fetchElevation(lat: number, lng: number): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`,
      { next: { revalidate: 86400 * 30 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const elevMeters = data.results?.[0]?.elevation;
    if (elevMeters == null) return null;
    return Math.round(elevMeters * 3.28084);
  } catch {
    return null;
  }
}

export function deriveTemperatureDiff(elevationFt: number): number {
  const gainFt = elevationFt - PHOENIX_ELEVATION_BASELINE_FT;
  if (gainFt <= 0) return 0;
  return -Math.round((gainFt / 1000) * TEMP_LAPSE_RATE_F_PER_1000FT * 10) / 10;
}

export async function fetchAirQuality(
  lat: number, lng: number,
): Promise<{ aqi: number; category: string } | null> {
  const apiKey = process.env.AIRNOW_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${lat}&longitude=${lng}&distance=25&API_KEY=${apiKey}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const pm25 = data.find((d: Record<string, unknown>) => d.ParameterName === 'PM2.5') ?? data[0];
    return {
      aqi: pm25.AQI as number,
      category: (pm25.Category as Record<string, unknown>)?.Name as string ?? 'Unknown',
    };
  } catch {
    return null;
  }
}

export const PHOENIX_METRO_AVG_AQI = 45;

export function estimateBortleScale(lat: number, lng: number): { scale: number; label: string } {
  const dLat = lat - 33.4484;
  const dLng = lng - (-112.074);
  const distKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
  if (distKm > 80) return { scale: 2, label: 'Truly Dark' };
  if (distKm > 60) return { scale: 3, label: 'Rural Sky' };
  if (distKm > 40) return { scale: 4, label: 'Rural/Suburban' };
  if (distKm > 25) return { scale: 5, label: 'Suburban' };
  if (distKm > 15) return { scale: 6, label: 'Bright Suburban' };
  if (distKm > 8) return { scale: 7, label: 'Suburban/Urban' };
  return { scale: 8, label: 'City Sky' };
}

export function estimateNoiseLevel(lat: number, lng: number): { category: string; descriptor: string } {
  const dAirport = Math.sqrt(Math.pow(lat - 33.6229, 2) + Math.pow(lng - (-111.9107), 2)) * 111;
  const dSkyHarbor = Math.sqrt(Math.pow(lat - 33.4373, 2) + Math.pow(lng - (-112.0078), 2)) * 111;
  const dFreeway = Math.abs(lng - (-111.9)) * 111;
  const minAirportDist = Math.min(dAirport, dSkyHarbor);
  if (minAirportDist < 3) return { category: 'Moderate', descriptor: 'Near airport flight path' };
  if (dFreeway < 1) return { category: 'Moderate', descriptor: 'Near freeway corridor' };
  if (minAirportDist < 8 || dFreeway < 3) return { category: 'Quiet', descriptor: 'Suburban area' };
  return { category: 'Very Quiet', descriptor: 'Rural or residential' };
}
