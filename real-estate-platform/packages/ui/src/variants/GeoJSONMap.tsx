'use client';

import { useEffect, useRef } from 'react';

export interface GeoJSONMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    lat: number;
    lng: number;
    title?: string;
    popup?: string;
  }>;
  geoJSON?: GeoJSON.FeatureCollection;
  className?: string;
  height?: string;
}

export function GeoJSONMap({
  center,
  zoom = 12,
  markers = [],
  geoJSON,
  className = '',
  height = '400px',
}: GeoJSONMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    // Map initialization would go here
    // This is a placeholder - actual implementation would use a mapping library
    // like Mapbox, Leaflet, or Google Maps

    if (!mapRef.current) return;

    // Placeholder: In production, initialize map library here
    console.log('Map would initialize with:', { center, zoom, markers, geoJSON });

    return () => {
      // Cleanup map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, markers, geoJSON]);

  return (
    <div
      ref={mapRef}
      className={`relative bg-secondary-100 rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    >
      <div className="absolute inset-0 flex items-center justify-center text-secondary-500">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-secondary-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="mt-2 text-sm">Interactive Map</p>
          <p className="text-xs text-secondary-400">
            {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
          </p>
        </div>
      </div>
    </div>
  );
}
