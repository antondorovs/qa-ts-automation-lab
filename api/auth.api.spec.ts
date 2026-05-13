import { test, expect } from '@playwright/test';

test('login api should return unauthorized without valid credentials', async ({ request }) => {
    const response = await request.post('https://reqres.in/api/login', {
        data: {
            email: 'eve.holt@reqres.in',
            password: 'wrong-password'
        }
    });

    expect(response.status()).toBe(401);
});