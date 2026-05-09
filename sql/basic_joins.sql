-- INNER JOIN example

SELECT orders.id, users.name, orders.total_price
FROM orders
    INNER JOIN users ON orders.user_id = users.id;

-- LEFT JOIN example

SELECT users.name, orders.id
FROM users
    LEFT JOIN orders ON users.id = orders.user_id;

-- Orders count by user

SELECT users.name, COUNT(orders.id) AS orders_count
FROM users
    LEFT JOIN orders ON users.id = orders.user_id
GROUP BY
    users.name;