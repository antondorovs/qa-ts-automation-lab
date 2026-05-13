-- Filtering examples for QA database validation

SELECT id, status, created_at
FROM orders
WHERE
    status = 'created';

SELECT id, user_id, total_price
FROM orders
WHERE
    total_price > 100
ORDER BY created_at DESC;

SELECT status, COUNT(*) AS orders_count
FROM orders
GROUP BY
    status
ORDER BY orders_count DESC;

SELECT id, email
FROM users
WHERE
    email IS NULL
    OR email = '';