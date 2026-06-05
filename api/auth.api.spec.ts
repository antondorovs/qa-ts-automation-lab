import { test, expect } from './fixtures/api.fixture';
import { MOCK_AUTH_TOKEN, VALID_LOGIN } from './mock/mock-api.data';
import { buildInvalidLoginPayload } from '../utils/test-data-builder';

test.describe('@api @auth authentication contract', () => {
  test('@smoke valid credentials should return an auth token', async ({ authClient }) => {
    const response = await authClient.login(VALID_LOGIN);
    const body = await response.json();

    expect(body).toEqual({ token: MOCK_AUTH_TOKEN });
  });

  test('@smoke invalid credentials should return unauthorized', async ({ authClient }) => {
    const response = await authClient.loginUnauthorized(
      buildInvalidLoginPayload({ email: VALID_LOGIN.email }),
    );
    const body = await response.json();

    expect(body).toEqual({ error: 'Invalid credentials' });
  });

  test('missing password should return a validation response', async ({ authClient }) => {
    const response = await authClient.loginWithInvalidPayload({
      email: VALID_LOGIN.email,
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body).toEqual({ error: 'email and password are required' });
  });
});
