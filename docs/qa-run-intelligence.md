# QA Run Intelligence

The project includes a custom TypeScript Playwright reporter that converts completed test runs into release-oriented QA data.

## Generated Reports

Every Playwright command writes:

- `qa-report/qa-summary.json` for automation and downstream processing
- `qa-report/qa-summary.md` for human review and CI job summaries

Generated reports are ignored by Git and excluded from repository language statistics. GitHub Actions and GitLab CI retain them as pipeline artifacts.

## Result Model

The reporter records one final result per test:

- suite and test title
- normalized tags
- final QA status
- total duration across all attempts
- number of attempts
- final error when the test does not complete successfully

Skipped tests remain visible but are excluded from the pass-rate denominator. A test that fails first and passes on retry is reported as `flaky`, not `passed`.

The Markdown summary shows both pass rate and failure rate for executed tests, so reviewers can see the healthy and unhealthy share of the run without recalculating skipped diagnostics.

The Markdown report also includes a final status breakdown for passed, failed, flaky, timed-out, interrupted, and skipped tests. This keeps interrupted infrastructure runs separate from assertion failures during triage.

## Quality Gate

The default release gate requires:

- 100% pass rate across executed tests
- zero failed, timed-out, or interrupted tests
- zero flaky tests

Playwright performs one retry in CI. This produces evidence for flaky detection without allowing an unstable test to make the pipeline green.

The reporter can override the final Playwright status when the quality gate is blocked. This keeps the same policy across local scripts, GitHub Actions, and GitLab CI.

## Quality Gate Policy

Each report records the resolved quality-gate policy that was applied to the run. The policy includes required pass rate, maximum failures, maximum flaky tests, an optional skipped-test limit, optional first-pass and classification-rate thresholds, optional average, p95, and individual-test duration thresholds, and optional required tags.

Recording the policy next to the results makes the report easier to review later because the thresholds are visible without opening Playwright configuration or reporter options.

The JSON and Markdown reports also summarize how many quality-gate checks ran, how many passed, and how many failed. This keeps the release signal easy to scan when optional checks are enabled.

Teams can set `maximumSkippedTests` when temporarily disabled coverage must stay below an explicit limit. The option is not enabled by default, so intentionally skipped live diagnostics remain visible without blocking the standard gate.

Projects can set `minimumClassificationRate` to block a run when too many tests lack tags. The check uses the same tagged-versus-total calculation shown in the Test Classification section.

## Release Decision

The report turns quality-gate checks into a release decision. When every configured check passes, the decision is `ready` and the report reminds reviewers to inspect the generated summary before deployment.

When any check fails, the decision is `blocked`. Failed checks are stored separately in JSON and rendered as action items in Markdown, such as fixing pass rate, failure count, flaky tests, first-pass rate, missing tags, or duration thresholds.

Blocked Markdown reports also include a compact failed-check table before the release decision. This gives reviewers the exact expected and actual values without scanning the full policy table.

## Release Blockers

The report keeps a dedicated inventory of failed, timed-out, interrupted, and flaky tests. Each entry includes its suite, final status, attempt count, and normalized tags.

The same section includes a release-blocker summary with separate failed, timed-out, interrupted, and flaky counts.

This puts every test-level release blocker in one place. Flaky tests remain visible even though they are intentionally excluded from the separate failure-error list.

Failure details include a failure summary with total failed results, status split, and accumulated failed-test duration before the error messages.

## Non-Passing Executed Test Inventory

The report lists every executed test whose final QA status is not `passed`. The inventory includes failed, timed-out, interrupted, and flaky tests with attempts, duration, and normalized tags.

Skipped tests stay in their dedicated inventory so intentionally disabled diagnostics do not mix with executed non-pass outcomes.

The same section includes a non-passing executed summary with total count, status split, and total duration before the detailed inventory.

## Execution Stability

The report separates final pass rate from first-pass stability. It shows:

- tests that passed without a retry
- tests that required at least one retry
- total retry attempts consumed by the run
- average attempts per executed test
- retry rate across executed tests
- first-pass pass rate across executed tests

Projects can set an optional `minimumFirstPassRate` quality-gate threshold. This catches a run that eventually becomes green but consumes retries too often.

## Retried Test Inventory

The report lists every test that required more than one attempt, including its suite, total attempts, final status, and accumulated duration. Tests with the most attempts are shown first, followed by the longest-running retries.

This connects the run-level stability rate to concrete test cases so flaky or repeatedly failing scenarios can be investigated without searching through the full Playwright log.

The same section includes a retried-test summary with total retried tests, maximum attempts, retry attempts, and total retried-test duration.

## Flaky Test Inventory

The report keeps a separate inventory of tests whose final QA status is `flaky`. Each entry includes suite, attempts, accumulated duration, and normalized tags.

Flaky tests are sorted by attempts and duration so repeated instability stays visible even when the last retry passes.

The same section includes a flaky-test summary with total flaky tests, maximum attempts, retry attempts, and total flaky-test duration.

## Regression Risk

Each report converts current run signals into a regression risk score:

- failed, timed-out, or interrupted tests add five points
- flaky tests add three points
- slow tests add two points
- skipped tests add one point

Scores below six are low risk, scores from six to fourteen are medium risk, and scores of fifteen or more are high risk. The report includes a release recommendation and ranks suites with non-zero risk signals so investigation can start with the strongest hotspot.

## Tag Coverage

The report groups results by normalized Playwright tags and shows the total, executed, passed, failed, flaky, and skipped tests for each group. It also includes pass rate and accumulated duration.

A test can contribute to multiple tag rows, such as `api` and `smoke`. Tests without tags are grouped under `untagged` so missing classification remains visible as the suite grows.

The report includes a tag-coverage status summary with the total number of tag rows and how many contain failures, flaky tests, or skipped tests.

## Test Classification

The report summarizes test classification hygiene across the whole run. It shows total tests, tagged tests, untagged tests, skipped tests, live-tagged diagnostics, and the overall classification rate.

This makes missing tags visible before they become a reporting blind spot. Live-tagged tests are counted separately because they are optional diagnostics rather than deterministic CI coverage.

## Untagged Test Inventory

The report lists every test without normalized tags, including its suite and final status. Entries are sorted by suite and title to keep repeated reports stable and easy to compare.

This turns the classification-rate metric into an actionable cleanup list instead of leaving reviewers to search the complete test result payload.

The same section includes an untagged-test summary with total, executed, skipped, and non-passing counts before the detailed inventory.

## Skipped Test Inventory

The report keeps a dedicated inventory of skipped tests with their suite and normalized tags. The list is sorted by suite and test title so repeated runs produce a stable review order.

This makes intentionally disabled scenarios and optional diagnostics visible without lowering the pass rate. Untagged skipped tests are labeled explicitly in the Markdown summary.

The same section includes a skipped-test summary with total, tagged, untagged, and live-tagged counts before the detailed inventory.

## Test Area Summary

The report groups suites by the first path segment, such as `api`, `playwright`, and `utils`. Each area shows status, total tests, executed tests, passed tests, failed tests, flaky tests, skipped tests, pass rate, and accumulated duration.

Areas with failures or flaky tests are marked `attention` and sorted above healthy areas. This gives a quick release-level view before drilling into individual suites.

The report includes a test-area status summary with total, healthy, and attention area counts before the detailed area table.

## Suite Health

The report groups tests by suite and marks each suite as `healthy` or `attention`. A suite needs attention when it has a failed, timed-out, interrupted, or flaky result.

Suite health includes totals, executed tests, passed tests, failure counts, flaky counts, skipped tests, and pass rate. Suites needing attention are listed first so triage can start in the highest-risk area.

The report also includes a suite-health summary with total, healthy, and attention suite counts before the detailed suite table.

## Suite Performance

The report ranks test suites by accumulated execution time and shows:

- total and executed test counts
- number of tests above the configured slow-test threshold
- total, average, and maximum test duration

This makes the suites with the largest runtime cost visible even when every test passes, so optimization work can start with the strongest contributor.

The report includes a suite-performance summary with total suites, suites containing slow tests, total duration, and the maximum test duration before the detailed suite table.

## Execution Duration Profile

The report summarizes duration across executed tests with total, minimum, average, median, 95th percentile, and maximum values. Skipped tests are excluded so their zero-duration results do not distort the distribution.

Minimum duration shows the fastest executed check, median duration represents a typical test, while the 95th percentile and maximum expose tail latency that an average can hide.

Projects can set `maximumP95DurationMs` to block a run when the slowest five percent of executed tests exceed an acceptable duration. The threshold is optional and skipped tests remain excluded from the calculation.

The optional `maximumTestDurationMs` threshold blocks a run when any executed test exceeds its duration budget. This catches a single severe outlier even when the average and p95 remain acceptable across a large suite.

When that threshold is configured, the report also lists every executed test that exceeded the individual duration budget. The inventory keeps skipped diagnostics out of the breach list and sorts the longest over-budget tests first.

The same section includes a duration-budget breach summary with total breaches, configured threshold, maximum duration, and maximum amount over budget.

When slow tests are present, the report includes a slow-test summary with the total count, configured threshold, and maximum duration before the detailed slow-test list.

## CI Visibility

On GitHub Actions, the Markdown report is appended to the native job summary and uploaded as an artifact. On GitLab CI, the report directory is retained as an artifact for every job, including successful runs.
