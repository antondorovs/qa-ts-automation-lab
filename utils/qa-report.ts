import {
  evaluateQualityGate,
  findFailedTests,
  findSlowTests,
  type QaReporterOptions,
  type QaRunReport,
  type QaTestResult,
} from './qa-metrics';

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

  return {
    generatedAt: metadata.generatedAt || new Date().toISOString(),
    runStatus: metadata.runStatus,
    durationMs: metadata.durationMs,
    summary: qualityGate.summary,
    qualityGate,
    slowTests: findSlowTests(tests, options.slowTestThresholdMs),
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
  ];

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
