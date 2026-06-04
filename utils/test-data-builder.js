const defaultUser = {
  name: 'QA Learning User',
  username: 'qa_learner',
  email: 'qa.learner@example.com',
  phone: '+3725550100',
  website: 'qa-learning-lab.example',
};

const defaultPost = {
  title: 'API automation practice',
  body: 'Reusable payload for Playwright request context examples.',
  userId: 1,
};

const defaultComment = {
  postId: 1,
  name: 'QA regression comment',
  email: 'qa.regression@example.com',
  body: 'Practice comment creation flow with Playwright request context',
};

function buildUserPayload(overrides = {}) {
  return {
    ...defaultUser,
    ...overrides,
  };
}

function buildPostPayload(overrides = {}) {
  return {
    ...defaultPost,
    ...overrides,
  };
}

function buildCommentPayload(overrides = {}) {
  return {
    ...defaultComment,
    ...overrides,
  };
}

function buildInvalidLoginPayload(overrides = {}) {
  return {
    email: 'invalid.user@example.com',
    password: 'wrong-password',
    ...overrides,
  };
}

function buildPaginationParams(page = 1, limit = 10) {
  return {
    _page: String(page),
    _limit: String(limit),
  };
}

module.exports = {
  buildCommentPayload,
  buildInvalidLoginPayload,
  buildPaginationParams,
  buildPostPayload,
  buildUserPayload,
};
