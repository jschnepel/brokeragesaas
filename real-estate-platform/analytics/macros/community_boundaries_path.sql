{% macro community_boundaries_path() %}
  {#- Filesystem path to the cleaned curated community polygon GeoJSON
      (seeds/geo/community_boundaries.geojson), read via ST_Read in
      stg_geo__community_boundaries.

      Resolves per environment:
        - prod / fargate-prod: baked into the image at DBT_PROJECT_DIR
          (/opt/analytics) — use the absolute in-container path.
        - dev / ci: the project's own directory on disk.

      Overridable via `--vars '{community_boundaries_path: <abs path>}'`.
      `project-dir` is exposed by dbt-duckdb at runtime; we anchor to it so the
      path is correct whether dbt runs from the project root (dev) or after the
      entrypoint chdir's to /tmp (prod). -#}
  {#- Resolution order:
        1. explicit --vars override (local dev convenience)
        2. DBT_PROJECT_DIR env (set to /opt/analytics in the Fargate image;
           the entrypoint chdir's to /tmp at runtime so a relative path would
           break — this absolute env var is the reliable anchor in prod)
        3. dbt's own project-dir flag value as a last resort -#}
  {%- set override = var('community_boundaries_path', none) -%}
  {%- if override -%}
    {{- override -}}
  {%- else -%}
    {{- env_var('DBT_PROJECT_DIR', '.') ~ '/seeds/geo/community_boundaries.geojson' -}}
  {%- endif -%}
{% endmacro %}
