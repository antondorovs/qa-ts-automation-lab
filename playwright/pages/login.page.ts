import { Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async openLoginPage() {
    await this.page.goto('/');
  }

  async getPageTitle() {
    return this.page.title();
  }
}
