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

## Quality Gate

The default release gate requires:

- 100% pass rate across executed tests
- zero failed, timed-out, or interrupted tests
- zero flaky tests

Playwright performs one retry in CI. This produces evidence for flaky detection without allowing an unstable test to make the pipeline green.

The reporter can override the final Playwright status when the quality gate is blocked. This keeps the same policy across local scripts, GitHub Actions, and GitLab CI.

## Release Decision

The report turns quality-gate checks into a release decision. When every configured check passes, the decision is `ready` and the report reminds reviewers to inspect the generated summary before deployment.

When any check fails, the decision is `blocked`. Failed checks are stored separately in JSON and rendered as action items in Markdown, such as fixing pass rate, failure count, flaky tests, first-pass rate, missing tags, or duration thresholds.

## Execution Stability

The report separates final pass rate from first-pass stability. It shows:

- tests that passed without a retry
- tests that required at least one retry
- total retry attempts consumed by the run
- first-pass pass rate across executed tests

Projects can set an optional `minimumFirstPassRate` quality-gate threshold. This catches a run that eventually becomes green but consumes retries too often.

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

## Test Area Summary

The report groups suites by the first path segment, such as `api`, `playwright`, and `utils`. Each area shows status, total tests, executed tests, passed tests, failed tests, flaky tests, skipped tests, pass rate, and accumulated duration.

Areas with failures or flaky tests are marked `attention` and sorted above healthy areas. This gives a quick release-level view before drilling into individual suites.

## Suite Health

The report groups tests by suite and marks each suite as `healthy` or `attention`. A suite needs attention when it has a failed, timed-out, interrupted, or flaky result.

Suite health includes totals, executed tests, passed tests, failure counts, flaky counts, skipped tests, and pass rate. Suites needing attention are listed first so triage can start in the highest-risk area.

## Suite Performance

The report ranks test suites by accumulated execution time and shows:

- total and executed test counts
- number of tests above the configured slow-test threshold
- total, average, and maximum test duration

This makes the suites with the largest runtime cost visible even when every test passes, so optimization work can start with the strongest contributor.

## CI Visibility

On GitHub Actions, the Markdown report is appended to the native job summary and uploaded as an artifact. On GitLab CI, the report directory is retained as an artifact for every job, including successful runs.
