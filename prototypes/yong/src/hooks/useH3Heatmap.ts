/**
 * Scope-aware hook for H3 hexagonal heatmap data.
 * Filters neighborhoods, picks resolution, and memoizes hex generation.
 */

import { useMemo } from 'react';
import type { ScopeLevel } from '../models/types';
import type { MarketScope } from '../models/MarketScope';
import {
  generateHexCells,
  filterNeighborhoods,
  computeBounds,
  getMetricDef,
  type HeatmapMetricId,
  type HexCell,
  type HeatmapMetricDef,
} from '../data/h3HeatmapData';

interface UseH3HeatmapResult {
  cells: HexCell[];
  bounds: [[number, number], [number, number]] | null;
  min: number;
  max: number;
  metricDef: HeatmapMetricDef;
}

function getScopeSlug(scope: MarketScope, level: ScopeLevel): string | undefined {
  if (level === 'market') return undefined;
  // The scope's slug identifies the region/zipcode/community
  return scope.slug;
}

function getResolution(level: ScopeLevel): number {
  return level === 'market' ? 7 : 8;
}

export function useH3Heatmap(
  scope: MarketScope,
  level: ScopeLevel,
  metric: HeatmapMetricId,
): UseH3HeatmapResult {
  return useMemo(() => {
    const resolution = getResolution(level);
    const slug = getScopeSlug(scope, level);
    const neighborhoods = filterNeighborhoods(level, slug);
    const metricDef = getMetricDef(metric);

    const cells = generateHexCells(neighborhoods, resolution, metric);
    const bounds = computeBounds(cells);

    let min = Infinity;
    let max = -Infinity;
    for (const c of cells) {
      if (c.value < min) min = c.value;
      if (c.value > max) max = c.value;
    }
    if (!isFinite(min)) { min = 0; max = 1; }

    return { cells, bounds, min, max, metricDef };
  }, [scope, level, metric]);
}
