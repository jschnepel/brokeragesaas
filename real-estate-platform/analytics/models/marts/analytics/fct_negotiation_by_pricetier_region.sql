{{ config(materialized=('external' if target.name == 'prod' or target.name == 'fargate-prod' else 'table')) }}
SELECT *
FROM {{ ref('fct_negotiation_by_pricetier') }}
WHERE scope_type = 'region'
