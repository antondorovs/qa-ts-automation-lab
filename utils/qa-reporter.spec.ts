import { test, expect } from '@playwright/test';
import {
  STATUS,
  buildReleaseDecision,
  evaluateQualityGate,
  findDurationBudgetBreaches,
  findFlakyTests,
  findNonPassingExecutedTests,
  findRetriedTests,
  findSkippedTests,
  findUntaggedTests,
  summarizeClassification,
  summarizeDurationBudgetBreaches,
  summarizeDurationHealth,
  summarizeDurationProfile,
  summarizeExecutionStability,
  summarizeFailedTests,
  summarizeFailedQualityGateChecks,
  summarizeFlakyTests,
  summarizeNonPassingExecutedTests,
  summarizeQualityGatePolicy,
  summarizeQualityGateChecks,
  summarizeReleaseDecisionActions,
  summarizeReleaseReadiness,
  summarizeReleaseBlockers,
  summarizeRiskHotspots,
  summarizeRetriedTests,
  summarizeRun,
  summarizeSkippedTests,
  summarizeSlowTests,
  summarizeSuiteHealth,
  summarizeSuiteHealthStatus,
  summarizeSuitePerformance,
  summarizeSuitePerformanceProfile,
  summarizeTagCoverage,
  summarizeTagCoverageStatus,
  summarizeTestAreaStatus,
  summarizeTestAreas,
  summarizeUntaggedTests,
  type QaTestResult,
} from './qa-metrics';
import { buildQaRunReport, renderQaReportMarkdown } from './qa-report';
import { mapPlaywrightResult, mapPlaywrightStatus } from './qa-reporter';

test.describe('@utils @contract QA run intelligence', () => {
  test('Playwright outcomes should map retries and failures to QA statuses', () => {
    expect(mapPlaywrightStatus('expected', 'passed')).toBe(STATUS.PASSED);
    expect(mapPlaywrightStatus('expected', 'failed')).toBe(STATUS.PASSED);
    expect(mapPlaywrightStatus('flaky', 'passed')).toBe(STATUS.FLAKY);
    expect(mapPlaywrightStatus('unexpected', 'timedOut')).toBe(STATUS.TIMED_OUT);
    expect(mapPlaywrightStatus('unexpected', 'interrupted')).toBe(STATUS.INTERRUPTED);
    expect(mapPlaywrightStatus('skipped', 'skipped')).toBe(STATUS.SKIPPED);

    const flaky = mapPlaywrightResult({
      id: 'ui-login',
      suite: 'playwright/login.spec.ts',
      title: 'login should work',
      tags: ['@ui', '@smoke'],
      outcome: 'flaky',
      attempts: [
        {
          duration: 800,
          status: 'failed',
          error: { message: 'first attempt failed' },
        },
        {
          duration: 300,
          status: 'passed',
          error: undefined,
        },
      ],
    });

    expect(flaky).toMatchObject({
      status: STATUS.FLAKY,
      durationMs: 1100,
      attempts: 2,
      tags: ['ui', 'smoke'],
    });
  });

  test('skipped tests should stay visible without lowering pass rate', () => {
    const results = [
      createResult('passing smoke', STATUS.PASSED),
      createResult('disabled live check', STATUS.SKIPPED),
    ];
    const summary = summarizeRun(results);

    expect(summary).toMatchObject({
      total: 2,
      executed: 1,
      passed: 1,
      skipped: 1,
      executionRate: 50,
      skippedRate: 50,
      passRate: 100,
    });
  });

  test('Markdown summary should include failure and flaky rates for executed tests', () => {
    const report = buildQaRunReport([
      createResult('passing smoke', STATUS.PASSED),
      createResult('broken contract', STATUS.FAILED),
      createResult('unstable checkout', STATUS.FLAKY),
      createResult('disabled live check', STATUS.SKIPPED),
    ], {
      generatedAt: '2026-07-09T13:00:00.000Z',
      runStatus: 'failed',
      durationMs: 200,
    });
    const markdown = renderQaReportMarkdown(report);

    expect(report.summary.failureRate).toBe(33.33);
    expect(report.summary.flakyRate).toBe(33.33);
    expect(markdown).toContain('Failure rate');
    expect(markdown).toContain('Flaky rate');
    expect(markdown).toContain('| 4 | 3 | 1 | 1 | 1 | 1 | 75% | 25% | 33.33% | 33.33% | 33.33% | 200ms |');
  });

  test('Markdown report should include final status breakdown', () => {
    const report = buildQaRunReport([
      createResult('passing smoke', STATUS.PASSED),
      createResult('broken contract', STATUS.FAILED),
      createResult('flaky checkout', STATUS.FLAKY),
      createResult('timed out payment', STATUS.TIMED_OUT),
      createResult('interrupted flow', STATUS.INTERRUPTED),
      createResult('disabled live check', STATUS.SKIPPED),
    ], {
      generatedAt: '2026-07-12T13:00:00.000Z',
      runStatus: 'failed',
      durationMs: 600,
    });
    const markdown = renderQaReportMarkdown(report);

    expect(markdown).toContain('## Status Breakdown');
    expect(markdown).toContain('| Passed | Failed | Flaky | Timed out | Interrupted | Skipped |');
    expect(markdown).toContain('| 1 | 1 | 1 | 1 | 1 | 1 |');
  });

  test('Markdown report should summarize failed quality-gate checks', () => {
    const report = buildQaRunReport([
      createResult('passing smoke', STATUS.PASSED),
      createResult('broken contract', STATUS.FAILED, 200),
      createResult('timed out checkout', STATUS.TIMED_OUT, 300),
      createResult('interrupted setup', STATUS.INTERRUPTED, 400),
    ], {
      generatedAt: '2026-07-09T14:00:00.000Z',
      runStatus: 'failed',
      durationMs: 1000,
    });
    const markdown = renderQaReportMarkdown(report);

    expect(report.qualityGate.failedChecks.map((check) => check.name)).toEqual([
      'pass rate',
      'failures',
    ]);
    expect(summarizeFailedQualityGateChecks(report.qualityGate.failedChecks)).toEqual({
      total: 2,
      resultChecks: 2,
      stabilityChecks: 0,
      coverageChecks: 0,
      durationChecks: 0,
    });
    expect(report.failedQualityGateCheckSummary).toEqual({
      total: 2,
      resultChecks: 2,
      stabilityChecks: 0,
      coverageChecks: 0,
      durationChecks: 0,
    });
    expect(summarizeFailedTests(report.failedTests)).toEqual({
      total: 3,
      failed: 1,
      timedOut: 1,
      interrupted: 1,
      minimumDurationMs: 200,
      averageDurationMs: 300,
      maximumDurationMs: 400,
      totalDurationMs: 900,
    });
    expect(report.failedTestSummary).toEqual({
      total: 3,
      failed: 1,
      timedOut: 1,
      interrupted: 1,
      minimumDurationMs: 200,
      averageDurationMs: 300,
      maximumDurationMs: 400,
      totalDurationMs: 900,
    });
    expect(markdown).toContain('## Blocked Check Summary');
    expect(markdown).toContain('| 2 | 2 | 0 | 0 | 0 |');
    expect(markdown).toContain('## Blocked Checks');
    expect(markdown).toContain('| pass rate | >= 100% | 25% |');
    expect(markdown).toContain('| failures | <= 0 | 3 |');
    expect(markdown).toContain('## Failure Summary');
    expect(markdown).toContain('| Total | Failed | Timed out | Interrupted | Minimum duration | Average duration | Maximum duration | Total duration |');
    expect(markdown).toContain('| 3 | 1 | 1 | 1 | 200ms | 300ms | 400ms | 900ms |');
  });

  test('quality gate check summary should be available in serialized reports', () => {
    const qualityGate = evaluateQualityGate([
      createResult('passing smoke', STATUS.PASSED),
      createResult('broken contract', STATUS.FAILED),
    ]);
    const report = buildQaRunReport([
      createResult('passing smoke', STATUS.PASSED),
      createResult('broken contract', STATUS.FAILED),
    ], {
      generatedAt: '2026-07-12T12:00:00.000Z',
      runStatus: 'failed',
      durationMs: 200,
    });

    expect(summarizeQualityGateChecks(qualityGate.checks)).toEqual({
      total: 3,
      passed: 1,
      failed: 2,
      passRate: 33.33,
      failureRate: 66.67,
    });
    expect(report.qualityGate.checkSummary).toEqual({
      total: 3,
      passed: 1,
      failed: 2,
      passRate: 33.33,
      failureRate: 66.67,
    });
    expect(JSON.parse(JSON.stringify(report)).qualityGate.checkSummary).toEqual({
      total: 3,
      passed: 1,
      failed: 2,
      passRate: 33.33,
      failureRate: 66.67,
    });
  });

  test('quality gate should enforce an optional skipped test limit', () => {
    const results = [
      createResult('passing smoke', STATUS.PASSED),
      createResult('disabled live check', STATUS.SKIPPED),
      createResult('disabled draft scenario', STATUS.SKIPPED),
    ];
    const defaultGate = evaluateQualityGate(results);
    const strictGate = evaluateQualityGate(results, {
      maximumSkippedTests: 1,
    });

    expect(defaultGate.status).toBe('ready');
    expect(strictGate.status).toBe('blocked');
    expect(strictGate.policy.maximumSkippedTests).toBe(1);
    expect(strictGate.failedChecks).toEqual([
      {
        name: 'skipped tests',
        expected: '<= 1',
        actual: '2',
        passed: false,
      },
    ]);
  });

  test('quality gate should enforce an optional classification rate', () => {
    const results = [
      createResult('classified smoke', STATUS.PASSED, 100, ['smoke']),
      createResult('untagged contract', STATUS.PASSED),
    ];
    const defaultGate = evaluateQualityGate(results);
    const strictGate = evaluateQualityGate(results, {
      minimumClassificationRate: 100,
    });

    expect(defaultGate.status).toBe('ready');
    expect(strictGate.status).toBe('blocked');
    expect(strictGate.policy.minimumClassificationRate).toBe(100);
    expect(strictGate.failedChecks).toEqual([
      {
        name: 'classification rate',
        expected: '>= 100%',
        actual: '50%',
        passed: false,
      },
    ]);
  });

  test('quality gate should enforce an optional p95 duration limit', () => {
    const results = [
      createResult('fast contract', STATUS.PASSED, 100),
      createResult('regular contract', STATUS.PASSED, 200),
      createResult('slow contract', STATUS.PASSED, 900),
      createResult('disabled diagnostic', STATUS.SKIPPED, 0),
    ];
    const defaultGate = evaluateQualityGate(results);
    const strictGate = evaluateQualityGate(results, {
      maximumP95DurationMs: 800,
    });

    expect(defaultGate.status).toBe('ready');
    expect(strictGate.status).toBe('blocked');
    expect(strictGate.policy.maximumP95DurationMs).toBe(800);
    expect(strictGate.failedChecks).toEqual([
      {
        name: 'p95 duration',
        expected: '<= 800ms',
        actual: '900ms',
        passed: false,
      },
    ]);
  });

  test('quality gate should enforce an optional maximum test duration', () => {
    const results = [
      createResult('fast contract', STATUS.PASSED, 100),
      createResult('regular contract', STATUS.PASSED, 200),
      createResult('outlier contract', STATUS.PASSED, 1200),
      createResult('disabled diagnostic', STATUS.SKIPPED, 0),
    ];
    const strictGate = evaluateQualityGate(results, {
      maximumTestDurationMs: 1000,
    });

    expect(strictGate.status).toBe('blocked');
    expect(strictGate.policy.maximumTestDurationMs).toBe(1000);
    expect(strictGate.failedChecks).toEqual([
      {
        name: 'maximum test duration',
        expected: '<= 1000ms',
        actual: '1200ms',
        passed: false,
      },
    ]);
  });

  test('duration budget breaches should identify executed tests over the configured maximum', () => {
    const results = [
      createResult('fast contract', STATUS.PASSED, 100),
      createResult('outlier contract', STATUS.PASSED, 1200),
      createResult('severe outlier', STATUS.PASSED, 1500),
      createResult('disabled diagnostic', STATUS.SKIPPED, 5000),
    ];
    const breaches = findDurationBudgetBreaches(results, 1000);
    const breachSummary = summarizeDurationBudgetBreaches(results, 1000);
    const report = buildQaRunReport(results, {
      generatedAt: '2026-07-09T12:00:00.000Z',
      runStatus: 'passed',
      durationMs: 7800,
    }, {
      qualityGate: {
        maximumTestDurationMs: 1000,
      },
    });
    const markdown = renderQaReportMarkdown(report);

    expect(breachSummary).toEqual({
      executed: 3,
      withinBudget: 1,
      withinBudgetRate: 33.33,
      totalBudgetMs: 3000,
      budgetUtilizationRate: 93.33,
      total: 2,
      breachRate: 66.67,
      thresholdMs: 1000,
      minimumDurationMs: 1200,
      averageDurationMs: 1350,
      maximumDurationMs: 1500,
      totalDurationMs: 2700,
      executedDurationMs: 2800,
      breachDurationRate: 96.43,
      minimumOverBudgetMs: 200,
      minimumOverBudgetRate: 20,
      averageOverBudgetMs: 350,
      averageOverBudgetRate: 35,
      maximumOverBudgetMs: 500,
      maximumOverBudgetRate: 50,
      totalOverBudgetMs: 700,
      overBudgetDurationRate: 25,
    });
    expect(breaches).toEqual([
      {
        id: 'severe-outlier',
        suite: 'utils/qa-reporter.spec.ts',
        title: 'severe outlier',
        status: STATUS.PASSED,
        durationMs: 1500,
        budgetMs: 1000,
        budgetUtilizationRate: 150,
        overBudgetMs: 500,
        overBudgetRate: 50,
      },
      {
        id: 'outlier-contract',
        suite: 'utils/qa-reporter.spec.ts',
        title: 'outlier contract',
        status: STATUS.PASSED,
        durationMs: 1200,
        budgetMs: 1000,
        budgetUtilizationRate: 120,
        overBudgetMs: 200,
        overBudgetRate: 20,
      },
    ]);
    expect(report.durationBudgetBreachSummary).toEqual(breachSummary);
    expect(report.durationBudgetBreaches).toEqual(breaches);
    expect(markdown).toContain('## Duration Budget Breach Summary');
    expect(markdown).toContain('| Executed | Within budget | Within budget rate | Total budget | Budget utilization | Breaches | Breach rate | Threshold | Minimum duration | Average duration | Maximum duration | Breach duration | Executed duration | Breach duration rate | Minimum over budget | Minimum over budget rate | Average over budget | Average over budget rate | Maximum over budget | Maximum over budget rate | Total over budget | Over-budget duration rate |');
    expect(markdown).toContain('| 3 | 1 | 33.33% | 3.00s | 93.33% | 2 | 66.67% | 1.00s | 1.20s | 1.35s | 1.50s | 2.70s | 2.80s | 96.43% | 200ms | 20% | 350ms | 35% | 500ms | 50% | 700ms | 25% |');
    expect(markdown).toContain('## Duration Budget Breaches');
    expect(markdown).toContain('| Test | Suite | Status | Duration | Budget | Budget utilization | Over budget | Over budget rate |');
    expect(markdown).toContain('| severe outlier | utils/qa-reporter.spec.ts | passed | 1.50s | 1.00s | 150% | 500ms | 50% |');
    expect(markdown).toContain('| outlier contract | utils/qa-reporter.spec.ts | passed | 1.20s | 1.00s | 120% | 200ms | 20% |');
    expect(markdown).not.toContain('| disabled diagnostic | utils/qa-reporter.spec.ts | skipped | 5.00s |');
  });

  test('quality gate should block flaky, timed out and interrupted tests', () => {
    const statuses = [STATUS.FLAKY, STATUS.TIMED_OUT, STATUS.INTERRUPTED];

    for (const status of statuses) {
      const gate = evaluateQualityGate([
        createResult(`result ${status}`, status),
      ]);

      expect(gate.status, status).toBe('blocked');
    }
  });

  test('report should expose slow tests, tags and valid Markdown summary', () => {
    const tests = [
      createResult('fast API contract', STATUS.PASSED, 120, ['api', 'contract']),
      createResult('slow UI smoke', STATUS.PASSED, 1800, ['ui', 'smoke']),
    ];
    const report = buildQaRunReport(tests, {
      generatedAt: '2026-06-08T12:00:00.000Z',
      runStatus: 'passed',
      durationMs: 1920,
    }, {
      slowTestThresholdMs: 1000,
      qualityGate: {
        maximumSkippedTests: 0,
        minimumClassificationRate: 100,
        maximumP95DurationMs: 2000,
        maximumTestDurationMs: 2000,
        requiredTags: ['@smoke', 'contract'],
      },
    });
    const markdown = renderQaReportMarkdown(report);
    const serialized = JSON.parse(JSON.stringify(report)) as typeof report;

    expect(report.qualityGate.status).toBe('ready');
    expect(report.qualityGate.policy).toEqual({
      minimumPassRate: 100,
      maximumFailures: 0,
      maximumFlakyTests: 0,
      maximumSkippedTests: 0,
      minimumClassificationRate: 100,
      maximumP95DurationMs: 2000,
      maximumTestDurationMs: 2000,
      requiredTags: ['@smoke', 'contract'],
    });
    expect(summarizeQualityGatePolicy(report.qualityGate.policy)).toEqual({
      configuredOptionalChecks: 5,
      durationChecks: 2,
      classificationChecks: 1,
      stabilityChecks: 0,
      requiredTags: 2,
    });
    expect(report.qualityGatePolicySummary).toEqual({
      configuredOptionalChecks: 5,
      durationChecks: 2,
      classificationChecks: 1,
      stabilityChecks: 0,
      requiredTags: 2,
    });
    expect(report.qualityGate.failedChecks).toEqual([]);
    expect(report.releaseDecision).toEqual({
      status: 'ready',
      summary: 'Ready for release based on the configured quality gate.',
      actionItems: ['Review the generated QA summary before deployment.'],
    });
    expect(report.releaseDecisionActionSummary).toEqual({
      total: 1,
      review: 1,
      fix: 0,
    });
    expect(report.stability).toEqual({
      executed: 2,
      firstPassPassed: 2,
      retriedTests: 0,
      retryAttempts: 0,
      averageAttempts: 1,
      retryRate: 0,
      firstPassRate: 100,
    });
    expect(report.regressionRisk).toMatchObject({
      risk: 'low',
      score: 2,
    });
    expect(report.riskHotspots).toEqual([
      expect.objectContaining({
        suite: 'utils/qa-reporter.spec.ts',
        score: 2,
        signals: expect.objectContaining({
          slow: 1,
        }),
      }),
    ]);
    expect(report.tagCoverage).toEqual([
      expect.objectContaining({
        tag: 'api',
        total: 1,
        passRate: 100,
      }),
      expect.objectContaining({
        tag: 'contract',
        total: 1,
        passRate: 100,
      }),
      expect.objectContaining({
        tag: 'smoke',
        total: 1,
        passRate: 100,
      }),
      expect.objectContaining({
        tag: 'ui',
        total: 1,
        passRate: 100,
      }),
    ]);
    expect(report.slowTests).toHaveLength(1);
    expect(report.slowTestSummary).toEqual({
      total: 1,
      thresholdMs: 1000,
      minimumDurationMs: 1800,
      averageDurationMs: 1800,
      maximumDurationMs: 1800,
      totalDurationMs: 1800,
    });
    expect(report.classification).toEqual({
      total: 2,
      tagged: 2,
      untagged: 0,
      skipped: 0,
      liveTagged: 0,
      classificationRate: 100,
      untaggedRate: 0,
    });
    expect(report.testAreas).toEqual([
      {
        area: 'utils',
        status: 'healthy',
        total: 2,
        executed: 2,
        passed: 2,
        failures: 0,
        flaky: 0,
        skipped: 0,
        passRate: 100,
        durationMs: 1920,
      },
    ]);
    expect(report.testAreaStatusSummary).toEqual({
      total: 1,
      healthy: 1,
      attention: 0,
      attentionRate: 0,
    });
    expect(report.suiteHealth).toEqual([
      {
        suite: 'utils/qa-reporter.spec.ts',
        status: 'healthy',
        total: 2,
        executed: 2,
        passed: 2,
        failures: 0,
        flaky: 0,
        skipped: 0,
        passRate: 100,
      },
    ]);
    expect(report.suiteHealthSummary).toEqual({
      total: 1,
      healthy: 1,
      attention: 0,
      attentionRate: 0,
    });
    expect(report.suitePerformance).toEqual([
      {
        suite: 'utils/qa-reporter.spec.ts',
        total: 2,
        executed: 2,
        slowTests: 1,
        totalDurationMs: 1920,
        averageDurationMs: 960,
        maximumDurationMs: 1800,
      },
    ]);
    expect(report.suitePerformanceSummary).toEqual({
      total: 1,
      slowSuites: 1,
      totalDurationMs: 1920,
      maximumDurationMs: 1800,
    });
    expect(serialized.tests[0].tags).toContain('api');
    expect(markdown).toContain('# QA Run Summary');
    expect(markdown).toContain('| 2 | 2 | 2 | 0 | 0 | 0 | 100% | 0% | 100% | 0% | 0% | 1.92s |');
    expect(markdown).toContain('## Duration Health Summary');
    expect(markdown).toContain('| 2 | 1.00s | 1 | 1 | 0 |');
    expect(markdown).toContain('## Quality Gate Policy Summary');
    expect(markdown).toContain('| 5 | 2 | 1 | 0 | 2 |');
    expect(markdown).toContain('## Quality Gate Policy');
    expect(markdown).toContain('| Maximum p95 duration | <= 2000ms |');
    expect(markdown).toContain('| Maximum test duration | <= 2000ms |');
    expect(markdown).toContain('| Minimum pass rate | >= 100% |');
    expect(markdown).toContain('| Maximum skipped tests | <= 0 |');
    expect(markdown).toContain('| Minimum classification rate | >= 100% |');
    expect(markdown).toContain('| Required tags | smoke, contract |');
    expect(markdown).toContain('## Quality Gate Summary');
    expect(markdown).toContain('| Total checks | Passed | Failed | Pass rate | Failure rate |');
    expect(markdown).toContain('| 8 | 8 | 0 | 100% | 0% |');
    expect(markdown).toContain('## Release Decision');
    expect(markdown).toContain('Status: **ready**');
    expect(markdown).toContain('### Release Readiness Summary');
    expect(markdown).toContain('| Status | Quality gate checks | Quality gate passes | Quality gate failures | Quality gate pass rate | Quality gate failure rate | Executed tests | Flaky tests | Skipped tests | Release blockers | Non-passing executed | Risk score |');
    expect(markdown).toContain('| ready | 8 | 8 | 0 | 100% | 0% | 2 | 0 | 0 | 0 | 0 | 2 |');
    expect(markdown).toContain('### Release Decision Action Summary');
    expect(markdown).toContain('| 1 | 1 | 0 |');
    expect(markdown).toContain('slow UI smoke');
    expect(markdown).toContain('## Regression Risk');
    expect(markdown).toContain('## Execution Stability');
    expect(markdown).toContain('| 2 | 2 | 0 | 0 | 1 | 0% | 100% |');
    expect(markdown).toContain('| utils/qa-reporter.spec.ts | low | 2 | 0 | 0 | 1 | 0 |');
    expect(report.tagCoverageStatusSummary).toEqual({
      total: 4,
      attention: 0,
      attentionRate: 0,
      failing: 0,
      flaky: 0,
      skipped: 0,
    });
    expect(markdown).toContain('## Tag Coverage Status Summary');
    expect(markdown).toContain('| Tag rows | Attention tags | Attention rate | Failing tags | Flaky tags | Skipped tags |');
    expect(markdown).toContain('| 4 | 0 | 0% | 0 | 0 | 0 |');
    expect(markdown).toContain('## Tag Coverage');
    expect(markdown).toContain('| smoke | 1 | 1 | 1 | 0 | 0 | 0 | 100% | 1.80s |');
    expect(markdown).toContain('## Test Classification');
    expect(markdown).toContain('| Total | Tagged | Untagged | Skipped | Live-tagged | Classification rate | Untagged rate |');
    expect(markdown).toContain('| 2 | 2 | 0 | 0 | 0 | 100% | 0% |');
    expect(markdown).toContain('## Test Area Summary');
    expect(markdown).toContain('## Test Area Status Summary');
    expect(markdown).toContain('| Total areas | Healthy | Attention | Attention rate |');
    expect(markdown).toContain('| 1 | 1 | 0 | 0% |');
    expect(markdown).toContain('| utils | healthy | 2 | 2 | 2 | 0 | 0 | 0 | 100% | 1.92s |');
    expect(markdown).toContain('## Suite Health');
    expect(markdown).toContain('## Suite Health Summary');
    expect(markdown).toContain('| Total suites | Healthy | Attention | Attention rate |');
    expect(markdown).toContain('| 1 | 1 | 0 | 0% |');
    expect(markdown).toContain('| utils/qa-reporter.spec.ts | healthy | 2 | 2 | 2 | 0 | 0 | 0 | 100% |');
    expect(markdown).toContain('## Suite Performance');
    expect(markdown).toContain('## Suite Performance Summary');
    expect(markdown).toContain('| 1 | 1 | 1.92s | 1.80s |');
    expect(markdown).toContain('| utils/qa-reporter.spec.ts | 2 | 2 | 1 | 1.92s | 960ms | 1.80s |');
    expect(markdown).toContain('## Slow Test Summary');
    expect(markdown).toContain('| Slow tests | Threshold | Minimum duration | Average duration | Maximum duration | Total duration |');
    expect(markdown).toContain('| 1 | 1.00s | 1.80s | 1.80s | 1.80s | 1.80s |');
  });

  test('slow test summary should expose the duration range', () => {
    expect(summarizeSlowTests([
      {
        id: 'slow-login',
        suite: 'playwright/login.spec.ts',
        title: 'slow login',
        status: STATUS.PASSED,
        durationMs: 1200,
      },
      {
        id: 'slow-checkout',
        suite: 'playwright/checkout.spec.ts',
        title: 'slow checkout',
        status: STATUS.PASSED,
        durationMs: 1800,
      },
    ], 1000)).toEqual({
      total: 2,
      thresholdMs: 1000,
      minimumDurationMs: 1200,
      averageDurationMs: 1500,
      maximumDurationMs: 1800,
      totalDurationMs: 3000,
    });
  });

  test('report should rank the suites with the strongest regression signals first', () => {
    const report = buildQaRunReport([
      {
        ...createResult('failed checkout', STATUS.FAILED, 1500, ['ui']),
        suite: 'playwright/checkout.spec.ts',
      },
      {
        ...createResult('flaky login', STATUS.FLAKY, 400, ['ui']),
        suite: 'playwright/login.spec.ts',
      },
      {
        ...createResult('skipped live API', STATUS.SKIPPED, 0, ['live']),
        suite: 'api/live/public-apis.live.spec.ts',
      },
    ], {
      generatedAt: '2026-06-10T12:00:00.000Z',
      runStatus: 'failed',
      durationMs: 1900,
    });
    const markdown = renderQaReportMarkdown(report);

    expect(report.regressionRisk).toMatchObject({
      risk: 'medium',
      score: 11,
      signals: {
        failed: 1,
        flaky: 1,
        slow: 1,
        skipped: 1,
      },
    });
    expect(report.riskHotspots.map(({ suite, score }) => ({ suite, score }))).toEqual([
      { suite: 'playwright/checkout.spec.ts', score: 7 },
      { suite: 'playwright/login.spec.ts', score: 3 },
      { suite: 'api/live/public-apis.live.spec.ts', score: 1 },
    ]);
    expect(summarizeRiskHotspots(report.riskHotspots)).toEqual({
      total: 3,
      low: 2,
      medium: 1,
      high: 0,
    });
    expect(report.riskHotspotSummary).toEqual({
      total: 3,
      low: 2,
      medium: 1,
      high: 0,
    });
    expect(markdown).toContain('### Risk Hotspot Summary');
    expect(markdown).toContain('| 3 | 2 | 1 | 0 |');
    expect(report.releaseBlockers).toEqual([
      expect.objectContaining({
        title: 'failed checkout',
        status: STATUS.FAILED,
        tags: ['ui'],
      }),
      expect.objectContaining({
        title: 'flaky login',
        status: STATUS.FLAKY,
        tags: ['ui'],
      }),
    ]);
    expect(report.releaseBlockerSummary).toEqual({
      total: 2,
      failed: 1,
      timedOut: 0,
      interrupted: 0,
      flaky: 1,
      blockerRate: 100,
      minimumDurationMs: 400,
      averageDurationMs: 950,
      maximumDurationMs: 1500,
      totalDurationMs: 1900,
    });
    expect(markdown).toContain('## Release Blockers');
    expect(markdown).toContain('## Release Blocker Summary');
    expect(markdown).toContain('| Total | Failed | Timed out | Interrupted | Flaky | Blocker rate | Minimum duration | Average duration | Maximum duration | Total duration |');
    expect(markdown).toContain('| 2 | 1 | 0 | 0 | 1 | 100% | 400ms | 950ms | 1.50s | 1.90s |');
    expect(markdown).toContain('| failed checkout | playwright/checkout.spec.ts | failed | 1 | ui |');
    expect(markdown).toContain('| flaky login | playwright/login.spec.ts | flaky | 2 | ui |');
    expect(markdown).not.toContain('| skipped live API | api/live/public-apis.live.spec.ts | skipped |');
  });

  test('release blocker summary should split blocker statuses', () => {
    const results = [
      createResult('failed payment', STATUS.FAILED),
      createResult('timed out checkout', STATUS.TIMED_OUT),
      createResult('interrupted setup', STATUS.INTERRUPTED),
      createResult('flaky login', STATUS.FLAKY),
      createResult('stable smoke', STATUS.PASSED),
      createResult('disabled live check', STATUS.SKIPPED),
    ];

    expect(summarizeReleaseBlockers(results)).toEqual({
      total: 4,
      failed: 1,
      timedOut: 1,
      interrupted: 1,
      flaky: 1,
      blockerRate: 80,
      minimumDurationMs: 100,
      averageDurationMs: 100,
      maximumDurationMs: 100,
      totalDurationMs: 400,
    });
  });

  test('non-passing executed inventory should exclude passed and skipped tests', () => {
    const results = [
      createResult('stable smoke', STATUS.PASSED, 100, ['smoke']),
      createResult('failed payment', STATUS.FAILED, 700, ['payment']),
      createResult('timed out checkout', STATUS.TIMED_OUT, 900, ['ui']),
      createResult('interrupted setup', STATUS.INTERRUPTED, 300, ['setup']),
      createResult('flaky login', STATUS.FLAKY, 400, ['ui']),
      createResult('disabled live check', STATUS.SKIPPED, 0, ['live']),
    ];
    const nonPassingExecutedTests = findNonPassingExecutedTests(results);
    const report = buildQaRunReport(results, {
      generatedAt: '2026-07-13T12:00:00.000Z',
      runStatus: 'failed',
      durationMs: 2400,
    });
    const markdown = renderQaReportMarkdown(report);

    expect(nonPassingExecutedTests.map(({ title }) => title)).toEqual([
      'failed payment',
      'timed out checkout',
      'interrupted setup',
      'flaky login',
    ]);
    expect(summarizeNonPassingExecutedTests(nonPassingExecutedTests, 5)).toEqual({
      total: 4,
      failed: 1,
      timedOut: 1,
      interrupted: 1,
      flaky: 1,
      nonPassingRate: 80,
      minimumDurationMs: 300,
      averageDurationMs: 575,
      maximumDurationMs: 900,
      totalDurationMs: 2300,
    });
    expect(report.nonPassingExecutedSummary).toEqual({
      total: 4,
      failed: 1,
      timedOut: 1,
      interrupted: 1,
      flaky: 1,
      nonPassingRate: 80,
      minimumDurationMs: 300,
      averageDurationMs: 575,
      maximumDurationMs: 900,
      totalDurationMs: 2300,
    });
    expect(report.nonPassingExecutedTests).toEqual(nonPassingExecutedTests);
    expect(markdown).toContain('## Non-Passing Executed Summary');
    expect(markdown).toContain('| Total | Failed | Timed out | Interrupted | Flaky | Non-passing rate | Minimum duration | Average duration | Maximum duration | Total duration |');
    expect(markdown).toContain('| 4 | 1 | 1 | 1 | 1 | 80% | 300ms | 575ms | 900ms | 2.30s |');
    expect(markdown).toContain('## Non-Passing Executed Tests');
    expect(markdown).toContain('| failed payment | utils/qa-reporter.spec.ts | failed | 1 | 700ms | payment |');
    expect(markdown).toContain('| timed out checkout | utils/qa-reporter.spec.ts | timedOut | 1 | 900ms | ui |');
    expect(markdown).toContain('| interrupted setup | utils/qa-reporter.spec.ts | interrupted | 1 | 300ms | setup |');
    expect(markdown).toContain('| flaky login | utils/qa-reporter.spec.ts | flaky | 2 | 400ms | ui |');
    expect(markdown).not.toContain('| stable smoke | utils/qa-reporter.spec.ts | passed |');
    expect(markdown).not.toContain('| disabled live check | utils/qa-reporter.spec.ts | skipped |');
  });

  test('tag coverage should aggregate overlapping tags and expose untagged tests', () => {
    const coverage = summarizeTagCoverage([
      createResult('API smoke', STATUS.PASSED, 100, ['api', 'smoke']),
      createResult('API regression', STATUS.FAILED, 200, ['api', 'regression']),
      createResult('draft scenario', STATUS.SKIPPED, 0),
    ]);

    expect(coverage).toEqual([
      {
        tag: 'api',
        total: 2,
        executed: 2,
        passed: 1,
        failures: 1,
        flaky: 0,
        skipped: 0,
        passRate: 50,
        durationMs: 300,
      },
      expect.objectContaining({
        tag: 'regression',
        total: 1,
        failures: 1,
        passRate: 0,
      }),
      expect.objectContaining({
        tag: 'smoke',
        total: 1,
        passed: 1,
        passRate: 100,
      }),
      {
        tag: 'untagged',
        total: 1,
        executed: 0,
        passed: 0,
        failures: 0,
        flaky: 0,
        skipped: 1,
        passRate: 100,
        durationMs: 0,
      },
    ]);
    expect(summarizeTagCoverageStatus(coverage)).toEqual({
      total: 4,
      attention: 3,
      attentionRate: 75,
      failing: 2,
      flaky: 0,
      skipped: 1,
    });
  });

  test('skipped test inventory should retain suites, tags and deterministic ordering', () => {
    const tests = [
      {
        ...createResult('disabled checkout scenario', STATUS.SKIPPED, 0),
        suite: 'playwright/checkout.spec.ts',
      },
      {
        ...createResult('optional live lookup', STATUS.SKIPPED, 0, ['api', 'live']),
        suite: 'api/live/public-apis.live.spec.ts',
      },
      createResult('passing contract', STATUS.PASSED, 100, ['contract']),
    ];
    const skippedTests = findSkippedTests(tests);
    const report = buildQaRunReport(tests, {
      generatedAt: '2026-06-28T12:00:00.000Z',
      runStatus: 'passed',
      durationMs: 100,
    });
    const markdown = renderQaReportMarkdown(report);

    expect(skippedTests).toEqual([
      {
        id: 'optional-live-lookup',
        suite: 'api/live/public-apis.live.spec.ts',
        title: 'optional live lookup',
        tags: ['api', 'live'],
      },
      {
        id: 'disabled-checkout-scenario',
        suite: 'playwright/checkout.spec.ts',
        title: 'disabled checkout scenario',
        tags: [],
      },
    ]);
    expect(summarizeSkippedTests(skippedTests)).toEqual({
      total: 2,
      tagged: 1,
      untagged: 1,
      liveTagged: 1,
      liveTaggedRate: 50,
    });
    expect(report.skippedTestSummary).toEqual({
      total: 2,
      tagged: 1,
      untagged: 1,
      liveTagged: 1,
      liveTaggedRate: 50,
    });
    expect(report.skippedTests).toEqual(skippedTests);
    expect(markdown).toContain('## Skipped Test Summary');
    expect(markdown).toContain('| Total | Tagged | Untagged | Live-tagged | Live-tagged rate |');
    expect(markdown).toContain('| 2 | 1 | 1 | 1 | 50% |');
    expect(markdown).toContain('## Skipped Tests');
    expect(markdown).toContain('| optional live lookup | api/live/public-apis.live.spec.ts | api, live |');
    expect(markdown).toContain('| disabled checkout scenario | playwright/checkout.spec.ts | untagged |');
  });

  test('suite performance should rank the most expensive suites first', () => {
    const performance = summarizeSuitePerformance([
      {
        ...createResult('checkout smoke', STATUS.PASSED, 900),
        suite: 'playwright/checkout.spec.ts',
      },
      {
        ...createResult('checkout regression', STATUS.PASSED, 700),
        suite: 'playwright/checkout.spec.ts',
      },
      {
        ...createResult('API contract', STATUS.PASSED, 1200),
        suite: 'api/users.contract.spec.ts',
      },
      {
        ...createResult('disabled live check', STATUS.SKIPPED, 0),
        suite: 'api/live/public-apis.live.spec.ts',
      },
    ], 1000);

    expect(performance).toEqual([
      {
        suite: 'playwright/checkout.spec.ts',
        total: 2,
        executed: 2,
        slowTests: 0,
        totalDurationMs: 1600,
        averageDurationMs: 800,
        maximumDurationMs: 900,
      },
      {
        suite: 'api/users.contract.spec.ts',
        total: 1,
        executed: 1,
        slowTests: 1,
        totalDurationMs: 1200,
        averageDurationMs: 1200,
        maximumDurationMs: 1200,
      },
      {
        suite: 'api/live/public-apis.live.spec.ts',
        total: 1,
        executed: 0,
        slowTests: 0,
        totalDurationMs: 0,
        averageDurationMs: 0,
        maximumDurationMs: 0,
      },
    ]);
    expect(summarizeSuitePerformanceProfile(performance)).toEqual({
      total: 3,
      slowSuites: 1,
      totalDurationMs: 2800,
      maximumDurationMs: 1200,
    });
  });

  test('test area summary should group suites by top-level project area', () => {
    const areas = summarizeTestAreas([
      {
        ...createResult('API smoke', STATUS.PASSED, 100),
        suite: 'api/users.api.spec.ts',
      },
      {
        ...createResult('API regression', STATUS.FAILED, 300),
        suite: 'api/users.contract.spec.ts',
      },
      {
        ...createResult('UI retry', STATUS.FLAKY, 400),
        suite: 'playwright/login.spec.ts',
      },
      {
        ...createResult('utility contract', STATUS.PASSED, 200),
        suite: 'utils/qa-reporter.spec.ts',
      },
    ]);

    expect(areas).toEqual([
      {
        area: 'api',
        status: 'attention',
        total: 2,
        executed: 2,
        passed: 1,
        failures: 1,
        flaky: 0,
        skipped: 0,
        passRate: 50,
        durationMs: 400,
      },
      {
        area: 'playwright',
        status: 'attention',
        total: 1,
        executed: 1,
        passed: 0,
        failures: 0,
        flaky: 1,
        skipped: 0,
        passRate: 0,
        durationMs: 400,
      },
      {
        area: 'utils',
        status: 'healthy',
        total: 1,
        executed: 1,
        passed: 1,
        failures: 0,
        flaky: 0,
        skipped: 0,
        passRate: 100,
        durationMs: 200,
      },
    ]);
    expect(summarizeTestAreaStatus(areas)).toEqual({
      total: 3,
      healthy: 1,
      attention: 2,
      attentionRate: 66.67,
    });
  });

  test('classification summary should expose tagged, untagged, skipped and live coverage', () => {
    const classification = summarizeClassification([
      createResult('API smoke', STATUS.PASSED, 100, ['api', 'smoke']),
      createResult('draft scenario', STATUS.SKIPPED, 0),
      createResult('live diagnostic', STATUS.SKIPPED, 0, ['live', 'api']),
      createResult('UI smoke', STATUS.PASSED, 100, ['ui']),
    ]);

    expect(classification).toEqual({
      total: 4,
      tagged: 3,
      untagged: 1,
      skipped: 2,
      liveTagged: 1,
      classificationRate: 75,
      untaggedRate: 25,
    });
  });

  test('untagged test inventory should identify classification gaps in stable order', () => {
    const results = [
      {
        ...createResult('checkout draft', STATUS.SKIPPED, 0),
        suite: 'playwright/checkout.spec.ts',
      },
      {
        ...createResult('API draft', STATUS.PASSED),
        suite: 'api/users.api.spec.ts',
      },
      {
        ...createResult('billing draft', STATUS.FAILED),
        suite: 'api/billing.api.spec.ts',
      },
      createResult('classified contract', STATUS.PASSED, 100, ['contract']),
    ];
    const untaggedTests = findUntaggedTests(results);
    const report = buildQaRunReport(results, {
      generatedAt: '2026-07-04T12:00:00.000Z',
      runStatus: 'passed',
      durationMs: 200,
    });
    const markdown = renderQaReportMarkdown(report);

    expect(untaggedTests).toEqual([
      {
        id: 'billing-draft',
        suite: 'api/billing.api.spec.ts',
        title: 'billing draft',
        status: STATUS.FAILED,
      },
      {
        id: 'api-draft',
        suite: 'api/users.api.spec.ts',
        title: 'API draft',
        status: STATUS.PASSED,
      },
      {
        id: 'checkout-draft',
        suite: 'playwright/checkout.spec.ts',
        title: 'checkout draft',
        status: STATUS.SKIPPED,
      },
    ]);
    expect(summarizeUntaggedTests(untaggedTests)).toEqual({
      total: 3,
      executed: 2,
      skipped: 1,
      nonPassing: 1,
      nonPassingRate: 33.33,
    });
    expect(report.untaggedTestSummary).toEqual({
      total: 3,
      executed: 2,
      skipped: 1,
      nonPassing: 1,
      nonPassingRate: 33.33,
    });
    expect(report.untaggedTests).toEqual(untaggedTests);
    expect(markdown).toContain('## Untagged Test Summary');
    expect(markdown).toContain('| Total | Executed | Skipped | Non-passing | Non-passing rate |');
    expect(markdown).toContain('| 3 | 2 | 1 | 1 | 33.33% |');
    expect(markdown).toContain('## Untagged Tests');
    expect(markdown).toContain('| billing draft | api/billing.api.spec.ts | failed |');
    expect(markdown).toContain('| API draft | api/users.api.spec.ts | passed |');
    expect(markdown).toContain('| checkout draft | playwright/checkout.spec.ts | skipped |');
  });

  test('suite health should rank suites needing attention before healthy suites', () => {
    const health = summarizeSuiteHealth([
      {
        ...createResult('checkout smoke', STATUS.PASSED, 900),
        suite: 'playwright/checkout.spec.ts',
      },
      {
        ...createResult('payment regression', STATUS.FAILED, 700),
        suite: 'playwright/payment.spec.ts',
      },
      {
        ...createResult('login retry', STATUS.FLAKY, 300),
        suite: 'playwright/login.spec.ts',
      },
      {
        ...createResult('disabled live check', STATUS.SKIPPED, 0),
        suite: 'api/live/public-apis.live.spec.ts',
      },
    ]);

    expect(health).toEqual([
      {
        suite: 'playwright/payment.spec.ts',
        status: 'attention',
        total: 1,
        executed: 1,
        passed: 0,
        failures: 1,
        flaky: 0,
        skipped: 0,
        passRate: 0,
      },
      {
        suite: 'playwright/login.spec.ts',
        status: 'attention',
        total: 1,
        executed: 1,
        passed: 0,
        failures: 0,
        flaky: 1,
        skipped: 0,
        passRate: 0,
      },
      {
        suite: 'api/live/public-apis.live.spec.ts',
        status: 'healthy',
        total: 1,
        executed: 0,
        passed: 0,
        failures: 0,
        flaky: 0,
        skipped: 1,
        passRate: 100,
      },
      {
        suite: 'playwright/checkout.spec.ts',
        status: 'healthy',
        total: 1,
        executed: 1,
        passed: 1,
        failures: 0,
        flaky: 0,
        skipped: 0,
        passRate: 100,
      },
    ]);
    expect(summarizeSuiteHealthStatus(health)).toEqual({
      total: 4,
      healthy: 2,
      attention: 2,
      attentionRate: 50,
    });
  });

  test('execution stability should expose retries and support a first-pass quality gate', () => {
    const results = [
      createResult('stable smoke', STATUS.PASSED),
      {
        ...createResult('flaky checkout', STATUS.FLAKY),
        attempts: 2,
      },
      {
        ...createResult('failed payment', STATUS.FAILED),
        attempts: 3,
      },
      {
        ...createResult('disabled live check', STATUS.SKIPPED),
        attempts: 0,
      },
    ];
    const stability = summarizeExecutionStability(results);
    const retriedTests = findRetriedTests(results);
    const qualityGate = evaluateQualityGate(results, {
      minimumPassRate: 0,
      maximumFailures: 1,
      maximumFlakyTests: 1,
      minimumFirstPassRate: 80,
    });
    const report = buildQaRunReport(results, {
      generatedAt: '2026-07-02T12:00:00.000Z',
      runStatus: 'failed',
      durationMs: 400,
    });
    const markdown = renderQaReportMarkdown(report);

    expect(stability).toEqual({
      executed: 3,
      firstPassPassed: 1,
      retriedTests: 2,
      retryAttempts: 3,
      averageAttempts: 2,
      retryRate: 66.67,
      firstPassRate: 33.33,
    });
    expect(retriedTests).toEqual([
      {
        id: 'failed-payment',
        suite: 'utils/qa-reporter.spec.ts',
        title: 'failed payment',
        status: STATUS.FAILED,
        durationMs: 100,
        attempts: 3,
      },
      {
        id: 'flaky-checkout',
        suite: 'utils/qa-reporter.spec.ts',
        title: 'flaky checkout',
        status: STATUS.FLAKY,
        durationMs: 100,
        attempts: 2,
      },
    ]);
    expect(summarizeRetriedTests(retriedTests)).toEqual({
      total: 2,
      maximumAttempts: 3,
      retryAttempts: 3,
      minimumDurationMs: 100,
      averageDurationMs: 100,
      maximumDurationMs: 100,
      totalDurationMs: 200,
    });
    expect(report.retriedTestSummary).toEqual({
      total: 2,
      maximumAttempts: 3,
      retryAttempts: 3,
      minimumDurationMs: 100,
      averageDurationMs: 100,
      maximumDurationMs: 100,
      totalDurationMs: 200,
    });
    expect(report.retriedTests).toEqual(retriedTests);
    expect(markdown).toContain('## Retried Test Summary');
    expect(markdown).toContain('| 2 | 3 | 3 | 100ms | 100ms | 100ms | 200ms |');
    expect(markdown).toContain('## Retried Tests');
    expect(markdown).toContain('| failed payment | utils/qa-reporter.spec.ts | 3 | failed | 100ms |');
    expect(markdown).toContain('| flaky checkout | utils/qa-reporter.spec.ts | 2 | flaky | 100ms |');
    expect(qualityGate.status).toBe('blocked');
    expect(qualityGate.policy).toMatchObject({
      minimumFirstPassRate: 80,
    });
    expect(qualityGate.failedChecks).toEqual([
      {
        name: 'first-pass rate',
        expected: '>= 80%',
        actual: '33.33%',
        passed: false,
      },
    ]);
    expect(qualityGate.checks).toContainEqual({
      name: 'first-pass rate',
      expected: '>= 80%',
      actual: '33.33%',
      passed: false,
    });
  });

  test('flaky test inventory should expose unstable tests with tags', () => {
    const results = [
      {
        ...createResult('flaky checkout', STATUS.FLAKY, 400, ['ui']),
        attempts: 2,
      },
      {
        ...createResult('flaky payment', STATUS.FLAKY, 900, ['payment', 'regression']),
        attempts: 3,
      },
      createResult('stable smoke', STATUS.PASSED, 100, ['smoke']),
    ];
    const flakyTests = findFlakyTests(results);
    const report = buildQaRunReport(results, {
      generatedAt: '2026-07-12T14:00:00.000Z',
      runStatus: 'failed',
      durationMs: 1400,
    });
    const markdown = renderQaReportMarkdown(report);

    expect(flakyTests).toEqual([
      {
        id: 'flaky-payment',
        suite: 'utils/qa-reporter.spec.ts',
        title: 'flaky payment',
        durationMs: 900,
        attempts: 3,
        tags: ['payment', 'regression'],
      },
      {
        id: 'flaky-checkout',
        suite: 'utils/qa-reporter.spec.ts',
        title: 'flaky checkout',
        durationMs: 400,
        attempts: 2,
        tags: ['ui'],
      },
    ]);
    expect(summarizeFlakyTests(flakyTests)).toEqual({
      total: 2,
      maximumAttempts: 3,
      retryAttempts: 3,
      minimumDurationMs: 400,
      averageDurationMs: 650,
      maximumDurationMs: 900,
      totalDurationMs: 1300,
    });
    expect(report.flakyTestSummary).toEqual({
      total: 2,
      maximumAttempts: 3,
      retryAttempts: 3,
      minimumDurationMs: 400,
      averageDurationMs: 650,
      maximumDurationMs: 900,
      totalDurationMs: 1300,
    });
    expect(report.flakyTests).toEqual(flakyTests);
    expect(markdown).toContain('## Flaky Test Summary');
    expect(markdown).toContain('| Total | Maximum attempts | Retry attempts | Minimum duration | Average duration | Maximum duration | Total duration |');
    expect(markdown).toContain('| 2 | 3 | 3 | 400ms | 650ms | 900ms | 1.30s |');
    expect(markdown).toContain('## Flaky Tests');
    expect(markdown).toContain('| flaky payment | utils/qa-reporter.spec.ts | 3 | 900ms | payment, regression |');
    expect(markdown).toContain('| flaky checkout | utils/qa-reporter.spec.ts | 2 | 400ms | ui |');
  });

  test('duration profile should expose median and tail latency for executed tests', () => {
    const results = [
      createResult('fast check', STATUS.PASSED, 100),
      createResult('regular check', STATUS.PASSED, 200),
      createResult('slow check', STATUS.PASSED, 300),
      createResult('tail check', STATUS.PASSED, 400),
      createResult('disabled check', STATUS.SKIPPED, 0),
    ];
    const durationProfile = summarizeDurationProfile(results);
    const slowTests = [
      {
        id: 'tail-check',
        suite: 'utils/qa-reporter.spec.ts',
        title: 'tail check',
        status: STATUS.PASSED,
        durationMs: 400,
      },
    ];
    const report = buildQaRunReport(results, {
      generatedAt: '2026-07-06T12:00:00.000Z',
      runStatus: 'passed',
      durationMs: 1000,
    }, {
      slowTestThresholdMs: 350,
    });
    const markdown = renderQaReportMarkdown(report);

    expect(durationProfile).toEqual({
      executed: 4,
      totalDurationMs: 1000,
      minimumDurationMs: 100,
      averageDurationMs: 250,
      medianDurationMs: 250,
      p95DurationMs: 400,
      maximumDurationMs: 400,
    });
    expect(summarizeDurationHealth(results, slowTests, [], 350)).toEqual({
      executed: 4,
      slowTestThresholdMs: 350,
      withinSlowThreshold: 3,
      slowTests: 1,
      durationBudgetBreaches: 0,
    });
    expect(report.durationHealthSummary).toEqual({
      executed: 4,
      slowTestThresholdMs: 350,
      withinSlowThreshold: 3,
      slowTests: 1,
      durationBudgetBreaches: 0,
    });
    expect(report.durationProfile).toEqual(durationProfile);
    expect(markdown).toContain('## Execution Duration Profile');
    expect(markdown).toContain('| 4 | 1.00s | 100ms | 250ms | 250ms | 400ms | 400ms |');
    expect(markdown).toContain('## Duration Health Summary');
    expect(markdown).toContain('| 4 | 350ms | 3 | 1 | 0 |');
  });

  test('release decision should turn failed quality checks into action items', () => {
    const qualityGate = evaluateQualityGate([
      createResult('stable smoke', STATUS.PASSED),
      createResult('failed payment', STATUS.FAILED),
    ], {
      minimumPassRate: 100,
      maximumFailures: 0,
      maximumFlakyTests: 0,
    });
    const releaseDecision = buildReleaseDecision(qualityGate);
    const releaseBlockerSummary = summarizeReleaseBlockers(qualityGate.summary.total ? [
      createResult('stable smoke', STATUS.PASSED),
      createResult('failed payment', STATUS.FAILED),
    ] : []);
    const nonPassingExecutedSummary = summarizeNonPassingExecutedTests([
      {
        id: 'failed-payment',
        suite: 'utils/qa-reporter.spec.ts',
        title: 'failed payment',
        status: STATUS.FAILED,
        durationMs: 100,
        attempts: 1,
        tags: [],
      },
    ]);

    expect(qualityGate.failedChecks.map((check) => check.name)).toEqual([
      'pass rate',
      'failures',
    ]);
    expect(releaseDecision).toEqual({
      status: 'blocked',
      summary: 'Blocked by the configured quality gate.',
      actionItems: [
        'Fix pass rate: expected >= 100%, actual 50%.',
        'Fix failures: expected <= 0, actual 1.',
      ],
    });
    expect(summarizeReleaseDecisionActions(releaseDecision)).toEqual({
      total: 2,
      review: 0,
      fix: 2,
    });
    expect(summarizeReleaseReadiness(
      qualityGate,
      releaseBlockerSummary,
      nonPassingExecutedSummary,
      {
        risk: 'low',
        score: 5,
        recommendation: 'Review failures before release.',
        signals: {
          failed: 1,
          flaky: 0,
          slow: 0,
          skipped: 0,
        },
      },
    )).toEqual({
      status: 'blocked',
      qualityGateChecks: 3,
      qualityGatePasses: 1,
      qualityGateFailures: 2,
      qualityGatePassRate: 33.33,
      qualityGateFailureRate: 66.67,
      executedTests: 2,
      flakyTests: 0,
      skippedTests: 0,
      releaseBlockers: 1,
      nonPassingExecuted: 1,
      riskScore: 5,
    });
  });
});

function createResult(
  title: string,
  status: QaTestResult['status'],
  durationMs = 100,
  tags: string[] = [],
): QaTestResult {
  return {
    id: title.toLowerCase().replaceAll(' ', '-'),
    suite: 'utils/qa-reporter.spec.ts',
    title,
    status,
    durationMs,
    attempts: status === STATUS.FLAKY ? 2 : 1,
    tags,
  };
}
