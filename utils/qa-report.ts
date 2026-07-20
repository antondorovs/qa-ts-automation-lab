import {
  buildReleaseDecision,
  evaluateQualityGate,
  findDurationBudgetBreaches,
  findFailedTests,
  findFlakyTests,
  findNonPassingExecutedTests,
  findReleaseBlockers,
  findRetriedTests,
  findSkippedTests,
  findSlowTests,
  findUntaggedTests,
  summarizeClassification,
  summarizeDurationProfile,
  summarizeDurationBudgetBreaches,
  summarizeExecutionStability,
  summarizeFailedTests,
  summarizeFlakyTests,
  summarizeNonPassingExecutedTests,
  summarizeRetriedTests,
  summarizeSuiteHealth,
  summarizeSuiteHealthStatus,
  summarizeSuitePerformance,
  summarizeSuitePerformanceProfile,
  summarizeSlowTests,
  summarizeReleaseBlockers,
  summarizeSkippedTests,
  summarizeTagCoverage,
  summarizeTagCoverageStatus,
  summarizeTestAreaStatus,
  summarizeTestAreas,
  type QaReporterOptions,
  type QaRunReport,
  type QaTestResult,
} from './qa-metrics';
import {
  buildRegressionRiskHotspots,
  buildRegressionRiskSummary,
} from './regression-risk-summary';

export type QaRunMetadata = {
  generatedAt?: string;
  runStatus: QaRunReport['runStatus'];
  durationMs: number;
};

export function buildQaRunReport(
  tests: QaTestResult[],
  metadata: QaRunMetadata,
  options: QaReporterOptions = {},
): QaRunReport {
  const qualityGate = evaluateQualityGate(tests, options.qualityGate);
  const slowTests = findSlowTests(tests, options.slowTestThresholdMs);
  const testAreas = summarizeTestAreas(tests);
  const suiteHealth = summarizeSuiteHealth(tests);
  const suitePerformance = summarizeSuitePerformance(tests, options.slowTestThresholdMs);
  const tagCoverage = summarizeTagCoverage(tests);
  const nonPassingExecutedTests = findNonPassingExecutedTests(tests);
  const skippedTests = findSkippedTests(tests);
  const flakyTests = findFlakyTests(tests);
  const retriedTests = findRetriedTests(tests);
  const failedTests = findFailedTests(tests);
  const regressionRisk = buildRegressionRiskSummary({
    failed: qualityGate.summary.failed
      + qualityGate.summary.timedOut
      + qualityGate.summary.interrupted,
    flaky: qualityGate.summary.flaky,
    slow: slowTests.length,
    skipped: qualityGate.summary.skipped,
  });

  return {
    generatedAt: metadata.generatedAt || new Date().toISOString(),
    runStatus: metadata.runStatus,
    durationMs: metadata.durationMs,
    summary: qualityGate.summary,
    qualityGate,
    releaseDecision: buildReleaseDecision(qualityGate),
    releaseBlockers: findReleaseBlockers(tests),
    releaseBlockerSummary: summarizeReleaseBlockers(tests),
    stability: summarizeExecutionStability(tests),
    durationProfile: summarizeDurationProfile(tests),
    regressionRisk,
    riskHotspots: buildRegressionRiskHotspots(tests, options.slowTestThresholdMs),
    tagCoverageStatusSummary: summarizeTagCoverageStatus(tagCoverage),
    tagCoverage,
    classification: summarizeClassification(tests),
    testAreaStatusSummary: summarizeTestAreaStatus(testAreas),
    testAreas,
    suiteHealthSummary: summarizeSuiteHealthStatus(suiteHealth),
    suiteHealth,
    suitePerformanceSummary: summarizeSuitePerformanceProfile(suitePerformance),
    suitePerformance,
    slowTestSummary: summarizeSlowTests(slowTests, options.slowTestThresholdMs),
    slowTests,
    durationBudgetBreachSummary: summarizeDurationBudgetBreaches(
      tests,
      options.qualityGate?.maximumTestDurationMs,
    ),
    durationBudgetBreaches: findDurationBudgetBreaches(
      tests,
      options.qualityGate?.maximumTestDurationMs,
    ),
    failedTestSummary: summarizeFailedTests(failedTests),
    failedTests,
    skippedTestSummary: summarizeSkippedTests(skippedTests),
    skippedTests,
    untaggedTests: findUntaggedTests(tests),
    retriedTestSummary: summarizeRetriedTests(retriedTests),
    retriedTests,
    flakyTestSummary: summarizeFlakyTests(flakyTests),
    flakyTests,
    nonPassingExecutedSummary: summarizeNonPassingExecutedTests(nonPassingExecutedTests),
    nonPassingExecutedTests,
    tests,
  };
}

export function renderQaReportMarkdown(report: QaRunReport): string {
  const { summary, qualityGate } = report;
  const lines = [
    '# QA Run Summary',
    '',
    `Generated: ${report.generatedAt}`,
    `Run status: **${report.runStatus}**`,
    `Quality gate: **${qualityGate.status}**`,
    '',
    '## Metrics',
    '',
    '| Total | Executed | Passed | Failed | Flaky | Skipped | Pass rate | Failure rate | Duration |',
    '| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    `| ${summary.total} | ${summary.executed} | ${summary.passed} | ${summary.failed + summary.timedOut + summary.interrupted} | ${summary.flaky} | ${summary.skipped} | ${summary.passRate}% | ${summary.failureRate}% | ${formatDuration(report.durationMs)} |`,
    '',
    '## Status Breakdown',
    '',
    '| Passed | Failed | Flaky | Timed out | Interrupted | Skipped |',
    '| ---: | ---: | ---: | ---: | ---: | ---: |',
    `| ${summary.passed} | ${summary.failed} | ${summary.flaky} | ${summary.timedOut} | ${summary.interrupted} | ${summary.skipped} |`,
    '',
    '## Execution Duration Profile',
    '',
    '| Executed | Total | Minimum | Average | Median | P95 | Maximum |',
    '| ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    `| ${report.durationProfile.executed} | ${formatDuration(report.durationProfile.totalDurationMs)} | ${formatDuration(report.durationProfile.minimumDurationMs)} | ${formatDuration(report.durationProfile.averageDurationMs)} | ${formatDuration(report.durationProfile.medianDurationMs)} | ${formatDuration(report.durationProfile.p95DurationMs)} | ${formatDuration(report.durationProfile.maximumDurationMs)} |`,
    '',
    '## Quality Gate Policy',
    '',
    '| Policy | Value |',
    '| --- | --- |',
    `| Minimum pass rate | >= ${qualityGate.policy.minimumPassRate}% |`,
    `| Maximum failures | <= ${qualityGate.policy.maximumFailures} |`,
    `| Maximum flaky tests | <= ${qualityGate.policy.maximumFlakyTests} |`,
    `| Maximum skipped tests | ${qualityGate.policy.maximumSkippedTests === undefined ? 'not configured' : `<= ${qualityGate.policy.maximumSkippedTests}`} |`,
    `| Minimum first-pass rate | ${qualityGate.policy.minimumFirstPassRate === undefined ? 'not configured' : `>= ${qualityGate.policy.minimumFirstPassRate}%`} |`,
    `| Minimum classification rate | ${qualityGate.policy.minimumClassificationRate === undefined ? 'not configured' : `>= ${qualityGate.policy.minimumClassificationRate}%`} |`,
    `| Maximum average duration | ${qualityGate.policy.maximumAverageDurationMs === undefined ? 'not configured' : `<= ${qualityGate.policy.maximumAverageDurationMs}ms`} |`,
    `| Maximum p95 duration | ${qualityGate.policy.maximumP95DurationMs === undefined ? 'not configured' : `<= ${qualityGate.policy.maximumP95DurationMs}ms`} |`,
    `| Maximum test duration | ${qualityGate.policy.maximumTestDurationMs === undefined ? 'not configured' : `<= ${qualityGate.policy.maximumTestDurationMs}ms`} |`,
    `| Required tags | ${formatRequiredTags(qualityGate.policy.requiredTags)} |`,
    '',
    '## Quality Gate',
    '',
    '| Check | Expected | Actual | Result |',
    '| --- | --- | --- | --- |',
    ...qualityGate.checks.map((check) => (
      `| ${escapeTable(check.name)} | ${escapeTable(check.expected)} | ${escapeTable(check.actual)} | ${check.passed ? 'PASS' : 'FAIL'} |`
    )),
    '',
    '## Quality Gate Summary',
    '',
    '| Total checks | Passed | Failed |',
    '| ---: | ---: | ---: |',
    `| ${qualityGate.checkSummary.total} | ${qualityGate.checkSummary.passed} | ${qualityGate.checkSummary.failed} |`,
  ];

  if (qualityGate.failedChecks.length) {
    lines.push(
      '',
      '## Blocked Checks',
      '',
      '| Check | Expected | Actual |',
      '| --- | --- | --- |',
      ...qualityGate.failedChecks.map((check) => (
        `| ${escapeTable(check.name)} | ${escapeTable(check.expected)} | ${escapeTable(check.actual)} |`
      )),
    );
  }

  lines.push(
    '',
    '## Release Decision',
    '',
    `Status: **${report.releaseDecision.status}**`,
    '',
    report.releaseDecision.summary,
    '',
    ...report.releaseDecision.actionItems.map((item) => `- ${item}`),
    '',
    '## Execution Stability',
    '',
    '| Executed | First-pass passed | Retried tests | Retry attempts | Average attempts | Retry rate | First-pass rate |',
    '| ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    `| ${report.stability.executed} | ${report.stability.firstPassPassed} | ${report.stability.retriedTests} | ${report.stability.retryAttempts} | ${report.stability.averageAttempts} | ${report.stability.retryRate}% | ${report.stability.firstPassRate}% |`,
    '',
    '## Regression Risk',
    '',
    `Risk: **${report.regressionRisk.risk}** (${report.regressionRisk.score} points)`,
    '',
    report.regressionRisk.recommendation,
  );

  if (report.riskHotspots.length) {
    lines.push(
      '',
      '### Risk Hotspots',
      '',
      '| Suite | Risk | Score | Failed | Flaky | Slow | Skipped |',
      '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
      ...report.riskHotspots.map((hotspot) => (
        `| ${escapeTable(hotspot.suite)} | ${hotspot.risk} | ${hotspot.score} | ${hotspot.signals.failed} | ${hotspot.signals.flaky} | ${hotspot.signals.slow} | ${hotspot.signals.skipped} |`
      )),
    );
  }

  if (report.tagCoverage.length) {
    lines.push(
      '',
      '## Tag Coverage Status Summary',
      '',
      '| Tag rows | Failing tags | Flaky tags | Skipped tags |',
      '| ---: | ---: | ---: | ---: |',
      `| ${report.tagCoverageStatusSummary.total} | ${report.tagCoverageStatusSummary.failing} | ${report.tagCoverageStatusSummary.flaky} | ${report.tagCoverageStatusSummary.skipped} |`,
      '',
      '## Tag Coverage',
      '',
      '| Tag | Total | Executed | Passed | Failed | Flaky | Skipped | Pass rate | Duration |',
      '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
      ...report.tagCoverage.map((tag) => (
        `| ${escapeTable(tag.tag)} | ${tag.total} | ${tag.executed} | ${tag.passed} | ${tag.failures} | ${tag.flaky} | ${tag.skipped} | ${tag.passRate}% | ${formatDuration(tag.durationMs)} |`
      )),
    );
  }

  lines.push(
    '',
    '## Test Classification',
    '',
    '| Total | Tagged | Untagged | Skipped | Live-tagged | Classification rate |',
    '| ---: | ---: | ---: | ---: | ---: | ---: |',
    `| ${report.classification.total} | ${report.classification.tagged} | ${report.classification.untagged} | ${report.classification.skipped} | ${report.classification.liveTagged} | ${report.classification.classificationRate}% |`,
  );

  if (report.untaggedTests.length) {
    lines.push(
      '',
      '## Untagged Tests',
      '',
      '| Test | Suite | Status |',
      '| --- | --- | --- |',
      ...report.untaggedTests.map((test) => (
        `| ${escapeTable(test.title)} | ${escapeTable(test.suite)} | ${test.status} |`
      )),
    );
  }

  if (report.testAreas.length) {
    lines.push(
      '',
      '## Test Area Status Summary',
      '',
      '| Total areas | Healthy | Attention |',
      '| ---: | ---: | ---: |',
      `| ${report.testAreaStatusSummary.total} | ${report.testAreaStatusSummary.healthy} | ${report.testAreaStatusSummary.attention} |`,
      '',
      '## Test Area Summary',
      '',
      '| Area | Status | Total | Executed | Passed | Failed | Flaky | Skipped | Pass rate | Duration |',
      '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
      ...report.testAreas.map((area) => (
        `| ${escapeTable(area.area)} | ${area.status} | ${area.total} | ${area.executed} | ${area.passed} | ${area.failures} | ${area.flaky} | ${area.skipped} | ${area.passRate}% | ${formatDuration(area.durationMs)} |`
      )),
    );
  }

  if (report.suiteHealth.length) {
    lines.push(
      '',
      '## Suite Health Summary',
      '',
      '| Total suites | Healthy | Attention |',
      '| ---: | ---: | ---: |',
      `| ${report.suiteHealthSummary.total} | ${report.suiteHealthSummary.healthy} | ${report.suiteHealthSummary.attention} |`,
      '',
      '## Suite Health',
      '',
      '| Suite | Status | Total | Executed | Passed | Failed | Flaky | Skipped | Pass rate |',
      '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
      ...report.suiteHealth.map((suite) => (
        `| ${escapeTable(suite.suite)} | ${suite.status} | ${suite.total} | ${suite.executed} | ${suite.passed} | ${suite.failures} | ${suite.flaky} | ${suite.skipped} | ${suite.passRate}% |`
      )),
    );
  }

  if (report.suitePerformance.length) {
    lines.push(
      '',
      '## Suite Performance Summary',
      '',
      '| Total suites | Suites with slow tests | Total duration | Maximum test duration |',
      '| ---: | ---: | ---: | ---: |',
      `| ${report.suitePerformanceSummary.total} | ${report.suitePerformanceSummary.slowSuites} | ${formatDuration(report.suitePerformanceSummary.totalDurationMs)} | ${formatDuration(report.suitePerformanceSummary.maximumDurationMs)} |`,
      '',
      '## Suite Performance',
      '',
      '| Suite | Tests | Executed | Slow | Total duration | Average | Maximum |',
      '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
      ...report.suitePerformance.map((suite) => (
        `| ${escapeTable(suite.suite)} | ${suite.total} | ${suite.executed} | ${suite.slowTests} | ${formatDuration(suite.totalDurationMs)} | ${formatDuration(suite.averageDurationMs)} | ${formatDuration(suite.maximumDurationMs)} |`
      )),
    );
  }

  if (report.durationBudgetBreaches.length) {
    lines.push(
      '',
      '## Duration Budget Breach Summary',
      '',
      '| Breaches | Threshold | Maximum duration | Maximum over budget |',
      '| ---: | ---: | ---: | ---: |',
      `| ${report.durationBudgetBreachSummary.total} | ${formatDuration(report.durationBudgetBreachSummary.thresholdMs || 0)} | ${formatDuration(report.durationBudgetBreachSummary.maximumDurationMs)} | ${formatDuration(report.durationBudgetBreachSummary.maximumOverBudgetMs)} |`,
      '',
      '## Duration Budget Breaches',
      '',
      '| Test | Suite | Status | Duration |',
      '| --- | --- | --- | ---: |',
      ...report.durationBudgetBreaches.map((test) => (
        `| ${escapeTable(test.title)} | ${escapeTable(test.suite)} | ${test.status} | ${formatDuration(test.durationMs)} |`
      )),
    );
  }

  if (report.releaseBlockers.length) {
    lines.push(
      '',
      '## Release Blocker Summary',
      '',
      '| Total | Failed | Timed out | Interrupted | Flaky |',
      '| ---: | ---: | ---: | ---: | ---: |',
      `| ${report.releaseBlockerSummary.total} | ${report.releaseBlockerSummary.failed} | ${report.releaseBlockerSummary.timedOut} | ${report.releaseBlockerSummary.interrupted} | ${report.releaseBlockerSummary.flaky} |`,
    );

    lines.push(
      '',
      '## Release Blockers',
      '',
      '| Test | Suite | Status | Attempts | Tags |',
      '| --- | --- | --- | ---: | --- |',
      ...report.releaseBlockers.map((test) => (
        `| ${escapeTable(test.title)} | ${escapeTable(test.suite)} | ${test.status} | ${test.attempts} | ${formatTags(test.tags)} |`
      )),
    );
  }

  if (report.nonPassingExecutedTests.length) {
    lines.push(
      '',
      '## Non-Passing Executed Summary',
      '',
      '| Total | Failed | Timed out | Interrupted | Flaky | Total duration |',
      '| ---: | ---: | ---: | ---: | ---: | ---: |',
      `| ${report.nonPassingExecutedSummary.total} | ${report.nonPassingExecutedSummary.failed} | ${report.nonPassingExecutedSummary.timedOut} | ${report.nonPassingExecutedSummary.interrupted} | ${report.nonPassingExecutedSummary.flaky} | ${formatDuration(report.nonPassingExecutedSummary.totalDurationMs)} |`,
      '',
      '## Non-Passing Executed Tests',
      '',
      '| Test | Suite | Status | Attempts | Duration | Tags |',
      '| --- | --- | --- | ---: | ---: | --- |',
      ...report.nonPassingExecutedTests.map((test) => (
        `| ${escapeTable(test.title)} | ${escapeTable(test.suite)} | ${test.status} | ${test.attempts} | ${formatDuration(test.durationMs)} | ${formatTags(test.tags)} |`
      )),
    );
  }

  if (report.retriedTests.length) {
    lines.push(
      '',
      '## Retried Test Summary',
      '',
      '| Total | Maximum attempts | Retry attempts | Total duration |',
      '| ---: | ---: | ---: | ---: |',
      `| ${report.retriedTestSummary.total} | ${report.retriedTestSummary.maximumAttempts} | ${report.retriedTestSummary.retryAttempts} | ${formatDuration(report.retriedTestSummary.totalDurationMs)} |`,
      '',
      '## Retried Tests',
      '',
      '| Test | Suite | Attempts | Final status | Duration |',
      '| --- | --- | ---: | --- | ---: |',
      ...report.retriedTests.map((test) => (
        `| ${escapeTable(test.title)} | ${escapeTable(test.suite)} | ${test.attempts} | ${test.status} | ${formatDuration(test.durationMs)} |`
      )),
    );
  }

  if (report.flakyTests.length) {
    lines.push(
      '',
      '## Flaky Test Summary',
      '',
      '| Total | Maximum attempts | Retry attempts | Total duration |',
      '| ---: | ---: | ---: | ---: |',
      `| ${report.flakyTestSummary.total} | ${report.flakyTestSummary.maximumAttempts} | ${report.flakyTestSummary.retryAttempts} | ${formatDuration(report.flakyTestSummary.totalDurationMs)} |`,
      '',
      '## Flaky Tests',
      '',
      '| Test | Suite | Attempts | Duration | Tags |',
      '| --- | --- | ---: | ---: | --- |',
      ...report.flakyTests.map((test) => (
        `| ${escapeTable(test.title)} | ${escapeTable(test.suite)} | ${test.attempts} | ${formatDuration(test.durationMs)} | ${formatTags(test.tags)} |`
      )),
    );
  }

  if (report.skippedTests.length) {
    lines.push(
      '',
      '## Skipped Test Summary',
      '',
      '| Total | Tagged | Untagged | Live-tagged |',
      '| ---: | ---: | ---: | ---: |',
      `| ${report.skippedTestSummary.total} | ${report.skippedTestSummary.tagged} | ${report.skippedTestSummary.untagged} | ${report.skippedTestSummary.liveTagged} |`,
      '',
      '## Skipped Tests',
      '',
      '| Test | Suite | Tags |',
      '| --- | --- | --- |',
      ...report.skippedTests.map((test) => (
        `| ${escapeTable(test.title)} | ${escapeTable(test.suite)} | ${formatTags(test.tags)} |`
      )),
    );
  }

  if (report.failedTests.length) {
    lines.push(
      '',
      '## Failure Summary',
      '',
      '| Total | Failed | Timed out | Interrupted | Total duration |',
      '| ---: | ---: | ---: | ---: | ---: |',
      `| ${report.failedTestSummary.total} | ${report.failedTestSummary.failed} | ${report.failedTestSummary.timedOut} | ${report.failedTestSummary.interrupted} | ${formatDuration(report.failedTestSummary.totalDurationMs)} |`,
      '',
      '## Failures',
      '',
      ...report.failedTests.map((test) => (
        `- **${test.title}** (${test.suite}, ${test.status}): ${firstLine(test.error)}`
      )),
    );
  }

  if (report.slowTests.length) {
    lines.push(
      '',
      '## Slow Test Summary',
      '',
      '| Slow tests | Threshold | Maximum duration |',
      '| ---: | ---: | ---: |',
      `| ${report.slowTestSummary.total} | ${formatDuration(report.slowTestSummary.thresholdMs)} | ${formatDuration(report.slowTestSummary.maximumDurationMs)} |`,
      '',
      '## Slow Tests',
      '',
      ...report.slowTests.map((test) => (
        `- ${test.title} (${test.suite}): ${formatDuration(test.durationMs)}`
      )),
    );
  }

  lines.push('');
  return lines.join('\n');
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${Math.round(durationMs)}ms`;
  }

  return `${(durationMs / 1000).toFixed(2)}s`;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|');
}

function firstLine(value: string): string {
  return value.split(/\r?\n/, 1)[0];
}

function formatRequiredTags(tags?: string[]): string {
  return tags?.length ? tags.map((tag) => tag.replace(/^@/, '')).join(', ') : 'not configured';
}

function formatTags(tags: string[]): string {
  return tags.length ? tags.map(escapeTable).join(', ') : 'untagged';
}
