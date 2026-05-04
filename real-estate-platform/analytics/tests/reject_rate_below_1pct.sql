-- Returns rows = test FAILS.
-- Asserts that silver doesn't reject more than 1% of bronze closed listings.
-- If reject rate spikes, something changed in source data quality.

WITH bronze_count AS (
  SELECT COUNT(*) AS n
  FROM {{ ref('stg_armls__listing_records') }}
  WHERE standard_status = 'Closed'
    AND county = 'Maricopa'
),
silver_count AS (
  SELECT COUNT(*) AS n
  FROM {{ ref('int_listings_closed_cleaned') }}
  WHERE county = 'Maricopa'
)
SELECT
  bronze_count.n AS bronze_n,
  silver_count.n AS silver_n,
  ROUND(100.0 * (bronze_count.n - silver_count.n) / bronze_count.n, 2) AS reject_pct
FROM bronze_count, silver_count
WHERE 100.0 * (bronze_count.n - silver_count.n) / bronze_count.n > 1.0
