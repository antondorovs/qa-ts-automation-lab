import { expect, test as base } from '@playwright/test';
import { JsonPlaceholderClient } from '../clients/jsonplaceholder.client';

type ApiFixtures = {
  jsonPlaceholderClient: JsonPlaceholderClient;
};

export const test = base.extend<ApiFixtures>({
  jsonPlaceholderClient: async ({ request }, use) => {
    await use(new JsonPlaceholderClient(request));
  },
});

test.use({ baseURL: 'https://jsonplaceholder.typicode.com' });

export { expect };
