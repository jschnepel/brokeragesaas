{{ config(materialized=('external' if target.name == 'prod' else 'table')) }}

-- Per-scope split of fct_pricereduction. The unified table stays in
-- /tmp/dbt-prod.duckdb but isn't written to S3 — clients read this
-- per-scope file for sub-100ms cold fetches.

SELECT *
FROM {{ ref('fct_pricereduction') }}
WHERE scope_type = 'zipcode'
