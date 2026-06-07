{# Calendar spine macro — generates one row per month from start_date to today.
   Used by every monthly time-series mart to guarantee gap-free coverage. #}

{% macro calendar_spine_monthly(start_date='2011-01-01') %}
  SELECT DATE_TRUNC('month', d::DATE) AS month
  FROM range(
    DATE '{{ start_date }}',
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '{{ var("calendar_end_offset_months", 1) }} month',
    INTERVAL '1 month'
  ) t(d)
{% endmacro %}

{# Property segment dimension — RESO PropertyType-aligned 7-bucket taxonomy.
   Source: https://ddwiki.reso.org/display/DDW17/PropertyType+Field

   Each of these segments is queryable independently AND aggregable. The first
   5 ('residential', 'land', 'rental', 'commercial', 'multi_family') are MUTUALLY
   EXCLUSIVE row-segments — every row in a cleaned listing model maps to exactly
   one of them. The last 2 ('for_sale', 'all') are AGGREGATE segments — they UNION
   over the row-segments when a mart filter says 'for_sale' or 'all'.

   Why both? Universal pattern from Redfin/Zillow/Realtor.com: rentals must
   NEVER be averaged into sale medians (different units of measure — monthly rent
   vs sale price). 'for_sale' = the four for-sale row segments; 'all' = literal
   everything including rentals, kept for completeness only. Default dashboard
   segment should be 'residential' or 'for_sale', never 'all'. #}

{# Property segment dimension — RESO PropertyType-aligned 7-bucket taxonomy.
   Source: https://ddwiki.reso.org/display/DDW17/PropertyType+Field

   Each of these segments is queryable independently AND aggregable. The first
   5 ('residential', 'land', 'rental', 'commercial', 'multi_family') are MUTUALLY
   EXCLUSIVE row-segments — every row in a cleaned listing model maps to exactly
   one of them. The last 2 ('for_sale', 'all') are AGGREGATE segments — they UNION
   over the row-segments when a mart filter says 'for_sale' or 'all'.

   Pre-aggregated in marts via segment_includes() — runs on Fargate where
   memory headroom allows the full 7-segment × 5-scope CROSS JOIN. #}

{% macro property_segments() %}
  SELECT 'residential'  AS property_segment UNION ALL  -- RESI: SFR + Condo + Townhouse for sale
  SELECT 'land'                              UNION ALL  -- LAND: vacant parcels
  SELECT 'rental'                            UNION ALL  -- RLSE + COML: leases
  SELECT 'commercial'                        UNION ALL  -- COMS + BUSO: commercial sale + business opportunity
  SELECT 'multi_family'                      UNION ALL  -- RINC + Multiple Dwellings: investor-grade income
  SELECT 'for_sale'                          UNION ALL  -- aggregate: residential + land + commercial + multi_family
  SELECT 'all'                                          -- aggregate: literal everything (incl rental)
{% endmacro %}

{# Mapping macro — single source of truth for converting ARMLS property_type
   strings to a segment bucket. Used by stg_armls__active_listings (which has
   raw ARMLS property_type) and int_listings_closed_cleaned. Keeps both in
   sync — change here, regenerated for both. #}

{% macro property_type_to_segment(property_type_col) %}
  CASE
    WHEN {{ property_type_col }} = 'Residential'                                                    THEN 'residential'
    WHEN {{ property_type_col }} = 'Land'                                                           THEN 'land'
    WHEN {{ property_type_col }} IN ('Residential Lease', 'Comm/Industry Lease')                    THEN 'rental'
    WHEN {{ property_type_col }} IN ('Comm/Industry Sale', 'Business Opportunity')                  THEN 'commercial'
    WHEN {{ property_type_col }} IN ('Multiple Dwellings', 'Residential Income', 'Farm/Ranch')      THEN 'multi_family'
    ELSE 'residential'  -- unknown property_types default to residential per RESO convention
  END
{% endmacro %}

{# Aggregation predicate — given a query-time segment filter, return the SQL
   predicate that includes the right row-segments. This is what mart CTEs use
   when filtering `WHERE seg_filter(s) ON row_segment`. Centralizing the logic
   means 'for_sale' definition can evolve without sweeping every mart. #}

{% macro segment_includes(filter_col, row_segment_col) %}
  (
       {{ filter_col }} = 'all'
    OR {{ filter_col }} = {{ row_segment_col }}
    OR ({{ filter_col }} = 'for_sale' AND {{ row_segment_col }} IN ('residential', 'land', 'commercial', 'multi_family'))
  )
{% endmacro %}

{# Price tier — universal Compass/Coldwell/Christie's segmentation overlay.
   Independent of property_segment; a luxury condo and a luxury SFR both fall
   in the same tier. Applied to fct_closings as `price_tier` column for tier-
   level analytics ($1M+ market doing X, $10M+ market doing Y). #}

{% macro price_tier(price_col) %}
  CASE
    WHEN {{ price_col }} IS NULL                THEN NULL
    WHEN {{ price_col }} <  1000000             THEN 'under_1m'
    WHEN {{ price_col }} <  3000000             THEN '1m_3m'
    WHEN {{ price_col }} < 10000000             THEN '3m_10m'
    ELSE                                              '10m_plus'
  END
{% endmacro %}

{# Median outlier filter — Redfin convention: drop sale-to-list ratio rows
   outside [0.5, 2.0] when computing sale-to-list aggregations. Bright MLS
   convention: drop DOM > 365 from median DOM. Apply at the metric level, not
   the row level (keeps the underlying fact row honest). #}

{% macro is_valid_for_ratio_metric(close_col, list_col) %}
  (
    {{ close_col }} IS NOT NULL AND {{ list_col }} IS NOT NULL
    AND {{ list_col }} > 0
    AND ({{ close_col }}::DOUBLE / {{ list_col }}) BETWEEN 0.5 AND 2.0
  )
{% endmacro %}

{% macro is_valid_for_dom_metric(dom_col) %}
  ({{ dom_col }} IS NOT NULL AND {{ dom_col }} BETWEEN 0 AND 365)
{% endmacro %}

{# Tighter DOM filter — "fresh market tempo". Excludes anything sitting beyond
   180 days, which industry research says is no longer representative of
   current selling pace. Pair with is_valid_for_dom_metric for transparency:
   publish both medians side-by-side so users can see how much the long-tail
   moved the headline. #}
{% macro is_valid_for_dom_typical(dom_col) %}
  ({{ dom_col }} IS NOT NULL AND {{ dom_col }} BETWEEN 0 AND 180)
{% endmacro %}

{# $/sqft trim — Bright MLS convention: drop top/bottom 1.5% before computing
   medians. In DuckDB we can't do percentile-based trim cleanly inside an
   aggregate's FILTER clause (correlated window). Instead, apply hard floor +
   ceiling that captures 99% of real Phoenix-metro values:
     floor $50/sqft — below this is manufactured/auction artifact
     ceiling $5000/sqft — above this is data error (highest ARMLS legit ppsf
     observed is ~$3,800 for ultra-luxury Paradise Valley estates).
   For ultra-precise per-scope trimming we'd need a two-pass query; punt on
   that until we see the trim materially shift a headline metric. #}
{% macro is_within_ppsf_trim(ppsf_col) %}
  ({{ ppsf_col }} IS NOT NULL AND {{ ppsf_col }} BETWEEN 50 AND 5000)
{% endmacro %}

{# Confidence + auto-widening window helper. Picks the narrowest time window
   that has n >= min_threshold sample. Returns NULL when the widest window
   still doesn't clear the floor. UI binds to confidence band + window_used to
   present "based on T3M" / "based on T24M / insufficient data".

   Industry baseline: ≥30 = high, 10-29 = medium, 5-9 = low, <5 = suppress.
   Per NAR/Realtor.com/Bright thresholds. #}

{% macro confidence_band_strict(count_col) %}
  CASE
    WHEN {{ count_col }} IS NULL OR {{ count_col }} = 0 THEN 'none'
    WHEN {{ count_col }} <  5  THEN 'insufficient'
    WHEN {{ count_col }} < 10  THEN 'low'
    WHEN {{ count_col }} < 30  THEN 'medium'
    ELSE                            'high'
  END
{% endmacro %}

{% macro confidence_band(count_col) %}
  CASE
    WHEN {{ count_col }} IS NULL OR {{ count_col }} = 0 THEN 'none'
    WHEN {{ count_col }} <  10 THEN 'very_low'
    WHEN {{ count_col }} <  30 THEN 'low'
    WHEN {{ count_col }} < 100 THEN 'medium'
    ELSE 'high'
  END
{% endmacro %}

{% macro clean_subdivision(col) %}
  CASE
    WHEN {{ col }} IN ('Metes and Bounds', 'No Subdivision', 'NONE', 'N/A', '') THEN NULL
    ELSE NULLIF(TRIM({{ col }}), '')
  END
{% endmacro %}

{% macro dom_band(dom_col) %}
  CASE
    -- Surface NULL as 'Unknown' rather than silently miscategorizing into
    -- '0-7'. Spark hides DaysOnMarket on actives (Core.Permissions gate),
    -- so the prior NULL→'0-7' mapping inflated the freshest bucket to
    -- ~70% of all inventory. Callers should extend their COALESCE chain
    -- to derive DOM from on_market_date / listing_contract_date /
    -- original_entry_timestamp so NULLs become rare. Any remaining
    -- NULLs are explicit data gaps that belong in 'Unknown'.
    WHEN {{ dom_col }} IS NULL    THEN 'Unknown'
    WHEN {{ dom_col }} <=   7     THEN '0-7'
    WHEN {{ dom_col }} <=  14     THEN '8-14'
    WHEN {{ dom_col }} <=  30     THEN '15-30'
    WHEN {{ dom_col }} <=  60     THEN '31-60'
    WHEN {{ dom_col }} <=  90     THEN '61-90'
    WHEN {{ dom_col }} <= 180     THEN '91-180'
    WHEN {{ dom_col }} >  180     THEN '180+'
  END
{% endmacro %}

{% macro is_valid_close(close_date_col, close_price_col, list_price_col) %}
  (
    {{ close_date_col }} IS NOT NULL
    AND {{ close_date_col }} BETWEEN DATE '1990-01-01' AND CURRENT_DATE + INTERVAL '30 days'
    AND {{ close_price_col }} BETWEEN {{ var('min_close_price') }} AND {{ var('max_close_price') }}
    AND {{ list_price_col }}  BETWEEN {{ var('min_list_price')  }} AND {{ var('max_list_price') }}
    AND {{ close_price_col }}::DOUBLE / {{ list_price_col }} BETWEEN {{ var('min_ratio') }} AND {{ var('max_ratio') }}
  )
{% endmacro %}
