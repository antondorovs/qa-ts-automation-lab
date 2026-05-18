import { Page } from '@playwright/test';

export const EXAMPLE_DOMAIN_URL = 'https://example.com/';
export const IANA_EXAMPLE_URL = 'https://iana.org/domains/example';
export const IANA_HELP_URL = 'https://www.iana.org/help/example-domains';

const exampleDomainHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Example Domain</title>
  </head>
  <body>
    <main>
      <h1>Example Domain</h1>
      <p>This domain is for use in documentation examples without needing permission.</p>
      <p><a href="${IANA_EXAMPLE_URL}">Learn more</a></p>
    </main>
  </body>
</html>`;

const ianaExampleHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Example Domains</title>
  </head>
  <body>
    <main>
      <h1>Example Domains</h1>
      <p>Reserved domains are maintained for documentation purposes.</p>
      <a href="/domains/reserved">IANA-managed Reserved Domains</a>
    </main>
  </body>
</html>`;

export async function mockExampleDomain(page: Page) {
  await page.route(EXAMPLE_DOMAIN_URL, async (route) => {
    await route.fulfill({
      contentType: 'text/html',
      body: exampleDomainHtml,
    });
  });

  await page.route(IANA_EXAMPLE_URL, async (route) => {
    await route.fulfill({
      contentType: 'text/html',
      body: ianaExampleHtml,
    });
  });

  await page.route(IANA_HELP_URL, async (route) => {
    await route.fulfill({
      contentType: 'text/html',
      body: ianaExampleHtml,
    });
  });
}
