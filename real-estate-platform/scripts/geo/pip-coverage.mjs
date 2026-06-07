// real-estate-platform/scripts/geo/pip-coverage.mjs
// Reports community-assignment coverage from the built DuckDB analytics db.
// Run AFTER `dbt build` so the intermediate tables exist locally.
import { DuckDBInstance } from '@duckdb/node-api';

const DB = 'real-estate-platform/analytics/_local_output/rlsir_analytics_dev.duckdb';

const instance = await DuckDBInstance.create(DB, { access_mode: 'READ_ONLY' });
const conn = await instance.connect();

for (const model of ['int_listings_active_cleaned', 'int_listings_geographic_enriched']) {
  const reader = await conn.runAndReadAll(`
    SELECT
      COUNT(*) AS total,
      COUNT(community_pip_slug) AS pip_assigned,
      COUNT(community_unified_slug) AS unified_assigned,
      ROUND(100.0 * COUNT(community_pip_slug) / COUNT(*), 1) AS pip_pct,
      ROUND(100.0 * COUNT(community_unified_slug) / COUNT(*), 1) AS unified_pct
    FROM ${model}
  `);
  const r = reader.getRowObjects()[0];
  console.log(`\n${model}`);
  console.log(`  total=${r.total} pip=${r.pip_assigned} (${r.pip_pct}%) unified=${r.unified_assigned} (${r.unified_pct}%)`);
}
