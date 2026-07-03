import {
  buildReleaseDecision,
  evaluateQualityGate,
  findFailedTests,
  findReleaseBlockers,
  findRetriedTests,
  findSkippedTests,
  findSlowTests,
  summarizeClassification,
  summarizeExecutionStability,
  summarizeSuiteHealth,
  summarizeSuitePerformance,
  summarizeTagCoverage,
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
    stability: summarizeExecutionStability(tests),
    regressionRisk,
    riskHotspots: buildRegressionRiskHotspots(tests, options.slowTestThresholdMs),
    tagCoverage: summarizeTagCoverage(tests),
    classification: summarizeClassification(tests),
    testAreas: summarizeTestAreas(tests),
    suiteHealth: summarizeSuiteHealth(tests),
    suitePerformance: summarizeSuitePerformance(tests, options.slowTestThresholdMs),
    slowTests,
    failedTests: findFailedTests(tests),
    skippedTests: findSkippedTests(tests),
    retriedTests: findRetriedTests(tests),
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
    '| Total | Executed | Passed | Failed | Flaky | Skipped | Pass rate | Duration |',
    '| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    `| ${summary.total} | ${summary.executed} | ${summary.passed} | ${summary.failed + summary.timedOut + summary.interrupted} | ${summary.flaky} | ${summary.skipped} | ${summary.passRate}% | ${formatDuration(report.durationMs)} |`,
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
    `| Maximum average duration | ${qualityGate.policy.maximumAverageDurationMs === undefined ? 'not configured' : `<= ${qualityGate.policy.maximumAverageDurationMs}ms`} |`,
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
    '| Executed | First-pass passed | Retried tests | Retry attempts | First-pass rate |',
    '| ---: | ---: | ---: | ---: | ---: |',
    `| ${report.stability.executed} | ${report.stability.firstPassPassed} | ${report.stability.retriedTests} | ${report.stability.retryAttempts} | ${report.stability.firstPassRate}% |`,
    '',
    '## Regression Risk',
    '',
    `Risk: **${report.regressionRisk.risk}** (${report.regressionRisk.score} points)`,
    '',
    report.regressionRisk.recommendation,
  ];

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

  if (report.testAreas.length) {
    lines.push(
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
      '## Suite Performance',
      '',
      '| Suite | Tests | Executed | Slow | Total duration | Average | Maximum |',
      '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
      ...report.suitePerformance.map((suite) => (
        `| ${escapeTable(suite.suite)} | ${suite.total} | ${suite.executed} | ${suite.slowTests} | ${formatDuration(suite.totalDurationMs)} | ${formatDuration(suite.averageDurationMs)} | ${formatDuration(suite.maximumDurationMs)} |`
      )),
    );
  }

  if (report.releaseBlockers.length) {
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

  if (report.retriedTests.length) {
    lines.push(
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

  if (report.skippedTests.length) {
    lines.push(
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
