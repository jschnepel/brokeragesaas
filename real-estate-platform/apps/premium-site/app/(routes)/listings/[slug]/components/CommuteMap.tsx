'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MapGL, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '';
const OSRM_BASE = 'https://router.project-osrm.org';
const LOCAL_STORAGE_KEY = 'rlsir-commute-address';

function getCssColor(varName: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
}

interface CommuteMapProps {
  lat: number;
  lng: number;
  address: string;
  price?: string;
}

interface CommuteResult {
  distanceMiles: number;
  durationMinutes: number;
  geometry: GeoJSON.LineString;
}

export function CommuteMap({ lat, lng, address, price }: CommuteMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [workAddress, setWorkAddress] = useState('');
  const [commute, setCommute] = useState<CommuteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const goldColor = useMemo(() => getCssColor('--color-gold', '#Bfa67a'), []);

  const mapStyle = useMemo(
    () => `https://api.maptiler.com/maps/streets-v2-light/style.json?key=${MAPTILER_KEY}`,
    []
  );

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

  return (
    <div className="relative w-full h-full">
      <MapGL
        ref={mapRef}
        initialViewState={{ latitude: lat, longitude: lng, zoom: 14 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        attributionControl={false}
        aria-label={`Map showing location of ${address}`}
      >
        {/* Commute route line */}
        {commute && (
          <Source id="commute-route" type="geojson" data={{ type: 'Feature', properties: {}, geometry: commute.geometry }}>
            <Layer
              id="commute-route-line"
              type="line"
              paint={{
                'line-color': goldColor,
                'line-width': 3,
                'line-opacity': 0.8,
              }}
            />
          </Source>
        )}

        {/* Property marker — same style as listings search page */}
        <Marker latitude={lat} longitude={lng} anchor="center">
          <div
            style={{
              background: goldColor,
              color: 'white',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              border: '2px solid white',
              borderRadius: '4px',
              boxShadow: `0 2px 8px rgba(191,166,122,0.5)`,
              transform: 'scale(1.15)',
            }}
          >
            {price ?? '●'}
          </div>
        </Marker>
      </MapGL>

      {/* Commute input panel — top left */}
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
              className="flex-1 text-sm border border-navy/15 px-3 py-2 text-navy placeholder:text-navy/25 focus:outline-none focus:border-gold transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-navy text-white px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-gold transition-all disabled:opacity-50"
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

      {/* Map controls — bottom right, matching listings search page */}
      <div className="absolute bottom-6 right-3 z-10 flex flex-col gap-1">
        <button
          onClick={() => mapRef.current?.getMap().easeTo({ bearing: 0, pitch: 0, duration: 400 })}
          className="bg-white border border-navy/15 shadow-md w-8 h-8 flex items-center justify-center hover:bg-cream transition-colors"
          title="Reset North"
        >
          <svg className="w-4 h-4 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3 8h-6l3-8z" fill="currentColor" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22l-3-8h6l-3 8z" fill="none" />
          </svg>
        </button>
        <button
          onClick={() => mapRef.current?.getMap().zoomIn({ duration: 300 })}
          className="bg-white border border-navy/15 shadow-md w-8 h-8 flex items-center justify-center text-navy font-bold text-lg hover:bg-cream transition-colors"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => mapRef.current?.getMap().zoomOut({ duration: 300 })}
          className="bg-white border border-navy/15 shadow-md w-8 h-8 flex items-center justify-center text-navy font-bold text-lg hover:bg-cream transition-colors"
          title="Zoom out"
        >
          −
        </button>
      </div>
    </div>
  );
}
