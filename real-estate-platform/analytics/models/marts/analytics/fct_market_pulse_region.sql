{{ config(materialized=('external' if target.name == 'prod' else 'table')) }}

-- Per-scope split of fct_market_pulse — keeps cold-fetch small for clients
-- that only query one scope_type at a time. The unified fct_market_pulse
-- table stays in /tmp/dbt-prod.duckdb but isn't written to S3.

SELECT *
FROM {{ ref('fct_market_pulse') }}
WHERE scope_type = 'region'
