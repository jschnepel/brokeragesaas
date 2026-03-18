'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '';
const OSRM_BASE = 'https://router.project-osrm.org';
const LOCAL_STORAGE_KEY = 'rlsir-commute-address';

interface CommuteMapProps {
  lat: number;
  lng: number;
  address: string;
}

interface CommuteResult {
  distanceMiles: number;
  durationMinutes: number;
  geometry: GeoJSON.LineString;
}

export function CommuteMap({ lat, lng, address }: CommuteMapProps) {
  const [workAddress, setWorkAddress] = useState('');
  const [commute, setCommute] = useState<CommuteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      setWorkAddress(saved);
      void calculateCommute(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateCommute = useCallback(
    async (addr: string) => {
      if (!addr.trim()) return;
      setLoading(true);
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`,
        );
        const geoData = await geoRes.json();
        if (!geoData[0]) { setLoading(false); return; }

        const workLat = parseFloat(geoData[0].lat);
        const workLng = parseFloat(geoData[0].lon);

        const routeRes = await fetch(
          `${OSRM_BASE}/route/v1/driving/${lng},${lat};${workLng},${workLat}?overview=full&geometries=geojson`,
        );
        const routeData = await routeRes.json();

        if (routeData.code === 'Ok' && routeData.routes?.[0]) {
          const route = routeData.routes[0];
          setCommute({
            distanceMiles: Math.round((route.distance / 1609.344) * 10) / 10,
            durationMinutes: Math.round(route.duration / 60),
            geometry: route.geometry,
          });
          localStorage.setItem(LOCAL_STORAGE_KEY, addr);
        }
      } catch {
        // Silent failure
      } finally {
        setLoading(false);
      }
    },
    [lat, lng],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void calculateCommute(workAddress);
  };

  // address prop consumed for aria-label accessibility
  return (
    <div className="relative w-full h-full">
      <Map
        initialViewState={{ latitude: lat, longitude: lng, zoom: 12 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={`https://api.maptiler.com/maps/streets-v2-light/style.json?key=${MAPTILER_KEY}`}
        attributionControl={false}
        aria-label={`Map showing location of ${address}`}
      >
          <Marker latitude={lat} longitude={lng}>
            <div className="w-3 h-3 bg-gold rounded-full border-2 border-white shadow-lg" />
          </Marker>
          {commute && (
            <Source id="commute-route" type="geojson" data={{ type: 'Feature', properties: {}, geometry: commute.geometry }}>
              <Layer id="commute-route-line" type="line" paint={{ 'line-color': '#BFA67A', 'line-width': 3, 'line-opacity': 0.8 }} />
            </Source>
          )}
        </Map>
        <div className="absolute top-4 left-4 w-72 z-10">
          <div className="bg-white/95 backdrop-blur-sm border border-navy/10 p-4 shadow-lg shadow-black/5">
            <h3 className="text-[9px] uppercase tracking-[0.25em] text-navy font-bold mb-3">Your Commute</h3>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={workAddress}
                onChange={(e) => setWorkAddress(e.target.value)}
                placeholder="Enter work address..."
                aria-label="Work address for commute calculation"
                className="flex-1 text-sm border border-navy/15 px-3 py-2 text-navy placeholder:text-navy/25 focus:outline-none focus:border-gold transition-all duration-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-gold text-white px-4 py-2 text-label uppercase tracking-md font-bold hover:bg-white hover:text-navy transition-all duration-500 disabled:opacity-50"
                style={{ borderRadius: 4 }}
              >
                {loading ? '...' : 'Go'}
              </button>
            </form>
            {commute && (
              <p className="text-sm text-navy/60 mt-2">{commute.durationMinutes} min · {commute.distanceMiles} miles</p>
            )}
          </div>
        </div>
    </div>
  );
}
