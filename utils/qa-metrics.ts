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

export type QualityGateResult = {
  status: 'ready' | 'blocked';
  policy: QualityGateOptions;
  checks: QualityGateCheck[];
  failedChecks: QualityGateCheck[];
  summary: QaRunSummary;
};

export type SlowTest = Pick<QaTestResult, 'id' | 'suite' | 'title' | 'status' | 'durationMs'>;

export type FailedTest = Pick<QaTestResult, 'id' | 'suite' | 'title' | 'status' | 'durationMs'> & {
  error: string;
};

export type SkippedTest = Pick<QaTestResult, 'id' | 'suite' | 'title' | 'tags'>;

export type UntaggedTest = Pick<QaTestResult, 'id' | 'suite' | 'title' | 'status'>;

export type RetriedTest = Pick<
  QaTestResult,
  'id' | 'suite' | 'title' | 'status' | 'durationMs' | 'attempts'
>;

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

export type QaDurationProfile = {
  executed: number;
  totalDurationMs: number;
  averageDurationMs: number;
  medianDurationMs: number;
  p95DurationMs: number;
  maximumDurationMs: number;
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
  releaseBlockers: QaTestResult[];
  stability: QaStabilitySummary;
  durationProfile: QaDurationProfile;
  regressionRisk: RegressionRiskSummary;
  riskHotspots: RegressionRiskHotspot[];
  tagCoverage: QaTagSummary[];
  classification: QaClassificationSummary;
  testAreas: QaTestAreaSummary[];
  suiteHealth: QaSuiteHealth[];
  suitePerformance: QaSuitePerformance[];
  slowTests: SlowTest[];
  failedTests: FailedTest[];
  skippedTests: SkippedTest[];
  untaggedTests: UntaggedTest[];
  retriedTests: RetriedTest[];
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

export function findSkippedTests(results: QaTestResult[]): SkippedTest[] {
  return results
    .filter((result) => result.status === STATUS.SKIPPED)
    .sort((first, second) => (
      first.suite.localeCompare(second.suite)
      || first.title.localeCompare(second.title)
    ))
    .map(({ id, suite, title, tags }) => ({ id, suite, title, tags }));
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
    averageDurationMs: durations.length ? Math.round(totalDurationMs / durations.length) : 0,
    medianDurationMs,
    p95DurationMs: durations.length ? durations[Math.ceil(durations.length * 0.95) - 1] : 0,
    maximumDurationMs: durations.at(-1) || 0,
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

function getTestArea(suite: string): string {
  const [area] = suite.split('/');
  return area || 'unknown';
}
