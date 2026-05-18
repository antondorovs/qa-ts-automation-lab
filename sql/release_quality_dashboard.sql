-- Queries for a release quality dashboard.

-- Environment level health.
SELECT
    run.environment,
    COUNT(DISTINCT run.id) AS total_runs,
    COUNT(result.id) AS total_assertions,
    SUM(CASE WHEN result.status = 'passed' THEN 1 ELSE 0 END) AS passed_assertions,
    SUM(CASE WHEN result.status = 'failed' THEN 1 ELSE 0 END) AS failed_assertions,
    ROUND(
        100.0 * SUM(CASE WHEN result.status = 'passed' THEN 1 ELSE 0 END) / COUNT(result.id),
        2
    ) AS assertion_pass_rate
FROM qa_test_runs run
JOIN qa_test_results result ON result.run_id = run.id
GROUP BY run.environment
ORDER BY assertion_pass_rate DESC;

-- Branches that need QA attention before merge.
SELECT
    run.branch_name,
    run.environment,
    COUNT(result.id) AS total_tests,
    SUM(CASE WHEN result.status = 'failed' THEN 1 ELSE 0 END) AS failed_tests,
    MAX(run.started_at) AS last_started_at,
    STRING_AGG(
        CASE WHEN result.status = 'failed' THEN result.test_name ELSE NULL END,
        ', '
    ) AS failed_test_names
FROM qa_test_runs run
JOIN qa_test_results result ON result.run_id = run.id
GROUP BY run.branch_name, run.environment
HAVING SUM(CASE WHEN result.status = 'failed' THEN 1 ELSE 0 END) > 0
ORDER BY failed_tests DESC, last_started_at DESC;

-- Average execution time by suite and status.
SELECT
    suite_name,
    status,
    COUNT(*) AS tests_count,
    MIN(duration_ms) AS min_duration_ms,
    MAX(duration_ms) AS max_duration_ms,
    ROUND(AVG(duration_ms), 2) AS avg_duration_ms
FROM qa_test_results
GROUP BY suite_name, status
ORDER BY suite_name, status;

-- Potential release blockers from the latest run.
WITH latest_run AS (
    SELECT id
    FROM qa_test_runs
    ORDER BY started_at DESC
    LIMIT 1
)
SELECT
    result.suite_name,
    result.test_name,
    result.status,
    result.error_message,
    result.duration_ms
FROM qa_test_results result
JOIN latest_run ON latest_run.id = result.run_id
WHERE result.status IN ('failed', 'blocked')
ORDER BY result.suite_name, result.test_name;

-- Test ownership view for triage rotation.
SELECT
    CASE
        WHEN suite_name LIKE 'api/%' THEN 'backend qa'
        WHEN suite_name LIKE 'ui/%' THEN 'frontend qa'
        ELSE 'general qa'
    END AS owner_group,
    suite_name,
    COUNT(*) AS total_tests,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_tests,
    ROUND(AVG(duration_ms), 2) AS avg_duration_ms
FROM qa_test_results
GROUP BY owner_group, suite_name
ORDER BY failed_tests DESC, avg_duration_ms DESC;
