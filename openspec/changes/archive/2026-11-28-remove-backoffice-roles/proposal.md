# Proposal

## Why

In real deployments the backoffice authenticates against Keycloak, and roles are managed there, not in the Angular app. The template still ships its own roles ABM, role seeds and permission enforcement (`read`, `write`, `manage-roles`), which duplicates what Keycloak does and gives generated projects code they have to delete.

## What Changes

- **BREAKING**: remove the roles ABM (`/roles`, `/roles/nuevo`, `/roles/:id/editar`), the `roles` domain, the roles navigation link and the `RolesService` (HTTP and JSON implementations).
- **BREAKING**: remove in-app permission enforcement: the `permissionGuard`, `AuthService.permissions`/`hasPermission()`/`roleName`, the `Permission` model and its Spanish labels, the Keycloak role-to-permission mapping, and the hidden new/edit/delete actions in the products screens. Any signed-in user can use every page and action; authorization is the identity provider's and the real API's concern.
- Seed only the `admin` user (password `1234`, `@coto.com.ar` email, employee number `1234`) in `public/mock/users.json`; delete `public/mock/roles.json` and the `escritura` and `lectura` users.
- Drop the role badge from the header and the role/permissions claims from the demo token (it keeps the user name, subject and expiry).
- Mock API: remove `/api/roles`; keep the login endpoint (admin only) and the `401` without a Bearer token; remove the `403` permission checks.
- The login screen lists only the `admin` test user.
- Update the unit and e2e tests, the READMEs (Spanish and English), the template `CLAUDE.md` and the CLI wizard hint text that mention roles.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `backoffice-roles`: reduced to the seeded `admin` user and the rule that roles and permissions are managed outside the app; the roles ABM, role permissions, in-app enforcement and roles data source requirements are removed.
- `backoffice-template`: demo mode (admin-only users, no role badge), Spanish text (no roles screens) and the mock API token requirement (no roles endpoint, no permission `403`) are updated.

## Impact

- `templates/backoffice`: `src/app/domains/roles/`, `core/auth/` (services, models, fake, Keycloak mapping), `core/guards/permission.guard*`, `app.routes.ts`, `app.config.ts`, header, products pages, login page, `mock/server.mjs`, `public/mock/`, `scripts/remove-mock-api.mjs`, unit and e2e tests, READMEs, `CLAUDE.md`.
- `cli/src/constants.js` and the root `README.md`: wording that advertises roles and the `escritura`/`lectura` test users.
- Not affected: `templates/public`, the CLI logic, products CRUD behavior, Keycloak login flow.
