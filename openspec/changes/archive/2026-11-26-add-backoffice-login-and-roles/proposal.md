# Proposal

## Why

The backoffice is meant to be a private app, but in local development (demo mode) anyone is signed in automatically as a fake user, so there is no login screen to build on and nothing models who may do what. Teams generating a backoffice need a working login, a way to manage roles, and role-based access they can keep or replace when they connect a real identity provider.

## What Changes

- Demo mode (`auth.mode: 'mock'`) stops auto-signing in a fake user. Unauthenticated users are sent to a new Spanish login screen at `/login` (outside the main layout) and sign in with a username and password. The session lives in memory only, so a reload returns to the login.
- The mock API gets `POST /api/auth/login`, backed by seeded users. A seeded `admin` user (password `1234`, `admin@coto.com.ar`, first name, last name and employee number `1234`) lets a fresh project start. Two more seeded users (`escritura`, `lectura`, password `1234`) make the role effects easy to try.
- New roles ABM at `/roles` (list, create, edit, delete). Initial roles: `admin`, `escritura`, `lectura`. A role is a name, a description and a set of permissions (`read`, `write`, `manage-roles`). `admin` is protected (cannot be deleted or lose permissions). A role assigned to a user cannot be deleted.
- Roles are enforced: `lectura` sees products read-only, `escritura` can also create, edit and delete products, `admin` also manages roles. Enforcement is in route guards, the UI (buttons and navigation hidden) and the mock API (`403`).
- The header always shows the user's name and a logout button (also in demo mode), and a "Roles" link for users who can manage roles.
- The `AuthService` contract exposes the user's permissions. Keycloak mode keeps its own redirect login and derives permissions from the default role names in the token.
- **BREAKING** (mock only): `POST /api/auth/token` is replaced by `POST /api/auth/login`; demo mode no longer starts signed in; e2e tests must sign in first.

## Capabilities

### New Capabilities
- `backoffice-roles`: seeded users, role-based permissions and their enforcement, and the roles ABM.

### Modified Capabilities
- `backoffice-template`: the demo mode requirement (login screen instead of an automatic fake user), the mock API requirement (login endpoint, permission checks, roles endpoints) and the Spanish user-facing text requirement (login and roles screens).

## Impact

- `templates/backoffice`: `core/auth/*` (contract, mock and Keycloak services, fake), new guards, new `domains/login` and `domains/roles`, header, routes, products pages (permission gating), `mock/server.mjs`, `public/mock/roles.json` and `users.json`, e2e specs, `CLAUDE.md` and both READMEs.
- `openspec/specs/backoffice-template` (delta) and a new `backoffice-roles` spec.
- No new dependencies. No change to `cli/` or the public template.
- Out of scope: a users ABM, password reset or change, persisting the session or roles across reloads or restarts, token signing, and Keycloak-side role administration.
