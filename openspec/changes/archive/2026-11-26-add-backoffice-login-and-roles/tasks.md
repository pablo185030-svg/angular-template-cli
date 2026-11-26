# Tasks

## 1. Seed data, models and mock API

- [x] 1.1 Add `public/mock/roles.json` (admin, escritura, lectura with permissions) and `public/mock/users.json` (admin/escritura/lectura users, password `1234`, `admin@coto.com.ar`, first name, last name, employee number `1234`, `roleId`); verify with a unit test that loads both files and checks the three roles and the admin user fields.
- [x] 1.2 Create `core/auth/models/` types (`Permission`, extended `TokenClaims` with `role` and `permissions`) and `domains/roles/models/role.model.ts` (with Spanish permission labels); update `decode-token.ts` and its spec; verify `ng test --include "src/app/core/auth/decode-token.spec.ts"` passes.
- [x] 1.3 Update `mock/server.mjs`: `POST /api/auth/login` (replaces `/api/auth/token`), token with the new claims, per-route permission checks (`401`/`403`) for products, and `/api/roles` CRUD with the `409` rules and `userCount`; verify with a Node-run script or e2e spec hitting each case (wrong credentials, no token, `lectura` creating a product, `escritura` calling roles, deleting `admin`, deleting a used role, duplicate name).
- [x] 1.4 Update `e2e/mock-api-auth.spec.ts` for the login endpoint and the permission responses; verify `npx playwright test e2e/mock-api-auth.spec.ts` passes.

## 2. Auth contract, login screen and guards

- [x] 2.1 Extend `AuthService` (`permissions`, `hasPermission`, `hasLoginPage`), `FakeAuthService`, and `KeycloakAuthService` (permissions from `permissions` claim or default role names); verify with unit tests for both mappings.
- [x] 2.2 Rework `MockAuthService`: start signed out, `login(targetUrl)` navigates to `/login?returnUrl=`, `signIn(username, password)` against the mock API (http) or `users.json`/`roles.json` (json), in-memory token and claims, `logout()` clears and navigates to `/login`; verify the updated `mock-auth.service.spec.ts` covers success, wrong credentials, json mode and mock API down.
- [x] 2.3 Add `domains/login/pages/login-page` (Signal Forms, Spanish labels and errors, `data-testid`s, no header, 320px-safe) and its spec; verify empty-field validation, error message on failure and navigation to `returnUrl` on success.
- [x] 2.4 Add the `/login` route (redirects away when signed in or `!hasLoginPage`) and `permissionGuard`; apply `write`/`manage-roles`/`read` guards in `app.routes.ts`; update `auth.guard.spec.ts`, `app.routes.spec.ts` and add `permission.guard.spec.ts`; verify the three guard specs pass.
- [x] 2.5 Update the header (logout always shown, user name, Roles link only with `manage-roles`) and its spec; verify `ng test --include "src/app/shared/layouts/main-layout/components/header/header.spec.ts"` passes.
- [x] 2.6 Add the Playwright `signIn` helper (login form with `returnUrl`; a page load drops the in-memory session) and switch `home`, `products`, `responsive` and `theme` specs to it; add `e2e/login.spec.ts` (invalid credentials, login/logout, reload returns to login, read-only user); verify `npm run test:e2e` passes.

## 3. Roles ABM and product gating

- [x] 3.1 Implement `RolesService` contract, `HttpRolesService`, `JsonRolesService`, selected by `environment.api.mode` in `app.config.ts`; verify service specs (list/get/create/update/remove, duplicate name, protected and used roles).
- [x] 3.2 Implement `roles-list-page` (table on tablet up, cards below 768px, no delete for `admin` or used roles, confirm dialog) and `role-form-page` (name, description, permission checkboxes, validation, `admin` read-only); verify page specs for each scenario in the `backoffice-roles` spec.
- [x] 3.3 Hide new/edit/delete on the products list without `write`; verify an updated `products-list-page.spec.ts` for a `lectura` user and an `escritura` user.
- [x] 3.4 Add `e2e/roles.spec.ts` (create, edit, delete a role; `admin` protected; `escritura` cannot open `/roles`) and extend `responsive.spec.ts` to the login and roles pages at 320px; verify `npm run test:e2e` passes.

## 4. Docs, spec sync and final verification

- [x] 4.1 Update `templates/backoffice/CLAUDE.md`, `README.md` and `README.en.md` (login in demo mode, seeded users, roles and permissions, mock endpoints, Keycloak permission mapping, structure, demo-only warnings); verify the three files describe the same behavior and mention no `/api/auth/token`.
- [x] 4.2 Run `scripts/remove-mock-api.mjs` against a copy and confirm login, products and roles still work in JSON mode; fix the script only if it relied on the old token endpoint.
- [x] 4.3 Typecheck and run `npm run verify` from the repository root; verify it passes for both templates and the CLI tests.

## Workflow follow-up

- Sync the delta specs and archive the change (`/openspec-sync-specs`, `/openspec-archive-change`) once the implementation is verified.
