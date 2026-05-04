{{ config(materialized='table', tags=['intermediate','calendar']) }}

-- One row per month from 2011-01 to current month + 1.
-- Joined by every monthly mart via dim_calendar to guarantee zero gaps.

WITH spine AS (
  {{ calendar_spine_monthly(var('calendar_start')) }}
)
SELECT
  month,
  EXTRACT(YEAR  FROM month)::INT  AS year,
  EXTRACT(MONTH FROM month)::INT  AS month_of_year,
  EXTRACT(QUARTER FROM month)::INT AS quarter,
  CASE EXTRACT(MONTH FROM month)
    WHEN 1 THEN 'Jan' WHEN 2 THEN 'Feb' WHEN 3 THEN 'Mar' WHEN 4 THEN 'Apr'
    WHEN 5 THEN 'May' WHEN 6 THEN 'Jun' WHEN 7 THEN 'Jul' WHEN 8 THEN 'Aug'
    WHEN 9 THEN 'Sep' WHEN 10 THEN 'Oct' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dec'
  END AS month_label,
  month::DATE AS month_first_date,
  (DATE_TRUNC('month', month) + INTERVAL '1 month' - INTERVAL '1 day')::DATE AS month_last_date
FROM spine
