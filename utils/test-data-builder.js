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
  buildInvalidLoginPayload,
  buildPaginationParams,
  buildPostPayload,
  buildUserPayload,
};
