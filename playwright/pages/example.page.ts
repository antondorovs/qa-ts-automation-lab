import { expect, Locator, Page } from '@playwright/test';
import { IANA_EXAMPLE_URL } from '../fixtures/example-domain.fixture';

export class ExamplePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly learnMoreLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Example Domain' });
    this.learnMoreLink = page.getByRole('link', { name: 'Learn more' });
  }

  async open() {
    await this.page.goto('/');
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.learnMoreLink).toHaveAttribute('href', IANA_EXAMPLE_URL);
  }

  async openLearnMore() {
    await this.learnMoreLink.click();
  }
}
