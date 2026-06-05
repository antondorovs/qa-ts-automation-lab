# API tests

This folder contains API testing examples using Playwright request context.

Structure:
- auth.api.spec.ts -> authorization tests
- users.api.spec.ts -> users endpoint tests
- users.contract.spec.ts -> contract and negative scenario checks
- clients/ -> reusable API clients
- fixtures/ -> Playwright fixtures that start the local API and create request clients
- mock/ -> deterministic TypeScript HTTP server and test data
- live/ -> optional public API diagnostics excluded from normal CI execution
- payloads/ -> request bodies
- schemas/ -> response validation schemas
- utils/ -> helper functions

Core API tests use the local mock server and are safe to run without internet access. Public JSONPlaceholder and Reqres checks run only when `RUN_LIVE_API_TESTS=true`.

Main goals:
- API automation practice
- response validation
- auth testing
- schema validation
- negative scenarios
- deterministic CI execution
