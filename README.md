# QA TypeScript Automation Lab

QA TypeScript Automation Lab is my personal practice repository for improving skills in manual and automated software testing with a TypeScript-first automation stack.

This project combines practical examples of:
- Playwright automation
- API testing
- SQL queries
- CI/CD configuration
- Docker setup
- Kubernetes manifests
- test documentation
- bug reporting
- QA utilities and helpers
- custom QA run intelligence, release decisions, execution stability, tag coverage, test area summaries, suite health, suite performance, regression risk scoring, and release gates

Main goals of this repository:
- improve automation skills
- practice real QA workflows
- experiment with testing tools and frameworks
- build reusable testing examples
- maintain active engineering practice

Tech stack:
- TypeScript
- Playwright
- SQL
- Docker
- GitHub Actions
- Jenkins
- Kubernetes
- YAML

Project structure:
- api/ -> API testing examples
- playwright/ -> UI automation tests
- sql/ -> SQL practice examples
- k8s/ -> Kubernetes manifests
- docker/ -> Docker runner examples
- bug-reports/ -> bug report examples
- test-cases/ -> test case examples
- notes/ -> QA notes and learning materials
- docs/ -> human-facing project documentation
- qa-report/ -> generated JSON and Markdown run intelligence (ignored by Git)

Useful commands:
- npm test -> run all Playwright tests
- npm run typecheck -> run strict TypeScript compiler checks without emitting files
- npm run test:api -> run API tests
- npm run test:ui -> run UI tests
- npm run test:utils -> run utility and source policy tests
- npm run test:live -> run public API diagnostics when `RUN_LIVE_API_TESTS=true`
- npm run test:chromium -> run all tests in Chromium
- npm run test:smoke -> run smoke-tagged tests
- npm run test:contract -> run contract-tagged tests
- npm run test:report -> open the Playwright report
- npm run test:qa-report -> run Chromium tests and generate QA run intelligence

Environment:
- core API tests use a local TypeScript HTTP server and do not require external services
- `.env.example` contains safe values used only by optional public API diagnostics
- local `.env` is ignored and can override live diagnostic settings
- push CI does not call JSONPlaceholder or Reqres
- every Playwright run generates `qa-report/qa-summary.json` and `qa-report/qa-summary.md`
- CI retries a failed test once, reports retry success as flaky, and blocks the quality gate

Documentation:
- `docs/README.md` is the entry point for broader human-facing documentation
- `docs/qa-run-intelligence.md` describes reporter metrics and release gate behavior

GitHub language statistics note:
- Generated HTML reports are ignored with `.gitignore` and `.gitattributes`
- TypeScript is the primary source language for Playwright/API automation
- JavaScript source files should not be added; existing helpers should be converted to TypeScript when touched
- SQL files contain database practice and QA reporting examples
- YAML files contain CI/CD and Kubernetes examples

Current practice focus:
- TypeScript: Playwright API/UI automation and page object examples
- TypeScript utilities: reusable QA helpers, metrics, assertions, and bug report builders
- QA reporting: Playwright result aggregation, release decisions, execution stability, tag coverage, test area summaries, suite health, suite performance, flaky detection, risk hotspots, slow-test visibility, and strict release gates
- SQL: datasets, reporting queries, window functions, and release quality dashboards
- YAML/Docker: CI jobs, Kubernetes manifests, and local service setup
