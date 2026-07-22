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
  maximumSkippedTests?: number;
  minimumFirstPassRate?: number;
  minimumClassificationRate?: number;
  maximumAverageDurationMs?: number;
  maximumP95DurationMs?: number;
  maximumTestDurationMs?: number;
  requiredTags?: string[];
};

export type QualityGateCheck = {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
};

export type QaQualityGateSummary = {
  total: number;
  passed: number;
  failed: number;
};

export type QaQualityGatePolicySummary = {
  configuredOptionalChecks: number;
  durationChecks: number;
  classificationChecks: number;
  stabilityChecks: number;
  requiredTags: number;
};

export type QaFailedQualityGateCheckSummary = {
  total: number;
  resultChecks: number;
  stabilityChecks: number;
  coverageChecks: number;
  durationChecks: number;
};

export type QualityGateResult = {
  status: 'ready' | 'blocked';
  policy: QualityGateOptions;
  checks: QualityGateCheck[];
  failedChecks: QualityGateCheck[];
  checkSummary: QaQualityGateSummary;
  summary: QaRunSummary;
};

export type SlowTest = Pick<QaTestResult, 'id' | 'suite' | 'title' | 'status' | 'durationMs'>;

export type SlowTestSummary = {
  total: number;
  thresholdMs: number;
  maximumDurationMs: number;
};

export type DurationBudgetBreach = Pick<
  QaTestResult,
  'id' | 'suite' | 'title' | 'status' | 'durationMs'
>;

export type DurationBudgetBreachSummary = {
  total: number;
  thresholdMs?: number;
  maximumDurationMs: number;
  maximumOverBudgetMs: number;
};

export type FailedTest = Pick<QaTestResult, 'id' | 'suite' | 'title' | 'status' | 'durationMs'> & {
  error: string;
};

export type FailedTestSummary = {
  total: number;
  failed: number;
  timedOut: number;
  interrupted: number;
  totalDurationMs: number;
};

export type SkippedTest = Pick<QaTestResult, 'id' | 'suite' | 'title' | 'tags'>;

export type SkippedTestSummary = {
  total: number;
  tagged: number;
  untagged: number;
  liveTagged: number;
};

export type UntaggedTest = Pick<QaTestResult, 'id' | 'suite' | 'title' | 'status'>;

export type UntaggedTestSummary = {
  total: number;
  executed: number;
  skipped: number;
  nonPassing: number;
};

export type RetriedTest = Pick<
  QaTestResult,
  'id' | 'suite' | 'title' | 'status' | 'durationMs' | 'attempts'
>;

export type RetriedTestSummary = {
  total: number;
  maximumAttempts: number;
  retryAttempts: number;
  totalDurationMs: number;
};

export type FlakyTest = Pick<
  QaTestResult,
  'id' | 'suite' | 'title' | 'durationMs' | 'attempts' | 'tags'
>;

export type FlakyTestSummary = {
  total: number;
  maximumAttempts: number;
  retryAttempts: number;
  totalDurationMs: number;
};

export type NonPassingExecutedTest = Pick<
  QaTestResult,
  'id' | 'suite' | 'title' | 'status' | 'durationMs' | 'attempts' | 'tags'
>;

export type NonPassingExecutedSummary = {
  total: number;
  failed: number;
  timedOut: number;
  interrupted: number;
  flaky: number;
  totalDurationMs: number;
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

export type QaTagCoverageStatusSummary = {
  total: number;
  failing: number;
  flaky: number;
  skipped: number;
};

export type QaTestAreaSummary = {
  area: string;
  status: 'healthy' | 'attention';
  total: number;
  executed: number;
  passed: number;
  failures: number;
  flaky: number;
  skipped: number;
  passRate: number;
  durationMs: number;
};

export type QaTestAreaStatusSummary = {
  total: number;
  healthy: number;
  attention: number;
};

export type QaClassificationSummary = {
  total: number;
  tagged: number;
  untagged: number;
  skipped: number;
  liveTagged: number;
  classificationRate: number;
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

export type QaSuitePerformanceSummary = {
  total: number;
  slowSuites: number;
  totalDurationMs: number;
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

export type QaSuiteHealthSummary = {
  total: number;
  healthy: number;
  attention: number;
};

export type QaStabilitySummary = {
  executed: number;
  firstPassPassed: number;
  retriedTests: number;
  retryAttempts: number;
  averageAttempts: number;
  retryRate: number;
  firstPassRate: number;
};

export type QaDurationProfile = {
  executed: number;
  totalDurationMs: number;
  minimumDurationMs: number;
  averageDurationMs: number;
  medianDurationMs: number;
  p95DurationMs: number;
  maximumDurationMs: number;
};

export type QaDurationHealthSummary = {
  executed: number;
  slowTestThresholdMs: number;
  withinSlowThreshold: number;
  slowTests: number;
  durationBudgetBreaches: number;
};

export type QaReleaseDecision = {
  status: QualityGateResult['status'];
  summary: string;
  actionItems: string[];
};

export type QaReleaseDecisionActionSummary = {
  total: number;
  review: number;
  fix: number;
};

export type QaReleaseReadinessSummary = {
  status: QualityGateResult['status'];
  qualityGateFailures: number;
  releaseBlockers: number;
  nonPassingExecuted: number;
  riskScore: number;
};

export type QaReleaseBlockerSummary = {
  total: number;
  failed: number;
  timedOut: number;
  interrupted: number;
  flaky: number;
};

export type QaRiskHotspotSummary = {
  total: number;
  low: number;
  medium: number;
  high: number;
};

export type QaRunReport = {
  generatedAt: string;
  runStatus: 'passed' | 'failed' | 'timedout' | 'interrupted';
  durationMs: number;
  summary: QaRunSummary;
  qualityGate: QualityGateResult;
  qualityGatePolicySummary: QaQualityGatePolicySummary;
  failedQualityGateCheckSummary: QaFailedQualityGateCheckSummary;
  releaseDecision: QaReleaseDecision;
  releaseDecisionActionSummary: QaReleaseDecisionActionSummary;
  releaseReadinessSummary: QaReleaseReadinessSummary;
  releaseBlockers: QaTestResult[];
  releaseBlockerSummary: QaReleaseBlockerSummary;
  stability: QaStabilitySummary;
  durationProfile: QaDurationProfile;
  durationHealthSummary: QaDurationHealthSummary;
  regressionRisk: RegressionRiskSummary;
  riskHotspotSummary: QaRiskHotspotSummary;
  riskHotspots: RegressionRiskHotspot[];
  tagCoverageStatusSummary: QaTagCoverageStatusSummary;
  tagCoverage: QaTagSummary[];
  classification: QaClassificationSummary;
  testAreaStatusSummary: QaTestAreaStatusSummary;
  testAreas: QaTestAreaSummary[];
  suiteHealthSummary: QaSuiteHealthSummary;
  suiteHealth: QaSuiteHealth[];
  suitePerformanceSummary: QaSuitePerformanceSummary;
  suitePerformance: QaSuitePerformance[];
  slowTestSummary: SlowTestSummary;
  slowTests: SlowTest[];
  durationBudgetBreachSummary: DurationBudgetBreachSummary;
  durationBudgetBreaches: DurationBudgetBreach[];
  failedTestSummary: FailedTestSummary;
  failedTests: FailedTest[];
  skippedTestSummary: SkippedTestSummary;
  skippedTests: SkippedTest[];
  untaggedTestSummary: UntaggedTestSummary;
  untaggedTests: UntaggedTest[];
  retriedTestSummary: RetriedTestSummary;
  retriedTests: RetriedTest[];
  flakyTestSummary: FlakyTestSummary;
  flakyTests: FlakyTest[];
  nonPassingExecutedSummary: NonPassingExecutedSummary;
  nonPassingExecutedTests: NonPassingExecutedTest[];
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
  const durationProfile = summarizeDurationProfile(results);
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

  if (resolvedOptions.maximumSkippedTests !== undefined) {
    checks.push({
      name: 'skipped tests',
      expected: `<= ${resolvedOptions.maximumSkippedTests}`,
      actual: String(summary.skipped),
      passed: summary.skipped <= resolvedOptions.maximumSkippedTests,
    });
  }

  if (resolvedOptions.maximumAverageDurationMs !== undefined) {
    checks.push({
      name: 'average duration',
      expected: `<= ${resolvedOptions.maximumAverageDurationMs}ms`,
      actual: `${summary.averageDurationMs}ms`,
      passed: summary.averageDurationMs <= resolvedOptions.maximumAverageDurationMs,
    });
  }

  if (resolvedOptions.maximumP95DurationMs !== undefined) {
    checks.push({
      name: 'p95 duration',
      expected: `<= ${resolvedOptions.maximumP95DurationMs}ms`,
      actual: `${durationProfile.p95DurationMs}ms`,
      passed: durationProfile.p95DurationMs <= resolvedOptions.maximumP95DurationMs,
    });
  }

  if (resolvedOptions.maximumTestDurationMs !== undefined) {
    checks.push({
      name: 'maximum test duration',
      expected: `<= ${resolvedOptions.maximumTestDurationMs}ms`,
      actual: `${durationProfile.maximumDurationMs}ms`,
      passed: durationProfile.maximumDurationMs <= resolvedOptions.maximumTestDurationMs,
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

  if (resolvedOptions.minimumClassificationRate !== undefined) {
    const classification = summarizeClassification(results);

    checks.push({
      name: 'classification rate',
      expected: `>= ${resolvedOptions.minimumClassificationRate}%`,
      actual: `${classification.classificationRate}%`,
      passed: classification.classificationRate >= resolvedOptions.minimumClassificationRate,
    });
  }

  if (resolvedOptions.requiredTags?.length) {
    checks.push(buildRequiredTagsCheck(results, resolvedOptions.requiredTags));
  }

  return {
    status: checks.every((check) => check.passed) ? 'ready' : 'blocked',
    policy: resolvedOptions,
    checks,
    failedChecks: checks.filter((check) => !check.passed),
    checkSummary: summarizeQualityGateChecks(checks),
    summary,
  };
}

export function summarizeQualityGateChecks(checks: QualityGateCheck[]): QaQualityGateSummary {
  const passed = checks.filter((check) => check.passed).length;

  return {
    total: checks.length,
    passed,
    failed: checks.length - passed,
  };
}

export function summarizeQualityGatePolicy(
  policy: QualityGateOptions,
): QaQualityGatePolicySummary {
  const durationChecks = [
    policy.maximumAverageDurationMs,
    policy.maximumP95DurationMs,
    policy.maximumTestDurationMs,
  ].filter((value) => value !== undefined).length;
  const classificationChecks = policy.minimumClassificationRate === undefined ? 0 : 1;
  const stabilityChecks = policy.minimumFirstPassRate === undefined ? 0 : 1;
  const skippedLimit = policy.maximumSkippedTests === undefined ? 0 : 1;
  const requiredTags = policy.requiredTags?.length || 0;

  return {
    configuredOptionalChecks: durationChecks
      + classificationChecks
      + stabilityChecks
      + skippedLimit
      + (requiredTags > 0 ? 1 : 0),
    durationChecks,
    classificationChecks,
    stabilityChecks,
    requiredTags,
  };
}

export function summarizeFailedQualityGateChecks(
  checks: QualityGateCheck[],
): QaFailedQualityGateCheckSummary {
  return {
    total: checks.length,
    resultChecks: checks.filter((check) => (
      check.name === 'pass rate' || check.name === 'failures'
    )).length,
    stabilityChecks: checks.filter((check) => (
      check.name === 'flaky tests' || check.name === 'first-pass rate'
    )).length,
    coverageChecks: checks.filter((check) => (
      check.name === 'skipped tests'
      || check.name === 'classification rate'
      || check.name === 'required tags'
    )).length,
    durationChecks: checks.filter((check) => (
      check.name === 'average duration'
      || check.name === 'p95 duration'
      || check.name === 'maximum test duration'
    )).length,
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

export function summarizeSlowTests(slowTests: SlowTest[], thresholdMs = 1000): SlowTestSummary {
  return {
    total: slowTests.length,
    thresholdMs,
    maximumDurationMs: Math.max(0, ...slowTests.map((test) => test.durationMs)),
  };
}

export function findDurationBudgetBreaches(
  results: QaTestResult[],
  maximumDurationMs?: number,
): DurationBudgetBreach[] {
  if (maximumDurationMs === undefined) {
    return [];
  }

  return results
    .filter((result) => result.status !== STATUS.SKIPPED)
    .filter((result) => result.durationMs > maximumDurationMs)
    .sort((first, second) => (
      second.durationMs - first.durationMs
      || first.suite.localeCompare(second.suite)
      || first.title.localeCompare(second.title)
    ))
    .map(({ id, suite, title, status, durationMs }) => ({
      id,
      suite,
      title,
      status,
      durationMs,
    }));
}

export function summarizeDurationBudgetBreaches(
  results: QaTestResult[],
  maximumDurationMs?: number,
): DurationBudgetBreachSummary {
  const breaches = findDurationBudgetBreaches(results, maximumDurationMs);
  const maximumBreachDurationMs = Math.max(0, ...breaches.map((test) => test.durationMs));

  return {
    total: breaches.length,
    thresholdMs: maximumDurationMs,
    maximumDurationMs: maximumBreachDurationMs,
    maximumOverBudgetMs: maximumDurationMs === undefined
      ? 0
      : Math.max(0, maximumBreachDurationMs - maximumDurationMs),
  };
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

export function summarizeFailedTests(failedTests: FailedTest[]): FailedTestSummary {
  return {
    total: failedTests.length,
    failed: failedTests.filter((test) => test.status === STATUS.FAILED).length,
    timedOut: failedTests.filter((test) => test.status === STATUS.TIMED_OUT).length,
    interrupted: failedTests.filter((test) => test.status === STATUS.INTERRUPTED).length,
    totalDurationMs: failedTests.reduce((total, test) => total + test.durationMs, 0),
  };
}

export function findSkippedTests(results: QaTestResult[]): SkippedTest[] {
  return results
    .filter((result) => result.status === STATUS.SKIPPED)
    .sort((first, second) => (
      first.suite.localeCompare(second.suite)
      || first.title.localeCompare(second.title)
    ))
    .map(({ id, suite, title, tags }) => ({ id, suite, title, tags }));
}

export function summarizeSkippedTests(skippedTests: SkippedTest[]): SkippedTestSummary {
  return {
    total: skippedTests.length,
    tagged: skippedTests.filter((test) => test.tags.length > 0).length,
    untagged: skippedTests.filter((test) => test.tags.length === 0).length,
    liveTagged: skippedTests.filter((test) => test.tags.includes('live')).length,
  };
}

export function findUntaggedTests(results: QaTestResult[]): UntaggedTest[] {
  return results
    .filter((result) => result.tags.length === 0)
    .sort((first, second) => (
      first.suite.localeCompare(second.suite)
      || first.title.localeCompare(second.title)
    ))
    .map(({ id, suite, title, status }) => ({ id, suite, title, status }));
}

export function summarizeUntaggedTests(untaggedTests: UntaggedTest[]): UntaggedTestSummary {
  return {
    total: untaggedTests.length,
    executed: untaggedTests.filter((test) => test.status !== STATUS.SKIPPED).length,
    skipped: untaggedTests.filter((test) => test.status === STATUS.SKIPPED).length,
    nonPassing: untaggedTests.filter((test) => (
      test.status !== STATUS.PASSED && test.status !== STATUS.SKIPPED
    )).length,
  };
}

export function findRetriedTests(results: QaTestResult[]): RetriedTest[] {
  return results
    .filter((result) => result.attempts > 1)
    .sort((first, second) => (
      second.attempts - first.attempts
      || second.durationMs - first.durationMs
      || first.suite.localeCompare(second.suite)
      || first.title.localeCompare(second.title)
    ))
    .map(({ id, suite, title, status, durationMs, attempts }) => ({
      id,
      suite,
      title,
      status,
      durationMs,
      attempts,
    }));
}

export function summarizeRetriedTests(retriedTests: RetriedTest[]): RetriedTestSummary {
  return {
    total: retriedTests.length,
    maximumAttempts: Math.max(0, ...retriedTests.map((test) => test.attempts)),
    retryAttempts: retriedTests.reduce((total, test) => total + Math.max(0, test.attempts - 1), 0),
    totalDurationMs: retriedTests.reduce((total, test) => total + test.durationMs, 0),
  };
}

export function findFlakyTests(results: QaTestResult[]): FlakyTest[] {
  return results
    .filter((result) => result.status === STATUS.FLAKY)
    .sort((first, second) => (
      second.attempts - first.attempts
      || second.durationMs - first.durationMs
      || first.suite.localeCompare(second.suite)
      || first.title.localeCompare(second.title)
    ))
    .map(({ id, suite, title, durationMs, attempts, tags }) => ({
      id,
      suite,
      title,
      durationMs,
      attempts,
      tags,
    }));
}

export function summarizeFlakyTests(flakyTests: FlakyTest[]): FlakyTestSummary {
  return {
    total: flakyTests.length,
    maximumAttempts: Math.max(0, ...flakyTests.map((test) => test.attempts)),
    retryAttempts: flakyTests.reduce((total, test) => total + Math.max(0, test.attempts - 1), 0),
    totalDurationMs: flakyTests.reduce((total, test) => total + test.durationMs, 0),
  };
}

export function findNonPassingExecutedTests(results: QaTestResult[]): NonPassingExecutedTest[] {
  return results
    .filter((result) => result.status !== STATUS.PASSED)
    .filter((result) => result.status !== STATUS.SKIPPED)
    .sort((first, second) => (
      statusPriority(first.status) - statusPriority(second.status)
      || second.durationMs - first.durationMs
      || first.suite.localeCompare(second.suite)
      || first.title.localeCompare(second.title)
    ))
    .map(({ id, suite, title, status, durationMs, attempts, tags }) => ({
      id,
      suite,
      title,
      status,
      durationMs,
      attempts,
      tags,
    }));
}

export function summarizeNonPassingExecutedTests(
  nonPassingExecutedTests: NonPassingExecutedTest[],
): NonPassingExecutedSummary {
  return {
    total: nonPassingExecutedTests.length,
    failed: countByStatus(nonPassingExecutedTests, STATUS.FAILED),
    timedOut: countByStatus(nonPassingExecutedTests, STATUS.TIMED_OUT),
    interrupted: countByStatus(nonPassingExecutedTests, STATUS.INTERRUPTED),
    flaky: countByStatus(nonPassingExecutedTests, STATUS.FLAKY),
    totalDurationMs: nonPassingExecutedTests.reduce((total, test) => total + test.durationMs, 0),
  };
}

export function findReleaseBlockers(results: QaTestResult[]): QaTestResult[] {
  return results.filter((result) => isFailureStatus(result.status) || result.status === STATUS.FLAKY);
}

export function summarizeReleaseBlockers(results: QaTestResult[]): QaReleaseBlockerSummary {
  const releaseBlockers = findReleaseBlockers(results);

  return {
    total: releaseBlockers.length,
    failed: countByStatus(releaseBlockers, STATUS.FAILED),
    timedOut: countByStatus(releaseBlockers, STATUS.TIMED_OUT),
    interrupted: countByStatus(releaseBlockers, STATUS.INTERRUPTED),
    flaky: countByStatus(releaseBlockers, STATUS.FLAKY),
  };
}

export function summarizeRiskHotspots(riskHotspots: RegressionRiskHotspot[]): QaRiskHotspotSummary {
  return {
    total: riskHotspots.length,
    low: riskHotspots.filter((hotspot) => hotspot.risk === 'low').length,
    medium: riskHotspots.filter((hotspot) => hotspot.risk === 'medium').length,
    high: riskHotspots.filter((hotspot) => hotspot.risk === 'high').length,
  };
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

export function summarizeTagCoverageStatus(
  tagCoverage: QaTagSummary[],
): QaTagCoverageStatusSummary {
  return {
    total: tagCoverage.length,
    failing: tagCoverage.filter((tag) => tag.failures > 0).length,
    flaky: tagCoverage.filter((tag) => tag.flaky > 0).length,
    skipped: tagCoverage.filter((tag) => tag.skipped > 0).length,
  };
}

export function summarizeTestAreas(results: QaTestResult[]): QaTestAreaSummary[] {
  const areas = new Map<string, QaTestResult[]>();

  for (const result of results) {
    const area = getTestArea(result.suite);
    areas.set(area, [...(areas.get(area) || []), result]);
  }

  return [...areas.entries()]
    .map(([area, areaResults]) => {
      const summary = summarizeRun(areaResults);
      const failures = summary.failed + summary.timedOut + summary.interrupted;
      const status: QaTestAreaSummary['status'] = failures > 0 || summary.flaky > 0
        ? 'attention'
        : 'healthy';

      return {
        area,
        status,
        total: summary.total,
        executed: summary.executed,
        passed: summary.passed,
        failures,
        flaky: summary.flaky,
        skipped: summary.skipped,
        passRate: summary.passRate,
        durationMs: summary.totalDurationMs,
      };
    })
    .sort((first, second) => (
      Number(second.status === 'attention') - Number(first.status === 'attention')
      || second.failures - first.failures
      || second.flaky - first.flaky
      || second.durationMs - first.durationMs
      || first.area.localeCompare(second.area)
    ));
}

export function summarizeTestAreaStatus(testAreas: QaTestAreaSummary[]): QaTestAreaStatusSummary {
  return {
    total: testAreas.length,
    healthy: testAreas.filter((area) => area.status === 'healthy').length,
    attention: testAreas.filter((area) => area.status === 'attention').length,
  };
}

export function summarizeClassification(results: QaTestResult[]): QaClassificationSummary {
  const tagged = results.filter((result) => result.tags.length > 0).length;

  return {
    total: results.length,
    tagged,
    untagged: results.length - tagged,
    skipped: countByStatus(results, STATUS.SKIPPED),
    liveTagged: results.filter((result) => result.tags.includes('live')).length,
    classificationRate: results.length ? percentage(tagged, results.length) : 100,
  };
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

export function summarizeSuitePerformanceProfile(
  suitePerformance: QaSuitePerformance[],
): QaSuitePerformanceSummary {
  return {
    total: suitePerformance.length,
    slowSuites: suitePerformance.filter((suite) => suite.slowTests > 0).length,
    totalDurationMs: suitePerformance.reduce((total, suite) => total + suite.totalDurationMs, 0),
    maximumDurationMs: Math.max(0, ...suitePerformance.map((suite) => suite.maximumDurationMs)),
  };
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

export function summarizeSuiteHealthStatus(suiteHealth: QaSuiteHealth[]): QaSuiteHealthSummary {
  return {
    total: suiteHealth.length,
    healthy: suiteHealth.filter((suite) => suite.status === 'healthy').length,
    attention: suiteHealth.filter((suite) => suite.status === 'attention').length,
  };
}

export function summarizeExecutionStability(results: QaTestResult[]): QaStabilitySummary {
  const executedResults = results.filter((result) => result.status !== STATUS.SKIPPED);
  const firstPassPassed = executedResults.filter((result) => (
    result.status === STATUS.PASSED && result.attempts === 1
  )).length;
  const retriedTests = executedResults.filter((result) => result.attempts > 1).length;
  const totalAttempts = executedResults.reduce((total, result) => total + result.attempts, 0);

  return {
    executed: executedResults.length,
    firstPassPassed,
    retriedTests,
    retryAttempts: executedResults.reduce(
      (total, result) => total + Math.max(0, result.attempts - 1),
      0,
    ),
    averageAttempts: executedResults.length
      ? Number((totalAttempts / executedResults.length).toFixed(2))
      : 0,
    retryRate: executedResults.length ? percentage(retriedTests, executedResults.length) : 0,
    firstPassRate: executedResults.length
      ? percentage(firstPassPassed, executedResults.length)
      : 100,
  };
}

export function summarizeDurationProfile(results: QaTestResult[]): QaDurationProfile {
  const durations = results
    .filter((result) => result.status !== STATUS.SKIPPED)
    .map((result) => result.durationMs)
    .sort((first, second) => first - second);
  const totalDurationMs = durations.reduce((total, duration) => total + duration, 0);
  const middle = Math.floor(durations.length / 2);
  const medianDurationMs = durations.length === 0
    ? 0
    : durations.length % 2
      ? durations[middle]
      : Math.round((durations[middle - 1] + durations[middle]) / 2);

  return {
    executed: durations.length,
    totalDurationMs,
    minimumDurationMs: durations[0] || 0,
    averageDurationMs: durations.length ? Math.round(totalDurationMs / durations.length) : 0,
    medianDurationMs,
    p95DurationMs: durations.length ? durations[Math.ceil(durations.length * 0.95) - 1] : 0,
    maximumDurationMs: durations.at(-1) || 0,
  };
}

export function summarizeDurationHealth(
  results: QaTestResult[],
  slowTests: SlowTest[],
  durationBudgetBreaches: DurationBudgetBreach[],
  slowTestThresholdMs = 1000,
): QaDurationHealthSummary {
  const executed = results.filter((result) => result.status !== STATUS.SKIPPED).length;

  return {
    executed,
    slowTestThresholdMs,
    withinSlowThreshold: Math.max(0, executed - slowTests.length),
    slowTests: slowTests.length,
    durationBudgetBreaches: durationBudgetBreaches.length,
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

export function summarizeReleaseDecisionActions(
  releaseDecision: QaReleaseDecision,
): QaReleaseDecisionActionSummary {
  return {
    total: releaseDecision.actionItems.length,
    review: releaseDecision.actionItems.filter((item) => item.startsWith('Review ')).length,
    fix: releaseDecision.actionItems.filter((item) => item.startsWith('Fix ')).length,
  };
}

export function summarizeReleaseReadiness(
  qualityGate: QualityGateResult,
  releaseBlockerSummary: QaReleaseBlockerSummary,
  nonPassingExecutedSummary: NonPassingExecutedSummary,
  regressionRisk: RegressionRiskSummary,
): QaReleaseReadinessSummary {
  return {
    status: qualityGate.status,
    qualityGateFailures: qualityGate.checkSummary.failed,
    releaseBlockers: releaseBlockerSummary.total,
    nonPassingExecuted: nonPassingExecutedSummary.total,
    riskScore: regressionRisk.score,
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

function statusPriority(status: QaTestStatus): number {
  if (status === STATUS.FAILED) {
    return 0;
  }

  if (status === STATUS.TIMED_OUT) {
    return 1;
  }

  if (status === STATUS.INTERRUPTED) {
    return 2;
  }

  if (status === STATUS.FLAKY) {
    return 3;
  }

  return 4;
}

function getTestArea(suite: string): string {
  const [area] = suite.split('/');
  return area || 'unknown';
}
