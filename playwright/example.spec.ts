import { test, expect } from '@playwright/test';
import { ExamplePage } from './pages/example.page';
import { IANA_EXAMPLE_URL, mockExampleDomain } from './fixtures/example-domain.fixture';

test.describe('@ui @smoke Example Domain smoke checks', () => {
  test.beforeEach(async ({ page }) => {
    await mockExampleDomain(page);
  });

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

    await expect(page).toHaveURL(IANA_EXAMPLE_URL);
    await expect(page.getByRole('heading', { name: 'Example Domains' })).toBeVisible();
  });
});
