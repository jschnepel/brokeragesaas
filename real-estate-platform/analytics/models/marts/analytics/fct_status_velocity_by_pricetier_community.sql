{{ config(materialized=('external' if target.name == 'prod' or target.name == 'fargate-prod' else 'table'), enabled=(var('enable_active', false))) }}
SELECT *
FROM {{ ref('fct_status_velocity_by_pricetier') }}
WHERE scope_type = 'community'
