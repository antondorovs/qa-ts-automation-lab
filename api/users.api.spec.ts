import { test, expect } from './fixtures/api.fixture';
import { expectUserShape } from './utils/schema-validator';

test('@api @smoke GET /users/{id} should return valid user response', async ({ jsonPlaceholderClient }) => {
  const response = await jsonPlaceholderClient.getUser(1);
  const body = await response.json();

  expectUserShape(body);
  expect(body.id).toBe(1);
});

test('@api GET /users/{id} should return 404 for a missing user', async ({ jsonPlaceholderClient }) => {
  const response = await jsonPlaceholderClient.getMissingUser(999);
  const body = await response.json();

  expect(response.status()).toBe(404);
  expect(body).toEqual({ error: 'User not found' });
});
