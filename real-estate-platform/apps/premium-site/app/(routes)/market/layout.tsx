/**
 * /market layout — opt-out of build-time pre-rendering.
 *
 * /market depends on a family of materialized views (mv_market_pulse_monthly,
 * mv_supply_demand_monthly, mv_price_band_distribution, mv_*_by_area, etc.)
 * that were dropped in migration 023. Until /market is rewritten against
 * phoenix-analytics.ts (which uses the live mv_* schema with scope dimensions),
 * the pages render at request time and the data layer's `tryRdsQuery` returns
 * empty arrays for the missing relations — pages render an empty state instead
 * of failing the build.
 *
 * Remove this file once /market is migrated to phoenix-analytics.ts.
 */

export const dynamic = 'force-dynamic';

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
