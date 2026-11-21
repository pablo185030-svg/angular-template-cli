# coto-angular-template (public website)

Public website template: Angular 22, server-side rendered, zoneless, styled with `@coto-dev/ui-kit`.

## Commands

```bash
npm install            # needs access to the private registry (see .npmrc)
npm start              # dev server on http://localhost:4200
npm run build          # production build (browser + SSR server) in dist/
npm run serve:ssr      # run the built SSR server (PORT, default 4000)
npm test               # unit tests (Vitest via @angular/build:unit-test)
npm run test:e2e       # Playwright e2e (starts the dev server itself)
npm run lint           # ESLint
npm run format         # Prettier
```

Run a single unit spec with `npx ng test --watch=false --include "src/app/**/header.spec.ts"`.

## Stack and rules

- `@coto-dev/ui-kit` is installed from the private Nexus registry. `.npmrc` scopes `@coto-dev` to it, so the registry must be reachable from your network. Check `node_modules/@coto-dev/ui-kit/types/*.d.ts` before using a library component.
- All `@angular/*` packages are pinned to the same exact version (no `^`) and are upgraded together.
- Standalone components, `OnPush`, `inject()`, signals, `@if`/`@for` control flow. No NgModules, no Zone.js.
- Forms use Signal Forms (`@angular/forms/signals`).
- Styling: SCSS with BEM, `rem` for layout, mobile-first (`coto.breakpoint-up(...)`), colors only from `var(--mat-sys-*)`. Never define a color palette in this app.
- Files and folders are kebab-case. Types live in `models/` folders, not in component or service files.
- Unit tests next to the code (`*.spec.ts`). Select elements with `data-testid`, not CSS classes.
- All code, comments and docs are written in English; user-visible UI text is in Spanish.

## Structure

```
src/app/
  core/       app-wide singletons: guards/ interceptors/ services/ models/
  shared/     layouts/main-layout (header with hamburger drawer + routed page + footer), components/, pages/not-found-page
  domains/    one folder per feature area: home/, about/ (pages/<name>-page/)
  app.routes.ts          main layout with child routes '', 'acerca-de' and a not-found '**'
  app.routes.server.ts   SSR render mode per route
src/environments/        environment.ts (dev) and environment.prod.ts (SSR allowed hosts); both hold `theme.darkMode`
scripts/configure-theme.mjs  turns dark mode support on or off (`npm run configure:theme`)
scripts/configure-rendering.mjs  converts the SSR project to SSG or SPA (`npm run configure:rendering -- --mode ssg|spa`); one-way, SSR only
e2e/                     Playwright specs
```

Add a feature by creating `domains/<name>/pages/<name>-page/` and a lazy route in `app.routes.ts`. Routes (URL paths) are in Spanish (`/acerca-de`); folders, files and `data-testid`s stay in English.

`theme.darkMode` (default `false`): when true the header shows `ThemeToggle` and `App` creates the ui-kit `CotoThemeService` (starts light, persists the choice); when false the app is always light.

The header shows the navigation inline from 768px (`tablet-portrait`) and a hamburger `MenuToggle` plus a drawer below it (CSS decides which; `Header` only keeps the `menuOpen` signal and resets it when the viewport grows). Nav links are defined once in the `links` template of `header.html` and rendered in both places; the drawer copy has a `drawer-` `data-testid` prefix. Keep new pages free of horizontal overflow at 320px.

## SSR

The template ships as SSR; `scripts/configure-rendering.mjs` (run by the wizard, or by hand) converts a copy to SSG or SPA and rewrites `Dockerfile` and `nginx.conf` for static hosting. Keep the template itself SSR and keep the script's expectations (`outputMode: "server"`, `ssr.entry`, the server files) in sync with `angular.json` and the source files; `cli/test/configure-rendering.test.js` runs the script on the real template files and `npm run verify` builds both conversions.

`src/server.ts` is the Express entry point. `@angular/ssr` rejects unknown hosts: add the public hostname to `ssr.allowedHosts` in `src/environments/environment.prod.ts`. `README.md` has the user-facing docs (keep it in sync with this file). `Dockerfile` runs the built server; `nginx.conf` is an optional reverse proxy that serves static assets and forwards the rest to Node.
