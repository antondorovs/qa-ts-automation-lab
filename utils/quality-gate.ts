export type TestStatus = 'passed' | 'failed' | 'skipped' | 'flaky' | 'blocked';

export type TestResult = {
  id: string;
  suite: string;
  title: string;
  status: TestStatus;
  durationMs: number;
  owner?: string;
  tags?: string[];
};

export type QualityGateOptions = {
  minimumPassRate: number;
  maximumFailures: number;
  maximumFlakyTests: number;
  maximumAverageDurationMs: number;
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
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    flaky: number;
    blocked: number;
    passRate: number;
    averageDurationMs: number;
  };
};

export const defaultQualityGateOptions: QualityGateOptions = {
  minimumPassRate: 95,
  maximumFailures: 0,
  maximumFlakyTests: 2,
  maximumAverageDurationMs: 1500,
  requiredTags: ['smoke'],
};

export function evaluateQualityGate(
  results: TestResult[],
  options: QualityGateOptions = defaultQualityGateOptions,
): QualityGateResult {
  const summary = summarizeResults(results);
  const checks: QualityGateCheck[] = [
    {
      name: 'pass rate',
      expected: `>= ${options.minimumPassRate}%`,
      actual: `${summary.passRate}%`,
      passed: summary.passRate >= options.minimumPassRate,
    },
    {
      name: 'failures',
      expected: `<= ${options.maximumFailures}`,
      actual: String(summary.failed + summary.blocked),
      passed: summary.failed + summary.blocked <= options.maximumFailures,
    },
    {
      name: 'flaky tests',
      expected: `<= ${options.maximumFlakyTests}`,
      actual: String(summary.flaky),
      passed: summary.flaky <= options.maximumFlakyTests,
    },
    {
      name: 'average duration',
      expected: `<= ${options.maximumAverageDurationMs}ms`,
      actual: `${summary.averageDurationMs}ms`,
      passed: summary.averageDurationMs <= options.maximumAverageDurationMs,
    },
  ];

  if (options.requiredTags?.length) {
    checks.push(buildRequiredTagsCheck(results, options.requiredTags));
  }

  return {
    status: checks.every((check) => check.passed) ? 'ready' : 'blocked',
    checks,
    summary,
  };
}

export function summarizeResults(results: TestResult[]): QualityGateResult['summary'] {
  const totalDuration = results.reduce((sum, result) => sum + result.durationMs, 0);
  const total = results.length;
  const passed = countByStatus(results, 'passed');
  const failed = countByStatus(results, 'failed');
  const skipped = countByStatus(results, 'skipped');
  const flaky = countByStatus(results, 'flaky');
  const blocked = countByStatus(results, 'blocked');

  return {
    total,
    passed,
    failed,
    skipped,
    flaky,
    blocked,
    passRate: total ? Number(((passed / total) * 100).toFixed(2)) : 0,
    averageDurationMs: total ? Math.round(totalDuration / total) : 0,
  };
}

export function groupResultsByOwner(results: TestResult[]) {
  return results.reduce<Record<string, TestResult[]>>((groups, result) => {
    const owner = result.owner || 'unassigned';
    groups[owner] = groups[owner] || [];
    groups[owner].push(result);
    return groups;
  }, {});
}

export function findReleaseBlockers(results: TestResult[]) {
  return results.filter((result) => result.status === 'failed' || result.status === 'blocked');
}

function countByStatus(results: TestResult[], status: TestStatus) {
  return results.filter((result) => result.status === status).length;
}

function buildRequiredTagsCheck(results: TestResult[], requiredTags: string[]): QualityGateCheck {
  const coveredTags = new Set(results.flatMap((result) => result.tags || []));
  const missingTags = requiredTags.filter((tag) => !coveredTags.has(tag));

  return {
    name: 'required tags',
    expected: requiredTags.join(', '),
    actual: missingTags.length ? `missing: ${missingTags.join(', ')}` : 'covered',
    passed: missingTags.length === 0,
  };
}
