# Design

## Context

- `MockAuthService` (`core/auth/mock-auth.service.ts`) is selected by `environment.auth.mode === 'mock'` in `app.config.ts`. It is synchronous: signed in from construction, `getAccessToken()` returns `'mock-token'`, `init()` is a no-op.
- `authInterceptor` already adds the Bearer token to requests under `environment.apiBaseUrl` (`/api`) and nowhere else. `proxy.conf.json` forwards only `/api` to the mock server on port 5000, and `nginx.conf` has an optional `/api/` location.
- `mock/server.mjs` is a dependency-free Node HTTP server; `scripts/remove-mock-api.mjs` deletes it and sets `api.mode` to `'json'` in the dev and e2e environments.
- `JsonProductsService` never calls the server, so JSON mode has no mock API at all.

## Goals / Non-Goals

**Goals:**
- Demo mode exercises the real token path (obtain, store, send, reject) against the mock API.
- Demo mode keeps working with no mock server running or present.
- No new settings, scripts or dependencies.

**Non-Goals:**
- Token signing or verification, refresh tokens, expiry handling in the client, or role-based guards.
- Persisting the token across reloads.
- Any change to `KeycloakAuthService`, production behavior, or the CLI.

## Decisions

1. **Token endpoint lives under `/api` (`POST /api/auth/token`).** The existing proxy and the optional nginx `/api/` location already cover it, so no config changes. Alternative: a root `/token` path, rejected because it would need a second proxy entry and a second nginx location.
2. **Unsigned JWT-shaped token** (`base64url(header).base64url(payload).` with `sub`, `name`, `roles`, `exp`). Realistic enough for the client to read the user name from claims and for anyone inspecting it to recognize the shape, without a signing key or library. The mock only checks that a non-empty Bearer value is present. Alternative: an opaque string, rejected because the user name would then stay hard-coded in the client.
3. **Token kept in a signal, never in `localStorage`/`sessionStorage`.** `init()` runs on every page load, so persistence adds nothing, and the template should not model storing tokens in the browser.
4. **Fallback selected by existing settings, not by probing alone.** `init()` skips the request when `environment.api.mode === 'json'` (no server by definition) and otherwise requests the token; any failure (network error, non-2xx, invalid body) falls back to the local fake user and token. This keeps `remove:mock-api` and JSON mode working with no edits, and also covers a developer who forgot to start `npm run mock:api`. The request uses `fetch` (not `HttpClient`) so it cannot loop through the interceptor, which would call back into `AuthService`.
5. **Token request failure is silent for the user but logged with `console.warn`** so a missing mock is discoverable. After a fallback, API calls to the mock would get 401 if it is running but unreachable only for the token route, which is not a realistic case.
6. **`/api/products` answers `401` without a Bearer header** (`{ message: 'No autorizado' }`, Spanish like the other mock messages). `/health` and `/api/auth/token` are open. This is the behavior that gives the change its value; it is recorded as an assumption that it is acceptable for the mock to no longer be callable with a bare `curl`.
7. **No new environment setting** for "use mock token endpoint". `auth.mode: 'mock'` plus `api.mode` already express the intent.

## Risks / Trade-offs

- [Demo mode now depends on the mock server being up for the real path] → Falls back to the local fake token with a console warning, so the app always starts.
- [In `api.mode: 'http'` with a real backend behind the proxy and `auth.mode: 'mock'`, the token request hits that backend] → It fails or returns something that is not a token, so the fallback applies; the CLAUDE.md and README already say never to use demo mode with real data, and this is restated.
- [Mock rejecting unauthenticated calls could surprise someone testing with `curl`] → Documented in the mock API section with an example of fetching a token first.
- [Slightly slower startup: one extra request before the first navigation] → Local mock, negligible; the request has a short timeout so a hung server cannot block startup.
