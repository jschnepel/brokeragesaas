'use client';

/**
 * MapLibre layer rendering H3 hex polygons as GeoJSON.
 * Ported from prototypes/yong with design token compliance.
 */

import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { FillLayerSpecification, LineLayerSpecification } from 'maplibre-gl';
import type { FeatureCollection, Feature, Polygon } from 'geojson';
import type { HexCell } from './types';
import { getColor } from './types';

export interface HexagonLayerProps {
  cells: HexCell[];
  min: number;
  max: number;
  hoveredIndex: string | null;
}

export function HexagonLayer({ cells, min, max, hoveredIndex }: HexagonLayerProps) {
  const geojson = useMemo<FeatureCollection<Polygon>>(() => {
    const features: Feature<Polygon>[] = cells.map(cell => {
      const fillColor = getColor(cell.value, min, max);
      // Convert [lat, lng] boundary to GeoJSON [lng, lat] ring (must close)
      const ring = cell.boundary.map(([lat, lng]) => [lng, lat]);
      if (ring.length > 0) ring.push(ring[0]);

      return {
        type: 'Feature',
        id: cell.h3Index,
        properties: {
          h3Index: cell.h3Index,
          fillColor,
          neighborhoodName: cell.neighborhoodName,
          value: cell.value,
        },
        geometry: { type: 'Polygon', coordinates: [ring] },
      };
    });

    return { type: 'FeatureCollection', features };
  }, [cells, min, max]);

  const fillPaint: FillLayerSpecification['paint'] = {
    'fill-color': ['get', 'fillColor'],
    'fill-opacity': [
      'case',
      ['==', ['get', 'h3Index'], hoveredIndex ?? ''],
      0.85,
      0.7,
    ],
  };

  const linePaint: LineLayerSpecification['paint'] = {
    'line-color': [
      'case',
      ['==', ['get', 'h3Index'], hoveredIndex ?? ''],
      '#FFFFFF',
      'rgba(255,255,255,0.15)',
    ],
    'line-width': [
      'case',
      ['==', ['get', 'h3Index'], hoveredIndex ?? ''],
      3,
      1,
    ],
    'line-opacity': [
      'case',
      ['==', ['get', 'h3Index'], hoveredIndex ?? ''],
      1,
      0.6,
    ],
  };

  return (
    <Source id="hexagons" type="geojson" data={geojson}>
      <Layer id="hexagons-fill" type="fill" paint={fillPaint} />
      <Layer id="hexagons-line" type="line" paint={linePaint} />
    </Source>
  );
}
