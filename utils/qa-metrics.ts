export const STATUS = {
  PASSED: 'passed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  FLAKY: 'flaky',
} as const;

export type QaStatus = (typeof STATUS)[keyof typeof STATUS];

export type QaTestResult = {
  testName: string;
  status: QaStatus;
  suite?: string;
  durationMs?: number;
  error?: string;
};

export type QaRunSummary = {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  passRate: number;
  failureRate: number;
  totalDurationMs: number;
  averageDurationMs: number;
  suites: Record<string, number>;
};

export type ReleaseGateOptions = {
  minimumPassRate?: number;
  maximumFailedTests?: number;
  maximumFlakyTests?: number;
};

export type ReleaseGateCheck = {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
};

export type ReleaseGate = {
  status: 'ready' | 'blocked';
  checks: ReleaseGateCheck[];
};

export type SlowTest = {
  testName: string;
  suite?: string;
  durationMs?: number;
  status: QaStatus;
};

export type FailedTest = {
  testName: string;
  suite?: string;
  error: string;
  durationMs: number;
};

export type FlakyCandidate = {
  suite: string;
  testName: string;
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  lastStatus: QaStatus;
};

export type DailyQaSnapshot = {
  generatedAt: string;
  summary: QaRunSummary;
  failedTests: FailedTest[];
  slowTests: SlowTest[];
  flakyCandidates: FlakyCandidate[];
  releaseGate: ReleaseGate;
};

function countBy<T>(items: T[], keySelector: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((accumulator, item) => {
    const key = keySelector(item);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

export function calculatePassRate(results: QaTestResult[]): number {
  if (!results.length) {
    return 0;
  }

  const passed = results.filter((result) => result.status === STATUS.PASSED).length;
  return Number(((passed / results.length) * 100).toFixed(2));
}

export function calculateFailureRate(results: QaTestResult[]): number {
  if (!results.length) {
    return 0;
  }

  const failed = results.filter((result) => result.status === STATUS.FAILED).length;
  return Number(((failed / results.length) * 100).toFixed(2));
}

export function summarizeRun(results: QaTestResult[]): QaRunSummary {
  const statusCounts = countBy(results, (result) => result.status);
  const suiteCounts = countBy(results, (result) => result.suite || 'unknown');
  const totalDurationMs = results.reduce((sum, result) => sum + (result.durationMs || 0), 0);

  return {
    total: results.length,
    passed: statusCounts[STATUS.PASSED] || 0,
    failed: statusCounts[STATUS.FAILED] || 0,
    skipped: statusCounts[STATUS.SKIPPED] || 0,
    flaky: statusCounts[STATUS.FLAKY] || 0,
    passRate: calculatePassRate(results),
    failureRate: calculateFailureRate(results),
    totalDurationMs,
    averageDurationMs: results.length ? Math.round(totalDurationMs / results.length) : 0,
    suites: suiteCounts,
  };
}

export function findSlowTests(results: QaTestResult[], thresholdMs = 1000): SlowTest[] {
  return results
    .filter((result) => (result.durationMs || 0) >= thresholdMs)
    .sort((first, second) => (second.durationMs || 0) - (first.durationMs || 0))
    .map((result) => ({
      testName: result.testName,
      suite: result.suite,
      durationMs: result.durationMs,
      status: result.status,
    }));
}

export function findFailedTests(results: QaTestResult[]): FailedTest[] {
  return results
    .filter((result) => result.status === STATUS.FAILED)
    .map((result) => ({
      testName: result.testName,
      suite: result.suite,
      error: result.error || 'No error message captured',
      durationMs: result.durationMs || 0,
    }));
}

export function detectFlakyCandidates(history: QaTestResult[]): FlakyCandidate[] {
  const groupedByTest = history.reduce<Record<string, QaTestResult[]>>((accumulator, result) => {
    const key = `${result.suite || 'unknown'}::${result.testName}`;
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(result);
    return accumulator;
  }, {});

  return Object.entries(groupedByTest)
    .filter(([, runs]) => {
      const statuses = new Set(runs.map((run) => run.status));
      return statuses.has(STATUS.PASSED) && statuses.has(STATUS.FAILED);
    })
    .map(([key, runs]) => {
      const [suite, testName] = key.split('::');
      return {
        suite,
        testName,
        totalRuns: runs.length,
        passedRuns: runs.filter((run) => run.status === STATUS.PASSED).length,
        failedRuns: runs.filter((run) => run.status === STATUS.FAILED).length,
        lastStatus: runs[runs.length - 1].status,
      };
    })
    .sort((first, second) => second.failedRuns - first.failedRuns);
}

export function buildReleaseGate(summary: QaRunSummary, options: ReleaseGateOptions = {}): ReleaseGate {
  const minimumPassRate = options.minimumPassRate || 95;
  const maximumFailedTests = options.maximumFailedTests ?? 0;
  const maximumFlakyTests = options.maximumFlakyTests ?? 3;

  const checks: ReleaseGateCheck[] = [
    {
      name: 'pass rate',
      expected: `>= ${minimumPassRate}%`,
      actual: `${summary.passRate}%`,
      passed: summary.passRate >= minimumPassRate,
    },
    {
      name: 'failed tests',
      expected: `<= ${maximumFailedTests}`,
      actual: String(summary.failed),
      passed: summary.failed <= maximumFailedTests,
    },
    {
      name: 'flaky tests',
      expected: `<= ${maximumFlakyTests}`,
      actual: String(summary.flaky),
      passed: summary.flaky <= maximumFlakyTests,
    },
  ];

  return {
    status: checks.every((check) => check.passed) ? 'ready' : 'blocked',
    checks,
  };
}

export function createDailyQaSnapshot(results: QaTestResult[], history: QaTestResult[] = []): DailyQaSnapshot {
  const summary = summarizeRun(results);
  const failedTests = findFailedTests(results);
  const slowTests = findSlowTests(results);
  const flakyCandidates = detectFlakyCandidates(history.concat(results));
  const releaseGate = buildReleaseGate(summary);

  return {
    generatedAt: new Date().toISOString(),
    summary,
    failedTests,
    slowTests,
    flakyCandidates,
    releaseGate,
  };
}
