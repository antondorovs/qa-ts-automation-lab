import { test, expect } from '@playwright/test';
import { JsonPlaceholderClient } from './clients/jsonplaceholder.client';
import { expectArrayLengthAtLeast, expectCommentShape, expectPostShape, expectUserShape } from './utils/schema-validator';

test.describe('JSONPlaceholder users contract', () => {
  test.use({ baseURL: 'https://jsonplaceholder.typicode.com' });

  test('GET /users should return a stable users collection', async ({ request }) => {
    const client = new JsonPlaceholderClient(request);
    const response = await client.listUsers();
    const users = await response.json();

    expectArrayLengthAtLeast(users, 10, 'users collection');
    for (const user of users.slice(0, 3)) {
      expectUserShape(user);
    }
  });

  test('GET /users/{id} should return expected user contract', async ({ request }) => {
    const client = new JsonPlaceholderClient(request);
    const response = await client.getUser(1);
    const user = await response.json();

    expectUserShape(user);
    expect(user.id).toBe(1);
  });

  test('GET /posts filtered by userId should return only this user posts', async ({ request }) => {
    const client = new JsonPlaceholderClient(request);
    const response = await client.getPostsByUser(1);
    const posts = await response.json();

    expectArrayLengthAtLeast(posts, 5, 'posts collection');
    for (const post of posts.slice(0, 5)) {
      expectPostShape(post);
      expect(post.userId).toBe(1);
    }
  });

  test('POST /posts should echo created payload fields', async ({ request }) => {
    const client = new JsonPlaceholderClient(request);
    const payload = {
      title: 'QA learning lab API test',
      body: 'Practice API creation flow with Playwright request context',
      userId: 1,
    };

    const response = await client.createPost(payload);
    const post = await response.json();

    expectPostShape(post);
    expect(post).toMatchObject(payload);
  });

  test('GET /comments filtered by postId should return comment contracts for that post', async ({ request }) => {
    const client = new JsonPlaceholderClient(request);
    const response = await client.getCommentsByPost(1);
    const comments = await response.json();

    expectArrayLengthAtLeast(comments, 5, 'comments collection');
    for (const comment of comments.slice(0, 5)) {
      expectCommentShape(comment);
      expect(comment.postId).toBe(1);
    }
  });

  test('POST /comments should echo created comment payload fields', async ({ request }) => {
    const client = new JsonPlaceholderClient(request);
    const payload = {
      postId: 1,
      name: 'QA regression comment',
      email: 'qa.regression@example.com',
      body: 'Practice comment creation flow with Playwright request context',
    };

    const response = await client.createComment(payload);
    const comment = await response.json();

    expectCommentShape(comment);
    expect(comment).toMatchObject(payload);
  });

  test('unknown endpoint should return 404', async ({ request }) => {
    const client = new JsonPlaceholderClient(request);
    const response = await client.getMissingResource();

    expect(response.status()).toBe(404);
  });
});
