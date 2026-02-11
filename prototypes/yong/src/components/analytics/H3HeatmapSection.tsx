/**
 * H3 Hexagonal Heatmap Section — containerized layout.
 * Header: breadcrumb (left) + metric switcher (right).
 * Body: MapContainer + HexagonLayer (left) + HexDetailPanel (right).
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Map as MapIcon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import type { MarketScope } from '../../models/MarketScope';
import type { ScopeLevel } from '../../models/types';
import type { HeatmapMetricId, HexCell } from '../../data/h3HeatmapData';
import { getMetricDef } from '../../data/h3HeatmapData';
import { NEIGHBORHOODS } from '../../data/neighborhoods';
import { MAP_STYLE } from '../../data/phoenixLuxuryZones';

const HEATMAP_CENTER: [number, number] = [33.66, -111.89];
import { useH3Heatmap } from '../../hooks/useH3Heatmap';
import HexagonLayer from './HexagonLayer';
import HeatmapLegend from './HeatmapLegend';
import MapMetricSwitcher from './MapMetricSwitcher';
import HexDetailPanel from './HexDetailPanel';
import VOWGate from '../compliance/VOWGate';

interface H3HeatmapSectionProps {
  scope: MarketScope;
  level: ScopeLevel;
  defaultMetric: HeatmapMetricId;
}

// Fit map tightly to hex cell bounds on mount + data change
const MapBoundsController: React.FC<{
  bounds: [[number, number], [number, number]] | null;
}> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    try {
      map.fitBounds(bounds, { padding: [0, 0], maxZoom: 15, animate: false });
    } catch { /* single-point scopes */ }
  }, [bounds, map]);
  return null;
};

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
  const [metric, setMetric] = useState<HeatmapMetricId>(defaultMetric);
  const [hoveredCell, setHoveredCell] = useState<HexCell | null>(null);
  const currentDef = getMetricDef(metric);
  const isVowMetric = currentDef.isVow;

  const { cells, bounds, min, max, metricDef } = useH3Heatmap(scope, level, metric);

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

  // Drill down one scope level when a hex cell is clicked
  const onClickCell = useCallback((cell: HexCell) => {
    if (level === 'community') return;

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
  }, [level, scope, navigate]);

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
    <div className="border border-white/10 rounded-sm overflow-hidden bg-[#0C1C2E]">

      {/* ── Header Bar ────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">

        {/* Left: Breadcrumb / Scope */}
        <div className="flex items-center gap-2">
          <MapIcon size={14} className="text-[#Bfa67a] shrink-0" />
          {scopeCrumbs.length > 1 ? (
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
          ) : (
            <span className="text-[10px] uppercase tracking-widest text-[#Bfa67a] font-bold">
              Hexagonal Heatmap
            </span>
          )}
        </div>

        {/* Right: Metric Switcher */}
        <MapMetricSwitcher current={metric} onChange={setMetric} />
      </div>

      {/* ── Body: Map + Panel ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Map */}
        <div className="relative aspect-square">
          <MapContainer
            center={HEATMAP_CENTER}
            zoom={12}
            scrollWheelZoom={false}
            className="h-full w-full"
            style={{ background: '#002349' }}
          >
            <TileLayer
              url={MAP_STYLE.dark}
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            <HexagonLayer
              cells={cells}
              min={min}
              max={max}
              colorScale={metricDef.colorScale}
              metricDef={metricDef}
              onHoverCell={onHoverCell}
              onClickCell={level !== 'community' ? onClickCell : undefined}
              externalHighlight={hoveredCell?.h3Index ?? null}
            />
            <MapBoundsController bounds={bounds} />
          </MapContainer>
          <HeatmapLegend metricDef={metricDef} min={min} max={max} />
        </div>

        {/* Right: Detail Panel */}
        <div className="hidden lg:flex flex-col aspect-square overflow-y-auto">
          <HexDetailPanel
            hoveredCell={hoveredCell}
            metric={metric}
            metricDef={metricDef}
            min={min}
            max={max}
            cells={cells}
            onHoverCell={onHoverCell}
            onDrilldown={level !== 'community' ? onDrilldownNeighborhood : undefined}
          />
        </div>
      </div>
    </div>
  );

  if (isVowMetric) {
    return <VOWGate>{content}</VOWGate>;
  }

  return content;
};

export default H3HeatmapSection;
