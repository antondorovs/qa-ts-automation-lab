const STATUS = {
  PASSED: 'passed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  FLAKY: 'flaky',
};

function countBy(items, keySelector) {
  return items.reduce((accumulator, item) => {
    const key = keySelector(item);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function calculatePassRate(results) {
  if (!results.length) {
    return 0;
  }

  const passed = results.filter((result) => result.status === STATUS.PASSED).length;
  return Number(((passed / results.length) * 100).toFixed(2));
}

function calculateFailureRate(results) {
  if (!results.length) {
    return 0;
  }

  const failed = results.filter((result) => result.status === STATUS.FAILED).length;
  return Number(((failed / results.length) * 100).toFixed(2));
}

function summarizeRun(results) {
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

function findSlowTests(results, thresholdMs = 1000) {
  return results
    .filter((result) => (result.durationMs || 0) >= thresholdMs)
    .sort((first, second) => second.durationMs - first.durationMs)
    .map((result) => ({
      testName: result.testName,
      suite: result.suite,
      durationMs: result.durationMs,
      status: result.status,
    }));
}

function findFailedTests(results) {
  return results
    .filter((result) => result.status === STATUS.FAILED)
    .map((result) => ({
      testName: result.testName,
      suite: result.suite,
      error: result.error || 'No error message captured',
      durationMs: result.durationMs || 0,
    }));
}

function detectFlakyCandidates(history) {
  const groupedByTest = history.reduce((accumulator, result) => {
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

function buildReleaseGate(summary, options = {}) {
  const minimumPassRate = options.minimumPassRate || 95;
  const maximumFailedTests = options.maximumFailedTests ?? 0;
  const maximumFlakyTests = options.maximumFlakyTests ?? 3;

  const checks = [
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

function createDailyQaSnapshot(results, history = []) {
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

module.exports = {
  STATUS,
  buildReleaseGate,
  calculateFailureRate,
  calculatePassRate,
  createDailyQaSnapshot,
  detectFlakyCandidates,
  findFailedTests,
  findSlowTests,
  summarizeRun,
};
