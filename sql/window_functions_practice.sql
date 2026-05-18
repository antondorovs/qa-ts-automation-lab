-- Window function practice for QA analytics and defect trend analysis.

WITH daily_results AS (
    SELECT
        CAST(run.started_at AS DATE) AS run_date,
        result.suite_name,
        result.status,
        result.duration_ms
    FROM qa_test_results result
    JOIN qa_test_runs run ON run.id = result.run_id
),
daily_summary AS (
    SELECT
        run_date,
        suite_name,
        COUNT(*) AS total_tests,
        SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) AS passed_tests,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_tests,
        ROUND(AVG(duration_ms), 2) AS avg_duration_ms
    FROM daily_results
    GROUP BY run_date, suite_name
)
SELECT
    run_date,
    suite_name,
    total_tests,
    passed_tests,
    failed_tests,
    avg_duration_ms,
    SUM(failed_tests) OVER (
        PARTITION BY suite_name
        ORDER BY run_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS failed_tests_last_7_runs,
    ROUND(
        AVG(avg_duration_ms) OVER (
            PARTITION BY suite_name
            ORDER BY run_date
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ),
        2
    ) AS rolling_avg_duration_ms
FROM daily_summary
ORDER BY run_date DESC, suite_name;

-- Rank tests by duration inside every suite.
SELECT
    suite_name,
    test_name,
    duration_ms,
    status,
    RANK() OVER (
        PARTITION BY suite_name
        ORDER BY duration_ms DESC
    ) AS duration_rank,
    NTILE(4) OVER (
        PARTITION BY suite_name
        ORDER BY duration_ms DESC
    ) AS duration_quartile
FROM qa_test_results
ORDER BY suite_name, duration_rank;

-- Compare each run with the previous run on the same branch.
SELECT
    branch_name,
    environment,
    started_at,
    status,
    LAG(status) OVER (
        PARTITION BY branch_name, environment
        ORDER BY started_at
    ) AS previous_status,
    EXTRACT(EPOCH FROM (
        finished_at - LAG(finished_at) OVER (
            PARTITION BY branch_name, environment
            ORDER BY started_at
        )
    )) AS seconds_since_previous_finish
FROM qa_test_runs
ORDER BY branch_name, environment, started_at;

-- Find suites where the most recent status is worse than the previous status.
WITH suite_run_summary AS (
    SELECT
        run.id AS run_id,
        result.suite_name,
        run.started_at,
        SUM(CASE WHEN result.status = 'failed' THEN 1 ELSE 0 END) AS failed_tests
    FROM qa_test_runs run
    JOIN qa_test_results result ON result.run_id = run.id
    GROUP BY run.id, result.suite_name, run.started_at
),
suite_trends AS (
    SELECT
        suite_name,
        started_at,
        failed_tests,
        LAG(failed_tests) OVER (
            PARTITION BY suite_name
            ORDER BY started_at
        ) AS previous_failed_tests
    FROM suite_run_summary
)
SELECT
    suite_name,
    started_at,
    failed_tests,
    previous_failed_tests,
    failed_tests - previous_failed_tests AS failed_tests_delta
FROM suite_trends
WHERE previous_failed_tests IS NOT NULL
  AND failed_tests > previous_failed_tests
ORDER BY failed_tests_delta DESC;
