# Etemad testing guide

The repository has two test suites and two production-build checks. The backend uses Node’s built-in test runner, while the frontend uses Vitest for deterministic utility tests.

## Backend

```bash
cd server
npm ci
npm test
```

The backend tests cover auction expiry, Gemini response parsing and failure classification, registration validation, EmailJS payload construction, upload MIME policy, rate-limit configuration, API error formatting, and ownership authorization. These tests do not require production secrets or a live MongoDB database because external dependencies are isolated at the unit boundary.

## Frontend

```bash
cd client
npm ci
npm test
npm run lint
npm run build
```

The frontend tests cover file-picker validation, auction countdown calculations, role-based dashboard routing, approved-organization access decisions, and API error-message extraction. The production build confirms that the Vite bundle can be generated from a clean lockfile installation.

## Continuous integration

The workflow in `.github/workflows/quality.yml` runs backend tests and frontend tests, lint, and build checks on pushes to the active branches and on pull requests targeting `main`. A failed check should be fixed before merging a change.

## Current validation scope

Unit tests intentionally do not replace end-to-end checks. Before a release, manually verify registration and email verification, admin organization approval, tender creation, proposal submission, auction bidding, Socket.IO negotiation messages, uploaded-document access, and the production `/api/health` route. The EC2 runbook contains the deployment health-check command.

## Interpreting warnings

The frontend lint command currently completes with zero errors and some React effect guidance warnings. These warnings identify future refactoring opportunities, especially effect dependencies and asynchronous loading patterns; they are not hidden by the CI workflow. The Vite build also reports a large client chunk, which is tracked as a future code-splitting improvement rather than suppressed by increasing the warning limit.
