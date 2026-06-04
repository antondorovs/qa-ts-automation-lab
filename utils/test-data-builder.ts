import type { CommentPayload, PostPayload, UserPayload } from '../api/clients/jsonplaceholder.client';

export type InvalidLoginPayload = {
  email: string;
  password: string;
};

export type PaginationParams = {
  _page: string;
  _limit: string;
};

const defaultUser: UserPayload = {
  name: 'QA Learning User',
  username: 'qa_learner',
  email: 'qa.learner@example.com',
  phone: '+3725550100',
  website: 'qa-ts-automation-lab.example',
};

const defaultPost: PostPayload = {
  title: 'API automation practice',
  body: 'Reusable payload for Playwright request context examples.',
  userId: 1,
};

const defaultComment: CommentPayload = {
  postId: 1,
  name: 'QA regression comment',
  email: 'qa.regression@example.com',
  body: 'Practice comment creation flow with Playwright request context',
};

const defaultInvalidLogin: InvalidLoginPayload = {
  email: 'invalid.user@example.com',
  password: 'wrong-password',
};

export function buildUserPayload(overrides: Partial<UserPayload> = {}): UserPayload {
  return {
    ...defaultUser,
    ...overrides,
  };
}

export function buildPostPayload(overrides: Partial<PostPayload> = {}): PostPayload {
  return {
    ...defaultPost,
    ...overrides,
  };
}

export function buildCommentPayload(overrides: Partial<CommentPayload> = {}): CommentPayload {
  return {
    ...defaultComment,
    ...overrides,
  };
}

export function buildInvalidLoginPayload(overrides: Partial<InvalidLoginPayload> = {}): InvalidLoginPayload {
  return {
    ...defaultInvalidLogin,
    ...overrides,
  };
}

export function buildPaginationParams(page = 1, limit = 10): PaginationParams {
  return {
    _page: String(page),
    _limit: String(limit),
  };
}
