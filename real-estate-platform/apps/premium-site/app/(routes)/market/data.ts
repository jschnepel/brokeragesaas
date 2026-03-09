/**
 * Market Analytics Data Layer
 * Server-side data fetching for market pages.
 * All queries hit RDS materialized views.
 */

import {
  getMarketPulseMonthly,
  getPriceBands,
  getSupplyDemand,
  getInventoryAge,
  getCommunityScorecard,
  getCommunityRankings,
  getHeatmapPoints,
  getAvailableLocations,
  getPortfolioTrends,
  getFeaturePriceImpact,
} from '@platform/database';
import type {
  GeoFilter,
  PortfolioFilter,
  PortfolioTrendRow,
  MarketPulseRow,
  PriceBandRow,
  SupplyDemandRow,
  InventoryAgeRow,
  CommunityScorecard,
  HeatmapPoint,
  MarketPulseKpis,
} from '@platform/shared';

// ── KPI Computation ─────────────────────────────────

export function computeKpis(pulseRows: MarketPulseRow[]): MarketPulseKpis {
  const activeRows = pulseRows.filter(r => r.status === 'Active' || r.status === 'Active Under Contract');
  const closedRows = pulseRows.filter(r => r.status === 'Closed');

  // Use the most recent 3 months of active data to handle thin/stale data
  const recentActiveMonths = [...new Set(activeRows.map(r => r.month))].sort().slice(-3);
  const recentActiveRows = activeRows.filter(r => recentActiveMonths.includes(r.month));
  const totalActiveCount = recentActiveRows.reduce((sum, r) => sum + r.listingCount, 0);

  // Weighted average across recent active months
  function weightedAvg(rows: MarketPulseRow[], getter: (r: MarketPulseRow) => number): number {
    const validRows = rows.filter(r => getter(r) > 0);
    if (validRows.length === 0) return 0;
    const totalWeight = validRows.reduce((sum, r) => sum + r.listingCount, 0);
    if (totalWeight === 0) return 0;
    return validRows.reduce((sum, r) => sum + getter(r) * r.listingCount, 0) / totalWeight;
  }

  // Last 3 months closings for absorption rate
  const recentClosedMonths = [...new Set(closedRows.map(r => r.month))].sort().slice(-3);
  const recentClosedRows = closedRows.filter(r => recentClosedMonths.includes(r.month));
  const totalClosings = recentClosedRows.reduce((sum, r) => sum + r.listingCount, 0);
  const monthlyClosings = recentClosedMonths.length > 0 ? totalClosings / recentClosedMonths.length : 0;

  const monthsOfSupply = monthlyClosings > 0 ? totalActiveCount / monthlyClosings : 0;

  // Decide price source: active data if we have enough, else fall back to recent closings
  const hasEnoughActive = totalActiveCount >= 10;

  let medianPrice: number;
  let medianPricePerSqft: number;
  let medianDom: number;
  let minPrice: number;
  let maxPrice: number;

  if (hasEnoughActive) {
    medianPrice = weightedAvg(recentActiveRows, r => r.medianListPrice);
    medianPricePerSqft = weightedAvg(recentActiveRows, r => r.medianPricePerSqft);
    medianDom = Math.round(weightedAvg(recentActiveRows, r => r.medianDom));
    minPrice = Math.min(...recentActiveRows.filter(r => r.minPrice > 0).map(r => r.minPrice));
    maxPrice = Math.max(...recentActiveRows.map(r => r.maxPrice));
  } else {
    // Fall back to recent closings (last 6 months for better coverage)
    const fallbackMonths = [...new Set(closedRows.map(r => r.month))].sort().slice(-6);
    const fallbackRows = closedRows.filter(r => fallbackMonths.includes(r.month));
    medianPrice = weightedAvg(fallbackRows, r => r.medianClosePrice);
    medianPricePerSqft = weightedAvg(fallbackRows, r => r.medianClosePricePerSqft);
    medianDom = Math.round(weightedAvg(fallbackRows, r => r.medianDom));
    minPrice = Math.min(...fallbackRows.filter(r => r.minPrice > 0).map(r => r.minPrice));
    maxPrice = Math.max(...fallbackRows.map(r => r.maxPrice));
  }

  // Handle edge case when Math.min/max get empty arrays
  if (!isFinite(minPrice)) minPrice = 0;
  if (!isFinite(maxPrice)) maxPrice = 0;

  // Close-to-list ratio from all valid closed rows
  const closedWithPrices = closedRows.filter(r => r.medianClosePrice > 0 && r.medianListPrice > 0);
  const avgCloseToList = closedWithPrices.length > 0
    ? closedWithPrices.reduce((sum, r) => sum + (r.medianClosePrice / r.medianListPrice) * r.listingCount, 0)
      / closedWithPrices.reduce((sum, r) => sum + r.listingCount, 0)
    : 0;

  return {
    medianPrice,
    medianPricePerSqft,
    medianDom,
    activeInventory: totalActiveCount,
    monthsOfSupply: Math.round(monthsOfSupply * 10) / 10,
    absorptionRate: monthlyClosings > 0 ? Math.round((monthlyClosings / Math.max(totalActiveCount, 1)) * 1000) / 10 : 0,
    avgCloseToListRatio: Math.round(avgCloseToList * 10000) / 100,
    minPrice,
    maxPrice,
  };
}

// ── Data Period (for ARMLS attribution) ─────────────

export function getDataPeriod(pulseRows: MarketPulseRow[]): { start: string; end: string } {
  if (pulseRows.length === 0) {
    const now = new Date().toISOString();
    return { start: now, end: now };
  }
  const months = pulseRows.map(r => r.month).sort();
  return { start: months[0], end: months[months.length - 1] };
}

// ── Re-export query functions for pages ─────────────

export {
  getMarketPulseMonthly,
  getPriceBands,
  getSupplyDemand,
  getInventoryAge,
  getCommunityScorecard,
  getCommunityRankings,
  getHeatmapPoints,
  getAvailableLocations,
  getPortfolioTrends,
  getFeaturePriceImpact,
};

export type {
  GeoFilter,
  PortfolioFilter,
  PortfolioTrendRow,
  MarketPulseRow,
  PriceBandRow,
  SupplyDemandRow,
  InventoryAgeRow,
  CommunityScorecard,
  HeatmapPoint,
  MarketPulseKpis,
};
