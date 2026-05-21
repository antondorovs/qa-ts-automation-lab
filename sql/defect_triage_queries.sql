-- Defect triage practice queries for regression review.

-- Group failed tests by suite to find the hottest problem area.
SELECT
    suite_name,
    COUNT(*) AS failed_tests,
    MAX(duration_ms) AS slowest_failure_ms,
    STRING_AGG(test_name, ', ') AS failed_test_names
FROM qa_test_results
WHERE status = 'failed'
GROUP BY suite_name
ORDER BY failed_tests DESC, slowest_failure_ms DESC;

-- Create a compact regression risk score per branch.
SELECT
    run.branch_name,
    run.environment,
    COUNT(result.id) AS total_tests,
    SUM(CASE WHEN result.status = 'failed' THEN 1 ELSE 0 END) AS failed_tests,
    SUM(CASE WHEN result.status = 'skipped' THEN 1 ELSE 0 END) AS skipped_tests,
    SUM(CASE WHEN result.duration_ms > 1000 THEN 1 ELSE 0 END) AS slow_tests,
    (
        SUM(CASE WHEN result.status = 'failed' THEN 5 ELSE 0 END) +
        SUM(CASE WHEN result.status = 'skipped' THEN 1 ELSE 0 END) +
        SUM(CASE WHEN result.duration_ms > 1000 THEN 2 ELSE 0 END)
    ) AS regression_risk_score
FROM qa_test_runs run
JOIN qa_test_results result ON result.run_id = run.id
GROUP BY run.branch_name, run.environment
ORDER BY regression_risk_score DESC;

-- Find recent failures that are good candidates for a bug report.
SELECT
    run.branch_name,
    run.environment,
    result.suite_name,
    result.test_name,
    result.error_message,
    result.duration_ms,
    run.started_at
FROM qa_test_results result
JOIN qa_test_runs run ON run.id = result.run_id
WHERE result.status = 'failed'
  AND result.error_message IS NOT NULL
ORDER BY run.started_at DESC, result.duration_ms DESC;

-- Compare failed tests against slow tests to avoid focusing only on red status.
SELECT
    suite_name,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed_tests,
    COUNT(*) FILTER (WHERE duration_ms > 1000) AS slow_tests,
    ROUND(AVG(duration_ms), 2) AS avg_duration_ms
FROM qa_test_results
GROUP BY suite_name
HAVING
    COUNT(*) FILTER (WHERE status = 'failed') > 0
    OR COUNT(*) FILTER (WHERE duration_ms > 1000) > 0
ORDER BY failed_tests DESC, slow_tests DESC;
