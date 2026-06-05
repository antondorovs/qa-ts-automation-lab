import { type APIRequestContext, expect } from '@playwright/test';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};

export class AuthClient {
  constructor(private readonly request: APIRequestContext) {}

  async login(payload: LoginPayload) {
    const response = await this.request.post('/api/login', { data: payload });
    expect(response.status(), 'POST /api/login').toBe(200);
    return response;
  }

  async loginUnauthorized(payload: LoginPayload) {
    const response = await this.request.post('/api/login', { data: payload });
    expect(response.status(), 'POST /api/login with invalid credentials').toBe(401);
    return response;
  }

  async loginWithInvalidPayload(payload: Record<string, unknown>) {
    return this.request.post('/api/login', { data: payload });
  }
}
