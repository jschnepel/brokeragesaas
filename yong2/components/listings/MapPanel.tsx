'use client';

import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import type { PinPoint, PolygonGeoJSON } from '@/lib/listings-search';
import type { Listing } from '@/lib/types';
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
const PRICE_LABEL_LAYER = 'listing-price-labels';

/** Compact price label for the map pin overlay — "$1.2M" / "$850K". */
function formatPriceLabel(price: number | null | undefined): string {
  if (price == null || !Number.isFinite(price) || price <= 0) return '';
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return m >= 10 ? `$${Math.round(m)}M` : `$${m.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (price >= 1_000) return `$${Math.round(price / 1_000)}K`;
  return `$${price}`;
}

export interface MapPanelHandle {
  /** Re-center on a single pin (after a card click). */
  flyToListing: (key: string) => void;
  /** Apply a "highlight" feature-state to a single pin and ring. */
  setHighlight: (key: string | null) => void;
  /**
   * Fit the camera to the bounding box of a pin set. Used after a
   * text search returns matches that may be outside the current
   * viewport — without this the result panel shows hits but the
   * map keeps its old framing and the user can't see the pins.
   * No-ops when the array is empty or all coords are invalid.
   */
  fitToPins: (pinsToFit: PinPoint[]) => void;
}

interface MapPanelProps {
  pins: PinPoint[];
  drawingActive: boolean;
  /**
   * Currently-active polygon (or null when none). Watched by the
   * shape-sync effect: when this transitions to null the terra-draw
   * feature is cleared from the map. A non-null value left in place
   * after a successful draw is the signal to KEEP the polygon
   * rendered — without this the `drawingActive=false` transition
   * after `finish` would wipe the shape the user just drew.
   */
  polygon: PolygonGeoJSON | null;
  onPolygonComplete: (poly: PolygonGeoJSON) => void;
  onClearShape: () => void;
  onPinClick: (key: string, slug: string) => void;
  onPinHover: (key: string | null) => void;
  onViewportChange: (bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => void;
  initialBbox?: { minLng: number; minLat: number; maxLng: number; maxLat: number } | null;
  /**
   * Currently-loaded listing records keyed by listingKey. Drives the
   * pin hover popup — looks up the cover photo + beds/baths/sqft for
   * the hovered pin's listing. Pins outside the loaded set (beyond
   * the paginated window) fall back to a minimal popup with just
   * price + address from the pin record.
   */
  listingsByKey?: Map<string, Listing>;
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
    polygon,
    onPolygonComplete,
    onClearShape,
    onPinClick,
    onPinHover,
    onViewportChange,
    initialBbox,
    listingsByKey,
  },
  ref,
) {
  // Keep the latest listingsByKey accessible from the imperative
  // popup handlers without retriggering the map-init effect (which
  // would tear down and recreate the map on every results update).
  const listingsByKeyRef = useRef<Map<string, Listing> | undefined>(listingsByKey);
  useEffect(() => {
    listingsByKeyRef.current = listingsByKey;
  }, [listingsByKey]);

  // Hold the latest pins array in a ref so the map-init effect's
  // 'load' handler can pull current data when the source first
  // mounts. Without this, the pins-update useEffect would have
  // already fired (when pins prop first arrived) and bailed out
  // because mapRef.current was still null mid-init — leaving the
  // source permanently empty until the user interacts.
  const pinsRef = useRef<PinPoint[]>(pins);
  useEffect(() => {
    pinsRef.current = pins;
  }, [pins]);
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
        // Hydrate source with the latest pins available at load time.
        // The pins-update useEffect already fired (when pins prop first
        // arrived) but bailed because mapRef.current was still null
        // mid-init; without seeding here the source would stay empty
        // forever until the user panned/typed and triggered another
        // pins prop change.
        const initialPinsForSource = pinsRef.current ?? [];
        m.addSource(SOURCE_ID, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            // Do NOT set the top-level Feature `id`. ARMLS listingKeys
            // are 24–25 digit strings (e.g. "20260411222220801575000000")
            // that MapLibre's GeoJSON worker tries to encode as int64.
            // The varint encoding overflows ("Given varint doesn't fit
            // into 10 bytes") and the worker silently drops the entire
            // feature batch — leaving the source apparently populated
            // (_data.features has 60 items) but querySourceFeatures
            // returns 0 and nothing renders. promoteId: 'key' below
            // tells MapLibre to use properties.key as the feature id
            // post-parse, which is the correct path.
            features: initialPinsForSource.map((p) => ({
              type: 'Feature',
              properties: {
                key: p.listingKey,
                id: p.listingId,
                slug: p.slug,
                price: p.listPrice ?? 0,
                priceLabel: formatPriceLabel(p.listPrice),
                status: p.status,
                address: p.unparsedAddress ?? '',
                community: p.community ?? '',
                beds: p.bedrooms ?? null,
                baths: p.bathroomsTotal ?? null,
                sqft: p.livingArea ?? null,
                photo: p.coverPhotoUrl ?? '',
                office: p.listOfficeName ?? '',
              },
              geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
            })),
          },
          // Zoom-aware clustering. Below zoom 11 the dense Phoenix
          // metro produces ~hundreds of overlapping dots — clusters
          // restore legibility. Above 11 we drop to per-pin rendering
          // with the popup + price-pill treatment.
          //
          // clusterMaxZoom = 11 means clusters DISAPPEAR at zoom 12+;
          // every feature renders as an individual pin from 12 up.
          // clusterRadius = 50px works well on a 1280px-wide map.
          // promoteId: 'key' propagates the listingKey as the feature
          // id post-clustering for the unclustered layer; the cluster
          // layer uses MapLibre's auto-generated cluster_id.
          cluster: true,
          clusterMaxZoom: 11,
          clusterRadius: 50,
          promoteId: 'key',
        });

        m.addLayer({
          id: CLUSTER_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#D4B88A',
            'circle-stroke-color': 'rgba(239,233,223,0.7)',
            'circle-stroke-width': 2.5,
            'circle-radius': [
              'step', ['get', 'point_count'],
              20, 10, 26, 50, 32, 200, 40,
            ],
            'circle-opacity': 0.95,
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
            'text-size': 13,
            'text-allow-overlap': true,
          },
          paint: { 'text-color': '#0B1620' },
        });

        // Soft halo behind every individual pin so it pops against
        // the dark MapLibre style — was invisible at default zooms
        // (5px gold dot on dark navy was easy to scan past).
        m.addLayer({
          id: PIN_HOVER_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': [
              'case',
              ['boolean', ['feature-state', HIGHLIGHT_PROP], false], 18,
              12,
            ],
            'circle-color': [
              'case',
              ['boolean', ['feature-state', HIGHLIGHT_PROP], false], 'rgba(212,184,138,0.40)',
              'rgba(212,184,138,0.18)',
            ],
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
              ['boolean', ['feature-state', HIGHLIGHT_PROP], false], 10,
              7,
            ],
            // Active = gold, Pending / Active Under Contract = amber
            // tone so the visitor can tell at a glance which pins are
            // already under contract without clicking through.
            'circle-color': [
              'case',
              ['==', ['get', 'status'], 'Pending'], '#E0A06A',
              ['==', ['get', 'status'], 'Active Under Contract'], '#E0A06A',
              '#D4B88A',
            ],
            'circle-stroke-color': '#EFE9DF',
            'circle-stroke-width': 1.75,
          },
        });

        // Price-pill labels — Zillow signature treatment. Render only
        // for unclustered pins at zoom >= 12 (anything wider crowds
        // the labels and trips MapLibre's collision logic into hiding
        // most of them anyway). Text colored ink-on-stone with an ink
        // halo so it reads against the dark basemap; the underlying
        // gold dot still shows through above the label.
        m.addLayer({
          id: PRICE_LABEL_LAYER,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          // minzoom 13 (was 12) — at zoom 12 over Phoenix metro the
          // collision-detection pass over hundreds of price labels was
          // the single biggest per-frame cost during pan/zoom. Bumping
          // by one zoom level halves the visible feature count and
          // makes the label layer essentially free.
          minzoom: 13,
          layout: {
            'text-field': ['coalesce', ['get', 'priceLabel'], ''],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 11,
            'text-offset': [0, -1.4],
            'text-anchor': 'bottom',
            'text-allow-overlap': false,
            'text-padding': 2,
            'symbol-sort-key': ['*', -1, ['coalesce', ['get', 'price'], 0]],
          },
          paint: {
            'text-color': '#EFE9DF',
            'text-halo-color': '#0B1620',
            'text-halo-width': 1.5,
            'text-halo-blur': 0.5,
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
          const slug = feat?.properties?.slug as string | undefined;
          if (key && slug) callbacksRef.current.onPinClick(key, slug);
        });

        // Hover popup — Zillow-style mini-card anchored above the pin.
        // Pulls cover photo + beds/baths/sqft from the loaded listings
        // map when available; falls back to a minimal price + address
        // popup for pins outside the paginated window.
        //
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let popup: any = null;
        let popupKey: string | null = null;
        const closePopup = () => {
          if (popup) {
            popup.remove();
            popup = null;
            popupKey = null;
          }
        };
        m.on('mousemove', PIN_LAYER, (e) => {
          m.getCanvas().style.cursor = 'pointer';
          const feat = e.features?.[0];
          const key = feat?.properties?.key as string | undefined;
          if (!key) return;
          if (key && key !== highlightedKeyRef.current) {
            callbacksRef.current.onPinHover(key);
          }
          if (key === popupKey) return;
          popupKey = key;
          if (popup) popup.remove();
          const geom = feat?.geometry as { type: string; coordinates: [number, number] } | undefined;
          if (!geom) return;
          // Every pin carries enough data inline (address, beds/baths/sqft,
          // photo) for the popup to render richly — see PinPoint in
          // lib/listings-search.ts. The listingsByKey lookup is only a
          // belt-and-suspenders fallback for the visible-listings slice.
          const listing = listingsByKeyRef.current?.get(key);
          const props = (feat?.properties ?? {}) as Record<string, unknown>;
          const html = buildPopupHtml(listing, key, props);
          popup = new maplibre.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 18,
            anchor: 'bottom',
            className: 'yong2-pin-popup',
            maxWidth: '320px',
          })
            .setLngLat(geom.coordinates)
            .setHTML(html)
            .addTo(m);
        });
        m.on('mouseleave', PIN_LAYER, () => {
          m.getCanvas().style.cursor = '';
          callbacksRef.current.onPinHover(null);
          closePopup();
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
          // 250ms — fast enough to feel responsive, slow enough that a
          // rapid drag doesn't fire intermediate fetches mid-gesture.
          // Lower than 200ms starts to fire on micro-jitter from
          // touchpad inertia; higher than ~300ms feels laggy when
          // chasing a specific neighborhood by zoom.
          viewportTimer = setTimeout(fireBbox, 250);
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

        // Initialize terra-draw with FREEHAND mode — press-and-drag lasso
        // matching Zillow's UX. The earlier TerraDrawPolygonMode was a
        // click-to-place-vertex tool, which felt clunky for drawing a
        // neighborhood-shaped boundary.
        //
        // TerraDrawFreehandMode captures pointer movement at ~8px
        // intervals while the user holds the mouse/touch down, then
        // auto-closes the ring on release. The resulting polygon is
        // already simplified by terra-draw's internal Ramer-Douglas-
        // Peucker pass, so we don't ship hundreds of micro-vertices to
        // the backend.
        const adapter = new adapterMod.TerraDrawMapLibreGLAdapter({ map: m });
        const draw = new terraDrawMod.TerraDraw({
          adapter,
          modes: [
            new terraDrawMod.TerraDrawFreehandMode({
              // Press-and-drag (Zillow-style) — NOT click-to-start /
              // move-freely / click-to-end. With click-drag the user
              // mousedowns to begin, traces while holding, and the
              // polygon auto-closes on mouseup.
              drawInteraction: 'click-drag',
              // Pixel spacing between captured vertices during the
              // drag. 6px is smooth enough to feel continuous; lower
              // values bloat the polygon and slow PostGIS intersection
              // checks downstream.
              minDistance: 6,
              // Auto-close the ring on mouseup so the user doesn't
              // have to land exactly on the start point.
              autoClose: true,
              // Smoothing factor — terra-draw applies Chaikin's
              // algorithm to the captured vertices before closing.
              // 0.3 noticeably softens jagged hand-drawn lines without
              // distorting the boundary.
              smoothing: 0.3,
              cursors: { start: 'crosshair', close: 'crosshair' },
              styles: {
                fillColor: '#D4B88A',
                fillOpacity: 0.16,
                outlineColor: '#D4B88A',
                outlineWidth: 2.5,
                closingPointColor: '#D4B88A',
                closingPointOutlineColor: '#EFE9DF',
                closingPointOutlineWidth: 2,
              },
            }),
          ],
        });
        draw.start();
        drawRef.current = draw;
        draw.setMode('static');

        // Fired when the user releases the mouse/touch — freehand
        // mode auto-closes the polygon at that moment.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        draw.on('finish', (_id: string | number, ctx: any) => {
          if (ctx?.mode !== 'freehand') return;
          const snapshot = draw.getSnapshot();
          const feature = snapshot.find((f) => f.geometry?.type === 'Polygon');
          if (!feature) return;
          const geom = feature.geometry as { type: 'Polygon'; coordinates: number[][][] };
          // Sanity check — a degenerate "blip" (mousedown + immediate
          // mouseup without moving) produces a tiny invalid polygon.
          // Filter < 0.01 km² (~30m radius) so a stray click doesn't
          // narrow the listings to a postage stamp.
          const area_km2 = polygonAreaKm2(geom.coordinates);
          if (area_km2 < 0.01) {
            try { draw.clear(); } catch { /* ignore */ }
            draw.setMode('static');
            return;
          }
          track('map_polygon_draw_complete', { area_km2, results_count: -1 });
          drawStartedRef.current = false;
          callbacksRef.current.onPolygonComplete({ type: 'Polygon', coordinates: geom.coordinates });
          draw.setMode('static');
          // Fit the map to the freshly-drawn polygon so the visitor's
          // selection is centered + framed. Without this, a polygon
          // drawn near the edge of the viewport (or on a different
          // zoom level than where the results land) leaves the user
          // looking at empty basemap while the pin set is elsewhere.
          // padding=60 keeps the polygon clear of the search-panel
          // gutter on the right; maxZoom=15 prevents over-zooming on
          // tiny shapes that would otherwise jump past street level.
          const b = polygonBounds(geom.coordinates);
          if (Number.isFinite(b.minLng) && Number.isFinite(b.minLat)) {
            m.fitBounds(
              [
                [b.minLng, b.minLat],
                [b.maxLng, b.maxLat],
              ],
              { padding: 60, animate: true, duration: 600, maxZoom: 15 },
            );
          }
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
        // No top-level `id` field — see source-seed comment in m.on('load')
        // above. ARMLS listingKeys overflow MapLibre's int64 varint
        // encoder and silently drop the whole batch.
        features: pins.map((p) => ({
          type: 'Feature',
          properties: {
            key: p.listingKey,
            id: p.listingId,
            slug: p.slug,
            price: p.listPrice ?? 0,
            // priceLabel is pre-formatted on the client because
            // MapLibre's expression DSL has no Intl.NumberFormat.
            priceLabel: formatPriceLabel(p.listPrice),
            status: p.status,
            address: p.unparsedAddress ?? '',
            community: p.community ?? '',
            beds: p.bedrooms ?? null,
            baths: p.bathroomsTotal ?? null,
            sqft: p.livingArea ?? null,
            photo: p.coverPhotoUrl ?? '',
          },
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
      draw.setMode('freehand');
      // Disable map drag while drawing — without this, pressing and
      // dragging would pan the map underneath the lasso. terra-draw
      // doesn't auto-disable map interactions in freehand mode the
      // way it does for click-to-place polygon mode.
      const m = mapRef.current;
      if (m) {
        m.dragPan.disable();
        m.getCanvas().style.cursor = 'crosshair';
      }
      if (!drawStartedRef.current) {
        drawStartedRef.current = true;
        track('map_polygon_draw_start', {});
      }
    } else {
      draw.setMode('static');
      drawStartedRef.current = false;
      const m = mapRef.current;
      if (m) {
        m.dragPan.enable();
        m.getCanvas().style.cursor = '';
      }
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
      // Race-guard: the parent (`ListingsClient`) calls `setHighlight`
      // from onMouseEnter/onMouseLeave on result cards. Those events
      // fire as soon as the React tree hydrates and the visitor moves
      // the cursor — well before MapLibre's style.json has finished
      // loading and the `listing-pins` source has been added (see
      // line ~197 `m.addSource(SOURCE_ID, ...)` which runs inside the
      // map's `load` event handler).
      //
      // Pre-source-add, `m.setFeatureState({ source: 'listing-pins' })`
      // throws `Error: The source 'listing-pins' does not exist in the
      // map's style.` Bail out until the source is registered; we'll
      // pick up the highlight on the next hover.
      if (!m.getSource(SOURCE_ID)) {
        highlightedKeyRef.current = key;
        return;
      }
      const prev = highlightedKeyRef.current;
      if (prev && prev !== key) {
        m.setFeatureState({ source: SOURCE_ID, id: prev }, { [HIGHLIGHT_PROP]: false });
      }
      if (key) {
        m.setFeatureState({ source: SOURCE_ID, id: key }, { [HIGHLIGHT_PROP]: true });
      }
      highlightedKeyRef.current = key;
    },
    fitToPins: (pinsToFit: PinPoint[]) => {
      const m = mapRef.current;
      if (!m || !pinsToFit || pinsToFit.length === 0) return;
      let minLng = Infinity;
      let minLat = Infinity;
      let maxLng = -Infinity;
      let maxLat = -Infinity;
      for (const p of pinsToFit) {
        if (!Number.isFinite(p.longitude) || !Number.isFinite(p.latitude)) continue;
        if (p.longitude < minLng) minLng = p.longitude;
        if (p.latitude < minLat) minLat = p.latitude;
        if (p.longitude > maxLng) maxLng = p.longitude;
        if (p.latitude > maxLat) maxLat = p.latitude;
      }
      if (!Number.isFinite(minLng) || !Number.isFinite(minLat)) return;
      // maxZoom=14 is street-grid resolution — prevents over-zooming
      // when the pin set is a single listing. padding=60 keeps the
      // pin cluster clear of the right-panel gutter and the top
      // search bar.
      m.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 60, animate: true, duration: 600, maxZoom: 14 },
      );
    },
  }), []);

  // Clear terra-draw's rendered polygon when the parent's polygon
  // state goes null (e.g. user clicks "Clear shape"). Watching the
  // polygon prop — rather than drawingActive — means a SUCCESSFUL
  // draw (drawingActive flips false but polygon is set) keeps the
  // visible shape on the map; only an explicit clear wipes it.
  //
  // Previous implementation watched drawingActive and called
  // draw.clear() on every false transition, which silently erased
  // the polygon the user had just finished drawing (the finish
  // event sets drawingActive=false on the parent, which fired this
  // effect and undid the draw).
  useEffect(() => {
    if (polygon == null && drawRef.current) {
      try { drawRef.current.clear(); } catch { /* ignore */ }
    }
  }, [polygon]);

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full bg-ink-surface"
        aria-label="Map of listings"
      />
      {/* Draw-mode instruction overlay — appears when freehand lasso
       *  is armed. Anchored top-center so it doesn't compete with
       *  the bottom-right map controls. Dims the basemap subtly so
       *  the visitor knows interaction-mode has shifted. The
       *  pointer-events-none guarantees the overlay can't intercept
       *  the very mousedown that should start the draw. */}
      {drawingActive ? (
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute inset-x-0 top-3 flex justify-center">
            <div className="pointer-events-auto rounded-full bg-ink/85 backdrop-blur-sm border border-gold/50 px-4 py-2 shadow-lg flex items-center gap-3">
              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span className="caps text-[10px] tracking-[0.28em] text-stone">
                Click &amp; drag to draw your area
              </span>
              <button
                type="button"
                onClick={onClearShape}
                className="caps text-[10px] tracking-[0.28em] text-gold hover:text-stone transition-colors"
                aria-label="Cancel drawing"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
});

/**
 * Build the hover-popup HTML for a pin. Renders a Zillow-style
 * mini-card: cover photo (when available), price in gold serif,
 * beds/baths/sqft row, address. The MapLibre Popup class accepts
 * raw HTML strings, so we hand-write a small template rather than
 * spinning up React-in-MapLibre via createPortal — too heavy for
 * a hover affordance that mounts and unmounts constantly.
 */
function buildPopupHtml(
  listing: Listing | undefined,
  _key: string,
  pinProps: Record<string, unknown>,
): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  const fmtPrice = (n: number | null | undefined) => {
    if (n == null || !Number.isFinite(n) || n <= 0) return 'Price Upon Request';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n);
  };
  // Pin properties are the source of truth — every pin carries the
  // surface the popup needs (address, photo, beds/baths/sqft). The
  // visible-listings Listing object is just a richer fallback for
  // fields the pin doesn't carry.
  const pinPhoto = typeof pinProps.photo === 'string' && pinProps.photo ? pinProps.photo : null;
  const pinAddress = typeof pinProps.address === 'string' ? pinProps.address : '';
  const pinCommunity = typeof pinProps.community === 'string' ? pinProps.community : '';
  const pinPrice =
    typeof pinProps.price === 'number' && pinProps.price > 0
      ? pinProps.price
      : null;
  const pinStatus = typeof pinProps.status === 'string' ? pinProps.status : null;
  const pinBeds = typeof pinProps.beds === 'number' ? pinProps.beds : null;
  const pinBaths = typeof pinProps.baths === 'number' ? pinProps.baths : null;
  const pinSqft = typeof pinProps.sqft === 'number' ? pinProps.sqft : null;
  const pinOffice = typeof pinProps.office === 'string' ? pinProps.office : '';

  const photoUrl = pinPhoto ?? listing?.coverPhotoUrl ?? null;
  const address =
    pinAddress ||
    listing?.unparsedAddress ||
    `${listing?.streetNumber ?? ''} ${listing?.streetName ?? ''}`.trim() ||
    '';
  const community = pinCommunity || listing?.community || '';
  const price = pinPrice ?? listing?.listPrice ?? null;
  const status = pinStatus ?? listing?.status ?? null;
  const bedsN = pinBeds ?? listing?.bedrooms ?? null;
  const bathsN = pinBaths ?? (typeof listing?.bathroomsTotal === 'number' ? listing.bathroomsTotal : null);
  const sqftN = pinSqft ?? listing?.livingArea ?? null;
  // IDX brokerage attribution — required on every listing display
  // surface including map popups (ARMLS Rules § Map Display).
  const officeName = pinOffice || listing?.listOfficeName || '';
  const beds = bedsN != null ? `${bedsN} bd` : null;
  const baths = bathsN != null ? `${bathsN} ba` : null;
  const sqft = sqftN != null ? `${sqftN.toLocaleString('en-US')} sf` : null;
  const specs = [beds, baths, sqft].filter(Boolean).join(' · ');
  const statusBadge =
    status && status !== 'Active'
      ? `<span style="position:absolute;top:8px;left:8px;background:rgba(11,22,32,0.85);color:#EFE9DF;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;padding:3px 6px;">${escape(status === 'Active Under Contract' ? 'Under Contract' : status)}</span>`
      : '';
  const photo = photoUrl
    ? `<div style="position:relative;width:100%;aspect-ratio:4/3;overflow:hidden;background:#0B1620;">
         <img src="${escape(photoUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />
         ${statusBadge}
       </div>`
    : '';
  // IDX compliance footer inside popup — ARMLS rules § Map Display
  // require listing brokerage attribution on every map listing
  // affordance. The 12px floor + sufficient contrast against the
  // dark popup background satisfy ARMLS Rules § Attribution Display.
  const attributionRow = officeName
    ? `<div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(239,233,223,0.12);display:flex;align-items:center;gap:8px;">
         <span style="display:inline-flex;align-items:center;background:rgba(239,233,223,0.95);border-radius:2px;padding:2px 5px;flex-shrink:0;">
           <img src="/images/armls-idx-logo.png" alt="ARMLS" style="height:9px;width:auto;display:block;" />
         </span>
         <span style="font-size:11px;color:rgba(239,233,223,0.75);line-height:1.3;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Courtesy of ${escape(officeName)}</span>
       </div>`
    : `<div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(239,233,223,0.12);display:flex;align-items:center;gap:8px;">
         <span style="display:inline-flex;align-items:center;background:rgba(239,233,223,0.95);border-radius:2px;padding:2px 5px;flex-shrink:0;">
           <img src="/images/armls-idx-logo.png" alt="ARMLS" style="height:9px;width:auto;display:block;" />
         </span>
         <span style="font-size:11px;color:rgba(239,233,223,0.75);line-height:1.3;flex:1;">Listing courtesy of ARMLS</span>
       </div>`;
  return `
    <div style="width:280px;background:#0B1620;color:#EFE9DF;font-family:Inter,system-ui,sans-serif;border:1px solid rgba(212,184,138,0.3);">
      ${photo}
      <div style="padding:12px 14px;">
        ${community ? `<div style="font-size:9.5px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(239,233,223,0.6);margin-bottom:4px;">${escape(community)}</div>` : ''}
        <div style="font-family:'Playfair Display',Georgia,serif;font-size:18px;color:#D4B88A;line-height:1.2;margin-bottom:6px;">${fmtPrice(price)}</div>
        ${specs ? `<div style="font-size:11px;color:rgba(239,233,223,0.7);font-variant-numeric:tabular-nums;margin-bottom:6px;">${escape(specs)}</div>` : ''}
        ${address ? `<div style="font-size:11.5px;color:rgba(239,233,223,0.65);line-height:1.35;">${escape(address)}</div>` : ''}
        ${attributionRow}
      </div>
    </div>
  `;
}

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
/**
 * Compute the axis-aligned lng/lat bounding box of a polygon. Used to
 * fitBounds() the map after the user finishes drawing — without this,
 * a polygon drawn near the edge of the viewport leaves the visitor
 * looking at empty basemap while the narrowed pin set sits off-screen.
 */
function polygonBounds(
  coords: number[][][],
): { minLng: number; minLat: number; maxLng: number; maxLat: number } {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const ring of coords) {
    for (const point of ring) {
      const lng = point[0];
      const lat = point[1];
      if (typeof lng !== 'number' || typeof lat !== 'number') continue;
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return { minLng, minLat, maxLng, maxLat };
}

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
