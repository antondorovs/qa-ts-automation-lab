export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BugPriority = 'low' | 'normal' | 'high' | 'urgent';

export type BugReportInput = {
  title: string;
  expectedResult: string;
  actualResult: string;
  severity?: BugSeverity;
  priority?: BugPriority;
  environment?: string;
  area?: string;
  preconditions?: string | string[];
  stepsToReproduce?: string | string[];
  evidence?: string | string[];
};

export type BugReport = {
  title: string;
  severity: BugSeverity;
  priority: BugPriority;
  environment: string;
  preconditions: string[];
  stepsToReproduce: string[];
  expectedResult: string;
  actualResult: string;
  evidence: string[];
  labels: string[];
};

export type ApiFailureInput = {
  endpoint: string;
  expected: string;
  actual: string;
  status: number;
  baseUrl: string;
  method?: string;
  environment?: string;
  role?: string;
  evidence?: string | string[];
};

export function buildBugReport(input: BugReportInput): BugReport {
  return {
    title: input.title,
    severity: input.severity || 'medium',
    priority: input.priority || 'normal',
    environment: input.environment || 'staging',
    preconditions: normalizeList(input.preconditions),
    stepsToReproduce: normalizeList(input.stepsToReproduce),
    expectedResult: input.expectedResult,
    actualResult: input.actualResult,
    evidence: normalizeList(input.evidence),
    labels: buildLabels(input),
  };
}

function buildLabels(input: BugReportInput): string[] {
  const labels = new Set(['bug']);

  if (input.area) {
    labels.add(`area:${input.area}`);
  }

  if (input.severity) {
    labels.add(`severity:${input.severity}`);
  }

  if (input.environment) {
    labels.add(`env:${input.environment}`);
  }

  return Array.from(labels);
}

function normalizeList(value?: string | string[]): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return [value];
}

export function renderMarkdown(report: BugReport): string {
  const sections = [
    `# ${report.title}`,
    `Severity: ${report.severity}`,
    `Priority: ${report.priority}`,
    `Environment: ${report.environment}`,
    renderList('Preconditions', report.preconditions),
    renderList('Steps to reproduce', report.stepsToReproduce, true),
    `## Expected result\n${report.expectedResult}`,
    `## Actual result\n${report.actualResult}`,
    renderList('Evidence', report.evidence),
    `## Labels\n${report.labels.map((label) => `\`${label}\``).join(' ')}`,
  ];

  return sections.filter(Boolean).join('\n\n');
}

function renderList(title: string, items: string[], ordered = false): string {
  if (!items.length) {
    return '';
  }

  const list = items.map((item, index) => (ordered ? `${index + 1}. ${item}` : `- ${item}`)).join('\n');

  return `## ${title}\n${list}`;
}

export function buildApiBugFromFailure(failure: ApiFailureInput): BugReport {
  return buildBugReport({
    title: `${failure.method || 'REQUEST'} ${failure.endpoint} returns unexpected response`,
    severity: failure.status >= 500 ? 'high' : 'medium',
    priority: failure.status >= 500 ? 'high' : 'normal',
    area: 'api',
    environment: failure.environment,
    preconditions: [
      `Base URL is ${failure.baseUrl}`,
      `Test user role is ${failure.role || 'not specified'}`,
    ],
    stepsToReproduce: [
      `Send ${failure.method || 'GET'} request to ${failure.endpoint}`,
      'Check response status code',
      'Validate response body contract',
    ],
    expectedResult: failure.expected,
    actualResult: failure.actual,
    evidence: failure.evidence,
  });
}
