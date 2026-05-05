{{ config(materialized=('external' if target.name == 'prod' else 'table')) }}

-- Date dimension: every month from 2011-01 through current month + 1.
-- Joined by every monthly fact for guaranteed gap-free time series.

SELECT * FROM {{ ref('int_calendar') }}
