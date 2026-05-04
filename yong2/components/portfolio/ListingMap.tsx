'use client';

import { useEffect, useRef } from 'react';

interface ListingMapProps {
  latitude: number;
  longitude: number;
  address: string;
}

const MAPTILER_KEY =
  process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '6DagWlYgkxoFxL5RaX6S';

/**
 * MapLibre GL embed for the listing detail page. Uses MapTiler's dark
 * `streets-v2-dark` style so the map sits comfortably inside the
 * Midnight & Stone palette.
 *
 * - Lazy-imports `maplibre-gl` so the ~600KB module never enters the
 *   initial JS bundle on routes that don't render a map.
 * - Loads the matching CSS via a `<link>` tag injected on first mount
 *   (avoids depending on a global stylesheet rule).
 * - Custom gold pin (a 14px circle with cream ring) marks the listing,
 *   with the address pinned as a popup that opens on click.
 * - Scroll-zoom is disabled so the page can scroll past the map without
 *   trapping the user; +/- controls remain.
 */
export function ListingMap({ latitude, longitude, address }: ListingMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let map: { remove: () => void } | null = null;

    // Inject MapLibre CSS once.
    const cssId = 'maplibre-gl-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
      document.head.appendChild(link);
    }

    let cancelled = false;
    (async () => {
      const mod = await import('maplibre-gl');
      if (cancelled || !containerRef.current) return;
      const styleUrl = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`;
      const m = new mod.Map({
        container: containerRef.current,
        style: styleUrl,
        center: [longitude, latitude],
        zoom: 14,
        scrollZoom: false,
        attributionControl: { compact: true },
      });
      m.addControl(new mod.NavigationControl({ showCompass: false }), 'top-right');

      const el = document.createElement('div');
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.borderRadius = '50%';
      el.style.background = '#D4B88A';
      el.style.boxShadow = '0 0 0 4px rgba(239,233,223,0.85), 0 2px 8px rgba(0,0,0,0.45)';
      el.style.cursor = 'pointer';

      const popup = new mod.Popup({ offset: 18, closeButton: false }).setText(address);
      new mod.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(m);

      map = m;
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [latitude, longitude, address]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '480px' }}
      aria-label={`Map showing ${address}`}
    />
  );
}
