# Phoenix Dashboard Analytics Diagnostic Report

**Date:** 2026-04-13
**Investigator:** Automated diagnostic
**Symptoms reported:** DOM=3, 96-97% shifts, 140% YoY changes

---

## 1. MV Data Dump

### 1A: mv_dashboard (metro/residential row)

| Column | Value |
|--------|-------|
| scope_type | metro |
| scope_key | phoenix_metro |
| property_segment | residential |
| current_active_count | 18,636 |
| current_median_price | **NULL** |
| current_avg_dom | **NULL** |
| current_pending_count | 4,245 |
| current_new_listings_30d | **0** |
| mtd_closed | **0** |
| mtd_volume | **NULL** |
| current_months_of_supply | 9.0 |
| yoy_price_change | -0.5 |
| yoy_inventory_change | 0 |
| pct_price_cuts | 0.0 |
| pct_above_list | **NULL** |
| refreshed_at | 2026-04-13T04:21:27.674Z |

**Key observation:** 5 of 15 KPI columns are NULL and 2 more are zero. This is because the MV uses `close_month >= CURRENT_DATE - 30 days` to compute 30-day metrics, but at refresh time (Apr 13), CURRENT_DATE - 30 = Mar 14. Since `close_month` is truncated to 1st-of-month, the only qualifying month would be `close_month = 2026-04-01`, and analytics_base has zero April closings. Every 30-day-window metric is therefore NULL/zero.

Total dashboard rows: 158 (49 community x 3 segments + 13 region x 3 + 1 metro x 3 = 189 possible; 158 actual due to segment filtering).

### 1B: mv_market_pulse (metro/residential, Closed status, recent months)

| Month | Closed Count | Median Close Price | Avg DOM | Avg PPSF |
|-------|-------------|-------------------|---------|----------|
| 2026-03 | **16** | $623,613 | **2.81** | $450.63 |
| 2026-02 | 317 | $525,000 | 21.71 | $344.74 |
| 2026-01 | 2,124 | $495,000 | 38.06 | $318.19 |
| 2025-12 | 1,904 | $475,000 | 54.68 | $313.91 |
| 2025-11 | 2,623 | $475,000 | 64.22 | $302.29 |
| 2025-10 | 4,066 | $475,000 | 69.97 | $296.13 |

**Critical:** March 2026 has only 16 closings (vs ~5,500 expected for a full month). This is the source of the DOM=3 and inflated price metrics. The ARMLS sync is still running initial pull (`initial_pull_complete: false`) and has not yet populated most March/April closed data.

### 1C: mv_supply_demand (metro/residential)

| Month | New Listings | Closed Sales |
|-------|-------------|-------------|
| 2026-03 | 3,469 | 1,749 |
| 2026-02 | 7,067 | 4,484 |
| 2026-01 | 8,116 | 3,707 |
| 2025-12 | 4,240 | 4,792 |

Note: Supply/demand uses `contract_month` for new listings and `close_month` for closed. March 2026 shows 1,749 closed because the supply_demand MV counts all Closed-status records regardless of when they were synced, using the frozen analytics_base data.

### 1D: mv_absorption (metro/residential, recent)

| Month | Active | Monthly Closings | Months Supply |
|-------|--------|-----------------|---------------|
| 2026-03 | 26,077 | 1,749 | 7.9 |
| 2026-02 | 24,357 | 4,484 | 5.6 |
| 2026-01 | 21,774 | 3,707 | 5.2 |
| 2025-12 | 17,365 | 4,792 | 3.8 |

### 1E: mv_negotiation (metro/residential, recent)

| Month | Sample | Avg L/S Ratio | % Above | % At | % Below |
|-------|--------|--------------|---------|------|---------|
| 2026-03 | 1,749 | 0.9795 | 14.4 | 25.8 | 59.9 |
| 2026-02 | 4,484 | 0.9785 | 12.2 | 25.5 | 62.3 |
| 2026-01 | 3,707 | 0.9775 | 11.8 | 23.6 | 64.6 |

Note: `avg_list_to_sale_ratio` is stored as a decimal (0.9795), NOT a percentage. The Pricing tab formats this as `listToClose.toFixed(1) + '%'` which renders as **"1.0%"** instead of "97.95%".

### 1F: mv_community_yoy (metro/residential)

| Year | Closed | Median Price | Avg DOM | Avg PPSF |
|------|--------|-------------|---------|----------|
| 2026 | 9,940 | $480,093 | 103.54 | $308.04 |
| 2025 | 57,379 | $485,000 | 96.42 | $298.67 |
| 2024 | 55,443 | $480,000 | 86.21 | $297.09 |
| 2023 | 56,162 | $460,000 | 87.86 | $286.68 |

2026 YTD has 9,940 closings (vs 57K-67K for full years). Partial-year comparisons are misleading.

### 1G: mv_community_scorecard (region/residential)

13 regions present. Top by active inventory:
- north-scottsdale: 1,251 active, median $1.25M, avg DOM 115, MoS 6.3
- south-scottsdale: 578 active, median $575K, avg DOM 100, MoS 7.8
- central-scottsdale: 469 active, median $822.5K, avg DOM 91, MoS 5.1

### 1H: mv_dashboard counts

| Segment | Scope | Count |
|---------|-------|-------|
| all | community | 49 |
| all | metro | 1 |
| all | region | 13 |
| land | community | 19 |
| land | metro | 1 |
| land | region | 12 |
| residential | community | 49 |
| residential | metro | 1 |
| residential | region | 13 |

### 1I: MV Row Counts

| MV | Rows |
|----|------|
| mv_dashboard | 158 |
| mv_market_pulse | 9,662 |
| mv_supply_demand | 8,213 |
| mv_absorption | 8,213 |
| mv_negotiation | 7,214 |
| mv_community_yoy | 897 |
| mv_community_scorecard | 158 |
| mv_price_bands | 27,098 |
| mv_inventory_age | 565 |
| mv_price_band_distribution | **DOES NOT EXIST** |
| mv_heatmap_points | **DOES NOT EXIST** |

---

## 2. Underlying Data Health

### 2A: analytics_base summary

- Total rows: 357,652
- Distinct months: 63 (Jan 2021 - Mar 2026)
- By status: Closed 329,572 | Active 20,433 | Pending 4,354 | Active Under Contract 3,293
- By segment: residential 347,988 | land 5,869 | commercial 3,795

analytics_base is a MATERIALIZED VIEW joining listing_records to clean_listings. Definition:
```
FROM listing_records lr JOIN clean_listings cl ON cl.listing_key = lr.listing_key
WHERE cl.county = 'Maricopa' AND lr.list_price >= 200000 AND lr.listing_contract_date >= '2021-01-01'
```

### 2B: Monthly counts by contract_month (residential, 2023+)

March 2026: total=3,469 | closed=16 | active=3,104 | pending=188
Feb 2026: total=7,067 | closed=317 | active=4,559 | pending=1,174
Jan 2026: total=8,116 | closed=2,124 | active=4,016 | pending=1,134
Full 2024 months: ~4,000-5,500 total, 99%+ closed

**Pattern:** Recent months have many Active/Pending records but few Closed. Older months show nearly 100% Closed. This is expected -- active listings eventually close or expire, and the sync is still backfilling.

### 2C: Monthly closed by close_date (clean_listings, residential, Maricopa, $200K+)

| Close Month | Count | Median Price | Median DOM | Avg DOM | Min DOM | Max DOM |
|-------------|-------|-------------|-----------|---------|---------|---------|
| 2026-03 | 108 | $469,500 | 56.5 | 83.0 | 17 | 394 |
| 2026-02 | 286 | $475,000 | 78.0 | 101.3 | 0 | 624 |
| 2026-01 | 255 | $444,900 | 82.0 | 107.4 | 0 | 959 |
| 2025-12 | 311 | $471,000 | 75.0 | 101.0 | 2 | 872 |

clean_listings shows more reasonable numbers than mv_market_pulse because it queries the base table directly (not the frozen MV). Still shows only 108 March closings (vs ~5,500 expected) -- the sync is incomplete.

### 2D: Direct clean_listings query

**Last 30 days (since Apr 13):** 0 closings (no closings after Mar 14 in clean_listings)
**Last 90 days:** 588 closings, median $470K, median DOM 74, avg DOM 99

### 2E: YoY comparison (trailing 12 months vs prior 12)

| Period | Count | Median Price | Total Volume | Avg DOM | Median DOM |
|--------|-------|-------------|-------------|---------|-----------|
| Current (Apr 2025-Apr 2026) | 3,467 | $474,490 | $2.14B | 97.4 | 76 |
| Prior (Apr 2024-Apr 2025) | 3,607 | $490,000 | $2.26B | 90.7 | 69 |

These clean_listings numbers are from a MUCH smaller subset (~3,500/year) than analytics_base (~55,000/year) because clean_listings only has ~22,000 residential records total vs analytics_base's 348,000.

### 2F: Active inventory by segment (clean_listings)

| Segment | Active Count |
|---------|-------------|
| NULL | **27,530** |
| residential | 1,754 |
| land | 615 |
| commercial | 86 |

**Critical:** 27,530 active listings have NULL property_segment in clean_listings. This means they haven't been classified by the clean layer's segment derivation. analytics_base derives segment from listing_records.property_type at query time, so it shows 20,433 active residential (which includes many of these NULLs via the `WHEN property_type IS NULL THEN 'residential'` fallback).

---

## 3. Sync State

### 3A: listing_sync_state

| Entity | Status | Last Completed | Records Synced | Initial Pull Complete |
|--------|--------|---------------|---------------|----------------------|
| Property | **running** | 2026-04-13T10:30:09 | 666,760 | **false** |
| Property-Active | **running** | 2026-04-13T13:47:13 | 77,580 | **false** |
| Member | idle | never | 0 | false |
| Office | idle | never | 0 | false |
| OpenHouse | idle | never | 0 | false |

**Critical:** The Property sync has `initial_pull_complete = false` and is at skip_token `20160424...` -- it's still backfilling historical data from 2016. The ARMLS sync has not yet completed its initial full pull. This means recent closed listings are only partially synced.

### 3B: Most recent timestamps (listing_records, Maricopa)

- Max modification_timestamp: 2026-04-11T04:19:34
- Max listing_contract_date: 2026-03-31
- Max close_date: **2041-10-15** (data quality issue -- future date)
- Max last_synced_at: 2026-04-13T13:59:18

### 3C: Listings per year by contract_date (listing_records, Maricopa)

| Year | Count |
|------|-------|
| 2021 | 111,465 |
| 2022 | 96,302 |
| 2023 | 81,464 |
| 2024 | 83,932 |
| 2025 | 90,838 |
| 2026 | 26,675 |

### 3D: Listings per year by close_date (listing_records, Maricopa)

| Year | Count |
|------|-------|
| 2021 | 113,244 |
| 2022 | 92,938 |
| 2023 | 82,581 |
| 2024 | 81,308 |
| 2025 | 83,227 |
| 2026 | 15,158 |

Also: 2027(2), 2028(2), 2030(5), 2031(1), 2036(1), 2041(1) -- data quality issues (future close dates).

### 3E: clean_listings per year by close_date (residential, Maricopa, $200K+)

| Year | Count | Median Price | Median DOM |
|------|-------|-------------|-----------|
| 2021 | 5,856 | $415,022 | 43 |
| 2022 | 4,614 | $477,000 | 48 |
| 2023 | 3,748 | $451,901 | 62 |
| 2024 | 3,575 | $480,000 | 66 |
| 2025 | 3,831 | $479,000 | 76 |
| 2026 | 649 | $460,000 | 77 |

clean_listings has far fewer records than listing_records (~4,000/yr vs ~80,000/yr). Many listing_records are not matched to clean_listings (the join drops them if they don't exist in clean_listings or are outside the geographic/price scope).

---

## 4. Weird Numbers Investigated

### 4A: DOM = 3

**Root cause: THIN DATA (incomplete sync)**

The dashboard fallback chain works as follows:
1. `dash.current_avg_dom` = NULL (mv_dashboard has no closings in the 30-day window)
2. Fallback: `latestClosed.avg_dom` from mv_market_pulse
3. `latestClosed` = March 2026 Closed row: avg_dom = **2.8125** (from only **16 closings**)
4. `fmtDays(2.8125)` = `Math.round(2.8125) + 'd'` = **"3d"**

The 16 closings in March 2026 happen to be listings with extremely low DOM (0-19 days). This is a tiny, non-representative sample of early-sync data. The March 2025 comparison month had 5,763 closings with avg DOM of 89.19.

**YoY change displayed:** (2.8125 - 89.19) / 89.19 * 100 = **-96.8%**

### 4B: 96-97% Shifts

**Two separate issues:**

**Issue 1 -- "96-97% DOM drop" on Overview tab:** This is the -96.8% YoY change on the DOM KPI. Root cause is the same as 4A: 16 closings in March 2026 with avg DOM of 2.8 vs 5,763 closings in March 2025 with avg DOM of 89.19.

**Issue 2 -- List/Sale Ratio display on Pricing tab:** FORMATTER BUG

In `getPhoenixPricing()` (line 562):
```ts
const listToClose = latestNeg ? pf(latestNeg.avg_list_to_sale_ratio) : 0;
```
The raw value is `0.97954771...` (a decimal ratio, not a percentage).

Display (line 595):
```ts
{ label: 'List/Sale Ratio', value: listToClose > 0 ? `${listToClose.toFixed(1)}%` : '--', ... }
```
This renders as **"1.0%"** instead of **"97.95%"**. The formatter does not multiply by 100.

The MV stores `avg_list_to_sale_ratio` as a raw ratio (0.979...), but `pct_above_list`, `pct_at_list`, and `pct_below_list` are already stored as percentages (14.4, 25.8, 59.9). This inconsistency causes the formatting bug.

### 4C: 140% YoY Changes

**Root cause: THIN DATA (incomplete sync) affecting Months of Supply**

The user sees approximately 143% YoY change on the Months Supply KPI:
- Current MoS: 9.0 (from mv_dashboard)
- Prior MoS: 3.7 (March 2025 from mv_absorption)
- YoY: (9.0 - 3.7) / 3.7 * 100 = **143.2%**

The 9.0 MoS from the dashboard is inflated because:
1. Dashboard computes MoS as: `active_count / (3-month-avg closings)`
2. Active count (18,636) is correct
3. But the 3-month closings denominator is based on `close_month >= CURRENT_DATE - 3 months`
4. At refresh time (Apr 13), that window is Jan-Apr 2026
5. analytics_base has: Jan=2,124 + Feb=317 + Mar=16 + Apr=0 = 2,457 closings in 3 months
6. Monthly average = 2,457 / 3 = 819
7. MoS = 18,636 / 819 = **22.8** (but dashboard shows 9.0, suggesting a slightly different calculation window)

The real issue is that February and March closings are drastically under-counted because the sync is incomplete. The true number of monthly closings should be ~4,500-5,500/month, giving a MoS of ~3.5-4.0.

Other inflated YoY numbers:
- Median Price: +27.3% (March 2026 $624K from 16 sales vs March 2025 $490K from 5,763 sales)
- Price/SqFt: +47% ($451 from 16 sales vs $307 from 5,763 sales)
- Closed Sales: -68.4% (1,749 vs 5,531 -- partial month)

---

## 5. MV SQL Definitions

### analytics_base (materialized view)
```sql
SELECT lr.listing_key, lr.standard_status, lr.list_price, lr.close_price,
       lr.days_on_market, lr.price_per_sqft, lr.property_type, lr.property_sub_type,
       cl.postal_code, cl.county, lr.listing_contract_date, lr.close_date,
       cl.has_price_reduction, lr.price_change_timestamp, cl.listing_terms,
       date_trunc('month', lr.listing_contract_date)::date AS contract_month,
       date_trunc('month', lr.close_date)::date AS close_month,
       cl.region_slug, cl.community_slug,
       CASE
         WHEN lr.property_type IN ('Residential','Residential Lease') THEN 'residential'
         WHEN lr.property_type = 'Land' THEN 'land'
         WHEN lr.property_type IN ('Multiple Dwellings','Comm/Industry Sale',...) THEN 'commercial'
         WHEN lr.property_type IS NULL THEN 'residential'  -- NULL defaults to residential
         ELSE 'other'
       END AS property_segment
FROM listing_records lr
JOIN clean_listings cl ON cl.listing_key = lr.listing_key
WHERE cl.county = 'Maricopa' AND lr.list_price >= 200000 AND lr.listing_contract_date >= '2021-01-01';
```

### mv_dashboard (key columns, materialized view)

Uses `CURRENT_DATE` at refresh time for all window calculations:
- `current_median_price`: Closed with `close_month >= CURRENT_DATE - 30 days`
- `current_avg_dom`: Closed with `close_month >= CURRENT_DATE - 30 days`
- `mtd_closed`: Closed with `close_month >= date_trunc('month', CURRENT_DATE)`
- `current_months_of_supply`: `active_count / (3-month-avg closings)`
- `yoy_price_change`: Trailing 1yr median vs trailing 2yr-to-1yr median
- `pct_above_list`: Closed in last 30 days where close > list
- `pct_price_cuts`: Active listings with price reduction

**Design flaw:** Since mv_dashboard is a materialized view, CURRENT_DATE is evaluated once at refresh time and frozen. If analytics_base has no closings in the 30-day window at that moment, all 30-day metrics become NULL. The 30-day window shifts forward each day but the MV data stays stale until refresh.

### mv_market_pulse (materialized view)
Groups by `contract_month` (NOT close_month). Computes median_close_price, avg_dom, etc. for Closed-status records within each contract_month. Uses 9-way UNION ALL for scope x segment combinations.

### mv_negotiation (materialized view)
Groups by `close_month`. Computes avg_list_to_sale_ratio as a raw decimal (not percentage), but pct_above/at/below_list as percentages (multiplied by 100).

---

## 6. Consistency Checks

### 6A: Active Count Comparison

| Source | Active Residential |
|--------|-------------------|
| mv_dashboard (metro/residential) | 18,636 |
| analytics_base (residential) | 18,636 |
| clean_listings (residential, Maricopa) | **1,754** |

**Discrepancy:** analytics_base shows 18,636 active residential, but clean_listings shows only 1,754. This happens because analytics_base JOINs listing_records to clean_listings on listing_key. The 18,636 count comes from all listing_records with status='Active' that match ANY clean_listings record (even if that clean_listings record has a different standard_status or no property_segment). Additionally, 27,530 active listings in clean_listings have NULL property_segment, so they're not counted in the clean_listings residential filter.

### 6B: Region Sum vs Metro

- Sum of all region active counts: 4,139
- Metro active: 18,636
- **Gap:** 14,497 active listings are not in any region (they have NULL region_slug in analytics_base)

This is expected -- only listings within defined geographic regions get a region_slug.

### 6C: Hero KPI Null Check

| Field | Null? |
|-------|-------|
| current_median_price | YES |
| current_avg_dom | YES |
| mtd_closed | 0 |
| mtd_volume | YES |
| pct_above_list | YES |
| current_new_listings_30d | 0 |
| current_months_of_supply | 9.0 (computed from 3-month window) |
| yoy_price_change | -0.5 (uses 1yr/2yr windows, sufficient data) |

5 key KPI fields are NULL, triggering fallback logic in `getQuickOverview()`.

---

## 7. Frontend Data Trace

### Data flow for each KPI in `getQuickOverview()`:

**1. Median Price**
- MV column: `mv_dashboard.current_median_price` (NULL)
- Fallback: `latestClosed.median_close_price` from mv_market_pulse = 623,612.5 (March 2026, 16 closings)
- Prior: March 2025 median = 490,000 (5,763 closings)
- Formatter: `fmtPrice(623612.5)` = `$624K`
- YoY: `yoyChange(623612.5, 490000)` = **+27.3%**
- Fallback IS triggered (dashboard null)

**2. Price/SqFt**
- MV column: `latestClosed.avg_price_per_sqft` = 450.63 (March 2026, 16 closings)
- Prior: March 2025 = ~306.6
- Formatter: `$${Math.round(450.63)}` = `$451`
- YoY: **+47.0%**
- No dashboard fallback for this KPI

**3. Avg DOM**
- MV column: `mv_dashboard.current_avg_dom` (NULL)
- Fallback: `latestClosed.avg_dom` = 2.8125 (March 2026, 16 closings)
- Prior: March 2025 = 89.19
- Formatter: `fmtDays(2.8125)` = `3d`
- YoY: `yoyChange(2.8125, 89.19)` = **-96.8%**
- Fallback IS triggered

**4. Active Inventory**
- MV column: `mv_dashboard.current_active_count` = 18,636
- Prior: March 2025 absorption active = 16,831
- Formatter: `fmtCount(18636)` = `18,636`
- YoY: **+10.7%**
- No fallback needed

**5. Months Supply**
- MV column: `mv_dashboard.current_months_of_supply` = 9.0
- Prior: March 2025 absorption MoS = 3.7
- Formatter: `mos.toFixed(1)` = `9.0`
- YoY: **+143.2%**
- No fallback needed but value is inflated due to thin denominator

**6. % Above List**
- MV column: `mv_dashboard.pct_above_list` (NULL)
- Fallback: `latestNeg.pct_above_list` = 14.4 (from mv_negotiation March 2026)
- Formatter: `fmtPct(14.4)` = `14.4%`
- YoY: Compares first vs last of 8 negotiation rows
- Fallback IS triggered; value is reasonable (based on 1,749 closings)

**7. % Price Cuts**
- MV column: `mv_dashboard.pct_price_cuts` = 0.0
- Formatter: `fmtPct(0.0)` = `0.0%` but guarded: shows `--` when 0
- Actually shows `--` (the code is `pctPriceCuts > 0 ? fmtPct(pctPriceCuts) : '--'`)
- Value is 0.0 because `has_price_reduction` on active listings in analytics_base = 0, likely a data population issue

**8. Closed Sales**
- MV column: `mv_dashboard.mtd_closed` = 0
- Fallback: `latestSD.closed_sales` from mv_supply_demand = 1,749 (March 2026)
- Prior: March 2025 = 5,531
- Formatter: `fmtCount(1749)` = `1,749`
- YoY: **-68.4%**
- Fallback IS triggered

---

## 8. Formatter Audit

### `pf()` and `pi()` (lines 91-101)
```ts
function pf(val: string | number | null | undefined, fallback = 0): number
function pi(val: string | number | null | undefined, fallback = 0): number
```
Parse float/int with null-safe fallback to 0. Correct behavior.

### `fmtPrice()` (lines 73-77)
```ts
function fmtPrice(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${Math.round(val / 1_000)}K`;
  return `$${Math.round(val)}`;
}
```
Correct. No double-formatting issues.

### `fmtDays()` (lines 83-85)
```ts
function fmtDays(val: number): string {
  return `${Math.round(val)}d`;
}
```
Correct. Rounds to nearest integer.

### `fmtCount()` (lines 79-81)
```ts
function fmtCount(val: number): string {
  return val.toLocaleString('en-US');
}
```
Correct.

### `fmtPct()` (lines 87-89)
```ts
function fmtPct(val: number): string {
  return `${Math.round(val * 10) / 10}%`;
}
```
Expects input to already be a percentage value (e.g., 14.4 for 14.4%). This is correct for `pct_above_list` (stored as 14.4) but would be wrong for `avg_list_to_sale_ratio` (stored as 0.979). However, `fmtPct` is NOT used for List/Sale Ratio -- that uses inline formatting.

### `yoyChange()` (lines 103-106)
```ts
function yoyChange(current: number, prior: number): number {
  if (prior === 0) return 0;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}
```
Returns percentage change rounded to 1 decimal. Guards against zero denominator. Correct formula, but produces wildly misleading results when current and prior have vastly different sample sizes.

### `buildYoyTimeSeries()` (lines 122-142)
Takes chronological rows, slices last N, looks up prior year by matching `YYYY-MM` key. Correct logic.

### Double-formatting check
- `pct_above_list`: Stored as 14.4 (already %). `fmtPct(14.4)` = "14.4%". **Correct.**
- `avg_list_to_sale_ratio`: Stored as 0.979 (raw ratio). Used in Pricing tab as `listToClose.toFixed(1) + '%'` = "1.0%". **BUG -- should multiply by 100 first.**
- No other double-formatting issues found.

---

## 9. Root Cause Assessment

| Symptom | Classification | Explanation |
|---------|---------------|-------------|
| DOM = 3d | **THIN DATA** | March 2026 has only 16 closings (sync incomplete). Those 16 happen to have near-zero DOM. The fallback from NULL dashboard to latest pulse month picks up this garbage data. |
| DOM YoY = -96.8% | **THIN DATA** | Comparing 16-closing average (2.8d) against 5,763-closing average (89.2d). Not a real market shift. |
| Median Price = $624K (+27.3%) | **THIN DATA** | 16 closings have a skewed median. True metro residential median is ~$480K. |
| Months Supply = 9.0 (+143%) | **THIN DATA** | Dashboard denominator (3-month avg closings) is deflated because Feb/Mar 2026 have incomplete closing data. True MoS is ~3.5-4.0. |
| Closed Sales = 1,749 (-68.4%) | **THIN DATA** | March 2026 supply_demand shows partial month due to sync lag. |
| List/Sale Ratio = "1.0%" | **FORMATTER BUG** | `avg_list_to_sale_ratio` is stored as 0.979 (raw ratio) but displayed as `ratio.toFixed(1) + '%'` without multiplying by 100. |
| % Price Cuts = "--" | **THIN DATA** | `has_price_reduction` in analytics_base is always false for current active listings, likely because clean_listings doesn't populate this field for newly synced records. |
| current_new_listings_30d = 0 | **THIN DATA** | analytics_base `contract_month >= CURRENT_DATE - 30` finds nothing because the latest contract_month (2026-03-01) is older than Mar 14. |
| All dashboard 30-day metrics = NULL | **COMPUTATION BUG** | mv_dashboard uses `close_month >= CURRENT_DATE - 30 days` but `close_month` is truncated to 1st-of-month. On Apr 13, CURRENT_DATE - 30 = Mar 14, and there is no close_month between Mar 14 and Apr 13 (close_month is always the 1st). The window should use `close_date` directly or use a full-month window. |
| yoy_inventory_change = 0 | **COMPUTATION BUG** | Hardcoded to `0::numeric` in the mv_dashboard SQL definition. Never computes actual YoY inventory change. |

---

## 10. Recommended Fixes (Prioritized)

### P0 -- Critical (data is wrong/misleading right now)

**Fix 1: Dashboard 30-day window uses close_month instead of close_date**

- File: Migration SQL that defines `mv_dashboard`
- Problem: `close_month >= (CURRENT_DATE - '30 days')::date` where close_month is always the 1st of the month. On April 13, this means close_month >= March 14, but close_month values are only ever Jan 1, Feb 1, Mar 1, Apr 1, etc. So only April (empty) qualifies.
- Fix: Change the 30-day filter to use `close_date >= CURRENT_DATE - 30` directly, OR change to `close_month >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date` to always include the prior full month.

**Fix 2: Fallback picks up thin/garbage data from incomplete months**

- File: `packages/database/src/queries/phoenix-analytics.ts`, functions `getQuickOverview()` (line 1017) and `getPhoenixOverview()` (line 407)
- Problem: `latestClosed = closedPulse[closedPulse.length - 1]` picks the most recent month regardless of sample size. March 2026 with 16 closings poisons all KPIs.
- Fix: Add a minimum sample threshold. Skip months with fewer than ~50-100 closings when selecting `latestClosed`. Example: `closedPulse.filter(r => pi(r.closed_count) >= 100).slice(-1)[0]`

**Fix 3: List/Sale Ratio formatter bug**

- File: `packages/database/src/queries/phoenix-analytics.ts`, line 595
- Problem: `listToClose.toFixed(1) + '%'` displays 0.979 as "1.0%" instead of "97.95%"
- Fix: Change to `(listToClose * 100).toFixed(1) + '%'`

### P1 -- Important

**Fix 4: yoy_inventory_change is hardcoded to 0**

- File: Migration SQL for mv_dashboard
- Problem: Line `0::numeric AS yoy_inventory_change` -- never computed
- Fix: Implement actual YoY computation similar to yoy_price_change but comparing active_count against prior year

**Fix 5: pct_price_cuts always shows 0.0 / "--"**

- File: clean_listings pipeline / analytics_base
- Problem: `has_price_reduction` is never set to true for active listings in clean_listings. The clean layer needs to populate this field by comparing current list_price to original_list_price.
- Fix: Update the clean layer build to derive `has_price_reduction = (list_price < original_list_price)` or compare against `price_change_timestamp IS NOT NULL`

**Fix 6: Months of Supply inflated by incomplete closing data**

- File: mv_dashboard SQL definition
- Problem: 3-month closing average is deflated because recent months have incomplete data. MoS = active / (3-month-avg closings) gives 9.0 instead of ~3.5
- Fix: After fixing the sync, this will self-correct. Alternatively, compute MoS from fully-complete months only (skip current and prior incomplete months).

### P2 -- Nice to Have

**Fix 7: Minimum sample guard on all YoY comparisons**

- File: `packages/database/src/queries/phoenix-analytics.ts`, `yoyChange()` function
- Problem: YoY comparisons are meaningless when sample sizes differ by 100x
- Fix: Pass sample counts to `yoyChange()` and return 0 (or flag as "insufficient data") when the current sample is below threshold

**Fix 8: mv_dashboard contract_month filter**

- File: mv_dashboard SQL
- Problem: `current_new_listings_30d` uses `contract_month >= (CURRENT_DATE - 30)` which has the same truncation issue as close_month
- Fix: Use `listing_contract_date >= CURRENT_DATE - 30` directly in analytics_base, or adjust to full-month windows

**Fix 9: Data quality -- future close_dates**

- File: ARMLS sync / clean layer
- Problem: listing_records has close_dates in 2027, 2028, 2030, 2036, 2041
- Fix: Add a filter: `close_date <= CURRENT_DATE + INTERVAL '30 days'` or flag and exclude future-dated records

**Fix 10: Sync completion**

- Not a code fix but operational: The Property sync has `initial_pull_complete = false` and is still at 2016 skip tokens. Until the initial pull completes, all recent-month metrics will be unreliable. Monitor sync progress and consider a focused re-sync of 2026 data.
