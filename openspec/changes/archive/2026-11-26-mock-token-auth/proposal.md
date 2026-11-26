# Proposal

## Why

Demo mode in the backoffice template fakes authentication entirely in the browser: `MockAuthService` returns a hard-coded `'mock-token'` that no server ever checks. The Bearer interceptor, the guard and the 401 handling are therefore never exercised in local development, and bugs in them only show up once a real identity provider and API are connected. Making the mock API issue and require a (fake) token makes the demo flow behave like the real one at almost no cost.

## What Changes

- The mock API server gains a token endpoint (`POST /api/auth/token`) that returns an unsigned, JWT-shaped fake token with a display name, roles and an expiry.
- The mock API server requires an `Authorization: Bearer` header on `/api/products` and answers `401` without one. `/health` and the token endpoint stay open.
- In demo mode, `MockAuthService.init()` requests a token from the mock API and keeps it in memory only (no browser storage); the user name comes from the token claims.
- When no mock API is available (products data source set to JSON, the mock removed, or the token request fails), demo mode falls back to today's local fake token, so the app still starts and every page still works.
- `npm run remove:mock-api` and the docs keep working: the fallback is selected by the existing `api.mode: 'json'` setting, so no new setting is added.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `backoffice-template`: the "Demo mode without Keycloak" requirement now covers obtaining a fake token from the mock API (with a local fallback), and a new requirement covers the mock API issuing and requiring that token.

## Impact

- `templates/backoffice/mock/server.mjs`: token endpoint and Bearer check.
- `templates/backoffice/src/app/core/auth/mock-auth.service.ts` (+ spec) and a small token-claims model under `core/auth/models/`.
- `templates/backoffice/e2e/`: a check that the products list loads in demo mode (the e2e server is the mock API) and that the mock rejects requests without a token.
- `templates/backoffice/CLAUDE.md`, `README.md` and `README.en.md`: demo mode and mock API sections.
- No change to Keycloak mode, the production build, the CLI, or the public template. Never meant to be used in a deployed environment, same as demo mode today.
