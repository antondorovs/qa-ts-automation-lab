export type HeaderValue = string | number | boolean | string[] | number[] | boolean[];

export type ApiLikeResponse = {
  status: number;
  headers?: Record<string, HeaderValue>;
};

export type JsonObject = Record<string, unknown>;

export type AssertionResult = {
  name: string;
  status: 'passed' | 'failed';
  message?: string;
};

export function assertStatus(response: ApiLikeResponse, expectedStatus: number): void {
  const actualStatus = response.status;

  if (actualStatus !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${actualStatus}`);
  }
}

export function assertHeader(response: ApiLikeResponse, headerName: string): string {
  const normalizedName = headerName.toLowerCase();
  const headers = normalizeHeaders(response.headers || {});

  if (!headers[normalizedName]) {
    throw new Error(`Expected response header "${headerName}" to be present`);
  }

  return headers[normalizedName];
}

export function assertJsonContentType(response: ApiLikeResponse): void {
  const contentType = assertHeader(response, 'content-type');

  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON response, got "${contentType}"`);
  }
}

export function assertBodyContainsFields(body: JsonObject, fields: string[]): void {
  const missingFields = fields.filter((field) => body[field] === undefined || body[field] === null);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

export function assertStringField(body: JsonObject, fieldName: string): void {
  assertBodyContainsFields(body, [fieldName]);

  if (typeof body[fieldName] !== 'string') {
    throw new Error(`Expected "${fieldName}" to be a string`);
  }

  if (String(body[fieldName]).trim().length === 0) {
    throw new Error(`Expected "${fieldName}" to be non-empty`);
  }
}

export function assertNumberField(body: JsonObject, fieldName: string): void {
  assertBodyContainsFields(body, [fieldName]);

  if (typeof body[fieldName] !== 'number') {
    throw new Error(`Expected "${fieldName}" to be a number`);
  }
}

export function assertEmailField(body: JsonObject, fieldName = 'email'): void {
  assertStringField(body, fieldName);

  if (!String(body[fieldName]).includes('@')) {
    throw new Error(`Expected "${fieldName}" to look like an email`);
  }
}

export function assertPaginationShape(body: JsonObject): void {
  assertNumberField(body, 'page');
  assertNumberField(body, 'limit');
  assertNumberField(body, 'total');

  if (!Array.isArray(body.items)) {
    throw new Error('Expected "items" to be an array');
  }
}

export function assertProblemDetails(body: JsonObject): void {
  assertStringField(body, 'title');
  assertNumberField(body, 'status');

  if (body.detail !== undefined && typeof body.detail !== 'string') {
    throw new Error('Expected optional "detail" to be a string');
  }
}

export function normalizeHeaders(headers: Record<string, HeaderValue>): Record<string, string> {
  return Object.entries(headers).reduce<Record<string, string>>((accumulator, [name, value]) => {
    accumulator[name.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value);
    return accumulator;
  }, {});
}

export function buildAssertionResult(name: string, callback: () => void): AssertionResult {
  try {
    callback();
    return { name, status: 'passed' };
  } catch (error) {
    return {
      name,
      status: 'failed',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
