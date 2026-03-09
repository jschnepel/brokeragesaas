'use client';

/**
 * H3 Hexagonal Heatmap — Main orchestrator component.
 * Full-bleed map background with detail panel overlay.
 * Ported from prototypes/yong — adapted for Next.js App Router.
 *
 * @compliance ARMLS Section 21.1 — Aggregate statistical display (permitted).
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import MapGL, { Popup } from 'react-map-gl/maplibre';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import type { LngLatBoundsLike } from 'maplibre-gl';
import { Map as MapIcon } from 'lucide-react';
import { HexagonLayer } from './HexagonLayer';
import { HeatmapLegend } from './HeatmapLegend';
import { HexDetailPanel } from './HexDetailPanel';
import type { HexCell, HeatmapMetricId } from './types';
import { getMetricDef } from './types';

import 'maplibre-gl/dist/maplibre-gl.css';

export interface H3HeatmapProps {
  agentId: string;
  className?: string;
  cells: HexCell[];
  defaultMetric?: HeatmapMetricId;
  mapTilerKey: string;
  onCellClick?: (cell: HexCell) => void;
}

const PHOENIX_CENTER: [number, number] = [33.52, -111.89];

function computeBounds(cells: HexCell[]): [[number, number], [number, number]] | null {
  if (cells.length === 0) return null;
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  for (const cell of cells) {
    for (const [lat, lng] of cell.boundary) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
  }
  return [[minLat, minLng], [maxLat, maxLng]];
}

export function H3Heatmap({
  className = '',
  cells,
  defaultMetric = 'ppsf',
  mapTilerKey,
  onCellClick,
}: H3HeatmapProps) {
  const mapRef = useRef<MapRef>(null);
  const [metric, setMetric] = useState<HeatmapMetricId>(defaultMetric);
  const [hoveredCell, setHoveredCell] = useState<HexCell | null>(null);
  const [hoverLngLat, setHoverLngLat] = useState<{ lng: number; lat: number } | null>(null);
  const [drillCity, setDrillCity] = useState<string | null>(null);

  const metricDef = getMetricDef(metric);

  // Re-derive cell values for active metric
  const metricCells = useMemo(() => {
    return cells.map(c => ({
      ...c,
      value: metric === 'density' ? c.count : c.metrics[metric],
    }));
  }, [cells, metric]);

  // Visible cells: all cells or filtered by drill-down city
  const visibleCells = useMemo(() => {
    if (!drillCity) return metricCells;
    return metricCells.filter(c => c.city === drillCity);
  }, [metricCells, drillCity]);

  // Min/max for color scale
  const { min, max } = useMemo(() => {
    let min = Infinity, max = -Infinity;
    for (const c of visibleCells) {
      if (c.value < min) min = c.value;
      if (c.value > max) max = c.value;
    }
    if (!isFinite(min)) { min = 0; max = 1; }
    return { min, max };
  }, [visibleCells]);

  const bounds = useMemo(() => computeBounds(visibleCells), [visibleCells]);

  const cellMap = useMemo(() => {
    const m = new Map<string, HexCell>();
    for (const cell of visibleCells) m.set(cell.h3Index, cell);
    return m;
  }, [visibleCells]);

  const fitMapToBounds = useCallback(() => {
    if (!bounds || !mapRef.current) return;
    const map = mapRef.current.getMap();
    const container = map.getContainer();
    const panelWidth = container.offsetWidth * 0.5;

    const mlBounds: LngLatBoundsLike = [
      [bounds[0][1], bounds[0][0]],
      [bounds[1][1], bounds[1][0]],
    ];

    try {
      map.fitBounds(mlBounds, {
        padding: { top: 20, right: 20, bottom: 20, left: panelWidth },
        maxZoom: 15,
        animate: !!drillCity,
        duration: 600,
      });
    } catch { /* single-point scopes */ }
  }, [bounds, drillCity]);

  useEffect(() => { fitMapToBounds(); }, [fitMapToBounds]);

  const handleDrillToCity = useCallback((city: string) => {
    setDrillCity(city);
    setHoveredCell(null);
  }, []);

  const handleDrillBack = useCallback(() => {
    setDrillCity(null);
    setHoveredCell(null);
  }, []);

  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const h3Index = e.features[0].properties?.h3Index as string;
      const cell = cellMap.get(h3Index);
      if (cell) {
        setHoveredCell(cell);
        setHoverLngLat({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        if (mapRef.current) {
          mapRef.current.getMap().getCanvas().style.cursor = 'pointer';
        }
      }
    }
  }, [cellMap]);

  const onMouseLeave = useCallback(() => {
    setHoveredCell(null);
    setHoverLngLat(null);
    if (mapRef.current) mapRef.current.getMap().getCanvas().style.cursor = '';
  }, []);

  const onClick = useCallback((e: MapLayerMouseEvent) => {
    if (!e.features || e.features.length === 0) return;
    const h3Index = e.features[0].properties?.h3Index as string;
    const cell = cellMap.get(h3Index);
    if (!cell) return;

    if (!drillCity) {
      handleDrillToCity(cell.city);
    } else if (onCellClick) {
      onCellClick(cell);
    }
  }, [cellMap, drillCity, handleDrillToCity, onCellClick]);

  const mapStyle = `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${mapTilerKey}`;

  return (
    <div className={`border border-white/10 rounded-sm overflow-hidden bg-navy relative z-0 ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MapIcon size={14} className="text-gold shrink-0" />
          <span className="text-[10px] uppercase tracking-widest text-gold font-bold">
            Market Heatmap
          </span>
        </div>
        <span className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-bold">
          Hexagonal Heatmap
        </span>
      </div>

      {/* Body: Full-bleed map with panel overlay */}
      <div style={{ position: 'relative', aspectRatio: '2 / 1' }}>
        <div className="absolute inset-0">
          <MapGL
            ref={mapRef}
            initialViewState={{
              longitude: PHOENIX_CENTER[1],
              latitude: PHOENIX_CENTER[0],
              zoom: 9,
            }}
            mapStyle={mapStyle}
            style={{ width: '100%', height: '100%', background: '#002349' }}
            scrollZoom={false}
            interactiveLayerIds={['hexagons-fill']}
            onLoad={fitMapToBounds}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
          >
            <HexagonLayer
              cells={visibleCells}
              min={min}
              max={max}
              hoveredIndex={hoveredCell?.h3Index ?? null}
            />

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
                  <strong>{hoveredCell.neighborhoodName}</strong>
                  {hoveredCell.city && <span style={{ opacity: 0.6 }}> · {hoveredCell.city}</span>}
                  <br />
                  {metricDef.label}: {metricDef.format(hoveredCell.value)}
                </div>
              </Popup>
            )}
          </MapGL>
          <HeatmapLegend metricDef={metricDef} min={min} max={max} />
        </div>

        {/* Panel overlay on the left */}
        <div className="hidden lg:flex flex-col overflow-hidden" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', zIndex: 500, pointerEvents: 'auto' }}>
          <HexDetailPanel
            hoveredCell={hoveredCell}
            metric={metric}
            metricDef={metricDef}
            min={min}
            max={max}
            cells={visibleCells}
            allCells={metricCells}
            drillCity={drillCity}
            onHoverCell={setHoveredCell}
            onMetricChange={setMetric}
            onDrillToCity={handleDrillToCity}
            onDrillBack={handleDrillBack}
          />
        </div>
      </div>
    </div>
  );
}
