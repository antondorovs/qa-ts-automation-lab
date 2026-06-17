import type { RegressionRiskHotspot, RegressionRiskSummary } from './regression-risk-summary';

export const STATUS = {
  PASSED: 'passed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  FLAKY: 'flaky',
  TIMED_OUT: 'timedOut',
  INTERRUPTED: 'interrupted',
} as const;

export type QaTestStatus = (typeof STATUS)[keyof typeof STATUS];
export type QaStatus = QaTestStatus;

export type QaTestResult = {
  id: string;
  suite: string;
  title: string;
  status: QaTestStatus;
  durationMs: number;
  attempts: number;
  tags: string[];
  error?: string;
};

export type QaRunSummary = {
  total: number;
  executed: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  timedOut: number;
  interrupted: number;
  passRate: number;
  failureRate: number;
  totalDurationMs: number;
  averageDurationMs: number;
  suites: Record<string, number>;
};

export type QualityGateOptions = {
  minimumPassRate: number;
  maximumFailures: number;
  maximumFlakyTests: number;
  minimumFirstPassRate?: number;
  maximumAverageDurationMs?: number;
  requiredTags?: string[];
};

export type QualityGateCheck = {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
};

export type QualityGateResult = {
  status: 'ready' | 'blocked';
  checks: QualityGateCheck[];
  failedChecks: QualityGateCheck[];
  summary: QaRunSummary;
};

export type SlowTest = Pick<QaTestResult, 'id' | 'suite' | 'title' | 'status' | 'durationMs'>;

export type FailedTest = Pick<QaTestResult, 'id' | 'suite' | 'title' | 'status' | 'durationMs'> & {
  error: string;
};

export type QaTagSummary = {
  tag: string;
  total: number;
  executed: number;
  passed: number;
  failures: number;
  flaky: number;
  skipped: number;
  passRate: number;
  durationMs: number;
};

export type QaSuitePerformance = {
  suite: string;
  total: number;
  executed: number;
  slowTests: number;
  totalDurationMs: number;
  averageDurationMs: number;
  maximumDurationMs: number;
};

export type QaSuiteHealth = {
  suite: string;
  status: 'healthy' | 'attention';
  total: number;
  executed: number;
  passed: number;
  failures: number;
  flaky: number;
  skipped: number;
  passRate: number;
};

export type QaStabilitySummary = {
  executed: number;
  firstPassPassed: number;
  retriedTests: number;
  retryAttempts: number;
  firstPassRate: number;
};

export type QaReleaseDecision = {
  status: QualityGateResult['status'];
  summary: string;
  actionItems: string[];
};

export type QaRunReport = {
  generatedAt: string;
  runStatus: 'passed' | 'failed' | 'timedout' | 'interrupted';
  durationMs: number;
  summary: QaRunSummary;
  qualityGate: QualityGateResult;
  releaseDecision: QaReleaseDecision;
  stability: QaStabilitySummary;
  regressionRisk: RegressionRiskSummary;
  riskHotspots: RegressionRiskHotspot[];
  tagCoverage: QaTagSummary[];
  suiteHealth: QaSuiteHealth[];
  suitePerformance: QaSuitePerformance[];
  slowTests: SlowTest[];
  failedTests: FailedTest[];
  tests: QaTestResult[];
};

export type QaReporterOptions = {
  outputDir?: string;
  slowTestThresholdMs?: number;
  qualityGate?: Partial<QualityGateOptions>;
};

export const defaultQualityGateOptions: QualityGateOptions = {
  minimumPassRate: 100,
  maximumFailures: 0,
  maximumFlakyTests: 0,
};

export function calculatePassRate(results: QaTestResult[]): number {
  const executed = results.filter((result) => result.status !== STATUS.SKIPPED);
  if (!executed.length) {
    return 100;
  }

  const passed = executed.filter((result) => result.status === STATUS.PASSED).length;
  return percentage(passed, executed.length);
}

export function calculateFailureRate(results: QaTestResult[]): number {
  const executed = results.filter((result) => result.status !== STATUS.SKIPPED);
  if (!executed.length) {
    return 0;
  }

  const failures = executed.filter((result) => isFailureStatus(result.status)).length;
  return percentage(failures, executed.length);
}

export function summarizeRun(results: QaTestResult[]): QaRunSummary {
  const totalDurationMs = results.reduce((sum, result) => sum + result.durationMs, 0);
  const executed = results.filter((result) => result.status !== STATUS.SKIPPED).length;

  return {
    total: results.length,
    executed,
    passed: countByStatus(results, STATUS.PASSED),
    failed: countByStatus(results, STATUS.FAILED),
    skipped: countByStatus(results, STATUS.SKIPPED),
    flaky: countByStatus(results, STATUS.FLAKY),
    timedOut: countByStatus(results, STATUS.TIMED_OUT),
    interrupted: countByStatus(results, STATUS.INTERRUPTED),
    passRate: calculatePassRate(results),
    failureRate: calculateFailureRate(results),
    totalDurationMs,
    averageDurationMs: executed ? Math.round(totalDurationMs / executed) : 0,
    suites: countBy(results, (result) => result.suite || 'unknown'),
  };
}

export function evaluateQualityGate(
  results: QaTestResult[],
  options: Partial<QualityGateOptions> = {},
): QualityGateResult {
  const resolvedOptions: QualityGateOptions = {
    ...defaultQualityGateOptions,
    ...options,
  };
  const summary = summarizeRun(results);
  const failureCount = summary.failed + summary.timedOut + summary.interrupted;
  const checks: QualityGateCheck[] = [
    {
      name: 'pass rate',
      expected: `>= ${resolvedOptions.minimumPassRate}%`,
      actual: `${summary.passRate}%`,
      passed: summary.passRate >= resolvedOptions.minimumPassRate,
    },
    {
      name: 'failures',
      expected: `<= ${resolvedOptions.maximumFailures}`,
      actual: String(failureCount),
      passed: failureCount <= resolvedOptions.maximumFailures,
    },
    {
      name: 'flaky tests',
      expected: `<= ${resolvedOptions.maximumFlakyTests}`,
      actual: String(summary.flaky),
      passed: summary.flaky <= resolvedOptions.maximumFlakyTests,
    },
  ];

  if (resolvedOptions.maximumAverageDurationMs !== undefined) {
    checks.push({
      name: 'average duration',
      expected: `<= ${resolvedOptions.maximumAverageDurationMs}ms`,
      actual: `${summary.averageDurationMs}ms`,
      passed: summary.averageDurationMs <= resolvedOptions.maximumAverageDurationMs,
    });
  }

  if (resolvedOptions.minimumFirstPassRate !== undefined) {
    const stability = summarizeExecutionStability(results);

    checks.push({
      name: 'first-pass rate',
      expected: `>= ${resolvedOptions.minimumFirstPassRate}%`,
      actual: `${stability.firstPassRate}%`,
      passed: stability.firstPassRate >= resolvedOptions.minimumFirstPassRate,
    });
  }

  if (resolvedOptions.requiredTags?.length) {
    checks.push(buildRequiredTagsCheck(results, resolvedOptions.requiredTags));
  }

  return {
    status: checks.every((check) => check.passed) ? 'ready' : 'blocked',
    checks,
    failedChecks: checks.filter((check) => !check.passed),
    summary,
  };
}

export function findSlowTests(results: QaTestResult[], thresholdMs = 1000): SlowTest[] {
  return results
    .filter((result) => result.durationMs >= thresholdMs)
    .sort((first, second) => second.durationMs - first.durationMs)
    .map(({ id, suite, title, status, durationMs }) => ({
      id,
      suite,
      title,
      status,
      durationMs,
    }));
}

export function findFailedTests(results: QaTestResult[]): FailedTest[] {
  return results
    .filter((result) => isFailureStatus(result.status))
    .map(({ id, suite, title, status, durationMs, error }) => ({
      id,
      suite,
      title,
      status,
      durationMs,
      error: error || 'No error message captured',
    }));
}

export function findReleaseBlockers(results: QaTestResult[]): QaTestResult[] {
  return results.filter((result) => isFailureStatus(result.status) || result.status === STATUS.FLAKY);
}

export function summarizeTagCoverage(results: QaTestResult[]): QaTagSummary[] {
  const taggedResults = new Map<string, QaTestResult[]>();

  for (const result of results) {
    const tags = result.tags.length ? [...new Set(result.tags)] : ['untagged'];

    for (const tag of tags) {
      taggedResults.set(tag, [...(taggedResults.get(tag) || []), result]);
    }
  }

  return [...taggedResults.entries()]
    .sort(([firstTag], [secondTag]) => firstTag.localeCompare(secondTag))
    .map(([tag, tagResults]) => {
      const summary = summarizeRun(tagResults);

      return {
        tag,
        total: summary.total,
        executed: summary.executed,
        passed: summary.passed,
        failures: summary.failed + summary.timedOut + summary.interrupted,
        flaky: summary.flaky,
        skipped: summary.skipped,
        passRate: summary.passRate,
        durationMs: summary.totalDurationMs,
      };
    });
}

export function summarizeSuitePerformance(
  results: QaTestResult[],
  slowTestThresholdMs = 1000,
): QaSuitePerformance[] {
  const suites = new Map<string, QaTestResult[]>();

  for (const result of results) {
    const suite = result.suite || 'unknown';
    suites.set(suite, [...(suites.get(suite) || []), result]);
  }

  return [...suites.entries()]
    .map(([suite, suiteResults]) => {
      const summary = summarizeRun(suiteResults);

      return {
        suite,
        total: summary.total,
        executed: summary.executed,
        slowTests: suiteResults.filter((result) => result.durationMs >= slowTestThresholdMs).length,
        totalDurationMs: summary.totalDurationMs,
        averageDurationMs: summary.averageDurationMs,
        maximumDurationMs: Math.max(0, ...suiteResults.map((result) => result.durationMs)),
      };
    })
    .sort((first, second) => (
      second.totalDurationMs - first.totalDurationMs
      || second.maximumDurationMs - first.maximumDurationMs
      || first.suite.localeCompare(second.suite)
    ));
}

export function summarizeSuiteHealth(results: QaTestResult[]): QaSuiteHealth[] {
  const suites = new Map<string, QaTestResult[]>();

  for (const result of results) {
    const suite = result.suite || 'unknown';
    suites.set(suite, [...(suites.get(suite) || []), result]);
  }

  return [...suites.entries()]
    .map(([suite, suiteResults]) => {
      const summary = summarizeRun(suiteResults);
      const failures = summary.failed + summary.timedOut + summary.interrupted;
      const needsAttention = failures > 0 || summary.flaky > 0;
      const status: QaSuiteHealth['status'] = needsAttention ? 'attention' : 'healthy';

      return {
        suite,
        status,
        total: summary.total,
        executed: summary.executed,
        passed: summary.passed,
        failures,
        flaky: summary.flaky,
        skipped: summary.skipped,
        passRate: summary.passRate,
      };
    })
    .sort((first, second) => (
      Number(second.status === 'attention') - Number(first.status === 'attention')
      || second.failures - first.failures
      || second.flaky - first.flaky
      || first.passRate - second.passRate
      || first.suite.localeCompare(second.suite)
    ));
}

export function summarizeExecutionStability(results: QaTestResult[]): QaStabilitySummary {
  const executedResults = results.filter((result) => result.status !== STATUS.SKIPPED);
  const firstPassPassed = executedResults.filter((result) => (
    result.status === STATUS.PASSED && result.attempts === 1
  )).length;

  return {
    executed: executedResults.length,
    firstPassPassed,
    retriedTests: executedResults.filter((result) => result.attempts > 1).length,
    retryAttempts: executedResults.reduce(
      (total, result) => total + Math.max(0, result.attempts - 1),
      0,
    ),
    firstPassRate: executedResults.length
      ? percentage(firstPassPassed, executedResults.length)
      : 100,
  };
}

export function buildReleaseDecision(qualityGate: QualityGateResult): QaReleaseDecision {
  if (qualityGate.status === 'ready') {
    return {
      status: 'ready',
      summary: 'Ready for release based on the configured quality gate.',
      actionItems: ['Review the generated QA summary before deployment.'],
    };
  }

  return {
    status: 'blocked',
    summary: 'Blocked by the configured quality gate.',
    actionItems: qualityGate.failedChecks.map((check) => (
      `Fix ${check.name}: expected ${check.expected}, actual ${check.actual}.`
    )),
  };
}

export function isFailureStatus(status: QaTestStatus): boolean {
  return status === STATUS.FAILED || status === STATUS.TIMED_OUT || status === STATUS.INTERRUPTED;
}

function percentage(value: number, total: number): number {
  return Number(((value / total) * 100).toFixed(2));
}

function countByStatus(results: QaTestResult[], status: QaTestStatus): number {
  return results.filter((result) => result.status === status).length;
}

function countBy<T>(items: T[], keySelector: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((groups, item) => {
    const key = keySelector(item);
    groups[key] = (groups[key] || 0) + 1;
    return groups;
  }, {});
}

function buildRequiredTagsCheck(results: QaTestResult[], requiredTags: string[]): QualityGateCheck {
  const coveredTags = new Set(results.flatMap((result) => result.tags));
  const missingTags = requiredTags.filter((tag) => !coveredTags.has(normalizeTag(tag)));

  return {
    name: 'required tags',
    expected: requiredTags.map(normalizeTag).join(', '),
    actual: missingTags.length ? `missing: ${missingTags.map(normalizeTag).join(', ')}` : 'covered',
    passed: missingTags.length === 0,
  };
}

function normalizeTag(tag: string): string {
  return tag.replace(/^@/, '');
}
