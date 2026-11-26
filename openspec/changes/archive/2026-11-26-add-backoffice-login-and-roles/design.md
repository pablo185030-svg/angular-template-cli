# Design

## Context

- Auth is selected in `app.config.ts` by `environment.auth.mode`: `MockAuthService` (demo, signed in from construction, token from `POST /api/auth/token`, in memory) or `KeycloakAuthService`. `authGuard` calls `auth.login(state.url)` for unauthenticated users; `authInterceptor` adds the Bearer token under `apiBaseUrl`.
- Everything under `MainLayout` is behind `authGuard`. The header shows logout only when `!auth.isDemo`.
- Products have a contract (`ProductsService`) with `HttpProductsService` and `JsonProductsService`, chosen by `environment.api.mode`; both the mock server and the JSON service read `public/mock/products.json`. `scripts/remove-mock-api.mjs` switches dev and e2e to `json` and deletes the server.
- The mock API verifies nothing about tokens beyond a non-empty Bearer value. e2e tests (Playwright) start the mock API and the app with `environment.e2e.ts` (mock auth) and assume the user is already signed in.
- Decided with the user: the login form replaces demo mode only (Keycloak untouched), and roles are enforced.

## Goals / Non-Goals

**Goals:**
- Same shape as the products example: contract + HTTP/JSON services, shared seed files, mock endpoints, Signal Forms pages.
- One permission model used by guards, the UI and the mock API.
- Demo mode and the JSON source keep working with no mock server.

**Non-Goals:**
- Real security (the mock token is unsigned and trusted), a users ABM, password hashing, session persistence, and Keycloak role administration.

## Decisions

1. **Permissions, not role names, drive behavior.** `Permission = 'read' | 'write' | 'manage-roles'` and `Role = { id, name, description, permissions }`. Guards and UI check permissions, so custom roles created in the ABM work without code changes. Alternative: hard-code the three role names in guards, rejected because the roles ABM would then be cosmetic.
2. **`AuthService` gains `permissions: Signal<Permission[]>`, `hasPermission(p)` and `hasLoginPage: boolean`.** The mock service sets `hasLoginPage = true`; Keycloak `false`. `login(targetUrl)` in the mock service navigates to `/login?returnUrl=<targetUrl>`; a new `signIn(username, password)` (mock only, on the concrete class used by the login page via a small `LoginService`/the AuthService contract's optional method — implementation picks the simplest typing) resolves with success or an error and stores token and claims. `logout()` clears them and navigates to `/login`. `FakeAuthService` gets matching controls.
3. **Token claims extended**: `sub`, `name`, `role`, `permissions`, `exp` (replacing `roles`). `decodeToken` validates the new shape. The mock service reads `name` and `permissions` from the claims; there is no separate user endpoint.
4. **Keycloak permissions**: derived from `realm_access.roles` in the access token, mapped by the default role names (`admin`, `escritura`, `lectura`) to the default permission sets; unknown roles grant nothing. A `permissions` claim, when present, takes precedence. Documented as the place to adapt. Alternative: grant everything in Keycloak mode, rejected as an unsafe default.
5. **Login endpoint replaces the token endpoint** at `POST /api/auth/login` (`{ username, password }` → `200 { access_token, token_type, expires_in }` or `401 { message: 'Credenciales inválidas' }`). Under `/api`, so the proxy and the optional nginx location need no change. The mock computes the user's permissions from the current roles at login time, so a role edited in the ABM applies at the next login.
6. **Seed files** `public/mock/roles.json` and `public/mock/users.json` (users carry `roleId`), read by `mock/server.mjs` and by the JSON services, like products. JSON mode login validates against `users.json`/`roles.json` in the browser (`fetch`, not `HttpClient`, same loop-avoidance as before) and builds a local unsigned token with the same claims. Passwords are plain text in a seed file: acceptable only because this is demo data; stated in the docs.
7. **Mock API enforcement.** The server decodes the Bearer payload (no verification) and checks permissions per route: products GET → `read`, mutations → `write`, `/api/roles` → `manage-roles` (`401` without a Bearer, `403` without the permission). Roles API: `GET/POST /api/roles`, `GET/PUT/DELETE /api/roles/:id`; `409` when the name exists, when deleting `admin` or a role with users, or when changing `admin`.
8. **Roles feature** in `domains/roles/` mirroring products: `models/role.model.ts` (with `PERMISSIONS` labels in Spanish), `services/roles.service.ts` (contract), `http-roles.service.ts`, `json-roles.service.ts`, `pages/roles-list-page`, `pages/role-form-page` (Signal Forms; name required and unique, at least `read`, permission checkboxes). Unique-name checking uses the list loaded by the page for JSON and the `409` for HTTP, surfaced as the same Spanish message. The list needs "role in use" to hide delete, so the roles API returns `userCount` per role (JSON service computes it from `users.json`).
9. **Routing and guards.** New `loginGuard` is not needed as a separate concept: `/login` is a sibling of the layout route, with a `canActivate` that redirects to `/` when authenticated or when `!auth.hasLoginPage`. A `permissionGuard(permission)` factory (`core/guards/permission.guard.ts`) redirects to `/` via `UrlTree`. Routes: `productos/nuevo` and `productos/:id/editar` → `write`; `roles*` → `manage-roles`; `productos` → `read` (a role without `read` is blocked by the form validation, but the guard still checks). The products list hides its new/edit/delete actions without `write`; the header hides the Roles link without `manage-roles`.
10. **Header**: logout is always shown; the demo badge stays when `isDemo`. The login page is a standalone page with the ui-kit/Material form components, centered card, mobile-first, no horizontal overflow at 320px.
11. **e2e**: since the session is in memory, a Playwright helper (`e2e/support/auth.ts`, `signIn(page, path, user)`) signs in through the login form (`/login?returnUrl=<path>`), because a full page load drops the in-memory session so specs cannot `page.goto` private routes; a new spec covers login failure, role-limited users and the roles ABM. `mock-api-auth.spec.ts` is updated to the login endpoint.
12. **`remove:mock-api`** keeps working: roles and users already live in JSON files; the script is verified (and adjusted only if it assumed the old token endpoint).

## Risks / Trade-offs

- [Session lost on reload is annoying in development] → Intentional and consistent with "no tokens in browser storage"; noted in the docs.
- [Seeded plain-text passwords and an unverified token could be mistaken for a pattern to copy] → Repeated "demo only, never deployed" warnings in CLAUDE.md/READMEs; `environment.prod.ts` stays `keycloak`.
- [Keycloak permission mapping only knows the default role names] → Documented; the `permissions` claim override is the extension point.
- [Breaking the old token endpoint and the auto sign-in breaks every existing e2e spec] → The fixture and updated specs land in the same task group as the login.
- [Roles API in JSON mode cannot enforce `403`] → Enforcement there is UI/guard only, same as any client-side check; stated in the docs.

## Migration Plan

Template-only change; projects already generated are unaffected. No data migration. Rollback is reverting the change.
