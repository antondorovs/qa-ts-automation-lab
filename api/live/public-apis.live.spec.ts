import { test, expect } from '@playwright/test';
import { env } from '../../utils/env';
import { buildInvalidLoginPayload } from '../../utils/test-data-builder';

test.describe('@live public practice API diagnostics', () => {
  test.skip(
    process.env.RUN_LIVE_API_TESTS !== 'true',
    'Set RUN_LIVE_API_TESTS=true to call public practice APIs',
  );

  test('JSONPlaceholder should expose its users collection', async ({ request }) => {
    const response = await request.get('https://jsonplaceholder.typicode.com/users');

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(Number),
        email: expect.stringContaining('@'),
      }),
    ]));
  });

  test('Reqres should reject invalid credentials', async ({ request }) => {
    const response = await request.post(`${env.baseUrl}/api/login`, {
      data: buildInvalidLoginPayload({
        email: env.email,
      }),
    });

    expect(response.status()).toBe(401);
  });
});
