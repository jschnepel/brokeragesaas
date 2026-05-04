import type { DataCoverage } from '@/content/market-reports';

type MethodologySectionProps = {
  trend: DataCoverage[];
  medians: DataCoverage[];
  /**
   * Inventory-age coverage — only present on the latest report. The MV
   * (`mv_inventory_age`) carries a single live snapshot, so historical
   * reports cannot back-date it without misrepresenting the cohort.
   */
  inventoryAge?: DataCoverage[];
};

/**
 * Methodology footnote — one block per chart with data-source notes
 * plus any communities that were excluded from a chart due to insufficient
 * sample.
 *
 * Renders dim and small below the report body. Designed so a careful
 * reader can understand WHY a community is missing from a chart.
 */
export function MethodologySection({
  trend,
  medians,
  inventoryAge,
}: MethodologySectionProps) {
  const trendExcluded = trend.filter((c) => c.status !== 'sufficient');
  const mediansExcluded = medians.filter((c) => c.status !== 'sufficient');
  const inventoryExcluded = (inventoryAge ?? []).filter((c) => c.status !== 'sufficient');

  return (
    <div className="max-w-3xl mx-auto">
      <p className="caps">Methodology</p>
      <h2 className="display-md mt-6 text-stone">
        How the numbers
        <br />
        <em className="font-light">were assembled.</em>
      </h2>
      <dl className="mt-12 space-y-8 text-sm leading-relaxed text-mute">
        <Item
          label="Eight-quarter trend"
          source="True median price-per-sqft computed per community per quarter from analytics_base (residential, $1M+ closes). Communities with fewer than 5 closed transactions in a quarter are excluded from that data point — this prevents a single sale from anchoring a quarterly line."
          excluded={trendExcluded}
        />
        <Item
          label="Active vs closed by price band"
          source="Counts pulled from listing_records: active inventory uses standard_status IN (Active, Active Under Contract, Pending) with the IDX-display flag; closed counts use the target quarter's close_date range. Both restricted to Yong's service-area cities."
        />
        <Item
          label="Per-sqft medians + YoY"
          source="Trailing-12-month avg_ppsf from mv_community_scorecard with yoy_price_change_pct comparing the most-recent year vs the year prior. Communities with fewer than 5 closes in the trailing window are excluded."
          excluded={mediansExcluded}
        />
        <Item
          label="Supply vs demand"
          source="Monthly new_listings + closed_sales from mv_supply_demand, summed across the curated community + region scopes. Window: trailing 12 months ending at quarter close."
        />
        {inventoryAge && (
          <Item
            label="Inventory age (current snapshot)"
            source="Live counts from mv_inventory_age (month='current') segmented into 0-30 / 31-60 / 61-90 / 91-180 / 180+ days-on-market buckets. Reflects the moment of last MV refresh — current snapshot — and is therefore only shown on the latest report."
            excluded={inventoryExcluded}
          />
        )}
        <Item
          label="Headline stats"
          source="All quarter-window stats (median sale, count, DOM, top sale) sourced from listing_records with the same Yong cities + $3M+ filter; YoY and months-of-supply pulled from mv_community_scorecard 'region/north-scottsdale/residential'."
        />
      </dl>
    </div>
  );
}

function Item({
  label,
  source,
  excluded,
}: {
  label: string;
  source: string;
  excluded?: DataCoverage[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3 md:gap-8 border-t border-[color:var(--hairline)] pt-6">
      <dt className="caps text-[10px] text-stone">{label}</dt>
      <dd className="text-mute">
        <p>{source}</p>
        {excluded && excluded.length > 0 && (
          <p className="mt-3 text-[12px] opacity-80">
            Excluded this quarter:&nbsp;
            {excluded
              .map((c) =>
                c.status === 'missing'
                  ? `${c.community} (no closed transactions)`
                  : `${c.community} (n=${c.sampleSize}, threshold ${c.threshold})`,
              )
              .join('; ')}
            .
          </p>
        )}
      </dd>
    </div>
  );
}
