import { test, expect } from './fixtures/api.fixture';
import { expectUserShape } from './utils/schema-validator';

test('@api @smoke GET /users/{id} should return valid user response', async ({ jsonPlaceholderClient }) => {
  const response = await jsonPlaceholderClient.getUser(1);
  const body = await response.json();

  expectUserShape(body);
  expect(body.id).toBe(1);
});
