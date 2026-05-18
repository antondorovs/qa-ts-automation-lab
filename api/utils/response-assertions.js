function assertStatus(response, expectedStatus) {
  const actualStatus = response.status;

  if (actualStatus !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${actualStatus}`);
  }
}

function assertHeader(response, headerName) {
  const normalizedName = headerName.toLowerCase();
  const headers = normalizeHeaders(response.headers || {});

  if (!headers[normalizedName]) {
    throw new Error(`Expected response header "${headerName}" to be present`);
  }

  return headers[normalizedName];
}

function assertJsonContentType(response) {
  const contentType = assertHeader(response, 'content-type');

  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON response, got "${contentType}"`);
  }
}

function assertBodyContainsFields(body, fields) {
  const missingFields = fields.filter((field) => body[field] === undefined || body[field] === null);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

function assertStringField(body, fieldName) {
  assertBodyContainsFields(body, [fieldName]);

  if (typeof body[fieldName] !== 'string') {
    throw new Error(`Expected "${fieldName}" to be a string`);
  }

  if (body[fieldName].trim().length === 0) {
    throw new Error(`Expected "${fieldName}" to be non-empty`);
  }
}

function assertNumberField(body, fieldName) {
  assertBodyContainsFields(body, [fieldName]);

  if (typeof body[fieldName] !== 'number') {
    throw new Error(`Expected "${fieldName}" to be a number`);
  }
}

function assertEmailField(body, fieldName = 'email') {
  assertStringField(body, fieldName);

  if (!body[fieldName].includes('@')) {
    throw new Error(`Expected "${fieldName}" to look like an email`);
  }
}

function assertPaginationShape(body) {
  assertNumberField(body, 'page');
  assertNumberField(body, 'limit');
  assertNumberField(body, 'total');

  if (!Array.isArray(body.items)) {
    throw new Error('Expected "items" to be an array');
  }
}

function assertProblemDetails(body) {
  assertStringField(body, 'title');
  assertNumberField(body, 'status');

  if (body.detail !== undefined && typeof body.detail !== 'string') {
    throw new Error('Expected optional "detail" to be a string');
  }
}

function normalizeHeaders(headers) {
  return Object.entries(headers).reduce((accumulator, [name, value]) => {
    accumulator[name.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value);
    return accumulator;
  }, {});
}

function buildAssertionResult(name, callback) {
  try {
    callback();
    return { name, status: 'passed' };
  } catch (error) {
    return {
      name,
      status: 'failed',
      message: error.message,
    };
  }
}

module.exports = {
  assertBodyContainsFields,
  assertEmailField,
  assertHeader,
  assertJsonContentType,
  assertNumberField,
  assertPaginationShape,
  assertProblemDetails,
  assertStatus,
  assertStringField,
  buildAssertionResult,
  normalizeHeaders,
};
