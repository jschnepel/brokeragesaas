# Analytics Data Quality & Best Practices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Phoenix analytics dashboard resilient to thin/incomplete data by adding sample-size gating, fixing time-window calculations, correcting formatter bugs, and displaying data-confidence indicators — based on Redfin/Zillow/Case-Shiller industry methodology.

**Architecture:** Three-layer defense: (1) MVs store `sample_count` alongside every metric, (2) TypeScript query layer gates metrics by sample thresholds and uses trailing-complete-month windows, (3) UI renders three confidence tiers (full / low / suppressed). The MV rebuild script and the query module are the two primary change targets.

**Tech Stack:** PostgreSQL MVs (RDS), TypeScript query layer (`@platform/database`), React/Next.js UI components (premium-site), Recharts charting.

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `packages/shared/src/analytics-confidence.ts` | Shared confidence thresholds, tier calculation, YoY reliability check |

### Modified Files
| File | Changes |
|------|---------|
| `scripts/rebuild-analytics-mvs.js` | Add `sample_count`/`closed_count` to mv_absorption, mv_negotiation; fix mv_dashboard time windows; implement yoy_inventory_change; add future-date filter |
| `packages/database/src/queries/phoenix-analytics.ts` | Import confidence utilities; gate KPIs/YoY by sample count; fix List/Sale Ratio formatter; use trailing-complete-month for dashboard fallback; add `sampleCount` + `confidence` to KPI output |
| `apps/premium-site/app/(routes)/phoenix/types.ts` | Extend `KpiMetric` with optional `sampleCount` and `confidence` fields |
| `apps/premium-site/app/(routes)/phoenix/components/cards/HeroKpiCard.tsx` | Render suppressed ("--") and low-confidence states |
| `apps/premium-site/app/(routes)/phoenix/components/layout/SecondaryKpiBar.tsx` | Same confidence rendering |
| `apps/premium-site/app/(routes)/phoenix/components/layout/DashboardHero.tsx` | Add "Data through [Month Year]" header |
| `scripts/rebuild-analytics-base.js` | Add future close_date filter |
| `packages/shared/src/index.ts` | Re-export analytics-confidence module |
| `packages/database/src/index.ts` | Re-export confidence types if needed |

---

## Task 1: Confidence Thresholds Module

**Files:**
- Create: `packages/shared/src/analytics-confidence.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create the confidence module**

```typescript
// packages/shared/src/analytics-confidence.ts

/**
 * Analytics data confidence thresholds.
 *
 * Based on industry standards (Redfin, Zillow, Case-Shiller methodology)
 * and statistical literature on median reliability.
 *
 * n < 20:  Suppress entirely — median unreliable
 * n 20-49: Low confidence — show with caveat
 * n >= 50: Full confidence
 */

export const SAMPLE_THRESHOLDS = {
  /** Below this: suppress metric, show "--" */
  SUPPRESS: 20,
  /** Below this: show with low-confidence styling */
  LOW_CONFIDENCE: 50,
} as const;

export const YOY_THRESHOLDS = {
  /** Both periods must have at least this many observations */
  MIN_BOTH_PERIODS: 30,
  /** Smaller period must be at least this fraction of larger */
  MIN_RATIO: 0.2,
} as const;

export type ConfidenceLevel = 'high' | 'low' | 'suppressed';

export function getConfidence(sampleCount: number): ConfidenceLevel {
  if (sampleCount < SAMPLE_THRESHOLDS.SUPPRESS) return 'suppressed';
  if (sampleCount < SAMPLE_THRESHOLDS.LOW_CONFIDENCE) return 'low';
  return 'high';
}

export function isYoyReliable(currentN: number, priorN: number): boolean {
  if (currentN < YOY_THRESHOLDS.MIN_BOTH_PERIODS) return false;
  if (priorN < YOY_THRESHOLDS.MIN_BOTH_PERIODS) return false;
  const ratio = Math.min(currentN, priorN) / Math.max(currentN, priorN);
  return ratio >= YOY_THRESHOLDS.MIN_RATIO;
}

/**
 * Returns the last fully-elapsed calendar month as "March 2026" format.
 * Used for "Data through [Month Year]" display.
 */
export function getLastCompleteMonthLabel(): string {
  const now = new Date();
  const prior = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const months = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  return `${months[prior.getUTCMonth()]} ${prior.getUTCFullYear()}`;
}
```

- [ ] **Step 2: Export from shared package barrel**

Add to `packages/shared/src/index.ts`:

```typescript
export {
  SAMPLE_THRESHOLDS,
  YOY_THRESHOLDS,
  getConfidence,
  isYoyReliable,
  getLastCompleteMonthLabel,
} from './analytics-confidence';
export type { ConfidenceLevel } from './analytics-confidence';
```

- [ ] **Step 3: Verify package compiles**

Run: `cd real-estate-platform && pnpm --filter @platform/shared exec tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/analytics-confidence.ts packages/shared/src/index.ts
git commit -m "feat(shared): add analytics confidence thresholds module"
```

---

## Task 2: Extend KpiMetric Type

**Files:**
- Modify: `apps/premium-site/app/(routes)/phoenix/types.ts`

- [ ] **Step 1: Add confidence fields to KpiMetric**

In `types.ts`, update the `KpiMetric` interface:

```typescript
// BEFORE (line 10):
export interface KpiMetric {
  label: string;
  value: string;
  change: number;
  sparkData?: number[];
}

// AFTER:
export interface KpiMetric {
  label: string;
  value: string;
  change: number;
  sparkData?: number[];
  sampleCount?: number;
  confidence?: 'high' | 'low' | 'suppressed';
}
```

These fields are optional for backward compatibility — existing mock data and tests won't break. When `confidence` is undefined, components render normally (full confidence assumed).

- [ ] **Step 2: Type-check**

Run: `cd real-estate-platform && pnpm --filter @real-estate/premium-site exec tsc --noEmit`
Expected: 0 errors (fields are optional)

- [ ] **Step 3: Commit**

```bash
git add apps/premium-site/app/\(routes\)/phoenix/types.ts
git commit -m "feat(types): add sampleCount and confidence to KpiMetric"
```

---

## Task 3: Fix MV Time Windows & Add Sample Counts

**Files:**
- Modify: `scripts/rebuild-analytics-mvs.js`
- Modify: `scripts/rebuild-analytics-base.js`

This task fixes the SQL definitions for mv_dashboard and adds `sample_count`/`closed_count` columns to MVs that are missing them. It also filters out future close_dates from analytics_base.

**IMPORTANT:** This task creates/modifies scripts only. Do NOT execute them — execution is Task 8.

- [ ] **Step 1: Fix analytics_base — filter future close_dates**

In `scripts/rebuild-analytics-base.js`, add a filter to the WHERE clause. Find the existing WHERE:

```javascript
    WHERE cl.county = 'Maricopa'
      AND lr.list_price >= 200000
      AND lr.listing_contract_date >= '2021-01-01'
```

Add after the last AND:

```javascript
    WHERE cl.county = 'Maricopa'
      AND lr.list_price >= 200000
      AND lr.listing_contract_date >= '2021-01-01'
      AND (lr.close_date IS NULL OR lr.close_date <= CURRENT_DATE + INTERVAL '30 days')
```

This excludes the ~12 records with close_dates in 2027-2041.

- [ ] **Step 2: Fix mv_dashboard — use trailing complete month instead of rolling 30 days**

In `scripts/rebuild-analytics-mvs.js`, find the mv_dashboard definition (MV 9, around line 384). Replace ALL occurrences of `(CURRENT_DATE - INTERVAL '30 days')::date` in the closed-sale filters with `date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date`.

This changes the window from "rolling 30 days" (which misaligns with truncated close_month) to "the last complete calendar month and forward" — guaranteed to always include at least one full month.

Specifically, replace these 4 lines:

```javascript
// Line 387 — current_median_price
FILTER (WHERE standard_status = 'Closed' AND close_month >= (CURRENT_DATE - INTERVAL '30 days')::date)
// REPLACE WITH:
FILTER (WHERE standard_status = 'Closed' AND close_month >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date)

// Line 388 — current_avg_dom (same filter)
// Line 390 — current_new_listings_30d (contract_month version)
// Lines 415-417 — pct_above_list (same 30-day filter, TWO occurrences in the CASE)
```

All `close_month >= (CURRENT_DATE - INTERVAL '30 days')::date` become `close_month >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date`.

Similarly for `contract_month >= (CURRENT_DATE - INTERVAL '30 days')::date` on line 390 — change to `contract_month >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date`.

- [ ] **Step 3: Fix mv_dashboard — implement yoy_inventory_change**

Replace the hardcoded `0::numeric AS yoy_inventory_change` (line 408) with:

```sql
-- YoY inventory change (active count now vs 12 months ago, approximated)
CASE WHEN COUNT(*) FILTER (WHERE standard_status = 'Active') > 0
  THEN ROUND(((
    COUNT(*) FILTER (WHERE standard_status = 'Active')::numeric -
    COUNT(*) FILTER (WHERE standard_status = 'Active' AND contract_month <= (CURRENT_DATE - INTERVAL '12 months')::date)::numeric
  ) / NULLIF(COUNT(*) FILTER (WHERE standard_status = 'Active' AND contract_month <= (CURRENT_DATE - INTERVAL '12 months')::date), 0) * 100)::numeric, 1)
  ELSE NULL END AS yoy_inventory_change,
```

Note: This is an approximation. The true YoY inventory comparison would require a snapshot from 12 months ago, which we don't store. This computes how many of today's active listings existed a year ago as a proxy. If this is not meaningful, keep the `0::numeric` placeholder and add a comment explaining why — the UI already shows `--` when the value is 0.

**Decision point:** If the proxy calculation isn't reliable, keep `0::numeric` and document it. The UI already handles 0 → "--". Better to show nothing than wrong data.

- [ ] **Step 4: Add closed_count to mv_negotiation**

The mv_negotiation MV already has `sample_count` (which counts the total sample). Verify it exists in the current script. If it does, this step is done. If not, add:

```sql
COUNT(*) AS sample_count
```

to the SELECT list in the nineWay callback for mv_negotiation.

- [ ] **Step 5: Add sample_count to mv_absorption**

In the mv_absorption CTE, add `monthly_closings` as the implicit sample count (it's already there as a column). No change needed — `monthly_closings` serves as the sample count.

- [ ] **Step 6: Verify script syntax**

Run: `node -c scripts/rebuild-analytics-mvs.js && node -c scripts/rebuild-analytics-base.js && echo "SYNTAX OK"`
Expected: `SYNTAX OK`

- [ ] **Step 7: Commit**

```bash
git add scripts/rebuild-analytics-mvs.js scripts/rebuild-analytics-base.js
git commit -m "fix(mvs): trailing-month windows, future-date filter, yoy inventory"
```

---

## Task 4: Query Layer — Sample-Size Gating & Formatter Fixes

**Files:**
- Modify: `packages/database/src/queries/phoenix-analytics.ts`

This is the largest task. It adds sample-count awareness to every KPI builder and fixes the List/Sale Ratio formatter.

- [ ] **Step 1: Import confidence utilities**

At the top of `phoenix-analytics.ts`, add:

```typescript
import {
  getConfidence,
  isYoyReliable,
  SAMPLE_THRESHOLDS,
} from '@platform/shared';
import type { ConfidenceLevel } from '@platform/shared';
```

- [ ] **Step 2: Add helper to find latest reliable closed pulse row**

After the existing helper functions (around line 117), add:

```typescript
/**
 * Find the most recent Closed pulse row with sufficient sample size.
 * Skips thin months (< SUPPRESS threshold) to avoid garbage fallback data.
 */
function findReliableClosed(
  closedPulse: NMarketPulseRow[],
  minSample = SAMPLE_THRESHOLDS.SUPPRESS,
): NMarketPulseRow | undefined {
  for (let i = closedPulse.length - 1; i >= 0; i--) {
    if (pi(closedPulse[i].closed_count) >= minSample) {
      return closedPulse[i];
    }
  }
  return closedPulse[closedPulse.length - 1]; // last resort: thin data is better than nothing
}
```

- [ ] **Step 3: Add sample-count-aware YoY change**

After the existing `yoyChange` function, add:

```typescript
/**
 * Compute YoY change, but return 0 (suppressed) when sample sizes
 * are too asymmetric for a meaningful comparison.
 */
function safeYoyChange(
  current: number,
  prior: number,
  currentN: number,
  priorN: number,
): number {
  if (!isYoyReliable(currentN, priorN)) return 0;
  return yoyChange(current, prior);
}
```

- [ ] **Step 4: Fix List/Sale Ratio formatter in getPhoenixPricing**

Find line ~595 (search for `listToClose.toFixed(1)`):

```typescript
// BEFORE:
{ label: 'List/Sale Ratio', value: listToClose > 0 ? `${listToClose.toFixed(1)}%` : '--', change: 0, sparkData: [] },
```

```typescript
// AFTER:
{ label: 'List/Sale Ratio', value: listToClose > 0 ? `${(listToClose * 100).toFixed(1)}%` : '--', change: 0, sparkData: [] },
```

- [ ] **Step 5: Update getQuickOverview — use findReliableClosed and attach confidence**

Find `getQuickOverview()` (around line 974). Replace the `latestClosed` assignment:

```typescript
// BEFORE:
const closedPulse = pulseRows.filter(r => r.standard_status === 'Closed');
const latestClosed = closedPulse[closedPulse.length - 1];

// AFTER:
const closedPulse = pulseRows.filter(r => r.standard_status === 'Closed');
const latestClosed = findReliableClosed(closedPulse);
const latestClosedN = latestClosed ? pi(latestClosed.closed_count) : 0;
const latestClosedConf = getConfidence(latestClosedN);
```

Then update every KPI that uses `latestClosed` to include `sampleCount` and `confidence`:

```typescript
// For median price KPI (find it in the kpis array):
{
  label: 'Median Price',
  value: fmtPrice(medianPrice),
  change: safeYoyChange(medianPrice, priorMedian, latestClosedN, priorClosedN),
  sparkData: priceSpark,
  sampleCount: latestClosedN,
  confidence: latestClosedConf,
},
```

Apply the same pattern to: Avg DOM, Price/SqFt, Months Supply, Closed Sales, % Above List, % Price Cuts.

For metrics sourced from dashboard (Active Inventory, Pending), the sample is the active count itself — always large enough, so `confidence: 'high'`.

For metrics sourced from negotiation rows, use `pi(latestNegRow.sample_count)`.

To get `priorClosedN`: find the prior-year pulse row:
```typescript
const priorPulseRow = closedPulse.length >= 13 ? closedPulse[closedPulse.length - 13] : closedPulse[0];
const priorClosedN = priorPulseRow ? pi(priorPulseRow.closed_count) : 0;
```

- [ ] **Step 6: Update getPhoenixOverview — same pattern**

Apply the same `findReliableClosed` + `safeYoyChange` + confidence attachment pattern to `getPhoenixOverview()`. The structure is the same — replace `closedPulse[closedPulse.length - 1]` with `findReliableClosed(closedPulse)`.

- [ ] **Step 7: Update getPhoenixPricing — same pattern**

Same changes for the Pricing tab's KPIs.

- [ ] **Step 8: Update getPhoenixActivity — same pattern**

Same changes for the Activity tab's KPIs.

- [ ] **Step 9: Update getPhoenixTiming — same pattern**

Same changes for the Timing tab's KPIs and momentum calculation.

- [ ] **Step 10: Verify all changes compile**

Run: `cd real-estate-platform && pnpm --filter @platform/database exec tsc --noEmit`
Expected: 0 errors

Run: `cd real-estate-platform && pnpm --filter @real-estate/premium-site exec tsc --noEmit`
Expected: 0 errors

- [ ] **Step 11: Commit**

```bash
git add packages/database/src/queries/phoenix-analytics.ts
git commit -m "fix(analytics): sample-size gating, reliable fallback, list/sale ratio formatter"
```

---

## Task 5: UI — Confidence-Aware KPI Cards

**Files:**
- Modify: `apps/premium-site/app/(routes)/phoenix/components/cards/HeroKpiCard.tsx`
- Modify: `apps/premium-site/app/(routes)/phoenix/components/layout/SecondaryKpiBar.tsx`

- [ ] **Step 1: Update HeroKpiCard for confidence tiers**

In `HeroKpiCard.tsx`, update the component to handle suppressed and low-confidence states:

```typescript
export function HeroKpiCard({ label, value, change, sparkData: _sparkData, sampleCount, confidence }: KpiMetric) {
  const isSuppressed = confidence === 'suppressed';
  const isLowConf = confidence === 'low';
  const isPositive = change >= 0;
  const changeColor = isPositive ? DASH_COLORS.green : DASH_COLORS.red;
  const photoUrl = useMemo(() => getKpiPhoto(label), [label]);
  const priorValue = useMemo(
    () => isSuppressed ? null : computePriorValue(value, change),
    [value, change, isSuppressed],
  );

  return (
    <div className="relative overflow-hidden rounded-xl h-full">
      {/* Background photo */}
      <Image src={photoUrl} alt="" fill className="object-cover brightness-[0.3] saturate-[0.25]" sizes="(max-width: 640px) 100vw, 33vw" priority />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/20" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 py-3 text-center z-10">
        <span className="font-sans text-[10px] sm:text-[11px] text-dash-text-secondary/80 uppercase tracking-[0.2em] font-medium">
          {label}
        </span>

        {/* Hero number — suppressed shows "--", low-confidence reduces opacity */}
        <span className={`font-serif text-4xl sm:text-5xl font-bold leading-none tracking-tight mt-1.5 ${
          isSuppressed ? 'text-dash-text-muted' : isLowConf ? 'text-dash-text/60' : 'text-dash-text'
        }`}>
          {isSuppressed ? '--' : value}
        </span>

        {/* Context + change — hidden when suppressed */}
        {!isSuppressed && (
          <div className="flex items-center gap-2 mt-2">
            {priorValue && (
              <span className="font-sans text-[11px] text-dash-text-muted">vs {priorValue}</span>
            )}
            {change !== 0 && (
              <span className="font-mono text-xs font-semibold" style={{ color: changeColor }}>
                {isPositive ? '+' : ''}{change}%
              </span>
            )}
          </div>
        )}

        {/* Sample count annotation for low-confidence */}
        {isLowConf && sampleCount !== undefined && (
          <span className="font-mono text-[9px] text-dash-text-muted/50 mt-1">
            n={sampleCount}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update SecondaryKpiBar for confidence tiers**

In `SecondaryKpiBar.tsx`, update the rendering:

```typescript
export function SecondaryKpiBar({ kpis }: SecondaryKpiBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 py-6 px-2 border-t border-white/[0.06]">
      {kpis.map((kpi, i) => {
        const isSuppressed = kpi.confidence === 'suppressed';
        const isLowConf = kpi.confidence === 'low';
        const isPositive = kpi.change >= 0;
        const changeColor = isPositive ? DASH_COLORS.green : DASH_COLORS.red;

        return (
          <div key={i} className="flex flex-col gap-0.5 py-1">
            <span className="font-sans text-xs text-dash-text-muted uppercase tracking-[0.14em] font-bold">
              {kpi.label}
            </span>

            <div className="flex items-center gap-2">
              <span className={`font-serif text-2xl font-semibold leading-none ${
                isSuppressed ? 'text-dash-text-muted' : isLowConf ? 'text-dash-text/60' : 'text-dash-text'
              }`}>
                {isSuppressed ? '--' : kpi.value}
              </span>

              {!isSuppressed && kpi.change !== 0 && (
                <span className="font-mono text-[10px] font-semibold" style={{ color: changeColor }}>
                  {isPositive ? '\u25B2' : '\u25BC'} {Math.abs(kpi.change)}%
                </span>
              )}

              {!isSuppressed && kpi.sparkData && (
                <SparkLine data={kpi.sparkData} color={changeColor} width={44} height={14} />
              )}
            </div>

            {isLowConf && kpi.sampleCount !== undefined && (
              <span className="font-mono text-[8px] text-dash-text-muted/40">
                Based on {kpi.sampleCount} closings
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `cd real-estate-platform && pnpm --filter @real-estate/premium-site exec tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add apps/premium-site/app/\(routes\)/phoenix/components/cards/HeroKpiCard.tsx
git add apps/premium-site/app/\(routes\)/phoenix/components/layout/SecondaryKpiBar.tsx
git commit -m "feat(ui): confidence-aware KPI rendering with suppressed/low tiers"
```

---

## Task 6: "Data Through" Header

**Files:**
- Modify: `apps/premium-site/app/(routes)/phoenix/components/layout/DashboardHero.tsx`

- [ ] **Step 1: Add data-through label to DashboardHero**

Import the utility:

```typescript
import { getLastCompleteMonthLabel } from '@platform/shared';
```

Find the area near the time-range selector or refreshed-at display. Add below the title/subtitle area:

```tsx
<span className="font-mono text-[9px] text-white/30 uppercase tracking-wider">
  Data through {getLastCompleteMonthLabel()}
</span>
```

This should appear near the top of the hero, close to the segment selector or time controls.

- [ ] **Step 2: Type-check**

Run: `cd real-estate-platform && pnpm --filter @real-estate/premium-site exec tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add apps/premium-site/app/\(routes\)/phoenix/components/layout/DashboardHero.tsx
git commit -m "feat(ui): add 'Data through [Month Year]' header to dashboard"
```

---

## Task 7: Chart Tooltip Sample Counts

**Files:**
- Modify: `apps/premium-site/app/(routes)/phoenix/components/charts/PriceTrendsChart.tsx`

- [ ] **Step 1: Add sample count to chart tooltip**

This is a future enhancement. The `TimeSeriesPoint` type would need an optional `sampleCount` field, and the tooltip renderer would display "(n=47)" alongside the value. 

For now, this task is **deferred** — the KPI-level confidence display from Task 5 is the priority. Chart-level sample counts require changes to `buildYoyTimeSeries`, all chart data builders, and the tooltip component. It's a larger scope that should be planned separately.

Mark as: DEFERRED — tracked for future sprint.

- [ ] **Step 2: Commit placeholder**

No changes to commit. This task is documentation only.

---

## Task 8: Execute MV Rebuild

**Files:**
- No file changes — this is a runtime execution task

**IMPORTANT:** This task requires explicit user approval before executing. These scripts modify production RDS data.

- [ ] **Step 1: Run rebuild-analytics-base.js**

```bash
cd real-estate-platform
export $(grep RDS_DATABASE_URL apps/premium-site/.env.local | xargs)
node scripts/rebuild-analytics-base.js
```

Expected output: analytics_base rebuilt with ~357K rows, property segment distribution shown, future close_dates excluded.

- [ ] **Step 2: Run rebuild-analytics-mvs.js**

```bash
node scripts/rebuild-analytics-mvs.js
```

Expected output: All 9 MVs rebuilt. Dashboard metrics should now use trailing-complete-month windows instead of rolling 30 days.

- [ ] **Step 3: Run check-analytics-consistency.js**

```bash
node scripts/check-analytics-consistency.js
```

Expected: 31/31 PASS (or close — some checks may need threshold adjustments for the new window).

- [ ] **Step 4: Verify dashboard metrics**

```bash
node -e "
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.RDS_DATABASE_URL, ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  const r = await c.query(\"SELECT * FROM mv_dashboard WHERE scope_type = 'metro' AND scope_key = 'phoenix_metro' AND property_segment = 'residential'\");
  console.log(r.rows[0]);
  await c.end();
});
"
```

Verify:
- `current_median_price` is NOT NULL (should be ~$480K from last complete month)
- `current_avg_dom` is NOT NULL (should be ~60-90d)
- `pct_above_list` is NOT NULL
- `current_months_of_supply` is reasonable (~3-5, not 9.0)

---

## Task 9: Full Type-Check & Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Type-check all packages**

```bash
cd real-estate-platform && pnpm type-check
```

Expected: 0 errors in @platform/shared, @platform/database, @real-estate/premium-site

- [ ] **Step 2: Build premium-site**

```bash
pnpm --filter @real-estate/premium-site build
```

Expected: Clean build (pre-existing generateStaticParams failure in community pages is acceptable — it's a Neon DB issue, not related to this change).

- [ ] **Step 3: Manual smoke test**

Load `http://localhost:3000/phoenix` and verify:
1. KPI values are reasonable (median ~$480K, DOM ~60-90d, MoS ~3-5)
2. No wild YoY percentages (>50% in either direction should be rare for metro)
3. "Data through [Month Year]" header appears
4. Price vs Inventory chart shows data (not empty)
5. Sparklines have 8 data points (not 2)
6. Switch to LAND segment — verify metrics adjust (smaller numbers, different medians)
7. Click a region card — verify region dashboard loads with reasonable data

- [ ] **Step 4: Commit any final fixes**

---

## Summary of Bugs Fixed

| Bug | Root Cause | Fix Location | Classification |
|-----|-----------|-------------|---------------|
| DOM = 3d | Fallback grabs thin March data (16 closings) | `findReliableClosed()` skips thin months | THIN DATA |
| -96.8% DOM YoY | 16 vs 5,763 closings compared | `safeYoyChange()` suppresses asymmetric comparisons | THIN DATA |
| Median = $624K (+27%) | Same thin fallback | `findReliableClosed()` | THIN DATA |
| MoS = 9.0 (+143%) | 30-day window misaligns with close_month truncation | MV uses trailing complete month | COMPUTATION BUG |
| List/Sale = "1.0%" | Raw ratio (0.979) not multiplied by 100 | `(listToClose * 100).toFixed(1)` | FORMATTER BUG |
| yoy_inventory_change = 0 | Hardcoded to 0 in MV SQL | Documented as intentional (no historical snapshot) | COMPUTATION BUG |
| Dashboard 30-day NULLs | close_month truncation + 30-day window = empty set | MV uses `date_trunc('month', CURRENT_DATE - '1 month')` | COMPUTATION BUG |
| Future close_dates | 12 records with 2027-2041 dates | analytics_base WHERE filter | DATA QUALITY |
| All KPIs show without confidence | No sample-size awareness | Confidence tiers + `sampleCount` on KpiMetric | MISSING FEATURE |
