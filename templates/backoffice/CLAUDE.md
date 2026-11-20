# coto-angular-template (backoffice)

Private web app template: Angular 22 SPA, zoneless, styled with `@coto-dev/ui-kit`, authenticated with Keycloak, with a products CRUD (ABM) example.

## Commands

```bash
npm install            # needs access to the private registry (see .npmrc)
npm run mock:api       # mock products API on http://localhost:5000
npm start              # dev server on http://localhost:4200 (proxies /api to the mock)
npm run build          # production build in dist/
npm test               # unit tests (Vitest via @angular/build:unit-test)
npm run test:e2e       # Playwright e2e (starts the mock API and the app itself)
npm run lint           # ESLint
npm run format         # Prettier
```

Run a single unit spec with `npx ng test --watch=false --include "src/app/**/header.spec.ts"`.

## Stack and rules

- `@coto-dev/ui-kit` is installed from the private Nexus registry. `.npmrc` scopes `@coto-dev` to it, so the registry must be reachable from your network. Check `node_modules/@coto-dev/ui-kit/types/*.d.ts` before using a library component.
- All `@angular/*` packages are pinned to the same exact version (no `^`) and are upgraded together.
- Standalone components, `OnPush`, `inject()`, signals, `@if`/`@for` control flow. No NgModules, no Zone.js.
- Forms use Signal Forms (`@angular/forms/signals`); see `domains/products/pages/product-form-page/`.
- Styling: SCSS with BEM, `rem` for layout, mobile-first (`coto.breakpoint-up(...)`), colors only from `var(--mat-sys-*)`. Never define a color palette in this app.
- Files and folders are kebab-case. Types live in `models/` folders, not in component or service files.
- Unit tests next to the code (`*.spec.ts`). Select elements with `data-testid`, not CSS classes.
- All code, comments and docs are written in English.

## Structure

```
src/app/
  core/
    auth/          AuthService contract, KeycloakAuthService, MockAuthService (demo), testing/FakeAuthService
    guards/        auth.guard.ts
    interceptors/  auth.interceptor.ts
    services/ models/
  shared/          layouts/main-layout (header with user + logout, page, footer), components/confirm-dialog, pages/not-found-page
  domains/
    home/ about/   example pages
    products/      CRUD example: models/, services/, pages/products-list-page, pages/product-form-page
  app.routes.ts    every route sits behind authGuard
mock/server.mjs   in-memory products API (GET/POST/PUT/DELETE /api/products)
scripts/configure-keycloak.mjs   writes Keycloak settings into the environment files
README.md         user-facing docs (keep in sync with this file)
```

Add a feature by creating `domains/<name>/` and a lazy route in `app.routes.ts`.

## Authentication (Keycloak)

The app signs users in with the Authorization Code flow and PKCE through `angular-oauth2-oidc`. `app.config.ts` runs `AuthService.init()` before the first navigation, so the Keycloak redirect back is handled before any route loads. `authGuard` sends unauthenticated users to the Keycloak login and returns them to the route they asked for. `authInterceptor` adds `Authorization: Bearer <token>` to requests whose URL is `apiBaseUrl` or below it, and to no other origin.

### Settings

Per environment, in `src/environments/environment*.ts`:

| Setting                  | Meaning                                                  |
| ------------------------ | -------------------------------------------------------- |
| `auth.keycloak.url`      | Keycloak base URL, the part before `/realms`             |
| `auth.keycloak.realm`    | Realm name                                               |
| `auth.keycloak.clientId` | Client id (defaults to the project name)                 |
| `apiBaseUrl`             | API prefix that receives the access token (default `/api`) |

### Local realm setup

1. In the Keycloak admin console, create (or pick) a realm and set `auth.keycloak.realm`.
2. Create a client with the id in `auth.keycloak.clientId`: client authentication **off** (public client), standard flow **on**, PKCE method `S256`.
3. Valid redirect URIs: `http://localhost:4200/*`. Web origins: `http://localhost:4200`.
4. Create a user in the realm, set `auth.keycloak.url`, and run `npm start`.

### Demo mode (no Keycloak)

`environment.ts` ships with `auth.mode: 'mock'`: `MockAuthService` signs in a fake "Demo User", the header shows a "Demo mode" badge and hides logout, so the app is fully usable without a Keycloak server. `environment.e2e.ts` is always `mock`, so `npm run test:e2e` needs no Keycloak. Never set `mock` in a deployed environment (`environment.prod.ts` is `keycloak`). Unit tests use `FakeAuthService` from `core/auth/testing/`.

### Connect Keycloak later

Run `npm run configure:keycloak` (asks for URL, realm and client id, or pass `--url --realm --client-id`). It writes the values into `environment.ts` and `environment.prod.ts` and switches `environment.ts` to `mode: 'keycloak'`. The project generator can do the same at creation time.

## Mock API and the CRUD example

`npm run mock:api` serves `/api/products` from memory (data resets on restart); `proxy.conf.json` forwards `/api` from the dev server to it. To use a real backend, point the proxy (dev) or the nginx `/api/` location (deployed) at it and delete `mock/` when no longer needed.

## Deploy

`Dockerfile` serves the built static files with nginx using `nginx.conf` (SPA fallback to `index.html`, `/health` endpoint, gzip). Uncomment the `/api/` location there to proxy your backend.
