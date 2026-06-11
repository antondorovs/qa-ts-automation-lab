import {
  evaluateQualityGate,
  findFailedTests,
  findSlowTests,
  summarizeTagCoverage,
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
    regressionRisk,
    riskHotspots: buildRegressionRiskHotspots(tests, options.slowTestThresholdMs),
    tagCoverage: summarizeTagCoverage(tests),
    slowTests,
    failedTests: findFailedTests(tests),
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
    '## Quality Gate',
    '',
    '| Check | Expected | Actual | Result |',
    '| --- | --- | --- | --- |',
    ...qualityGate.checks.map((check) => (
      `| ${escapeTable(check.name)} | ${escapeTable(check.expected)} | ${escapeTable(check.actual)} | ${check.passed ? 'PASS' : 'FAIL'} |`
    )),
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
