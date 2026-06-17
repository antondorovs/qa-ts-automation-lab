import { test, expect } from '@playwright/test';
import {
  STATUS,
  buildReleaseDecision,
  evaluateQualityGate,
  summarizeExecutionStability,
  summarizeRun,
  summarizeSuiteHealth,
  summarizeSuitePerformance,
  summarizeTagCoverage,
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
      passRate: 100,
    });
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
        requiredTags: ['@smoke', 'contract'],
      },
    });
    const markdown = renderQaReportMarkdown(report);
    const serialized = JSON.parse(JSON.stringify(report)) as typeof report;

    expect(report.qualityGate.status).toBe('ready');
    expect(report.qualityGate.failedChecks).toEqual([]);
    expect(report.releaseDecision).toEqual({
      status: 'ready',
      summary: 'Ready for release based on the configured quality gate.',
      actionItems: ['Review the generated QA summary before deployment.'],
    });
    expect(report.stability).toEqual({
      executed: 2,
      firstPassPassed: 2,
      retriedTests: 0,
      retryAttempts: 0,
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
    expect(serialized.tests[0].tags).toContain('api');
    expect(markdown).toContain('# QA Run Summary');
    expect(markdown).toContain('| 2 | 2 | 2 | 0 | 0 | 0 | 100% | 1.92s |');
    expect(markdown).toContain('## Release Decision');
    expect(markdown).toContain('Status: **ready**');
    expect(markdown).toContain('slow UI smoke');
    expect(markdown).toContain('## Regression Risk');
    expect(markdown).toContain('## Execution Stability');
    expect(markdown).toContain('| 2 | 2 | 0 | 0 | 100% |');
    expect(markdown).toContain('| utils/qa-reporter.spec.ts | low | 2 | 0 | 0 | 1 | 0 |');
    expect(markdown).toContain('## Tag Coverage');
    expect(markdown).toContain('| smoke | 1 | 1 | 1 | 0 | 0 | 0 | 100% | 1.80s |');
    expect(markdown).toContain('## Suite Health');
    expect(markdown).toContain('| utils/qa-reporter.spec.ts | healthy | 2 | 2 | 2 | 0 | 0 | 0 | 100% |');
    expect(markdown).toContain('## Suite Performance');
    expect(markdown).toContain('| utils/qa-reporter.spec.ts | 2 | 2 | 1 | 1.92s | 960ms | 1.80s |');
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
    const qualityGate = evaluateQualityGate(results, {
      minimumPassRate: 0,
      maximumFailures: 1,
      maximumFlakyTests: 1,
      minimumFirstPassRate: 80,
    });

    expect(stability).toEqual({
      executed: 3,
      firstPassPassed: 1,
      retriedTests: 2,
      retryAttempts: 3,
      firstPassRate: 33.33,
    });
    expect(qualityGate.status).toBe('blocked');
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
