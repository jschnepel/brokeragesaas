{% macro latest_bronze_path(table_name) %}
  {#- Returns the s3:// URI of the latest snapshot for `table_name` from
      bronze/parquet/_freshness.json. Used by stg_armls__* models to read
      only the most recent run's full snapshot — no need to glob+dedupe across
      every historical run, which OOMs on 1.84M-row listing_records.

      Usage in a model:
        SELECT * FROM read_parquet('{{ latest_bronze_path("listing_records") }}',
                                   union_by_name=true)

      Compile-time resolved via run_query() so the path is baked into the SQL
      sent to DuckDB. Falls back to the legacy glob if freshness.json is
      missing (initial setup, before any export Lambda fire). -#}

  {%- set freshness_url = 's3://rlsir-platform-assets-us-east-1/bronze/parquet/_freshness.json' -%}

  {%- set query -%}
    SELECT
      tbl.s3_path AS path
    FROM read_json('{{ freshness_url }}'),
         UNNEST(tables) AS u(tbl)
    WHERE tbl.table = '{{ table_name }}'
      AND tbl.status = 'success'
    LIMIT 1
  {%- endset -%}

  {%- if execute -%}
    {%- set results = run_query(query) -%}
    {%- if results and results.rows | length > 0 -%}
      {{- results.rows[0][0] -}}
    {%- else -%}
      {#- Fallback: legacy glob across all runs (will OOM at scale, but works for
          small tables / first-time runs before freshness.json is populated). -#}
      s3://rlsir-platform-assets-us-east-1/bronze/parquet/{{ table_name }}/sync_year=*/sync_month=*/sync_day=*/run_id=*/data.parquet
    {%- endif -%}
  {%- else -%}
    {#- During parse, run_query is not available; emit a placeholder. -#}
    s3://rlsir-platform-assets-us-east-1/bronze/parquet/{{ table_name }}/_pending.parquet
  {%- endif -%}
{% endmacro %}
