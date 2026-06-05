import { expect, request as playwrightRequest, test as base } from '@playwright/test';
import { AuthClient } from '../clients/auth.client';
import { JsonPlaceholderClient } from '../clients/jsonplaceholder.client';
import { MockApiServer } from '../mock/mock-api.server';

type ApiFixtures = {
  authClient: AuthClient;
  jsonPlaceholderClient: JsonPlaceholderClient;
};

type ApiWorkerFixtures = {
  mockApiServer: MockApiServer;
};

export const test = base.extend<ApiFixtures, ApiWorkerFixtures>({
  mockApiServer: [
    async ({}, use) => {
      const server = new MockApiServer();
      await server.start();
      await use(server);
      await server.stop();
    },
    { scope: 'worker' },
  ],
  jsonPlaceholderClient: async ({ mockApiServer }, use) => {
    const request = await playwrightRequest.newContext({
      baseURL: mockApiServer.baseUrl,
    });
    await use(new JsonPlaceholderClient(request));
    await request.dispose();
  },
  authClient: async ({ mockApiServer }, use) => {
    const request = await playwrightRequest.newContext({
      baseURL: mockApiServer.baseUrl,
    });
    await use(new AuthClient(request));
    await request.dispose();
  },
});

export { expect };
