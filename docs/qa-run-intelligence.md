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

## Regression Risk

Each report converts current run signals into a regression risk score:

- failed, timed-out, or interrupted tests add five points
- flaky tests add three points
- slow tests add two points
- skipped tests add one point

Scores below six are low risk, scores from six to fourteen are medium risk, and scores of fifteen or more are high risk. The report includes a release recommendation and ranks suites with non-zero risk signals so investigation can start with the strongest hotspot.

## CI Visibility

On GitHub Actions, the Markdown report is appended to the native job summary and uploaded as an artifact. On GitLab CI, the report directory is retained as an artifact for every job, including successful runs.
