import type { CommentPayload, PostPayload, UserPayload } from '../clients/jsonplaceholder.client';

export type UserRecord = UserPayload & {
  id: number;
};

export type PostRecord = PostPayload & {
  id: number;
};

export type CommentRecord = CommentPayload & {
  id: number;
};

export const VALID_LOGIN = {
  email: 'eve.holt@reqres.in',
  password: 'cityslicka',
} as const;

export const MOCK_AUTH_TOKEN = 'mock-auth-token';

export function createUsers(): UserRecord[] {
  return Array.from({ length: 10 }, (_, index) => {
    const id = index + 1;

    return {
      id,
      name: `QA User ${id}`,
      username: `qa_user_${id}`,
      email: `qa.user.${id}@example.com`,
      phone: `+155501${String(id).padStart(2, '0')}`,
      website: `qa-user-${id}.example`,
    };
  });
}

export function createPosts(): PostRecord[] {
  return Array.from({ length: 50 }, (_, index) => {
    const id = index + 1;
    const userId = Math.floor(index / 5) + 1;

    return {
      id,
      userId,
      title: `Post ${id} for user ${userId}`,
      body: `Deterministic post body ${id}`,
    };
  });
}

export function createComments(): CommentRecord[] {
  return Array.from({ length: 25 }, (_, index) => {
    const id = index + 1;
    const postId = Math.floor(index / 5) + 1;

    return {
      id,
      postId,
      name: `Comment ${id}`,
      email: `comment.${id}@example.com`,
      body: `Deterministic comment body ${id}`,
    };
  });
}
