'use client';

import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import MapGL, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import type { LngLatBoundsLike } from 'maplibre-gl';
import Supercluster from 'supercluster';
import type { ListingRecord } from '@platform/database/src/queries/listings';
import type { MapBounds } from './useListingsSearch';

import 'maplibre-gl/dist/maplibre-gl.css';

const PHOENIX_CENTER = { lat: 33.5, lng: -111.9 };
const DEFAULT_ZOOM = 11;
// Phoenix metro bounding box — used as fallback when no listings/bounds
const PHOENIX_BOUNDS: LngLatBoundsLike = [[-112.2, 33.25], [-111.6, 33.75]];

interface ListingsMapProps {
  listings: ListingRecord[];
  hoveredListingKey: string | null;
  onHoverListing: (key: string | null) => void;
  onBoundsChange: (bounds: MapBounds) => void;
  onSearchArea: () => void;
  mapBounds: MapBounds | null;
  hasPendingBounds: boolean;
  polygon: [number, number][] | null;
  onPolygonComplete: (polygon: [number, number][]) => void;
  onPolygonClear: () => void;
}

function formatPriceShort(price: number | null): string {
  if (!price) return '?';
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  return `$${Math.round(price / 1000)}K`;
}

function getCssColor(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return value || fallback;
}

type ListingFeature = GeoJSON.Feature<GeoJSON.Point, {
  listing_key: string;
  listing_id: string;
  list_price: number | null;
}>;

// Polygon GeoJSON helpers
function pointsToPolygonGeoJSON(
  points: [number, number][]
): GeoJSON.Feature<GeoJSON.Polygon> {
  const closed = [...points, points[0]];
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [closed],
    },
    properties: {},
  };
}

function pointsToLineGeoJSON(
  points: [number, number][]
): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: points,
    },
    properties: {},
  };
}

/**
 * Douglas-Peucker line simplification.
 * Reduces freehand trace to a clean polygon with fewer vertices.
 */
function simplifyPath(
  points: [number, number][],
  epsilon: number
): [number, number][] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, maxIdx + 1), epsilon);
    const right = simplifyPath(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ex = point[0] - lineStart[0];
    const ey = point[1] - lineStart[1];
    return Math.sqrt(ex * ex + ey * ey);
  }
  const num = Math.abs(
    dy * point[0] - dx * point[1] + lineEnd[0] * lineStart[1] - lineEnd[1] * lineStart[0]
  );
  return num / Math.sqrt(lenSq);
}

export function ListingsMap({
  listings,
  hoveredListingKey,
  onHoverListing,
  onBoundsChange,
  onSearchArea,
  mapBounds,
  hasPendingBounds,
  polygon,
  onPolygonComplete,
  onPolygonClear,
}: ListingsMapProps) {
  const mapRef = useRef<MapRef>(null);
  const isInitialFit = useRef(true);
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '';
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  // Drawing state — freehand mode
  const [drawMode, setDrawMode] = useState(false);   // user clicked "Draw", waiting to trace
  const [isTracing, setIsTracing] = useState(false);  // actively dragging/tracing
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const drawPointsRef = useRef<[number, number][]>([]);

  const mapStyle = useMemo(
    () => `https://api.maptiler.com/maps/streets-v2-light/style.json?key=${mapTilerKey}`,
    [mapTilerKey]
  );

  // Build GeoJSON features from listings
  const features = useMemo((): ListingFeature[] => {
    return listings
      .filter((l) => l.latitude != null && l.longitude != null)
      .map((l) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [l.longitude!, l.latitude!],
        },
        properties: {
          listing_key: l.listing_key,
          listing_id: l.listing_id,
          list_price: l.list_price,
        },
      }));
  }, [listings]);

  // Create supercluster index
  const index = useMemo(() => {
    const sc = new Supercluster<ListingFeature['properties']>({
      radius: 60,
      maxZoom: 16,
    });
    sc.load(features);
    return sc;
  }, [features]);

  // Get clusters for current viewport
  const clusters = useMemo(() => {
    const map = mapRef.current;
    if (!map) {
      const bounds: [number, number, number, number] = mapBounds
        ? [mapBounds.swLng, mapBounds.swLat, mapBounds.neLng, mapBounds.neLat]
        : [-113, 32, -111, 35];
      return index.getClusters(bounds, Math.floor(zoom));
    }
    const b = map.getMap().getBounds();
    return index.getClusters(
      [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
      Math.floor(zoom)
    );
  }, [index, zoom, mapBounds]);

  // Keep latest values in refs so onLoad handler always sees current data
  const featuresRef = useRef(features);
  featuresRef.current = features;
  const mapBoundsRef = useRef(mapBounds);
  mapBoundsRef.current = mapBounds;
  const polygonRef = useRef(polygon);
  polygonRef.current = polygon;
  const mapReady = useRef(false);

  const fitViewport = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isInitialFit.current) return;

    const gl = map.getMap();
    const container = gl.getContainer();
    // If container has no real dimensions yet, fitBounds will compute world-level zoom.
    // Bail out and let ResizeObserver retry when dimensions arrive.
    if (container.clientWidth === 0 || container.clientHeight === 0) return;

    const mb = mapBoundsRef.current;
    const poly = polygonRef.current;
    const feats = featuresRef.current;

    let bounds: LngLatBoundsLike;
    let opts: { padding: number; maxZoom?: number; animate: boolean };

    if (mb) {
      bounds = [[mb.swLng, mb.swLat], [mb.neLng, mb.neLat]];
      opts = { padding: 20, animate: false };
    } else if (poly && poly.length > 0) {
      let minLat = Infinity, maxLat = -Infinity;
      let minLng = Infinity, maxLng = -Infinity;
      for (const [lng, lat] of poly) {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      }
      bounds = [[minLng, minLat], [maxLng, maxLat]];
      opts = { padding: 60, maxZoom: 15, animate: false };
    } else if (feats.length > 0) {
      let minLat = Infinity, maxLat = -Infinity;
      let minLng = Infinity, maxLng = -Infinity;
      for (const f of feats) {
        const [lng, lat] = f.geometry.coordinates;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      }
      bounds = [[minLng, minLat], [maxLng, maxLat]];
      opts = { padding: 50, maxZoom: 14, animate: false };
    } else {
      // No data — fall back to Phoenix metro
      bounds = PHOENIX_BOUNDS;
      opts = { padding: 20, animate: false };
    }

    try {
      gl.fitBounds(bounds, opts);
    } catch { /* edge case */ }
    isInitialFit.current = false;
  }, []);

  // When map loads, resize then fit viewport — with multiple retries
  // to handle containers that haven't fully laid out yet
  const handleLoad = useCallback(() => {
    mapReady.current = true;
    const map = mapRef.current;
    if (!map) return;
    const gl = map.getMap();

    const tryFit = () => {
      gl.resize();
      if (isInitialFit.current) fitViewport();
    };

    // Attempt immediately
    tryFit();
    // Retry after next frame (layout may not be complete)
    requestAnimationFrame(tryFit);
    // Final safety net — 100ms delay covers slow CSS transitions / display:none→flex
    setTimeout(tryFit, 100);
  }, [fitViewport]);

  // When features arrive after map is already loaded, fit to them
  useEffect(() => {
    if (mapReady.current && isInitialFit.current && features.length > 0) {
      fitViewport();
    }
  }, [features, fitViewport]);

  // Handle container becoming visible (mobile list→map toggle)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady.current) return;
    const gl = map.getMap();
    // ResizeObserver fires when the container gains real dimensions
    const ro = new ResizeObserver(() => {
      gl.resize();
      if (isInitialFit.current) fitViewport();
    });
    ro.observe(gl.getContainer());
    return () => ro.disconnect();
  }, [fitViewport]);

  const handleMoveEnd = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getMap().getBounds();
    setZoom(map.getMap().getZoom());
    if (!drawMode) {
      onBoundsChange({
        swLat: b.getSouth(),
        swLng: b.getWest(),
        neLat: b.getNorth(),
        neLng: b.getEast(),
      });
    }
  }, [onBoundsChange, drawMode]);

  const handleClusterClick = useCallback(
    (clusterId: number, lng: number, lat: number) => {
      const expansionZoom = Math.min(index.getClusterExpansionZoom(clusterId), 20);
      mapRef.current?.getMap().flyTo({
        center: [lng, lat],
        zoom: expansionZoom,
        duration: 500,
      });
    },
    [index]
  );

  // Freehand drawing handlers — attach to the canvas directly
  const enterDrawMode = useCallback(() => {
    setDrawMode(true);
    setDrawPoints([]);
    drawPointsRef.current = [];
  }, []);

  const exitDrawMode = useCallback(() => {
    setDrawMode(false);
    setIsTracing(false);
    setDrawPoints([]);
    drawPointsRef.current = [];
  }, []);

  // Attach native pointer events for freehand tracing
  useEffect(() => {
    if (!drawMode || !mapReady.current) return;
    const map = mapRef.current;
    if (!map) return;
    const canvas = map.getMap().getCanvas();

    const onPointerDown = (e: PointerEvent) => {
      // Only primary button (left click / touch)
      if (e.button !== 0) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);

      const lngLat = map.getMap().unproject([e.offsetX, e.offsetY]);
      const point: [number, number] = [lngLat.lng, lngLat.lat];
      drawPointsRef.current = [point];
      setDrawPoints([point]);
      setIsTracing(true);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!canvas.hasPointerCapture(e.pointerId)) return;
      const lngLat = map.getMap().unproject([e.offsetX, e.offsetY]);
      const point: [number, number] = [lngLat.lng, lngLat.lat];
      drawPointsRef.current.push(point);

      // Throttle React state updates — only update every 3rd point for smooth rendering
      if (drawPointsRef.current.length % 3 === 0) {
        setDrawPoints([...drawPointsRef.current]);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!canvas.hasPointerCapture(e.pointerId)) return;
      canvas.releasePointerCapture(e.pointerId);

      const raw = drawPointsRef.current;
      // Final state sync
      setDrawPoints([...raw]);
      setIsTracing(false);

      if (raw.length < 10) {
        // Too short a trace — reset, let them try again
        drawPointsRef.current = [];
        setDrawPoints([]);
        return;
      }

      // Simplify the freehand path
      // Epsilon is relative to zoom — smaller at high zoom for precision
      const currentZoom = map.getMap().getZoom();
      const epsilon = 0.0005 * Math.pow(2, 14 - currentZoom);
      const simplified = simplifyPath(raw, epsilon);

      // Need at least 3 unique points for a polygon
      if (simplified.length < 3) {
        drawPointsRef.current = [];
        setDrawPoints([]);
        return;
      }

      setDrawMode(false);
      setDrawPoints([]);
      drawPointsRef.current = [];
      setTimeout(() => onPolygonComplete(simplified), 0);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
    };
  }, [drawMode, onPolygonComplete]);

  // Polygon overlay data
  const committedPolygonData = useMemo(() => {
    if (!polygon || polygon.length < 3) return null;
    return pointsToPolygonGeoJSON(polygon);
  }, [polygon]);

  const drawingLineData = useMemo(() => {
    if (!isTracing || drawPoints.length < 2) return null;
    return pointsToLineGeoJSON(drawPoints);
  }, [isTracing, drawPoints]);

  const drawingPolygonData = useMemo(() => {
    if (!isTracing || drawPoints.length < 3) return null;
    return pointsToPolygonGeoJSON(drawPoints);
  }, [isTracing, drawPoints]);

  const navyColor = useMemo(() => getCssColor('--color-navy', '#0C1C2E'), []);
  const goldColor = useMemo(() => getCssColor('--color-gold', '#Bfa67a'), []);

  return (
    <div className="w-full h-full relative">
      <MapGL
        ref={mapRef}
        initialViewState={{
          longitude: mapBounds ? (mapBounds.swLng + mapBounds.neLng) / 2 : PHOENIX_CENTER.lng,
          latitude: mapBounds ? (mapBounds.swLat + mapBounds.neLat) / 2 : PHOENIX_CENTER.lat,
          zoom: mapBounds ? 12 : DEFAULT_ZOOM,
        }}
        // Hard bounds — constrain to greater Phoenix metro area
        maxBounds={[[-113, 32.5], [-110.5, 34.5]]}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        onLoad={handleLoad}
        onMoveEnd={handleMoveEnd}
        doubleClickZoom={!drawMode}
        dragPan={!drawMode}
        dragRotate={!drawMode}
        scrollZoom={!drawMode}
        cursor={drawMode ? 'crosshair' : undefined}
      >
        {/* Committed polygon overlay */}
        {committedPolygonData && (
          <Source id="committed-polygon" type="geojson" data={committedPolygonData}>
            <Layer
              id="committed-polygon-fill"
              type="fill"
              paint={{
                'fill-color': goldColor,
                'fill-opacity': 0.1,
              }}
            />
            <Layer
              id="committed-polygon-line"
              type="line"
              paint={{
                'line-color': goldColor,
                'line-width': 2.5,
                'line-dasharray': [2, 1],
              }}
            />
          </Source>
        )}

        {/* Drawing preview — polygon fill (when 3+ points) */}
        {drawingPolygonData && (
          <Source id="drawing-polygon" type="geojson" data={drawingPolygonData}>
            <Layer
              id="drawing-polygon-fill"
              type="fill"
              paint={{
                'fill-color': goldColor,
                'fill-opacity': 0.08,
              }}
            />
          </Source>
        )}

        {/* Drawing preview — line connecting points */}
        {drawingLineData && (
          <Source id="drawing-line" type="geojson" data={drawingLineData}>
            <Layer
              id="drawing-line-stroke"
              type="line"
              paint={{
                'line-color': navyColor,
                'line-width': 2,
                'line-dasharray': [3, 2],
              }}
            />
          </Source>
        )}

        {/* Listing markers / clusters */}
        {clusters.map((cluster) => {
          const [lng, lat] = cluster.geometry.coordinates;

          if ('cluster' in cluster.properties && cluster.properties.cluster) {
            const { point_count, cluster_id } = cluster.properties;
            const size = point_count < 10 ? 36 : point_count < 50 ? 44 : point_count < 200 ? 52 : 60;

            return (
              <Marker
                key={`cluster-${cluster_id}`}
                longitude={lng}
                latitude={lat}
                anchor="center"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClusterClick(cluster_id!, lng, lat);
                  }}
                  className="cursor-pointer rounded-full flex items-center justify-center"
                  style={{
                    width: size,
                    height: size,
                    background: navyColor,
                    color: 'white',
                    fontSize: point_count < 10 ? 13 : 12,
                    fontWeight: 700,
                    border: '3px solid white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    transition: 'transform 0.15s',
                  }}
                >
                  {point_count}
                </button>
              </Marker>
            );
          }

          const props = cluster.properties as ListingFeature['properties'];
          const isHovered = props.listing_key === hoveredListingKey;
          return (
            <Marker
              key={props.listing_key}
              longitude={lng}
              latitude={lat}
              anchor="center"
            >
              <button
                onMouseEnter={() => onHoverListing(props.listing_key)}
                onMouseLeave={() => onHoverListing(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!drawMode) {
                    window.open(`/listings/${props.listing_id}`, '_blank');
                  }
                }}
                className="cursor-pointer"
                style={{
                  background: isHovered ? goldColor : navyColor,
                  color: 'white',
                  padding: '3px 7px',
                  fontSize: '11px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  border: '2px solid white',
                  borderRadius: '4px',
                  boxShadow: isHovered
                    ? `0 2px 8px rgba(191,166,122,0.5)`
                    : '0 1px 4px rgba(0,0,0,0.3)',
                  transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.15s, background 0.15s, box-shadow 0.15s',
                  zIndex: isHovered ? 10 : 1,
                  position: 'relative',
                }}
              >
                {formatPriceShort(props.list_price)}
              </button>
            </Marker>
          );
        })}
      </MapGL>

      {/* Map utility controls — bottom right */}
      <div className="absolute bottom-6 right-3 z-10 flex flex-col gap-1">
        {/* Compass / Reset North */}
        <button
          onClick={() => {
            mapRef.current?.getMap().easeTo({ bearing: 0, pitch: 0, duration: 400 });
          }}
          className="bg-white border border-navy/15 shadow-md w-8 h-8 flex items-center justify-center hover:bg-cream transition-colors"
          title="Reset North"
        >
          <svg className="w-4 h-4 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3 8h-6l3-8z" fill="currentColor" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22l-3-8h6l-3 8z" fill="none" />
          </svg>
        </button>
        {/* Zoom In */}
        <button
          onClick={() => {
            mapRef.current?.getMap().zoomIn({ duration: 300 });
          }}
          className="bg-white border border-navy/15 shadow-md w-8 h-8 flex items-center justify-center text-navy font-bold text-lg hover:bg-cream transition-colors"
          title="Zoom in"
        >
          +
        </button>
        {/* Zoom Out */}
        <button
          onClick={() => {
            mapRef.current?.getMap().zoomOut({ duration: 300 });
          }}
          className="bg-white border border-navy/15 shadow-md w-8 h-8 flex items-center justify-center text-navy font-bold text-lg hover:bg-cream transition-colors"
          title="Zoom out"
        >
          −
        </button>
        {/* Geolocate / My Location */}
        <button
          onClick={() => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                mapRef.current?.getMap().flyTo({
                  center: [pos.coords.longitude, pos.coords.latitude],
                  zoom: 13,
                  duration: 800,
                });
              },
              () => { /* user denied or error — silently ignore */ }
            );
          }}
          className="bg-white border border-navy/15 shadow-md w-8 h-8 flex items-center justify-center hover:bg-cream transition-colors"
          title="My location"
        >
          <svg className="w-4 h-4 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3" strokeWidth={2} />
            <path strokeLinecap="round" strokeWidth={2} d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
          </svg>
        </button>
      </div>

      {/* Map controls — top bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {/* Draw button — enter freehand mode */}
        {!drawMode && !polygon && (
          <button
            onClick={enterDrawMode}
            className="bg-white border border-navy/15 shadow-lg px-4 py-2 text-sm font-bold text-navy hover:text-gold transition-colors duration-300 flex items-center gap-2 rounded-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Draw
          </button>
        )}

        {/* Drawing mode — waiting or actively tracing */}
        {drawMode && (
          <>
            <div className="bg-navy/90 backdrop-blur-sm text-white px-4 py-2 text-xs font-medium shadow-lg rounded-sm">
              {isTracing
                ? 'Drawing... release to finish'
                : 'Click and drag to draw an area'}
            </div>
            <button
              onClick={exitDrawMode}
              className="bg-white border border-navy/15 shadow-lg px-3 py-2 text-xs font-bold text-navy/50 hover:text-navy transition-colors rounded-sm"
            >
              Cancel
            </button>
          </>
        )}

        {/* Polygon active — show clear + redraw */}
        {!drawMode && polygon && (
          <>
            <button
              onClick={onPolygonClear}
              className="bg-white border border-navy/15 shadow-lg px-4 py-2 text-sm font-bold text-navy hover:text-gold transition-colors duration-300 flex items-center gap-2 rounded-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
            <button
              onClick={() => {
                onPolygonClear();
                setTimeout(enterDrawMode, 50);
              }}
              className="bg-white border border-navy/15 shadow-lg px-4 py-2 text-sm font-bold text-navy hover:text-gold transition-colors duration-300 flex items-center gap-2 rounded-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Redraw
            </button>
          </>
        )}

        {/* Search this area — only when no polygon and not drawing */}
        {!drawMode && !polygon && hasPendingBounds && (
          <button
            onClick={onSearchArea}
            className="bg-white border border-navy/15 shadow-lg px-4 py-2 text-sm font-bold text-navy hover:text-gold transition-colors duration-300 flex items-center gap-2 rounded-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Search this area
          </button>
        )}
      </div>
    </div>
  );
}
