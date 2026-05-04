'use client';

import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import type { PinPoint, PolygonGeoJSON } from '@/lib/listings-search';
import { track } from '@/lib/analytics/events';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '6DagWlYgkxoFxL5RaX6S';
const SOURCE_ID = 'listing-pins';
const CLUSTER_LAYER = 'listing-clusters';
const CLUSTER_COUNT_LAYER = 'listing-cluster-count';
const PIN_LAYER = 'listing-pins-unclustered';
const PIN_HOVER_LAYER = 'listing-pin-hover';
const HIGHLIGHT_PROP = 'highlight';

const DEFAULT_CENTER: [number, number] = [-111.9, 33.55];
const DEFAULT_ZOOM = 9;

export interface MapPanelHandle {
  /** Re-center on a single pin (after a card click). */
  flyToListing: (key: string) => void;
  /** Apply a "highlight" feature-state to a single pin and ring. */
  setHighlight: (key: string | null) => void;
}

interface MapPanelProps {
  pins: PinPoint[];
  drawingActive: boolean;
  onPolygonComplete: (poly: PolygonGeoJSON) => void;
  onClearShape: () => void;
  onPinClick: (key: string) => void;
  onPinHover: (key: string | null) => void;
  onViewportChange: (bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => void;
  initialBbox?: { minLng: number; minLat: number; maxLng: number; maxLat: number } | null;
}

/**
 * MapLibre instance with:
 *   - Clustered GeoJSON pin source (gold cluster circles + count text).
 *   - Individual unclustered pins as gold dots; hover ring layer driven by
 *     feature-state.
 *   - terra-draw polygon mode toggled via the `drawingActive` prop.
 *   - Debounced viewport callback (400ms) so the parent can refetch when
 *     panning/zooming.
 *
 * Lazy-imports `maplibre-gl` and `terra-draw` so neither lands in the
 * initial JS bundle on routes that don't render a map.
 */
export const MapPanel = forwardRef<MapPanelHandle, MapPanelProps>(function MapPanel(
  {
    pins,
    drawingActive,
    onPolygonComplete,
    onClearShape,
    onPinClick,
    onPinHover,
    onViewportChange,
    initialBbox,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Stash mutable refs to avoid re-creating the map on every prop change.
  // `unknown` is downgraded to typed locals where used; the maplibre types
  // can't be statically imported because we lazy-load the lib.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawRef = useRef<any>(null);
  const drawingActiveRef = useRef(drawingActive);
  const callbacksRef = useRef({ onPolygonComplete, onClearShape, onPinClick, onPinHover, onViewportChange });
  const highlightedKeyRef = useRef<string | null>(null);
  // Analytics-only refs. These are kept locally so we can throttle pan
  // events (every 5th pan) and infer zoom direction without ratcheting
  // re-renders. None of these participate in the React render cycle.
  const panCounterRef = useRef(0);
  const prevZoomRef = useRef<number | null>(null);
  const drawStartedRef = useRef(false);

  // Keep the latest callbacks accessible from event handlers without causing
  // an effect re-run that would tear down the map.
  useEffect(() => {
    callbacksRef.current = { onPolygonComplete, onClearShape, onPinClick, onPinHover, onViewportChange };
  }, [onPolygonComplete, onClearShape, onPinClick, onPinHover, onViewportChange]);

  // Initialize the map once on mount, tear it down on unmount.
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let viewportTimer: ReturnType<typeof setTimeout> | null = null;

    // Inject MapLibre CSS if a sibling component hasn't already.
    const cssId = 'maplibre-gl-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
      document.head.appendChild(link);
    }

    (async () => {
      const [maplibre, terraDrawMod, adapterMod] = await Promise.all([
        import('maplibre-gl'),
        import('terra-draw'),
        import('terra-draw-maplibre-gl-adapter'),
      ]);
      if (cancelled || !containerRef.current) return;

      const styleUrl = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`;
      const m = new maplibre.Map({
        container: containerRef.current,
        style: styleUrl,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        attributionControl: { compact: true },
      });
      m.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');
      mapRef.current = m;

      // Apply initial bbox from server-side default if present.
      if (initialBbox) {
        m.fitBounds(
          [
            [initialBbox.minLng, initialBbox.minLat],
            [initialBbox.maxLng, initialBbox.maxLat],
          ],
          { padding: 40, animate: false, maxZoom: 12 },
        );
      }

      m.on('load', () => {
        m.addSource(SOURCE_ID, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterRadius: 50,
          clusterMaxZoom: 14,
          promoteId: 'key',
        });

        m.addLayer({
          id: CLUSTER_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#D4B88A',
            'circle-stroke-color': 'rgba(239,233,223,0.6)',
            'circle-stroke-width': 2,
            'circle-radius': [
              'step', ['get', 'point_count'],
              16, 10, 20, 50, 26, 200, 32,
            ],
            'circle-opacity': 0.92,
          },
        });

        m.addLayer({
          id: CLUSTER_COUNT_LAYER,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
          paint: { 'text-color': '#0B1620' },
        });

        m.addLayer({
          id: PIN_HOVER_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': [
              'case',
              ['boolean', ['feature-state', HIGHLIGHT_PROP], false], 14,
              0,
            ],
            'circle-color': 'rgba(212,184,138,0.25)',
          },
        });

        m.addLayer({
          id: PIN_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': [
              'case',
              ['boolean', ['feature-state', HIGHLIGHT_PROP], false], 8,
              5,
            ],
            'circle-color': '#D4B88A',
            'circle-stroke-color': '#EFE9DF',
            'circle-stroke-width': 1.5,
          },
        });

        // Cluster click — zoom into the cluster.
        m.on('click', CLUSTER_LAYER, (e) => {
          const feats = m.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER] });
          const cluster = feats[0];
          if (!cluster) return;
          const clusterId = cluster.properties?.cluster_id as number | undefined;
          if (clusterId == null) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const src = m.getSource(SOURCE_ID) as any;
          src.getClusterExpansionZoom(clusterId, (err: Error | null | undefined, zoom: number) => {
            if (err || zoom == null) return;
            const geom = cluster.geometry as { type: string; coordinates: [number, number] };
            m.easeTo({ center: geom.coordinates, zoom });
          });
        });

        // Pin click — hand off to parent. (The parent fires `map_pin_click`
        // — keeps both the highlight side-effect and the analytics in one
        // call site rather than splitting across files.)
        m.on('click', PIN_LAYER, (e) => {
          const feat = e.features?.[0];
          const key = feat?.properties?.key as string | undefined;
          if (key) callbacksRef.current.onPinClick(key);
        });

        // Hover — change cursor and notify parent.
        m.on('mousemove', PIN_LAYER, (e) => {
          m.getCanvas().style.cursor = 'pointer';
          const key = e.features?.[0]?.properties?.key as string | undefined;
          if (key && key !== highlightedKeyRef.current) {
            callbacksRef.current.onPinHover(key);
          }
        });
        m.on('mouseleave', PIN_LAYER, () => {
          m.getCanvas().style.cursor = '';
          callbacksRef.current.onPinHover(null);
        });
        m.on('mouseenter', CLUSTER_LAYER, () => { m.getCanvas().style.cursor = 'pointer'; });
        m.on('mouseleave', CLUSTER_LAYER, () => { m.getCanvas().style.cursor = ''; });

        // Debounced viewport callback (400ms idle).
        const fireBbox = () => {
          if (drawingActiveRef.current) return; // user is mid-draw — don't trigger refetches
          const b = m.getBounds();
          callbacksRef.current.onViewportChange({
            minLng: b.getWest(),
            minLat: b.getSouth(),
            maxLng: b.getEast(),
            maxLat: b.getNorth(),
          });
        };
        m.on('moveend', () => {
          if (viewportTimer) clearTimeout(viewportTimer);
          viewportTimer = setTimeout(fireBbox, 400);
          // Throttle map_pan to every 5th moveend so a long drag emits one
          // event rather than dozens. Skip while the user is mid-draw.
          if (drawingActiveRef.current) return;
          panCounterRef.current = (panCounterRef.current + 1) % 5;
          if (panCounterRef.current === 0) {
            track('map_pan', {});
          }
        });

        // map_zoom — once per zoom transition, with direction inferred from
        // the previous zoom level. MapLibre fires zoomend after pinch/scroll
        // settle so this isn't spammy.
        prevZoomRef.current = m.getZoom();
        m.on('zoomend', () => {
          const z = m.getZoom();
          const prev = prevZoomRef.current;
          const direction: 'in' | 'out' = prev !== null && z < prev ? 'out' : 'in';
          prevZoomRef.current = z;
          track('map_zoom', { direction, level: Math.round(z * 10) / 10 });
        });

        // Initialize terra-draw with a single polygon mode. We instantiate
        // it but only enable on demand via .start()/.stop() in the prop sync
        // effect below.
        const adapter = new adapterMod.TerraDrawMapLibreGLAdapter({ map: m });
        const draw = new terraDrawMod.TerraDraw({
          adapter,
          modes: [
            new terraDrawMod.TerraDrawPolygonMode({
              styles: {
                fillColor: '#D4B88A',
                fillOpacity: 0.18,
                outlineColor: '#D4B88A',
                outlineWidth: 2,
                closingPointColor: '#D4B88A',
                closingPointOutlineColor: '#EFE9DF',
                closingPointOutlineWidth: 2,
              },
            }),
          ],
        });
        draw.start();
        drawRef.current = draw;
        // We started the engine, but no mode is active yet — switch to a
        // benign no-op mode by not calling setMode. terra-draw only listens
        // to events when a mode is set.
        draw.setMode('static');

        // When the user closes a polygon, dispatch upstream and stop drawing.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        draw.on('finish', (_id: string | number, ctx: any) => {
          if (ctx?.mode !== 'polygon') return;
          const snapshot = draw.getSnapshot();
          const feature = snapshot.find((f) => f.geometry?.type === 'Polygon');
          if (!feature) return;
          const geom = feature.geometry as { type: 'Polygon'; coordinates: number[][][] };
          // Approximate polygon area (km²) via the spherical-excess formula
          // — close enough for analytics without pulling in turf.
          const area_km2 = polygonAreaKm2(geom.coordinates);
          // results_count is recomputed by the parent's fetch effect; we
          // don't have it here yet. Pass -1 as "unknown" — the parent
          // emits the search-result count via search_query separately.
          track('map_polygon_draw_complete', { area_km2, results_count: -1 });
          drawStartedRef.current = false;
          callbacksRef.current.onPolygonComplete({ type: 'Polygon', coordinates: geom.coordinates });
          draw.setMode('static');
        });
      });
    })();

    return () => {
      cancelled = true;
      if (viewportTimer) clearTimeout(viewportTimer);
      if (drawRef.current) {
        try { drawRef.current.stop(); } catch { /* ignore */ }
        drawRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync pin data into the GeoJSON source whenever the pin set changes.
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    const apply = () => {
      const src = m.getSource(SOURCE_ID);
      if (!src) return;
      src.setData({
        type: 'FeatureCollection',
        features: pins.map((p) => ({
          type: 'Feature',
          id: p.listingKey,
          properties: { key: p.listingKey, id: p.listingId, price: p.listPrice ?? 0, status: p.status },
          geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
        })),
      });
    };
    if (m.isStyleLoaded()) apply();
    else m.once('load', apply);
  }, [pins]);

  // Toggle terra-draw polygon mode based on `drawingActive`. We fire
  // `map_polygon_draw_start` here (rather than inside terra-draw's `change`
  // event) so we count "user activated draw mode" once — even if they bail
  // before placing any vertices. The matching `_complete` fires from the
  // `finish` callback above.
  useEffect(() => {
    drawingActiveRef.current = drawingActive;
    const draw = drawRef.current;
    if (!draw) return;
    if (drawingActive) {
      try { draw.clear(); } catch { /* ignore */ }
      draw.setMode('polygon');
      if (!drawStartedRef.current) {
        drawStartedRef.current = true;
        track('map_polygon_draw_start', {});
      }
    } else {
      draw.setMode('static');
      drawStartedRef.current = false;
    }
  }, [drawingActive]);

  // Imperative handle for parent commands (flyTo + highlight).
  useImperativeHandle(ref, () => ({
    flyToListing: (key: string) => {
      const m = mapRef.current;
      if (!m) return;
      const src = m.getSource(SOURCE_ID);
      if (!src) return;
      const data = src._data as { features?: Array<{ properties?: { key?: string }; geometry?: { coordinates?: [number, number] } }> } | undefined;
      const feat = data?.features?.find((f) => f.properties?.key === key);
      const coords = feat?.geometry?.coordinates;
      if (coords) m.easeTo({ center: coords, zoom: Math.max(m.getZoom(), 13), duration: 600 });
    },
    setHighlight: (key: string | null) => {
      const m = mapRef.current;
      if (!m) return;
      const prev = highlightedKeyRef.current;
      if (prev && prev !== key) {
        m.setFeatureState({ source: SOURCE_ID, id: prev }, { [HIGHLIGHT_PROP]: false });
      }
      if (key) {
        m.setFeatureState({ source: SOURCE_ID, id: key }, { [HIGHLIGHT_PROP]: true });
      }
      highlightedKeyRef.current = key;
    },
  }), []);

  // Wire a "Clear shape" callback when the parent toggles drawingActive off
  // mid-draw — terra-draw must clear its in-progress polygon.
  useEffect(() => {
    if (!drawingActive && drawRef.current) {
      try { drawRef.current.clear(); } catch { /* ignore */ }
    }
  }, [drawingActive]);

  // The onClearShape prop is exposed via the parent's "Clear shape" button;
  // we don't need to wire it inside the map directly. Keep a no-op reference
  // to silence the unused-prop lint without changing the public API.
  void onClearShape;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full bg-ink-surface"
      aria-label="Map of listings"
    />
  );
});

/**
 * Approximate the area (km²) of a GeoJSON polygon ring using the spherical-
 * excess formula on the unit sphere, scaled by Earth's mean radius. Adequate
 * for analytics; a turf import would add bundle weight for two decimals of
 * precision we don't need.
 *
 * Only the outer ring (coords[0]) contributes — the listings polygon-draw
 * UI never produces holes, but if it ever did, the holes get ignored which
 * over-counts area slightly. That's fine for a histogram; we'd revisit if
 * we ever started gating logic on the value.
 */
function polygonAreaKm2(coords: number[][][]): number {
  if (!coords || coords.length === 0 || coords[0].length < 4) return 0;
  const ring = coords[0];
  const R = 6_371_008.8; // Earth mean radius, meters
  let total = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    total +=
      ((lon2 - lon1) * Math.PI / 180) *
      (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180));
  }
  const m2 = Math.abs((total * R * R) / 2);
  return Math.round((m2 / 1_000_000) * 100) / 100;
}
