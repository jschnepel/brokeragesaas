/**
 * H3 Hexagonal Heatmap Section — containerized layout.
 * Header: breadcrumb (left) + metric switcher (right).
 * Body: Full-bleed map background with HexDetailPanel overlaid on left.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import MapGL, { Popup } from 'react-map-gl/maplibre';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import type { LngLatBoundsLike } from 'maplibre-gl';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Map as MapIcon } from 'lucide-react';
import type { MarketScope } from '../../models/MarketScope';
import type { ScopeLevel } from '../../models/types';
import type { HeatmapMetricId, HexCell } from '../../data/h3HeatmapData';
import { NEIGHBORHOODS } from '../../data/neighborhoods';
import { MAP_STYLE } from '../../data/phoenixLuxuryZones';

const HEATMAP_CENTER: [number, number] = [33.66, -111.89];
import { useH3Heatmap } from '../../hooks/useH3Heatmap';
import HexagonLayer from './HexagonLayer';
import HeatmapLegend from './HeatmapLegend';
import HexDetailPanel from './HexDetailPanel';

interface H3HeatmapSectionProps {
  scope: MarketScope;
  level: ScopeLevel;
  defaultMetric: HeatmapMetricId;
}

/** Rewrite /insights/... URLs to /temp/analytics/... */
function rewriteUrl(url: string): string {
  if (url === '/insights') return '/temp/analytics';
  if (url.startsWith('/insights/')) return url.replace('/insights/', '/temp/analytics/');
  return url;
}

const H3HeatmapSection: React.FC<H3HeatmapSectionProps> = ({
  scope,
  level,
  defaultMetric,
}) => {
  const navigate = useNavigate();
  const mapRef = useRef<MapRef>(null);
  const [metric, setMetric] = useState<HeatmapMetricId>(defaultMetric);
  const [hoveredCell, setHoveredCell] = useState<HexCell | null>(null);
  const [hoverLngLat, setHoverLngLat] = useState<{ lng: number; lat: number } | null>(null);
  const { cells, bounds, min, max, metricDef } = useH3Heatmap(scope, level, metric);

  // Build a lookup map from h3Index to cell for quick hover resolution
  const cellMap = useMemo(() => {
    const m = new Map<string, HexCell>();
    for (const cell of cells) m.set(cell.h3Index, cell);
    return m;
  }, [cells]);

  // Stable fitBounds helper — called on load and when bounds change
  const fitMapToBounds = useCallback(() => {
    if (!bounds || !mapRef.current) return;
    const map = mapRef.current.getMap();
    const container = map.getContainer();
    const panelWidth = container.offsetWidth * 0.5;

    const mlBounds: LngLatBoundsLike = [
      [bounds[0][1], bounds[0][0]], // [lng, lat] for SW — bounds is [[lat,lng],[lat,lng]]
      [bounds[1][1], bounds[1][0]], // [lng, lat] for NE
    ];

    try {
      map.fitBounds(mlBounds, {
        padding: { top: 20, right: 20, bottom: 20, left: panelWidth },
        maxZoom: 15,
        animate: false,
      });
    } catch { /* single-point scopes */ }
  }, [bounds]);

  // Re-fit when bounds change (metric/scope switch)
  useEffect(() => {
    fitMapToBounds();
  }, [fitMapToBounds]);

  // Build scope breadcrumb trail (skip "Home", start from "Market Insights")
  const scopeCrumbs = useMemo(() => {
    const crumbs = scope.getBreadcrumbs();
    return crumbs.slice(1).map(c => ({
      label: c.label,
      url: rewriteUrl(c.url),
    }));
  }, [scope]);

  const onHoverCell = useCallback((cell: HexCell | null) => {
    setHoveredCell(cell);
  }, []);

  // Map hover handler — resolve feature to cell
  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const h3Index = e.features[0].properties?.h3Index as string;
      const cell = cellMap.get(h3Index);
      if (cell) {
        setHoveredCell(cell);
        setHoverLngLat({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        if (mapRef.current) {
          mapRef.current.getMap().getCanvas().style.cursor = level !== 'community' ? 'pointer' : 'default';
        }
      }
    }
  }, [cellMap, level]);

  const onMouseLeave = useCallback(() => {
    setHoveredCell(null);
    setHoverLngLat(null);
    if (mapRef.current) {
      mapRef.current.getMap().getCanvas().style.cursor = '';
    }
  }, []);

  // Click handler — drill down one scope level
  const onClick = useCallback((e: MapLayerMouseEvent) => {
    if (level === 'community') return;
    if (!e.features || e.features.length === 0) return;

    const h3Index = e.features[0].properties?.h3Index as string;
    const cell = cellMap.get(h3Index);
    if (!cell) return;

    const primaryName = cell.neighborhoodName.split(',')[0].trim();
    const neighborhood = NEIGHBORHOODS.find(n => n.name === primaryName);
    if (!neighborhood) return;

    let childSlug: string;
    if (level === 'market') {
      childSlug = neighborhood.region;
    } else if (level === 'region') {
      childSlug = neighborhood.zipCodes[0];
    } else {
      childSlug = neighborhood.id;
    }

    const childUrl = `${scope.getUrl()}/${childSlug}`;
    navigate(rewriteUrl(childUrl));
  }, [level, scope, navigate, cellMap]);

  // Drill down from rankings panel by neighborhood name
  const onDrilldownNeighborhood = useCallback((neighborhoodName: string) => {
    if (level === 'community') return;
    const neighborhood = NEIGHBORHOODS.find(n => n.name === neighborhoodName);
    if (!neighborhood) return;

    let childSlug: string;
    if (level === 'market') {
      childSlug = neighborhood.region;
    } else if (level === 'region') {
      childSlug = neighborhood.zipCodes[0];
    } else {
      childSlug = neighborhood.id;
    }

    const childUrl = `${scope.getUrl()}/${childSlug}`;
    navigate(rewriteUrl(childUrl));
  }, [level, scope, navigate]);

  const content = (
    <div className="border border-white/10 rounded-sm overflow-hidden bg-[#0C1C2E] relative z-0">

      {/* ── Header Bar ────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">

        {/* Left: Breadcrumb / Scope */}
        <div className="flex items-center gap-2">
          <MapIcon size={14} className="text-[#Bfa67a] shrink-0" />
          <div className="flex items-center">
            {scopeCrumbs.map((crumb, i) => {
              const isLast = i === scopeCrumbs.length - 1;
              return (
                <span key={crumb.url} className="flex items-center">
                  {i > 0 && <ChevronRight size={10} className="text-white/15 mx-1.5" />}
                  {isLast ? (
                    <span className="text-[10px] uppercase tracking-widest text-[#Bfa67a] font-bold">
                      {crumb.label}
                    </span>
                  ) : (
                    <button
                      onClick={() => navigate(crumb.url)}
                      className="text-[10px] uppercase tracking-widest text-white/40 font-bold hover:text-white transition-colors"
                    >
                      {crumb.label}
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* Right: scope label */}
        <span className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-bold">
          Hexagonal Heatmap
        </span>
      </div>

      {/* ── Body: Full-bleed map with panel overlay ──── */}
      <div className="relative aspect-square lg:aspect-[2/1]">
        {/* Map fills entire background */}
        <div className="absolute inset-0">
          <MapGL
            ref={mapRef}
            initialViewState={{
              longitude: HEATMAP_CENTER[1],
              latitude: HEATMAP_CENTER[0],
              zoom: 9,
            }}
            mapStyle={MAP_STYLE.dark}
            style={{ width: '100%', height: '100%', background: '#002349' }}
            scrollZoom={false}
            interactiveLayerIds={['hexagons-fill']}
            onLoad={fitMapToBounds}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
          >
            <HexagonLayer
              cells={cells}
              min={min}
              max={max}
              colorScale={metricDef.colorScale}
              metricDef={metricDef}
              hoveredIndex={hoveredCell?.h3Index ?? null}
            />

            {/* Tooltip popup on hover */}
            {hoveredCell && hoverLngLat && (
              <Popup
                longitude={hoverLngLat.lng}
                latitude={hoverLngLat.lat}
                anchor="bottom"
                closeButton={false}
                closeOnClick={false}
                offset={10}
              >
                <div style={{ fontSize: 11, lineHeight: 1.4, padding: '4px 8px' }}>
                  <strong>{hoveredCell.neighborhoodName}</strong><br />
                  {metricDef.label}: {metricDef.format(hoveredCell.value)}
                </div>
              </Popup>
            )}
          </MapGL>
          <HeatmapLegend metricDef={metricDef} min={min} max={max} />
        </div>

        {/* Panel overlays on the left */}
        <div className="hidden lg:flex absolute inset-y-0 left-0 w-1/2 flex-col overflow-y-auto overflow-x-hidden z-[500] pointer-events-auto">
          <HexDetailPanel
            hoveredCell={hoveredCell}
            metric={metric}
            metricDef={metricDef}
            min={min}
            max={max}
            cells={cells}
            onHoverCell={onHoverCell}
            onMetricChange={setMetric}
            onDrilldown={level !== 'community' ? onDrilldownNeighborhood : undefined}
          />
        </div>
      </div>
    </div>
  );

  return content;
};

export default H3HeatmapSection;
