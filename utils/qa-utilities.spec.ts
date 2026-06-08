import { test, expect } from '@playwright/test';
import { assertEmailField, assertHeader, buildAssertionResult, normalizeHeaders } from '../api/utils/response-assertions';
import { isClientError, isServerError, isSuccessStatus } from '../api/utils/status-code-helper';
import { buildApiBugFromFailure, renderMarkdown } from './bug-report-builder';
import { STATUS, type QaTestResult } from './qa-metrics';
import { buildQaRunReport } from './qa-report';
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
    const results: QaTestResult[] = [
      createQaResult('login smoke', 'ui', STATUS.PASSED, 300),
      createQaResult('users contract', 'api', STATUS.FAILED, 900, 'schema mismatch'),
      createQaResult('checkout regression', 'ui', STATUS.FLAKY, 1300),
    ];
    const report = buildQaRunReport(results, {
      runStatus: 'failed',
      durationMs: 2500,
      generatedAt: '2026-06-08T00:00:00.000Z',
    });

    const riskSummary = buildRegressionRiskSummary({
      failed: report.summary.failed,
      flaky: report.summary.flaky,
      slow: report.slowTests.length,
      skipped: report.summary.skipped,
    });

    expect(report.summary.total).toBe(3);
    expect(report.failedTests).toHaveLength(1);
    expect(report.qualityGate.status).toBe('blocked');
    expect(riskSummary.risk).toBe('medium');
  });
});

function createQaResult(
  title: string,
  suite: string,
  status: QaTestResult['status'],
  durationMs: number,
  error?: string,
): QaTestResult {
  return {
    id: `${suite}:${title}`,
    suite,
    title,
    status,
    durationMs,
    attempts: 1,
    tags: [],
    error,
  };
}
