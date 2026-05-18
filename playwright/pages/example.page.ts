import { expect, Locator, Page } from '@playwright/test';

export class ExamplePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly learnMoreLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Example Domain' });
    this.learnMoreLink = page.getByRole('link', { name: 'More information...' });
  }

  async open() {
    await this.page.goto('/');
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.learnMoreLink).toHaveAttribute('href', 'https://www.iana.org/domains/example');
  }

  async openLearnMore() {
    await this.learnMoreLink.click();
  }
}
