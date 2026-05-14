import { test, expect } from '@playwright/test';
import { env } from '../utils/env';

test('login api should return unauthorized with invalid credentials', async ({ request }) => {
    const response = await request.post(`${env.baseUrl}/api/login`, {
        data: {
            email: env.email,
            password: 'wrong-password'
        }
    });

    expect(response.status()).toBe(401);
});