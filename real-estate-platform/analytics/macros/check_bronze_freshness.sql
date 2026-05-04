{# Custom source freshness check for bronze layer.

   Standard `dbt source freshness` doesn't work against S3 NDJSON/Parquet globs;
   instead each bronze writer writes a _freshness.json marker, and this macro
   checks the staleness of EACH bronze pipeline on dbt run start.

   Pipelines checked:
     1. bronze/parquet/  — rlsir-armls-parquet-export Lambda (rate(4h), per-run snapshots)
                           This is the PRIMARY analytics source as of 2026-05-04.
     2. bronze/listings/ — legacy NDJSON.gz from rlsir-armls-sync dual-write.
                           Soft (warn-only) — the sporadic write cadence
                           (depends on whether sync does delta or full walk)
                           makes hard staleness checking unreliable.
   #}

{% macro check_bronze_freshness(warn_hours=6, error_hours=12) %}
  {% if execute %}
    {{ _check_one_freshness('bronze/parquet/_freshness.json',  'last_export_at',
                            warn_hours, error_hours, severity='error') }}
    {{ _check_one_freshness('bronze/listings/_freshness.json', 'last_sync_at',
                            warn_hours * 4, error_hours * 4, severity='warn') }}
  {% endif %}
{% endmacro %}

{% macro _check_one_freshness(s3_key, ts_field, warn_hours, error_hours, severity='error') %}
  {% set query %}
    SELECT
      {{ ts_field }}::TIMESTAMP AS last_at,
      EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - {{ ts_field }}::TIMESTAMP)) / 3600.0 AS staleness_hours
    FROM read_json_auto(
      's3://rlsir-platform-assets-us-east-1/{{ s3_key }}'
    )
  {% endset %}

  {% set result = run_query(query) %}
  {% if result and result.rows %}
    {% set staleness = result.rows[0][1] | float %}
    {% if staleness > error_hours and severity == 'error' %}
      {{ exceptions.raise_compiler_error(
          "BRONZE STALE [" ~ s3_key ~ "]: " ~ staleness ~ " hours since last write (error threshold: " ~ error_hours ~ "h)"
      ) }}
    {% elif staleness > warn_hours %}
      {{ log("WARNING: " ~ s3_key ~ " is " ~ staleness ~ "h stale (warn threshold: " ~ warn_hours ~ "h)", info=True) }}
    {% else %}
      {{ log("Bronze freshness OK [" ~ s3_key ~ "]: " ~ staleness ~ "h ago", info=True) }}
    {% endif %}
  {% else %}
    {{ log("WARNING: Could not read " ~ s3_key ~ " — writer may not have run yet", info=True) }}
  {% endif %}
{% endmacro %}
