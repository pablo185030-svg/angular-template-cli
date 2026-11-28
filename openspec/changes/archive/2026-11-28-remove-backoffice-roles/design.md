# Design

## Context

The backoffice template has two parallel mechanisms: Keycloak login (real environments) and a demo mode with seeded users, a mock API and a JSON data source. Roles and permissions run through both: `AuthService` exposes `roleName`, `permissions` and `hasPermission()`, `permissionGuard` protects routes, the products list and form hide actions, the header shows a role badge and a roles link, the mock API issues tokens with `role`/`permissions` claims and answers `403`, and `KeycloakAuthService` maps realm roles named `admin`/`escritura`/`lectura` (or a `permissions` claim) to permissions. See proposal.md for why this goes away.

## Goals / Non-Goals

**Goals:**
- Leave no role or permission concept in the app: models, guards, services, UI, mock API, seeds, docs and tests.
- Keep sign-in, `authGuard`, the interceptor, demo mode and the products CRUD working as before for a signed-in user.

**Non-Goals:**
- No replacement authorization hook (for example a role claim helper). Projects add what their Keycloak realm needs.
- No change to the Keycloak login flow, the CLI logic or `templates/public`.

## Decisions

- **Remove enforcement, not only the ABM.** The permissions exist only to serve the in-app roles; with roles in Keycloak and no role names the app can rely on, keeping `read`/`write` checks would be an undocumented policy. All signed-in users get every action. Alternative considered: keep `permissionGuard` and the Keycloak mapping as an extension point; rejected because the project rule is templates stay simple with no policy tooling.
- **Keep the `backoffice-roles` capability** with a reduced scope (seeded admin user plus the "roles are managed outside the app" rule) instead of deleting it, so the seeded user and the decision stay documented and an empty spec is avoided. Renaming the capability is out of scope.
- **Demo token claims**: `sub`, `name`, `exp` only. `decodeToken`/`encodeToken` and `TokenClaims` drop `role` and `permissions`. `users.json` drops `roleId`; `roles.json` is deleted, and `MockAuthService.localToken` and the mock server no longer join users to roles.
- **Unknown routes**: with `/roles*` routes gone, `/roles` falls into the existing `**` not-found route; no redirect is added.
- **Mock API**: `/api/roles` is removed and falls through to the existing 404 handling; the `403` helper and `PERMISSIONS`/`ADMIN_ROLE` constants are deleted.
- **Docs**: Spanish README is updated first, then `README.en.md`, `CLAUDE.md`, the root `README.md` and the wizard hint in `cli/src/constants.js` (drop "roles").

## Risks / Trade-offs

- Generated projects lose the role-aware example; teams that want it must write guards against their Keycloak roles. Accepted: it matches how roles are really managed.
- Broad deletion touches many specs and e2e files; `npm run verify` (lint, tests, build, e2e, CLI tests) is the safety net.
- `keycloak-auth.service` tests that cover permission mapping are removed along with the code; sign-in/redirect coverage must remain.
