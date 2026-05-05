"""Verify dbt mart values match direct RDS aggregations.

For each mart, read the Parquet from S3, pick a few measurable rows, then
re-compute the same aggregation directly from RDS using the master DSN.
Report diffs.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

import duckdb

AWS = r"C:\Program Files\Amazon\AWSCLIV2\aws.exe"


def get_param(name: str, decrypt: bool = False) -> str:
    args = [AWS, "ssm", "get-parameter", "--name", name]
    if decrypt:
        args.append("--with-decryption")
    args += ["--region", "us-east-1", "--query", "Parameter.Value", "--output", "text"]
    return subprocess.check_output(args, env={**os.environ, "MSYS_NO_PATHCONV": "1"}, text=True).strip()


def main() -> None:
    rds_url = get_param("/rlsir/db/url", decrypt=True)
    print("Connecting to RDS via DuckDB postgres extension...", flush=True)

    con = duckdb.connect(":memory:")
    con.execute("INSTALL httpfs; LOAD httpfs;")
    con.execute("INSTALL postgres; LOAD postgres;")
    # S3 credentials via the AWS default credential chain (~/.aws/credentials etc.)
    con.execute("CREATE OR REPLACE SECRET s3_secret (TYPE S3, PROVIDER credential_chain, REGION 'us-east-1')")
    con.execute(f"ATTACH '{rds_url}' AS rds (TYPE postgres, READ_ONLY)")

    bucket = "s3://rlsir-platform-assets-us-east-1/analytics"

    print("\n========== fct_market_pulse: scope coverage (NEW multi-scope build) ==========")
    scope_dist = con.execute(f"""
        SELECT scope_type, property_segment,
               COUNT(*) AS rows,
               COUNT(DISTINCT scope_key) AS distinct_scope_keys,
               MIN(month) AS earliest_month,
               MAX(month) AS latest_month
        FROM read_parquet('{bucket}/fct_market_pulse.parquet')
        GROUP BY 1, 2
        ORDER BY 1, 2
    """).df()
    print(scope_dist.to_string())

    # ========================================
    # CROSS-CHECK metro/all/2026-04 against direct RDS query
    # ========================================
    print("\n========== ACCURACY CHECK: 2026-04 metro/all closings ==========")
    print("\n(a) From mart:")
    mart_row = con.execute(f"""
        SELECT closing_count, median_close, median_ppsf, median_dom,
               p10_close, p90_close, total_volume
        FROM read_parquet('{bucket}/fct_market_pulse.parquet')
        WHERE scope_type='metro' AND scope_key='phoenix_metro'
          AND property_segment='all' AND month='2026-04-01'
    """).df()
    print(mart_row.to_string())

    print("\n========== REGION SAMPLE: 2026-04 north-scottsdale residential ==========")
    print("\n(a) Top 5 regions by 2026-04 closing_count:")
    top_regions = con.execute(f"""
        SELECT scope_key, closing_count, median_close, median_dom
        FROM read_parquet('{bucket}/fct_market_pulse.parquet')
        WHERE scope_type='region' AND property_segment='all' AND month='2026-04-01'
        ORDER BY closing_count DESC NULLS LAST
        LIMIT 5
    """).df()
    print(top_regions.to_string())

    print("\n(b) Cross-check: top region from RDS raw (count by region_slug for 2026-04):")
    rds_top = con.execute("""
        SELECT lg.region_slug AS scope_key,
               COUNT(*) AS closing_count,
               PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY r.close_price) AS median_close
        FROM rds.public.listing_records r
        LEFT JOIN rds.public.listing_geography lg ON lg.listing_key = r.listing_key
        WHERE r.standard_status = 'Closed'
          AND r.close_date BETWEEN DATE '2026-04-01' AND DATE '2026-04-30'
          AND r.close_price BETWEEN 1000 AND 1000000000
          AND r.list_price BETWEEN 1000 AND 500000000
          AND r.close_price::DOUBLE / r.list_price BETWEEN 0.4 AND 2.5
          AND lg.region_slug IS NOT NULL
        GROUP BY 1
        ORDER BY 2 DESC
        LIMIT 5
    """).df()
    print(rds_top.to_string())

    print("\n========== COMMUNITY SAMPLE: top 5 communities 2026-04 ==========")
    top_comm = con.execute(f"""
        SELECT scope_key, closing_count, median_close, median_dom
        FROM read_parquet('{bucket}/fct_market_pulse.parquet')
        WHERE scope_type='community' AND property_segment='all' AND month='2026-04-01'
        ORDER BY closing_count DESC NULLS LAST
        LIMIT 5
    """).df()
    print(top_comm.to_string())

    print("\n========== ZIPCODE SAMPLE: top 5 zips 2026-04 ==========")
    top_zip = con.execute(f"""
        SELECT scope_key, closing_count, median_close, median_dom
        FROM read_parquet('{bucket}/fct_market_pulse.parquet')
        WHERE scope_type='zipcode' AND property_segment='all' AND month='2026-04-01'
        ORDER BY closing_count DESC NULLS LAST
        LIMIT 5
    """).df()
    print(top_zip.to_string())

    print("\n(b) Direct from RDS (raw closed listings, same month/segment):")
    rds_row = con.execute("""
        SELECT
          COUNT(*) AS closing_count,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price) AS median_close,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (close_price::DOUBLE / NULLIF(living_area, 0))) AS median_ppsf,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market) AS median_dom,
          PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY close_price) AS p10_close,
          PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY close_price) AS p90_close,
          SUM(close_price) AS total_volume
        FROM rds.public.listing_records
        WHERE standard_status = 'Closed'
          AND close_date BETWEEN DATE '2026-04-01' AND DATE '2026-04-30'
          AND close_price BETWEEN 1000 AND 1000000000
          AND list_price BETWEEN 1000 AND 500000000
          AND close_price::DOUBLE / list_price BETWEEN 0.4 AND 2.5
          AND (living_area IS NULL OR living_area BETWEEN 100 AND 50000)
          AND (days_on_market IS NULL OR days_on_market BETWEEN 0 AND 5000)
    """).df()
    print(rds_row.to_string())

    print("\n========== fct_active_by_pricetier: bands present ==========")
    bands = con.execute(f"""
        SELECT * FROM read_parquet('{bucket}/fct_active_by_pricetier.parquet')
        LIMIT 5
    """).df()
    print("Sample rows:")
    print(bands.to_string(max_colwidth=30))
    print("\nDistinct price bands:")
    distinct_bands = con.execute(f"""
        SELECT DISTINCT price_band FROM read_parquet('{bucket}/fct_active_by_pricetier.parquet')
        ORDER BY price_band
    """).df()
    print(distinct_bands.to_string())

    print("\n========== fct_active_by_pricetier: scope coverage ==========")
    band_scope = con.execute(f"""
        SELECT scope_type, property_segment,
               COUNT(*) AS rows,
               COUNT(DISTINCT scope_key) AS distinct_scope_keys
        FROM read_parquet('{bucket}/fct_active_by_pricetier.parquet')
        GROUP BY 1, 2
        ORDER BY 1, 2
    """).df()
    print(band_scope.to_string())

    # ========================================
    # Coverage matrix: which scope_types each mart supports
    # ========================================
    marts = [
        "fct_active_by_community",
        "fct_active_by_pricetier",
        "fct_active_dom_distribution",
        "fct_active_heatmap_h3",
        "fct_active_inventory",
        "fct_buyer_office",
        "fct_community_scorecard",
        "fct_community_yoy",
        "fct_listing_pace",
        "fct_market_pulse",
        "fct_months_of_supply",
        "fct_negotiation",
        "fct_pricereduction",
        "fct_status_velocity",
    ]

    print("\n========== SCOPE COVERAGE MATRIX ==========")
    print(f"{'mart':<35s} {'metro':>5s} {'region':>6s} {'community':>9s} {'zip':>4s} {'price_band_col':>14s}")
    print("-" * 80)
    for m in marts:
        try:
            sch = con.execute(f"DESCRIBE SELECT * FROM read_parquet('{bucket}/{m}.parquet')").df()
            cols = sch["column_name"].str.lower().tolist()
            has_band_col = any("price_band" in c or "price_tier" in c or "pricetier" in c for c in cols)
            scopes = con.execute(f"""
                SELECT scope_type, COUNT(DISTINCT scope_key) AS k
                FROM read_parquet('{bucket}/{m}.parquet')
                GROUP BY 1
            """).df() if "scope_type" in cols else None
            scope_counts = {}
            if scopes is not None:
                for _, r in scopes.iterrows():
                    scope_counts[r["scope_type"]] = r["k"]
            print(f"{m:<35s} {scope_counts.get('metro', '-'):>5} {scope_counts.get('region', '-'):>6} {scope_counts.get('community', '-'):>9} {scope_counts.get('zipcode', '-'):>4} {'YES' if has_band_col else 'no':>14s}")
        except Exception as e:
            print(f"{m:<35s} ERROR: {e}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"FAIL: {type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(1)
