-- Practice dataset for API, backend, and QA reporting queries.

CREATE TABLE qa_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    role VARCHAR(40) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE qa_test_runs (
    id SERIAL PRIMARY KEY,
    branch_name VARCHAR(120) NOT NULL,
    environment VARCHAR(40) NOT NULL,
    status VARCHAR(30) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    finished_at TIMESTAMP
);

CREATE TABLE qa_test_results (
    id SERIAL PRIMARY KEY,
    run_id INT NOT NULL REFERENCES qa_test_runs(id),
    test_name VARCHAR(180) NOT NULL,
    suite_name VARCHAR(120) NOT NULL,
    status VARCHAR(30) NOT NULL,
    duration_ms INT NOT NULL,
    error_message TEXT
);

INSERT INTO qa_users (email, role, status, created_at) VALUES
('admin@example.com', 'admin', 'active', '2026-05-01 09:00:00'),
('tester@example.com', 'qa_engineer', 'active', '2026-05-03 12:15:00'),
('blocked@example.com', 'viewer', 'blocked', '2026-05-06 18:45:00');

INSERT INTO qa_test_runs (branch_name, environment, status, started_at, finished_at) VALUES
('main', 'staging', 'passed', '2026-05-10 10:00:00', '2026-05-10 10:07:14'),
('feature/api-contracts', 'staging', 'failed', '2026-05-11 11:20:00', '2026-05-11 11:31:48'),
('feature/ui-smoke', 'production-like', 'passed', '2026-05-12 08:30:00', '2026-05-12 08:36:05');

INSERT INTO qa_test_results (run_id, test_name, suite_name, status, duration_ms, error_message) VALUES
(1, 'GET /users returns 200', 'api/users', 'passed', 420, NULL),
(1, 'login page should be opened', 'ui/login', 'passed', 1350, NULL),
(2, 'POST /users validates schema', 'api/users', 'failed', 860, 'email field is missing'),
(2, 'unknown endpoint returns 404', 'api/negative', 'passed', 210, NULL),
(3, 'example domain smoke check', 'ui/example', 'passed', 980, NULL);
