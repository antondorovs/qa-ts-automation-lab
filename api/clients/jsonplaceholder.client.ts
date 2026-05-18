import { APIRequestContext, expect } from '@playwright/test';

export type UserPayload = {
  name: string;
  username: string;
  email: string;
  phone?: string;
  website?: string;
};

export type PostPayload = {
  title: string;
  body: string;
  userId: number;
};

export class JsonPlaceholderClient {
  constructor(private readonly request: APIRequestContext) {}

  async getUser(userId: number) {
    const response = await this.request.get(`/users/${userId}`);
    expect(response.status(), `GET /users/${userId}`).toBe(200);
    return response;
  }

  async listUsers() {
    const response = await this.request.get('/users');
    expect(response.status(), 'GET /users').toBe(200);
    return response;
  }

  async createUser(payload: UserPayload) {
    const response = await this.request.post('/users', { data: payload });
    expect(response.status(), 'POST /users').toBe(201);
    return response;
  }

  async getPostsByUser(userId: number) {
    const response = await this.request.get('/posts', {
      params: { userId: String(userId) },
    });
    expect(response.status(), `GET /posts?userId=${userId}`).toBe(200);
    return response;
  }

  async createPost(payload: PostPayload) {
    const response = await this.request.post('/posts', { data: payload });
    expect(response.status(), 'POST /posts').toBe(201);
    return response;
  }

  async getMissingResource() {
    return this.request.get('/missing-resource');
  }
}
