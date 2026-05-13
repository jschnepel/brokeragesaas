# Data Backlog — Asks for the dbt team

Two data-shape compromises were accepted to ship the weekly + monthly
market-reports cadence (commit `4000dcd`). Both are out-of-scope for
the yong2 web app; both want a dbt-side schema change before yong2
can promise the corresponding UI.

This file is the canonical record of those asks. Link to it in any
follow-up Slack thread or PR description so the engineering and
analytics sides share the same definition of "done."

---

## 1. Weekly market-pulse mart

**Ask:** Add `fct_market_pulse_metro_weekly` (and any community/region
splits the dashboards consume) so the weekly cadence can ship the
same stat suite as monthly.

**Why it matters now:** `lib/market-reports.ts` `getWeeklyStats()`
returns *only* new-listing cadence because `fct_listing_pace` is the
only weekly-granular mart in the feed. Every other weekly tile —
median PPSF, median DOM, closed volume, closings count — is
unavailable. As a result, `components/market-reports/WeeklyReport.tsx`
renders **four** tiles (new-listings + 4wk avg + 52wk avg + period
bounds), versus the monthly template's **six** (PPSF, DOM, closings,
volume, new-listings sum, months supply).

The product-side rename "The Market Desk → Weekly Inventory Pulse" is
a holding pattern that makes the thinness *intentional* rather than
*missing*. The right long-term fix is the data.

**Acceptance for the dbt change:**

- New mart `fct_market_pulse_metro_weekly` published to the
  CloudFront feed at `https://d12v6de1xwcjhk.cloudfront.net/`.
- Row shape mirrors `fct_market_pulse_metro` with `week` replacing
  `month`:
  - `scope_type`, `scope_key`, `property_segment` (filterable)
  - `week` — ISO 8601 week-start date (Monday)
  - `median_ppsf`, `median_dom`, `total_volume`, `closing_count`,
    `p10_close`, `p90_close`
  - `sample_12mo`, `confidence` — same coverage gating as monthly
- Confidence gating recommended at `cohort_size >= 30` for ppsf
  (luxury at $5M+ tier gets noisy below that), `>= 50` for DOM. Weeks
  below threshold should emit nulls rather than a low-confidence row.
- Community + region splits are NICE TO HAVE but not blocking.
  Phoenix-metro weekly alone unlocks the bulk of the UI.

**Worth a conversation first:** weekly medians at $5M+ may be too
noisy to ship even with a `confidence` flag. The dbt team likely kept
those at monthly grain on purpose. A 10-minute call before assuming
it's a defect is the right move.

**Yong2 work to follow:** wire the new mart into
`getWeeklyStats()`, expand `WeeklyReport.tsx`'s tile grid to match
monthly, and revisit the "weekly is supply-only" framing copy.

---

## 2. Three-band luxury price tier

**Ask:** Split the `5m_plus` price band in `fct_active_by_pricetier`
into `5m_10m` and `10m_plus`.

**Why it matters now:** The legacy quarterly editorial copy leaned
hard on the $10M+ band — "Bespoke; representation-driven; ~⅓ of
trades close off-market, never publicly listed" — as a strategic
anchor for Yong's positioning. The current
`components/market-reports/TierBreakdown.tsx` renders only `$3M-$5M`
and `$5M+` (two bands) because that's the granularity dbt emits. The
$10M+ narrative is gone.

**Acceptance for the dbt change:**

- `fct_active_by_pricetier` rows for `scope_type='metro'`,
  `scope_key='phoenix_metro'`, `property_segment='all'` include three
  luxury bands: `3m_5m`, `5m_10m`, `10m_plus`. The existing band
  `5m_plus` is retired or kept as an aggregate.
- Same column shape (`price_band`, `active_count`, `median_dom`,
  `median_ppsf`, `mean_list_price`).
- If the canonical band-order constant in dbt is shared with other
  consumers (`/phoenix/pricing` uses it via `PRICE_BAND_ORDER`),
  coordinate the rename so existing pages don't suddenly grow an
  extra column overnight without UI changes on their side.

**Yong2 work to follow:** add the third band to `LUXURY_BANDS` in
`lib/market-reports.ts`, extend `tierCommentary()` with $10M+
language, and adjust `TierBreakdown.tsx` to render three cards (the
current `md:grid-cols-2` becomes `md:grid-cols-3`).

---

## Future weekly-rename signal

If the dbt team confirms a weekly PPSF/DOM mart is not coming (or
needs a quarter+ to ship), the right web-side response is to rename
"The Market Desk" to **"Weekly Inventory Pulse"** so the product
copy matches what the data can support. The rename is a three-string
edit:

- `components/market-reports/WeeklyReport.tsx` — kicker text
- `app/market-reports/page.tsx` — `HeroBlock` weekly kicker
- `app/market-reports/[slug]/page.tsx` — `generateMetadata` weekly
  `title` + `openGraph.title`

Search-Console redirects from "Market Desk" pages aren't needed; URL
paths don't change.
