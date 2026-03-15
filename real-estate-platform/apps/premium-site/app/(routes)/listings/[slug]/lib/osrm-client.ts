const OSRM_BASE = 'https://router.project-osrm.org';

interface OsrmRouteResult {
  distanceMiles: number;
  durationMinutes: number;
}

export async function getOsrmRoute(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number,
): Promise<OsrmRouteResult | null> {
  try {
    const url = `${OSRM_BASE}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    const route = data.routes[0];
    return {
      distanceMiles: Math.round((route.distance / 1609.344) * 10) / 10,
      durationMinutes: Math.round(route.duration / 60),
    };
  } catch {
    return null;
  }
}

export async function getOsrmRoutes(
  fromLat: number, fromLng: number,
  destinations: Array<{ lat: number; lng: number }>,
): Promise<Array<OsrmRouteResult | null>> {
  return Promise.all(
    destinations.map((dest) => getOsrmRoute(fromLat, fromLng, dest.lat, dest.lng)),
  );
}
