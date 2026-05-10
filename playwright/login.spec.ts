import { test, expect } from '@playwright/test';

test('login page should be opened', async ({ page }) => {
    await page.goto('https://example.com');

    await expect(page).toHaveTitle(/Example/);
});