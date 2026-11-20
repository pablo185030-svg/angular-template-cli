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
- All code, comments and docs are written in English.

## Structure

```
src/app/
  core/       app-wide singletons: guards/ interceptors/ services/ models/
  shared/     layouts/main-layout (header + routed page + footer), components/, pages/not-found-page
  domains/    one folder per feature area: home/, about/ (pages/<name>-page/)
  app.routes.ts          main layout with child routes '', 'about' and a not-found '**'
  app.routes.server.ts   SSR render mode per route
src/environments/        environment.ts (dev) and environment.prod.ts (SSR allowed hosts)
e2e/                     Playwright specs
```

Add a feature by creating `domains/<name>/pages/<name>-page/` and a lazy route in `app.routes.ts`.

## SSR

`src/server.ts` is the Express entry point. `@angular/ssr` rejects unknown hosts: add the public hostname to `ssr.allowedHosts` in `src/environments/environment.prod.ts`. `README.md` has the user-facing docs (keep it in sync with this file). `Dockerfile` runs the built server; `nginx.conf` is an optional reverse proxy that serves static assets and forwards the rest to Node.
