import { test, expect } from '@playwright/test';
import { STATUS, evaluateQualityGate, summarizeRun, type QaTestResult } from './qa-metrics';
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
    expect(report.slowTests).toHaveLength(1);
    expect(serialized.tests[0].tags).toContain('api');
    expect(markdown).toContain('# QA Run Summary');
    expect(markdown).toContain('| 2 | 2 | 2 | 0 | 0 | 0 | 100% | 1.92s |');
    expect(markdown).toContain('slow UI smoke');
    expect(markdown).toContain('## Regression Risk');
    expect(markdown).toContain('| utils/qa-reporter.spec.ts | low | 2 | 0 | 0 | 1 | 0 |');
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
