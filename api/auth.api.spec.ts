import { test, expect } from '@playwright/test';
import { env } from '../utils/env';
import { buildInvalidLoginPayload } from '../utils/test-data-builder.ts';

test('@api @smoke login api should return unauthorized with invalid credentials', async ({ request }) => {
  const response = await request.post(`${env.baseUrl}/api/login`, {
    data: buildInvalidLoginPayload({ email: env.email }),
  });

  expect(response.status()).toBe(401);
});
