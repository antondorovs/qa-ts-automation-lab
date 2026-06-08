import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import { STATUS, type QaReporterOptions, type QaTestResult, type QaTestStatus } from './qa-metrics';
import { buildQaRunReport, renderQaReportMarkdown } from './qa-report';

export type PlaywrightResultInput = {
  id: string;
  suite: string;
  title: string;
  tags: string[];
  outcome: ReturnType<TestCase['outcome']>;
  attempts: Array<Pick<TestResult, 'duration' | 'error' | 'status'>>;
};

export function mapPlaywrightResult(input: PlaywrightResultInput): QaTestResult {
  const finalAttempt = input.attempts.at(-1);

  return {
    id: input.id,
    suite: input.suite,
    title: input.title,
    status: mapPlaywrightStatus(input.outcome, finalAttempt?.status),
    durationMs: input.attempts.reduce((sum, attempt) => sum + attempt.duration, 0),
    attempts: input.attempts.length,
    tags: input.tags.map(normalizeTag),
    error: finalAttempt?.error ? cleanError(finalAttempt.error.message || finalAttempt.error.stack) : undefined,
  };
}

export function mapPlaywrightStatus(
  outcome: PlaywrightResultInput['outcome'],
  finalStatus?: TestResult['status'],
): QaTestStatus {
  if (outcome === 'flaky') {
    return STATUS.FLAKY;
  }

  if (outcome === 'skipped' || finalStatus === 'skipped') {
    return STATUS.SKIPPED;
  }

  if (outcome === 'expected') {
    return STATUS.PASSED;
  }

  if (finalStatus === 'timedOut') {
    return STATUS.TIMED_OUT;
  }

  if (finalStatus === 'interrupted') {
    return STATUS.INTERRUPTED;
  }

  return STATUS.FAILED;
}

export default class QaReporter implements Reporter {
  private readonly options: QaReporterOptions;
  private rootDir = process.cwd();
  private tests: TestCase[] = [];

  constructor(options: QaReporterOptions = {}) {
    this.options = options;
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.rootDir = config.rootDir;
    this.tests = suite.allTests();
  }

  async onEnd(result: FullResult): Promise<{ status?: FullResult['status'] }> {
    try {
      const tests = this.tests.map((test) => mapPlaywrightResult({
        id: test.id,
        suite: normalizePath(path.relative(this.rootDir, test.location.file)),
        title: test.title,
        tags: test.tags,
        outcome: test.outcome(),
        attempts: test.results,
      }));
      const report = buildQaRunReport(tests, {
        runStatus: result.status,
        durationMs: result.duration,
      }, this.options);
      const markdown = renderQaReportMarkdown(report);
      const outputDir = path.resolve(this.rootDir, this.options.outputDir || 'qa-report');

      await mkdir(outputDir, { recursive: true });
      await Promise.all([
        writeFile(path.join(outputDir, 'qa-summary.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
        writeFile(path.join(outputDir, 'qa-summary.md'), markdown, 'utf8'),
      ]);

      if (process.env.GITHUB_STEP_SUMMARY) {
        await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown, 'utf8');
      }

      return report.qualityGate.status === 'blocked' ? { status: 'failed' } : {};
    } catch (error) {
      console.error('QA reporter failed:', error);
      return { status: 'failed' };
    }
  }

  printsToStdio(): boolean {
    return false;
  }
}

function normalizeTag(tag: string): string {
  return tag.replace(/^@/, '');
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function cleanError(value?: string): string | undefined {
  return value?.replace(/\u001B\[[0-9;]*m/g, '').trim();
}
