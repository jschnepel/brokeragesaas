{{ config(materialized=('external' if target.name == 'prod' or target.name == 'fargate-prod' else 'table')) }}
-- Region-grained split — ~80K rows. Cold-fetched when a region filter is active.
SELECT *
FROM {{ ref('fct_market_pulse_by_pricetier') }}
WHERE scope_type = 'region'
