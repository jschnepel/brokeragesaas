{# Single source of truth for the scope ladder used by every chart-feeding
   mart. Returns the list as a Jinja value so individual marts can iterate it
   to build per-scope CTEs.

     metro       — phoenix_metro                            (1 key)
     region      — region_slug from polygon                 (~13 keys, fully covered)
     community   — community_unified_slug — polygon
                   with subdivision_canonical_map fallback  (~95% coverage)
     subdivision — subdivision_slug — finest grain          (every recognized subdivision)
     zipcode     — postal_code                              (~426 keys)

   Each entry has:
     name             — Jinja-side identifier for CTE naming
     group_col        — SQL expression to use as scope_key (alias passed in)
     scope_type_lit   — single-quoted SQL literal for scope_type
     where            — additional row filter, ANDed into the JOIN. Used to
                        exclude listings missing the scope dimension.

   `alias` parameter (default 'c'): the table alias the calling mart uses for
   the row source (fct_closings → 'c'; int_listings_active_cleaned → 'a';
   etc). All non-metro entries reference the alias to qualify the column. #}

{% macro scope_dimensions(alias='c') %}
  {%- set dims = [
    {'name': 'metro',       'group_col': "'phoenix_metro'",                       'scope_type_lit': "'metro'",       'where': "TRUE"},
    {'name': 'region',      'group_col': alias ~ '.region_slug',                  'scope_type_lit': "'region'",      'where': alias ~ '.region_slug IS NOT NULL'},
    {'name': 'community',   'group_col': alias ~ '.community_unified_slug',       'scope_type_lit': "'community'",   'where': alias ~ '.community_unified_slug IS NOT NULL'},
    {'name': 'subdivision', 'group_col': alias ~ '.subdivision_slug',             'scope_type_lit': "'subdivision'", 'where': alias ~ '.subdivision_slug IS NOT NULL'},
    {'name': 'zipcode',     'group_col': alias ~ '.postal_code',                  'scope_type_lit': "'zipcode'",     'where': alias ~ '.postal_code IS NOT NULL'},
  ] -%}
  {{- return(dims) -}}
{% endmacro %}
