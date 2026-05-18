import { test, expect } from '@playwright/test';
import { ExamplePage } from './pages/example.page';

test.describe('Example Domain smoke checks', () => {
  test('main content should be visible and stable', async ({ page }) => {
    const examplePage = new ExamplePage(page);

    await examplePage.open();
    await examplePage.expectLoaded();
    await expect(page).toHaveTitle(/Example Domain/);
  });

  test('learn more link should navigate to IANA documentation', async ({ page }) => {
    const examplePage = new ExamplePage(page);

    await examplePage.open();
    await examplePage.openLearnMore();

    await expect(page).toHaveURL(/iana\.org\/help\/example-domains/);
    await expect(page.getByRole('heading', { name: 'Example Domains' })).toBeVisible();
  });
});
