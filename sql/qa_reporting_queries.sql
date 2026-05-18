-- SQL practice focused on QA reporting, triage, and release readiness.

-- Latest result for every test case.
SELECT
    result.test_name,
    result.suite_name,
    result.status,
    run.branch_name,
    run.environment,
    run.started_at
FROM qa_test_results result
JOIN qa_test_runs run ON run.id = result.run_id
WHERE run.started_at = (
    SELECT MAX(inner_run.started_at)
    FROM qa_test_results inner_result
    JOIN qa_test_runs inner_run ON inner_run.id = inner_result.run_id
    WHERE inner_result.test_name = result.test_name
);

-- Flaky candidates: tests with both passed and failed results.
SELECT
    test_name,
    suite_name,
    COUNT(*) AS total_runs,
    SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) AS passed_runs,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_runs
FROM qa_test_results
GROUP BY test_name, suite_name
HAVING
    SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) > 0
    AND SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) > 0;

-- Slowest tests by suite for performance triage.
SELECT
    suite_name,
    test_name,
    MAX(duration_ms) AS max_duration_ms,
    ROUND(AVG(duration_ms), 2) AS avg_duration_ms
FROM qa_test_results
GROUP BY suite_name, test_name
ORDER BY max_duration_ms DESC
LIMIT 10;

-- Release readiness summary by environment.
SELECT
    environment,
    COUNT(*) AS total_runs,
    SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) AS passed_runs,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_runs,
    ROUND(
        100.0 * SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) / COUNT(*),
        2
    ) AS pass_rate_percent
FROM qa_test_runs
GROUP BY environment
ORDER BY pass_rate_percent DESC;

-- Failed tests with enough context for a bug report draft.
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
ORDER BY run.started_at DESC;
