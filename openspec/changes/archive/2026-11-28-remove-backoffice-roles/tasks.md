# Tasks

## 1. Remove the roles ABM

- [x] 1.1 Delete `src/app/domains/roles/` (models, services, pages, specs) and the three `roles` routes in `app.routes.ts`
- [x] 1.2 Remove the `RolesService` providers from `app.config.ts`
- [x] 1.3 Remove the roles link from `header.html` (and its styles and spec cases) and delete `e2e/roles.spec.ts`

## 2. Remove permission enforcement

- [x] 2.1 Delete `core/guards/permission.guard.ts` and its spec; drop `permissionGuard` from `app.routes.ts`
- [x] 2.2 Show the new, edit and delete actions in the products list and form unconditionally (`products-list-page.ts` and the product templates) and update their specs
- [x] 2.3 Delete `core/auth/models/permission.model.ts` and `core/auth/keycloak-permissions.ts` (+ spec); drop `permissions`, `roleName` and `hasPermission()` from `AuthService`, `KeycloakAuthService`, `MockAuthService` and `testing/FakeAuthService`
- [x] 2.4 Remove `role`/`permissions` from `TokenClaims`, `decode-token.ts` and their specs
- [x] 2.5 Remove the role badge from the header (html, scss, spec)

## 3. Seed data, mock API and login

- [x] 3.1 Reduce `public/mock/users.json` to the `admin` user without `roleId`; delete `public/mock/roles.json`; update `seed-data.spec.ts`
- [x] 3.2 Update `MockAuthService.localToken` to check the user only and issue a token without role claims; update its spec
- [x] 3.3 In `mock/server.mjs` remove `/api/roles`, the permission `403` checks and the role claims; keep login and the `401` without token
- [x] 3.4 List only `admin` on the login screen (`login-page.html`, scss if needed) and update `e2e/login.spec.ts`, `e2e/mock-api-auth.spec.ts`, `e2e/products.spec.ts`, `e2e/responsive.spec.ts` and `e2e/support/auth.ts` (no `escritura`/`lectura`, no 403 cases)
- [x] 3.5 Update `scripts/remove-mock-api.mjs` message (no roles)

## 4. Docs and wording

- [x] 4.1 Update `templates/backoffice/README.md`, `README.en.md` and `CLAUDE.md` (remove the Roles and permissions sections, role references, structure, mock API and demo mode descriptions)
- [x] 4.2 Update the root `README.md` and `cli/src/constants.js` (no roles, no `escritura`/`lectura`); adjust CLI tests if they assert the old text

## 5. Verify

- [x] 5.1 Grep `templates/backoffice` and `cli` for leftover `role`, `permission`, `escritura`, `lectura` references
- [x] 5.2 Typecheck, then run the affected unit specs and `npm run verify:quick`; run `npm run verify` before finishing
