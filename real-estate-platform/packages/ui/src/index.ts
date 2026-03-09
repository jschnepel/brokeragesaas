// Core components
export { Button } from './Button';
export { PropertyCard } from './PropertyCard';
export { ContactForm } from './ContactForm';

// Variant components
export { GeoJSONMap } from './variants/GeoJSONMap';
export { DropdownMenu } from './variants/DropdownMenu';
export { getVariantComponent } from './variants/registry';

// Analytics components
export { KpiCard } from './components/KpiCard';
export type { KpiCardProps } from './components/KpiCard';
export { KpiCardRow } from './components/KpiCardRow';
export type { KpiCardRowProps } from './components/KpiCardRow';
export { AnalyticsLineChart } from './components/AnalyticsLineChart';
export type { AnalyticsLineChartProps, AnalyticsLineChartSeries, AnalyticsLineChartBar, TimeRangeId } from './components/AnalyticsLineChart';
export { AnalyticsBarChart } from './components/AnalyticsBarChart';
export type { AnalyticsBarChartProps } from './components/AnalyticsBarChart';
export { PriceBandHistogram } from './components/PriceBandHistogram';
export type { PriceBandHistogramProps, PriceBandData } from './components/PriceBandHistogram';
export { ArmlsAttribution } from './components/ArmlsAttribution';
export type { ArmlsAttributionProps } from './components/ArmlsAttribution';

// Heatmap components
export { H3Heatmap } from './components/heatmap';
export type { H3HeatmapProps } from './components/heatmap';
export { HexagonLayer, HeatmapLegend, HexDetailPanel, MapMetricSwitcher } from './components/heatmap';
export { METRIC_DEFS, getMetricDef, getColor, getGradientCss } from './components/heatmap';
