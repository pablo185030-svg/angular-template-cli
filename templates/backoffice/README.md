## coto-angular-template

![Angular](https://img.shields.io/badge/Angular-22.1-DD0031?style=flat&logo=angular) ![Angular Material](https://img.shields.io/badge/Material-22.1-DD0031?style=flat&logo=angular) ![Material Design 3](https://img.shields.io/badge/Material_Design-3-757780?style=flat&logo=materialdesign) ![Keycloak](https://img.shields.io/badge/Keycloak-OIDC-4D4D4D?style=flat&logo=keycloak) ![Zoneless](https://img.shields.io/badge/Zoneless-enabled-DD0031?style=flat&logo=angular)

![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat&logo=typescript) ![Node](https://img.shields.io/badge/Node-24-339933?style=flat&logo=node.js) ![npm](https://img.shields.io/badge/npm-package_manager-CB3837?style=flat&logo=npm)

![Vitest](https://img.shields.io/badge/Vitest-4.0-6E9F18?style=flat&logo=vitest) ![Playwright](https://img.shields.io/badge/Playwright-1.61-2EAD33?style=flat&logo=playwright) ![ESLint](https://img.shields.io/badge/ESLint-enabled-4B32C3?style=flat&logo=eslint) ![Prettier](https://img.shields.io/badge/Prettier-enabled-F7B93E?style=flat&logo=prettier)

## Table of Contents

- [What is it?](#what-is-it)
- [Quick start](#quick-start)
- [Stack](#stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Dependencies](#dependencies)
- [Troubleshooting](#troubleshooting)
- [Main commands](#main-commands)
- [Environments](#environments)
- [Authentication (Keycloak)](#authentication)
- [Mock API and the CRUD example](#mock-api)
- [Dark mode](#dark-mode)
- [Project structure](#project-structure)
- [Path aliases](#path-aliases)
- [Breakpoints](#breakpoints)
- [Unit tests](#unit-tests)
- [E2E tests with Playwright](#e2e-tests-with-playwright)
- [Deploy](#deploy)

---

<a id="what-is-it"></a>

## What is it?

A backoffice (private web app) starter: an Angular 22 SPA (standalone components, signals, zoneless) with a main layout (header and footer), home and about pages, Keycloak authentication, and a products CRUD (ABM) example that runs against a mock API. It is meant to be copied, renamed and grown into a real app.

Theming and shared UI (M3 palette, typography, breakpoints, components) come from `@coto-dev/ui-kit`, an internal design-system library installed from the private Nexus registry — see [Dependencies](#dependencies).

**It runs without Keycloak.** Until you configure it, the app starts in **demo mode**: a fake signed-in user and a "Modo demo" badge in the header. See [Authentication](#authentication).

---

<a id="quick-start"></a>

## Quick start

```bash
nvm use              # Node 24
npm install
npm run mock:api     # terminal 1 — mock API on http://localhost:5000
npm start            # terminal 2 — app on http://localhost:4200
```

The app opens straight into the layout with a demo user. To sign in with real credentials, run `npm run configure:keycloak` — see [Authentication](#authentication).

---

<a id="stack"></a>

## Stack

| Layer           | Technology                                                 |
| --------------- | ---------------------------------------------------------- |
| Framework       | Angular 22 (standalone, signals, zoneless, OnPush)         |
| UI / Theming    | Angular Material 22 + `@coto-dev/ui-kit` (M3)              |
| Styles          | SCSS, BEM, mobile-first, CSS custom properties             |
| Authentication  | Keycloak (OIDC code flow + PKCE) via `angular-oauth2-oidc` |
| Forms           | Signal Forms (`@angular/forms/signals`)                    |
| Unit tests      | Vitest (via `@angular/build:unit-test`)                    |
| E2E tests       | Playwright                                                 |
| Package manager | npm                                                        |
| Node            | 24 (see `.nvmrc`)                                          |

---

<a id="requirements"></a>

## Requirements

- Node 24 (see `.nvmrc`; recommended: use `nvm` → `nvm use`).
- npm — ships bundled with Node.
- Network access to the private Nexus registry that serves `@coto-dev/ui-kit`.

---

<a id="installation"></a>

## Installation

```bash
nvm use
npm install
```

`prepare` installs the Husky pre-commit hook, which runs `lint-staged` (ESLint + Prettier on staged files). It needs the project to be a git repository.

---

<a id="dependencies"></a>

## Dependencies

The project commits a single lockfile, `package-lock.json`, so install with `npm ci` in CI.

### Why every Angular package is pinned to the same exact version

Every `@angular/*` entry in `package.json` is pinned to the same exact version (no `^`). Angular's packages declare exact peer dependencies on each other, so they must move together; a mix of pinned and ranged entries fails with `ERESOLVE` the next time the tree is resolved after Angular publishes a patch. To upgrade, change the version on every `@angular/*` entry at once and run `npm install`. Don't use an `overrides` block for them.

### `@coto-dev/ui-kit`: installed from the private Nexus registry

- `.npmrc` scopes `@coto-dev` to the private registry, so the registry must be reachable from your network when you run `npm install`. It contains no credentials.
- To bump the library, edit its range in `package.json` and run `npm install`. Don't consume it as a git dependency or a local tarball.
- Before using one of its components, check its API in `node_modules/@coto-dev/ui-kit/types/*.d.ts`.
- The app never defines its own color palette: `src/styles.scss` calls `coto.theme()` once and everything reads `var(--mat-sys-*)`.

---

<a id="troubleshooting"></a>

## Troubleshooting

| Symptom                                              | Likely cause and fix                                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `npm install` cannot resolve `@coto-dev/ui-kit`      | The Nexus registry is unreachable (VPN / corporate network). Check `.npmrc` and your connection.                |
| `ERESOLVE` after changing Angular versions           | Some `@angular/*` entry has a different version or a `^`. Pin them all to the same exact version.               |
| `NG0203` / injection errors in unit tests            | A second copy of `@angular/*` was resolved. `vitest.config.ts` already dedupes them; reinstall `node_modules`.  |
| The page is blank after `npm run configure:keycloak` | The Keycloak URL, realm or client id is wrong or unreachable. Check the browser console and re-run the command. |

---

<a id="main-commands"></a>

## Main commands

| Command                      | Description                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| `npm start`                  | Dev server at `http://localhost:4200` with hot reload (proxies `/api` to the mock API) |
| `npm run mock:api`           | Mock products API on `http://localhost:5000` — see [Mock API](#mock-api)               |
| `npm run configure:keycloak` | Sets your Keycloak settings and switches local development to Keycloak                 |
| `npm run configure:theme`    | `-- --dark-mode` or `-- --no-dark-mode`: turns the light/dark toggle on or off         |
| `npm run remove:mock-api`    | Removes the mock API and switches the ABM to the JSON data source (see Mock API)       |
| `npm run build`              | Production build to `dist/`                                                            |
| `npm run build:dev`          | Development build                                                                      |
| `npm run watch`              | Incremental build in development mode                                                  |
| `npm test`                   | Unit tests with Vitest (watch mode)                                                    |
| `npm run lint`               | ESLint (`angular-eslint`) on `.ts` and `.html` under `src/`                            |
| `npm run format`             | Prettier on `src/` and `e2e/`                                                          |
| `npm run test:e2e`           | Playwright e2e; starts the mock API and the app (`e2e` configuration) automatically    |
| `npm run start:e2e`          | Dev server with the `e2e` configuration (demo auth) — used by Playwright               |

Run one unit spec: `npx ng test --watch=false --include "src/app/**/header.spec.ts"`.

---

<a id="environments"></a>

## Environments

| File                                   | Used by                          | `auth.mode`                                                 |
| -------------------------------------- | -------------------------------- | ----------------------------------------------------------- |
| `src/environments/environment.ts`      | `npm start`, `npm run build:dev` | `mock` (demo) until you configure Keycloak, then `keycloak` |
| `src/environments/environment.prod.ts` | `npm run build` (production)     | `keycloak`                                                  |
| `src/environments/environment.e2e.ts`  | `npm run start:e2e`, Playwright  | `mock`, always                                              |

`apiBaseUrl` (default `/api`) is the prefix that receives the access token; see [Authentication](#authentication).

Two more settings live in every environment file: `api.mode` (`http` or `json`, see [Mock API](#mock-api)) and `theme.darkMode` (see [Dark mode](#dark-mode)).

---

<a id="authentication"></a>

## Authentication (Keycloak)

The app signs users in with the OIDC Authorization Code flow and PKCE (`angular-oauth2-oidc`). `authGuard` protects every route: an unauthenticated user is sent to the Keycloak login and returns to the page they asked for. `authInterceptor` adds `Authorization: Bearer <token>` to requests whose URL is `apiBaseUrl` or below it, and to no other origin.

### Demo mode (default)

With `auth.mode: 'mock'`, `MockAuthService` signs in a fake "Usuario demo", so you can see and work on the whole app without a Keycloak server. The header shows a **Modo demo** badge and hides the logout button. **Never use `mock` in a deployed environment.**

### Connect Keycloak

You need three values from your Keycloak admin:

| Setting   | Meaning                                      | Example                          |
| --------- | -------------------------------------------- | -------------------------------- |
| URL       | Keycloak base URL, the part before `/realms` | `https://keycloak.mycompany.com` |
| Realm     | Realm name                                   | `my-realm`                       |
| Client id | Client id (defaults to the project name)     | `coto-angular-template`          |

The project generator can set them for you. Later, run:

```bash
npm run configure:keycloak                      # asks for each value
npm run configure:keycloak -- --url https://keycloak.mycompany.com --realm my-realm --client-id my-app
```

This writes the values into `src/environments/environment.ts` and `environment.prod.ts` and switches local development to `auth.mode: 'keycloak'`. You can also edit those files by hand. To go back to demo mode, set `mode: 'mock'` in `environment.ts`.

### Keycloak client setup

1. In the Keycloak admin console, create (or pick) a realm.
2. Create a client with the id above: client authentication **off** (public client), standard flow **on**, PKCE method `S256`.
3. Valid redirect URIs: `http://localhost:4200/*`. Web origins: `http://localhost:4200`.
4. Create a user in the realm and run `npm start`.

Before deploying, add your production URL to the client's redirect URIs and web origins.

### Tests

Unit tests use `FakeAuthService` from `src/app/core/auth/testing/`. The `e2e` build configuration always uses the demo user, so `npm run test:e2e` needs no Keycloak.

---

<a id="mock-api"></a>

## Mock API and the CRUD example

`npm run mock:api` starts a **mock**, not a real API: a small server (`mock/server.mjs`) that simulates the products API with sample data, so the ABM works without a backend. It serves an in-memory products API on `http://localhost:5000`; data resets on restart. In development, `proxy.conf.json` forwards `/api` from the dev server to it.

| Method   | Path                | Description |
| -------- | ------------------- | ----------- |
| `GET`    | `/api/products`     | List        |
| `GET`    | `/api/products/:id` | Get one     |
| `POST`   | `/api/products`     | Create      |
| `PUT`    | `/api/products/:id` | Update      |
| `DELETE` | `/api/products/:id` | Delete      |

The example UI lives in `src/app/domains/products/`: a list (`mat-table`), a create/edit form built with Signal Forms, and a delete confirmation dialog. To use a real backend, point `proxy.conf.json` (development) and the `/api/` location in `nginx.conf` (deployed) at it, then delete `mock/`.

### Without the mock API (JSON data source)

`api.mode` in `src/environments/environment*.ts` chooses where the products come from:

- `'http'` (default): `HttpProductsService` calls `/api/products` (the mock API in development, your backend later).
- `'json'`: `JsonProductsService` loads `public/mock/products.json` once and applies create, edit and delete **in browser memory**: no server is needed, and changes are lost when the page is reloaded.

`npm run remove:mock-api` (also run by the project wizard when you decline the mock API) sets `json` in `environment.ts` and `environment.e2e.ts`, deletes `mock/`, the dev proxy and the `mock:api` script, and removes the mock server from `playwright.config.ts`. The production environment stays on `http`: it expects a real backend behind `/api`. The sample products in `public/mock/products.json` are shared by both modes.

<a id="dark-mode"></a>

## Dark mode

`theme.darkMode` in `src/environments/environment*.ts` is `false` by default: the app is always light and shows no toggle. Set it to `true` (or run `npm run configure:theme -- --dark-mode`) to show a light/dark toggle in the header. The app starts in light mode and the ui-kit's `CotoThemeService` remembers the user's choice. The dark styles are included either way (`coto.dark-theme()` in `src/styles.scss`); they only apply when the `coto-dark-theme` class is set.

---

<a id="project-structure"></a>

## Project structure

```
src/app/
  core/
    auth/          AuthService contract, KeycloakAuthService, MockAuthService, testing/FakeAuthService
    guards/        auth.guard.ts
    interceptors/  auth.interceptor.ts
    services/ models/
  shared/
    layouts/main-layout/        header (user, logout, demo badge, theme toggle) + routed page + footer
    components/confirm-dialog/
    pages/not-found-page/
  domains/
    home/ about/                example pages
    products/                   CRUD example: models/ services/ (http + json) pages/
  app.routes.ts                 every route sits behind authGuard
src/environments/               environment.ts, environment.prod.ts, environment.e2e.ts
mock/server.mjs                 in-memory products API (removed without the mock API)
public/mock/products.json       sample products shared by the mock API and the JSON data source
scripts/configure-keycloak.mjs  writes Keycloak settings into the environment files
scripts/configure-theme.mjs     turns dark mode support on or off
scripts/remove-mock-api.mjs     removes the mock API and switches to the JSON data source
e2e/                            Playwright specs
```

To add a feature, create `domains/<name>/` and a lazy route in `app.routes.ts`. Files and folders are kebab-case; types live in `models/` folders.

---

<a id="path-aliases"></a>

## Path aliases

`tsconfig.json` defines path aliases so imports don't depend on long relative paths:

| Alias        | Path                 | Example                                                                 |
| ------------ | -------------------- | ----------------------------------------------------------------------- |
| `@app/*`     | `src/app/*`          | `import { routes } from '@app/app.routes';`                             |
| `@core/*`    | `src/app/core/*`     | `import { authGuard } from '@core/guards/auth.guard';`                  |
| `@shared/*`  | `src/app/shared/*`   | `import { MainLayout } from '@shared/layouts/main-layout/main-layout';` |
| `@domains/*` | `src/app/domains/*`  | `import { HomePage } from '@domains/home/pages/home-page/home-page';`   |
| `@env/*`     | `src/environments/*` | `import { environment } from '@env/environment';`                       |

They work in the dev server, the build and the unit tests with no extra configuration.

---

<a id="breakpoints"></a>

## Breakpoints

Breakpoints come from `@coto-dev/ui-kit`, so SCSS and TypeScript share the same thresholds. The design system is **mobile-first**: write base styles for the smallest screen and layer overrides upward.

| Breakpoint name    | Min width |
| ------------------ | --------- |
| `mobile`           | 320px     |
| `tablet-portrait`  | 768px     |
| `tablet-landscape` | 1024px    |
| `desktop-small`    | 1366px    |
| `desktop-large`    | 1920px    |

```scss
@use '@coto-dev/ui-kit/styles' as coto;

.card {
  padding: 1rem; // mobile (base, no query)

  @include coto.breakpoint-up(tablet-landscape) {
    padding: 2rem;
  }
}
```

From TypeScript use the `COTO_BREAKPOINTS` constant (e.g. with `BreakpointObserver`).

---

<a id="unit-tests"></a>

## Unit tests

Vitest through Angular's `@angular/build:unit-test` builder. Specs live next to the code as `*.spec.ts` and need no registration. Select elements with `data-testid`, not CSS classes. Run everything with `npm test`, or one spec with `--include` (see [Main commands](#main-commands)).

---

<a id="e2e-tests-with-playwright"></a>

## E2E tests with Playwright

```bash
npx playwright install chromium   # first time only
npm run test:e2e
```

Playwright starts the mock API and the app with the `e2e` configuration (demo user, no Keycloak). Prefer accessible locators (`getByRole`, `getByLabel`), then `getByTestId`. `e2e/products.spec.ts` covers list, create, edit and delete, plus form validation. The mock keeps state in memory, so specs run one at a time.

---

<a id="deploy"></a>

## Deploy

- `Dockerfile` serves the built static files with nginx using `nginx.conf` (`npm run build` first): `docker build -t coto-angular-template . && docker run -p 8080:80 coto-angular-template`.
- `nginx.conf` falls back to `index.html` for every route (single-page app), answers `/health`, and enables gzip. Uncomment its `/api/` location and point it at your backend.
- Set the real Keycloak values in `src/environments/environment.prod.ts` before building.
