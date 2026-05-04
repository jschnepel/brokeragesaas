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

{% macro property_segments() %}
  SELECT 'residential' AS property_segment UNION ALL
  SELECT 'land'                            UNION ALL
  SELECT 'all'
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
    WHEN {{ dom_col }} <=   7 THEN '0-7'
    WHEN {{ dom_col }} <=  14 THEN '8-14'
    WHEN {{ dom_col }} <=  30 THEN '15-30'
    WHEN {{ dom_col }} <=  60 THEN '31-60'
    WHEN {{ dom_col }} <=  90 THEN '61-90'
    WHEN {{ dom_col }} <= 180 THEN '91-180'
    WHEN {{ dom_col }} >  180 THEN '180+'
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
