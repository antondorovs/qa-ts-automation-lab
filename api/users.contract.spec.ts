import { test, expect } from './fixtures/api.fixture';
import { buildCommentPayload, buildPostPayload } from '../utils/test-data-builder.ts';
import { expectArrayLengthAtLeast, expectCommentShape, expectPostShape, expectUserShape } from './utils/schema-validator';

test.describe('@api @contract JSONPlaceholder users contract', () => {
  test('GET /users should return a stable users collection', async ({ jsonPlaceholderClient }) => {
    const response = await jsonPlaceholderClient.listUsers();
    const users = await response.json();

    expectArrayLengthAtLeast(users, 10, 'users collection');
    for (const user of users.slice(0, 3)) {
      expectUserShape(user);
    }
  });

  test('GET /users/{id} should return expected user contract', async ({ jsonPlaceholderClient }) => {
    const response = await jsonPlaceholderClient.getUser(1);
    const user = await response.json();

    expectUserShape(user);
    expect(user.id).toBe(1);
  });

  test('GET /posts filtered by userId should return only this user posts', async ({ jsonPlaceholderClient }) => {
    const response = await jsonPlaceholderClient.getPostsByUser(1);
    const posts = await response.json();

    expectArrayLengthAtLeast(posts, 5, 'posts collection');
    for (const post of posts.slice(0, 5)) {
      expectPostShape(post);
      expect(post.userId).toBe(1);
    }
  });

  test('POST /posts should echo created payload fields', async ({ jsonPlaceholderClient }) => {
    const payload = buildPostPayload({
      title: 'QA learning lab API test',
      body: 'Practice API creation flow with Playwright request context',
    });

    const response = await jsonPlaceholderClient.createPost(payload);
    const post = await response.json();

    expectPostShape(post);
    expect(post).toMatchObject(payload);
  });

  test('GET /comments filtered by postId should return comment contracts for that post', async ({ jsonPlaceholderClient }) => {
    const response = await jsonPlaceholderClient.getCommentsByPost(1);
    const comments = await response.json();

    expectArrayLengthAtLeast(comments, 5, 'comments collection');
    for (const comment of comments.slice(0, 5)) {
      expectCommentShape(comment);
      expect(comment.postId).toBe(1);
    }
  });

  test('POST /comments should echo created comment payload fields', async ({ jsonPlaceholderClient }) => {
    const payload = buildCommentPayload();

    const response = await jsonPlaceholderClient.createComment(payload);
    const comment = await response.json();

    expectCommentShape(comment);
    expect(comment).toMatchObject(payload);
  });

  test('unknown endpoint should return 404', async ({ jsonPlaceholderClient }) => {
    const response = await jsonPlaceholderClient.getMissingResource();

    expect(response.status()).toBe(404);
  });
});
