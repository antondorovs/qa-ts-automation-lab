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

Useful commands:
- npm test -> run all Playwright tests
- npm run test:api -> run API tests
- npm run test:ui -> run UI tests
- npm run test:chromium -> run all tests in Chromium
- npm run test:smoke -> run smoke-tagged tests
- npm run test:contract -> run contract-tagged tests
- npm run test:report -> open the Playwright report

Environment:
- `.env.example` contains safe public API practice values
- local `.env` is ignored and can override API settings
- CI workflows define the same public practice values explicitly

Documentation:
- `docs/README.md` is the entry point for broader human-facing documentation

GitHub language statistics note:
- Generated HTML reports are ignored with `.gitignore` and `.gitattributes`
- TypeScript is the primary source language for Playwright/API automation
- JavaScript source files should not be added; existing helpers should be converted to TypeScript when touched
- SQL files contain database practice and QA reporting examples
- YAML files contain CI/CD and Kubernetes examples

Current practice focus:
- TypeScript: Playwright API/UI automation and page object examples
- TypeScript utilities: reusable QA helpers, metrics, assertions, and bug report builders
- SQL: datasets, reporting queries, window functions, and release quality dashboards
- YAML/Docker: CI jobs, Kubernetes manifests, and local service setup
