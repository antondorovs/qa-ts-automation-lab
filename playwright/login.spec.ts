import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { mockExampleDomain } from './fixtures/example-domain.fixture';

test('login page should be opened', async ({ page }) => {
    await mockExampleDomain(page);

    const loginPage = new LoginPage(page);

    await loginPage.openLoginPage();

    const title = await loginPage.getPageTitle();

    await expect(title).toContain('Example');
});
