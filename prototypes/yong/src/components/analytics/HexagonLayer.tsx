/**
 * Leaflet layer that renders H3 hex polygons.
 * Uses useMap() + L.layerGroup() to manage polygons imperatively.
 * Fires onHoverCell callback for external detail panel.
 * Fires onClickCell callback for scope drill-down navigation.
 */

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { HexCell, HeatmapMetricDef, ColorScaleType } from '../../data/h3HeatmapData';
import { getColor } from '../../data/h3HeatmapData';

interface HexagonLayerProps {
  cells: HexCell[];
  min: number;
  max: number;
  colorScale: ColorScaleType;
  metricDef: HeatmapMetricDef;
  onHoverCell?: (cell: HexCell | null) => void;
  onClickCell?: (cell: HexCell) => void;
  /** h3Index to highlight from external sources (e.g. panel hover) */
  externalHighlight?: string | null;
}

const highlightStyle = { fillOpacity: 0.7, weight: 3, color: '#FFFFFF', opacity: 1 };

const HexagonLayer: React.FC<HexagonLayerProps> = ({
  cells,
  min,
  max,
  colorScale,
  metricDef,
  onHoverCell,
  onClickCell,
  externalHighlight,
}) => {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const activePolygonRef = useRef<L.Polygon | null>(null);
  const polygonMapRef = useRef<Map<string, L.Polygon>>(new Map());
  /** Track whether highlight was set by Leaflet mouse events (true) or external (false) */
  const highlightFromMapRef = useRef(false);

  const defaultStyle = {
    fillOpacity: 0.7,
    weight: 1,
    color: 'rgba(255,255,255,0.15)',
    opacity: 0.6,
  };

  useEffect(() => {
    // Clear previous
    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
      map.removeLayer(layerGroupRef.current);
    }
    activePolygonRef.current = null;
    polygonMapRef.current.clear();

    const group = L.layerGroup();
    layerGroupRef.current = group;

    for (const cell of cells) {
      const fillColor = getColor(cell.value, min, max, colorScale);
      const latLngs = cell.boundary.map(([lat, lng]) => [lat, lng] as L.LatLngTuple);

      const polygon = L.polygon(latLngs, {
        fillColor,
        ...defaultStyle,
      });

      polygonMapRef.current.set(cell.h3Index, polygon);

      polygon.bindTooltip(
        `<div style="font-size:11px;line-height:1.4">
          <strong>${cell.neighborhoodName}</strong><br/>
          ${metricDef.label}: ${metricDef.format(cell.value)}
        </div>`,
        { sticky: true, className: 'h3-tooltip' },
      );

      polygon.on('mouseover', () => {
        // Reset previous highlight before setting new one
        if (activePolygonRef.current && activePolygonRef.current !== polygon) {
          activePolygonRef.current.setStyle(defaultStyle);
        }
        activePolygonRef.current = polygon;
        highlightFromMapRef.current = true;
        polygon.setStyle(highlightStyle);
        polygon.bringToFront();
        onHoverCell?.(cell);
        if (onClickCell) {
          const el = polygon.getElement();
          if (el) el.style.cursor = 'pointer';
        }
      });
      polygon.on('mouseout', () => {
        polygon.setStyle(defaultStyle);
        if (activePolygonRef.current === polygon) {
          activePolygonRef.current = null;
        }
        highlightFromMapRef.current = false;
        onHoverCell?.(null);
      });
      polygon.on('click', () => {
        onClickCell?.(cell);
      });

      group.addLayer(polygon);
    }

    group.addTo(map);

    // Also clear highlight when mouse leaves the map entirely
    const clearHighlight = () => {
      if (activePolygonRef.current) {
        activePolygonRef.current.setStyle(defaultStyle);
        activePolygonRef.current = null;
        highlightFromMapRef.current = false;
        onHoverCell?.(null);
      }
    };
    map.on('mouseout', clearHighlight);

    return () => {
      map.off('mouseout', clearHighlight);
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
        map.removeLayer(layerGroupRef.current);
      }
      activePolygonRef.current = null;
      polygonMapRef.current.clear();
    };
  }, [cells, min, max, colorScale, metricDef, map, onHoverCell, onClickCell]);

  // Sync external highlight (from panel hover) to map polygons
  useEffect(() => {
    // Don't override map's own mouse-driven highlights
    if (highlightFromMapRef.current) return;

    // Reset previous external highlight
    if (activePolygonRef.current) {
      activePolygonRef.current.setStyle(defaultStyle);
      activePolygonRef.current = null;
    }

    if (!externalHighlight) return;

    const polygon = polygonMapRef.current.get(externalHighlight);
    if (!polygon) return;

    polygon.setStyle(highlightStyle);
    polygon.bringToFront();
    activePolygonRef.current = polygon;
  }, [externalHighlight]);

  return null;
};

export default HexagonLayer;
