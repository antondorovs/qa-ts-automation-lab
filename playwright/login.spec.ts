import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';

test('login page should be opened', async ({ page }) => {

    const loginPage = new LoginPage(page);

    await loginPage.openLoginPage();

    const title = await loginPage.getPageTitle();

    await expect(title).toContain('Example');
});