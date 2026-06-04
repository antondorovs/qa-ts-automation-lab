import { test, expect } from '@playwright/test';
import { assertEmailField, assertHeader, buildAssertionResult, normalizeHeaders } from '../api/utils/response-assertions';
import { isClientError, isServerError, isSuccessStatus } from '../api/utils/status-code-helper';
import { buildApiBugFromFailure, renderMarkdown } from './bug-report-builder';
import { createDailyQaSnapshot, STATUS } from './qa-metrics';
import { buildRegressionRiskSummary } from './regression-risk-summary';
import { buildCommentPayload, buildPaginationParams, buildPostPayload, buildUserPayload } from './test-data-builder';

test.describe('@utils @contract TypeScript QA utilities', () => {
  test('payload builders should return reusable typed API data', () => {
    expect(buildUserPayload({ email: 'qa@example.com' })).toMatchObject({
      name: 'QA Learning User',
      email: 'qa@example.com',
    });
    expect(buildPostPayload({ userId: 42 })).toMatchObject({
      title: 'API automation practice',
      userId: 42,
    });
    expect(buildCommentPayload({ postId: 7 })).toMatchObject({
      postId: 7,
      email: 'qa.regression@example.com',
    });
    expect(buildPaginationParams(2, 25)).toEqual({
      _page: '2',
      _limit: '25',
    });
  });

  test('response assertions should normalize headers and report failures', () => {
    const headers = normalizeHeaders({
      'Content-Type': ['application/json', 'charset=utf-8'],
      TraceId: 'abc-123',
    });

    expect(headers['content-type']).toBe('application/json, charset=utf-8');
    expect(assertHeader({ status: 200, headers }, 'traceid')).toBe('abc-123');
    expect(() => assertEmailField({ email: 'qa@example.com' })).not.toThrow();

    const result = buildAssertionResult('email shape', () => assertEmailField({ email: 'invalid' }));

    expect(result).toMatchObject({
      name: 'email shape',
      status: 'failed',
    });
  });

  test('status helpers should classify HTTP status code ranges', () => {
    expect(isSuccessStatus(204)).toBe(true);
    expect(isClientError(404)).toBe(true);
    expect(isServerError(503)).toBe(true);
    expect(isSuccessStatus(500)).toBe(false);
  });

  test('bug report builder should render API failures as markdown', () => {
    const report = buildApiBugFromFailure({
      baseUrl: 'https://api.example.test',
      endpoint: '/users/1',
      expected: '200 OK with user contract',
      actual: '500 Internal Server Error',
      status: 500,
      evidence: 'Playwright trace attached',
    });

    expect(report.severity).toBe('high');
    expect(report.labels).toContain('area:api');
    expect(renderMarkdown(report)).toContain('## Steps to reproduce');
  });

  test('metrics and regression summaries should expose release risk signals', () => {
    const snapshot = createDailyQaSnapshot([
      { testName: 'login smoke', suite: 'ui', status: STATUS.PASSED, durationMs: 300 },
      { testName: 'users contract', suite: 'api', status: STATUS.FAILED, durationMs: 900, error: 'schema mismatch' },
      { testName: 'checkout regression', suite: 'ui', status: STATUS.FLAKY, durationMs: 1300 },
    ]);

    const riskSummary = buildRegressionRiskSummary({
      failed: snapshot.summary.failed,
      flaky: snapshot.summary.flaky,
      slow: snapshot.slowTests.length,
      skipped: snapshot.summary.skipped,
    });

    expect(snapshot.summary.total).toBe(3);
    expect(snapshot.failedTests).toHaveLength(1);
    expect(snapshot.releaseGate.status).toBe('blocked');
    expect(riskSummary.risk).toBe('medium');
  });
});
