-- Environment health checks for QA smoke testing and release readiness.

CREATE TABLE qa_environment_checks (
    id SERIAL PRIMARY KEY,
    environment VARCHAR(40) NOT NULL,
    service_name VARCHAR(80) NOT NULL,
    check_name VARCHAR(120) NOT NULL,
    status VARCHAR(30) NOT NULL,
    response_time_ms INT NOT NULL,
    checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO qa_environment_checks (
    environment,
    service_name,
    check_name,
    status,
    response_time_ms,
    checked_at
) VALUES
('staging', 'api-gateway', 'health endpoint', 'passed', 120, '2026-05-14 09:00:00'),
('staging', 'auth-service', 'login endpoint', 'passed', 240, '2026-05-14 09:01:00'),
('staging', 'users-service', 'database connectivity', 'failed', 980, '2026-05-14 09:02:00'),
('production-like', 'api-gateway', 'health endpoint', 'passed', 90, '2026-05-14 09:03:00'),
('production-like', 'auth-service', 'login endpoint', 'passed', 180, '2026-05-14 09:04:00');

-- Latest status for each service check.
SELECT
    environment,
    service_name,
    check_name,
    status,
    response_time_ms,
    checked_at
FROM (
    SELECT
        checks.*,
        ROW_NUMBER() OVER (
            PARTITION BY environment, service_name, check_name
            ORDER BY checked_at DESC
        ) AS row_number
    FROM qa_environment_checks checks
) latest_checks
WHERE row_number = 1
ORDER BY environment, service_name, check_name;

-- Environments with failed or slow checks.
SELECT
    environment,
    COUNT(*) AS total_checks,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_checks,
    SUM(CASE WHEN response_time_ms > 500 THEN 1 ELSE 0 END) AS slow_checks,
    ROUND(AVG(response_time_ms), 2) AS avg_response_time_ms
FROM qa_environment_checks
GROUP BY environment
HAVING
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) > 0
    OR SUM(CASE WHEN response_time_ms > 500 THEN 1 ELSE 0 END) > 0
ORDER BY failed_checks DESC, slow_checks DESC;
