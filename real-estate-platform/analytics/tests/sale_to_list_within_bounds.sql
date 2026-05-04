-- Returns rows = test FAILS.
-- After silver cleaning, no fct_closings row should have an out-of-bounds ratio.

SELECT listing_key, close_price, list_price, sale_to_list_ratio
FROM {{ ref('fct_closings') }}
WHERE sale_to_list_ratio NOT BETWEEN 0.4 AND 2.5
