# Tasks

## 1. Mock API token endpoint

- [x] 1.1 Add `POST /api/auth/token` to `mock/server.mjs` returning an unsigned JWT-shaped token (`sub`, `name: 'Usuario demo'`, `roles`, `exp`); verify with `curl -X POST localhost:5000/api/auth/token` while `npm run mock:api` runs.
- [x] 1.2 Require a non-empty `Authorization: Bearer` header on `/api/products` (401 `{ message: 'No autorizado' }` otherwise), keeping `/health` and the token route open; verify with `curl` with and without the header.
- [x] 1.3 Add e2e API checks in `e2e/` (token issued, products 401 without token, 200 with token) and verify `npx playwright test <file>` passes.

## 2. Demo auth uses the token

- [x] 2.1 Add a token-claims model under `core/auth/models/` and a small helper to decode the unsigned payload; verify with a unit spec covering a valid token and a malformed one.
- [x] 2.2 Update `MockAuthService.init()`: skip the request when `environment.api.mode === 'json'`; otherwise `fetch` the token endpoint with a short timeout, keep the token in a signal, derive `userName` from claims, and fall back to the local fake user/token (with `console.warn`) on any failure. Verify with `npx ng test --watch=false --include "src/app/core/auth/mock-auth.service.spec.ts"` covering success, JSON mode, network error, non-2xx and invalid body.
- [x] 2.3 Verify the e2e flow still passes in demo mode (products list loads through the token) with `npm run test:e2e`, and manually that `api.mode: 'json'` with no mock running still starts.
- [x] 2.4 Verify `npm run remove:mock-api` on a copy of the template leaves lint, unit tests, build and e2e passing (extend the script's test if it asserts on auth).

## 3. Docs and spec sync

- [x] 3.1 Update the demo mode and mock API sections of `templates/backoffice/CLAUDE.md`, `README.md` (Spanish) and `README.en.md`, including a `curl` example that fetches a token first; verify both READMEs stay in sync.
- [x] 3.2 Run `npm run verify:quick` (or `npm run verify`) from the repo root and verify it passes; run `npx tsc --noEmit -p templates/backoffice/tsconfig.app.json` for typecheck.

## Workflow follow-up

- Sync the delta spec and archive the change after review (`/openspec-sync-specs`, `/openspec-archive-change`).
