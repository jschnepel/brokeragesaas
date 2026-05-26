{{ config(materialized=('external' if target.name == 'prod' or target.name == 'fargate-prod' else 'table')) }}
-- Community-grained split — ~500K rows after the active-community filter
-- (>=6 closes in trailing 12 months). Cold-fetched ONLY when a community
-- filter is active; the metro/region splits handle the rest of /phoenix.
SELECT *
FROM {{ ref('fct_market_pulse_by_pricetier') }}
WHERE scope_type = 'community'
