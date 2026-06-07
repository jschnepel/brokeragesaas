{{ config(materialized=('external' if target.name == 'prod' or target.name == 'fargate-prod' else 'table')) }}
-- Metro-grained split of fct_market_pulse_by_pricetier — ~10K rows.
-- yong2 cold-fetches this for the default unfiltered + price-only filter cases.
SELECT *
FROM {{ ref('fct_market_pulse_by_pricetier') }}
WHERE scope_type = 'metro'
