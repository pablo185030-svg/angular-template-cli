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
- All code, comments and docs are written in English; user-visible UI text is in Spanish.

## Structure

```
src/app/
  core/
    auth/          AuthService contract, KeycloakAuthService, MockAuthService (demo, login form), models/ (claims), testing/FakeAuthService
    guards/        auth.guard.ts, login-page.guard.ts
    interceptors/  auth.interceptor.ts
    services/ models/
  shared/          layouts/main-layout (header with hamburger drawer, user + logout, page, footer), components/confirm-dialog, pages/not-found-page
  domains/
    home/ about/   example pages
    products/      CRUD example: models/, services/, pages/products-list-page, pages/product-form-page
    login/         login screen (demo mode)
  app.routes.ts    every route but /login sits behind authGuard
mock/server.mjs   in-memory API: /api/products, POST /api/auth/login; absent when generated with --no-mock-api
public/mock/   products.json, users.json: seeds shared by the mock API and the JSON services
scripts/          configure-keycloak, configure-theme, remove-mock-api
scripts/configure-keycloak.mjs   writes Keycloak settings into the environment files
README.md         user-facing docs in Spanish (default); README.en.md is the English copy. Keep both in sync with this file
```

Add a feature by creating `domains/<name>/` and a lazy route in `app.routes.ts`. Routes (URL paths) are in Spanish (`/acerca-de`, `/productos`, `/productos/nuevo`, `/productos/:id/editar`, `/login` too); folders, files and `data-testid`s stay in English, and so does the API (`/api/products`).

## Authentication (Keycloak)

The app signs users in with the Authorization Code flow and PKCE through `angular-oauth2-oidc`. `app.config.ts` runs `AuthService.init()` before the first navigation, so the Keycloak redirect back is handled before any route loads. `authGuard` sends unauthenticated users to the Keycloak login and returns them to the route they asked for. `authInterceptor` adds `Authorization: Bearer <token>` to requests whose URL is `apiBaseUrl` or below it, and to no other origin.

### Settings

Per environment, in `src/environments/environment*.ts`:

| Setting                  | Meaning                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| `auth.keycloak.url`      | Keycloak base URL, the part before `/realms`                     |
| `auth.keycloak.realm`    | Realm name                                                       |
| `auth.keycloak.clientId` | Client id (defaults to the project name)                         |
| `apiBaseUrl`             | API prefix that receives the access token (default `/api`)       |
| `api.mode`               | `'http'` (API) or `'json'` (sample JSON, changes in memory)      |
| `theme.darkMode`         | `true` shows a light/dark toggle (starts light); default `false` |

### Local realm setup

1. In the Keycloak admin console, create (or pick) a realm and set `auth.keycloak.realm`.
2. Create a client with the id in `auth.keycloak.clientId`: client authentication **off** (public client), standard flow **on**, PKCE method `S256`.
3. Valid redirect URIs: `http://localhost:4200/*`. Web origins: `http://localhost:4200`.
4. Create a user in the realm, set `auth.keycloak.url`, and run `npm start`.

### Demo mode (no Keycloak)

`environment.ts` ships with `auth.mode: 'mock'`: nobody is signed in at start, `authGuard` sends users to `/login` (outside the layout) and `MockAuthService.signIn()` checks the seeded users (only `admin`, password `1234`; see Roles below). The header shows a "Modo demo" badge, the user (initials avatar, name) and logout, so the app is usable without a Keycloak server. `environment.e2e.ts` is always `mock`, so `npm run test:e2e` needs no Keycloak. Never set `mock` in a deployed environment (`environment.prod.ts` is `keycloak`). Sign-in goes to `POST /api/auth/login` (unsigned JWT with `sub`, `name`, `exp`); with `api.mode: 'json'` it is checked in the browser against `public/mock/users.json`. The token lives in memory only, so a reload or logout returns to `/login`. Unit tests use `FakeAuthService` from `core/auth/testing/`. e2e specs sign in with `signIn()` from `e2e/support/auth.ts`: a page load drops the session, so navigate with in-app links after signing in.

### Connect Keycloak later

Run `npm run configure:keycloak` (asks for URL, realm and client id, or pass `--url --realm --client-id`). It writes the values into `environment.ts` and `environment.prod.ts` and switches `environment.ts` to `mode: 'keycloak'`. The project generator can do the same at creation time.

## Mock API and the CRUD example

`npm run mock:api` is a mock, not a real API: it serves `/api/products` from memory (data resets on restart), logs users in at `POST /api/auth/login`, and answers `401` to `/api/products` requests without an `Authorization: Bearer` header (the token is trusted, never verified, and no roles or permissions are checked; `/health` and the login stay open); `proxy.conf.json` forwards `/api` from the dev server to it. To use a real backend, point the proxy (dev) or the nginx `/api/` location (deployed) at it and delete `mock/` when no longer needed.

`ProductsService` is a contract; `environment.api.mode` picks `HttpProductsService` (`'http'`) or `JsonProductsService` (`'json'`: loads `public/mock/products.json`, create/update/delete live in browser memory). `npm run remove:mock-api` switches dev and e2e to `json` and deletes the mock server, the proxy and their config; production stays `http`.

## Roles

Roles are managed in Keycloak, not in the app: there is no roles ABM, role or permission model, or guard based on them, and any signed-in user can use every page and action. The only seeded user is `admin` (`admin@coto.com.ar`, employee number 1234, password `1234`, plain text, demo data only). Projects that need role-based access read the realm roles from the access token and add their own guards.

## Dark mode

The header shows the navigation and the user area (theme toggle, demo badge, user name, logout) inline from 768px (`tablet-portrait`); below it a hamburger `MenuToggle` opens a drawer that holds both. The `links` and `user` templates in `header.html` are rendered in both places; the drawer copies have a `drawer-` `data-testid` prefix. Keep new pages free of horizontal overflow at 320px (the products list turns its table into cards below 768px; follow that pattern for new tables).

`theme.darkMode` (default `false`) controls the header `ThemeToggle` and whether `CotoThemeService` is created in `App`; when false the app is always light. `npm run configure:theme -- --dark-mode|--no-dark-mode` flips it in every environment file.

## Deploy

`Dockerfile` serves the built static files with nginx using `nginx.conf` (SPA fallback to `index.html`, `/health` endpoint, gzip). Uncomment the `/api/` location there to proxy your backend.
